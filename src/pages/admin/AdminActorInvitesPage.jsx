// src/pages/admin/AdminActorInvitesPage.jsx
import React, { useMemo, useState } from 'react';
import { useSearchActorsQuery, useGenerateInviteMutation, useListInviteCodesQuery } from '../../features/invites/invitesApiSlice';
import imageLink from '../../utils/imageLink';

function RoleBadge({ r }){
  const txt = (r||'').toLowerCase();
  const cls = txt==='exhibitor' ? 'bg-amber-100 text-amber-800' :
              txt==='speaker'   ? 'bg-indigo-100 text-indigo-800' :
                                  'bg-emerald-100 text-emerald-800';
  return <span className={`px-2 py-0.5 rounded text-xs font-semibold ${cls}`}>{txt||'—'}</span>;
}

function CopyBtn({ value }){
  return (
    <button
      className="px-2 py-1 text-xs bg-slate-800 text-white rounded"
      onClick={()=>{ navigator.clipboard?.writeText(value||''); }}
      title="Copy code"
    >Copy</button>
  );
}

export default function AdminActorInvitesPage(){
  // Filters
  const [role, setRole] = useState('');
  const [eventId, setEventId] = useState(''); // wire to your event picker if you have one
  const [search, setSearch] = useState('');

  // Picker state
  const [q, setQ] = useState('');
  const [picked, setPicked] = useState(null);

  const { data: pickRes } = useSearchActorsQuery({ q, role, eventId, limit: 10 }, { skip: q.trim().length < 1 });
  const results = pickRes?.data || [];

  const [generateInvite, { isLoading: isGen }] = useGenerateInviteMutation();

  const onGenerate = async ()=>{
    if (!picked) return;
    try{
      await generateInvite({ actorId: picked.id, actorRole: picked.role, eventId: eventId || null }).unwrap();
      setPicked(null);
      setQ('');
    }catch(e){ /* surface with your toast if you want */ }
  };

  const [page, setPage] = useState(1);
  const { data: listRes, isFetching: listLoading } =
    useListInviteCodesQuery({ search, role, eventId, page, limit: 20 });

  const rows = listRes?.data || [];

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-4">Actor Invitation Codes</h1>

      {/* Generate */}
      <section className="bg-white rounded-2xl shadow border p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-end md:gap-4">
          <div className="flex-1">
            <label className="block text-sm font-semibold mb-1">Search actor</label>
            <input
              className="w-full border rounded px-3 py-2"
              placeholder="Type a name or brand…"
              value={q}
              onChange={e=>{ setQ(e.target.value); setPicked(null); }}
            />
            {q && results.length > 0 && (
              <div className="mt-2 border rounded max-h-56 overflow-auto">
                {results.map(r=>(
                  <button
                    key={`${r.role}:${r.id}`}
                    className={`w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-50 text-left ${picked?.id===r.id ? 'bg-slate-50' : ''}`}
                    onClick={()=>setPicked(r)}
                  >
                    <img src={imageLink(r.photo)} alt="" className="w-8 h-8 rounded-full object-cover bg-slate-100"/>
                    <div className="flex-1">
                      <div className="text-sm font-semibold">{r.name || '—'}</div>
                      <div className="text-xs text-slate-500">{r.role}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="w-full md:w-48">
            <label className="block text-sm font-semibold mb-1">Role filter</label>
            <select className="w-full border rounded px-3 py-2" value={role} onChange={e=>setRole(e.target.value)}>
              <option value="">All</option>
              <option value="attendee">Attendee</option>
              <option value="exhibitor">Exhibitor</option>
              <option value="speaker">Speaker</option>
            </select>
          </div>
          <div className="w-full md:w-48">
            <label className="block text-sm font-semibold mb-1">Event (opt)</label>
            <input
              className="w-full border rounded px-3 py-2"
              placeholder="eventId"
              value={eventId}
              onChange={e=>setEventId(e.target.value)}
            />
          </div>
          <div className="w-full md:w-40">
            <button
              className={`w-full h-[38px] mt-6 rounded font-semibold ${picked ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500 cursor-not-allowed'}`}
              onClick={onGenerate}
              disabled={!picked || isGen}
            >
              {isGen ? 'Generating…' : 'Generate code'}
            </button>
          </div>
        </div>
        {picked && (
          <div className="mt-3 text-sm text-slate-600">
            Selected: <b>{picked.name}</b> <span className="mx-2">•</span> <RoleBadge r={picked.role}/>
          </div>
        )}
      </section>

      {/* List */}
      <section className="bg-white rounded-2xl shadow border">
        <div className="px-4 py-3 border-b flex items-center gap-3">
          <input
            className="flex-1 border rounded px-3 py-2 text-sm"
            placeholder="Filter by name or code…"
            value={search}
            onChange={e=>{ setSearch(e.target.value); setPage(1); }}
          />
          <select className="border rounded px-3 py-2 text-sm" value={role} onChange={e=>{ setRole(e.target.value); setPage(1); }}>
            <option value="">All roles</option>
            <option value="attendee">Attendee</option>
            <option value="exhibitor">Exhibitor</option>
            <option value="speaker">Speaker</option>
          </select>
          <input
            className="border rounded px-3 py-2 text-sm w-48"
            placeholder="eventId"
            value={eventId}
            onChange={e=>{ setEventId(e.target.value); setPage(1); }}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="text-left px-4 py-2 w-12"></th>
                <th className="text-left px-4 py-2">Actor</th>
                <th className="text-left px-4 py-2">Role</th>
                <th className="text-left px-4 py-2">Invite code</th>
                <th className="text-left px-4 py-2">Invites</th>
                <th className="text-left px-4 py-2">Created</th>
                <th className="text-left px-4 py-2">Profile</th>
              </tr>
            </thead>
            <tbody>
              {listLoading ? (
                <tr><td colSpan="7" className="px-4 py-6 text-center text-slate-500">Loading…</td></tr>
              ) : rows.length ? rows.map(r=>(
                <tr key={r.id} className="border-b hover:bg-slate-50">
                  <td className="px-4 py-2">
                    <img src={imageLink(r.photo)} alt="" className="w-9 h-9 rounded-full object-cover bg-slate-100"/>
                  </td>
                  <td className="px-4 py-2 font-semibold">{r.name || '—'}</td>
                  <td className="px-4 py-2"><RoleBadge r={r.role}/></td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <code className="px-2 py-1 rounded bg-slate-100">{r.code}</code>
                      <CopyBtn value={r.code}/>
                    </div>
                  </td>
                  <td className="px-4 py-2">{r.usageCount || 0}</td>
                  <td className="px-4 py-2">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'}</td>
                  <td className="px-4 py-2">
                    {/* Placeholder admin profile link; you wire it */}
                    <a className="text-indigo-600 hover:underline" href={`/admin/members/${r.role}s?id=${r.actorId}`}>Open</a>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="7" className="px-4 py-6 text-center text-slate-500">No invite codes found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 flex items-center justify-between text-xs text-slate-600">
          <div>Total: {listRes?.total ?? 0}</div>
          <div className="flex items-center gap-2">
            <button
              className="px-2 py-1 border rounded disabled:opacity-50"
              disabled={page<=1}
              onClick={()=>setPage(p=>Math.max(1,p-1))}
            >Prev</button>
            <span>Page {page}</span>
            <button
              className="px-2 py-1 border rounded disabled:opacity-50"
              disabled={!listRes || (page*20)>= (listRes.total||0)}
              onClick={()=>setPage(p=>p+1)}
            >Next</button>
          </div>
        </div>
      </section>
    </div>
  );
}
