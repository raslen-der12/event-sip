// src/pages/admin/members/AdminScanMeet.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { useAdminScanMeetMutation } from "../../../features/meetings/meetingsApiSlice";

/* --------------- utils --------------- */
const isHex24 = (s) => /^[0-9a-fA-F]{24}$/.test(String(s || ""));
const isFilled = (v) => v !== undefined && v !== null && String(v).trim() !== "";

function parseMeetLink(input) {
  const s = String(input || "").trim();
  // JSON support
  try {
    const j = JSON.parse(s);
    const meetId  = j.meetId || j.meetingId || j.meet || j.m || "";
    const actorId = j.actorId || j.actor || j.id || "";
    if (isHex24(meetId) && isHex24(actorId)) return { meetId, actorId };
  } catch {}
  // URL with query ?meetId&actorId
  try {
    const u = new URL(s);
    const meetId  = u.searchParams.get("meetId")  || "";
    const actorId = u.searchParams.get("actorId") || "";
    if (isHex24(meetId) && isHex24(actorId)) return { meetId, actorId };
  } catch {}
  // last resort: /.../<meetId>/<actorId>
  const parts = s.split(/[/?#&]/).filter(Boolean);
  for (let i = 0; i + 1 < parts.length; i++) {
    const a = parts[i], b = parts[i + 1];
    if (isHex24(a) && isHex24(b)) return { meetId: a, actorId: b };
  }
  return null;
}

function Modal({ open, title, onClose, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[1000] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl" onClick={(e)=>e.stopPropagation()}>
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
    zinc:"bg-zinc-100 text-zinc-800", emerald:"bg-emerald-100 text-emerald-800",
    amber:"bg-amber-100 text-amber-800", red:"bg-red-100 text-red-800",
    slate:"bg-slate-100 text-slate-800"
  };
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${tones[tone] || tones.zinc}`}>{children}</span>;
}
function KV({ k, v }) {
  return (
    <div className="grid grid-cols-[150px,1fr] gap-2">
      <div className="text-zinc-500">{k}</div>
      <div className="font-medium break-words">{isFilled(v) ? v : "—"}</div>
    </div>
  );
}
function Toast({ open, type = "success", message = "", onClose }) {
  if (!open) return null;
  const palette = { success:"bg-emerald-600", error:"bg-red-600", info:"bg-zinc-800", warning:"bg-amber-600" };
  return (
    <div className="fixed top-4 right-4 z-[1100]">
      <div className={`text-white px-4 py-3 rounded-xl shadow-lg ${palette[type] || palette.info}`}>
        <div className="font-semibold">{message}</div>
        <button className="ml-3 underline" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

/* --------------- page --------------- */
export default function AdminScanMeet() {
  const scanBoxId = "qr-meet-scan";
  const qrcode = useRef(null);
  const starting = useRef(false);
  const mounted = useRef(true);
  const lastFireAt = useRef(0);

  const [cameraOn, setCameraOn] = useState(false);
  const [cameraPaused, setCameraPaused] = useState(false);
  const [lastScan, setLastScan] = useState("");
  const [kind, setKind] = useState("physical"); // physical | virtual

  const [mutate, { isLoading: working }] = useAdminScanMeetMutation();

  // preview modal
  const [preview, setPreview] = useState(null); // { meetId, actorId, you, other, flags... }
  const [previewOpen, setPreviewOpen] = useState(false);

  // toast
  const [toast, setToast] = useState({ open:false, type:"success", message:"" });
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
  useEffect(() => {
    if (!toast.open) return;
    const t = setTimeout(() => setToast((x)=>({ ...x, open:false })), 2200);
    return () => clearTimeout(t);
  }, [toast.open]);

  // load from URL ?meetId&actorId (for direct link)
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const meetId = sp.get("meetId");
    const actorId = sp.get("actorId");
    if (isHex24(meetId) && isHex24(actorId)) {
      previewLookup({ meetId, actorId });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- camera lifecycle ---------- */
  async function startCamera() {
    if (cameraOn || starting.current) return;
    starting.current = true;
    try {
      const el = document.getElementById(scanBoxId);
      if (!el) throw new Error("Scan container missing");
      el.innerHTML = ""; // keep empty — html5-qrcode controls its children
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
    if (mounted.current) { setCameraOn(false); setCameraPaused(false); }
  }
  async function pauseCam()  { if (cameraOn && qrcode.current) { try { await qrcode.current.pause(true); setCameraPaused(true);} catch {} } }
  async function resumeCam() { if (cameraOn && qrcode.current) { try { await qrcode.current.resume(); setCameraPaused(false);} catch {} } }

  /* ---------- decode → preview ---------- */
  async function onDecode(text) {
    const now = Date.now();
    if (now - lastFireAt.current < 500) return;
    lastFireAt.current = now;
    if (text && text === lastScan) return;
    setLastScan(text);

    const pair = parseMeetLink(text);
    if (!pair) return;
    await pauseCam();
    await previewLookup(pair);
  }

  async function previewLookup({ meetId, actorId }) {
    try {
      const res = await mutate({ meetId, actorId, kind, preview: true }).unwrap();
      const d = res?.data || {};
      setPreview({ meetId, actorId, kind, ...d });
      setPreviewOpen(true);
    } catch (e) {
      setToast({ open:true, type:"error", message: e?.data?.message || e?.message || "Scan failed" });
      await resumeCam();
    }
  }

  async function confirmCheckin() {
    if (!preview) return;
    try {
      const res = await mutate({ meetId: preview.meetId, actorId: preview.actorId, kind }).unwrap();
      const happened = !!res?.data?.happened;
      setPreviewOpen(false);
      setToast({ open:true, type:"success", message: happened ? "Meeting marked as happened ✔" : "Attendance recorded ✔ (waiting other participant)" });
      await resumeCam();
    } catch (e) {
      setToast({ open:true, type:"error", message: e?.data?.message || e?.message || "Check-in failed" });
    }
  }
  async function cancelPreview() { setPreviewOpen(false); await resumeCam(); }

  /* ---------- manual ---------- */
  const [manual, setManual] = useState("");
  async function submitManual(e) {
    e.preventDefault();
    const pair = parseMeetLink(manual);
    if (!pair) { setToast({ open:true, type:"warning", message:"Invalid meet/actor link" }); return; }
    await pauseCam();
    await previewLookup(pair);
    setManual("");
  }

  /* ---------- UI ---------- */
  return (
    <div className="p-6 space-y-6">
      <Toast open={toast.open} type={toast.type} message={toast.message} onClose={() => setToast((x)=>({ ...x, open:false }))} />

      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Meeting Check-in (Scan)</h1>
          <p className="text-sm text-zinc-600">Scan a meet QR (contains meetId & actorId), preview state, then confirm.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-zinc-500">Type</span>
          <select className="border rounded-xl px-3 py-2" value={kind} onChange={(e)=>setKind(e.target.value)}>
            <option value="physical">Physical</option>
            <option value="virtual">Virtual</option>
          </select>
        </div>
      </header>

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
                    <button className="px-3 py-2 rounded-xl border text-zinc-700 hover:bg-zinc-50" onClick={pauseCam}>Pause</button>
                  ) : (
                    <button className="px-3 py-2 rounded-xl border text-zinc-700 hover:bg-zinc-50" onClick={resumeCam}>Resume</button>
                  )}
                  <button className="px-3 py-2 rounded-xl border text-zinc-700 hover:bg-zinc-50" onClick={stopCamera}>Stop</button>
                </>
              )}
            </div>
          </div>

          <div className="relative">
            <div id={scanBoxId} className="rounded-xl overflow-hidden bg-zinc-50 aspect-square" aria-label="QR scanner area" />
            {!cameraOn && (
              <div className="pointer-events-none absolute inset-0 grid place-items-center">
                <span className="text-zinc-500 text-sm">Click “Enable Camera” to start</span>
              </div>
            )}
          </div>

          <form className="mt-4 flex gap-2" onSubmit={submitManual}>
            <input
              className="flex-1 border rounded-xl px-3 py-2 w-50"
              placeholder="Paste QR link (…/admin/marking?meetId=...&actorId=...) or JSON"
              value={manual}
              onChange={(e)=>setManual(e.target.value)}
            />
            <button className="px-3 py-2 rounded-xl bg-zinc-900 text-white" disabled={working}>{working ? "Checking…" : "Check"}</button>
          </form>

          <div className="mt-2 text-xs text-zinc-500 break-all">{lastScan && <>Last scan: {lastScan}</>}</div>
        </section>

        {/* Helper */}
        <section className="bg-white rounded-2xl shadow p-5">
          <div className="flex items-center gap-2 mb-2">
            <Pill tone="slate">How it works</Pill>
          </div>
          <ol className="list-decimal pl-5 text-sm text-zinc-700 space-y-1">
            <li>QR contains <code>meetId</code> and <code>actorId</code>.</li>
            <li>We verify the actor is a participant (sender/receiver).</li>
            <li>Preview shows if <em>you</em> or the <em>other</em> already checked in and who arrived first.</li>
            <li>Confirm to mark attendance. When both present, meeting is marked as <strong>happened</strong>.</li>
          </ol>
        </section>
      </div>

      {/* Preview modal */}
      <Modal open={previewOpen && !!preview} onClose={cancelPreview} title="Confirm meeting attendance">
        {!preview ? null : (
          <>
            <div className="grid gap-3">
              <KV k="Meet ID" v={preview.meetId} />
              <KV k="Actor (you)" v={`${preview.you?.actorId || "—"} • ${String(preview.you?.role || "—").toUpperCase()}`} />
              <KV k="Other participant" v={`${preview.other?.actorId || "—"} • ${String(preview.other?.role || "—").toUpperCase()}`} />
            </div>

            <div className="my-4 flex flex-wrap gap-2">
              {preview.alreadyCheckedIn
                ? <Pill tone="emerald">You already checked-in</Pill>
                : <Pill tone="slate">You not checked-in</Pill>}
              {preview.otherCheckedIn
                ? <Pill tone="amber">Other already checked-in</Pill>
                : <Pill tone="slate">Other not checked-in</Pill>}
              {preview.happened
                ? <Pill tone="emerald">Meeting happened</Pill>
                : <Pill tone="zinc">Waiting both</Pill>}
              {preview.youWereFirst
                ? <Pill tone="amber">You were first</Pill>
                : (preview.firstArrived?.actorId ? <Pill tone="amber">First: {preview.firstArrived.actorId}</Pill> : <Pill>First: —</Pill>)}
            </div>

            <div className="grid gap-3">
              <KV k="You checked at" v={preview.youCheckedInAt && new Date(preview.youCheckedInAt).toLocaleString()} />
              <KV k="Other checked at" v={preview.otherCheckedInAt && new Date(preview.otherCheckedInAt).toLocaleString()} />
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button className="px-3 py-2 rounded-xl border" onClick={cancelPreview}>Cancel</button>
              <button className="px-4 py-2 rounded-xl bg-zinc-900 text-white" onClick={confirmCheckin} disabled={working}>
                {working ? "Confirming…" : (preview.happened ? "Confirm again" : "Confirm check-in")}
              </button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
