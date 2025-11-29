// Shared types for frontend and backend
// This file contains no decorators, safe to import from frontend

// Player activity status - determined by client behavior
// idle: default state
// deciding: hovering over cards
// confused: changing vote frequently
// sleeping: no activity for a while
// ready: has voted and waiting
// Emoji reaction statuses (receiver):
// loved: received ❤️
// praised: received 👍
// fire: received 🔥
// celebrated: received 🎉
// pooped: received 💩
// booed: received 👎
// Emoji reaction statuses (sender):
// loving: sent ❤️
// praising: sent 👍
// hyping: sent 🔥
// partying: sent 🎉
// mischievous: sent 💩
// judging: sent 👎
export type PlayerStatus =
  | "idle" | "deciding" | "confused" | "sleeping" | "ready" | "disconnected"
  | "loved" | "praised" | "fire" | "celebrated" | "pooped" | "booed"
  | "loving" | "praising" | "hyping" | "partying" | "mischievous" | "judging";

// Total avatar count (0 to TOTAL_AVATARS-1)
export const TOTAL_AVATARS = 141;

// Plain interface for frontend use
export interface PlayerData {
  id: string;
  name: string;
  vote: string;
  avatar: number;
  status: PlayerStatus;
}

// Retro room types
export interface ItemData {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: number;
}

export interface ColumnData {
  id: string;
  title: string;
  order: number;
  items: Map<string, ItemData>;
}
