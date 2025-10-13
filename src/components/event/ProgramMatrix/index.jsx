import React from "react";
import "./program-agenda.css";

/**
 * ProgramAgenda — light agenda list (no matrix)
 *
 * Props:
 *  sessions?: Array<{
 *    _id?: string,
 *    sessionTitle: string,
 *    speaker?: string | { fullName?: string, orgName?: string },
 *    room?: string,
 *    startTime: string | Date,
 *    endTime: string | Date,
 *    summary?: string,
 *    tags?: string[]
 *  }>
 *  isLoading?: boolean
 *  heading?: string
 *  subheading?: string
 */

const FALLBACK = makeFallback();

/* utils */
const toDate = (d) => (d instanceof Date ? d : new Date(d));
const pad = (n) => (n < 10 ? `0${n}` : `${n}`);
const fmtTime = (d) => {
  try {
    const x = toDate(d);
    return `${pad(x.getHours())}:${pad(x.getMinutes())}`;
  } catch { return ""; }
};
const dayKey = (d) => {
  try {
    const x = toDate(d);
    return `${x.getFullYear()}-${x.getMonth()+1}-${x.getDate()}`;
  } catch { return "day"; }
};
const fmtDay = (d) => {
  try {
    const x = toDate(d);
    return new Intl.DateTimeFormat(undefined, {
      weekday: "short", month: "short", day: "numeric",
    }).format(x);
  } catch { return ""; }
};

function groupByDay(rows) {
  const map = new Map();
  (rows || []).forEach((x) => {
    const k = dayKey(x?.startTime || x?.endTime);
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(x);
  });
  const out = [...map.entries()].map(([k, arr]) => ({
    key: k,
    label: fmtDay(arr?.[0]?.startTime || arr?.[0]?.endTime),
    items: arr.sort((a,b)=> toDate(a?.startTime) - toDate(b?.startTime))
  }));
  return out.sort((a,b)=> toDate(a.items[0]?.startTime) - toDate(b.items[0]?.startTime));
}

/* tiny inline icons (no deps) */
const I = {
  clock: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor"/><path d="M12 7v6l4 2" stroke="currentColor"/></svg>),
  room:  () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M3 10a9 9 0 1 0 18 0A9 9 0 0 0 3 10Zm9-7v7l5 3" stroke="currentColor"/></svg>),
  mic:   () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="9" y="3" width="6" height="10" rx="3" stroke="currentColor"/><path d="M5 9v1a7 7 0 0 0 14 0V9M12 20v-3" stroke="currentColor"/></svg>),
  tag:   () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M10 4h7l3 3-10 10-7-7 7-6Z" stroke="currentColor"/><circle cx="16" cy="8" r="1.3" fill="currentColor"/></svg>),
  x:     () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2"/></svg>),
};

