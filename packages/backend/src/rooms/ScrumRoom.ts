import { Room, Client } from "@colyseus/core";
import { ScrumRoomState, Player, TOTAL_AVATARS, type PlayerStatus } from "@scrumkit/models";

// Emoji to status mapping for receiver
const EMOJI_STATUS_RECEIVER: Record<string, PlayerStatus> = {
  '❤️': 'loved',
  '👍': 'praised',
  '🔥': 'fire',
  '🎉': 'celebrated',
  '💩': 'pooped',
  '👎': 'booed',
};

// Emoji to status mapping for sender
const EMOJI_STATUS_SENDER: Record<string, PlayerStatus> = {
  '❤️': 'loving',
  '👍': 'praising',
  '🔥': 'hyping',
  '🎉': 'partying',
  '💩': 'mischievous',
  '👎': 'judging',
};

const STATUS_DURATION = 4000; // Status lasts 4 seconds

export class ScrumRoom extends Room<ScrumRoomState> {
  maxClients = 20;
  private statusTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private previousStatus = new Map<string, PlayerStatus>();

  onCreate(options: { roomName?: string }) {
    this.setState(new ScrumRoomState());

    this.onMessage("vote", (client, vote: string) => {
      const player = this.state.players.get(client.sessionId);
      if (player && !this.state.revealed) {
        player.vote = player.vote === vote ? "" : vote;
        // Auto-set status to ready when voted, idle when unvoted
        player.status = player.vote ? "ready" : "idle";
        this.previousStatus.set(client.sessionId, player.status);
      }
    });

    this.onMessage("status", (client, status: PlayerStatus) => {
      const player = this.state.players.get(client.sessionId);
      if (player) {
        player.status = status;
        this.previousStatus.set(client.sessionId, status);
      }
    });

    this.onMessage("reveal", (client) => {
      this.state.revealed = true;
    });

    this.onMessage("reset", (client) => {
      this.state.revealed = false;
      this.state.players.forEach((player) => {
        player.vote = "";
        // Don't reset disconnected players' status
        if (player.status !== 'disconnected') {
          player.status = "idle";
        }
      });
      this.previousStatus.clear();
    });

    // Emoji throwing - update sender and target with different statuses
    this.onMessage("throwEmoji", (client, data: { targetId: string; emoji: string }) => {
      // Broadcast for animation
      this.broadcast("emojiThrown", {
        fromId: client.sessionId,
        toId: data.targetId,
        emoji: data.emoji,
      });

      const senderStatus = EMOJI_STATUS_SENDER[data.emoji];
      const receiverStatus = EMOJI_STATUS_RECEIVER[data.emoji];
      if (!senderStatus || !receiverStatus) return;

      // Update sender
      this.setEmojiStatus(client.sessionId, senderStatus);
      // Update receiver
      this.setEmojiStatus(data.targetId, receiverStatus);
    });
  }

  private setEmojiStatus(playerId: string, newStatus: PlayerStatus) {
    const player = this.state.players.get(playerId);
    if (!player) return;

    // Don't update status of disconnected players
    if (player.status === 'disconnected') return;

    // Save previous status if not already in emoji reaction
    if (!this.isEmojiStatus(player.status)) {
      this.previousStatus.set(playerId, player.status);
    }

    // Set new status
    player.status = newStatus;

    // Clear existing timer
    const existingTimer = this.statusTimers.get(playerId);
    if (existingTimer) clearTimeout(existingTimer);

    // Reset status after duration
    const timer = setTimeout(() => {
      const p = this.state.players.get(playerId);
      if (p && this.isEmojiStatus(p.status)) {
        p.status = this.previousStatus.get(playerId) || "idle";
      }
      this.statusTimers.delete(playerId);
    }, STATUS_DURATION);

    this.statusTimers.set(playerId, timer);
  }

  private isEmojiStatus(status: PlayerStatus): boolean {
    return [
      'loved', 'praised', 'fire', 'celebrated', 'pooped', 'booed',
      'loving', 'praising', 'hyping', 'partying', 'mischievous', 'judging'
    ].includes(status);
  }

  onJoin(client: Client, options: { name: string; avatar?: number }) {
    const player = new Player();
    player.id = client.sessionId;
    player.name = options.name || "Anonymous";
    player.avatar = options.avatar ?? Math.floor(Math.random() * TOTAL_AVATARS);
    this.state.players.set(client.sessionId, player);

    console.log(`${player.name} joined [${client.sessionId}]`);
  }

  async onLeave(client: Client, consented: boolean) {
    const player = this.state.players.get(client.sessionId);
    if (!player) return;

    // If user intentionally left, remove immediately
    if (consented) {
      console.log(`${player.name} left [${client.sessionId}]`);
      this.removePlayer(client.sessionId);
      return;
    }

    // Unexpected disconnect (mobile background, network issue)
    // Keep seat for 60 seconds to allow reconnection
    console.log(`${player.name} disconnected, waiting for reconnect [${client.sessionId}]`);

    // Save current status (if in emoji reaction, use pre-emoji status)
    let statusToRestore = player.status;
    if (this.isEmojiStatus(statusToRestore)) {
      statusToRestore = this.previousStatus.get(client.sessionId) || 'idle';
    }

    // Clear any pending emoji timer
    const emojiTimer = this.statusTimers.get(client.sessionId);
    if (emojiTimer) {
      clearTimeout(emojiTimer);
      this.statusTimers.delete(client.sessionId);
    }

    player.status = 'disconnected';
    player.disconnectedAt = Date.now();

    try {
      await this.allowReconnection(client, 30);
      // Restore previous status on reconnect
      player.status = statusToRestore;
      player.disconnectedAt = 0;
      console.log(`${player.name} reconnected [${client.sessionId}]`);
    } catch {
      // Timeout - player didn't reconnect
      console.log(`${player.name} reconnect timeout [${client.sessionId}]`);
      this.removePlayer(client.sessionId);
    }
  }

  private removePlayer(sessionId: string) {
    this.state.players.delete(sessionId);

    // Clean up timers
    const timer = this.statusTimers.get(sessionId);
    if (timer) clearTimeout(timer);
    this.statusTimers.delete(sessionId);
    this.previousStatus.delete(sessionId);
  }

  onDispose() {
    // Clear all timers
    this.statusTimers.forEach(timer => clearTimeout(timer));
    this.statusTimers.clear();
    console.log("Room disposed");
  }
}
