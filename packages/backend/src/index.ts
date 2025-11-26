import { Server } from "@colyseus/core";
import { BunWebSockets } from "@colyseus/bun-websockets";
import { ScrumRoom } from "./rooms/ScrumRoom";

const port = Number(process.env.PORT) || 7001;

const server = new Server({
  transport: new BunWebSockets({
    pingInterval: 1500,      // Ping every 1.5 seconds
    pingMaxRetries: 1,       // 1 missed ping = disconnect (~3s total)
  }),
});

server.define("scrum", ScrumRoom).filterBy(['roomName']);

server.listen(port).then(() => {
  console.log(`[Backend] Colyseus server listening on ws://localhost:${port}`);
});
