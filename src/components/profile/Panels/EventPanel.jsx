import React from "react";
import PropTypes from "prop-types";
/* adjust path if your file differs */
import { useGetEventQuery } from "../../../features/events/eventsApiSlice";

function Row({ k, v }) {
  return (
    <div className="pp-row">
      <div className="pp-label">{k}</div>
      <div className="pp-value">{v ?? <span className="pp-muted">—</span>}</div>
    </div>
  );
}

function Pill({ children, tone = "brand" }) {
  return <span className={`evp-pill -${tone}`}>{children}</span>;
}

function fmtDate(d) {
  try {
    const dt = d ? new Date(d) : null;
    if (!dt || Number.isNaN(dt.getTime())) return "—";
    return dt.toLocaleDateString(undefined, { year:"numeric", month:"short", day:"2-digit" });
  } catch { return "—"; }
}

export default function EventPanel({ role, actor, event, loading }) {
  const eventId = event?._id || actor?.id_event || "68e6764bb4f9b08db3ccec04";
  const skip = !eventId;
  const { data: evRes, isLoading: evLoading, isError } =
    useGetEventQuery(eventId, { skip });
    // backend may return {success:true, data:{...}} OR plain object
    const E = event || evRes?.data || evRes || null;
    
    const eventUrl = E?._id ? `/event/${E._id}` : (E?.slug ? `/events/${E.slug}` : null);
  const busy = loading || evLoading;
  const title = E?.title || "—";
  const where =
    [E?.venueName, E?.city, E?.country].filter(Boolean).join(", ") || "—";
  const dateRange = `${fmtDate(E?.startDate)} – ${fmtDate(E?.endDate)}`;

  const published = !!E?.isPublished;
  const cancelled = !!E?.isCancelled;

  return (
    <div className="pp-wrap">
      <section className="pp-section">
        <header className="pp-head">
          <h3 className="pp-title">Event</h3>
          <div className="pp-actions">
            {eventUrl ? (
                <a className="evp-btn evp-btn-ghost" href={eventUrl}>
                  View Event Page
                </a>
              ) : null}
          </div>
        </header>

        <div className="pp-card">
          {busy ? (
            <div className="evp-skel">
              <div className="evp-sbar evp-skeleton" />
              <div className="evp-grid">
                <div className="evp-skeleton evp-box" />
                <div className="evp-skeleton evp-box" />
                <div className="evp-skeleton evp-box" />
                <div className="evp-skeleton evp-box" />
              </div>
            </div>
          ) : isError ? (
            <div className="pp-alert -error">Failed to load event details.</div>
          ) : !E ? (
            <div className="pp-alert -warn">No event linked to this profile.</div>
          ) : (
            <>
              {/* Top header strip */}
              <div className="evp-header">
                <div className="evp-title-main">{title}</div>
                <div className="evp-pills">
                  {published ? <Pill>Published</Pill> : <Pill tone="muted">Draft</Pill>}
                  {cancelled ? <Pill tone="danger">Cancelled</Pill> : null}
                </div>
              </div>

              {/* Meta quick grid */}
              <div className="evp-grid">
                <div className="evp-box">
                  <div className="evp-k">Dates</div>
                  <div className="evp-v">{dateRange}</div>
                </div>
                <div className="evp-box">
                  <div className="evp-k">Location</div>
                  <div className="evp-v">{where}</div>
                </div>
                <div className="evp-box">
                  <div className="evp-k">Capacity</div>
                  <div className="evp-v">
                    {E?.capacity ? (
                      <>
                        {E.seatsTaken ?? 0} / {E.capacity}
                        <div className="evp-meter">
                          <div
                            className="evp-meter-bar"
                            style={{
                              width: `${
                                Math.min(
                                  100,
                                  Math.round(
                                    ((E.seatsTaken ?? 0) / (E.capacity || 1)) * 100
                                  )
                                )
                              }%`,
                            }}
                          />
                        </div>
                      </>
                    ) : (
                      "—"
                    )}
                  </div>
                </div>
                <div className="evp-box">
                  <div className="evp-k">Registration deadline</div>
                  <div className="evp-v">{fmtDate(E?.registrationDeadline)}</div>
                </div>
              </div>

              {/* Description */}
              <div className="pp-divider" />
              <Row k="Description" v={E?.description} />

              {/* Target audience */}
              <Row k="Target" v={E?.target} />

              {/* Links */}
              <div className="evp-links">
                {E?.mapLink ? (
                  <a className="pp-btn -ghost" href={E.mapLink} target="_blank" rel="noreferrer">
                    Open Map
                  </a>
                ) : null}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

EventPanel.propTypes = {
  role: PropTypes.string.isRequired,
  actor: PropTypes.object,
  event: PropTypes.object,
  loading: PropTypes.bool,
  onPatch: PropTypes.func,
};
