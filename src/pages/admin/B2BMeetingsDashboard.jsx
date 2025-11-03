// src/pages/admin/B2BMeetingsDashboard.jsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  useAdminListMeetsQuery,
  useAdminMeetStatsQuery,
  useAdminCalendarQuery,
  useAdminDeleteMeetMutation,
  useAdminMarkAttendanceMutation,
  useAdminSetVirtualLinkMutation,
  useAdminListSlotsQuery,             // ← NEW
  useAdminRescheduleMeetMutation,     // ← NEW
  useAdminSetTableMutation            // ← NEW (optional: if you allow manual table override)
} from '../../features/meetings/meetingsApiSlice';
import { useGetEventsQuery } from '../../features/events/eventsApiSlice';
import { format } from 'date-fns';
import './global-meet.css';

function Select({ value, onChange, children }) {
  return (
    <select className="border rounded-md px-3 py-2 text-sm" value={value} onChange={(e)=>onChange(e.target.value)}>
      {children}
    </select>
  );
}
function Pill({ active, onClick, children }) {
  return (
    <button onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-sm border ${active ? 'bg-sky-600 text-white border-sky-600' : 'bg-white text-slate-700 hover:bg-slate-50'}`}>
      {children}
    </button>
  );
}
async function exportConfirmedXLSX(rows=[], eventId=''){
  const confirmed = rows.filter(r => String(r.status).toLowerCase() === 'confirmed');
  if (!confirmed.length) {
    alert('No confirmed meetings to export.');
    return;
  }
  // prepare AoA for Excel
  const header = ['Time','Subject','SenderName','SenderRole','ReceiverName','ReceiverRole','Mode','Table','VirtualLink','MeetingId'];
  const fmtTime = (iso)=> iso ? `${new Date(iso).toLocaleDateString()} ${new Date(iso).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}` : '';
  const aoa = [
    header,
    ...confirmed.map(r => [
      fmtTime(r.slotISO),
      r.subject || '',
      r.senderName || '',
      r.senderRole || '',
      r.receiverName || '',
      r.receiverRole || '',
      r.mode || '',
      r.tableId ? String(r.tableId).toUpperCase() : '',
      r.virtualLink || '',
      r._id || r.id || ''
    ])
  ];

  try {
    const mod = await import('xlsx');       // SheetJS
    const XLSX = mod.default || mod;        // handle ESM/CJS
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Confirmed');
    const fname = `B2B_confirmed_${eventId || 'all'}_${toISODate(new Date())}.xlsx`;
    XLSX.writeFile(wb, fname);
  } catch {
    // fallback to CSV (Excel-friendly)
    const a = document.createElement('a');
    a.href = toCSV(confirmed);
    a.download = `B2B_confirmed_${eventId || 'all'}_${toISODate(new Date())}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
  }
}
function StatCard({ label, value, sub }) {
  return (
    <div className="rounded-2xl shadow-sm border p-4 bg-white">
      <div className="text-xs uppercase text-slate-500">{label}</div> 
      <div className="text-2xl font-semibold">{value}</div>
      {sub ? <div className="text-xs text-slate-500 mt-1">{sub}</div> : null}
    </div>
  );
}
const statusKeys = ['', 'pending','rescheduled','confirmed','rejected','cancelled'];
const toISODate = (d)=>{ try { return format(d,'yyyy-MM-dd'); } catch { return ''; } };
const toCSV = (rows=[]) => {
  if (!rows.length) return 'data:text/csv;charset=utf-8,';
  const headers = ['Time','Status','Subject','SenderName','SenderRole','ReceiverName','ReceiverRole','Mode','Table','VirtualLink','MeetingId'];
  const esc = (v)=>`"${String(v ?? '').replace(/"/g,'""').replace(/\r?\n/g,' ')}"`;
  const lines = [headers.join(',')];
  rows.forEach(r=>{
    const time = r.slotISO ? `${new Date(r.slotISO).toLocaleDateString()} ${new Date(r.slotISO).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}` : '';
    lines.push([esc(time),esc(r.status),esc(r.subject),esc(r.senderName),esc(r.senderRole),esc(r.receiverName),esc(r.receiverRole),esc(r.mode||''),esc(r.tableId?String(r.tableId).toUpperCase():''),esc(r.virtualLink||''),esc(r._id||r.id||'')].join(','));
  });
  return 'data:text/csv;charset=utf-8,' + encodeURIComponent(lines.join('\n'));
};

