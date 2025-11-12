import React, { useEffect, useMemo, useState } from "react";
import {
  useAdminCreatePollMutation,
  useAdminListPollsQuery,
  useAdminStartPollMutation,
  useAdminStopPollMutation,
  useAdminPollResultsQuery,
  useGetPublicPollQuery,
} from "../../../features/tools/pollApiSlice";
import QRCode from "qrcode";

const FRONT = process.env.REACT_APP_FRONTEND_URL || window.location.origin;

/* utils */
const cx = (...a) => a.filter(Boolean).join(" ");
const fmt = (v) => (v ? new Date(v).toLocaleString() : "—");
const msLeft = (iso) => (!iso ? 0 : Math.max(0, new Date(iso).getTime() - Date.now()));
function useCountdown(iso) {
  const [left, setLeft] = useState(() => msLeft(iso));
  useEffect(() => {
    setLeft(msLeft(iso));
    if (!iso) return;
    const t = setInterval(() => setLeft(msLeft(iso)), 1000);
    return () => clearInterval(t);
  }, [iso]);
  const s = Math.ceil(left / 1000);
  return {
    leftMs: left,
    h: Math.floor(s / 3600),
    m: Math.floor((s % 3600) / 60),
    s: s % 60,
  };
}
async function makeQr(text) {
  try {
    return await QRCode.toDataURL(text, { errorCorrectionLevel: "M", margin: 1, scale: 8 });
  } catch {
    return `https://chart.googleapis.com/chart?cht=qr&chs=512x512&chl=${encodeURIComponent(text)}`;
  }
}

