import React from "react";
import PropTypes from "prop-types";
import "./event-hero.css";
import { FiMapPin, FiCalendar, FiUsers, FiFlag, FiAlertTriangle } from "react-icons/fi";

const fmtDate = (d) => {
  if (!d) return "";
  try {
    const dd = new Date(d);
    return dd.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  } catch { return ""; }
};
const range = (a, b) => (a && b ? `${fmtDate(a)} → ${fmtDate(b)}` : (fmtDate(a) || fmtDate(b) || ""));

export default function EventHero({ event }) {
  const title   = event?.title || "Event";
  const desc    = event?.description || "";
  const when    = range(event?.startDate, event?.endDate);
  const where   = [event?.venueName, event?.city, event?.country].filter(Boolean).join(", ");
  const target  = event?.target || "";
  const cap     = Number(event?.capacity || 0);
  const taken   = Number(event?.seatsTaken || 0);
  const pct     = cap > 0 ? Math.min(100, Math.max(0, Math.round((taken / cap) * 100))) : 0;
  const canReg  = event?.isPublished && !event?.isCancelled;
  const deadline = event?.registrationDeadline ? new Date(event.registrationDeadline) : null;
  const deadlinePassed = deadline ? Date.now() > deadline.getTime() : false;
  const regDisabled = !canReg || deadlinePassed;

  const registerHref = event?._id ? `/register?eventId=${event._id}` : "/register";

  return (
    <section className="ev-hero">
      <div className="ev-hero-bg" aria-hidden />
      <div className="ev-hero-grain" aria-hidden />

      <div className="ev-container">
        <div className="ev-head">
          <p className="ev-eyebrow">Official Event</p>
          <h1 className="ev-title">{title}</h1>
          {desc ? <p className="ev-sub">{desc}</p> : null}

          <div className="ev-meta">
            {when && (
              <span className="ev-chip">
                <FiCalendar /><span>{when}</span>
              </span>
            )}
            {where && (
              <span className="ev-chip">
                <FiMapPin /><span>{where}</span>
              </span>
            )}
            {target && (
              <span className="ev-chip -brand2">
                <FiFlag /><span>{target}</span>
              </span>
            )}
            {cap > 0 && (
              <span className="ev-chip">
                <FiUsers /><span>{taken}/{cap} ({pct}%)</span>
              </span>
            )}
            {!event?.isPublished && (
              <span className="ev-chip -warn"><FiAlertTriangle /><span>Draft</span></span>
            )}
            {event?.isCancelled && (
              <span className="ev-chip -warn"><FiAlertTriangle /><span>Cancelled</span></span>
            )}
          </div>

          <div className="ev-cta-row">
            <a
              className={`ev-btn ${regDisabled ? "is-disabled" : ""}`}
              href={regDisabled ? undefined : registerHref}
              aria-disabled={regDisabled ? "true" : "false"}
              onClick={(e)=>{ if (regDisabled) e.preventDefault(); }}
            >
              {deadlinePassed ? "Registration closed" : "Register"}
            </a>
            <a
              className="ev-btn -outline"
              href={`https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${toGCal(event?.startDate)}/${toGCal(event?.endDate)}&location=${encodeURIComponent(where)}&details=${encodeURIComponent(desc)}`}
              target="_blank" rel="noreferrer"
            >
              Add to calendar
            </a>
          </div>

          {deadline && (
            <div className="ev-deadline">
              Registration deadline: <strong>{fmtDate(deadline)}</strong>
            </div>
          )}
        </div>

        {cap > 0 && (
          <div className="ev-cap">
            <div className="ev-cap-top">
              <span>Capacity</span>
              <span className="ev-cap-numbers">{taken} / {cap}</span>
            </div>
            <div className="ev-cap-bar"><span style={{ width: `${pct}%` }} /></div>
          </div>
        )}
      </div>
    </section>
  );
}

function toGCal(d) {
  if (!d) return "";
  try {
    const x = new Date(d);
    // YYYYMMDDTHHMMSSZ
    const pad = (n) => String(n).padStart(2, "0");
    const YYYY = x.getUTCFullYear();
    const MM = pad(x.getUTCMonth() + 1);
    const DD = pad(x.getUTCDate());
    const HH = pad(x.getUTCHours());
    const m  = pad(x.getUTCMinutes());
    const s  = pad(x.getUTCSeconds());
    return `${YYYY}${MM}${DD}T${HH}${m}${s}Z`;
  } catch {
    return "";
  }
}

EventHero.propTypes = {
  event: PropTypes.object
};
