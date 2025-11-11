import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useGetEventAttendanceQuery } from '../../../features/meetings/meetingsApiSlice';

function Header({ title, subtitle, right }) {
  return (
    <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between mb-4">
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        {subtitle ? <p className="text-sm text-zinc-500">{subtitle}</p> : null}
      </div>
      {right}
    </div>
  );
}

function ByRole({ byRole }) {
  const Item = ({ label, n }) => (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border border-zinc-300 bg-white text-zinc-700">
      <span className="font-medium">{label}</span>
      <span className="text-zinc-500">{n}</span>
    </span>
  );
  return (
    <div className="flex flex-wrap gap-2">
      <Item label="Attendees" n={byRole?.attendee || 0} />
      <Item label="Exhibitors" n={byRole?.exhibitor || 0} />
      <Item label="Speakers" n={byRole?.speaker || 0} />
    </div>
  );
}

function MobileCard({ r }) {
  return (
    <div className="rounded-xl border p-3 bg-white">
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-wide text-zinc-500">{r.role}</div>
        <div className="text-xs text-zinc-500">{r.scannedAt ? new Date(r.scannedAt).toLocaleString() : '—'}</div>
      </div>
      <div className="mt-1 font-medium">{r.name || r.actorId}</div>
      <div className="text-sm text-zinc-600">{r.org || '—'}</div>
      <div className="text-xs text-zinc-500 break-all">{r.email || '—'}</div>
      <div className="mt-2 text-[11px] text-zinc-400">
        Scanner: {r.scannerId || '—'} • Source: {r.source || '—'}
      </div>
    </div>
  );
}

export default function AdminEventAttendance() {
  const [sp, setSp] = useSearchParams();
  const eventId = sp.get('eventId') || '68e6764bb4f9b08db3ccec04';
  const [q, setQ] = React.useState(sp.get('q') || '');
  const [role, setRole] = React.useState(sp.get('role') || 'all');

  const { data, isFetching, isError, refetch } = useGetEventAttendanceQuery(
    { eventId, q: q.trim() },
    { skip: !eventId }
  );

  React.useEffect(() => {
    if (q) sp.set('q', q); else sp.delete('q');
    if (role && role !== 'all') sp.set('role', role); else sp.delete('role');
    setSp(sp, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, role]);

  const raw = data?.data || [];
  const filtered = React.useMemo(() => {
    if (role === 'all') return raw;
    return raw.filter((x) => x.role === role);
  }, [raw, role]);

  return (
    <div className="p-6">
      <Header
        title="Event Attendance"
        subtitle={
          isFetching ? 'Loading…' : `${data?.total || 0} scans`
        }
        right={
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex gap-2">
              <select
                className="border rounded-lg px-2 py-2 text-sm"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                title="Role filter"
              >
                <option value="all">All roles</option>
                <option value="attendee">Attendee</option>
                <option value="exhibitor">Exhibitor</option>
                <option value="speaker">Speaker</option>
              </select>
              <input
                className="border rounded-lg px-3 py-2 text-sm"
                placeholder="Search name/org/email/role…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <button
              className="px-3 py-2 rounded-lg border hover:bg-zinc-50 text-sm"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              Refresh
            </button>
          </div>
        }
      />

      <div className="mb-3">
        <ByRole byRole={data?.byRole} />
      </div>

      {isError ? (
        <div className="text-red-600">Failed to load attendance.</div>
      ) : isFetching && !filtered.length ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-16 bg-zinc-100 animate-pulse rounded-lg" />
          ))}
        </div>
      ) : !filtered.length ? (
        <div className="text-zinc-500">No scans match your filters.</div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="grid gap-3 md:hidden">
            {filtered.map((r) => <MobileCard key={`${r.actorId}:${r.scannedAt || r.email}`} r={r} />)}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block">
            <div className="rounded-xl border overflow-x-auto bg-white">
              <table className="w-full text-sm min-w-[800px]">
                <thead className="bg-zinc-100 text-zinc-700">
                  <tr>
                    <th className="text-left font-medium py-2 px-3">Actor</th>
                    <th className="text-left font-medium py-2 px-3">Role</th>
                    <th className="text-left font-medium py-2 px-3">Org</th>
                    <th className="text-left font-medium py-2 px-3">Email</th>
                    <th className="text-left font-medium py-2 px-3">Scanned at</th>
                    <th className="text-left font-medium py-2 px-3">Scanner</th>
                    <th className="text-left font-medium py-2 px-3">Source</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={`${r.actorId}:${r.scannedAt || r.email}`} className="border-b last:border-b-0">
                      <td className="py-2 px-3">{r.name || r.actorId}</td>
                      <td className="py-2 px-3">{r.role}</td>
                      <td className="py-2 px-3">{r.org || '—'}</td>
                      <td className="py-2 px-3">{r.email || '—'}</td>
                      <td className="py-2 px-3">{r.scannedAt ? new Date(r.scannedAt).toLocaleString() : '—'}</td>
                      <td className="py-2 px-3">{r.scannerId || '—'}</td>
                      <td className="py-2 px-3">{r.source || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
