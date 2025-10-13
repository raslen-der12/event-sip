import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { apiSlice } from "./api/apiSlice";
import "./global-page-loader.css";

/* Only during page changes; hides when RTKQ is idle */
const DEBOUNCE_SHOW_MS = 200;
const MIN_SHOW_MS = 400;
const HARD_TIMEOUT_MS = 3000;
const SETTLE_IDLE_MS = 150;

export default function GlobalPageLoader() {
  const { key: locKey } = useLocation();
  const apiState = useSelector((s) => s[apiSlice.reducerPath]);

  const hasPending = useMemo(() => {
    const qs = Object.values(apiState?.queries || {});
    const ms = Object.values(apiState?.mutations || {});
    return qs.some((q) => q?.status === "pending") || ms.some((m) => m?.status === "pending");
  }, [apiState?.queries, apiState?.mutations]);

  const [visible, setVisible] = useState(false);
  const armedRef = useRef(false);
  const showAtRef = useRef(0);

  const showTimer = useRef(null);
  const hideTimer = useRef(null);
  const hardTimer = useRef(null);
  const settleTimer = useRef(null);

  // Arm on every route change
  useEffect(() => {
    armedRef.current = true;
    clearAll();

    showTimer.current = setTimeout(() => {
      showTimer.current = null;
      setVisible(true);
      showAtRef.current = Date.now();
    }, DEBOUNCE_SHOW_MS);

    hardTimer.current = setTimeout(() => {
      safeHide();
      hardTimer.current = null;
    }, HARD_TIMEOUT_MS);

    return () => clearAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locKey]);

  // Wait for RTKQ to become idle, then hide (with a tiny settle)
  useEffect(() => {
    if (!armedRef.current) return;
    if (!hasPending) {
      if (!settleTimer.current) {
        settleTimer.current = setTimeout(() => {
          attemptHide();
          settleTimer.current = null;
        }, SETTLE_IDLE_MS);
      }
    } else if (settleTimer.current) {
      clearTimeout(settleTimer.current);
      settleTimer.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasPending]);

  function attemptHide() {
    if (hasPending) return;
    safeHide();
  }

  function safeHide() {
    const elapsed = Date.now() - (showAtRef.current || 0);
    const left = visible ? Math.max(0, MIN_SHOW_MS - elapsed) : 0;
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      setVisible(false);
      clearAll();
      armedRef.current = false;
    }, left);
  }

  function clearAll() {
    [showTimer, hideTimer, hardTimer, settleTimer].forEach(ref => {
      if (ref.current) { clearTimeout(ref.current); ref.current = null; }
    });
  }

  if (!visible) return null;
  return createPortal(
    <div className="gpl">
      <section className="gpl-box" role="status" aria-live="polite" aria-busy="true">
        <div className="gpl-spinner" />
        <p className="gpl-text">Loading page…</p>
      </section>
    </div>,
    document.body
  );
}
