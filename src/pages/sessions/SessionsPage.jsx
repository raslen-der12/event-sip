// src/pages/sessions/MySessions.jsx
import React from "react";
import { useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  FiChevronLeft, FiCalendar, FiClock, FiMapPin, FiTag, FiX, FiXCircle,
} from "react-icons/fi";
import "./sessions.css";

// hooks you already have
import { 
    // useGetMySessionsQuery,
     useCanselSignUpMutation
     } from "../../features/events/scheduleApiSlice";
// import { useGetEventsQuery } from "../../features/events/eventsApiSlice";
import { useGetMySessionsQuery, useGetEventsQuery } from "./demoData";
import HeaderShell from "../../components/layout/HeaderShell";
import { cta, footerData, nav, topbar } from "../main.mock";
import Footer from "../../components/footer/Footer";

/* ---------------- utils ---------------- */
const idOf = (o) => o?._id || o?.id || null;
const clampWords = (t = "", max = 12) => {
  const parts = String(t).trim().split(/\s+/);
  return parts.length > max ? parts.slice(0, max).join(" ") + "…" : t;
};
const fmtDate = (iso) => {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "—";
  }
};
const fmtTime = (iso) => {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "—";
  }
};
const isPast = (iso) => {
  try { return new Date(iso).getTime() < Date.now(); } catch { return false; }
};
const isFuture = (iso) => {
  try { return new Date(iso).getTime() > Date.now(); } catch { return false; }
};

/* ------------- normalizers ------------- */
const normSession = (row) => {
  const s = row?.session || row || {};
  return {
    id: idOf(s),
    title: s.sessionTitle || s.title || "Untitled session",
    start: s.startTime || s.start || null,
    end: s.endTime || s.end || null,
    room: s.room || "",
    roomId: s.roomId || null,
    track: s.track || "",
    tags: Array.isArray(s.tags) ? s.tags : [],
    eventId: idOf(s.id_event) || s.id_event || s.eventId || null,
  };
};

