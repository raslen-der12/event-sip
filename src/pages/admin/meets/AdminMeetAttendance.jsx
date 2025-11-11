// src/pages/admin/meets/AdminMeetAttendance.jsx
import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useGetMeetAttendanceQuery } from '../../../features/meetings/meetingsApiSlice';

function Header({ title, subtitle, right }) {
  return (
    <div className="mb-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-semibold leading-tight">{title}</h1>
          {subtitle ? <p className="text-xs sm:text-sm text-zinc-500">{subtitle}</p> : null}
        </div>
        <div className="mt-3 sm:mt-0 w-full sm:w-auto">{right}</div>
      </div>
    </div>
  );
}

function Badge({ on, children }) {
  return (
    <span
      className={
        `inline-flex items-center gap-1 text-[11px] sm:text-xs px-2 py-0.5 rounded-full border
         ${on ? 'border-emerald-300 text-emerald-700 bg-emerald-50' : 'border-zinc-300 text-zinc-600 bg-white'}`
      }
    >
      {children}
    </span>
  );
}

function MobileAttendeeRow({ s }) {
  return (
    <div className="rounded-lg border p-3 bg-white">
      <div className="text-[10px] uppercase tracking-wide text-zinc-500">{s.role}</div>
      <div className="font-medium text-sm break-words">{s.name || s.actorId}</div>
      <div className="text-xs text-zinc-600 break-words">{s.org || '—'}</div>
      <div className="text-[11px] text-zinc-500 break-all">{s.email || '—'}</div>
      <div className="mt-1 text-[10px] text-zinc-400">
        {s.attendedAt ? new Date(s.attendedAt).toLocaleString() : '—'} • Scanner: {s.scannerId || '—'} • {s.source || '—'}
      </div>
    </div>
  );
}

