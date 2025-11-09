// src/pages/admin/meets/AdminVirtualMeets.jsx
import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  useGetAdminVirtualMeetsQuery,
  useGenerateAdminMeetLinkMutation,
} from '../../../features/meetings/meetingsApiSlice';
import { FiVideo, FiCheckCircle, FiExternalLink, FiRefreshCw } from 'react-icons/fi';

function fmt(dt) {
  try {
    return new Date(dt).toLocaleString();
  } catch {
    return String(dt || '');
  }
}

function roleLink(role = '', id = '') {
  const r = String(role || '').toLowerCase();
  const base =
    r === 'speaker'
      ? '/admin/members/speakers'
      : '/admin/members/attendees'; // default to attendees
  return `${base}?id=${encodeURIComponent(id)}`;
}

export default function AdminVirtualMeets() {
  const [sp, setSp] = useSearchParams();
  const eventId = sp.get('eventId') || '68e6764bb4f9b08db3ccec04';
  const status = sp.get('status') || ''; // optional filter

  const { data, isFetching, refetch } = useGetAdminVirtualMeetsQuery(
    { eventId, status },
    { skip: !eventId } // require eventId; remove this if you want global view
  );

  const [generateLink, genState] = useGenerateAdminMeetLinkMutation();

  const list = Array.isArray(data?.data) ? data.data : [];
  const total = Number(data?.count || 0);

  const onGenerate = async (id) => {
    try {
      await generateLink(id).unwrap();
    } catch (e) {
      // no toast lib here; console for now
      console.error('generate link failed', e);
    }
  };

  return (
    <div className="p-6">
      {/* Header + controls */}
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Virtual & Hybrid Meetings</h1>
          <div className="text-sm text-zinc-500">
            {isFetching ? 'Loading…' : `${total} meetings`}
          </div>
        </div>

        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <div className="flex items-center gap-2">
            <label className="text-sm text-zinc-600">Event ID</label>
            <input
              className="h-9 w-[280px] rounded-lg border px-3 text-sm"
              placeholder="required"
              value={eventId}
              onChange={(e) => {
                sp.set('eventId', e.target.value.trim());
                setSp(sp, { replace: true });
              }}
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-zinc-600">Status</label>
            <select
              className="h-9 rounded-lg border px-2 text-sm"
              value={status}
              onChange={(e) => {
                const v = e.target.value;
                if (v) sp.set('status', v);
                else sp.delete('status');
                setSp(sp, { replace: true });
              }}
            >
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="rescheduled">Rescheduled</option>
            </select>
          </div>

          <button
            className="h-9 px-3 rounded-lg border text-sm flex items-center gap-2"
            onClick={() => refetch()}
            disabled={isFetching}
            title="Refresh list"
          >
            <FiRefreshCw />
            Refresh
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border">
        <table className="min-w-[880px] w-full text-sm">
          <thead className="bg-zinc-50 text-zinc-600">
            <tr>
              <th className="text-left px-4 py-3">Time</th>
              <th className="text-left px-4 py-3">Sender</th>
              <th className="text-left px-4 py-3">Receiver</th>
              <th className="text-left px-4 py-3">Mode</th>
              <th className="text-left px-4 py-3">Link</th>
              <th className="text-right px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {isFetching ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-4 py-3">
                    <div className="h-4 w-40 bg-zinc-200 rounded" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-4 w-52 bg-zinc-200 rounded" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-4 w-52 bg-zinc-200 rounded" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-4 w-20 bg-zinc-200 rounded" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-4 w-28 bg-zinc-200 rounded" />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="h-8 w-28 bg-zinc-200 rounded" />
                  </td>
                </tr>
              ))
            ) : list.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-zinc-500">
                  No meetings found for the current filters.
                </td>
              </tr>
            ) : (
              list.map((m) => {
                const has = !!m.hasLink;
                const meetUrl = m.meetLink || '';
                const s = m.sender || {};
                const r = m.receiver || {};
                return (
                  <tr key={m._id} className="border-t">
                    <td className="px-4 py-3 align-top">{fmt(m.slotISO)}</td>

                    <td className="px-4 py-3 align-top">
                      <div className="flex flex-col">
                        <span className="font-medium">{s.name || s.actorId}</span>
                        <span className="text-xs text-zinc-500">{String(s.role || '').toUpperCase()}</span>
                        <a
                          href={roleLink(s.role, s.actorId)}
                          className="text-xs underline mt-0.5"
                          target="_blank"
                          rel="noreferrer"
                        >
                          open actor
                        </a>
                      </div>
                    </td>

                    <td className="px-4 py-3 align-top">
                      <div className="flex flex-col">
                        <span className="font-medium">{r.name || r.actorId}</span>
                        <span className="text-xs text-zinc-500">{String(r.role || '').toUpperCase()}</span>
                        <a
                          href={roleLink(r.role, r.actorId)}
                          className="text-xs underline mt-0.5"
                          target="_blank"
                          rel="noreferrer"
                        >
                          open actor
                        </a>
                      </div>
                    </td>

                    <td className="px-4 py-3 align-top">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${
                          m.mode === 'virtual'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        <FiVideo />
                        {String(m.mode || 'virtual')}
                      </span>
                    </td>

                    <td className="px-4 py-3 align-top">
                      {has ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700">
                          <FiCheckCircle />
                          Generated
                        </span>
                      ) : (
                        <span className="text-zinc-400">—</span>
                      )}
                      {has && meetUrl ? (
                        <div className="mt-1">
                          <a
                            className="inline-flex items-center gap-1 text-xs underline"
                            href={meetUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <FiExternalLink />
                            Open room
                          </a>
                        </div>
                      ) : null}
                    </td>

                    <td className="px-4 py-3 align-top text-right">
                      <button
                        className="h-8 px-3 rounded-lg border text-sm disabled:opacity-50"
                        onClick={() => onGenerate(m._id)}
                        disabled={has || genState.isLoading}
                        title={has ? 'Already generated' : 'Generate Google Meet link'}
                      >
                        Generate link
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
