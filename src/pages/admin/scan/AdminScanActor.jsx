// src/pages/admin/members/AdminScanActor.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { useGetEventsQuery } from "../../../features/events/eventsApiSlice";
import { useAdminScanActorAttendMutation } from "../../../features/meetings/meetingsApiSlice";
import imageLink from "../../../utils/imageLink";
import { Link } from "react-router-dom";

/* -------------------------- utils -------------------------- */
const isHex24 = (s) => /^[0-9a-fA-F]{24}$/.test(String(s || ""));
function extractActorId(input) {
  const s = String(input || "").trim();
  try { const j = JSON.parse(s); const cand = j.actorId || j._id || j.id || j.actor; if (isHex24(cand)) return cand; } catch {}
  try {
    const u = new URL(s);
    const last = u.pathname.split("/").filter(Boolean).pop() || "";
    const clean = last.split(/[?#]/)[0];
    if (isHex24(clean)) return clean;
    for (const [, v] of u.searchParams) if (isHex24(v)) return v;
  } catch {
    const last = s.split("/").filter(Boolean).pop() || "";
    const clean = last.split(/[?#]/)[0];
    if (isHex24(clean)) return clean;
  }
  return null;
}

function fmt(dt) {
  if (!dt) return "—";
  const d = new Date(dt);
  return isNaN(+d) ? "—" : d.toLocaleString();
}

/* ------------------------- UI bits ------------------------- */
function Modal({ open, title, onClose, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[1000] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <div className="font-semibold text-lg">{title}</div>
          <button className="px-3 py-1.5 rounded-md border" onClick={onClose}>Close</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function Pill({ children, tone = "zinc" }) {
  const tones = {
    zinc: "bg-zinc-100 text-zinc-800",
    emerald: "bg-emerald-100 text-emerald-800",
    violet: "bg-violet-100 text-violet-800",
    amber: "bg-amber-100 text-amber-800",
    red: "bg-red-100 text-red-800",
    slate: "bg-slate-100 text-slate-800",
  };
  const cls = tones[tone] || tones.zinc;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
      {children}
    </span>
  );
}

function KV({ k, v }) {
  return (
    <div className="grid grid-cols-[140px,1fr] gap-2">
      <div className="text-zinc-500">{k}</div>
      <div className="font-medium break-words">{v ?? "—"}</div>
    </div>
  );
}

function Toast({ open, type = "success", message = "", onClose }) {
  if (!open) return null;
  const palette = {
    success: "bg-emerald-600",
    error: "bg-red-600",
    info: "bg-zinc-800",
    warning: "bg-amber-600",
  };
  const cls = palette[type] || palette.info;
  return (
    <div className="fixed top-4 right-4 z-[1100]">
      <div className={`text-white px-4 py-3 rounded-xl shadow-lg ${cls}`}>
        <div className="font-semibold">{message}</div>
        <button className="ml-3 underline" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

/* ---------------------------- page ---------------------------- */
export default function AdminScanActor({ eventId: eventIdProp }) {
  const scanBoxId = "qr-actor-scan";
  const qrcode = useRef(null);
  const starting = useRef(false);
  const mounted = useRef(true);
  const lastFireAt = useRef(0);

  const [cameraOn, setCameraOn] = useState(false);
  const [cameraPaused, setCameraPaused] = useState(false);
  const [lastScan, setLastScan] = useState("");

  // events
  const { data: evRes } = useGetEventsQuery();
  const events = useMemo(
    () =>
      Array.isArray(evRes?.data) ? evRes.data :
      (Array.isArray(evRes) ? evRes : []),
    [evRes]
  );
  const [eventId, setEventId] = useState(eventIdProp || (events[0]?._id ?? ""));
  useEffect(() => { if (!eventId && events.length) setEventId(events[0]._id); }, [events, eventId]);

  const eventTitle = useMemo(
    () => events.find((e) => String(e._id) === String(eventId))?.title || "",
    [events, eventId]
  );

  // RTK mutations (separate instances)
  const [previewTrigger, previewState] = useAdminScanActorAttendMutation();
  const [confirmTrigger, confirmState] = useAdminScanActorAttendMutation();

  // preview state
  const [preview, setPreview] = useState(null); // { actorRole, actor, actorId, token, alreadyCheckedIn, lastCheckinAt }
  const [previewOpen, setPreviewOpen] = useState(false);

  // toast
  const [toast, setToast] = useState({ open: false, type: "success", message: "" });
  useEffect(() => {
    if (!toast.open) return;
    const t = setTimeout(() => setToast((x) => ({ ...x, open: false })), 2200);
    return () => clearTimeout(t);
  }, [toast.open]);

  useEffect(() => {
    mounted.current = true;
    const onHide = () => { stopCamera(); };
    window.addEventListener("pagehide", onHide);
    window.addEventListener("beforeunload", onHide);
    return () => {
      mounted.current = false;
      window.removeEventListener("pagehide", onHide);
      window.removeEventListener("beforeunload", onHide);
      stopCamera();
    };
  }, []);

  /* ------------------- camera lifecycle (safe) ------------------- */
  async function startCamera() {
    if (cameraOn || starting.current) return;
    starting.current = true;
    try {
      const el = document.getElementById(scanBoxId);
      if (!el) throw new Error("Scan container missing");
      el.innerHTML = ""; // html5-qrcode owns children
      qrcode.current = new Html5Qrcode(scanBoxId);
      await qrcode.current.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 300, height: 300 } },
        onDecode
      );
      if (!mounted.current) { await stopCamera(); return; }
      setCameraOn(true);
      setCameraPaused(false);
    } catch (e) {
      console.error("Camera start failed", e);
      alert("Unable to access camera. Check browser permissions.");
    } finally {
      starting.current = false;
    }
  }

  async function stopCamera() {
    const inst = qrcode.current;
    if (!inst) return;
    try { await inst.stop(); } catch {}
    try { await inst.clear(); } catch {}
    qrcode.current = null;
    if (mounted.current) {
      setCameraOn(false);
      setCameraPaused(false);
    }
  }

  async function pauseCamera() {
    if (!cameraOn || !qrcode.current) return;
    try { await qrcode.current.pause(true); setCameraPaused(true); } catch {}
  }
  async function resumeCamera() {
    if (!cameraOn || !qrcode.current) return;
    try { await qrcode.current.resume(); setCameraPaused(false); } catch {}
  }

  /* --------------------- decode -> preview flow --------------------- */
  async function onDecode(text) {
    if (!eventId) return;

    // debounce + dedupe
    const now = Date.now();
    if (now - lastFireAt.current < 500) return;
    lastFireAt.current = now;
    if (text && text === lastScan) return;
    setLastScan(text);

    const actorId = extractActorId(text);
    const body = actorId ? { eventId, actorId, preview: true } : { eventId, token: text, preview: true };

    try {
      await pauseCamera(); // keep <video> in DOM to avoid play() warning
      const res = await previewTrigger(body).unwrap();
      const { actorRole, actor, alreadyCheckedIn, lastCheckinAt } = res?.data || {};
      if (!actorRole) throw new Error("No role resolved");
      setPreview({
        actorRole,
        actor: actor || {},
        actorId: actorId || null,
        token: actorId ? null : text,
        alreadyCheckedIn: !!alreadyCheckedIn,
        lastCheckinAt: lastCheckinAt || null,
      });
      setPreviewOpen(true);
    } catch (e) {
      alert(`Scan failed: ${e?.data?.message || e?.message || "unknown error"}`);
      await resumeCamera();
    }
  }

  async function confirmCheckin() {
    if (!preview || !eventId) return;
    const { actorRole, actorId, token } = preview;
    try {
      const res = await confirmTrigger(
        actorId ? { eventId, actorId, actorRole } : { eventId, token }
      ).unwrap();

      // success toast
      const total = res?.data?.eventCheckins;
      setToast({ open: true, type: "success", message: `Checked-in ✔${Number.isFinite(total) ? ` • Total: ${total}` : ""}` });

      setPreviewOpen(false);
      await resumeCamera();
    } catch (e) {
      setToast({ open: true, type: "error", message: `Check-in failed: ${e?.data?.message || e?.message || "unknown error"}` });
      // keep modal open so operator can retry
    }
  }

  async function cancelPreview() {
    setPreviewOpen(false);
    await resumeCamera();
  }

  async function manualSubmit(v) {
    if (!eventId) return;
    const actorId = extractActorId(v);
    const body = actorId ? { eventId, actorId, preview: true } : { eventId, token: v, preview: true };
    try {
      await pauseCamera();
      const res = await previewTrigger(body).unwrap();
      const { actorRole, actor, alreadyCheckedIn, lastCheckinAt } = res?.data || {};
      setPreview({
        actorRole,
        actor: actor || {},
        actorId: actorId || null,
        token: actorId ? null : v,
        alreadyCheckedIn: !!alreadyCheckedIn,
        lastCheckinAt: lastCheckinAt || null,
      });
      setPreviewOpen(true);
    } catch (e) {
      setToast({ open: true, type: "error", message: `Lookup failed: ${e?.data?.message || e?.message || "unknown error"}` });
      await resumeCamera();
    }
  }

  /* ------------------------------ UI ------------------------------ */
  return (
    <div className="p-6 space-y-6">
      {/* Toast */}
      <Toast open={toast.open} type={toast.type} message={toast.message} onClose={() => setToast((x) => ({ ...x, open: false }))} />

      {/* Header */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Event Check-in (Scan)</h1>
          <p className="text-sm text-zinc-600">Scan a QR → preview actor → confirm attendance.</p>
        </div>
        {!eventIdProp && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-500">Event</span>
            <select
              className="border rounded-xl px-3 py-2"
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              title="Choose event"
            >
              {events.map((ev) => (
                <option key={ev._id} value={ev._id}>{ev.title || ev.name || ev._id}</option>
              ))}
            </select>
            <Link to="/admin/event/attendace" className="btn primary fs-6">see attandece list</Link>
          </div>
        )}
      </header>

      {/* Content */}
      <div className="grid grid-cols-1 md:grid-cols-[380px,1fr] gap-6 items-start">
        {/* Scanner */}
        <section className="bg-white rounded-2xl shadow p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="font-semibold">Scanner</div>
            <div className="flex gap-2">
              {!cameraOn ? (
                <button
                  className="px-4 py-2 rounded-xl border-2 border-zinc-900 text-zinc-900 font-semibold hover:bg-zinc-900 hover:text-white transition"
                  onClick={startCamera}
                  title="Request Camera Permissions"
                >
                  📷 Enable Camera
                </button>
              ) : (
                <>
                  {!cameraPaused ? (
                    <button className="px-3 py-2 rounded-xl border text-zinc-700 hover:bg-zinc-50" onClick={pauseCamera}>Pause</button>
                  ) : (
                    <button className="px-3 py-2 rounded-xl border text-zinc-700 hover:bg-zinc-50" onClick={resumeCamera}>Resume</button>
                  )}
                  <button className="px-3 py-2 rounded-xl border text-zinc-700 hover:bg-zinc-50" onClick={stopCamera}>Stop</button>
                </>
              )}
            </div>
          </div>

          {/* Keep the scan box EMPTY; library owns children */}
          <div className="relative">
            <div id={scanBoxId} className="rounded-xl overflow-hidden bg-zinc-50 aspect-square" aria-label="QR scanner area" />
            {!cameraOn && (
              <div className="pointer-events-none absolute inset-0 grid place-items-center">
                <span className="text-zinc-500 text-sm">Click “Enable Camera” to start</span>
              </div>
            )}
          </div>

          {/* Manual input */}
          <form
            className="mt-4 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const v = e.currentTarget.elements.namedItem("manual")?.value || "";
              manualSubmit(String(v));
            }}
          >
            <input name="manual" className="flex-1 border rounded-xl px-3 py-2 w-50" placeholder="Paste QR URL / token / actorId" />
            <button className="px-3 py-2 rounded-xl bg-zinc-900 text-white" disabled={previewState.isLoading}>
              {previewState.isLoading ? "Checking…" : "Check"}
            </button>
          </form>

          <div className="mt-2 text-xs text-zinc-500 break-all">
            {lastScan && <>Last scan: {lastScan}</>}
          </div>
        </section>

        {/* Right column – light instructions */}
        <section className="bg-white rounded-2xl shadow p-5">
          <div className="flex items-center gap-2 mb-2">
            <Pill tone="violet">Selected event</Pill>
            <div className="font-medium">{eventTitle || "—"}</div>
          </div>
          <ol className="list-decimal pl-5 text-sm text-zinc-700 space-y-1">
            <li>Press <strong>Enable Camera</strong>.</li>
            <li>Point at the attendee/exhibitor/speaker QR.</li>
            <li>Modal shows details, role, and check-in status.</li>
            <li>Press <strong>Confirm check-in</strong>.</li>
          </ol>
        </section>
      </div>

      {/* Preview modal */}
      <Modal open={previewOpen && !!preview} onClose={cancelPreview} title="Confirm attendance">
        {!preview ? null : (
          <>
            {/* Header strip */}
            <div className="flex gap-4 items-center mb-4">
              <div className="w-20 h-20 rounded-xl overflow-hidden bg-zinc-100 flex items-center justify-center">
                {preview.actor?.avatar ? (
                  <img src={imageLink(preview.actor.avatar)} alt="" className="w-full h-full object-cover" />
                ) : <span className="text-2xl">👤</span>}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <div className="font-semibold text-lg truncate">{preview.actor?.name || "—"}</div>
                  <Pill tone="emerald">{String(preview.actorRole || "—").toUpperCase()}</Pill>
                </div>
                <div className="text-xs text-zinc-500 truncate">{eventTitle || "—"}</div>
              </div>
            </div>

            {/* Status line about prior check-in */}
            <div className="mb-3">
              {preview.alreadyCheckedIn ? (
                <Pill tone="amber">Already checked-in • {fmt(preview.lastCheckinAt)}</Pill>
              ) : (
                <Pill tone="slate">Not checked-in yet</Pill>
              )}
            </div>

            {/* Details grid */}
            <div className="grid gap-3">
              <KV k="Email" v={preview.actor?.email || "—"} />
              <KV k="Organization" v={preview.actor?.organization || "—"} />
              <KV k="Event" v={eventTitle || "—"} />
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button className="px-3 py-2 rounded-xl border" onClick={cancelPreview}>Cancel</button>
              <button
                className="px-4 py-2 rounded-xl bg-zinc-900 text-white"
                onClick={confirmCheckin}
                disabled={confirmState.isLoading}
              >
                {confirmState.isLoading ? "Confirming…" : (preview.alreadyCheckedIn ? "Confirm again" : "Confirm check-in")}
              </button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
