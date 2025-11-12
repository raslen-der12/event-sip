// src/pages/admin/scan/AdminScanMeet.jsx
import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { useAdminScanMeetMutation } from "../../../features/meetings/meetingsApiSlice";
import imageLink from "../../../utils/imageLink";
import { Link } from "react-router-dom";

/* ---------- utils ---------- */
const isHex24 = (s) => /^[0-9a-fA-F]{24}$/.test(String(s || ""));
const isFilled = (v) => v !== undefined && v !== null && String(v).trim() !== "";

function parseMeetPayload(input) {
  const s = String(input || "").trim();

  // JSON like {"meetId":"...", "actorId":"..."}
  try {
    const j = JSON.parse(s);
    const meetId = j.meetId || j.meetingId || j.meet || j.m || "";
    const actorId = j.actorId || j.actor || j.id || "";
    if (isHex24(meetId) && isHex24(actorId)) return { meetId, actorId };
  } catch {}

  // URL with ?meetId=&actorId=
  try {
    const u = new URL(s);
    const meetId = u.searchParams.get("meetId") || "";
    const actorId = u.searchParams.get("actorId") || "";
    if (isHex24(meetId) && isHex24(actorId)) return { meetId, actorId };
  } catch {}

  // Path fragments /.../<meetId>/<actorId>
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
    <div className="fixed inset-0 z-[1000] bg-black/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-full sm:max-w-xl"
        onClick={(e)=>e.stopPropagation()}
      >
        <div className="px-4 sm:px-5 py-3 sm:py-4 border-b flex items-center justify-between">
          <div className="font-semibold text-base sm:text-lg">{title}</div>
          <button className="px-3 py-1.5 rounded-md border" onClick={onClose}>Close</button>
        </div>
        <div className="p-4 sm:p-5">{children}</div>
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
function Row({ label, children }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[140px,1fr] gap-1.5 sm:gap-2 min-w-0">
      <div className="text-zinc-500 sm:text-right">{label}</div>
      <div className="font-medium break-words break-all min-w-0">{children}</div>
    </div>
  );
}
function AvatarName({ avatar, name, email }) {
  return (
    <div className="flex items-center gap-3 min-w-0">
      <div className="w-12 h-12 rounded-lg overflow-hidden bg-zinc-100 grid place-items-center">
        {avatar ? <img src={imageLink(avatar)} className="w-full h-full object-cover" alt="" /> : <span>👤</span>}
      </div>
      <div className="min-w-0">
        <div className="font-semibold truncate">{isFilled(name) ? name : "—"}</div>
        <div className="text-xs text-zinc-500 truncate">{isFilled(email) ? email : "—"}</div>
      </div>
    </div>
  );
}

