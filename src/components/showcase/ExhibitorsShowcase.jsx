// src/components/exhibitors/ExhibitorsShowcase.jsx
import React from "react";
import "./exhibitors-showcase.css";

/* 🔌 data hooks (wire only; design unchanged) */
import { useSearchProfilesQuery } from "../../features/bp/BPApiSlice";
import { useGetEventQuery } from "../../features/events/eventsApiSlice";
import imageLink from "../../utils/imageLink";

/* tiny inline icons */
const I = {
  cal: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="16" rx="3" stroke="currentColor"/><path d="M8 3v4M16 3v4M3 10h18" stroke="currentColor"/></svg>),
  pin: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11Z" stroke="currentColor"/><circle cx="12" cy="10" r="2" stroke="currentColor"/></svg>),
  arrowNE: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M7 17 17 7M9 7h8v8" stroke="currentColor" strokeWidth="2"/></svg>),
};

/* date helper (unchanged) */
const fmtRange = (a,b) => {
  try{
    const A=a?new Date(a):null, B=b?new Date(b):null;
    const md = (d)=>d.toLocaleDateString(undefined,{day:"2-digit",month:"short"});
    const y  = (d)=>d.toLocaleDateString(undefined,{year:"numeric"});
    if(A&&B){
      const sameMonth = A.getMonth()===B.getMonth() && A.getFullYear()===B.getFullYear();
      return sameMonth? `${md(A)} – ${B.getDate()} ${y(A)}` : `${md(A)} ${y(A)} – ${md(B)} ${y(B)}`;
    }
    const D=A||B; return D? `${md(D)} ${y(D)}` : "";
  }catch{return "";}
};
const first = (arr)=> Array.isArray(arr) && arr.length ? arr[0] : "";

/* ================= DEMO (kept) ================= */
const DEMO = [
  // switched links to /BusinessProfile/:id as requested
  { id:"bp_1", orgName:"EASTWOOD Leipzig", industry:"Industrial Engineering", start:"2025-09-18", end:"2025-09-19", city:"Leipzig", country:"Germany", logo:"https://img.freepik.com/free-vector/gradient-logo_23-2148149231.jpg?semt=ais_hybrid&w=740&q=80", href:"/BusinessProfile/bp_1" },
  { id:"bp_2", orgName:"TECHSPO Singapore", industry:"IT & Technology",       start:"2025-09-18", end:"2025-09-19", city:"Singapore", country:"Singapore", logo:"https://img.freepik.com/premium-vector/s-logo-design-creative-modern-s-letter-logo-design-abstract-s-logo-design_469822-718.jpg", href:"/BusinessProfile/bp_2" },
  { id:"bp_3", orgName:"Logistics Tech Summit", industry:"Logistics",          start:"2025-09-18", end:"2025-09-19", city:"Berlin", country:"Germany", logo:"https://img.freepik.com/premium-vector/fa-letter-logo-design_877718-250.jpg?w=360", href:"/BusinessProfile/bp_3" },
  { id:"bp_5", orgName:"AEC Business Expo", industry:"Building & Construction", start:"2025-09-18", end:"2025-09-19", city:"Houston", country:"USA", logo:"https://img.freepik.com/premium-vector/s-letter-logo-design-unique-modern-logo-design-creative-s-logo-design_469822-704.jpg?w=360", href:"/BusinessProfile/bp_5" },
  { id:"bp_6", orgName:"Textile Sourcing Meet", industry:"Fashion",            start:"2025-09-18", end:"2025-09-19", city:"Jaipur", country:"India", logo:"https://img.freepik.com/premium-vector/sh-letter-logo-design_646665-539.jpg", href:"/BusinessProfile/bp_6" },
  { id:"bp_4", orgName:"Sao Paulo Boat Show", industry:"Marine & Mobility",    start:"2025-08-18", end:"2025-08-23", city:"São Paulo", country:"Brazil", logo:"https://img.freepik.com/premium-vector/f-letter-logo-design-unique-modern-logo-design_469822-2047.jpg", href:"/BusinessProfile/bp_4" },
  { id:"bp_7", orgName:"Infrabuild North India", industry:"Construction",      start:"2025-09-18", end:"2025-09-19", city:"New Delhi", country:"India", logo:"https://img.freepik.com/premium-vector/sd-letter-logo-design-creative-modern-logo-design_469822-1252.jpg?w=360", href:"/BusinessProfile/bp_7" },
  { id:"bp_8", orgName:"International Oil & Gas", industry:"Energy",           start:"2025-09-18", end:"2025-09-19", city:"New Delhi", country:"India", logo:"https://img.freepik.com/premium-vector/logo-technology-company-business-brand_737924-5443.jpg", href:"/BusinessProfile/bp_8" },
];

