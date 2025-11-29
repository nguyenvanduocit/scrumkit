import { Room, Client } from "@colyseus/core";
import { RetroRoomState, Player, Column, Item, TOTAL_AVATARS, type PlayerStatus } from "@scrumkit/models";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";

// Saved data structure (columns + items only, players are transient)
interface SavedItem {
  id: string;
  content: string;
  authorName: string; // Name is the identity
  createdAt: number;
}

interface SavedColumn {
  id: string;
  title: string;
  order: number;
  items: Record<string, SavedItem>;
}

interface SavedRetroData {
  roomId: string;
  columns: Record<string, SavedColumn>;
  savedAt: number;
}

const DATA_DIR = join(import.meta.dir, "../../data/retro");

export class RetroRoom extends Room<RetroRoomState> {
  maxClients = 20;
  private saveTimeout: Timer | null = null;

  async onCreate(options: { roomName?: string }) {
    this.setState(new RetroRoomState());

    // Try to load existing data
    await this.loadFromFile();

    // Initialize default columns only if no saved data loaded
    if (this.state.columns.size === 0) {
      const defaultColumns = [
        { id: "went-well", title: "What went well", order: 0 },
        { id: "improve", title: "What could improve", order: 1 },
        { id: "actions", title: "Action items", order: 2 },
      ];

      for (const col of defaultColumns) {
        const column = new Column();
        column.id = col.id;
        column.title = col.title;
        column.order = col.order;
        this.state.columns.set(col.id, column);
      }
    }

    // Message handlers
    this.onMessage("status", (client, status: PlayerStatus) => {
      const player = this.state.players.get(client.sessionId);
      if (player) {
        player.status = status;
      }
    });

    this.onMessage("addItem", (client, data: { columnId: string; content: string }) => {
      const column = this.state.columns.get(data.columnId);
      const player = this.state.players.get(client.sessionId);
      if (!column || !player) return;

      const content = data.content?.trim();
      if (!content || content.length > 500) return;

      const item = new Item();
      item.id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      item.content = content;
      item.authorId = player.name; // Name is the identity
      item.authorName = player.name;
      item.createdAt = Date.now();

      column.items.set(item.id, item);
      this.scheduleSave();
    });

    this.onMessage("editItem", (client, data: { columnId: string; itemId: string; content: string }) => {
      const column = this.state.columns.get(data.columnId);
      const player = this.state.players.get(client.sessionId);
      if (!column || !player) return;

      const item = column.items.get(data.itemId);
      if (!item) return;

      // Owner-only validation (name is identity)
      if (item.authorId !== player.name) return;

      const content = data.content?.trim();
      if (!content || content.length > 500) return;

      item.content = content;
      this.scheduleSave();
    });

    this.onMessage("deleteItem", (client, data: { columnId: string; itemId: string }) => {
      const column = this.state.columns.get(data.columnId);
      const player = this.state.players.get(client.sessionId);
      if (!column || !player) return;

      const item = column.items.get(data.itemId);
      if (!item) return;

      // Owner-only validation (name is identity)
      if (item.authorId !== player.name) return;

      column.items.delete(data.itemId);
      this.scheduleSave();
    });
  }

  onJoin(client: Client, options: { name: string; avatar?: number }) {
    const playerName = (options.name || "Anonymous").trim();

    // Remove any existing player with same name (handles all reconnection scenarios)
    for (const [sessionId, existingPlayer] of this.state.players) {
      if (existingPlayer.name === playerName && sessionId !== client.sessionId) {
        console.log(`[Retro] Replacing session for ${playerName} [${sessionId} -> ${client.sessionId}]`);
        this.state.players.delete(sessionId);
      }
    }

    const player = new Player();
    player.id = client.sessionId;
    player.name = playerName;
    player.avatar = options.avatar ?? Math.floor(Math.random() * TOTAL_AVATARS);
    this.state.players.set(client.sessionId, player);

    console.log(`[Retro] ${playerName} joined [${client.sessionId}]`);
  }

  async onLeave(client: Client, consented: boolean) {
    const player = this.state.players.get(client.sessionId);
    if (!player) return;

    // Always remove immediately - name-based identity handles reconnection
    console.log(`[Retro] ${player.name} left [${client.sessionId}]`);
    this.state.players.delete(client.sessionId);
  }

  async onDispose() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    await this.saveToFile();
    console.log("[Retro] Room disposed");
  }

  private scheduleSave() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.saveTimeout = setTimeout(() => this.saveToFile(), 2000);
  }

  private getFilePath(): string {
    return join(DATA_DIR, `${this.roomId}.json`);
  }

  private async loadFromFile(): Promise<void> {
    try {
      const file = Bun.file(this.getFilePath());
      if (!await file.exists()) return;

      const data: SavedRetroData = await file.json();

      for (const [colId, savedCol] of Object.entries(data.columns)) {
        const column = new Column();
        column.id = savedCol.id;
        column.title = savedCol.title;
        column.order = savedCol.order;

        for (const [itemId, savedItem] of Object.entries(savedCol.items)) {
          const item = new Item();
          item.id = savedItem.id;
          item.content = savedItem.content;
          item.authorId = savedItem.authorName; // Name is identity
          item.authorName = savedItem.authorName;
          item.createdAt = savedItem.createdAt;
          column.items.set(itemId, item);
        }

        this.state.columns.set(colId, column);
      }

      console.log(`[Retro] Loaded ${Object.keys(data.columns).length} columns from file`);
    } catch (err) {
      console.error("[Retro] Failed to load from file:", err);
    }
  }

  private async saveToFile(): Promise<void> {
    try {
      await mkdir(DATA_DIR, { recursive: true });

      const data: SavedRetroData = {
        roomId: this.roomId,
        columns: {},
        savedAt: Date.now(),
      };

      for (const [colId, column] of this.state.columns) {
        const savedCol: SavedColumn = {
          id: column.id,
          title: column.title,
          order: column.order,
          items: {},
        };

        for (const [itemId, item] of column.items) {
          savedCol.items[itemId] = {
            id: item.id,
            content: item.content,
            authorName: item.authorName,
            createdAt: item.createdAt,
          };
        }

        data.columns[colId] = savedCol;
      }

      await Bun.write(this.getFilePath(), JSON.stringify(data, null, 2));
      console.log(`[Retro] Saved to file: ${this.roomId}`);
    } catch (err) {
      console.error("[Retro] Failed to save to file:", err);
    }
  }
}
