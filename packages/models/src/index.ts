import { Schema, type, MapSchema } from "@colyseus/schema";
import type { PlayerStatus } from "./types";

// Re-export shared types (no decorators, safe for frontend)
export type { PlayerStatus, PlayerData } from "./types";
export { TOTAL_AVATARS } from "./types";

export class Player extends Schema {
  @type("string") id: string = "";
  @type("string") name: string = "";
  @type("string") vote: string = "";
  @type("uint8") avatar: number = 0;
  @type("string") status: PlayerStatus = "idle";
  @type("number") disconnectedAt: number = 0; // Timestamp when disconnected (0 = not disconnected)
}

export class ScrumRoomState extends Schema {
  @type({ map: Player }) players = new MapSchema<Player>();
  @type("boolean") revealed: boolean = false;
}
