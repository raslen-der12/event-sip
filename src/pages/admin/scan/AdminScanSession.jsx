import React, { useEffect, useMemo, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useAdminScanSessionMutation } from '../../../features/meetings/meetingsApiSlice';
import { useGetEventsQuery } from '../../../features/events/eventsApiSlice';

function isHex24(s){ return /^[0-9a-fA-F]{24}$/.test(String(s||'')); }
function extractActorId(input){
  const s = String(input||'').trim();
  try {
    const j = JSON.parse(s);
    const cand = j.actorId || j._id || j.id || j.actor;
    if (isHex24(cand)) return cand;
  } catch {}
  try {
    const u = new URL(s);
    const last = u.pathname.split('/').filter(Boolean).pop() || '';
    const clean = last.split('?')[0].split('#')[0];
    if (isHex24(clean)) return clean;
    for (const [k,v] of u.searchParams) if (isHex24(v)) return v;
  } catch {
    const last = s.split('/').filter(Boolean).pop() || '';
    const clean = last.split('?')[0].split('#')[0];
    if (isHex24(clean)) return clean;
  }
  return null;
}

export default function AdminScanSession({ eventId: eventIdProp, sessions = [] }) {
  const [sessionId, setSessionId] = useState(sessions[0]?._id || '');
  const [role, setRole] = useState('attendee');
  const [mutate, { data, error, isLoading }] = useAdminScanSessionMutation();

  const { data: evRes } = useGetEventsQuery();
  const events = useMemo(() => Array.isArray(evRes?.data) ? evRes.data : (Array.isArray(evRes) ? evRes : []), [evRes]);
  const [eventId, setEventId] = useState(eventIdProp || (events[0]?._id ?? ''));

  useEffect(()=>{ if (!eventId && events.length) setEventId(events[0]._id); }, [events, eventId]);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner('qr-session-scan', { fps: 10, qrbox: 250 }, false);
    scanner.render(async (decoded) => {
      const actorId = extractActorId(decoded);
      if (!actorId || !sessionId || !eventId) return;
      await mutate({ sessionId, eventId, actorId, actorRole: role, mark: true });
    }, () => {});
    return () => scanner.clear();
  }, [sessionId, eventId, role, mutate]);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-bold">Session Check</h1>

      <div className="flex flex-wrap gap-2 items-center">
        <select className="border rounded-xl px-3 py-2" value={sessionId} onChange={e=>setSessionId(e.target.value)}>
          {sessions.map(s => (
            <option key={s._id} value={s._id}>
              {s.title} — {new Date(s.startAt || s.startISO).toLocaleString()}
            </option>
          ))}
        </select>
        <select className="border rounded-xl px-3 py-2" value={role} onChange={e=>setRole(e.target.value)}>
          <option value="attendee">Attendee</option>
          <option value="exhibitor">Exhibitor</option>
          <option value="speaker">Speaker</option>
        </select>
        {!eventIdProp && (
          <select className="border rounded-xl px-3 py-2" value={eventId} onChange={e=>setEventId(e.target.value)}>
            {events.map(ev => <option key={ev._id} value={ev._id}>{ev.title || ev.name || ev._id}</option>)}
          </select>
        )}
      </div>

      <div id="qr-session-scan" className="rounded-xl overflow-hidden bg-white shadow p-2" />
      {isLoading && <div>Checking…</div>}
      {error && <div className="text-red-600">Error: {error?.data?.message || 'failed'}</div>}
      {data && (
        <div className={`px-3 py-2 rounded-xl ${data.data.assigned ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-700'}`}>
          {data.data.assigned ? 'Assigned ✔ (marked attendance)' : 'NOT assigned ✖'}
        </div>
      )}
    </div>
  );
}
