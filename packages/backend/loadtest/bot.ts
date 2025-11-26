import { Client, Room, getStateCallbacks } from "colyseus.js";
import { cli, Options } from "@colyseus/loadtest";

const VOTE_OPTIONS = ["1", "2", "3", "5", "8", "13", "21", "?", "☕"];
const EMOJIS = ["❤️", "👍", "🔥", "🎉", "💩", "👎"];
const NAMES = ["Alice", "Bob", "Charlie", "Diana", "Eve", "Frank", "Grace", "Henry", "Ivy", "Jack"];

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function main(options: Options) {
  const client = new Client(options.endpoint);
  const roomName = `loadtest-${Math.floor(Math.random() * 5)}`;

  const room: Room = await client.joinOrCreate(options.roomName, {
    roomName,
    name: randomChoice(NAMES) + options.clientId,
    avatar: Math.floor(Math.random() * 141),
  });

  console.log(`[${options.clientId}] Joined ${roomName}`);

  const otherPlayers: string[] = [];
  const $ = getStateCallbacks(room);

  room.onStateChange.once(() => {
    const state = room.state as any;

    $(state).players.onAdd((_player: any, sessionId: string) => {
      if (sessionId !== room.sessionId) {
        otherPlayers.push(sessionId);
      }
    });

    $(state).players.onRemove((_player: any, sessionId: string) => {
      const idx = otherPlayers.indexOf(sessionId);
      if (idx !== -1) otherPlayers.splice(idx, 1);
    });
  });

  room.onError((err) => {
    console.error(`[${options.clientId}] ERROR:`, err.message);
  });

  room.onLeave((code) => {
    console.log(`[${options.clientId}] Left with code ${code}`);
  });

  // Simulate player behavior with setInterval (non-blocking)
  setInterval(() => {
    const action = Math.random();

    if (action < 0.5) {
      room.send("vote", randomChoice(VOTE_OPTIONS));
    } else if (action < 0.7 && otherPlayers.length > 0) {
      room.send("throwEmoji", { targetId: randomChoice(otherPlayers), emoji: randomChoice(EMOJIS) });
    } else if (action < 0.85) {
      room.send("reveal");
    } else {
      room.send("reset");
    }
  }, 1000 + Math.random() * 2000);
}

cli(main);
