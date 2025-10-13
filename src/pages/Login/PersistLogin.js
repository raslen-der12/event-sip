// src/features/auth/PersistLogin.jsx
import { Outlet } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { selectCurrentToken } from "../../features/auth/authSlice";
import usePersist from "../../lib/hooks/usePersist";
import { useRefreshMutation } from "../../features/auth/authApiSlice";
import {
  useListActorNotificationsQuery,
  useAckActorNotificationMutation,
} from "../../features/Actor/toolsApiSlice";

/* ===================== DEBUG TOOLS (safe) ===================== */
const DBG = false;
const dlog = (...a) => DBG && console.log("[Persist/Popup]", ...a);

/* ===================== AUTH HELPERS ===================== */
function decodeJwtExpMs(token) {
  try {
    const [, payload] = token.split(".");
    const data = JSON.parse(atob(payload));
    return data?.exp ? data.exp * 1000 : null;
  } catch {
    return null;
  }
}
function getTteMs(token) {
  const exp = decodeJwtExpMs(token);
  return exp ? exp - Date.now() : Number.POSITIVE_INFINITY;
}

/* ===================== POPUP HELPERS ===================== */
const LS_KEYS = ["popup", "popups", "toast", "notification"];

function readAnyPopupFromLS() {
  for (const k of LS_KEYS) {
    try {
      const raw = localStorage.getItem(k);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return { key: k, items: parsed };
      if (parsed && typeof parsed === "object") return { key: k, items: [parsed] };
    } catch {}
  }
  return { key: "popup", items: [] };
}

function writePopupToLS(key, item) {
  try {
    localStorage.setItem(key, JSON.stringify([item]));
    return true;
  } catch {
    return false;
  }
}

function normalizeLocalItem(p) {
  return {
    type: p.type || p.status || "info",
    status: p.type || p.status || "info",
    title: p.title || p.heading || "Notification",
    body: p.body || p.message || "",
    message: p.body || p.message || "",
    ts: p.ts || Date.now(),
    showOnce: true,
    link: p.link || null,
    _source: p._source || "local",
  };
}

function notifToPopup(n) {
  return {
    type: n.priority >= 8 ? "success" : "info",
    status: n.priority >= 8 ? "success" : "info",
    title: n.title || "Notification",
    body: n.body || "",
    message: n.body || "",
    ts: n.ts || Date.now(),
    showOnce: true,
    link: n.link ? { href: n.link, label: "Open" } : null,
    _source: "server",
    _id: n._id,
    priority: n.priority ?? 0,
  };
}

function pokeModalReady() {
  requestAnimationFrame(() => {
    window.dispatchEvent(new CustomEvent("app:popup:ready"));
  });
}

