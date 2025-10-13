import { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { apiSlice } from "./api/apiSlice";

/**
 * LateRefreshBootstrap
 * - Watches all RTK Query requests.
 * - If any request stays "pending" longer than THRESHOLD_MS, force a one-time page reload.
 * - Uses sessionStorage key to avoid a refresh loop.
 * - Key is cleared automatically after the next successful request so future stalls can refresh once again.
 */
const THRESHOLD_MS = 9000; // adjust if you want (e.g., 7000–12000)
const KEY = "lateRefresh.lock";

export default function LateRefreshBootstrap() {
  const apiState = useSelector((s) => s[apiSlice.reducerPath]);
  const timerRef = useRef(null);

  useEffect(() => {
    const queries = Object.values(apiState?.queries || {});
    const hasPending   = queries.some((q) => q?.status === "pending");
    const hasFulfilled = queries.some((q) => q?.status === "fulfilled");

    // If we previously reloaded due to a stall, unlock once something succeeds
    if (hasFulfilled && sessionStorage.getItem(KEY)) {
      sessionStorage.removeItem(KEY);
    }

    // Start a one-shot timer if there is a pending request and we are not locked
    if (hasPending && !sessionStorage.getItem(KEY) && !timerRef.current && document.visibilityState === "visible") {
      timerRef.current = setTimeout(() => {
        try {
          sessionStorage.setItem(KEY, "1"); // lock: prevents a second refresh loop
          window.location.reload();
        } catch (_) {
          // no-op
        }
      }, THRESHOLD_MS);
    }

    // If no pending anymore, clear any armed timer
    if (!hasPending && timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [apiState?.queries]);

  return null;
}
