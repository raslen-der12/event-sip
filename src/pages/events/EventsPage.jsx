import React, { useMemo, useState, useCallback, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  FiSearch,
  FiRefreshCw,
  FiCalendar,
  FiMapPin,
  FiUsers,
  FiArrowRight,
  FiXCircle,
  FiEye,
  FiGlobe,
} from "react-icons/fi";

import { useGetEventsQuery } from "../../features/events/eventsApiSlice";
import HeaderShell from "../../components/layout/HeaderShell";
import Footer from "../../components/footer/Footer";
import { cta, footerData, nav, topbar } from "../main.mock";
import imageLink from "../../utils/imageLink";
import "./events.css";

/* ───────────────── helpers ───────────────── */
const fmtRange = (s, e) => {
  try {
    const S = s ? new Date(s) : null;
    const E = e ? new Date(e) : null;
    if (!S && !E) return "";
    const f = (d, o) => new Intl.DateTimeFormat(undefined, o).format(d);
    if (S && E) {
      const sameY = S.getFullYear() === E.getFullYear();
      const sameM = sameY && S.getMonth() === E.getMonth();
      return sameM
        ? `${f(S, { month: "short", day: "numeric" })} – ${f(E, { day: "numeric" })}, ${S.getFullYear()}`
        : `${f(S, { month: "short", day: "numeric", year: "numeric" })} – ${f(E, {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}`;
    }
    return f(S || E, { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return "";
  }
};

const where = (e) => [e?.venueName, e?.city, e?.country].filter(Boolean).join(" · ");

const pct = (a, b) => {
  const cap = Math.max(1, Number(a || 0));
  const take = Math.max(0, Number(b || 0));
  return Math.max(0, Math.min(100, Math.round((take / cap) * 100)));
};

const icsEscape = (s) => String(s || "").replace(/([,;])/g, "\\$1").replace(/\n/g, "\\n");
const toICS = (d) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");

const downloadIcs = (ev) => {
  try {
    const s = ev?.startDate ? new Date(ev.startDate) : null;
    const e = ev?.endDate ? new Date(ev.endDate) : null;
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//App//Events//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      `UID:${(ev?.id || ev?.slug || ev?.title || "evt").replace(/\s+/g, "-")}@app`,
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

/* country label helper (selects can't render React components) */
const labelCountry = (code) => {
  if (!code) return "";
  const c = String(code).toUpperCase();
  return c.length === 2 ? c : code;
};

/* ───────────────── page ───────────────── */
export default function EventsPage() {
  const { data, isLoading, isError } = useGetEventsQuery?.() || { data: null, isLoading: false, isError: false };
  const [params] = useSearchParams();

  // filters
  const [qs, setQs] = useState("");
  const [country, setCountry] = useState("all");
  const [target, setTarget] = useState("all");
  const [when, setWhen] = useState(params.get("when") || "upcoming");
  const [sort, setSort] = useState("dateAsc");

  // focus first interactive on mount (mobile accessibility)
  useEffect(() => {
    const el = document.querySelector(".evh-search input");
    el?.focus?.();
  }, []);

  // normalize events
  const events = useMemo(() => {
    const base = Array.isArray(data) ? data : [];
    return base.map((x) => ({ ...x, id: x.id || x._id }));
  }, [data]);

  const countries = useMemo(() => {
    const set = new Set(events?.map((e) => String(e.country || "").trim()).filter(Boolean));
    return ["all", ...Array.from(set)];
  }, [events]);

  const targets = useMemo(() => {
    const set = new Set(events?.map((e) => String(e.target || "").trim()).filter(Boolean));
    return ["all", ...Array.from(set)];
  }, [events]);

  const filtered = useMemo(() => {
    const now = Date.now();
    const txt = String(qs).toLowerCase().trim();

    let arr = events.filter((ev) => {
      if (when === "upcoming" && new Date(ev.endDate).getTime() < now) return false;
      if (when === "past" && new Date(ev.startDate).getTime() > now) return false;

      if (country !== "all" && String(ev.country || "").toLowerCase() !== country.toLowerCase()) return false;
      if (target !== "all" && String(ev.target || "").toLowerCase() !== target.toLowerCase()) return false;

      if (txt) {
        const hay = [ev.title, ev.description, ev.city, ev.country, ev.venueName, ev.target]
          .map((s) => String(s || "").toLowerCase())
          .join(" ");
        if (!hay.includes(txt)) return false;
      }
      return true;
    });

    if (sort === "dateAsc") arr.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
    if (sort === "dateDesc") arr.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
    if (sort === "name") arr.sort((a, b) => String(a.title).localeCompare(String(b.title)));
    if (sort === "seatsLeft")
      arr.sort((a, b) => (a.capacity - a.seatsTaken) - (b.capacity - b.seatsTaken)).reverse();

    return arr;
  }, [events, qs, country, target, when, sort]);

  const reset = useCallback(() => {
    setQs("");
    setCountry("all");
    setTarget("all");
    setWhen("upcoming");
    setSort("dateAsc");
  }, []);

  return (
    <>
      {/* HeaderShell prop fix: use `top`, not `topbar` */}
      <HeaderShell top={topbar} nav={nav} cta={cta} />

      <main className="ev">
        {/* HERO (fixed z-index, layered ornaments don’t block clicks) */}
        <div className="ev-hero">
          <div className="ev-orn ev-o1" aria-hidden="true" />
          <div className="ev-orn ev-o2" aria-hidden="true" />

          <div className="container">
            <div className="evh">
              <div className="evh-txt">
                <h1 className="evh-title">
                  <FiGlobe /> Explore Events
                </h1>
                <p className="evh-sub">Filter by date, country, and audience.</p>
              </div>

              <label className="evh-search">
                <FiSearch />
                <input
                  value={qs}
                  onChange={(e) => setQs(e.target.value)}
                  placeholder="Search by title, city, country, target…"
                  aria-label="Search events"
                />
              </label>

              <div className="evh-rows">
                {/* row A: when pills + reset */}
                <div className="evh-when" role="tablist" aria-label="When">
                  <button
                    type="button"
                    className={`evh-pill ${when === "upcoming" ? "is-on" : ""}`}
                    aria-pressed={when === "upcoming"}
                    onClick={() => setWhen("upcoming")}
                  >
                    Upcoming
                  </button>
                  <button
                    type="button"
                    className={`evh-pill ${when === "past" ? "is-on" : ""}`}
                    aria-pressed={when === "past"}
                    onClick={() => setWhen("past")}
                  >
                    Past
                  </button>
                  <button
                    type="button"
                    className={`evh-pill ${when === "all" ? "is-on" : ""}`}
                    aria-pressed={when === "all"}
                    onClick={() => setWhen("all")}
                  >
                    All
                  </button>

                  <button type="button" className="evh-reset" onClick={reset} title="Reset all filters">
                    <FiRefreshCw /> Reset
                  </button>
                </div>

                {/* row B: fields */}
                <div className="evh-fields">
                  <label className="evh-field">
                    <span>Country</span>
                    {/* NOTE: <option> must be pure text; no ReactCountryFlag */}
                    <select value={country} onChange={(e) => setCountry(e.target.value)} aria-label="Country filter">
                      {countries.map((c) => (
                        <option key={c} value={c}>
                          {c === "all" ? "All" : labelCountry(c)}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="evh-field">
                    <span>Target</span>
                    <select value={target} onChange={(e) => setTarget(e.target.value)} aria-label="Target filter">
                      {targets.map((t) => (
                        <option key={t} value={t}>
                          {t === "all" ? "All" : t}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="evh-field">
                    <span>Sort</span>
                    <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort events">
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
        </div>

        {/* GRID */}
        <div className="container">
          {isLoading ? (
            <div className="ev-grid">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="ev-card skel" />
              ))}
            </div>
          ) : null}

          {isError ? <div className="ev-empty">Couldn’t load events.</div> : null}

          <div className="ev-grid">
            {filtered.map((ev) => (
              <EventCard key={ev.id} ev={ev} />
            ))}
          </div>

          {!filtered.length && !isLoading ? <div className="ev-empty">No events match your filters.</div> : null}
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

/* ───────────────── card ───────────────── */
function EventCard({ ev }) {
  const capacityPct =
    typeof ev.capacity === "number" && typeof ev.seatsTaken === "number" ? pct(ev.capacity, ev.seatsTaken) : null;

  const ipdaysId = "68e6764bb4f9b08db3ccec04";
  const viewHref =
    ev?.id !== ipdaysId ? `/event/${ev?.id}/old` : ev?.id ? `/event/${ev.id}` : ev?.slug ? `/event/${ev.slug}` : "#";

  return (
    <article className={`ev-card ${ev?.isCancelled ? "-cancel" : ""}`}>
      <Link
  to={viewHref}
  className="ev-media ev-media--link"
  style={{ backgroundImage: `url(${imageLink(ev?.cover) || fallbackPic(ev)})` }}
  aria-label={`View ${ev?.title || "event"} details`}
>
  <div className="ev-grad" />
  <div className="ev-chips" aria-hidden="true">
    {ev?.isCancelled ? (
      <span className="ev-chip -bad"><FiXCircle /> Cancelled</span>
    ) : null}
    {ev?.isPublished ? (
      <span className="ev-chip"><FiEye /> Published</span>
    ) : null}
    {ev?.target ? <span className="ev-chip -brand">{ev.target}</span> : null}
  </div>
  <div className="ev-date">
    <FiCalendar />
    {fmtRange(ev?.startDate, ev?.endDate)}
  </div>
</Link>


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
              {Math.max(0, (ev.capacity || 0) - (ev.seatsTaken || 0))} seats left
            </span>
          ) : null}
        </div>

        {typeof capacityPct === "number" ? (
          <div className="ev-cap">
            <div className="ev-cap-track">
              <div className="ev-cap-fill" style={{ width: `${capacityPct}%` }} />
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

          <button className="ev-btn" type="button" onClick={() => downloadIcs(ev)}>
            <FiCalendar />
            Add to calendar
          </button>

          {ev?.mapLink ? (
            <a className="ev-btn" href={ev.mapLink} target="_blank" rel="noreferrer">
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
