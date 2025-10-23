// src/pages/attendees/OpenToMeetAttendeesPage.jsx
import React from "react";
import { Link } from "react-router-dom";
import {
  FiSearch, FiX, FiFilter, FiChevronDown, FiChevronUp, FiRefreshCw, FiMessageSquare, FiUser, FiCalendar,
} from "react-icons/fi";
import "./global-meet.css";
import { useGetAttendeesForMeetingQuery } from "../../features/Actor/actorsChatApiSlice";
import { useGetEventsQuery, useGetEventQuery } from "../../features/events/eventsApiSlice";
import HeaderShell from "../../components/layout/HeaderShell";
import Footer from "../../components/footer/Footer";
import { cta, footerData, nav, topbar } from "../main.mock";
import imageLink from "../../utils/imageLink";

/* ---------------------------- Helpers ---------------------------- */
const clamp = (t, n = 90) => (t && t.length > n ? t.slice(0, n) + "…" : t || "");
const flag = (code) => (code ? (
  <span className={`fi fi-${String(code).toLowerCase()}`} style={{ marginRight: 6 }} />
) : null);

function EventBadge({ id }) {
  const { data } = useGetEventQuery(id, { skip: !id });
  const title = data?.title || data?.name || `Event ${String(id || "").slice(-6)}`;
  return <span className="gma-evbadge">{title}</span>;
}

