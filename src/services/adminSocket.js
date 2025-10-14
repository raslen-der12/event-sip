// src/services/adminSocket.js
import { io } from "socket.io-client";
import { selectCurrentToken } from "../features/auth/authSlice";

const API_URL    = process.env.REACT_REACT_APP_API_URL || process.env.REACT_APP_API_URL || 'https://api.eventra.cloud';
const SOCKET_PATH= process.env.REACT_APP_SOCKET_PATH || "/socket.io";
const ADMIN_NS   = process.env.REACT_APP_ADMIN_SOCKET_NAMESPACE || "/admin";

// debug toggle: set REACT_APP_ADMIN_SOCKET_DEBUG=1 or localStorage.ADMIN_SOCKET_DEBUG="1"
const envDebug   = String(process.env.REACT_APP_ADMIN_SOCKET_DEBUG || "").trim();
const lsDebug    = typeof window !== "undefined" ? window.localStorage.getItem("ADMIN_SOCKET_DEBUG") : null;
let   DEBUG      = (envDebug === "1" || envDebug.toLowerCase() === "true") || (lsDebug === "1" || lsDebug === "true");

const log   = (...a) => { if (DEBUG) console.log("%c[admin-socket]", "color:#6c5ce7", ...a); };
const info  = (...a) => { if (DEBUG) console.info("%c[admin-socket]", "color:#00b894", ...a); };
const warn  = (...a) => { if (DEBUG) console.warn("%c[admin-socket]", "color:#fdcb6e", ...a); };
const error = (...a) => { if (DEBUG) console.error("%c[admin-socket]", "color:#d63031", ...a); };

const listeners = new Map(); // event -> Set<fn>
function emitLocal(event, payload) {
  const set = listeners.get(event);
  if (set) set.forEach(fn => { try { fn(payload); } catch (e) { error("listener error", e); } });
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
    log("debug:", on);
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
    if (!this.store) { warn("no store set; call adminSocket.init(store) first"); return null; }

    const state = this.store.getState();
    const token = selectCurrentToken(state);
    const auth  = token ? { token: `Bearer ${token}` } : undefined;

    log("connecting to", `${API_URL}${ADMIN_NS}`, { path: SOCKET_PATH, auth: !!auth });

    this.socket = io(`${API_URL}${ADMIN_NS}`, {
      path: SOCKET_PATH,
      transports: ["websocket"],
      autoConnect: true,
      auth
    });

    // ---- core lifecycle
    this.socket.on("connect", () => {
      this.connectedOnce = true;
      info("connected", { id: this.socket.id });
      emitLocal("connected");
    });

    this.socket.on("disconnect", (reason) => {
      warn("disconnected:", reason);
      emitLocal("disconnected", reason);
    });

    this.socket.on("connect_error", (err) => {
      error("connect_error:", err?.message || err);
    });

    this.socket.on("error", (err) => {
      error("socket error:", err);
    });


    // ---- log ALL inbound events
    if (this.socket.onAny) {
      this.socket.onAny((event, ...args) => {
        if (!DEBUG) return;
        const out = args.length === 1 ? args[0] : args;
        console.debug("%c[admin-socket] <-", "color:#0984e3", event, safe(out));
      });
    }

    // ---- specific streams you care about
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

  // emit with debug + optional ack timeout
  emitWithAck(event, payload, timeoutMs = 4000) {
    this.ensureConnected();
    if (!this.socket) { error("emitWithAck: no socket"); return Promise.reject(new Error("no socket")); }

    if (DEBUG) console.debug("%c[admin-socket] ->", "color:#e17055", event, safe(payload));

    return new Promise((resolve, reject) => {
      let timer = null;
      try {
        const ack = (res) => {
          if (timer) clearTimeout(timer);
          info(`ack for ${event}:`, safe(res));
          resolve(res);
        };
        // some server handlers don’t ack; we still want to log that we sent
        if (timeoutMs > 0) {
          timer = setTimeout(() => {
            warn(`no ack for ${event} within ${timeoutMs}ms (this can be normal)`);
            resolve(null);
          }, timeoutMs);
        }
        this.socket.emit(event, payload, ack);
      } catch (e) {
        if (timer) clearTimeout(timer);
        error(`emit error for ${event}:`, e);
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
