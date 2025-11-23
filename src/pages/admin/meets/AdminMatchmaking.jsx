// src/pages/admin/meets/AdminMatchmaking.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useGetAdminSuggestionsQuery } from "../../../features/meetings/meetingsApiSlice";
import { useRequestMeetingMutation } from "../../../features/Actor/toolsApiSlice";
import imageLink from "../../../utils/imageLink";
import { Dialog } from "@headlessui/react";

function initials(name = "") {
  const parts = String(name).trim().split(/\s+/);
  const a = (parts[0] || "").charAt(0);
  const b = (parts[1] || "").charAt(0);
  return (a + b).toUpperCase() || (a || "?").toUpperCase();
}

function Avatar({ src, name }) {
  const bg = src ? { backgroundImage: `url(${imageLink(src)})` } : {};
  return (
    <div
      className="w-12 h-12 rounded-full bg-zinc-200 bg-center bg-cover flex items-center justify-center shrink-0"
      style={bg}
    >
      {!src && (
        <span className="text-xs font-semibold text-zinc-600">
          {initials(name)}
        </span>
      )}
    </div>
  );
}

function fmtSlot(iso) {
  if (!iso) return "No slot selected";
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return String(iso || "");
  }
}

// helper: convert a datetime-local value to ISO string
function localInputToISO(v) {
  if (!v) return null;
  // v is like "2025-11-23T14:30" in local time
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

// helper: convert a Date -> datetime-local string ("YYYY-MM-DDTHH:mm")
function dateToLocalInput(d) {
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

export default function AdminMatchmaking() {
  const [sp, setSp] = useSearchParams();
  const eventId = sp.get("eventId") || "68e6764bb4f9b08db3ccec04";
  const suggIdQ = sp.get("suggId") || "";

  const { data: suggs = [], isFetching } = useGetAdminSuggestionsQuery({
    eventId,
  });
  const [requestMeeting, reqState] = useRequestMeetingMutation();
  console.log("suggs", suggs);

  // UI state
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState(null);
  const [sender, setSender] = useState("a");

  // slot picked by admin
  const [slotInput, setSlotInput] = useState(""); // datetime-local string
  const [slotError, setSlotError] = useState("");

  // Filters (pure client-side)
  const [q, setQ] = useState("");
  const [minScore, setMinScore] = useState(0);
  const [sortBy, setSortBy] = useState("score"); // 'score' | 'slot' | 'name'

  const byId = useMemo(
    () => new Map((suggs || []).map((s) => [s.suggId, s])),
    [suggs]
  );

  // Apply filters & sorting
  const view = useMemo(() => {
    let rows = Array.isArray(suggs) ? suggs.slice() : [];
    const qlc = q.trim().toLowerCase();
    if (qlc) {
      rows = rows.filter(
        (s) =>
          String(s?.a?.name || "").toLowerCase().includes(qlc) ||
          String(s?.b?.name || "").toLowerCase().includes(qlc)
      );
    }
    if (Number(minScore) > 0) {
      rows = rows.filter(
        (s) => Number(s.score || 0) >= Number(minScore)
      );
    }
    if (sortBy === "score") {
      rows.sort((a, b) => (b.score || 0) - (a.score || 0));
    } else if (sortBy === "slot") {
      // Most will have null slotISO now; push nulls to bottom
      rows.sort((a, b) => {
        const ta = a.slotISO
          ? new Date(a.slotISO).getTime()
          : Number.MAX_SAFE_INTEGER;
        const tb = b.slotISO
          ? new Date(b.slotISO).getTime()
          : Number.MAX_SAFE_INTEGER;
        return ta - tb;
      });
    } else if (sortBy === "name") {
      rows.sort((a, b) =>
        String(a.a?.name || "").localeCompare(String(b.a?.name || ""))
      );
    }
    return rows;
  }, [suggs, q, minScore, sortBy]);

  // Deep link: open modal when ?suggId= is present and exists
  useEffect(() => {
    if (suggIdQ && byId.has(suggIdQ)) {
      const s = byId.get(suggIdQ);
      setCurrent(s);
      setSender("a");
      setSlotInput("");
      setSlotError("");
      setOpen(true);
    }
  }, [suggIdQ, byId]);

  const openModal = (s) => {
    setCurrent(s);
    setSender("a");
    setSlotInput("");
    setSlotError("");
    sp.set("suggId", s.suggId);
    setSp(sp, { replace: true });
    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
    setCurrent(null);
    setSlotInput("");
    setSlotError("");
    sp.delete("suggId");
    setSp(sp, { replace: true });
  };

  const timezoneLabel = (() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return "your local timezone";
    }
  })();

  const applyQuickOffset = (minutes) => {
    const base = slotInput ? new Date(slotInput) : new Date();
    if (Number.isNaN(base.getTime())) return;
    const d = new Date(base.getTime() + minutes * 60 * 1000);
    setSlotInput(dateToLocalInput(d));
    setSlotError("");
  };

  const approveAndSend = async () => {
    if (!current) return;

    // Admin must choose a slot
    if (!slotInput) {
      setSlotError("Please choose a date & time for this meeting.");
      return;
    }
    const iso = localInputToISO(slotInput);
    if (!iso) {
      setSlotError("Invalid date/time value.");
      return;
    }

    const s = sender === "a" ? current.a : current.b;
    const r = sender === "a" ? current.b : current.a;
    const normRole = (x) => String(x || "attendee").toLowerCase();

    const body = {
      dateTimeISO: String(iso),
      receiverRole: normRole(r.role),
      receiverId: String(r.id),
      eventId: String(current.eventId),
      senderId: String(s.id),
      senderRole: normRole(s.role),
      // subject/message can stay defaulted in backend
    };

    try {
      setSlotError("");
      await requestMeeting(body).unwrap();
      closeModal();
    } catch (e) {
      console.error("requestMeeting failed", e);
      const msg =
        e?.data?.message ||
        "Failed to send request (maybe slot conflict or invalid date).";
      setSlotError(msg);
    }
  };

  return (
    <div className="p-6">
      {/* Header + filters */}
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Admin Matchmaking</h1>
          <div className="text-sm text-zinc-500">
            {isFetching ? "Loading…" : `${suggs.length} suggestions`}
          </div>
        </div>

        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <input
            className="h-9 w-full md:w-64 rounded-lg border px-3 text-sm"
            placeholder="Search by name…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <div className="flex items-center gap-2">
            <label className="text-sm text-zinc-600">Min score</label>
            <input
              type="number"
              min={0}
              className="h-9 w-20 rounded-lg border px-2 text-sm"
              value={minScore}
              onChange={(e) => setMinScore(e.target.value)}
            />
          </div>
          <select
            className="h-9 rounded-lg border px-2 text-sm"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            title="Sort"
          >
            <option value="score">Sort by score</option>
            <option value="slot">Sort by slot time</option>
            <option value="name">Sort by name (A)</option>
          </select>
        </div>
      </div>

      {/* List */}
      {isFetching && (
        <div className="grid gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border p-4 flex items-center justify-between animate-pulse"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-zinc-200" />
                <div className="w-44 h-4 bg-zinc-200 rounded" />
                <div className="text-zinc-300">⇄</div>
                <div className="w-12 h-12 rounded-full bg-zinc-200" />
                <div className="w-44 h-4 bg-zinc-200 rounded" />
              </div>
              <div className="flex items-center gap-3">
                <div className="w-20 h-6 bg-zinc-200 rounded-full" />
                <div className="w-20 h-8 bg-zinc-200 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!isFetching && (
        <div className="grid gap-3">
          {view.map((s) => (
            <button
              key={s.suggId}
              onClick={() => openModal(s)}
              className="text-left rounded-2xl border p-4 w-full hover:bg-zinc-50 transition flex items-center justify-between"
            >
              <div className="flex items-center gap-5">
                <div className="flex items-center gap-3 min-w-[260px]">
                  <Avatar src={s?.a?.photo} name={s?.a?.name} />
                  <div>
                    <div className="font-medium">{s?.a?.name}</div>
                    <div className="text-xs text-zinc-500">{s?.a?.role}</div>
                    <a
                      className="text-xs underline text-zinc-600 mt-1 inline-block"
                      href={s?.a?.adminLinks?.attendee}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      open details
                    </a>
                  </div>
                </div>

                <div className="px-2 py-1 text-xs rounded-full bg-zinc-100 text-zinc-700">
                  Admin picks slot
                </div>

                <div className="flex items-center gap-3 min-w-[260px]">
                  <Avatar src={s?.b?.photo} name={s?.b?.name} />
                  <div>
                    <div className="font-medium">{s?.b?.name}</div>
                    <div className="text-xs text-zinc-500">{s?.b?.role}</div>
                    <a
                      className="text-xs underline text-zinc-600 mt-1 inline-block"
                      href={s?.b?.adminLinks?.attendee}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      open details
                    </a>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-xs rounded-full border px-2 py-1 bg-white">
                  {Math.round(s.score)} pts
                </div>
                <span className="rounded-xl border px-3 py-1 bg-white">
                  Open
                </span>
              </div>
            </button>
          ))}

          {!view.length && (
            <div className="text-sm text-zinc-500 text-center py-10">
              No suggestions match your filters.
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      <Dialog open={open} onClose={closeModal} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 grid place-items-center p-4">
          <Dialog.Panel className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-xl">
            <Dialog.Title className="text-lg font-semibold">
              Review match &amp; pick slot
            </Dialog.Title>
            {current && (
              <>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-xl border p-4 flex items-center gap-3">
                    <Avatar
                      src={current?.a?.photo}
                      name={current?.a?.name}
                    />
                    <div>
                      <div className="font-medium">{current?.a?.name}</div>
                      <div className="text-xs text-zinc-500">
                        {current?.a?.role}
                      </div>
                      <a
                        className="text-xs underline mt-1 inline-block"
                        href={current?.a?.adminLinks?.attendee}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Actor page
                      </a>
                    </div>
                  </div>
                  <div className="rounded-xl border p-4 flex items-center gap-3">
                    <Avatar
                      src={current?.b?.photo}
                      name={current?.b?.name}
                    />
                    <div>
                      <div className="font-medium">{current?.b?.name}</div>
                      <div className="text-xs text-zinc-500">
                        {current?.b?.role}
                      </div>
                      <a
                        className="text-xs underline mt-1 inline-block"
                        href={current?.b?.adminLinks?.attendee}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Actor page
                      </a>
                    </div>
                  </div>
                </div>

                {/* Sender selection */}
                <div className="mt-4 flex items-center gap-4 flex-wrap">
                  <div className="text-sm">Sender:</div>
                  <label className="text-sm flex items-center gap-1">
                    <input
                      type="radio"
                      name="sender"
                      checked={sender === "a"}
                      onChange={() => setSender("a")}
                    />
                    {current?.a?.name}
                  </label>
                  <label className="text-sm flex items-center gap-1">
                    <input
                      type="radio"
                      name="sender"
                      checked={sender === "b"}
                      onChange={() => setSender("b")}
                    />
                    {current?.b?.name}
                  </label>
                </div>

                {/* Slot picker - improved UX */}
                <div className="mt-5 rounded-xl border bg-zinc-50 p-4 flex flex-col gap-3">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <label className="text-sm font-medium flex flex-col gap-1 md:w-1/2">
                      Meeting date &amp; time
                      <input
                        type="datetime-local"
                        className="h-9 w-full rounded-lg border bg-white px-3 text-sm"
                        value={slotInput}
                        onChange={(e) => {
                          setSlotInput(e.target.value);
                          setSlotError("");
                        }}
                      />
                      <span className="text-xs text-zinc-500">
                        Pick the exact start time for this virtual meeting.
                      </span>
                    </label>

                    <div className="md:w-1/2">
                      <div className="rounded-lg border bg-white px-3 py-2 text-xs md:text-sm text-zinc-700">
                        <div className="font-medium mb-0.5">
                          Selected slot
                        </div>
                        <div>
                          {slotInput
                            ? fmtSlot(localInputToISO(slotInput))
                            : "No time selected yet."}
                        </div>
                        <div className="mt-1 text-[11px] text-zinc-400">
                          Times are in <span className="font-medium">{timezoneLabel}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs mt-1">
                    <span className="text-zinc-500 mr-1">
                      Quick options:
                    </span>
                    <button
                      type="button"
                      className="px-2 py-1 rounded-full border bg-white hover:bg-zinc-100"
                      onClick={() => applyQuickOffset(30)}
                    >
                      +30 min
                    </button>
                    <button
                      type="button"
                      className="px-2 py-1 rounded-full border bg-white hover:bg-zinc-100"
                      onClick={() => applyQuickOffset(60)}
                    >
                      +1 hour
                    </button>
                    <button
                      type="button"
                      className="px-2 py-1 rounded-full border bg-white hover:bg-zinc-100"
                      onClick={() => {
                        const base = slotInput
                          ? new Date(slotInput)
                          : new Date();
                        if (Number.isNaN(base.getTime())) return;
                        const d = new Date(base.getTime());
                        d.setDate(d.getDate() + 1);
                        setSlotInput(dateToLocalInput(d));
                        setSlotError("");
                      }}
                    >
                      Tomorrow (same time)
                    </button>
                  </div>

                  {slotError && (
                    <div className="mt-1 text-xs text-red-600">
                      {slotError}
                    </div>
                  )}

                  {reqState.isError && !slotError && (
                    <div className="mt-1 text-xs text-red-600">
                      Failed to send request. Please check the slot or try
                      again.
                    </div>
                  )}
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    className="rounded-xl border px-4 py-2"
                    onClick={closeModal}
                  >
                    Close
                  </button>
                  <button
                    className="rounded-xl bg-black text-white px-4 py-2 disabled:opacity-50"
                    disabled={reqState.isLoading}
                    onClick={approveAndSend}
                  >
                    {reqState.isLoading
                      ? "Sending…"
                      : "Approve &  Send Request"}
                  </button>
                </div>
              </>
            )}
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}
