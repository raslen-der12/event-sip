// src/components/PopupHost.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import Lottie from "lottie-react";

/**
 * PopupHost renders a single popup based on a head item stored in LS under:
 *   - "popups" (preferred) or "popup" (legacy)
 * Expected shape:
 * {
 *   type: 'success'|'danger'|'info',
 *   title: '...',
 *   body: '...',
 *   link: { label:'Send verification', href?:'/path', action?:'resend_verification', closeOnClick?:boolean }
 * }
 */

const LOTTIE_URLS = {
  success: "https://assets2.lottiefiles.com/packages/lf20_jbrw3hcz.json",
  danger : "https://assets9.lottiefiles.com/packages/lf20_j1adxtyb.json",
  info   : "https://assets7.lottiefiles.com/packages/lf20_2glqweqs.json",
};

const LS_KEYS = ["popups", "popup"]; // read both, write to 'popups'

/* ---------- bright brand card + dark backdrop ---------- */
const CSS = `
:root{
  --ph-brand: var(--brand-2, #2563eb);
  --ph-text-900: var(--text-900, #0b0f1a);
  --ph-text-700: var(--text-700, #334155);
  --ph-surface-0: var(--surface-0, #ffffff);
  --ph-surface-50: var(--surface-50, #f8fafc);
  --ph-danger: #ef4444;
}
.ph-overlay{
  position:fixed; inset:0;
  background:rgba(2,6,23,.82);
  backdrop-filter:saturate(120%) blur(4px);
  z-index:9998;
}
.ph-root{
  position:fixed; inset:0;
  display:flex; align-items:center; justify-content:center;
  z-index:9999;
}
.ph-card{
  width:min(94vw, 840px);
  background:var(--ph-surface-0); color:var(--ph-text-900);
  border-radius:28px; box-shadow:0 36px 96px rgba(0,0,0,.22);
  border:1px solid rgba(0,0,0,.06);
  padding:36px 40px 28px;
  position:relative; transform:translateY(8px); opacity:0;
  animation:.22s ease-out ph-in forwards; text-align:center;
}
@keyframes ph-in{to{opacity:1; transform:translateY(0)}}
.ph-card.info{   box-shadow: 0 8px 0 0 var(--ph-brand) inset; }
.ph-card.success{box-shadow: 0 8px 0 0 var(--ph-brand) inset; }
.ph-card.danger{ box-shadow: 0 8px 0 0 var(--ph-danger) inset; }

.ph-close{
  position:absolute; top:14px; right:14px;
  background:transparent; border:0; color:var(--ph-text-700);
  cursor:pointer; font-size:22px; line-height:1;
}
.ph-head{ display:flex; flex-direction:column; align-items:center; gap:20px; margin-bottom:6px; }
.ph-icon{
  width:144px; height:144px;
  display:flex; align-items:center; justify-content:center;
  background:var(--ph-surface-50);
  border-radius:32px; overflow:hidden;
  border:1px solid rgba(0,0,0,.06);
}
.ph-title{ margin:0; font-weight:800; font-size:26px; line-height:1.2; color:var(--ph-text-900); }
.ph-content{ max-width:64ch; margin-inline:auto; }
.ph-sub{ margin:12px auto 0; font-size:16px; color:var(--ph-text-700); white-space:pre-line; }

.ph-actions{ margin-top:26px; display:flex; gap:14px; flex-wrap:wrap; align-items:center; justify-content:center; }
.ph-btn{ appearance:none; border:0; border-radius:14px; padding:12px 18px; font-size:14px; cursor:pointer; }
.ph-btn.primary{
  background:var(--ph-brand); color:#fff;
  box-shadow:0 10px 28px color-mix(in srgb, var(--ph-brand) 35%, transparent);
}
.ph-btn.ghost{
  background:transparent; color:var(--ph-brand);
  outline:1px solid color-mix(in srgb, var(--ph-brand) 30%, transparent);
}
`;

