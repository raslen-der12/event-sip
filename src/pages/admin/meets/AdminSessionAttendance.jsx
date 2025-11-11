// src/pages/admin/sessions/AdminSessionAttendance.jsx
import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useGetSessionAttendanceQuery } from '../../../features/meetings/meetingsApiSlice';

function SectionHeader({ title, subtitle, right }) {
  return (
    <div className="flex items-end justify-between mb-4">
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        {subtitle ? <p className="text-sm text-zinc-500">{subtitle}</p> : null}
      </div>
      {right}
    </div>
  );
}

function SessionCard({ block, onToggle, open }) {
  const start = block.startISO ? new Date(block.startISO).toLocaleString() : '—';
  const end = block.endISO ? new Date(block.endISO).toLocaleString() : '—';
  const shortId = String(block.sessionId || '').slice(0, 6) || '—';

  return (
    <div className="border rounded-xl mb-3 overflow-hidden bg-white">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-50 text-left"
      >
        <div>
          <div className="font-medium">{block.title || `Session ${shortId}`}</div>
          <div className="text-xs text-zinc-500">
          </div>
        </div>
        <div className="text-sm bg-zinc-100 rounded-full px-3 py-1">
          {block.attendees?.length || 0} scanned
        </div>
      </button>

      {open ? (
        <div className="border-t">
          <table className="w-full text-sm">
            <thead className="bg-zinc-100 text-zinc-700">
              <tr>
                <th className="text-left font-medium py-2 px-3">user</th>
                <th className="text-left font-medium py-2 px-3">Role</th>
                <th className="text-left font-medium py-2 px-3">Email</th>
                <th className="text-left font-medium py-2 px-3">Scanned at</th>
              </tr>
            </thead>
            <tbody>
              {(block.attendees || []).map((s) => (
                <tr
                  key={`${block.sessionId}:${s.actorId}:${s.scannedAt}`}
                  className="border-b last:border-b-0"
                >
                  <td className="py-2 px-3">{s.name || s.actorId}</td>
                  <td className="py-2 px-3">{s.role}</td>
                  <td className="py-2 px-3">{s.email || '—'}</td>
                  <td className="py-2 px-3">
                    {s.at ? new Date(s.at).toLocaleString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}

export default function AdminSessionAttendance() {
  const [sp, setSp] = useSearchParams();
  const eventId = sp.get('eventId') || '68e6764bb4f9b08db3ccec04';
  const [q, setQ] = React.useState(sp.get('q') || '');
  const [openIds, setOpenIds] = React.useState(new Set());

  const { data, isFetching, isError, refetch } = useGetSessionAttendanceQuery({ eventId, q });

  React.useEffect(() => {
    // keep query in URL
    if (q) {
      sp.set('q', q);
    } else {
      sp.delete('q');
    }
    setSp(sp, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const toggleOpen = (sessionId) => {
    setOpenIds((prev) => {
      const next = new Set(prev); // <-- fix: use Set, not HashSet
      if (next.has(sessionId)) next.delete(sessionId);
      else next.add(sessionId);
      return next;
    });
  };

  const blocks = data?.data || [];

  return (
    <div className="p-6">
      <SectionHeader
        title="Session Attendance"
        subtitle={
          isFetching
            ? 'Loading…'
            : `${data?.count || 0} sessions `
        }
        right={
          <div className="flex gap-2 items-center">
            <input
              className="border rounded-lg px-3 py-2 text-sm"
              placeholder="Search by session/actor/org…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <button
              onClick={() => refetch()}
              className="px-3 py-2 rounded-lg border hover:bg-zinc-50 text-sm"
              disabled={isFetching}
            >
              Refresh
            </button>
          </div>
        }
      />

      {isError ? (
        <div className="text-red-600">Failed to load attendance.</div>
      ) : isFetching && !blocks.length ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 bg-zinc-100 animate-pulse rounded-lg" />
          ))}
        </div>
      ) : !blocks.length ? (
        <div className="text-zinc-500">No scans yet for this event.</div>
      ) : (
        <div>
          {blocks.map((b) => (
            <SessionCard
              key={b.sessionId}
              block={b}
              open={openIds.has(b.sessionId)}
              onToggle={() => toggleOpen(b.sessionId)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