/* ===================== NOTIFICATIONS BRIDGE ===================== */
function NotificationsBridge({ token }) {
  const [queue, setQueue] = useState([]);
  const [ackNotif] = useAckActorNotificationMutation();
  const seenIdsRef = useRef(new Set());
  const writeKeyRef = useRef("popup");
  const lastWrittenRef = useRef("");

  useEffect(() => {
    window.testPopup = (overrides = {}) => {
      const item = normalizeLocalItem({
        type: "info",
        title: "Local test",
        body: "Hello from LS",
        ...overrides,
        ts: Date.now(),
        _source: "local",
      });
      writePopupToLS(writeKeyRef.current, item);
      pokeModalReady();
      dlog("DEV injected popup into LS:", writeKeyRef.current, item);
      return item;
    };
    return () => {
      try { delete window.testPopup; } catch {}
    };
  }, []);

  useEffect(() => {
    const { key, items } = readAnyPopupFromLS();
    writeKeyRef.current = key;
    if (items.length) {
      const normalized = items.map(normalizeLocalItem);
      setQueue((prev) => [...prev, ...normalized]);
      dlog("Ingested LS on mount from", key, normalized);
      pokeModalReady();
    }
    const onStorage = (e) => {
      if (!e || !LS_KEYS.includes(e.key)) return;
      const { key: key2, items: items2 } = readAnyPopupFromLS();
      writeKeyRef.current = key2;
      if (items2.length) {
        const normalized2 = items2.map(normalizeLocalItem);
        setQueue((prev) => [...prev, ...normalized2]);
        dlog("Ingested LS via storage event from", key2, normalized2);
        pokeModalReady();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const { data: notifResp } = useListActorNotificationsQuery(undefined, {
    skip: !token,
    pollingInterval: 30000,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });

  useEffect(() => {
    if (!notifResp?.data || !Array.isArray(notifResp.data)) return;
    const fromServer = notifResp.data
      .filter((n) => n && !n.read && n._id && !seenIdsRef.current.has(n._id))
      .map(notifToPopup);
    if (fromServer.length) {
      for (const it of fromServer) seenIdsRef.current.add(it._id);
      setQueue((prev) => [...prev, ...fromServer]);
      dlog("Server enqueued", fromServer.length);
    }
  }, [notifResp]);

  useEffect(() => {
    if (!queue.length) return;
    const head = queue[0];
    if (head?._source === "server") {
      const json = JSON.stringify([head]);
      if (json !== lastWrittenRef.current) {
        writePopupToLS(writeKeyRef.current, head);
        lastWrittenRef.current = json;
        dlog("Wrote SERVER head to LS:", writeKeyRef.current, head);
        pokeModalReady();
      }
    } else {
      pokeModalReady();
    }
  }, [queue]);

  useEffect(() => {
    const onClose = () => {
      setQueue((prev) => {
        if (!prev.length) return prev;
        const cur = prev[0];
        if (cur?._source === "server" && cur?._id) {
          ackNotif({ id: cur._id }).catch(() => {});
        }
        return prev.slice(1);
      });
      dlog("CLOSE event received; advanced queue");
    };
    window.addEventListener("app:popup:closed", onClose);
    return () => window.removeEventListener("app:popup:closed", onClose);
  }, [ackNotif]);

  useEffect(() => {
    window.__popupQueue = queue;
    dlog("Queue len:", queue.length, queue[0]);
  }, [queue]);

  return null;
}

/* ===================== PERSIST LOGIN + REFRESH ===================== */
const REFRESH_SKEW_MS = 90_000; // refresh ~90s before expiry
const MIN_DELAY_MS = 5_000;

// Strict classifier of "fatal auth" for toggling persist off.
// We only consider:
//  - 401 Unauthorized or 403 Forbidden
//  - AND no access token in store
//  - AND the backend message hints token/verification issue
function isFatalAuthError(err) {
  const status = err?.status ?? err?.originalStatus ?? 0;
  if (!(status === 401 || status === 403)) return false;
  const msg = (err?.data?.message || err?.error || "").toString().toLowerCase();
  if (!msg) return true; // conservative if status is 401/403 but no message
  return (
    msg.includes("token") ||
    msg.includes("unauthorized") ||
    msg.includes("forbidden") ||
    msg.includes("expired") ||
    msg.includes("verify")
  );
}

const PersistLogin = () => {
  const [persist, setPersist] = usePersist(); // <-- we may turn it off safely
  const token = useSelector(selectCurrentToken);

  const [refresh, { isUninitialized, isLoading, isSuccess, isError, error }] =
    useRefreshMutation();

  const [bootTried, setBootTried] = useState(false);

  const timerRef = useRef(null);
  const mountedRef = useRef(true);

  // protects against random flips
  const failCountRef = useRef(0);
  const suspendedRef = useRef(false); // once true, we stop auto-refresh until next login

  const scheduleNextRefresh = (tok) => {
    clearTimeout(timerRef.current);
    if (suspendedRef.current) return; // do not schedule while suspended
    if (!tok) return;
    const tte = getTteMs(tok);
    const delay = Math.max(MIN_DELAY_MS, isFinite(tte) ? tte - REFRESH_SKEW_MS : REFRESH_SKEW_MS);
    timerRef.current = setTimeout(async () => {
      try {
        await refresh().unwrap();
        failCountRef.current = 0; // reset on success
      } catch (err) {
        console.error("scheduled refresh failed:", err);
        if (isFatalAuthError(err) && !token) {
          failCountRef.current += 1;
          // Only toggle persist after 2 consecutive fatal failures (no token),
          // to avoid accidental flips due to flaky network.
          if (failCountRef.current >= 2 && !suspendedRef.current) {
            suspendedRef.current = true;
            setPersist(false); // stop further automatic refresh attempts
            clearTimeout(timerRef.current);
          }
        }
      }
    }, delay);
  };

  // On mount: if persist ON and no token, try silent refresh once
  useEffect(() => {
    mountedRef.current = true;
    (async () => {
      if (!persist) { setBootTried(true); return; }
      if (token) { setBootTried(true); return; }
      try {
        await refresh().unwrap();
        failCountRef.current = 0;
      } catch (err) {
        console.error("initial refresh failed:", err);
        if (isFatalAuthError(err) && !token) {
          failCountRef.current += 1;
          // Do NOT flip persist here yet — we require two failures.
        }
      } finally {
        if (mountedRef.current) setBootTried(true);
      }
    })();
    return () => {
      mountedRef.current = false;
      clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persist]);

  // Whenever token changes, (re)schedule proactive refresh
  useEffect(() => {
    if (!persist) return;
    // If user logged in again, re-enable scheduling.
    if (token) {
      suspendedRef.current = false;
      failCountRef.current = 0;
    }
    scheduleNextRefresh(token);
    return () => clearTimeout(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, persist]);

  // ===== Render logic =====
  if (!persist) {
    return (
      <>
        <NotificationsBridge token={token} />
        <Outlet />
      </>
    );
  }

  if (!bootTried || isLoading || isUninitialized) {
    return (
      <>
        <NotificationsBridge token={token} />
        <p className="text-center">Loading…</p>
      </>
    );
  }

  if (token || isSuccess) {
    return (
      <>
        <NotificationsBridge token={token} />
        <Outlet />
      </>
    );
  }

  return (
    <>
      <NotificationsBridge token={token} />
      <p className="text-center">
        {error?.data?.message || "Session expired. Please log in again."}
      </p>
    </>
  );
};

export default PersistLogin;