/* ---------- small helpers ---------- */
function readHeadFromLS() {
  for (const key of LS_KEYS) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      const head =
        Array.isArray(parsed) ? parsed[0] :
        (parsed && typeof parsed === "object") ? parsed : null;
      if (head) return { key, head };
    } catch (e) {
      console.warn("[PopupHost] JSON parse failed for", key, e);
    }
  }
  return { key: "popups", head: null };
}
function writeHeadToLS(head) {
  try { localStorage.setItem("popups", JSON.stringify(head ? [head] : [])); } catch {}
  try { localStorage.removeItem("popup"); } catch {}
}
function clearLSAll() {
  try { localStorage.removeItem("popups"); } catch {}
  try { localStorage.removeItem("popup"); } catch {}
}
async function fetchLottieJSON(url) {
  const res = await fetch(url, { cache: "force-cache" });
  if (!res.ok) throw new Error(`fetch ${url} -> ${res.status}`);
  return res.json();
}

export default function PopupHost() {
  const [item, setItem] = useState(null);
  const [lsKey, setLsKey] = useState("popups");
  const lastSig = useRef("");
  const [lottieData, setLottieData] = useState(null);
  const [lottieErr, setLottieErr] = useState(null);

  const kind =
    item?.type === "danger" || item?.type === "error"
      ? "danger"
      : item?.type === "success"
      ? "success"
      : "info";

  const pull = () => {
    const { key, head } = readHeadFromLS();
    setLsKey(key);
    const sig = head ? JSON.stringify(head) : "";
    if (sig !== lastSig.current) {
      lastSig.current = sig;
      setItem(head || null);
      // console.log("[PopupHost] pull", { key, head });
    }
  };

  useEffect(() => {
    pull(); // initial
    const onReady = () => pull();
    window.addEventListener("app:popup:ready", onReady);
    window.addEventListener("app:popup:changed", onReady);
    const onStorage = (e) => { if (e?.key && LS_KEYS.includes(e.key)) pull(); };
    window.addEventListener("storage", onStorage);
    const id = setInterval(pull, 800); // resilient to LS writers that don't emit events
    return () => {
      window.removeEventListener("app:popup:ready", onReady);
      window.removeEventListener("app:popup:changed", onReady);
      window.removeEventListener("storage", onStorage);
      clearInterval(id);
    };
  }, []);

  useEffect(() => {
    setLottieData(null);
    setLottieErr(null);
    if (!item) return;
    const url = LOTTIE_URLS[kind];
    if (!url) return;
    let alive = true;
    fetchLottieJSON(url)
      .then((json) => { if (alive) setLottieData(json); })
      .catch((err) => { if (alive) setLottieErr(err); });
    return () => { alive = false; };
  }, [item, kind]);

  const close = () => {
    clearLSAll();
    setItem(null);
    try { window.dispatchEvent(new CustomEvent("app:popup:closed")); } catch {}
  };

  const onPrimary = (e) => {
    e?.preventDefault?.();
    const link = item?.link;
    if (!link) { close(); return; }

    // 1) emit action hook for scriptable flows (resend verification, etc.)
    if (link.action) {
      try { window.dispatchEvent(new CustomEvent("app:popup:action", { detail: link })); } catch {}
    }

    // 2) navigate if href present (after clearing, to avoid re-trigger)
    close();

    if (link.href && link.href !== "#") {
      try {
        if (link.href.startsWith("/")) window.history.pushState({}, "", link.href);
        else window.location.assign(link.href);
      } catch { /* no-op */ }
    }
  };

  if (!item) return <style dangerouslySetInnerHTML={{ __html: CSS }} />;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="ph-overlay" onClick={close} role="presentation" />

      <div className="ph-root" aria-live="polite" aria-atomic="true">
        <div className={`ph-card ${kind}`} role="dialog" aria-modal="true">
          <button className="ph-close" aria-label="Close" onClick={close} type="button">✕</button>

          <div className="ph-head">
            <div className="ph-icon" aria-hidden>
              {lottieData && !lottieErr ? (
                <Lottie animationData={lottieData} loop={false} autoplay style={{ width: 144, height: 144 }} />
              ) : (
                <span style={{ fontSize: 48 }}>
                  {kind === "success" ? "✅" : kind === "danger" ? "⚠️" : "ℹ️"}
                </span>
              )}
            </div>
            <div className="ph-content">
              <h3 className="ph-title">{item.title || "Notification"}</h3>
              {item.body ? <p className="ph-sub">{item.body}</p> : null}
            </div>
          </div>

          <div className="ph-actions">
            {item.link ? (
              <button className="ph-btn primary" onClick={onPrimary} type="button">
                {item.link.label || "OK"}
              </button>
            ) : null}
            <button className="ph-btn ghost" onClick={close} type="button">Close</button>
          </div>
        </div>
      </div>
    </>
  );
}
