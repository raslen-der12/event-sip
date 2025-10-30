import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useAdminScanActorAttendMutation } from '../../../features/meetings/meetingsApiSlice';
import { useGetEventsQuery } from '../../../features/events/eventsApiSlice';

function isHex24(s){ return /^[0-9a-fA-F]{24}$/.test(String(s||'')); }
function extractActorId(input){
  const s = String(input||'').trim();
  // 1) try JSON/token with nested ids
  try {
    const j = JSON.parse(s);
    const cand = j.actorId || j._id || j.id || j.actor;
    if (isHex24(cand)) return cand;
  } catch {}
  // 2) try URL (or any path-like string)
  try {
    const u = new URL(s);
    const last = u.pathname.split('/').filter(Boolean).pop() || '';
    const clean = last.split('?')[0].split('#')[0];
    if (isHex24(clean)) return clean;
    // also check query params
    for (const [k,v] of u.searchParams) if (isHex24(v)) return v;
  } catch {
    // treat as raw path
    const last = s.split('/').filter(Boolean).pop() || '';
    const clean = last.split('?')[0].split('#')[0];
    if (isHex24(clean)) return clean;
  }
  return null;
}

export default function AdminScanActor({ eventId: eventIdProp }) {
  const ref = useRef(null);
  const [scanTxt, setScanTxt] = useState('');
  const [role, setRole] = useState('attendee');
  const { data: evRes } = useGetEventsQuery();
  const events = useMemo(() => Array.isArray(evRes?.data) ? evRes.data : (Array.isArray(evRes) ? evRes : []), [evRes]);
  const [eventId, setEventId] = useState(eventIdProp || (events[0]?._id ?? ''));
  const [mutate, { isLoading, data, error }] = useAdminScanActorAttendMutation();

  useEffect(()=>{ if (!eventId && events.length) setEventId(events[0]._id); }, [events, eventId]);

  useEffect(() => {
    const elId = 'qr-actor-scan';
    if (!ref.current) return;
    const scanner = new Html5QrcodeScanner(elId, { fps: 10, qrbox: 250 }, false);
    scanner.render(async (decoded) => {
      setScanTxt(decoded);
      const actorId = extractActorId(decoded);
      if (!actorId) return;
      if (!eventId) return;
      await mutate({ eventId, actorId, actorRole: role });
    }, () => {});
    return () => scanner.clear();
  }, [eventId, role, mutate]);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-bold">Event Check-in (Actor)</h1>

      <div className="flex gap-2 items-center">
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

      <div id="qr-actor-scan" ref={ref} className="rounded-xl overflow-hidden bg-white shadow p-2" />
      <ManualInput onSubmit={async v=>{
        const actorId = extractActorId(v);
        if (!actorId || !eventId) return;
        await mutate({ eventId, actorId, actorRole: role });
      }} />
      <Result data={data} error={error} isLoading={isLoading} debug={scanTxt} />
    </div>
  );
}

function ManualInput({ onSubmit }) {
  const [v, setV] = useState('');
  return (
    <form onSubmit={e=>{e.preventDefault(); onSubmit(v);}}>
      <div className="flex gap-2">
        <input value={v} onChange={e=>setV(e.target.value)} className="flex-1 border rounded-xl px-3 py-2" placeholder="Paste QR URL (…/profile/<actorId>) or JSON" />
        <button className="px-3 py-2 rounded-xl bg-zinc-900 text-white">Submit</button>
      </div>
    </form>
  );
}
function Result({ data, error, isLoading, debug }) {
  return (
    <div className="text-sm">
      {isLoading && <div>Checking…</div>}
      {error && <div className="text-red-600">Error: {error?.data?.message || 'failed'}</div>}
      {data && <div className="text-green-700">Checked-in ✔</div>}
      {debug && <div className="text-xs text-zinc-500 mt-2 break-all">Scanned: {debug}</div>}
    </div>
  );
}
