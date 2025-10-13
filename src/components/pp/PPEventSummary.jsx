import React, { useMemo } from "react";
import PropTypes from "prop-types";
import {
  FiCalendar,
  FiMapPin,
  FiExternalLink,
  FiShare2,
  FiUsers,
  FiFlag,
} from "react-icons/fi";
import "./pp-event-summary.css";

/**
 * Public Profile – Event Summary (READ-ONLY)
 * - Receives event data via props (parent already fetched it)
 * - No redux, no hooks here
 *
 * Props:
 *  - event: {
 *      _id, id, title, description, startDate, endDate,
 *      venueName, address, city, state, country, mapLink,
 *      capacity, seatsTaken, target,
 *      isPublished, isCancelled, registrationDeadline
 *    }
 *  - viewHref?: string        (override link to full event page)
 *  - className?: string
 */
export default function PPEventSummary({ event = {}, viewHref, className = "" }) {
  const e = event || {};
  const id = e.id || e._id;

  /* computed */
  const dateFmt = useMemo(() => {
    try {
      const s = e.startDate ? new Date(e.startDate) : null;
      const t = e.endDate ? new Date(e.endDate) : null;
      if (!s && !t) return "—";
      const monthDay = (d) =>
        new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(d);
      const withYear = (d) =>
        new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(d);
      if (s && t) {
        const sameYear = s.getFullYear() === t.getFullYear();
        const sameMonth = sameYear && s.getMonth() === t.getMonth();
        return sameMonth
          ? `${monthDay(s)} – ${new Intl.DateTimeFormat(undefined, { day: "numeric" }).format(t)}, ${s.getFullYear()}`
          : `${withYear(s)} – ${withYear(t)}`;
      }
      return withYear(s || t);
    } catch {
      return "—";
    }
  }, [e.startDate, e.endDate]);

  const where = [e.venueName, e.city, e.country].filter(Boolean).join(" · ");

  const capacity = typeof e.capacity === "number" ? Math.max(1, e.capacity) : null;
  const taken = typeof e.seatsTaken === "number" ? Math.max(0, e.seatsTaken) : null;
  const pct = capacity != null && taken != null
    ? Math.max(0, Math.min(100, Math.round((taken / capacity) * 100)))
    : null;

  const now = Date.now();
  const regClosed = e.registrationDeadline ? now > new Date(e.registrationDeadline).getTime() : false;

  const href = viewHref || (id ? `/events/${id}` : "#");
  const canMap = !!e.mapLink;

  const onDownloadICS = () => {
    try {
      const s = e.startDate ? new Date(e.startDate) : null;
      const t = e.endDate ? new Date(e.endDate) : null;
      const toICS = (d) =>
        d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
      const escape = (x = "") =>
        String(x).replace(/\\|;|,|\n/g, (m) => ({ "\\": "\\\\", ";": "\\;", ",": "\\,", "\n": "\\n" }[m]));
      const ics = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//GITS//Event//EN",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        "BEGIN:VEVENT",
        `UID:${(id || e.title || "event").toString().replace(/\s+/g, "-")}@gits`,
        `SUMMARY:${escape(e.title || "Event")}`,
        e.description ? `DESCRIPTION:${escape(e.description)}` : "",
        s ? `DTSTART:${toICS(s)}` : "",
        t ? `DTEND:${toICS(t)}` : "",
        where ? `LOCATION:${escape(where)}` : "",
        "END:VEVENT",
        "END:VCALENDAR",
      ].filter(Boolean).join("\r\n");
      const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(e.title || "event").replace(/\s+/g, "_")}.ics`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {}
  };

  const onShare = async () => {
    try {
      const shareData = {
        title: e.title || "Event",
        text: e.description ? String(e.description).slice(0, 120) : "",
        url: typeof window !== "undefined" ? window.location.href : href,
      };
      if (navigator.share) await navigator.share(shareData);
      else await navigator.clipboard.writeText(shareData.url);
    } catch {}
  };

  return (
    <section className={`ppes-card ${className}`}>
      <header className="ppes-head">
        <div className="ppes-titles">
          <h3 className="ppes-title" title={e.title || "—"}>
            {e.title || "—"}
          </h3>
          <div className="ppes-subrow">
            <span className="ppes-pill">
              <FiCalendar />
              {dateFmt}
            </span>
            <span className="ppes-pill" title={where || "—"}>
              <FiMapPin />
              <span className="ppes-ellipsis">{where || "—"}</span>
            </span>
            {e.target ? <span className="ppes-chip -target"><FiFlag /> {e.target}</span> : null}
          </div>
        </div>

        <div className="ppes-status">
          {e.isCancelled ? (
            <span className="ppes-chip -warn">Cancelled</span>
          ) : e.isPublished ? (
            <span className="ppes-chip -ok">Published</span>
          ) : (
            <span className="ppes-chip -muted">Draft</span>
          )}
          {regClosed ? <span className="ppes-chip -muted">Reg closed</span> : null}
        </div>
      </header>

      <div className="ppes-body">
        {pct != null ? (
          <div className="ppes-cap">
            <div className="ppes-cap-row">
              <span className="ppes-cap-label"><FiUsers /> Capacity</span>
              <span className="ppes-cap-val">{taken}/{capacity} ({pct}%)</span>
            </div>
            <div className="ppes-cap-track" aria-hidden="true">
              <div className="ppes-cap-fill" style={{ width: `${pct}%` }} />
            </div>
          </div>
        ) : null}

        <div className="ppes-ctas">
          <a className="ppes-btn ppes-primary" href={href}>
            <FiExternalLink />
            View event
          </a>
          <button type="button" className="ppes-btn" onClick={onDownloadICS}>
            <FiCalendar />
            Add to calendar
          </button>
          <button type="button" className="ppes-btn" onClick={onShare}>
            <FiShare2 />
            Share
          </button>
          {canMap ? (
            <a className="ppes-btn" href={e.mapLink} target="_blank" rel="noreferrer">
              <FiMapPin />
              Map
            </a>
          ) : null}
        </div>
      </div>
    </section>
  );
}

PPEventSummary.propTypes = {
  event: PropTypes.object,
  viewHref: PropTypes.string,
  className: PropTypes.string,
};