export default function ExhibitorsShowcase({
  heading="Trade show calendar",
  items = [],
  onCardClick,
  panelCtaHref="/events",
  eventId='68e6764bb4f9b08db3ccec04',                // ⬅ optional: fetch the spotlight event if provided
}) {
  /* ---------- LEFT: Business Profiles (wire + strict fallback to DEMO) ---------- */
  const { data: bpRes } = useSearchProfilesQuery({}, { refetchOnMountOrArgChange: true });

  // Map API BusinessProfile -> your card shape (orgName/industry/country/logo/href)
  const apiProfiles = React.useMemo(() => {
    const raw = bpRes?.data || bpRes?.results || bpRes?.profiles || [];
    return raw.map(p => ({
      id: p._id || p.id,
      orgName: p.name || p.orgName || "Untitled",
      industry: first(p.industries) || p.industry || "—",
      city: "", // BP doesn’t carry city; keep empty to preserve your layout
      country: first(p.countries) || p.country || "",
      logo: p.logoUpload || p.logo || "",
      href: `/BusinessProfile/${p._id || p.id || ""}`,
    }));
  }, [bpRes]);

  // Use priority: items prop → API → DEMO
  const data = React.useMemo(() => {
    if (Array.isArray(items) && items.length) return items;
    if (Array.isArray(apiProfiles) && apiProfiles.length) return apiProfiles;
    return DEMO;
  }, [items, apiProfiles]);

  /* ---------- RIGHT: Spotlight Event (wire; fallback kept) ---------- */
  const { data: evData } = useGetEventQuery(eventId, { skip: !eventId });

  return (
    <section className="ex-section">
      <h2 className="ev-title text-center m-3">{heading}</h2>
      <div className="ex-grid container">
        {/* LEFT (unchanged markup) */}
        <div className="ex-left">
          <h3 className="ex-h"></h3>
          <div className="ex-cards">
            {data.map((x)=> {
              const href = x.href || `/BusinessProfile/${x.id||x._id||""}`;
              return (
                <article key={x.id||x._id} className="ex-card">
                  <button
                    type="button"
                    className="ex-hit"
                    onClick={()=> onCardClick? onCardClick(x) : (window.location.href = href)}
                    aria-label={`Open ${x.orgName}`}
                  />
                  <div className="ex-top">
                    <span className="ex-logo" style={{backgroundImage:`url(${x.logo||""})`}} role="img" aria-label={`${x.orgName} logo`} />
                    <h6 className="ex-title" title={x.orgName}>{x.orgName} </h6>
                  </div>
                  <div className="ex-meta">
                    <span className="chip"><I.cal/>{fmtRange(x.start,x.end)}</span>
                    <span className="chip"><I.pin/>{x.city && x.country ? `${x.city}, ${x.country}` : (x.city||x.country||"—")}</span>
                  </div>
                  <div className="ex-foot">
                    <span className="cat">{x.industry||"—"}</span>
                    <span className="go"><I.arrowNE/></span>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        {/* RIGHT: bricks/spotlight — keep your layout; only inject fetched event if available */}
        <aside className="ex-panel ex-panel--neo" aria-label="Discover events">
          <div className="ex-panel-body ex-panel-tight">
            {(() => {
              // Use fetched event if we have it; else keep your inline mock sequence
              const fallbackList = [
                { id:"ex1", orgName:"EASTWOOD Leipzig",  start:"2025-11-02", end:"2025-11-03", city:"Leipzig", country:"Germany", hero:"https://images.unsplash.com/photo-1531058020387-3be344556be6?q=80&w=1600&auto=format&fit=crop" },
                { id:"ex2", orgName:"TECHSPO Singapore",  start:"2025-12-08", end:"2025-12-09", city:"Singapore", country:"Singapore", hero:"https://images.unsplash.com/photo-1531297484001-80022131f5a1?q=80&w=1600&auto=format&fit=crop" }
              ];

              let next;
              if (evData) {
                next = {
                  id: evData._id || evData.id,
                  orgName: evData.title || "Upcoming event",
                  start: evData.startDate, end: evData.endDate,
                  city: evData.city || evData.location?.city,
                  country: evData.country || evData.location?.country,
                  hero: evData.cover ||  fallbackList[0].hero,
                };
              } else {
                const now = new Date();
                const list = fallbackList;
                next = [...list]
                  .filter(x => x?.start && new Date(x.start) >= now)
                  .sort((a,b)=> new Date(a.start) - new Date(b.start))[0] || list[0];
              }

              const nextEvtHref = next?.id ? `/event/${next.id}` : "/events/next";
              const nextExhHref = next?.id ? `/event/${next.id}/exhibitors` : "/exhibitors/next";
              const dateRange = fmtRange(next?.start, next?.end);

              const topIndustries = Array.from(new Set((Array.isArray(data)?data:DEMO).map(x=>x.industry).filter(Boolean))).slice(0,6);
              return (
                <>
                  <h3 className="p-title">InnoPreneurs Days X GITS</h3>
                  <p className="p-sub">Explore upcoming trade events and meet exhibitors ready to do business.</p>

                  <a className="xp-card xp-spotlight" href={nextEvtHref} title={next?.orgName || "Next event"}>
                    <span
                      className="xp-bg"
                      style={{ backgroundImage: `linear-gradient(to top, rgba(36,58,102,.78), rgba(36,58,102,.25)), url(${imageLink(next?.hero)})` }}
                      aria-hidden="true"
                    />
                    {dateRange ? <span className="xp-pill">{dateRange}</span> : null}
                    <span className="xp-title">{next?.orgName || "Upcoming event"}</span>
                    <span className="xp-sub">
                      {(next?.city && next?.country) ? `${next.city}, ${next.country}` : (next?.city || next?.country || "—")}
                    </span>
                  </a>

                  <div className="xp-tiles">
                    <a className="xp-card xp-cta xp-cta--brand" href={panelCtaHref}>
                      <span className="xp-cta-txt">See all events</span>
                    </a>

                    <a className="xp-card xp-ghost" href={nextExhHref}>
                      <span className="xp-ghost-title">View exhibitors</span>
                    </a>
                  </div>
                    <div className="xp-chips" role="list" aria-label="Popular industries">
                      <a className="btn bg-white text-dark" href={`/event/${eventId}/attendees`}>Attendees</a>
                      <a className="btn bg-white text-dark" href={`/event/${eventId}/speakers`}>Speakers</a>
                    </div>
                  

                  <ul className="p-check">
                    <li> B2B matchmaking</li>
                  </ul>
                </>
              );
            })()}
          </div>
        </aside>
      </div>
    </section>
  );
}