/* --------------------------- Page --------------------------- */
export default function OpenToMeetAttendeesPage() {
  // toolbar state
  const [q, setQ] = React.useState("");
  const [expanded, setExpanded] = React.useState(true);
  const [eventId, setEventId] = React.useState("all");
  const [country, setCountry] = React.useState("all");
  const [onlyOpen, setOnlyOpen] = React.useState(true); // preselect “open to meet”

  // events for filters
  const { data: eventsRes } = useGetEventsQuery();
  const events = React.useMemo(() => {
    if (Array.isArray(eventsRes?.data)) return eventsRes.data;
    if (Array.isArray(eventsRes)) return eventsRes;
    return [];
  }, [eventsRes]);

  // query args
  const args = React.useMemo(() => {
    return {
      onlyOpen,
      q: q.trim() || undefined,
      eventId: eventId !== "all" ? eventId : undefined,
      country: country !== "all" ? country : undefined,
    };
  }, [q, onlyOpen, eventId, country]);

  const { data: attendees = [], isFetching } = useGetAttendeesForMeetingQuery(args);

  // Build country options from data (attendees’ countries, not event countries)
  const countryOpts = React.useMemo(() => {
    const s = new Set();
    attendees.forEach((a) => { if (a.country) s.add(a.country.toUpperCase()); });
    return Array.from(s).sort();
  }, [attendees]);

  // Group by event
  const groups = React.useMemo(() => {
    const by = new Map();
    attendees.forEach((a) => {
      if (!a.id_event) return;
      if (!by.has(a.id_event)) by.set(a.id_event, []);
      by.get(a.id_event).push(a);
    });
    return Array.from(by.entries()).map(([id, list]) => ({ eventId: id, list }));
  }, [attendees]);

  const onReset = () => {
    setQ("");
    setEventId("all");
    setCountry("all");
    setOnlyOpen(true);
  };

  return (
    <>
      <HeaderShell top={topbar} nav={nav} cta={cta} />
      <section className="gma">
        <div className="gma-container">
          {/* Head */}
          <header className="gma-head">
            <h2 className="gma-title">Open to Meet — Attendees</h2>
            <p className="gma-sub">Browse attendees who are open to B2B meetings, grouped by event.</p>
          </header>

          {/* Toolbar */}
          <div className={`gma-toolbar ${expanded ? "is-open" : ""}`}>
            <div className="gma-row">
              <div className="gma-search">
                <FiSearch className="gma-ico" />
                <input
                  className="gma-input"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search by name, company, title, objectives…"
                  aria-label="Search attendees"
                />
                {q ? (
                  <button type="button" className="gma-clear" onClick={() => setQ("")} aria-label="Clear search">
                    <FiX />
                  </button>
                ) : null}
              </div>

              <button
                type="button"
                className="gma-tgl"
                onClick={() => setExpanded((v) => !v)}
                aria-expanded={expanded ? "true" : "false"}
                aria-controls="gma-advanced"
              >
                <FiFilter />
                Filters
                {expanded ? <FiChevronUp /> : <FiChevronDown />}
              </button>
            </div>

            <div id="gma-advanced" className="gma-adv">
              <div className="gma-tabs">
                <button
                  type="button"
                  className={`gma-tab ${!onlyOpen ? "is-active" : ""}`}
                  onClick={() => setOnlyOpen(false)}
                  aria-pressed={!onlyOpen}
                >
                  All attendees
                </button>
                <button
                  type="button"
                  className={`gma-tab ${onlyOpen ? "is-active" : ""}`}
                  onClick={() => setOnlyOpen(true)}
                  aria-pressed={onlyOpen}
                >
                  Open to meetings
                </button>
              </div>

              <div className="gma-end">
                {/* Event filter */}
                <label className="gma-sortlab" htmlFor="gma-event">Event</label>
                <select
                  id="gma-event"
                  className="gma-select"
                  value={eventId}
                  onChange={(e) => setEventId(e.target.value)}
                >
                  <option value="all">All events</option>
                  {events.map((ev) => {
                    const id = ev?._id || ev?.id;
                    const name = ev?.title || ev?.name || "Event";
                    return (<option key={id} value={id}>{name}</option>);
                  })}
                </select>

                {/* Country filter */}
                <label className="gma-sortlab" htmlFor="gma-country">Country</label>
                <select
                  id="gma-country"
                  className="gma-select"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                >
                  <option value="all">All countries</option>
                  {countryOpts.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>

                <button type="button" className="gma-reset" onClick={onReset} title="Reset filters">
                  <FiRefreshCw />
                </button>
              </div>
            </div>
          </div>

          {/* Groups */}
          {isFetching && !attendees.length ? (
            <div className="gma-empty">Loading…</div>
          ) : (!groups.length ? (
            <div className="gma-empty">No attendees match your filters.</div>
          ) : groups.map((g) => (
            <section key={g.eventId} className="gma-group">
              <div className="gma-evbar">
                <EventBadge id={g.eventId} />
                <span className="gma-count">{g.list.length} attendee{g.list.length > 1 ? "s" : ""}</span>
              </div>

              <div className="gma-grid">
                {g.list.map((a) => (
                  <article key={a._id} className="gma-card">
                    <div className="gma-card-head">
                      <div className="gma-avatar">
                        {a.profilePic ? (
                          <img src={imageLink(a.profilePic)} alt={a.fullName} />
                        ) : (
                          <div className="gma-avatar-fallback">{(a.fullName || "?").slice(0,1).toUpperCase()}</div>
                        )}
                      </div>
                      <div className="gma-meta">
                        <div className="gma-name">{a.fullName}</div>
                        <div className="gma-sub">
                          {flag(a.country)}{a.country || "—"}{a.city ? ` • ${a.city}` : ""}
                        </div>
                        <div className="gma-sub tiny">{a.jobTitle || "—"} {a.orgName ? `@ ${a.orgName}` : ""}</div>
                      </div>
                    </div>

                    {!!a.objectives?.length && (
                      <div className="gma-tags">
                        {a.objectives.slice(0, 4).map((t, i) => (
                          <span key={i} className="gma-chip">#{t}</span>
                        ))}
                        {a.objectives.length > 4 ? <span className="gma-chip">+{a.objectives.length - 4}</span> : null}
                      </div>
                    )}

                    <div className="gma-actions">
                      <Link to={`/profile/${a._id || ""}`} className="gma-btn -outline" title="View profile">
                        <FiUser /> Profile
                      </Link>
                      <Link to={`/messages?member=${a._id || ""}`} className="gma-btn -outline" title="Message">
                        <FiMessageSquare /> Message
                      </Link>
                      <Link to={`/meeting/${a._id || ""}`} className="gma-btn" title="Book meeting">
                        <FiCalendar /> Book
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )))}
        </div>
      </section>

      <Footer
        brand={footerData.brand}
        columns={footerData.columns}
        socials={footerData.socials}
        actions={footerData.actions}
        bottomLinks={footerData.bottomLinks}
      />
    </>
  );
}
