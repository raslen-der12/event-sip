// src/services/adminSocket.js
import { io } from "socket.io-client";
import { selectCurrentToken } from "../features/auth/authSlice";

const API_URL     = process.env.REACT_REACT_APP_API_URL || process.env.REACT_APP_API_URL || "https://api.eventra.cloud";
const SOCKET_PATH = process.env.REACT_APP_SOCKET_PATH || "/socket.io";
const ADMIN_NS    = process.env.REACT_APP_ADMIN_SOCKET_NAMESPACE || "/admin";

// Debug flag (default OFF). You can still re-enable at runtime via adminSocket.enableDebug(true)
let DEBUG = false;

const log   = () => {};
const info  = () => {};
const warn  = () => {};
const error = () => {};

const listeners = new Map(); // event -> Set<fn>
function emitLocal(event, payload) {
  const set = listeners.get(event);
  if (set) set.forEach(fn => { try { fn(payload); } catch (e) { /* suppressed */ } });
}

const safe = (v) => {
  try { return typeof v === "string" ? v : JSON.parse(JSON.stringify(v)); }
  catch { return v; }
};

class AdminSocket {
  constructor() {
    this.store = null;
    this.socket = null;
    this.connectedOnce = false;
  }

  enableDebug(on = true) {
    DEBUG = !!on;
    try { localStorage.setItem("ADMIN_SOCKET_DEBUG", on ? "1" : "0"); } catch {}
    // no console output; just flips the flag for future use if you add logs later
  }

  init(store) {
    this.store = store;
    return this;
  }

  isConnected() {
    return !!(this.socket && this.socket.connected);
  }

  ensureConnected() {
    if (this.socket?.connected) return this.socket;
    if (!this.store) { return null; }

    const state = this.store.getState();
    const token = selectCurrentToken(state);
    const auth  = token ? { token: `Bearer ${token}` } : undefined;

    this.socket = io(`${API_URL}${ADMIN_NS}`, {
      path: SOCKET_PATH,
      transports: ["websocket"],
      autoConnect: true,
      auth
    });

    // ---- core lifecycle (no console output)
    this.socket.on("connect", () => {
      this.connectedOnce = true;
      emitLocal("connected");
    });

    this.socket.on("disconnect", (reason) => {
      emitLocal("disconnected", reason);
    });

    this.socket.on("connect_error", () => {
      // suppressed
    });

    this.socket.on("error", () => {
      // suppressed
    });

    // ---- removed noisy onAny debug logger

    // ---- specific streams
    this.socket.on("chat:new",        (pl) => emitLocal("chat:new", pl));
    this.socket.on("chat:system",     (pl) => emitLocal("chat:system", pl));
    this.socket.on("chat:deleted",    (pl) => emitLocal("chat:deleted", pl));
    this.socket.on("chat:typing",     (pl) => emitLocal("chat:typing", pl));
    this.socket.on("chat:seen",       (pl) => emitLocal("chat:seen", pl));
    this.socket.on("admin:sanction",  (pl) => emitLocal("admin:sanction", pl));
    this.socket.on("admin:kicked",    (pl) => emitLocal("admin:kicked", pl));
    this.socket.on("admin:broadcast", (pl) => emitLocal("admin:broadcast", pl));

    return this.socket;
  }

  // emit with optional ack timeout (no console logs)
  emitWithAck(event, payload, timeoutMs = 4000) {
    this.ensureConnected();
    if (!this.socket) return Promise.reject(new Error("no socket"));

    return new Promise((resolve, reject) => {
      let timer = null;
      try {
        const ack = (res) => {
          if (timer) clearTimeout(timer);
          resolve(res);
        };
        if (timeoutMs > 0) {
          timer = setTimeout(() => {
            resolve(null); // no ack within timeout (can be normal)
          }, timeoutMs);
        }
        this.socket.emit(event, payload, ack);
      } catch (e) {
        if (timer) clearTimeout(timer);
        reject(e);
      }
    });
  }

  // lightweight pub/sub for pages
  on(event, handler) {
    if (!listeners.has(event)) listeners.set(event, new Set());
    listeners.get(event).add(handler);
    this.ensureConnected();
    return () => this.off(event, handler);
  }
  off(event, handler) {
    if (listeners.has(event)) listeners.get(event).delete(handler);
  }

  // convenience methods matching backend events
  joinRoom(roomId) {
    if (!roomId) return;
    return this.emitWithAck("admin:joinRoom", String(roomId));
  }
  leaveRoom(roomId) {
    if (!roomId) return;
    return this.emitWithAck("admin:leaveRoom", String(roomId));
  }
  sendSystem(roomId, text, files = []) {
    if (!roomId) return Promise.reject(new Error("no roomId"));
    return this.emitWithAck("admin:system", { roomId: String(roomId), text, files });
  }
  typing(roomId, isTyping) {
    if (!roomId) return;
    return this.emitWithAck("admin:typing", { roomId: String(roomId), isTyping: !!isTyping }, 0);
  }
  seen(roomId, msgIds = []) {
    if (!roomId || !Array.isArray(msgIds) || !msgIds.length) return;
    return this.emitWithAck("admin:seen", { roomId: String(roomId), msgIds }, 0);
  }

  disconnect() {
    if (this.socket) {
      try { this.socket.disconnect(); } catch {}
    }
  }
}

export const adminSocket = new AdminSocket();
