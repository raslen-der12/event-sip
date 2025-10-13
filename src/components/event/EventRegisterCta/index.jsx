import React from "react";
import PropTypes from "prop-types";
import "./event-register-cta.css";
import { FiCalendar, FiUsers, FiMapPin, FiAlertCircle, FiLock, FiCheck } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

function toDateSafe(d) {
  if (!d) return null;
  try { const x = new Date(d); return isNaN(x) ? null : x; } catch { return null; }
}

function fmtDate(d) {
  if (!d) return "—";
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(d));
  } catch { return "—"; }
}

function capInfo(capacity, taken) {
  const cap = Number.isFinite(capacity) ? capacity : null;
  const tk  = Number.isFinite(taken) ? taken : 0;
  const left = cap != null ? Math.max(cap - tk, 0) : null;
  const pct  = cap != null && cap > 0 ? Math.min(100, Math.round((tk / cap) * 100)) : null;
  return { cap, tk, left, pct };
}

export default function EventRegisterCta({ event }) {
  const nav = useNavigate();
  const {
    _id,
    title,
    startDate,
    endDate,
    registrationDeadline,
    capacity,
    seatsTaken,
    isCancelled,
    isPublished,
    venueName,
    city,
    country,
  } = event || {};

  // Robust state
  const now         = new Date();
  const start       = toDateSafe(startDate);
  const end         = toDateSafe(endDate);
  const deadline    = toDateSafe(registrationDeadline);
  const { cap, tk, left, pct } = capInfo(capacity, seatsTaken);

  const closedByCancel   = !!isCancelled;
  const closedByPublish  = isPublished === false;                  // if explicitly not published
  const closedByDeadline = deadline ? now > deadline : false;
  const soldOut          = cap != null ? left === 0 : false;

  const isOpen = !closedByCancel && !closedByPublish && !closedByDeadline && !soldOut;

  const onRegister = () => {
    if (!_id) return;
    nav(`/register?eventId=${_id}`);
  };

  // Small badges
  const Badge = ({ icon, children }) => (
    <span className="erc-badge">
      {icon}{children}
    </span>
  );

  return (
    <section className="event-register-cta">
      <div className="erc-container">
        <div className="erc-card">
          <div className="erc-left">
            <h2 className="erc-title">Register for <span className="erc-ink">{title || "this event"}</span></h2>

            <div className="erc-badges">
              <Badge icon={<FiCalendar />}>
                {start ? fmtDate(start) : "—"}{end ? ` → ${fmtDate(end)}` : ""}
              </Badge>
              {(venueName || city || country) ? (
                <Badge icon={<FiMapPin />}>
                  {[venueName, city, country].filter(Boolean).join(", ")}
                </Badge>
              ) : null}
              {cap != null ? (
                <Badge icon={<FiUsers />}>
                  {left} seats left / {cap}
                </Badge>
              ) : (
                <Badge icon={<FiUsers />}>Open capacity</Badge>
              )}
            </div>

            <p className="erc-sub">
              {deadline ? `Registration closes on ${fmtDate(deadline)}.` : "Registration open while seats last."}
            </p>

            {!isOpen && (
              <div className="erc-alert">
                <FiAlertCircle />
                <div>
                  {closedByCancel && <p className="erc-alert-line">This event has been cancelled.</p>}
                  {closedByPublish && <p className="erc-alert-line">This event is not yet published.</p>}
                  {closedByDeadline && <p className="erc-alert-line">Registration deadline has passed.</p>}
                  {soldOut && <p className="erc-alert-line">Sold out. No seats remaining.</p>}
                </div>
              </div>
            )}

            <div className="erc-actions">
              <button
                type="button"
                className={`erc-btn ${isOpen ? "" : "is-disabled"}`}
                onClick={isOpen ? onRegister : undefined}
                aria-disabled={!isOpen}
              >
                {isOpen ? <FiCheck /> : <FiLock />}
                {isOpen ? "Register Now" : "Registration Unavailable"}
              </button>
              {/* Optional: a secondary link — feel free to remove */}
              {/* <button type="button" className="erc-link">View agenda</button> */}
            </div>
          </div>

          <div className="erc-right">
            <div className="erc-progress">
              <div className="erc-progress-top">
                <span className="erc-progress-title">Capacity</span>
                <span className="erc-progress-num">
                  {cap != null ? `${tk}/${cap}` : "—"}
                </span>
              </div>
              <div className="erc-progress-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct || 0}>
                <span className="erc-progress-fill" style={{ width: `${pct || 0}%` }} />
              </div>
              <div className="erc-progress-hint">
                {cap != null ? `${left} remaining` : "Open"} · {soldOut ? "Sold out" : isOpen ? "Open" : "Closed"}
              </div>
            </div>

            <div className="erc-dates">
              <div className="erc-kv">
                <div className="k">Starts</div>
                <div className="v">{fmtDate(start)}</div>
              </div>
              <div className="erc-kv">
                <div className="k">Ends</div>
                <div className="v">{fmtDate(end)}</div>
              </div>
              {deadline && (
                <div className="erc-kv">
                  <div className="k">Deadline</div>
                  <div className="v">{fmtDate(deadline)}</div>
                </div>
              )}
            </div>
          </div>
        </div>{/* card */}
      </div>
    </section>
  );
}

EventRegisterCta.propTypes = {
  event: PropTypes.shape({
    _id: PropTypes.string,
    title: PropTypes.string,
    startDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    endDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    registrationDeadline: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    capacity: PropTypes.number,
    seatsTaken: PropTypes.number,
    isCancelled: PropTypes.bool,
    isPublished: PropTypes.bool,
    venueName: PropTypes.string,
    city: PropTypes.string,
    country: PropTypes.string,
  }),
};