function MeetCard({ block, open, onToggle }) {
  const when = block.when ? new Date(block.when).toLocaleString() : '—';
  const aCount = typeof block.attendedCount === 'number' ? block.attendedCount : (block.attendance?.length || 0);
  const s = block.sender || {};
  const r = block.receiver || {};

  return (
    <div className="border rounded-xl mb-3 overflow-hidden bg-white">
      <button
        onClick={onToggle}
        className="w-full flex items-start justify-between gap-3 px-3 sm:px-4 py-3 hover:bg-zinc-50 text-left"
      >
        <div className="min-w-0 flex-1">
          <div className="font-medium text-sm sm:text-base truncate">
            {block.subject || `Meeting ${String(block.meetId).slice(0, 6)}`}
            {block.hasVLink ? (
              <span className="ml-2 text-[10px] sm:text-xs text-emerald-700 border border-emerald-200 rounded px-1.5 py-0.5 align-middle">
                Google Meet
              </span>
            ) : null}
          </div>
          <div className="text-[11px] sm:text-xs text-zinc-500 truncate">
            {when} • {s.name || s.id} ↔ {r.name || r.id}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <Badge on={block.attendedBy?.sender}>Sender attended</Badge>
            <Badge on={block.attendedBy?.receiver}>Receiver attended</Badge>
          </div>
        </div>
        <div className="text-xs sm:text-sm bg-zinc-100 rounded-full px-2.5 py-1 shrink-0">{aCount}/2</div>
      </button>

      {open ? (
        <div className="border-t">
          {/* Mobile stacked list */}
          <div className="p-3 grid gap-2 sm:hidden">
            {(block.attendance || []).map((s, i) => (
              <MobileAttendeeRow key={`${block.meetId}:${s.actorId}:${s.attendedAt || i}`} s={s} />
            ))}
            {(!block.attendance || block.attendance.length === 0) && (
              <div className="text-zinc-500 text-sm">No attendance records for this meeting yet.</div>
            )}
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm min-w-[860px]">
              <thead className="bg-zinc-100 text-zinc-700">
                <tr>
                  <th className="text-left font-medium py-2 px-3">Actor</th>
                  <th className="text-left font-medium py-2 px-3">Role</th>
                  <th className="text-left font-medium py-2 px-3">Org</th>
                  <th className="text-left font-medium py-2 px-3">Email</th>
                  <th className="text-left font-medium py-2 px-3">Attended at</th>
                  <th className="text-left font-medium py-2 px-3">Scanner</th>
                  <th className="text-left font-medium py-2 px-3">Source</th>
                </tr>
              </thead>
              <tbody>
                {(block.attendance || []).map((s, i) => (
                  <tr key={`${block.meetId}:${s.actorId}:${s.attendedAt || i}`} className="border-b last:border-b-0">
                    <td className="py-2 px-3">{s.name || s.actorId}</td>
                    <td className="py-2 px-3">{s.role}</td>
                    <td className="py-2 px-3">{s.org || '—'}</td>
                    <td className="py-2 px-3 break-all">{s.email || '—'}</td>
                    <td className="py-2 px-3">{s.attendedAt ? new Date(s.attendedAt).toLocaleString() : '—'}</td>
                    <td className="py-2 px-3">{s.scannerId || '—'}</td>
                    <td className="py-2 px-3">{s.source || '—'}</td>
                  </tr>
                ))}
                {(!block.attendance || block.attendance.length === 0) && (
                  <tr><td className="py-3 px-3 text-zinc-500" colSpan={7}>No attendance records for this meeting yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function AdminMeetAttendance() {
  const [sp, setSp] = useSearchParams();
  const eventId = sp.get('eventId') || '68e6764bb4f9b08db3ccec04';
  const [q, setQ] = React.useState(sp.get('q') || '');
  const [sort, setSort] = React.useState(sp.get('sort') || 'time-desc'); // time-desc | time-asc | attended

  const { data, isFetching, isError, refetch } = useGetMeetAttendanceQuery(
    { eventId, q },
    { skip: !eventId }
  );

  React.useEffect(() => {
    if (q) sp.set('q', q); else sp.delete('q');
    sp.set('sort', sort);
    setSp(sp, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, sort]);

  const rawBlocks = data?.data || [];
  const blocks = React.useMemo(() => {
    const arr = rawBlocks.slice();
    if (sort === 'time-asc') {
      arr.sort((a, b) => new Date(a.when || 0) - new Date(b.when || 0));
    } else if (sort === 'attended') {
      arr.sort((a, b) => (b.attendedCount || 0) - (a.attendedCount || 0));
    } else {
      arr.sort((a, b) => new Date(b.when || 0) - new Date(a.when || 0));
    }
    return arr;
  }, [rawBlocks, sort]);

  const [openIds, setOpenIds] = React.useState(() => new Set());
  const toggleOpen = (id) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const subtitle = isFetching
    ? 'Loading…'
    : `${data?.totalMeets || 0} meets • ${data?.totalAttendance || 0} attended scans`;

  return (
    <div className="px-3 py-4 sm:p-6 max-w-6xl mx-auto">
      <Header
        title="Meeting Attendance"
        subtitle={subtitle}
        right={
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
            <input
              className="border rounded-lg px-3 py-2 text-sm w-full"
              placeholder="Search subject/participants/email/org…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <select
              className="border rounded-lg px-2 py-2 text-sm w-full"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              title="Sort"
            >
              <option value="time-desc">Newest first</option>
              <option value="time-asc">Oldest first</option>
              <option value="attended">Most attended</option>
            </select>
            <button
              className="px-3 py-2 rounded-lg border hover:bg-zinc-50 text-sm w-full sm:w-auto"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              Refresh
            </button>
          </div>
        }
      />

      {isError ? (
        <div className="text-red-600">Failed to load meeting attendance.</div>
      ) : isFetching && !blocks.length ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 bg-zinc-100 animate-pulse rounded-lg" />
          ))}
        </div>
      ) : !blocks.length ? (
        <div className="text-zinc-500">No meetings found for this event.</div>
      ) : (
        <div className="space-y-2">
          {blocks.map((b) => (
            <MeetCard
              key={b.meetId}
              block={b}
              open={openIds.has(b.meetId)}
              onToggle={() => toggleOpen(b.meetId)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
