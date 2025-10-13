// src/features/notifications/PopupBridge.jsx
import { useEffect, useRef, useState } from "react";
import {
  useListActorNotificationsQuery,
  useAckActorNotificationMutation,
} from "../../features/Actor/toolsApiSlice";

const WRITE_KEY = "popups";                 // where the modal reads
const READ_KEYS = ["popups", "popup"];      // tolerate either
const MIN_PRIORITY = 8;
const POLL_MS = 30_000;

/* ---------- localStorage helpers ---------- */
function readHead() {
  for (const k of READ_KEYS) {
    try {
      const raw = localStorage.getItem(k);
      if (!raw) continue;
      const p = JSON.parse(raw);
      const head = Array.isArray(p) ? p[0] : (p && typeof p === "object" ? p : null);
      if (head) return head;
    } catch {}
  }
  return null;
}
function writeHead(item) {
  try { localStorage.setItem(WRITE_KEY, JSON.stringify([item])); } catch {}
  try {
    window.dispatchEvent(new CustomEvent("app:popup:ready", { detail: item }));
    window.dispatchEvent(new CustomEvent("app:popup:changed", { detail: item }));
  } catch {}
}
const isIdle = () => readHead() == null;

/* ---------- API helpers ---------- */
const extractList = (resp) =>
  Array.isArray(resp) ? resp
  : Array.isArray(resp?.data) ? resp.data
  : Array.isArray(resp?.notifications) ? resp.notifications
  : [];

const toPopupView = (n) => ({
  type: (n.priority ?? 0) >= MIN_PRIORITY ? "success" : "info",
  title: n.title || "Notification",
  body: n.body || "",
  ts: n.ts || Date.now(),
  showOnce: true,
  link: n.link ? { href: n.link, label: "Open" } : null,
  _source: "server",
  _id: n._id, // keep id inside the head too
  priority: n.priority ?? 0,
});

export default function PopupBridge() {
  const [queue, setQueue] = useState([]);   // [{raw, view}]
  const seen = useRef(new Set());
  const [ack] = useAckActorNotificationMutation();

  // Track the server popup we actually published (prevents “no id” loops)
  const currentIdRef = useRef(null);        // string | null
  const hadHeadRef   = useRef(!isIdle());   // was there a head last tick?

  /* 1) Fetch from server */
  const { data: resp } = useListActorNotificationsQuery(undefined, {
    pollingInterval: POLL_MS,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });

  /* 2) Queue unread >= MIN_PRIORITY */
  useEffect(() => {
    const list = extractList(resp);
    if (!list?.length) return;

    const incoming = list
      .filter(n => n && !n.read && (n.priority ?? 0) >= MIN_PRIORITY && n._id && !seen.current.has(n._id))
      .map(n => ({ raw: n, view: toPopupView(n) }));

    if (!incoming.length) return;

    incoming.forEach(x => seen.current.add(x.raw._id));
    setQueue(prev => [...prev, ...incoming]);
  }, [resp]);

  /* 3) Publish next server popup when idle */
  useEffect(() => {
    if (!queue.length || !isIdle()) return;
    const next = queue[0];
    writeHead(next.view);
    currentIdRef.current = String(next.raw._id);    // mark we published this one
    hadHeadRef.current = true;                      // head now exists
    // console.log("[PopupBridge] published id:", currentIdRef.current);
  }, [queue]);

  /* 4) ACK helper — only if we had published something */
  const ackPublishedIfAny = async () => {
    const id = currentIdRef.current;
    if (!id) return;                                // nothing we published → no ack
    try {
      await ack(id).unwrap();                       // primitive id → /actors/me/notifications/:id/ack
    } catch (e) {
      // console.warn("[PopupBridge] ack failed", e);
    } finally {
      setQueue(prev => (prev[0]?.raw?._id === id ? prev.slice(1) : prev));
      currentIdRef.current = null;                  // clear published marker
    }
  };

  /* 5) Watch head lifecycle: if head existed and now it’s gone → modal closed → ACK */
  useEffect(() => {
    const tick = async () => {
      const head = readHead();
      const hasHead = !!head;
      const hadHead = hadHeadRef.current;

      if (hadHead && !hasHead) {
        // transitioned: was shown → now cleared (closed) → ACK ONLY IF WE published
        await ackPublishedIfAny();
      }

      // If idle and we have queued items and nothing is currently published, publish next
      if (!hasHead && queue.length && !currentIdRef.current) {
        const next = queue[0];
        writeHead(next.view);
        currentIdRef.current = String(next.raw._id);
        // console.log("[PopupBridge] republished id:", currentIdRef.current);
      }

      hadHeadRef.current = hasHead;
    };

    const onStorage = (e) => {
      if (!e || READ_KEYS.includes(e.key)) void tick();
    };
    window.addEventListener("storage", onStorage);
    const t = setInterval(tick, 900);
    return () => { window.removeEventListener("storage", onStorage); clearInterval(t); };
  }, [queue.length, ack]);

  /* 6) Also ACK on explicit close event (same guard applies) */
  useEffect(() => {
    const onClose = () => { void ackPublishedIfAny(); };
    window.addEventListener("app:popup:closed", onClose);
    return () => window.removeEventListener("app:popup:closed", onClose);
  }, []);

  return null;
}
