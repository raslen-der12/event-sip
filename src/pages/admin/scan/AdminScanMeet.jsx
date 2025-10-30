// src/pages/admin/AdminScanSession.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { useAdminScanSessionMutation } from "../../../features/meetings/meetingsApiSlice";
import { useGetEventsQuery } from "../../../features/events/eventsApiSlice";
import { useGetEventSessionsQuery } from "../../../features/events/scheduleApiSlice";

function isHex24(s) {
  return /^[0-9a-fA-F]{24}$/.test(String(s || ""));
}
function extractActorId(input) {
  const s = String(input || "").trim();
  // JSON?
  try {
    const j = JSON.parse(s);
    const cand = j.actorId || j._id || j.id || j.actor;
    if (isHex24(cand)) return cand;
  } catch {}
  // URL or path
  try {
    const u = new URL(s);
    const last = u.pathname.split("/").filter(Boolean).pop() || "";
    const clean = last.split("?")[0].split("#")[0];
    if (isHex24(clean)) return clean;
    for (const [, v] of u.searchParams) if (isHex24(v)) return v;
  } catch {
    const last = s.split("/").filter(Boolean).pop() || "";
    const clean = last.split("?")[0].split("#")[0];
    if (isHex24(clean)) return clean;
  }
  return null;
}

export default function AdminScanSession({ eventId: eventIdProp }) {
  const [role, setRole] = useState("attendee");

  // Events
  const { data: evRes } = useGetEventsQuery();
  const events = useMemo(
    () => (Array.isArray(evRes?.data) ? evRes.data : Array.isArray(evRes) ? evRes : []),
    [evRes]
  );
  const [eventId, setEventId] = useState(eventIdProp || (events[0]?._id ?? ""));
  useEffect(() => {
    if (!eventId && events.length) setEventId(events[0]._id);
  }, [events, eventId]);

  // Sessions (hook requested)
  const { data: sessRes, isFetching: sessLoading } = useGetEventSessionsQuery(
    { eventId },
    { skip: !eventId }
  );
  const sessions = useMemo(() => {
    const arr =
      (Array.isArray(sessRes?.data) && sessRes.data) ||
      (Array.isArray(sessRes?.sessions) && sessRes.sessions) ||
      (Array.isArray(sessRes) && sessRes) ||
      [];
    return [...arr].sort(
      (a, b) =>
        new Date(a.startAt || a.startISO || a.start || 0) -
        new Date(b.startAt || b.startISO || b.start || 0)
    );
  }, [sessRes]);

  const [sessionId, setSessionId] = useState("");
  useEffect(() => {
    if (!sessionId && sessions.length) setSessionId(sessions[0]._id || sessions[0].id);
  }, [sessions, sessionId]);

  // API
  const [mutate, { data, error, isLoading }] = useAdminScanSessionMutation();

  // Scanner
  useEffect(() => {
    const elId = "qr-session-scan";
    if (!eventId || !sessionId) return;

    const scanner = new Html5QrcodeScanner(elId, { fps: 10, qrbox: 250 }, false);
    scanner.render(
      async (decoded) => {
        const actorId = extractActorId(decoded);
        if (!actorId) return;
        await mutate({ sessionId, eventId, actorId, actorRole: role, mark: true });
      },
      () => {}
    );
    return () => scanner.clear();
  }, [eventId, sessionId, role, mutate]);

  // Manual input (fallback)
  const [manual, setManual] = useState("");
  const submitManual = async (e) => {
    e.preventDefault();
    if (!eventId || !sessionId) return;
    const actorId = extractActorId(manual);
    if (!actorId) return;
    await mutate({ sessionId, eventId, actorId, actorRole: role, mark: true });
    setManual("");
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-bold">Session Check</h1>

      <div className="flex flex-wrap gap-2 items-center">
        {/* Event selector (hidden if eventId passed in) */}
        {!eventIdProp && (
          <select
            className="border rounded-xl px-3 py-2"
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
          >
            {events.map((ev) => (
              <option key={ev._id} value={ev._id}>
                {ev.title || ev.name || ev._id}
              </option>
            ))}
          </select>
        )}

        {/* Role selector (backend needs actorRole) */}
        <select
          className="border rounded-xl px-3 py-2"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="attendee">Attendee</option>
          <option value="exhibitor">Exhibitor</option>
          <option value="speaker">Speaker</option>
        </select>

        {/* Sessions from hook */}
        <select
          className="border rounded-xl px-3 py-2 min-w-[320px]"
          value={sessionId}
          onChange={(e) => setSessionId(e.target.value)}
          disabled={!eventId || sessLoading || !sessions.length}
        >
          {sessLoading && <option>Loading sessions…</option>}
          {!sessLoading && !sessions.length && <option>No sessions</option>}
          {!sessLoading &&
            sessions.map((s) => {
              const id = s._id || s.id;
              const when = new Date(s.startAt || s.startISO || s.start || Date.now()).toLocaleString(
                [],
                { hour: "2-digit", minute: "2-digit", year: "numeric", month: "short", day: "2-digit" }
              );
              return (
                <option key={id} value={id}>
                  {s.title || "Untitled"} — {when}
                </option>
              );
            })}
        </select>
      </div>

      <div id="qr-session-scan" className="rounded-xl overflow-hidden bg-white shadow p-2" />

      <form onSubmit={submitManual} className="flex gap-2">
        <input
          value={manual}
          onChange={(e) => setManual(e.target.value)}
          className="flex-1 border rounded-xl px-3 py-2"
          placeholder="Paste QR URL (…/profile/<actorId>) or JSON"
        />
        <button className="px-3 py-2 rounded-xl bg-zinc-900 text-white">Submit</button>
      </form>

      <div className="text-sm">
        {isLoading && <div>Checking…</div>}
        {error && <div className="text-red-600">Error: {error?.data?.message || "failed"}</div>}
        {data && (
          <div
            className={`px-3 py-2 rounded-xl ${
              data.data?.assigned ? "bg-green-50 text-green-800" : "bg-red-50 text-red-700"
            }`}
          >
            {data.data?.assigned ? "Assigned ✔ (marked attendance)" : "NOT assigned ✖"}
          </div>
        )}
      </div>
    </div>
  );
}
