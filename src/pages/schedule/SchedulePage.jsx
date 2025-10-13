import React from "react";
import "./schedule.css";
import { FiClock, FiMapPin, FiTag, FiX, FiAlertTriangle, FiCheck } from "react-icons/fi";
import useAuth from "../../lib/hooks/useAuth";
import imageLink from "../../utils/imageLink";

import {
  useGetEventRoomsQuery,
  useGetEventSessionsQuery,
  useSignUpToSessionMutation,
  useCanselSignUpMutation,
  useGetMySessionsQuery,
} from "../../features/events/scheduleApiSlice";
import { demoEventId } from "./scheduleDemoData";

import HeaderShell from "../../components/layout/HeaderShell";
import Footer from "../../components/footer/Footer";
import { cta, footerData, topbar } from "../main.mock";
import { useParams } from "react-router-dom";

/* ───────────── utils ───────────── */
const idOf = (o) => o?._id || o?.id || o?.uid || null;
const fmtHM = (iso) => {
  try { return iso ? new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""; }
  catch { return ""; }
};
const fmtMD = (iso) => {
  try { return new Date(iso).toLocaleDateString(undefined, { month:"short", day:"numeric" }); }
  catch { return ""; }
};
const sameDay = (iso, ymd) => {
  if (!ymd) return true;
  try {
    const d = new Date(iso);
    const y = d.getFullYear(), m = `${d.getMonth()+1}`.padStart(2, "0"), dd = `${d.getDate()}`.padStart(2, "0");
    return `${y}-${m}-${dd}` === ymd;
  } catch { return false; }
};
const overlap = (aStart, aEnd, bStart, bEnd) =>
  !(new Date(aEnd) <= new Date(bStart) || new Date(bEnd) <= new Date(aStart));
const roleAllowed = (arr, myRole) =>
  !arr || arr.map((s) => String(s).toLowerCase()).includes(String(myRole || "").toLowerCase());

/* ───────────── normalizers ───────────── */
const normRoom = (r) => ({
  id: String(r?._id ?? ""),
  name: r?.name || "Room",
  order: 0,
  location: r?.location || "",
  capacity: typeof r?.capacity === "number" ? r.capacity : null,
});
const normSession = (s) => {
  const sid    = s?._id;
  const start  = s?.startAt;   // <-- your field
  const end    = s?.endAt;     // <-- your field
  const roomId = s?.room?._id; // <-- nested room

  if (!sid || !start || !end || !roomId) return null;

  const speakersArr = Array.isArray(s?.speakers)
    ? s.speakers
        .map((p) => {
          const name = p?.name || p?.fullName || null;
          if (!name) return null;
          return { name, title: p?.title || "", photo: p?.photo || null };
        })
        .filter(Boolean)
    : [];

  return {
    id: String(sid),
    roomId: String(roomId),

    // agenda list fields
    sessionTitle: s?.title || "Untitled",
    title: s?.title || "Untitled",
    summary: s?.description || "",
    startTime: String(start),
    endTime: String(end),
    room: s?.room?.name || "Room",

    // extras
    track: s?.track || "",
    tags: Array.isArray(s?.tags) ? s.tags : [],
    speakers: speakersArr,
    speaker: speakersArr.length
      ? { fullName: speakersArr.map(x => x.name).join(", "), orgName: "" }
      : null,
    cover: s?.cover || null,
    capacity: typeof s?.room?.capacity === "number" ? s.room.capacity : null, // use room capacity if you want
    rolesAllowed: Array.isArray(s?.rolesAllowed) ? s.rolesAllowed : null,
  };
};

const normMyMap = (raw) => {
  const list = Array.isArray(raw?.data) ? raw.data : (Array.isArray(raw) ? raw : []);
  const m = new Map();
  list.forEach((row) => {
    const st = row?.status;
    const s = row?.session || row;
    const sid = idOf(s);
    if (sid) m.set(String(sid), st || "registered");
  });
  return m;
};