export default function ProgramAgenda({
  sessions,
  isLoading,
  heading = "Program",
  subheading = "Agenda by day",
}) {
  // normalize to simple fields we need
  const normalize = (s) => {
    const speakerNames = Array.isArray(s?.speakers) && s.speakers.length
      ? s.speakers.map(p => p?.name || p?.fullName).filter(Boolean).join(", ")
      : undefined;
    const sp =
      speakerNames
        ? { fullName: speakerNames, orgName: "" }
        : typeof s?.speaker === "string"
          ? { fullName: s.speaker, orgName: "" }
          : (s?.speaker || null);

    return {
      ...s,
      room: s?.room || s?.roomName || s?.track || "Room",
      speaker: sp,
    };
  };

  const data = (Array.isArray(sessions) && sessions.length ? sessions : FALLBACK).map(normalize);
  const days = groupByDay(data);
  const [active, setActive] = React.useState(0);
  const [open, setOpen] = React.useState(null); // modal item

  React.useEffect(() => {
    if (active > days.length - 1) setActive(0);
  }, [days.length, active]);

  return (
    <section id="schedule" className="ag">
      <div className="container">
        <header className="ag__head">
          <div className="ag__titles">
            <h2 className="ag__title">{heading}</h2>
            {subheading ? <p className="ag__sub">{subheading}</p> : null}
          </div>
          <div className="ag__tabs" role="tablist" aria-label="Select day">
            {days.map((d, i) => (
              <button
                key={d.key}
                type="button"
                role="tab"
                aria-selected={active === i}
                className={`ag__pill ${active === i ? "is-active" : ""}`}
                onClick={() => setActive(i)}
              >
                {d.label || "Day"}
              </button>
            ))}
          </div>
        </header>

        {/* loading state */}
        {isLoading ? (
          <div className="ag__skel">
            {Array.from({ length: 5 }).map((_, i) => <div key={i} className="ag__skelRow" />)}
          </div>
        ) : null}

        {!isLoading && (
          <ul className="ag__list" role="list">
            {(days[active]?.items || []).map((s) => (
              <li key={s._id || s.id || s.sessionTitle} className="ag__item">
                <button
                  type="button"
                  className="ag__card"
                  onClick={() => setOpen(s)}
                  title="View details"
                >
                  <div className="ag__time">
                    <I.clock />
                    <span>{fmtTime(s.startTime)}–{fmtTime(s.endTime)}</span>
                  </div>

                  <div className="ag__main">
                    <h3 className="ag__name">{s.sessionTitle || "Session"}</h3>
                    <div className="ag__meta">
                      <span className="ag__metaRow">
                        <I.mic />
                        <span className="ag__speaker">
                          {s?.speaker?.fullName || "Speaker"}
                        </span>
                        {s?.speaker?.orgName
                          ? <span className="ag__org"> · {s.speaker.orgName}</span>
                          : null}
                      </span>

                      <span className="ag__metaRow">
                        <I.room />
                        <span>{s.room}</span>
                      </span>
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
        <div className="ag__modal" role="dialog" aria-modal="true" aria-label="Session details">
          <div className="ag__backdrop" onClick={() => setOpen(null)} />
          <div className="ag__sheet">
            <header className="ag__sheetHead">
              <h3 className="ag__sheetTitle">{open.sessionTitle || "Session"}</h3>
              <button className="ag__x" onClick={() => setOpen(null)} aria-label="Close"><I.x/></button>
            </header>
            <div className="ag__sheetMeta">
              <div className="ag__sheetRow"><I.clock/>{fmtTime(open.startTime)}–{fmtTime(open.endTime)}</div>
              <div className="ag__sheetRow"><I.room/>{open.room}</div>
              <div className="ag__sheetRow">
                <I.mic/>{open?.speaker?.fullName || "Speaker"}
                {open?.speaker?.orgName ? <span className="ag__org"> · {open.speaker.orgName}</span> : null}
              </div>
            </div>
            {open.summary ? <p className="ag__sheetTxt">{open.summary}</p> : null}
            {Array.isArray(open.tags) && open.tags.length ? (
              <div className="ag__sheetTags">
                {open.tags.map(t => <span key={t} className="ag__tag">{t}</span>)}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </section>
  );
}

/* small fallback sample (same dates across days) */
function makeFallback() {
  const base = new Date();
  base.setHours(9, 0, 0, 0);
  const t = (day, h, m) => {
    const d = new Date(base);
    d.setDate(d.getDate() + day);
    d.setHours(h, m, 0, 0);
    return d.toISOString();
  };
  return [
    { _id:"a1", sessionTitle:"Opening Keynote",  speaker:{fullName:"Nada Ferchichi", orgName:"GITS"}, room:"Main Hall", startTime:t(0,9,0),  endTime:t(0,9,45),  tags:["Keynote"], summary:"Kickoff and outlook." },
    { _id:"a2", sessionTitle:"B2B Matchmaking",  speaker:{fullName:"—"},           room:"B2B Lounge", startTime:t(0,10,0), endTime:t(0,12,0), tags:["Networking"] },
    { _id:"a3", sessionTitle:"Panel: Funding",    speaker:{fullName:"Panel"},       room:"Main Hall", startTime:t(0,11,15), endTime:t(0,12,0), tags:["VC","SMEs"] },
    { _id:"b1", sessionTitle:"Deep-Tech Demos",   speaker:{fullName:"Showcase"},    room:"Stage B",   startTime:t(1,9,30), endTime:t(1,10,30) },
    { _id:"b2", sessionTitle:"Procurement 101",   speaker:{fullName:"Yosra K.", orgName:"GovLab"}, room:"Main Hall", startTime:t(1,10,45), endTime:t(1,11,25) },
    { _id:"b3", sessionTitle:"Founders Fireside", speaker:{fullName:"Panel"},       room:"Main Hall", startTime:t(1,11,45), endTime:t(1,12,30) },
  ];
}
