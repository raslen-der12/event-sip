// src/services/actorsSocket.js
import { io } from "socket.io-client";

const API_URL = process.env.REACT_REACT_APP_API_URL || process.env.REACT_APP_API_URL;
const SOCKET_PATH = process.env.REACT_APP_SOCKET_PATH || "/socket.io";

class ActorsSocket {
  constructor() {
    this.socket = null;
    this.debug = false;
    this.store = null; // kept only for backward-compat
  }

  enableDebug(v = true) { this.debug = !!v; }
  _log(...a) { if (this.debug) console.log("[actors-socket]", ...a); }

  // --- Backward-compat shims so existing code won't crash ---
  init(store) {            // allows: actorsSocket.init(store)
    this.store = store || null;
    return this;
  }
  ensureConnected() {      // allows: actorsSocket.ensureConnected()
    return this.connect();
  }
  // ----------------------------------------------------------

  connect() {
    if (this.socket) return this.socket;

    this._log("connecting to", API_URL, { path: SOCKET_PATH });
    this.socket = io(API_URL, {
      path: SOCKET_PATH,
      transports: ["websocket"],
      autoConnect: true,
    });

    this.socket.on("connect", () => this._log("connected", { id: this.socket.id }));
    this.socket.on("disconnect", (reason) => this._log("disconnected", reason));

    return this.socket;
  }

  on(event, handler) {
    this.connect();
    this.socket.on(event, handler);
    return () => this.off(event, handler);
  }

  off(event, handler) {
    if (!this.socket) return;
    try { this.socket.off(event, handler); } catch {}
  }

  joinRoom(roomId) {
    this.connect();
    if (!roomId) return;
    const rid = String(roomId);
    this._log("joinRoom", rid);
    this.socket.emit("joinRoom", rid);
  }

  leaveRoom(roomId) {
    if (!this.socket || !roomId) return;
    const rid = String(roomId);
    this._log("leaveRoom", rid);
    this.socket.emit("leaveRoom", rid);
  }

  typing(roomId, isTyping) {
    if (!this.socket || !roomId) return;
    this.socket.emit("chat:typing", { roomId: String(roomId), isTyping: !!isTyping });
  }

  disconnect() {
    if (!this.socket) return;
    try { this.socket.disconnect(); } catch {}
    this.socket = null;
  }
}

export const actorsSocket = new ActorsSocket();
// Optional during debugging:
// actorsSocket.enableDebug(true);
