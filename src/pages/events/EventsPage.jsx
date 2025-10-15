import React, { useMemo, useState, useCallback } from "react";
import { Link , useSearchParams } from "react-router-dom";
import {
  FiSearch,
  FiFilter,
  FiCalendar,
  FiMapPin,
  FiUsers,
  FiArrowRight,
  FiRefreshCw,
  FiChevronDown,
  FiDownload,
  FiXCircle,
  FiEye,
  FiGlobe,
} from "react-icons/fi";
import {useGetEventsQuery} from "../../features/events/eventsApiSlice"; // if missing, the demo data below is used
import "./events.css";
import Footer from "../../components/footer/Footer";
import { cta, footerData, nav, topbar } from "../main.mock";
import HeaderShell from "../../components/layout/HeaderShell";
import imageLink from "../../utils/imageLink";
import ReactCountryFlag from "react-country-flag";
const demoEvents = [];
const fmtRange = (s, e) => {
  try {
    const S = s ? new Date(s) : null,
      E = e ? new Date(e) : null;
    if (!S && !E) return "";
    const f = (d, o) => new Intl.DateTimeFormat(undefined, o).format(d);
    if (S && E) {
      const sameY = S.getFullYear() === E.getFullYear(),
        sameM = sameY && S.getMonth() === E.getMonth();
      return sameM
        ? `${f(S, { month: "short", day: "numeric" })} – ${f(E, {
            day: "numeric",
          })}, ${S.getFullYear()}`
        : `${f(S, { month: "short", day: "numeric", year: "numeric" })} – ${f(
            E,
            { month: "short", day: "numeric", year: "numeric" }
          )}`;
    }
    return f(S || E, { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return "";
  }
};
const where = (e) =>
  [e?.venueName, e?.city, e?.country].filter(Boolean).join(" · ");
const pct = (a, b) => {
  const cap = Math.max(1, Number(a || 0)),
    take = Math.max(0, Number(b || 0));
  return Math.max(0, Math.min(100, Math.round((take / cap) * 100)));
};
const icsEscape = (s) =>
  String(s || "")
    .replace(/([,;])/g, "\\$1")
    .replace(/\n/g, "\\n");
const toICS = (d) =>
  d
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
const downloadIcs = (ev) => {
  try {
    const s = ev?.startDate ? new Date(ev.startDate) : null,
      e = ev?.endDate ? new Date(ev.endDate) : null;
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//App//Events//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      `UID:${(ev?.id || ev?.slug || ev?.title || "evt").replace(
        /\s+/g,
        "-"
      )}@app`,
      `SUMMARY:${icsEscape(ev?.title)}`,
      ev?.description ? `DESCRIPTION:${icsEscape(ev.description)}` : "",
      s ? `DTSTART:${toICS(s)}` : "",
      e ? `DTEND:${toICS(e)}` : "",
      where(ev) ? `LOCATION:${icsEscape(where(ev))}` : "",
      "END:VEVENT",
      "END:VCALENDAR",
    ]
      .filter(Boolean)
      .join("\r\n");
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(ev?.title || "event").replace(/\s+/g, "_")}.ics`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch {}
};
export default function EventsPage() {
  const { data, isLoading, isError } = useGetEventsQuery?.() || {
    data: null,
    isLoading: false,
    isError: false,
  };
   const [params] = useSearchParams();
   const [qs, setQs] = useState("");
   const [country, setCountry] = useState("all");
   const [target, setTarget] = useState("all");
   const [when, setWhen] = useState(params.get('when') || "all");
  const [sort, setSort] = useState("dateAsc");
  const events = useMemo(() => {
    const base = Array.isArray(data) ? data : demoEvents;
    return base?.map((x) => ({ ...x, id: x.id || x._id }));
  }, [data]);
  const filtered = useMemo(() => {
    const now = Date.now(),
      txt = String(qs).toLowerCase().trim();
    let arr = events.filter((ev) => {
      if (when === "upcoming" && new Date(ev.endDate).getTime() < now)
        return false;
      if (when === "past" && new Date(ev.startDate).getTime() > now)
        return false;
      if (
        country !== "all" &&
        String(ev.country || "").toLowerCase() !== country
      )
        return false;
      if (target !== "all" && String(ev.target || "").toLowerCase() !== target)
        return false;
      if (txt) {
        const hay = [
          ev.title,
          ev.description,
          ev.city,
          ev.country,
          ev.venueName,
          ev.target,
        ]
          .map((s) => String(s || "").toLowerCase())
          .join(" ");
        if (!hay.includes(txt)) return false;
      }
      return true;
    });
    if (sort === "dateAsc")
      arr.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
    if (sort === "dateDesc")
      arr.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
    if (sort === "seatsLeft")
      arr
        .sort((a, b) => a.capacity - a.seatsTaken - (b.capacity - b.seatsTaken))
        .reverse();
    if (sort === "name")
      arr.sort((a, b) => String(a.title).localeCompare(String(b.title)));
    return arr;
  }, [events, qs, country, target, when, sort]);
  const countries = useMemo(() => {
    const set = new Set(
      events?.map((e) => String(e.country || "").toLowerCase()).filter(Boolean)
    );
    return ["all", ...Array.from(set)];
  }, [events]);
  const targets = useMemo(() => {
    const set = new Set(
      events?.map((e) => String(e.target || "").toLowerCase()).filter(Boolean)
    );
    return ["all", ...Array.from(set)];
  }, [events]);
  const reset = useCallback(() => {
    setQs("");
    setCountry("all");
    setTarget("all");
    setWhen("upcoming");
    setSort("dateAsc");
  }, []);
  return (
    <>
        <HeaderShell topbar={topbar} nav={nav} cta={cta} />
    <main className="ev">
      {/* REPLACE the entire <div className="ev-hero">...</div> with this */}
<div className="ev-hero">
  <div className="container">
    <div className="evh">
      <div className="evh-txt">
        <h1 className="evh-title"><FiGlobe/>Explore Events</h1>
        <p className="evh-sub">Filter by date, country, and audience.</p>
      </div>

      <label className="evh-search">
        <FiSearch/>
        <input
          value={qs}
          onChange={(e)=>setQs(e.target.value)}
          placeholder="Search by title, city, country, target…"
          aria-label="Search events"
        />
      </label>

      <div className="evh-rows">
        <div className="evh-when" role="tablist" aria-label="When">
          <button type="button" className="evh-pill" aria-pressed={when==="upcoming"} onClick={()=>setWhen("upcoming")}>Upcoming</button>
          <button type="button" className="evh-pill" aria-pressed={when==="past"} onClick={()=>setWhen("past")}>Past</button>
          <button type="button" className="evh-pill" aria-pressed={when==="all"} onClick={()=>setWhen("all")}>All</button>
          <button type="button" className="evh-reset" onClick={reset}>
          <FiRefreshCw/> Reset
        </button>
        </div>

        <div className="evh-fields">
          <label className="evh-field">
            <span>Country</span>
            <select value={country} onChange={(e)=>setCountry(e.target.value)} aria-label="Country filter">
              {countries.map(c=><option key={c} value={c}>{c==="all"?"All":<ReactCountryFlag svg countryCode={c.toUpperCase()} style={{ fontSize: '1.2em' }} />
              }</option>)}
            </select>
          </label>
          <label className="evh-field">
            <span>Target</span>
            <select value={target} onChange={(e)=>setTarget(e.target.value)} aria-label="Target filter">
              {targets.map(t=><option key={t} value={t}>{t==="all"?"All":t}</option>)}
            </select>
          </label>
          <label className="evh-field">
            <span>Sort</span>
            <select value={sort} onChange={(e)=>setSort(e.target.value)} aria-label="Sort events">
              <option value="dateAsc">Date ↑</option>
              <option value="dateDesc">Date ↓</option>
              <option value="name">Name A–Z</option>
              <option value="seatsLeft">Seats left</option>
            </select>
          </label>
        </div>

        
      </div>
    </div>
  </div>

  {/* keep subtle ornaments */}
  <div className="ev-orn ev-o1"></div>
  <div className="ev-orn ev-o2"></div>
</div>

      <div className="container">
        {isLoading ? (
          <div className="ev-grid">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="ev-card skel" />
            ))}
          </div>
        ) : null}
        {isError ? (
          <div className="ev-empty">
            Couldn’t load events. Showing demo list.
          </div>
        ) : null}
        <div className="ev-grid">
          {(isError ? demoEvents : filtered).map((ev) => (
            <EventCard key={ev.id} ev={ev} />
          ))}
        </div>
        {!(isError ? demoEvents : filtered).length && !isLoading ? (
          <div className="ev-empty">No events match your filters.</div>
        ) : null}
      </div>
    </main>
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
function EventCard({ ev }) {
  const capacityPct =
    typeof ev.capacity === "number" && typeof ev.seatsTaken === "number"
      ? pct(ev.capacity, ev.seatsTaken)
      : null;
      const ipdaysId = "68e6764bb4f9b08db3ccec04"
  const viewHref = ev?.id !== ipdaysId ? `/event/${ev?.id}/old` : ev?.id ? `/event/${ev.id}` : ev?.slug? `/event/${ev.slug}`: "#";
  return (
    <article className={`ev-card ${ev?.isCancelled ? "-cancel" : ""}`}>
      <div
        className="ev-media"
        style={{ backgroundImage: `url(${imageLink( ev?.cover) || fallbackPic(ev)})` }}
      >
        <div className="ev-grad" />
        <div className="ev-chips">
          {ev?.isCancelled ? (
            <span className="ev-chip -bad">
              <FiXCircle />
              Cancelled
            </span>
          ) : null}
          {ev?.isPublished ? (
            <span className="ev-chip">
              <FiEye />
              Published
            </span>
          ) : null}
          {ev?.target ? (
            <span className="ev-chip -brand">{ev.target}</span>
          ) : null}
        </div>
        <div className="ev-date">
          <FiCalendar />
          {fmtRange(ev?.startDate, ev?.endDate)}
        </div>
      </div>
      <div className="ev-body">
        <h3 className="ev-name">{ev?.title || "—"}</h3>
        <div className="ev-meta">
          {where(ev) ? (
            <span className="ev-pill">
              <FiMapPin />
              {where(ev)}
            </span>
          ) : null}
          {typeof ev?.capacity === "number" ? (
            <span className="ev-pill">
              <FiUsers />
              {ev.capacity - ev.seatsTaken >= 0
                ? ev.capacity - ev.seatsTaken
                : 0}{" "}
              seats left
            </span>
          ) : null}
        </div>
        {typeof capacityPct === "number" ? (
          <div className="ev-cap">
            <div className="ev-cap-track">
              <div
                className="ev-cap-fill"
                style={{ width: `${capacityPct}%` }}
              />
            </div>
            <div className="ev-cap-row">
              <span>
                {ev.seatsTaken || 0}/{ev.capacity || 0}
              </span>
              <span>{capacityPct}% filled</span>
            </div>
          </div>
        ) : null}
        <p className="ev-desc">{ev?.description || "—"}</p>
        <div className="ev-actions">
          <Link className="ev-btn ev-primary" to={viewHref}>
            <FiArrowRight />
            View details
          </Link>
          
          {ev?.mapLink ? (
            <a
              className="ev-btn"
              href={ev.mapLink}
              target="_blank"
              rel="noreferrer"
            >
              <FiMapPin />
              Map
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}
function fallbackPic(e) {
  const k = String(e?.city || e?.country || "tech").toLowerCase();
  if (k.includes("paris"))
    return "https://images.unsplash.com/photo-1528909514045-2fa4ac7a08ba?w=1400&q=80";
  if (k.includes("dubai"))
    return "https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?w=1400&q=80";
  return "https://images.unsplash.com/photo-1482192596544-9eb780fc7f66?w=1400&q=80";
}
