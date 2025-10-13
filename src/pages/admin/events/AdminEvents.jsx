// AdminEvents.jsx — Part 1 (page wiring + filters + RTK hooks)
// Focus: great list display, filters, master/detail, quick changes (publish/cancel, dates, cover)
import React from "react";
import "../../../components/admin/admin.css";
import "../../../components/admin/dashboard/admin.dashboard.css";
import "./admin.events.tweaks.css"
import TopControls from "../../../components/admin/dashboard/TopControls";
import KpiRow from "../../../components/admin/dashboard/KpiRow";
import EventsList from "../../../components/admin/events/EventsList";
import EventInspector from "../../../components/admin/events/EventInspector";

// RTK hooks (you’ll implement in your slices)
import {
  useGetEventsAdminQuery,
  useGetEventsStatsQuery,
  usePublishEventMutation,
  useUpdateEventMutation,
} from "../../../features/events/eventsApiSlice";
import {
  useGetEventGalleryQuery,
  useSetEventCoverMutation,
} from "../../../features/events/eventsApiSlice";
const kpiItems = (stats = {}, scope = "") => ([
  { title: "Revenue",   value: stats?.revenue?.total ?? 0,   delta: stats?.revenue?.deltaPct ?? 0,   trend: stats?.revenue?.trend ?? [],   footnote: scope },
  { title: "Tickets",   value: stats?.tickets?.total ?? 0,   delta: stats?.tickets?.deltaPct ?? 0,   trend: stats?.tickets?.trend ?? [],   footnote: scope },
  { title: "Occupancy", value: stats?.occupancy?.avgPct ?? 0, delta: 0,                              trend: [],                              footnote: scope },
  { title: "Sessions",  value: stats?.schedule?.sessions ?? 0, delta: 0,                             trend: [],                              footnote: scope },
]);

/* ---------- DEMO FALLBACKS (safe if API empty) ---------- */
const DEMO_EVENTS = [
  { id:"evA", title:"AI Expo Tunis — Next-Gen ML Systems and Platforms", target:"B2B", city:"Tunis", country:"TN",
    startDate:"2025-10-02", endDate:"2025-10-05", capacity:1200, seatsTaken:820, isPublished:true, isCancelled:false,
    tickets:880, checkedIn:420, revenue:126000, sessions:28 },
  { id:"evB", title:"Green Energy Summit", target:"Public", city:"Paris", country:"FR",
    startDate:"2025-06-10", endDate:"2025-06-12", capacity:600, seatsTaken:600, isPublished:false, isCancelled:false,
    tickets:610, checkedIn:590, revenue:89000, sessions:12 },
  { id:"evC", title:"Startup Night Berlin", target:"B2C", city:"Berlin", country:"DE",
    startDate:"2025-03-05", endDate:"2025-03-05", capacity:900, seatsTaken:740, isPublished:false, isCancelled:true,
    tickets:760, checkedIn:0, revenue:0, sessions:6 },
  { id:"evD", title:"Sahara Tech Forum", target:"B2B", city:"Tozeur", country:"TN",
    startDate:"2025-12-01", endDate:"2025-12-03", capacity:450, seatsTaken:120, isPublished:true, isCancelled:false,
    tickets:135, checkedIn:0, revenue:21500, sessions:10 },
];

const DEMO_GALLERY = {
  evA: [
    { id:"g1", file:"https://images.unsplash.com/photo-1531058020387-3be344556be6?w=600&q=60", type:"image", isCover:true },
    { id:"g2", file:"https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&q=60", type:"image" },
  ],
  evB: [],
  evC: [{ id:"g3", file:"https://images.unsplash.com/photo-1482192596544-9eb780fc7f66?w=600&q=60", type:"image", isCover:true }],
  evD: [],
};

const DEMO_STATS = (id) => {
  const e = DEMO_EVENTS.find(x => x.id === id);
  if (!e) return {};
  const pct = e.capacity ? (e.seatsTaken / e.capacity) * 100 : 0;
  return {
    revenue: { total: e.revenue || 0, deltaPct: 8, trend:[40,55,52,60,70,66,80] },
    tickets: { total: e.tickets || 0, deltaPct: -2, trend:[320,310,295,300,285,280,275] },
    occupancy: { avgPct: pct },
    schedule: { sessions: e.sessions || 0 },
  };
};