/* ───────────── tiny icons (inline SVG) ───────────── */
const I = {
  clock: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor"/><path d="M12 7v6l4 2" stroke="currentColor"/></svg>),
  room:  () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M3 10a9 9 0 1 0 18 0A9 9 0 0 0 3 10Zm9-7v7l5 3" stroke="currentColor"/></svg>),
  mic:   () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="9" y="3" width="6" height="10" rx="3" stroke="currentColor"/><path d="M5 9v1a7 7 0 0 0 14 0V9M12 20v-3" stroke="currentColor"/></svg>),
  tag:   () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M10 4h7l3 3-10 10-7-7 7-6Z" stroke="currentColor"/><circle cx="16" cy="8" r="1.3" fill="currentColor"/></svg>),
};

/* ───────────── modal helpers ───────────── */
function CapacityBar({ count = 0, cap = null }) {
  if (cap == null) return null;
  const pct = Math.max(0, Math.min(100, Math.round((count / Math.max(1, cap)) * 100)));
  return (
    <div className="ag__cap">
      <div className="ag__capBar"><span style={{ width: `${pct}%` }} /></div>
      <div className="ag__capTxt">{count}/{cap} seats</div>
    </div>
  );
}

/* ───────────── main page (agenda design) ───────────── */
export default function SchedulePage({ mySessionsHref = "/me/sessions" }) {
  const { eventId } = useParams();
  const auth = useAuth() || {};
  const myRole = String(auth?.role ?? "attendee");
  const currentEventId = eventId ||"68e6764bb4f9b08db3ccec04";

  /* Rooms */
  const { data: roomsRes } = useGetEventRoomsQuery({ eventId: currentEventId }, { skip: !currentEventId });

const rooms = React.useMemo(() => {
  const arr = Array.isArray(roomsRes?.data) ? roomsRes.data
            : Array.isArray(roomsRes)       ? roomsRes
            : [];
  return arr.map(normRoom).filter(r => r.id);
}, [roomsRes]);
  const roomsById = React.useMemo(
  () => new Map(rooms.map(r => [String(r.id), r.name])),
  [rooms]
);
  /* All sessions (for days list) */
  const { data: allRes } = useGetEventSessionsQuery({ eventId: currentEventId }, { skip: !currentEventId });
  const allSessions = React.useMemo(() => {
  const arr = Array.isArray(allRes?.data) ? allRes.data
            : Array.isArray(allRes)       ? allRes
            : [];
  return arr.map(normSession).filter(Boolean);
}, [allRes]);

const allDays = React.useMemo(() => {
  const set = new Set();
  allSessions.forEach(s => {
    try {
      const d = new Date(s.startTime);
      const y = d.getFullYear(), m = `${d.getMonth()+1}`.padStart(2,"0"), dd = `${d.getDate()}`.padStart(2,"0");
      set.add(`${y}-${m}-${dd}`);
    } catch {}
  });
  return Array.from(set).sort();
}, [allSessions]);

  /* Active day */
  const [day, setDay] = React.useState(() => allDays[0] || null);
  React.useEffect(() => { if (allDays.length && !day) setDay(allDays[0]); }, [allDays, day]);

  /* Server-filtered sessions + counts for the day */
 const { data: dayRes, refetch: refetchDay } = useGetEventSessionsQuery(
  { eventId: currentEventId, day: day || undefined, includeCounts: 1 },
  { skip: !currentEventId || !day }
);

const daySessions = React.useMemo(() => {
  const arr = Array.isArray(dayRes?.data) ? dayRes.data
            : Array.isArray(dayRes)       ? dayRes
            : [];
  return arr
    .map(normSession)
    .filter(Boolean)
    .filter((s) => !day || (function sameDay(iso, ymd){
      try {
        const d = new Date(iso);
        const y = d.getFullYear(), m = `${d.getMonth()+1}`.padStart(2, "0"), dd = `${d.getDate()}`.padStart(2, "0");
        return `${y}-${m}-${dd}` === ymd;
      } catch { return false; }
    })(s.startTime, day))
    .map((s) => ({ ...s, room: s.room || roomsById.get(String(s.roomId)) || s.roomId }));
}, [dayRes, day, roomsById]);


const counts = React.useMemo(() => (dayRes?.counts || {}), [dayRes]);

  /* My sessions map */
  const { data: myRes, refetch: refetchMine } = useGetMySessionsQuery({ eventId: currentEventId }, { skip: !currentEventId });
  const myMap = React.useMemo(() => normMyMap(myRes), [myRes]);
  console.log("myRes",myRes);
  /* Modal state */
  const [open, setOpen] = React.useState(null); // session object
  const conflictWith = React.useMemo(() => {
    if (!open) return null;
    const mine = allSessions.filter(s => myMap.get(String(s.id)) === "registered" && sameDay(s.startTime, day));
    return mine.find(m => overlap(open.startTime, open.endTime, m.startTime, m.endTime)) || null;
  }, [open, myMap, allSessions, day]);

  /* Mutations */
  const [signUp] = useSignUpToSessionMutation();
  const [cancel] = useCanselSignUpMutation();

  const onSign = async () => {
    if (!open) return;
    try {
      await signUp({ sessionId: open.id, waitlistOk: true });
      await Promise.all([refetchDay?.(), refetchMine?.()]);
      setOpen(null);
    } catch {}
  };
  const onCancel = async () => {
    if (!open) return;
    try {
      await cancel({ sessionId: open.id });
      await Promise.all([refetchDay?.(), refetchMine?.()]);
      setOpen(null);
    } catch {}
  };

  /* chips for list row */
  const rowStatusChip = (s) => {
    const st = myMap.get(String(s.id)) || null;
    if (st) return <span className={`ag__chip -state ${st}`}><FiCheck/> {st}</span>;
    const cap = s.capacity;
    const reg = counts?.[s.id]?.registered || 0;
    if (cap != null && reg >= cap) return <span className="ag__chip -full">full</span>;
    return null;
  };

  return (
    <>
      <HeaderShell top={topbar} nav={[]} cta={cta} />

      <section className="ag">
        <div className="container">
          <header className="ag__head">
            <div className="ag__titles">
              <h2 className="ag__title">Program</h2>
              <p className="ag__sub">Agenda by day</p>
            </div>

            <div className="ag__tabs" role="tablist" aria-label="Select day">
              {allDays.map((d, i) => (
                <button
                  key={d}
                  type="button"
                  role="tab"
                  aria-selected={day === d}
                  className={`ag__pill ${day === d ? "is-active" : ""}`}
                  onClick={() => setDay(d)}
                >
                  {fmtMD(d)}
                </button>
              ))}
            </div>
          </header>

          {!allDays.length ? (
            <div className="ag__skel">
              {Array.from({ length: 5 }).map((_, i) => <div key={i} className="ag__skelRow" />)}
            </div>
          ) : daySessions.length === 0 ? (
            <div className="ag__empty">No sessions for this day.</div>
          ) : (
            <ul className="ag__list" role="list">
              {daySessions
                .sort((a,b)=> +new Date(a.startTime) - +new Date(b.startTime))
                .map((s) => (
                <li key={s.id} className="ag__item">
                  <button
                    type="button"
                    className="ag__card"
                    onClick={() => setOpen(s)}
                    title="View details"
                  >
                    <div className="ag__time">
                      <I.clock />
                      <span>{fmtHM(s.startTime)}–{fmtHM(s.endTime)}</span>
                    </div>

                    <div className="ag__main">
                      <h3 className="ag__name">{s.sessionTitle}</h3>
                      <div className="ag__meta">
                        <span className="ag__metaRow">
                          <I.mic />
                          <span className="ag__speaker">{s?.speaker?.fullName || (s.speakers?.[0]?.name) || "Speaker"}</span>
                        </span>

                        <span className="ag__metaRow">
                          <I.room />
                          <span>{s.room}</span>
                        </span>

                        {s.track ? (
                          <span className="ag__tag"><I.tag/>{s.track}</span>
                        ) : null}

                        {rowStatusChip(s)}
                      </div>

                      {Array.isArray(s.tags) && s.tags.length ? (
                        <div className="ag__tags">
                          {s.tags.slice(0, 4).map((t) => (
                            <span key={t} className="ag__tag"><I.tag />{t}</span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* detail modal */}
        {open && (
          <div className="ag__modal" role="dialog" aria-modal="true" aria-label="Session details" onClick={() => setOpen(null)}>
            <div className="ag__backdrop" />
            <div className="ag__sheet" onClick={(e)=>e.stopPropagation()}>
              <header className="ag__sheetHead">
                <h3 className="ag__sheetTitle">{open.sessionTitle}</h3>
                <button className="ag__x" onClick={() => setOpen(null)} aria-label="Close"><FiX/></button>
              </header>

              <div className="ag__sheetMeta">
                <div className="ag__sheetRow"><FiClock/>{fmtHM(open.startTime)}–{fmtHM(open.endTime)} ({fmtMD(open.startTime)})</div>
                <div className="ag__sheetRow"><FiMapPin/>{open.room}</div>
                {open.track ? <div className="ag__sheetRow"><FiTag/>{open.track}</div> : null}
              </div>

              {open.summary ? <p className="ag__sheetTxt">{open.summary}</p> : null}

              {!!open.speakers?.length && (
                <div className="ag__speakers">
                  {open.speakers.map((sp,i)=>(
                    <div key={`${sp?.name || "sp"}-${i}`} className="ag__speakerRow">
                      <span className="ag__ph" style={sp?.photo ? { backgroundImage:`url(${imageLink(sp.photo)})` } : {}} />
                      <div className="ag__spTxt">
                        <div className="ag__nm">{sp?.name || "—"}</div>
                        {sp?.title ? <div className="ag__ro">{sp.title}</div> : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* capacity + status + actions */}
              {(() => {
                const c = counts?.[open.id] || {};
                const cap = open.capacity;
                const reg = c.registered || 0;
                const myStatus = myMap.get(String(open.id)) || null;
                const eligible = roleAllowed(open.rolesAllowed, myRole);
                const full = cap != null && reg >= cap;

                return (
                  <>
                    <CapacityBar count={reg} cap={cap} />

                    <div className="ag__ctaRow">
                      {!eligible ? (
                        <span className="ag__chip -deny"><FiAlertTriangle/> Not eligible</span>
                      ) : myStatus ? (
                        <span className={`ag__chip -state ${myStatus}`}><FiCheck/> {myStatus}</span>
                      ) : null}

                      {open.rolesAllowed?.length ? (
                        <span className={`ag__chip ${eligible ? "" : "-deny"}`}>Requires: {open.rolesAllowed.join(", ")}</span>
                      ) : <span className="ag__chip">All roles</span>}

                      {conflictWith ? (
                        <span className="ag__chip -warn"><FiAlertTriangle/> Conflict with “{conflictWith.title}”</span>
                      ) : null}
                    </div>

                    <div className="ag__actions">
                      {!eligible ? (
                        <button className="ag__btn -outline" disabled>Not eligible</button>
                      ) : myStatus ? (
                        <button className="ag__btn -outline" onClick={onCancel}>Cancel</button>
                      ) : full ? (
                        <button className="ag__btn" onClick={onSign}>Join waitlist</button>
                      ) : conflictWith ? (
                        <button className="ag__btn" disabled>Resolve conflict</button>
                      ) : (
                        <button className="ag__btn" onClick={onSign}>Sign me up</button>
                      )}
                    </div>
                  </>
                );
              })()}
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
