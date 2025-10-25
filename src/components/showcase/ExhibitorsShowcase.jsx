// src/components/exhibitors/ExhibitorsShowcase.jsx
import React from "react";
import "./exhibitors-showcase.css";

import { useGetEventQuery } from "../../features/events/eventsApiSlice";
import imageLink from "../../utils/imageLink";

/* tiny inline icons */
const I = {
  cal: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="16" rx="3" stroke="currentColor"/><path d="M8 3v4M16 3v4M3 10h18" stroke="currentColor"/></svg>),
  pin: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11Z" stroke="currentColor"/><circle cx="12" cy="10" r="2" stroke="currentColor"/></svg>),
  arrowNE: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M7 17 17 7M9 7h8v8" stroke="currentColor" strokeWidth="2"/></svg>),
};

/* date helper */
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

export default function ExhibitorsShowcase({
  heading = "Trade show calendar",
  panelCtaHref = "/events",
  eventId = "68e6764bb4f9b08db3ccec04",
}) {
  const { data: evData } = useGetEventQuery(eventId, { skip: !eventId });

  // Build the "next" event object (fallback if API missing)
  const next = React.useMemo(() => {
    if (evData) {
      return {
        id: evData._id || evData.id,
        orgName: evData.title || "Upcoming event",
        start: evData.startDate,
        end: evData.endDate,
        city: evData.city || evData.location?.city,
        country: evData.country || evData.location?.country,
        hero: evData.cover || null,
      };
    }
    // simple fallback
    return {
      id: "fallback-1",
      orgName: "InnoPreneurs Days X GITS",
      start: "2025-11-02",
      end: "2025-11-03",
      city: "Leipzig",
      country: "Germany",
      hero: "https://images.unsplash.com/photo-1531058020387-3be344556be6?q=80&w=1600&auto=format&fit=crop",
    };
  }, [evData]);

  const nextEvtHref = next?.id ? `/event/${next.id}` : "/events/next";
  const nextExhHref = next?.id ? `/event/${next.id}/exhibitors` : "/exhibitors/next";
  const dateRange = fmtRange(next?.start, next?.end);

  return (
    <section className="ex-section">
      <h2 className="ev-title text-center m-3">{heading}</h2>

      {/* Single-column layout: spotlight panel takes full width */}
      <div className="ex-grid container ex-grid--single">
        <aside className="ex-panel ex-panel--full" aria-label="Discover events">
          <div className="ex-panel-body ex-panel-tight">
            <h3 className="p-title">REGISTRATION ARE OPENED !</h3>
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
          </div>
        </aside>
      </div>
    </section>
  );
}