export default function B2BMeetingsDashboard(){
  // ── filters
  const [eventId, setEventId] = useState('');
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  // events
  const { data: evData, isLoading: evLoading } = useGetEventsQuery();
  const events = useMemo(()=>{
    if (Array.isArray(evData?.data)) return evData.data;
    if (Array.isArray(evData)) return evData;
    return [];
  },[evData]);
  useEffect(()=>{ if (!eventId && events.length){ const first = events[0]; setEventId(first?._id || first?.id || ''); } },[events, eventId]);  // :contentReference[oaicite:4]{index=4}

  // queries
  const listParams = useMemo(()=>({
    eventId: eventId || undefined,
    status : status || undefined,
    q      : q || undefined,
    from   : from ? `${from}T00:00:00.000Z` : undefined,
    to     : to   ? `${to}T23:59:59.999Z`   : undefined,
  }),[eventId,status,q,from,to]); // :contentReference[oaicite:5]{index=5}

  const { data: meets, isFetching: meetsLoading, refetch } = useAdminListMeetsQuery(listParams, { skip: !eventId });
  const { data: stats, isFetching: statsLoading }           = useAdminMeetStatsQuery(eventId, { skip: !eventId });
  useAdminCalendarQuery({ eventId: eventId || undefined, from: listParams.from, to: listParams.to }, { skip: !eventId }); // :contentReference[oaicite:6]{index=6}

  // NEW: slot capacity panel
  const { data: slotData, isFetching: slotsLoading } = useAdminListSlotsQuery(
    { eventId, from: listParams.from, to: listParams.to, tz: 'Africa/Tunis' }, { skip: !eventId }
  );

  // mutations
  const [deleteMeet, { isLoading: deleting }] = useAdminDeleteMeetMutation();
  const [markAttendance] = useAdminMarkAttendanceMutation();
  const [setVLink] = useAdminSetVirtualLinkMutation();
  const [rescheduleMeet] = useAdminRescheduleMeetMutation();
  const [setTable] = useAdminSetTableMutation();

  // derived
  const statusCounts = useMemo(()=>{
    const map = (stats?.data?.counts) || {};
    return {
      pending: map.pending || 0, rescheduled: map.rescheduled || 0, confirmed: map.confirmed || 0,
      rejected: map.rejected || 0, cancelled: map.cancelled || 0,
      total: Object.values(map).reduce((a,b)=>a+b,0),
    };
  },[stats]);
  const modeCounts = stats?.data?.modes || { physical: 0, hybrid: 0, virtual: 0 };
  const byDay  = stats?.data?.byDay || [];
  const rows   = meets?.data || [];

  const onExport = ()=>{
    const href = toCSV(rows);
    const a = document.createElement('a'); a.href = href;
    a.download = `B2B_${eventId || 'all'}_${toISODate(new Date())}.csv`; a.click();
  };

  // ── modal state
  const [openId, setOpenId] = useState(null);
  const active = useMemo(()=> rows.find(x => String(x._id||x.id) === String(openId)), [openId, rows]);

  // small widgets
  const Chip = ({m}) => <span className={`gm-chip gm-${m}`}>{m[0].toUpperCase()+m.slice(1)}</span>;

  return (
    <div className="p-4 sm:p-6 space-y-14">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">B2B Dashboard</h1>
        <div className="flex gap-2">
          <button className="px-3 py-2 text-sm rounded-lg bg-slate-800 text-white" onClick={()=>refetch()} disabled={meetsLoading}>Refresh</button>
          <button className="px-3 py-2 text-sm rounded-lg bg-emerald-600 text-white" onClick={onExport} disabled={!rows.length} title="Export CSV">Export</button>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <div className="grid md:grid-cols-5 gap-3 items-end">
          <div className="flex flex-col">
            <label className="text-xs text-slate-500 mb-1">Event</label>
            <Select value={eventId} onChange={(v)=>{ setEventId(v); setStatus(''); setQ(''); setFrom(''); setTo(''); }}>
              {!events.length ? <option value="" disabled>{evLoading ? 'Loading…' : 'No events'}</option> : null}
              {events.map(e => <option key={e._id || e.id} value={e._id || e.id}>{e.title || e.name}</option>)}
            </Select>
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-slate-500 mb-1">Search</label>
            <input className="border rounded-md px-3 py-2 text-sm" placeholder="Subject / message…" value={q} onChange={(e)=>setQ(e.target.value)} />
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-slate-500 mb-1">From</label>
            <input type="date" className="border rounded-md px-3 py-2 text-sm" value={from} onChange={(e)=>setFrom(e.target.value)} max={to || undefined} />
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-slate-500 mb-1">To</label>
            <input type="date" className="border rounded-md px-3 py-2 text-sm" value={to} onChange={(e)=>setTo(e.target.value)} min={from || undefined} />
          </div>
        </div>
      </div>
          <div className="flex items-center justify-end gap-2 md:col-span-5 lg:col-span-1 md:mt-2">
            <Pill active={status === ''} onClick={()=>setStatus('')}>All ({statusCounts.total})</Pill>
            <Pill active={status === 'pending'} onClick={()=>setStatus('pending')}>Pending ({statusCounts.pending})</Pill>
            <Pill active={status === 'rescheduled'} onClick={()=>setStatus('rescheduled')}>Rescheduled ({statusCounts.rescheduled})</Pill>
            <Pill active={status === 'confirmed'} onClick={()=>setStatus('confirmed')}>Confirmed ({statusCounts.confirmed})</Pill>
            <Pill active={status === 'rejected'} onClick={()=>setStatus('rejected')}>Rejected ({statusCounts.rejected})</Pill>
            <Pill active={status === 'cancelled'} onClick={()=>setStatus('cancelled')}>Cancelled ({statusCounts.cancelled})</Pill>
          </div>

        <div className="gm-card-head m-1">Slot capacity</div>
      {/* Top stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-2">
        <StatCard label="Total"    value={statusCounts.total} />
        <StatCard label="Physical" value={modeCounts.physical || 0} />
        <StatCard label="Hybrid"   value={modeCounts.hybrid   || 0} />
        <StatCard label="Virtual"  value={modeCounts.virtual  || 0} />
      </div>

      {/* Slot capacity (adminListSlots) */}
      <div className="gm-card">
        {slotsLoading ? <div className="gm-empty">Loading…</div> : (
          <div className="gm-slot-grid">
            {(slotData?.data || []).map(s => {
              const p = s.physical || { used:0, cap:0 };
              const h = s.hybrid   || { used:0, cap:0 };
              const v = s.virtual  || { used:0 };
              const pPct = p.cap ? Math.min(100, Math.round(100*p.used/p.cap)) : 0;
              const hPct = h.cap ? Math.min(100, Math.round(100*h.used/h.cap)) : 0;
              return (
                <div className="gm-slot" key={s.iso}>
                  <div className="gm-slot-time">{s.localDate} • {s.localTime}</div>
                  <div className="gm-slot-bars">
                    <div className="gm-bar -phys" style={{ width: `${pPct}%` }} />
                  </div>
                  <div className="gm-slot-bars">
                    <div className="gm-bar -hyb" style={{ width: `${hPct}%` }} />
                  </div>
                  <div className="gm-slot-meta">
                    <span>P {p.used}/{p.cap}</span>
                    <span>H {h.used}/{h.cap}</span>
                    <span>V {v.used}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
        <div className="px-4 py-3 border-b text-sm font-semibold flex items-center justify-between">
  <span>Meetings</span>
  <div className="flex items-center gap-2">
    <button
      className="px-3 py-1.5 rounded-md bg-emerald-600 text-white text-xs"
      onClick={()=>exportConfirmedXLSX(rows, eventId)}
      disabled={!rows.some(r => String(r.status).toLowerCase() === 'confirmed')}
      title="Export only confirmed meetings to Excel"
    >
      Export confirmed (Excel)
    </button>
    <span className="text-xs text-slate-500">
      {rows.length} item{rows.length === 1 ? '' : 's'}
    </span>
  </div>
</div>
      {/* Meetings table */}
      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b text-sm font-semibold flex items-center justify-between">
          <span>Meetings</span>
          <span className="text-xs text-slate-500">{rows.length} item{rows.length === 1 ? '' : 's'}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left text-slate-600">
                <th className="px-4 py-2">Time</th>
                <th className="px-4 py-2">Subject</th>
                <th className="px-4 py-2">Sender</th>
                <th className="px-4 py-2">Receiver</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Mode</th>
                <th className="px-4 py-2">Table</th>
                <th className="px-4 py-2 w-[280px]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {meetsLoading ? (
                <tr><td className="px-4 py-6 text-slate-500" colSpan={8}>Loading…</td></tr>
              ) : !rows.length ? (
                <tr><td className="px-4 py-6 text-slate-500" colSpan={8}>No meetings.</td></tr>
              ) : rows.map((r)=>(
                <tr key={r._id || r.id} className="border-t">
                  <td className="px-4 py-2">{r.slotISO ? `${new Date(r.slotISO).toLocaleDateString()} ${new Date(r.slotISO).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}` : '—'}</td>
                  <td className="px-4 py-2">{r.subject || '—'}</td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      {r.senderPhoto ? <img src={r.senderPhoto} alt="" className="w-6 h-6 rounded-full object-cover" /> : <div className="w-6 h-6 rounded-full bg-slate-200" />}
                      <div className="flex flex-col"><span className="font-medium">{r.senderName || '—'}</span><span className="text-[11px] uppercase text-slate-500">{r.senderRole}</span></div>
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      {r.receiverPhoto ? <img src={r.receiverPhoto} alt="" className="w-6 h-6 rounded-full object-cover" /> : <div className="w-6 h-6 rounded-full bg-slate-200" />}
                      <div className="flex flex-col"><span className="font-medium">{r.receiverName || '—'}</span><span className="text-[11px] uppercase text-slate-500">{r.receiverRole}</span></div>
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${
                      r.status==='confirmed' ? 'bg-emerald-100 text-emerald-700' :
                      r.status==='pending' ? 'bg-amber-100 text-amber-700' :
                      r.status==='rescheduled' ? 'bg-sky-100 text-sky-700' :
                      r.status==='rejected' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'
                    }`}>{r.status}</span>
                  </td>
                  <td className="px-4 py-2">{r.mode ? r.mode[0].toUpperCase()+r.mode.slice(1) : '—'}</td>
                  <td className="px-4 py-2">{r.tableId ? String(r.tableId).toUpperCase() : '—'}</td>
                  <td className="px-4 py-2">
                    <div className="flex items-center flex-wrap gap-2">
                      <button className="text-sky-700 hover:underline" onClick={()=>setOpenId(r._id || r.id)}>Manage</button>
                      <button className="text-emerald-700 hover:underline" title="✓ Sender (physical)" onClick={async()=>{
                        try{ await markAttendance({ id: r._id||r.id, actorId: r.senderId, attended: true, mode: 'physical' }).unwrap(); } catch(e){ alert('Attendance update failed'); }
                      }}>✓ Sender</button>
                      <button className="text-emerald-700 hover:underline" title="✓ Receiver (physical)" onClick={async()=>{
                        try{ await markAttendance({ id: r._id||r.id, actorId: r.receiverId, attended: true, mode: 'physical' }).unwrap(); } catch(e){ alert('Attendance update failed'); }
                      }}>✓ Receiver</button>
                      <button className="text-rose-700 hover:underline" disabled={deleting} onClick={async()=>{
                        if (!window.confirm('Delete this meeting?')) return;
                        try{ await deleteMeet(r._id||r.id).unwrap(); } catch(e){ alert('Delete failed'); }
                      }}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {openId && active && (
        <div className="gm-modal" role="dialog" aria-modal="true">
          <div className="gm-modal-backdrop" onClick={()=>setOpenId(null)} />
          <div className="gm-modal-card">
            <div className="gm-modal-head">
              <div className="title">Manage Meeting</div>
              <button className="gm-btn" onClick={()=>setOpenId(null)}>Close</button>
            </div>
            <div className="gm-modal-body gm-item">
              <div className="gm-item-row"><strong>Time</strong><span>{active.slotISO ? new Date(active.slotISO).toLocaleString() : '—'}</span></div>
              <div className="gm-item-row"><strong>Subject</strong><span>{active.subject || '—'}</span></div>
              <div className="gm-item-row"><strong>Sender</strong><span>{active.senderName} ({active.senderRole})</span></div>
              <div className="gm-item-row"><strong>Receiver</strong><span>{active.receiverName} ({active.receiverRole})</span></div>
              <div className="gm-item-row"><strong>Status</strong><span className="pill">{active.status}</span></div>
              <div className="gm-item-row"><strong>Mode</strong><span><Chip m={active.mode || 'physical'} /></span></div>
              <div className="gm-item-row"><strong>Table</strong><span>{active.tableId ? String(active.tableId).toUpperCase() : '—'}</span></div>

              {/* Virtual link editor */}
              <div className="mt-4">
                <label className="text-xs text-slate-500 mb-1 block">Virtual link</label>
                <div className="flex gap-2">
                  <input defaultValue={active.virtualLink||''} id="vlink" className="border rounded-md px-3 py-2 text-sm w-full" placeholder="https://..." />
                  <button className="gm-btn" onClick={async()=>{
                    const val = document.getElementById('vlink').value.trim();
                    try { await setVLink({ id: active._id||active.id, link: val }).unwrap(); } catch(e){ alert('Failed'); }
                  }}>Save</button>
                </div>
              </div>

              {/* Reschedule */}
              <div className="mt-4">
                <label className="text-xs text-slate-500 mb-1 block">Reschedule (slot ISO)</label>
                <div className="flex gap-2">
                  <input type="datetime-local" id="newSlot" className="border rounded-md px-3 py-2 text-sm w-full" />
                  <button className="gm-btn" onClick={async()=>{
                    const raw = document.getElementById('newSlot').value;
                    if (!raw) return;
                    const iso = new Date(raw);
                    try { await rescheduleMeet({ id: active._id||active.id, slotISO: iso.toISOString() }).unwrap(); } catch(e){ alert('Reschedule failed'); }
                  }}>Apply</button>
                </div>
              </div>

              {/* Table (optional manual override) */}
              <div className="mt-4">
                <label className="text-xs text-slate-500 mb-1 block">Table (manual override)</label>
                <div className="flex gap-2">
                  <input id="tbl" className="border rounded-md px-3 py-2 text-sm w-40" placeholder="e.g. A03" />
                  <button className="gm-btn" onClick={async()=>{
                    const tbl = document.getElementById('tbl').value.trim();
                    if (!tbl) return;
                    try { await setTable({ id: active._id||active.id, tableId: tbl }).unwrap(); } catch(e){ alert('Set table failed'); }
                  }}>Set</button>
                </div>
              </div>
            </div>
            <div className="gm-modal-foot">
              <button className="gm-btn -danger" onClick={async()=>{
                if (!window.confirm('Delete this meeting?')) return;
                try{ await deleteMeet(active._id||active.id).unwrap(); setOpenId(null); } catch(e){ alert('Delete failed'); }
              }}>Delete</button>
              <button className="gm-btn" onClick={()=>setOpenId(null)}>Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
