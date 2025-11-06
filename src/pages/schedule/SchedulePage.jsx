// src/pages/schedule/SchedulePage.jsx
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
const isB2B = (track) => String(track || "").trim().toLowerCase() === "b2b";

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
  const start  = s?.startAt;
  const end    = s?.endAt;
  const roomId = s?.room?._id;

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

    // list fields
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
    capacity: typeof s?.room?.capacity === "number" ? s.room.capacity : null,
    seatsTaken: Number(s?.seatsTaken ?? s?.seats_taken ?? 0),
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

/* larger mic avatar (used where images used to be) */
function MicAvatar({ size = 40 }) {
  const px = typeof size === "number" ? `${size}px` : size;
  return (
    <div
      style={{ width: px, height: px }}
      className="flex items-center justify-center rounded-full bg-gray-100 text-gray-700 shrink-0"
      aria-hidden="true"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="9" y="3" width="6" height="10" rx="3" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M5 9v1a7 7 0 0 0 14 0V9M12 20v-3" stroke="currentColor" strokeWidth="1.5"/>
      </svg>
    </div>
  );
}

/* ───────────── Speaker UI ───────────── */
/* Keep pill truncation in list view for compactness; modal will show full text */
function SpeakerPill({ name, title, size = "sm", onClick }) {
  const imgSize = size === "md" ? "w-10 h-10" : "w-8 h-8";
  const textClass = size === "md" ? "text-sm" : "text-xs";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 bg-white/80 border border-gray-100 rounded-full px-2 py-1 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-200 ${size === "md" ? "p-2" : ""}`}
      aria-label={`Open speaker ${name}`}
    >
      <span className={`${imgSize} rounded-full bg-gray-100 flex-shrink-0 flex items-center justify-center`} aria-hidden="true">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="9" y="3" width="6" height="10" rx="3" stroke="currentColor"/><path d="M5 9v1a7 7 0 0 0 14 0V9M12 20v-3" stroke="currentColor"/></svg>
      </span>
      <div className="min-w-0 text-left">
        <div className={`font-medium text-gray-800 truncate ${textClass}`}>{name}</div>
        {title ? <div className={`text-gray-500 truncate ${textClass}`}>{title}</div> : null}
      </div>
    </button>
  );
}

/* ───────────── Capacity bar ───────────── */
function CapacityBar({ count = 0, cap = null }) {
  if (cap == null) return null;
  const pct = Math.max(0, Math.min(100, Math.round((count / Math.max(1, cap)) * 100)));
  return (
    <div className="ag__cap mt-3">
      <div className="ag__capBar"><span style={{ width: `${pct}%` }} /></div>
      <div className="ag__capTxt">{count}/{cap} seats</div>
    </div>
  );
}

/* ───────────── main page ───────────── */
export default function SchedulePage({ mySessionsHref = "/me/sessions" }) {
  const { eventId } = useParams();
  const auth = useAuth() || {};
  const myRole = String(auth?.role ?? "attendee");
  const currentEventId = eventId || "68e6764bb4f9b08db3ccec04";

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

  /* All sessions (for days) */
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

  const firstDay = allDays[0] || null;

  /* Active day */
  const [day, setDay] = React.useState(() => allDays[0] || null);
  React.useEffect(() => { if (allDays.length && !day) setDay(allDays[0]); }, [allDays, day]);

  /* Day sessions + counts */
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
      .filter((s) => !day || sameDay(s.startTime, day))
      .map((s) => ({ ...s, room: s.room || roomsById.get(String(s.roomId)) || s.roomId }));
  }, [dayRes, day, roomsById]);

  const counts = React.useMemo(() => (dayRes?.counts || {}), [dayRes]);

  /* Merge API counts with per-session seatsTaken fallback */
  const mergedCounts = React.useMemo(() => {
    const base = counts || {};
    const out = {};
    daySessions.forEach((s) => {
      const id = s.id;
      const reg = (base?.[id]?.seatsTaken != null)
        ? base[id].seatsTaken
        : (typeof s.seatsTaken === "number" ? s.seatsTaken : 0);
      const waitlisted = base?.[id]?.seatsTaken ?? 0;
      out[id] = { seatsTaken: reg, waitlisted };
    });
    return out;
  }, [counts, daySessions]);

  /* My sessions map */
  const { data: myRes, refetch: refetchMine } = useGetMySessionsQuery({ eventId: currentEventId }, { skip: !currentEventId });
  const myMap = React.useMemo(() => normMyMap(myRes), [myRes]);

  /* Modal state */
  const [open, setOpen] = React.useState(null); // session object

  // ⬇️ B2B EXCLUDED FROM CONFLICTS
  const conflictWith = React.useMemo(() => {
    if (!open) return null;
    if (isB2B(open.track)) return null;
    const mine = allSessions.filter(s =>
      myMap.get(String(s.id)) === "registered" &&
      !isB2B(s.track) &&
      sameDay(s.startTime, day)
    );
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

  /* chips for list row (add "closed" for day 1 when not registered) */
  const rowStatusChip = (s) => {
    const st = myMap.get(String(s.id)) || null;
    if (st) return <span className={`ag__chip -state ${st}`}><FiCheck/> {st}</span>;

    if (firstDay && sameDay(s.startTime, firstDay)) {
      return <span className="ag__chip -deny">closed</span>;
    }

    const cap = s.capacity;
    const reg = mergedCounts?.[s.id]?.registered || 0;
    if (cap != null && reg >= cap) return <span className="ag__chip -full">full</span>;
    return null;
  };

  const nav = [
    { label: "Home", href: "/" },
    { label: "Event", href: `/event/${eventId}` },
    { label: "Speakers", href: `/event/${eventId}/speakers` },
    { label: "Attendees", href: `/event/${eventId}/attendees` },
    { label: "Exhibitors", href: `/event/${eventId}/exhibitors` },
    { label: "Schedule", href: `/event/${eventId}/schedule` },
  ];

  return (
    <>
      <HeaderShell top={topbar} nav={nav} cta={cta} logo={eventId === "68e6764bb4f9b08db3ccec04" ? imageLink("/default/IPDAYXGITS.png") : null} />

      <section className="ag">
        <div className="container">
          <header className="ag__head">
            <div className="ag__titles">
              <h2 className="ag__title">Program</h2>
              <p className="ag__sub">Agenda by day</p>
            </div>

            <div className="ag__tabs" role="tablist" aria-label="Select day">
              {allDays.map((d) => (
                <button
                  key={d}
                  type="button"
                  role="tab"
                  aria-selected={day === d}
                  className={`ag__pill ${day === d ? "is-active" : ""} focus:outline-none focus:ring-2 focus:ring-indigo-200`}
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
                .map((s) => {
                  const b2b = isB2B(s.track);
                  const speakerCount = Array.isArray(s.speakers) ? s.speakers.length : 0;
                  return (
                    <li key={s.id} className="ag__item">
                      <button
                        type="button"
                        className={`ag__card ${b2b ? "-b2b" : ""} bg-white rounded-lg border hover:shadow-md transition-shadow duration-150 p-4 flex gap-4 items-start w-full`}
                        onClick={() => setOpen(s)}
                        title="View details"
                      >
                        <div className="ag__time flex-shrink-0 text-gray-700">
                          <I.clock />
                          <span className="ml-1">{fmtHM(s.startTime)}–{fmtHM(s.endTime)}</span>
                        </div>

                        <div className="ag__main flex-1 min-w-0">
                          <h3 className="ag__name text-lg font-semibold text-gray-900 truncate">{s.sessionTitle}</h3>

                          <div className="ag__meta mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <I.room />
                              <span>{s.room}</span>
                            </div>

                            {s.track ? (
                              <span className={`ag__tag ${b2b ? "-b2b" : ""} inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs`}>
                                <I.tag/> {s.track}
                              </span>
                            ) : null}

                            {rowStatusChip(s)}
                          </div>

                          {/* Speakers: pills, compact and readable */}
                          <div className="mt-3">
                            {speakerCount > 0 ? (
                              <div className="flex flex-wrap items-center gap-2">
                                {s.speakers.slice(0, 3).map((sp, i) => (
                                  <SpeakerPill
                                    key={`${sp.name}-${i}`}
                                    name={sp.name}
                                    title={sp.title}
                                    size="sm"
                                    onClick={(e) => { e.stopPropagation(); setOpen(s); }}
                                  />
                                ))}

                                {speakerCount > 3 && (
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setOpen(s); }}
                                    className="inline-flex items-center justify-center text-sm px-3 py-1 rounded-full border border-gray-200 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                                    aria-label={`View all ${speakerCount} speakers`}
                                  >
                                    +{speakerCount - 3} more
                                  </button>
                                )}
                              </div>
                            ) : (
                              <div className="text-sm text-gray-500">Speaker</div>
                            )}
                          </div>

                          {Array.isArray(s.tags) && s.tags.length ? (
                            <div className="ag__tags mt-3 flex flex-wrap gap-2">
                              {s.tags.slice(0, 4).map((t) => (
                                <span key={t} className="ag__tag inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs"><I.tag />{t}</span>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      </button>
                    </li>
                  );
                })}
            </ul>
          )}
        </div>

        {/* detail modal */}
        {open && (
          <div className="ag__modal" role="dialog" aria-modal="true" aria-label="Session details" onClick={() => setOpen(null)}>
            <div className="ag__backdrop" />
            {/* make modal content scrollable for long lists */}
            <div className="ag__sheet max-h-[80vh] overflow-auto" onClick={(e)=>e.stopPropagation()}>

              <header className={`ag__sheetHead ${isB2B(open.track) ? "-b2b" : ""} flex items-center justify-between`}>
                <h3 className="ag__sheetTitle text-xl font-semibold">{open.sessionTitle}</h3>
                <button className="ag__x p-2 rounded-full hover:bg-gray-100 focus:outline-none" onClick={() => setOpen(null)} aria-label="Close"><FiX/></button>
              </header>

              <div className="ag__sheetMeta mt-3 space-y-2">
                <div className="ag__sheetRow flex items-center gap-2"><FiClock/>{fmtHM(open.startTime)}–{fmtHM(open.endTime)} ({fmtMD(open.startTime)})</div>
                <div className="ag__sheetRow flex items-center gap-2"><FiMapPin/>{open.room}</div>
                {open.track ? <div className={`ag__sheetRow ${isB2B(open.track) ? "-b2b" : ""} flex items-center gap-2`}><FiTag/>{open.track}</div> : null}
              </div>

              {open.summary ? <p className="ag__sheetTxt mt-4 text-gray-700">{open.summary}</p> : null}

              {/* Modal speakers grid — NO truncation, allow wrap and full visibility */}
              {!!open.speakers?.length && (
                <div className="ag__speakers mt-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {open.speakers.map((sp, i) => (
                      <div
                        key={`${sp?.name || "sp"}-${i}`}
                        className="flex items-start gap-3 bg-white border border-gray-100 rounded-lg p-3 shadow-sm"
                      >
                        <MicAvatar size={44} />
                        <div className="min-w-0">
                          {/* show full name + title, wrapping across lines */}
                          <div className="font-semibold text-gray-900 text-sm whitespace-normal break-words">{sp?.name || "—"}</div>
                          {sp?.title ? <div className="text-xs text-gray-600 whitespace-normal break-words mt-1">{sp.title}</div> : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(() => {
                const c = mergedCounts?.[open.id] || {};
                const cap = open.capacity;
                const reg = c.seatsTaken || 0;
                const myStatus = myMap.get(String(open.id)) || null;
                const eligible = roleAllowed(open.rolesAllowed, myRole);
                const full = cap != null && reg >= cap;
                const isDayOne = firstDay && sameDay(open.startTime, firstDay);
                const b2b = isB2B(open.track);

                return (
                  <>
                    <CapacityBar count={reg} cap={cap} />

                    <div className="ag__ctaRow mt-4 flex flex-wrap gap-2">
                      {!eligible ? (
                        <span className="ag__chip -deny"><FiAlertTriangle/> Not eligible</span>
                      ) : myStatus ? (
                        <span className={`ag__chip -state ${myStatus}`}><FiCheck/> {myStatus}</span>
                      ) : null}

                      {open.rolesAllowed?.length ? (
                        <span className={`ag__chip ${eligible ? "" : "-deny"}`}>Requires: {open.rolesAllowed.join(", ")}</span>
                      ) : <span className="ag__chip">All roles</span>}

                      {isDayOne ? (
                        <span className="ag__chip -warn"><FiAlertTriangle/> Day 1 registration disabled</span>
                      ) : null}

                      {!b2b && conflictWith ? (
                        <span className="ag__chip -warn"><FiAlertTriangle/> Conflict with “{conflictWith.title}”</span>
                      ) : null}
                    </div>

                    <div className="ag__actions mt-4">
                      {isDayOne ? (
                        myStatus ? (
                          <button className="ag__btn -outline" onClick={onCancel}>Cancel</button>
                        ) : (
                          <button className="ag__btn -outline" disabled>Registration closed (Day 1)</button>
                        )
                      ) : (
                        !eligible ? (
                          <button className="ag__btn -outline" disabled>Not eligible</button>
                        ) : myStatus ? (
                          <button className="ag__btn -outline" onClick={onCancel}>Cancel</button>
                        ) : full ? (
                          <button className="ag__btn" onClick={onSign}>Join waitlist</button>
                        ) : (
                          <button className="ag__btn" onClick={onSign}>Sign me up</button>
                        )
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