/* ---------------- component ---------------- */
export default function MySessions() {
  const navigate = useNavigate();
  const { actorId: publicActorId } = useParams();
  const isPublic = !!publicActorId;

  // Load my/public sessions
  const { data, isLoading, isError, refetch } = useGetMySessionsQuery(
    // backend can ignore actorId if unsupported; harmless
    isPublic ? { actorId: publicActorId } : {},
    { refetchOnMountOrArgChange: true }
  );

  // Load events (to print headers)
  const { data: eventsRes } = useGetEventsQuery();
  const eventsList = Array.isArray(eventsRes?.data) ? eventsRes.data : (Array.isArray(eventsRes) ? eventsRes : []);
  const eventsMap = useMemo(() => {
    const m = new Map();
    eventsList.forEach((e) => m.set(String(idOf(e)), e));
    return m;
  }, [eventsList]);

  // Normalize rows
  const items = useMemo(() => {
    const arr = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);
    return arr
      .map((r) => {
        const s = normSession(r);
        return {
          id: s.id,
          session: s,
          status: String(r?.status || "registered").toLowerCase(), // registered | waitlisted | cancelled
          attend: !!r?.attend, // true/false
        };
      })
      .filter((x) => x.session.id && x.session.start && x.session.end && x.session.eventId);
  }, [data]);

  // Group by event
  const groups = useMemo(() => {
    const map = new Map();
    items.forEach((it) => {
      const k = String(it.session.eventId);
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(it);
    });
    // sort sessions by start time inside each group
    for (const [k, arr] of map.entries()) {
      arr.sort((a, b) => new Date(a.session.start) - new Date(b.session.start));
      map.set(k, arr);
    }
    return Array.from(map.entries()); // [ [eventId, items[]], ... ]
  }, [items]);

  // cancel mutation (private only)
  const [cancelSignup, { isLoading: canceling }] = useCanselSignUpMutation();

  const [active, setActive] = useState(null); // { id, session, status, attend }
  const close = () => setActive(null);

  const onCancel = async () => {
    if (!active || isPublic) return;
    try {
      await cancelSignup({ sessionId: active.session.id }).unwrap?.();
      close();
      refetch();
    } catch {
      // silent fail in demo
    }
  };

  /* ------------------- render ------------------- */
  return (
    <>
    <HeaderShell top={topbar} nav={nav} cta={cta} />
    <section className="ses">
      <div className="ses-top">
        <button className="ses-back" onClick={() => navigate(-1)}><FiChevronLeft /> Back</button>
        <h1 className="ses-title">{isPublic ? "Sessions" : "My sessions"}</h1>
        <span className="ses-spacer" />
      </div>

      {/* loading / error / empty */}
      {isLoading ? (
        <div className="ses-skel-list">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="ses-skel" />)}</div>
      ) : isError ? (
        <div className="ses-empty">Couldn’t load sessions.</div>
      ) : !groups.length ? (
        <div className="ses-empty">{isPublic ? "No public sessions to show." : "You haven’t registered for any sessions yet."}</div>
      ) : (
        groups.map(([evId, rows]) => {
          const ev = eventsMap.get(String(evId)) || {};
          const evTitle = clampWords(ev?.title || "Event", 14);
          const evWhere = [ev?.city, ev?.country].filter(Boolean).join(", ");
          const dateRange =
            ev?.startDate && ev?.endDate
              ? `${fmtDate(ev.startDate)} – ${fmtDate(ev.endDate)}`
              : "";

          return (
            <section key={evId} className="ses-group">
              <div className="ses-evhead">
                <Link className="ses-evtitle" to={`/event/${evId}`}>{evTitle}</Link>
                {evWhere ? <span className="ses-evloc"><FiMapPin /> {evWhere}</span> : null}
                {dateRange ? <span className="ses-evdates"><FiCalendar /> {dateRange}</span> : null}
              </div>

              <div className="ses-grid">
                {rows.map((row) => {
                  const s = row.session;
                  const regCls = `ses-badge ${row.status}`; // registered|waitlisted|cancelled
                  const upcoming = isFuture(s.start);
                  const attCls = row.attend ? "-att-ok" : (upcoming ? "-att-up" : "-att-miss");
                  const canCancel = !isPublic && !isPast(s.start);

                  return (
                    <button
                      key={row.id}
                      className="ses-item"
                      onClick={() => setActive(row)}
                      title={`${s.title} • ${fmtDate(s.start)} ${fmtTime(s.start)}`}
                    >
                      <div className="ses-top">
                        <h4 className="ses-name">{s.title}</h4>
                        <div className="ses-badges">
                          <span className={regCls}>{row.status}</span>
                          <span className={`ses-badge -att ${attCls}`}>
                            {row.attend ? "attended" : (upcoming ? "upcoming" : "missed")}
                          </span>
                        </div>
                      </div>

                      <div className="ses-sub">
                        <span><FiCalendar /> {fmtDate(s.start)}</span>
                        <span><FiClock /> {fmtTime(s.start)} – {fmtTime(s.end)}</span>
                        {s.room ? <span><FiMapPin /> {s.room}</span> : null}
                        {s.track ? <span><FiTag /> {s.track}</span> : null}
                      </div>

                      {/* tiny inline cancel affordance for private/upcoming */}
                      {canCancel ? (
                        <div className="ses-actions">
                          <button
                            type="button"
                            className="ses-btn -outline -danger"
                            disabled={canceling}
                            onClick={(e) => { e.stopPropagation(); setActive(row); }}
                            title="Cancel registration"
                          >
                            <FiXCircle /> Cancel
                          </button>
                        </div>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })
      )}

      {/* modal */}
      {!active ? null : (
        <div className="ses-modal" onClick={close} role="presentation">
          <div className="ses-card" onClick={(e) => e.stopPropagation()}>
            <button className="ses-x" onClick={close} aria-label="Close"><FiX /></button>

            <h3 className="ses-title">{active.session.title}</h3>

            <div className="ses-meta">
              <span><FiCalendar /> {fmtDate(active.session.start)}</span>
              <span><FiClock /> {fmtTime(active.session.start)} – {fmtTime(active.session.end)}</span>
              {active.session.room ? <span><FiMapPin /> {active.session.room}</span> : null}
              {active.session.track ? <span><FiTag /> {active.session.track}</span> : null}
            </div>

            {!!active.session.tags?.length && (
              <div className="ses-tags">
                {active.session.tags.map((t, i) => <span key={i} className="ses-chip">#{t}</span>)}
              </div>
            )}

            <div className="ses-lines">
              <div className="ses-line">
                <div className="ses-k">Registration</div>
                <div className={`ses-v ${active.status}`}>{active.status}</div>
              </div>

              <div className="ses-line">
                <div className="ses-k">Attendance</div>
                <div className={`ses-v ${active.attend ? "-att-ok" : (isFuture(active.session.start) ? "-att-up" : "-att-miss")}`}>
                  {active.attend
                    ? "Attended"
                    : isFuture(active.session.start)
                      ? "Event hasn’t happened yet"
                      : "Not attended"}
                </div>
              </div>
            </div>

            <div className="ses-actions">
              {/* Only private & upcoming sessions can be cancelled */}
              {!isPublic && !isPast(active.session.start) ? (
                <button
                  className="ses-btn -outline -danger"
                  disabled={canceling}
                  onClick={onCancel}
                  title="Cancel registration"
                >
                  <FiXCircle /> {canceling ? "Cancelling…" : "Cancel"}
                </button>
              ) : null}

              <button className="ses-btn -outline" onClick={close}>Close</button>
            </div>
          </div>
        </div>
      )}
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