/* ======================================================== */
export default function AdminEvents() {
  // filters / selection
  const [query, setQuery] = React.useState("");
  const [period, setPeriod] = React.useState("30d");
  const [currency, setCurrency] = React.useState("USD");
  const [status, setStatus] = React.useState(new Set(["published","draft","cancelled"]));
  const [preset, setPreset] = React.useState("upcoming"); // upcoming|ongoing|past|all
  const [countries, setCountries] = React.useState([]);
  const [sort, setSort] = React.useState("start"); // start|revenue|tickets|occupancy|title
  const [selectedId, setSelectedId] = React.useState(null);

  // events
  const { data: eventsResp = [], isLoading: loadingEv, refetch: refetchEv } = useGetEventsAdminQuery({
    q: query, status: Array.from(status), preset, countries, sort, period,
  });

  const eventsRaw = Array.isArray(eventsResp) ? eventsResp : (eventsResp?.items || []);
  const events = eventsRaw.length ? eventsRaw : DEMO_EVENTS;

  // default select TOP by date (assuming sort=start returns top first)
  React.useEffect(() => {
    if (!events?.length) return;
    if (!selectedId) {
      const first = events[0];
      setSelectedId(first?.id || first?._id || null);
    }
  }, [events]); // eslint-disable-line

  // stats
  const { data: statsAll = {}, refetch: refetchAll } =
    useGetEventsStatsQuery({ period, currency, filters: { status: Array.from(status), countries, preset } });

  const queryOneArgs = selectedId ? { period, currency, eventId: selectedId } : { period, currency, __skip:true };
  const { data: statsOneResp = {}, refetch: refetchOne } =
    useGetEventsStatsQuery(queryOneArgs, { skip: !selectedId });

  const statsOne = Object.keys(statsOneResp || {}).length ? statsOneResp : DEMO_STATS(selectedId);

  // selected row
  const selected = React.useMemo(
    () => events.find(e => (e?.id || e?._id) === selectedId) || null,
    [events, selectedId]
  );

  // gallery
  const { data: galleryResp = [] } = useGetEventGalleryQuery(selectedId, { skip: !selectedId });
  const gallery = (galleryResp && galleryResp.length) ? galleryResp : (DEMO_GALLERY[selectedId] || []);

  // mutations
  const [publishEvent]  = usePublishEventMutation();
  const [updateEvent]   = useUpdateEventMutation();
  const [setEventCover] = useSetEventCoverMutation();

  const refreshAll = (id) => { refetchEv(); refetchAll(); if (id && id===selectedId) refetchOne(); };

  const togglePublish = async (row, next) => {
    const id = row?.id || row?._id; if (!id) return;
    try { await publishEvent({ id, isPublished: next }).unwrap?.(); }
    finally { refreshAll(id); }
  };
  const toggleCancel = async (row, next) => {
    const id = row?.id || row?._id; if (!id) return;
    const patch = next ? { isCancelled: true, isPublished: false } : { isCancelled: false };
    try { await updateEvent({ id, patch }).unwrap?.(); }
    finally { refreshAll(id); }
  };
  const changeDates = async (row, startDate, endDate) => {
    const id = row?.id || row?._id; if (!id) return;
    if (new Date(endDate) <= new Date(startDate)) return;
    try { await updateEvent({ id, patch: { startDate, endDate } }).unwrap?.(); }
    finally { refreshAll(id); }
  };
  const setCover = async (eventId, galleryItemId) => {
    if (!eventId || !galleryItemId) return;
    try { await setEventCover({ eventId, galleryItemId }).unwrap?.(); }
    finally { refreshAll(eventId); }
  };

  return (
    <div className="admin-events">
      {/* keep your shared TopControls */}
      <TopControls
        defaultPeriod={period}
        events={["All events", ...events.map(e => e.title)]}
        currencies={["USD","EUR","TND","GBP"]}
        onChange={(s)=>{
          if (s?.period) setPeriod(s.period);
          if (s?.currency) setCurrency(s.currency);
          if (typeof s?.event === "string") {
            if (s.event === "All events") setSelectedId(events[0]?.id || events[0]?._id || null);
            else {
              const f = events.find(x=>x.title===s.event);
              setSelectedId(f?.id || f?._id || null);
            }
          }
          if (s?.action==="refresh") refreshAll(selectedId);
          if (Array.isArray(s?.countries)) setCountries(s.countries);
        }}
      />

      {/* Filters bar */}
      <div className="card p-8">
        <div className="top-controls">
          <div className="tc-left">
            <div className="esb-search" style={{ maxWidth: 420 }}>
              <input
                className="esb-input"
                placeholder="Search title, city, country, target…"
                value={query}
                onChange={(e)=>setQuery(e.target.value)}
              />
            </div>

            <div className="segment" role="tablist" aria-label="Status">
              {["published","draft","cancelled"].map(k=>(
                <button
                  key={k}
                  className={status.has(k)?"is-active":""}
                  onClick={()=>{ const nx=new Set(status); nx.has(k)?nx.delete(k):nx.add(k); setStatus(nx); }}
                >{k}</button>
              ))}
            </div>

            <div className="segment" role="tablist" aria-label="Time">
              {["upcoming","ongoing","past","all"].map(p=>(
                <button key={p} className={preset===p?"is-active":""} onClick={()=>setPreset(p)}>{p}</button>
              ))}
            </div>
          </div>

          <div className="tc-right">
            <label className="select"><span>Sort</span>
              <select value={sort} onChange={(e)=>setSort(e.target.value)}>
                <option value="start">Start date</option>
                <option value="revenue">Revenue</option>
                <option value="tickets">Tickets</option>
                <option value="occupancy">Occupancy</option>
                <option value="title">Title (A–Z)</option>
              </select>
            </label>
          </div>
        </div>
      </div>

      {/* 2-column layout (no clipping) */}
      <div className="admin-two-col">
        <EventsList
          loading={loadingEv}
          items={events}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onTogglePublish={togglePublish}
        />

        <section className="card p-12">
          {/* KPIs at top; show ONLY selected OR ALL — never both */}
          {selected ? (
            <div className="kpi-at-top">
              <KpiRow currency={currency} items={kpiItems(statsOne, "Selected event")} />
            </div>
          ) : (
            <div className="kpi-at-top">
              <KpiRow currency={currency} items={kpiItems(statsAll, "All events")} />
            </div>
          )}

          <EventInspector
            event={selected}
            currency={currency}
            statsAll={statsAll}
            // we already rendered selected KPIs; inspector doesn't render KPIs again
            onTogglePublish={togglePublish}
            onToggleCancel={toggleCancel}
            onChangeDates={changeDates}
            gallery={gallery}
            onSetCover={setCover}
          />
        </section>
      </div>
    </div>
  );
}