/* ---------- page ---------- */
export default function AdminScanMeet() {
  const scanBoxId = "qr-meet-scan";
  const qrcode = useRef(null);
  const starting = useRef(false);
  const mounted = useRef(true);
  const lastFireAt = useRef(0);

  const [cameraOn, setCameraOn] = useState(false);
  const [cameraPaused, setCameraPaused] = useState(false);
  const [lastScan, setLastScan] = useState("");
  const [kind, setKind] = useState("physical"); // "physical" | "virtual"

  const [trigger, { isLoading }] = useAdminScanMeetMutation();

  // preview state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [preview, setPreview] = useState(null);
  // { meetId, actorId, you:{actorId,role,name,email,avatar}, other:{...}, alreadyCheckedIn, otherCheckedIn, happened, ... }

  // toast
  const [toast, setToast] = useState({ open:false, type:"info", message:"" });
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

  /* camera lifecycle */
  async function startCamera() {
    if (cameraOn || starting.current) return;
    starting.current = true;
    try {
      const el = document.getElementById(scanBoxId);
      if (!el) throw new Error("Scan container missing");
      el.innerHTML = "";
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
      console.error(e);
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
  async function pauseCam()  { if (cameraOn && qrcode.current) try { await qrcode.current.pause(true); setCameraPaused(true);} catch {} }
  async function resumeCam() { if (cameraOn && qrcode.current) try { await qrcode.current.resume(); setCameraPaused(false);} catch {} }

  /* decode → preview */
  async function onDecode(text) {
    const now = Date.now();
    if (now - lastFireAt.current < 500) return;
    lastFireAt.current = now;
    if (text && text === lastScan) return;
    setLastScan(text);

    const pair = parseMeetPayload(text);
    if (!pair) return;
    await pauseCam();
    await doPreview(pair);
  }

  async function doPreview({ meetId, actorId }) {
    try {
      const res = await trigger({ meetId, actorId, kind, preview: true }).unwrap();
      const d = res?.data || {};
      setPreview({ meetId, actorId, kind, ...d });
      setPreviewOpen(true);
    } catch (e) {
      setToast({ open:true, type:"error", message: e?.data?.message || e?.message || "Scan failed" });
      await resumeCam();
    }
  }

  async function confirm() {
    if (!preview) return;
    try {
      const res = await trigger({ meetId: preview.meetId, actorId: preview.you?.actorId || preview.actorId, kind }).unwrap();
      const happened = !!res?.data?.happened;
      setPreviewOpen(false);
      setToast({ open:true, type:"success", message: happened ? "Meeting happened ✔" : "Attendance recorded ✔" });
      await resumeCam();
    } catch (e) {
      setToast({ open:true, type:"error", message: e?.data?.message || e?.message || "Check-in failed" });
    }
  }

  function closePreview() { setPreviewOpen(false); resumeCam(); }

  /* manual input */
  const [manual, setManual] = useState("");
  async function submitManual(e) {
    e.preventDefault();
    const pair = parseMeetPayload(manual);
    if (!pair) { setToast({ open:true, type:"warning", message:"Invalid meet/actor link"}); return; }
    await pauseCam();
    await doPreview(pair);
    setManual("");
  }

  /* UI */
  return (
    <div className="p-6 space-y-6">
      {/* header */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Meeting Check-in (Scan)</h1>
          <p className="text-sm text-zinc-600">Scan QR → preview → confirm. QR contains <code>meetId</code> and <code>actorId</code>.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-zinc-500">Type</span>
          <select className="border rounded-xl px-3 py-2" value={kind} onChange={(e)=>setKind(e.target.value)}>
            <option value="physical">Physical</option>
            <option value="virtual">Virtual</option>
          </select>
          <Link to="/admin/meet/attendace" className="btn primary fs-6">see meetings attandece list</Link>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-[380px,1fr] gap-6 items-start">
        {/* scanner */}
        <section className="bg-white rounded-2xl shadow p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="font-semibold">Scanner</div>
            <div className="flex gap-2">
              {!cameraOn ? (
                <button className="px-4 py-2 rounded-xl border-2 border-zinc-900 text-zinc-900 font-semibold hover:bg-zinc-900 hover:text-white transition"
                        onClick={startCamera}>
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
            <div id={scanBoxId} className="rounded-xl overflow-hidden bg-zinc-50 w-full max-w-[360px] mx-auto aspect-square" aria-label="QR scanner area" />
            {!cameraOn && (
              <div className="pointer-events-none absolute inset-0 grid place-items-center">
                <span className="text-zinc-500 text-sm">Click “Enable Camera” to start</span>
              </div>
            )}
          </div>

          <form className="mt-4 flex flex-col sm:flex-row gap-2" onSubmit={submitManual}>
            <input
              className="flex-1 min-w-0 border rounded-xl px-3 py-2"
              placeholder="Paste QR link (…?meetId=...&actorId=...) or JSON"
              value={manual}
              onChange={(e)=>setManual(e.target.value)}
            />
            <button className="px-3 py-2 rounded-xl bg-zinc-900 text-white" disabled={isLoading}>
              {isLoading ? "Checking…" : "Check"}
            </button>
          </form>

          <div className="mt-2 text-xs text-zinc-500 break-all">{lastScan && <>Last scan: {lastScan}</>}</div>
        </section>

        {/* helper */}
        <section className="bg-white rounded-2xl shadow p-5">
          <div className="font-semibold mb-2">How it works</div>
          <ol className="list-decimal pl-5 text-sm text-zinc-700 space-y-1">
            <li>QR contains <code>meetId</code> and <code>actorId</code>.</li>
            <li>Preview shows both participants (name, email) and current state.</li>
            <li>Confirm to record attendance. When both present, meeting is marked as <strong>happened</strong>.</li>
          </ol>
        </section>
      </div>

      {/* preview modal */}
      <Modal open={previewOpen && !!preview} onClose={closePreview} title="Confirm meeting attendance">
        {!preview ? null : (
          <>
            <div className="grid gap-4">
              <Row label="Meet ID">{preview.meetId}</Row>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-zinc-500 mb-1">You</div>
                  <div className="flex items-center justify-between">
                    <AvatarName
                      avatar={preview.you?.avatar}
                      name={preview.you?.name}
                      email={preview.you?.email}
                    />
                    <Pill tone="slate">{String(preview.you?.role || "").toUpperCase()}</Pill>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-zinc-500 mb-1">Other participant</div>
                  <div className="flex items-center justify-between">
                    <AvatarName
                      avatar={preview.other?.avatar}
                      name={preview.other?.name}
                      email={preview.other?.email}
                    />
                    <Pill tone="slate">{String(preview.other?.role || "").toUpperCase()}</Pill>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {preview.alreadyCheckedIn ? <Pill tone="emerald">You checked-in</Pill> : <Pill tone="zinc">You not checked-in</Pill>}
                {preview.otherCheckedIn ? <Pill tone="amber">Other checked-in</Pill> : <Pill tone="zinc">Other not checked-in</Pill>}
                {preview.happened ? <Pill tone="emerald">Meeting happened</Pill> : <Pill tone="zinc">Waiting both</Pill>}
                {preview.youWereFirst
                  ? <Pill tone="amber">You were first</Pill>
                  : (preview.firstArrived?.actorId ? <Pill tone="amber">First: {preview.firstArrived.actorId}</Pill> : <Pill>First: —</Pill>)}
              </div>

              <div className="grid gap-2">
                <Row label="You checked at">{preview.youCheckedInAt ? new Date(preview.youCheckedInAt).toLocaleString() : "—"}</Row>
                <Row label="Other checked at">{preview.otherCheckedInAt ? new Date(preview.otherCheckedInAt).toLocaleString() : "—"}</Row>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button className="px-3 py-2 rounded-xl border" onClick={closePreview}>Cancel</button>
              <button
                className="px-4 py-2 rounded-xl bg-zinc-900 text-white"
                onClick={confirm}
                disabled={isLoading}
              >
                {isLoading ? "Confirming…" : (preview.happened ? "Confirm again" : "Confirm check-in")}
              </button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
