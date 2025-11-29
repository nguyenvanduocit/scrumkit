import { Schema, type, MapSchema } from "@colyseus/schema";
import type { PlayerStatus } from "./types";

// Re-export shared types (no decorators, safe for frontend)
export type { PlayerStatus, PlayerData, ItemData, ColumnData } from "./types";
export { TOTAL_AVATARS } from "./types";

export class Player extends Schema {
  @type("string") id: string = "";
  @type("string") name: string = "";
  @type("string") vote: string = "";
  @type("uint8") avatar: number = 0;
  @type("string") status: PlayerStatus = "idle";
}

export class ScrumRoomState extends Schema {
  @type({ map: Player }) players = new MapSchema<Player>();
  @type("boolean") revealed: boolean = false;
}

// Retro Room schemas
export class Item extends Schema {
  @type("string") id: string = "";
  @type("string") content: string = "";
  @type("string") authorId: string = "";
  @type("string") authorName: string = "";
  @type("number") createdAt: number = 0;
}

export class Column extends Schema {
  @type("string") id: string = "";
  @type("string") title: string = "";
  @type("number") order: number = 0;
  @type({ map: Item }) items = new MapSchema<Item>();
}

export class RetroRoomState extends Schema {
  @type({ map: Player }) players = new MapSchema<Player>();
  @type({ map: Column }) columns = new MapSchema<Column>();
}