/* UI bits */
function Modal({ open, title, onClose, children, wide = false }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[1000] bg-black/40 backdrop-blur-sm p-3 sm:p-4" onClick={onClose}>
      <div
        className={cx(
          "bg-white rounded-2xl shadow-xl w-full my-4 mx-auto",
          wide ? "max-w-full sm:max-w-5xl" : "max-w-full sm:max-w-2xl"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 sm:px-5 py-4 border-b flex items-center justify-between gap-2">
          <div className="font-semibold text-base sm:text-lg truncate">{title}</div>
          <button className="px-3 py-1.5 rounded-md border text-sm sm:text-base" onClick={onClose}>Close</button>
        </div>
        <div className="p-4 sm:p-5">{children}</div>
      </div>
    </div>
  );
}
function Stat({ k, v }) {
  return (
    <div className="px-3 py-2 sm:px-4 sm:py-3 bg-zinc-50 rounded-xl min-w-[98px] text-center">
      <div className="text-[11px] sm:text-xs text-zinc-500">{k}</div>
      <div className="font-semibold text-sm sm:text-base">{v}</div>
    </div>
  );
}

/* Page */
export default function AdminPollsPage() {
  /* lists (fast polling) */
  const { data: listRes, refetch } = useAdminListPollsQuery({}, { pollingInterval: 3000 });
  const running  = listRes?.running  || [];
  const upcoming = listRes?.upcoming || [];
  const finished = listRes?.finished || [];
  const counts   = listRes?.counts   || {};

  /* create form state */
  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [options, setOptions] = useState(["Yes", "No"]);
  const [manualStop, setManualStop] = useState(true);
  const [hh, setHH] = useState(0);
  const [mm, setMM] = useState(0);
  const [ss, setSS] = useState(0);

  const durationSec = useMemo(() => {
    if (manualStop) return 0;
    const H = Math.max(0, Number(hh) || 0);
    const M = Math.max(0, Number(mm) || 0);
    const S = Math.max(0, Number(ss) || 0);
    return H * 3600 + M * 60 + S;
  }, [manualStop, hh, mm, ss]);

  const [adminCreatePoll, createState] = useAdminCreatePollMutation();

  function addOption() { setOptions((a) => [...a, ""]); }
  function setOption(i, v) { setOptions((a) => a.map((x, idx) => (idx === i ? v : x))); }
  function delOption(i) { setOptions((a) => a.filter((_, idx) => idx !== i)); }
  function validOptions(arr) {
    const list = (arr || []).map((s) => String(s).trim()).filter(Boolean);
    return Array.from(new Set(list));
  }
  async function submitCreate(e) {
    e.preventDefault();
    const opts = validOptions(options);
    if (!title.trim()) return alert("Title required");
    if (opts.length < 2) return alert("At least two options");
    if (!manualStop && durationSec <= 0) return alert("Set a positive duration or choose Manual stop");

    await adminCreatePoll({ title: title.trim(), options: opts, manualStop: !!manualStop, durationSec }).unwrap();
    setCreateOpen(false);
    setTitle(""); setOptions(["Yes", "No"]); setManualStop(true);
    setHH(0); setMM(0); setSS(0);
    refetch();
  }

  /* start/stop/results/QR */
  const [pickedId, setPickedId] = useState(null);
  const [startOpen, setStartOpen] = useState(false);
  const [resultsOpen, setResultsOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);

  const [adminStartPoll, startState] = useAdminStartPollMutation();
  const [adminStopPoll,  stopState]  = useAdminStopPollMutation();

  const { data: resultsRes } = useAdminPollResultsQuery(
    pickedId ? { id: pickedId } : { skip: true },
    { skip: !pickedId, pollingInterval: resultsOpen ? 2000 : 0 }
  );

  const pollUrl = pickedId ? `${FRONT}/poll/${pickedId}` : "";
  const { data: pub } = useGetPublicPollQuery(pickedId, { skip: !pickedId || !qrOpen, pollingInterval: qrOpen ? 2000 : 0 });
  const { h, m, s } = useCountdown(pub?.data?.endsAt || null);

  const [qr, setQr] = useState("");
  useEffect(() => {
    let live = true;
    if (qrOpen && pollUrl) makeQr(pollUrl).then((d) => live && setQr(d));
    else setQr("");
    return () => { live = false; };
  }, [qrOpen, pollUrl]);

  function openStart(id) { setPickedId(id); setStartOpen(true); }
  function openResults(id) { setPickedId(id); setResultsOpen(true); }
  function openQR(id) { setPickedId(id); setQrOpen(true); }

  async function doStart() {
    if (!pickedId) return;
    await adminStartPoll(pickedId).unwrap();
    setStartOpen(false);
    refetch();
  }
  async function doStop() {
    if (!pickedId) return;
    await adminStopPoll(pickedId).unwrap();
    setQrOpen(false);
    refetch();
  }

  /* list block */
  const Block = ({ title, items, kind }) => (
    <section className="bg-white rounded-2xl shadow p-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
        <h3 className="font-semibold text-base">{title}</h3>
        {kind === "running" && <div className="text-xs text-zinc-500">Auto-refreshing…</div>}
      </div>
      {items.length === 0 ? (
        <div className="text-sm text-zinc-500">No items.</div>
      ) : (
        <ul className="divide-y">
          {items.map((p) => (
            <li key={p._id} className="py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <div className="min-w-0 flex-1">
                <div className="font-medium truncate">{p.title}</div>
                <div className="text-[11px] sm:text-xs text-zinc-500 flex gap-x-3 gap-y-1 flex-wrap mt-1">
                  <span>Created: {fmt(p.createdAt)}</span>
                  {p.startedAt && <span>Started: {fmt(p.startedAt)}</span>}
                  {p.endsAt && <span>Ends: {fmt(p.endsAt)}</span>}
                  {p.stoppedAt && <span>Stopped: {fmt(p.stoppedAt)}</span>}
                </div>
              </div>

              {kind === "finished" && (
                <div className="flex flex-col sm:flex-row w-full sm:w-auto items-stretch sm:items-center gap-2">
                  <button className="w-full sm:w-auto px-3 py-2 rounded-lg border text-sm" onClick={() => openResults(p._id)}>Results</button>
                </div>
              )}

              {kind === "upcoming" && (
                <div className="flex flex-col sm:flex-row w-full sm:w-auto items-stretch sm:items-center gap-2">
                  <button className="w-full sm:w-auto px-3 py-2 rounded-lg border text-sm" onClick={() => openStart(p._id)}>Start</button>
                  <button className="w-full sm:w-auto px-3 py-2 rounded-lg border text-sm" onClick={() => openResults(p._id)}>Preview</button>
                </div>
              )}

              {kind === "running" && (
                <div className="flex flex-col sm:flex-row w-full sm:w-auto items-stretch sm:items-center gap-2">
                  <a
                    className="w-full sm:w-auto px-3 py-2 rounded-lg border text-sm text-center"
                    href={`${FRONT}/poll/${p._id}`} target="_blank" rel="noreferrer"
                  >
                    Open
                  </a>
                  <button className="w-full sm:w-auto px-3 py-2 rounded-lg border text-sm" onClick={() => openQR(p._id)}>Show QR</button>
                  <button
                    className="w-full sm:w-auto px-3 py-2 rounded-lg border text-sm border-red-600 text-red-600"
                    onClick={() => { setPickedId(p._id); doStop(); }}
                  >
                    Stop
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* header */}
      <header className="space-y-3 sm:space-y-0 sm:flex sm:items-start sm:justify-between">
  <div className="min-w-0">
    <h1 className="text-2xl font-bold">Polls</h1>
    <p className="text-sm text-zinc-600">Create → start → share QR → stop → view results.</p>
  </div>

  {/* Right: stats + button (stack on mobile, inline on sm+) */}
  <div className="w-full sm:w-auto sm:flex sm:items-center sm:gap-3">
    <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:items-center">
      <Stat k="Running" v={counts?.running ?? 0} />
      <Stat k="Upcoming" v={counts?.upcoming ?? 0} />
      <Stat k="Finished" v={counts?.finished ?? 0} />
    </div>
    <button
      className="mt-2 w-full sm:mt-0 sm:w-auto px-4 py-2 rounded-xl bg-zinc-900 text-white"
      onClick={() => setCreateOpen(true)}
    >
      + New poll
    </button>
  </div>
</header>


      {/* lists */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Block title="Upcoming" items={upcoming} kind="upcoming" />
        <Block title="Running" items={running} kind="running" />
        <Block title="Finished" items={finished} kind="finished" />
      </div>

      {/* create modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create poll">
        <form className="space-y-5" onSubmit={submitCreate}>
          <div>
            <label className="block text-sm text-zinc-600 mb-1">Title</label>
            <input className="w-full border rounded-xl px-3 py-2" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>

          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-1">
              <label className="text-sm text-zinc-600">Options</label>
              <button type="button" className="px-2 py-1 rounded-lg border text-sm w-full sm:w-auto" onClick={addOption}>+ Add option</button>
            </div>
            <div className="grid gap-2">
              {options.map((v, i) => (
                <div key={i} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <input
                        className="min-w-0 flex-1 w-full border rounded-xl px-3 py-2"
                        placeholder={`Option ${i + 1}`}
                        value={v}
                        onChange={(e) => setOption(i, e.target.value)}
                    />
                    <button
                        type="button"
                        className="w-full sm:w-auto px-3 py-2 rounded-xl border text-zinc-700 text-sm disabled:opacity-40"
                        onClick={() => delOption(i)}
                        disabled={options.length <= 2}
                        title={options.length <= 2 ? "At least 2 options required" : "Remove"}
                    >
                        Remove
                    </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-zinc-50 rounded-xl p-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={manualStop} onChange={(e) => setManualStop(e.target.checked)} />
                <span className="text-sm">Manual stop</span>
              </label>
              {!manualStop && <span className="text-xs text-zinc-500">Ends automatically after the duration below</span>}
            </div>

            {!manualStop && (
              <div className="grid grid-cols-3 gap-3 mt-3">
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Hours</label>
                  <input type="number" min="0" className="w-full border rounded-xl px-3 py-2" value={hh} onChange={(e) => setHH(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Minutes</label>
                  <input type="number" min="0" className="w-full border rounded-xl px-3 py-2" value={mm} onChange={(e) => setMM(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Seconds</label>
                  <input type="number" min="0" className="w-full border rounded-xl px-3 py-2" value={ss} onChange={(e) => setSS(e.target.value)} />
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2">
            <button type="button" className="w-full sm:w-auto px-3 py-2 rounded-xl border">Cancel</button>
            <button className="w-full sm:w-auto px-4 py-2 rounded-xl bg-zinc-900 text-white" disabled={createState.isLoading}>
              {createState.isLoading ? "Creating…" : "Create"}
            </button>
          </div>
        </form>
      </Modal>

      {/* start modal */}
      <Modal open={startOpen} onClose={() => setStartOpen(false)} title="Start poll">
        <div className="text-sm text-zinc-700">
          <p>Start is always manual. If the poll was created with a duration, it will auto-stop when the countdown ends. Otherwise you can stop it manually.</p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2 mt-5">
          <button className="w-full sm:w-auto px-3 py-2 rounded-xl border" onClick={() => setStartOpen(false)}>Cancel</button>
          <button className="w-full sm:w-auto px-4 py-2 rounded-xl bg-zinc-900 text-white" onClick={doStart} disabled={startState.isLoading}>
            {startState.isLoading ? "Starting…" : "Start now"}
          </button>
        </div>
      </Modal>

      {/* results modal */}
      <Modal open={resultsOpen} onClose={() => setResultsOpen(false)} title="Poll results" wide>
        {!resultsRes?.ok ? (
          <div className="text-sm text-zinc-500">Loading…</div>
        ) : (
          <div className="space-y-4">
            <div className="font-semibold text-base sm:text-lg break-words">{resultsRes.data?.title}</div>
            <div className="text-xs text-zinc-500">
              Status: <span className="font-medium">{resultsRes.data?.status}</span> • Total votes:{" "}
              <span className="font-medium">{resultsRes.data?.total ?? 0}</span>
            </div>
            <div className="grid gap-3">
              {(resultsRes.data?.options || []).map((o) => (
                <div key={o.key}>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm gap-1">
                    <div className="font-medium break-words">{o.label}</div>
                    <div className="text-zinc-600">{o.count} ({o.pct}%)</div>
                  </div>
                  <div className="h-2 bg-zinc-100 rounded">
                    <div className="h-2 bg-zinc-900 rounded" style={{ width: `${Math.max(2, o.pct)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      {/* QR fullscreen */}
      {qrOpen && (
        <div className="fixed inset-0 z-[1200] bg-white text-zinc-900 flex flex-col items-center justify-center p-4 sm:p-6 gap-6">
          <div className="absolute top-3 right-3 sm:top-4 sm:right-4 flex gap-2">
            <button className="px-3 py-2 rounded-xl border text-sm sm:text-base" onClick={() => setQrOpen(false)}>
              Exit full screen
            </button>
          </div>

          <div className="text-center px-3">
            <div className="text-xl sm:text-2xl font-bold mb-1 break-words">Scan to vote</div>
            <div className="text-xs sm:text-sm text-zinc-500 break-all">{pollUrl}</div>
          </div>

          <div
            className="rounded-xl overflow-hidden grid place-items-center bg-zinc-100"
            style={{ width: "min(82vw, 82vh)", height: "min(82vw, 82vh)" }}
          >
            {qr ? (
              <img src={qr} alt="Poll QR" className="w-full h-full object-contain" />
            ) : (
              <div className="text-zinc-500 text-sm">Generating QR…</div>
            )}
          </div>

          {/* timer / stop */}
          {pub?.data?.status === "running" && pub?.data?.endsAt ? (
            <div className="text-2xl sm:text-3xl font-mono tracking-widest">
              {String(h).padStart(2, "0")}:{String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
            </div>
          ) : pub?.data?.status === "running" ? (
            <button
              className="w-full sm:w-auto px-5 py-3 rounded-xl border-2 border-red-600 text-red-700 font-semibold"
              onClick={doStop}
              disabled={stopState.isLoading}
            >
              {stopState.isLoading ? "Stopping…" : "Stop this poll"}
            </button>
          ) : (
            <div className="text-sm text-zinc-500">{pub?.data?.status ? `Status: ${pub.data.status}` : "Awaiting status…"}</div>
          )}
        </div>
      )}
    </div>
  );
}
