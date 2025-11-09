// src/pages/admin/meets/AdminMatchmaking.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useGetAdminSuggestionsQuery } from '../../../features/meetings/meetingsApiSlice';
import { useRequestMeetingMutation } from '../../../features/Actor/toolsApiSlice';
import imageLink from '../../../utils/imageLink';
import { Dialog } from '@headlessui/react';

function initials(name = '') {
  const parts = String(name).trim().split(/\s+/);
  const a = (parts[0] || '').charAt(0);
  const b = (parts[1] || '').charAt(0);
  return (a + b).toUpperCase() || (a || '?').toUpperCase();
}

function Avatar({ src, name }) {
  const bg = src ? { backgroundImage: `url(${imageLink(src)})` } : {};
  return (
    <div
      className="w-12 h-12 rounded-full bg-zinc-200 bg-center bg-cover flex items-center justify-center shrink-0"
      style={bg}
    >
      {!src && <span className="text-xs font-semibold text-zinc-600">{initials(name)}</span>}
    </div>
  );
}

function fmtSlot(iso) {
  try {
    const d = new Date(iso);
    // Local readable, no deps
    return d.toLocaleString();
  } catch {
    return iso;
  }
}

export default function AdminMatchmaking() {
  const [sp, setSp] = useSearchParams();
  const eventId = sp.get('eventId') || '68e6764bb4f9b08db3ccec04';
  const suggIdQ = sp.get('suggId') || '';

  const { data: suggs = [], isFetching } = useGetAdminSuggestionsQuery({ eventId });
  const [requestMeeting, reqState] = useRequestMeetingMutation();
 console.log("suggs",suggs);
  // UI state
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState(null);
  const [sender, setSender] = useState('a');

  // Filters (pure client-side)
  const [q, setQ] = useState('');
  const [minScore, setMinScore] = useState(0);
  const [sortBy, setSortBy] = useState('score'); // 'score' | 'slot' | 'name'

  const byId = useMemo(() => new Map((suggs || []).map(s => [s.suggId, s])), [suggs]);

  // Apply filters & sorting
  const view = useMemo(() => {
    let rows = Array.isArray(suggs) ? suggs.slice() : [];
    const qlc = q.trim().toLowerCase();
    if (qlc) {
      rows = rows.filter(
        s =>
          String(s?.a?.name || '').toLowerCase().includes(qlc) ||
          String(s?.b?.name || '').toLowerCase().includes(qlc)
      );
    }
    if (Number(minScore) > 0) {
      rows = rows.filter(s => Number(s.score || 0) >= Number(minScore));
    }
    if (sortBy === 'score') {
      rows.sort((a, b) => (b.score || 0) - (a.score || 0));
    } else if (sortBy === 'slot') {
      rows.sort((a, b) => new Date(a.slotISO).getTime() - new Date(b.slotISO).getTime());
    } else if (sortBy === 'name') {
      rows.sort((a, b) => String(a.a?.name || '').localeCompare(String(b.a?.name || '')));
    }
    return rows;
  }, [suggs, q, minScore, sortBy]);

  // Deep link: open modal when ?suggId= is present and exists in current list
  useEffect(() => {
    if (suggIdQ && byId.has(suggIdQ)) {
      setCurrent(byId.get(suggIdQ));
      setSender('a');
      setOpen(true);
    }
  }, [suggIdQ, byId]);

  const openModal = (s) => {
    setCurrent(s);
    setSender('a');
    sp.set('suggId', s.suggId);
    setSp(sp, { replace: true });
    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
    sp.delete('suggId');
    setSp(sp, { replace: true });
  };

  const approveAndSend = async () => {
    if (!current) return;
    const s = sender === 'a' ? current.a : current.b;
    const r = sender === 'a' ? current.b : current.a;
    const normRole = (x) => String(x || 'attendee').toLowerCase();
    // Backend expected payload (do not change field names)
    console.log("sender role",s.role);
    const body = {
      dateTimeISO: String(current.slotISO),   // required
      receiverRole: normRole(r.role),         // role of the chosen receiver
      receiverId: String(r.id),               // required
      eventId: String(current.eventId),       // required
      senderId: String(s.id),                 // required
      senderRole: normRole(s.role)      // required
    };
    try {
      await requestMeeting(body).unwrap();
      closeModal();
    } catch (e) {
      // keep the modal open, you can show a tiny inline message
      console.error('requestMeeting failed', e);
    }
  };

  return (
    <div className="p-6">
      {/* Header + filters */}
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Admin Matchmaking</h1>
          <div className="text-sm text-zinc-500">
            {isFetching ? 'Loading…' : `${suggs.length} suggestions`}
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
                  {fmtSlot(s.slotISO)}
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
                <span className="rounded-xl border px-3 py-1 bg-white">Open</span>
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
            <Dialog.Title className="text-lg font-semibold">Review match</Dialog.Title>
            {current && (
              <>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-xl border p-4 flex items-center gap-3">
                    <Avatar src={current?.a?.photo} name={current?.a?.name} />
                    <div>
                      <div className="font-medium">{current?.a?.name}</div>
                      <div className="text-xs text-zinc-500">{current?.a?.role}</div>
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
                    <Avatar src={current?.b?.photo} name={current?.b?.name} />
                    <div>
                      <div className="font-medium">{current?.b?.name}</div>
                      <div className="text-xs text-zinc-500">{current?.b?.role}</div>
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

                <div className="mt-4 flex items-center gap-4 flex-wrap">
                  <div className="text-sm">Sender:</div>
                  <label className="text-sm flex items-center gap-1">
                    <input
                      type="radio"
                      name="sender"
                      checked={sender === 'a'}
                      onChange={() => setSender('a')}
                    />
                    {current?.a?.name}
                  </label>
                  <label className="text-sm flex items-center gap-1">
                    <input
                      type="radio"
                      name="sender"
                      checked={sender === 'b'}
                      onChange={() => setSender('b')}
                    />
                    {current?.b?.name}
                  </label>
                  <div className="ml-auto text-xs text-zinc-500">
                    Slot: {fmtSlot(current?.slotISO)}
                  </div>
                </div>

                {reqState.isError && (
                  <div className="mt-3 text-sm text-red-600">
                    Failed to send request. Please try again.
                  </div>
                )}

                <div className="mt-6 flex justify-end gap-3">
                  <button className="rounded-xl border px-4 py-2" onClick={closeModal}>
                    Close
                  </button>
                  <button
                    className="rounded-xl bg-black text-white px-4 py-2 disabled:opacity-50"
                    disabled={reqState.isLoading}
                    onClick={approveAndSend}
                  >
                    {reqState.isLoading ? 'Sending…' : 'Approve & Send Request'}
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
