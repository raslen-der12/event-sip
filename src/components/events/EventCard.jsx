// EventCard.jsx
import React from "react";
import PropTypes from "prop-types";
import "./events.css";

/* ---------------- utils ---------------- */
function fmtRange(a, b) {
  try {
    const A = a ? new Date(a) : null;
    const B = b ? new Date(b) : null;
    if (!A && !B) return "";
    const md = (d) => d.toLocaleDateString(undefined, { month: "short", day: "2-digit" });
    const y = (d) => d.toLocaleDateString(undefined, { year: "numeric" });
    if (A && B) return `${md(A)} ${y(A)} – ${md(B)} ${y(B)}`;
    const D = A || B;
    return `${md(D)} ${y(D)}`;
  } catch { return ""; }
}

function resolveUrl(u) {
  if (!u) return "";
  if (/^https?:\/\//i.test(u)) return u;
  const base = process.env.REACT_APP_API_ORIGIN || process.env.REACT_APP_API_URL;
  return `${base}${u.startsWith("/") ? "" : "/"}${u}`;
}

/* Normalize incoming props to the names we use below */
function normalizeEventProps(props) {
  const ev = props || {};

  const title =
    ev.title ?? ev.name ?? ev.eventTitle ?? "Event";

  const startISO =
    ev.startISO ?? ev.startDate ?? ev.startAt ?? ev.startsAt ?? null;

  const endISO =
    ev.endISO ?? ev.endDate ?? ev.endAt ?? ev.endsAt ?? null;

  const location =
    ev.location ?? ev.venue ??  "";

  const cover =
    resolveUrl(ev.cover ?? ev.coverUrl ?? ev.image ?? ev.imageUrl ?? ev.banner ?? "");

  const capacityTotal =
    ev.capacityTotal ?? ev.capacity ?? ev.tickets?.capacity;

  const seatsTaken =
    ev.seatsTaken ?? ev.capacityTaken ?? ev.registered ?? ev.tickets?.sold;

  const href = ev.href ?? undefined;
  const registerHref = ev.registerHref ?? ev.registrationUrl ?? undefined;

  return {
    title, startISO, endISO, location, cover,
    capacityTotal, seatsTaken, href, registerHref
  };
}

/* ---------------- icons (keep design) ---------------- */
const IconCal = () => (
  <svg width="16" height="16" viewBox="0 0 24 24">
    <path fill="currentColor" d="M7 2h2v2h6V2h2v2h3v18H4V4h3V2Zm12 6H5v12h14V8Z" />
  </svg>
);
const IconPin = () => (
  <svg width="16" height="16" viewBox="0 0 24 24">
    <path fill="currentColor" d="M12 2a7 7 0 0 1 7 7c0 5-7 13-7 13S5 14 5 9a7 7 0 0 1 7-7Zm0 9.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
  </svg>
);
const IconUsers = () => (
  <svg width="16" height="16" viewBox="0 0 24 24">
    <path fill="currentColor" d="M16 11a4 4 0 1 0-3.999-4A4 4 0 0 0 16 11ZM8 12a3 3 0 1 0-2.999-3A3 3 0 0 0 8 12Zm8 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4ZM8 14c-2.67 0-8 1.34-8 4v2h6v-2c0-1.09.52-2.06 1.39-2.86C7.7 14.46 7.85 14.36 8 14Z" />
  </svg>
);

/* ---------------- component ---------------- */
export default function EventCard(incomingProps) {
  const {
    title, startISO, endISO, location, cover,
    capacityTotal, seatsTaken, href, registerHref
  } = normalizeEventProps(incomingProps);

  const when = fmtRange(startISO, endISO);

  const total = Number.isFinite(capacityTotal) ? Math.max(0, capacityTotal) : undefined;
  const taken = Number.isFinite(seatsTaken) ? Math.max(0, seatsTaken) : undefined;

  const now = Date.now();
  const startMs = startISO ? new Date(startISO).getTime() : undefined;
  const endMs   = endISO   ? new Date(endISO).getTime()   : undefined;

  // "passed" = event ended (prefer end date; fallback to start)
  const passed = Number.isFinite(endMs)
    ? endMs < now
    : Number.isFinite(startMs)
      ? startMs < now
      : false;

  const inFuture = Number.isFinite(startMs)
    ? startMs > now
    : Number.isFinite(endMs)
      ? endMs > now
      : true;

  const soldOut = Number.isFinite(total) && Number.isFinite(taken) && taken >= total;

  // Badge text + class (keep CSS classes: open/soldout/ended)
  const badgeClass = passed ? "ended" : soldOut ? "soldout" : "open";
  const badgeText  = passed ? "FINISHED" : soldOut ? "SOLD OUT" : "OPEN";

  // CTAs
  const showRegister = inFuture && !soldOut && !!registerHref;
  const showSeeMore  = !!href; // always allow "See more" when a link exists

  // Capacity bar only if numbers provided
  const pct = (Number.isFinite(total) && Number.isFinite(taken) && total > 0)
    ? Math.round((Math.min(total, taken) / total) * 100)
    : undefined;

  const goSeeMore = () => { if (href) window.location.assign(href); };
  const goRegister = (e) => {
    e.stopPropagation();
    if (showRegister) window.location.assign(registerHref);
  };

  return (
    <article className="ev-card" onClick={goSeeMore}>
      <div className="ev-hero">
        {cover ? (
          <img src={cover} alt={title} className="ev-img" loading="lazy" />
        ) : (
          <div className="ev-img" aria-hidden="true" />
        )}
        <div className={`ev-badge ${badgeClass}`}>{badgeText}</div>
      </div>

      <div className="ev-body">
        <h3 className="ev-name">{title}</h3>

        <div className="ev-line">
          <span className="ev-icon"><IconCal /></span>
          <span className="ev-text">{when}</span>
          {location && (
            <>
              <span className="ev-dot">•</span>
              <span className="ev-icon"><IconPin /></span>
              <span className="ev-text">{location}</span>
            </>
          )}
        </div>

        {(Number.isFinite(total) && Number.isFinite(taken)) && (
          <div className="ev-cap">
            <span className="ev-icon"><IconUsers /></span>
            <div
              className="ev-capbar"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={pct ?? 0}
            >
              <span style={{ width: `${pct ?? 0}%` }} />
            </div>
            <span className="ev-captxt">{pct ?? 0}%</span>
          </div>
        )}

        <div className="ev-ctas">
          {showRegister && (
            <button
              className="ev-btn-t ev-primary-t"
              onClick={goRegister}
            >
              REGISTER NOW
            </button>
          )}
          {showSeeMore && (
            <button className="ev-btn-t ev-secondary" onClick={goSeeMore}>
              SEE MORE
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

EventCard.propTypes = {
  // Compatible keys (you can pass any of these; we normalize internally)
  title: PropTypes.string,
  startISO: PropTypes.string,
  startDate: PropTypes.string,
  startAt: PropTypes.string,
  startsAt: PropTypes.string,
  endISO: PropTypes.string,
  endDate: PropTypes.string,
  endAt: PropTypes.string,
  endsAt: PropTypes.string,
  location: PropTypes.string,
  city: PropTypes.string,
  country: PropTypes.string,
  cover: PropTypes.string,
  coverUrl: PropTypes.string,
  image: PropTypes.string,
  imageUrl: PropTypes.string,
  banner: PropTypes.string,
  capacityTotal: PropTypes.number,
  capacity: PropTypes.number,
  seatsTaken: PropTypes.number,
  capacityTaken: PropTypes.number,
  registered: PropTypes.number,
  href: PropTypes.string,
  registerHref: PropTypes.string,
  registrationUrl: PropTypes.string,
};
