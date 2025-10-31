import React from "react";
import PropTypes from "prop-types";
import "./business-engagements.css";

/* tiny inline icons (no deps) */
const I = {
  search: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/><path d="M20 20l-3-3" stroke="currentColor" strokeWidth="2"/></svg>),
  filter: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M3 5h18M6 12h12M9 19h6" stroke="currentColor" strokeWidth="2"/></svg>),
  arrowNE: () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M7 17 17 7M9 7h8v8" stroke="currentColor" strokeWidth="2"/></svg>),
  calendar: () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="17" rx="3" stroke="currentColor"/><path d="M8 2v4M16 2v4M3 9h18" stroke="currentColor"/></svg>),
  user: () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="currentColor"/><path d="M4 21c0-3.3 5-5 8-5s8 1.7 8 5" stroke="currentColor"/></svg>),
  map: () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M10 21l-6-3V3l6 3 8-3v15l-8 3Z" stroke="currentColor"/></svg>),
  download: () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 3v12m0 0 4-4m-4 4-4-4" stroke="currentColor"/><path d="M4 21h16" stroke="currentColor"/></svg>),
  link: () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M10 14a5 5 0 0 1 0-7l1-1a5 5 0 0 1 7 7l-1 1M14 10a5 5 0 0 1 0 7l-1 1a5 5 0 0 1-7-7l1-1" stroke="currentColor"/></svg>),
};

/* ---- Fallback Demo ---- */
const DEMO = [
  { id:"e1", type:"intro",    title:"Intro: YourCo × Nova Steel",    counterpart:{ name:"Nova Steel", org:"Nova Steel" }, dateISO:"2025-05-22", mode:"virtual", status:"completed", notes:"Introduced buyer PM to sales lead.", tags:["steel","supply"] },
  { id:"e2", type:"meeting",  title:"Discovery Call",                counterpart:{ name:"J. Patel", org:"Apex Motors" },  dateISO:"2025-06-04", mode:"in-person", status:"completed", notes:"Qualifying EV chassis needs.", tags:["EV","OEM"] },
  { id:"e3", type:"followup", title:"RFP Clarification",             counterpart:{ name:"Procurement", org:"Apex Motors" },dateISO:"2025-06-11", mode:"virtual", status:"completed", notes:"Shared BOM and timelines.", tags:["RFP"] },
  { id:"e4", type:"meeting",  title:"Tech Deep-dive",                counterpart:{ name:"Core Eng.", org:"HelioGrid" },   dateISO:"2025-07-02", mode:"virtual", status:"scheduled", notes:"Grid API security scope.", tags:["energy","api"] },
  { id:"e5", type:"deal",     title:"Pilot Agreement Signed",        counterpart:{ name:"HelioGrid", org:"HelioGrid" },   dateISO:"2025-07-17", mode:"in-person", status:"won", notes:"3-month pilot; 2 sites.", tags:["pilot"] },
  { id:"e6", type:"meeting",  title:"Demo Session",                  counterpart:{ name:"L. Gomez", org:"NorthBay Health"},dateISO:"2025-08-09", mode:"virtual", status:"no-show", notes:"Reschedule requested.", tags:["health"] },
  { id:"e7", type:"intro",    title:"Intro: YourCo × EastWorks",     counterpart:{ name:"EastWorks", org:"EastWorks" },   dateISO:"2025-08-22", mode:"virtual", status:"completed", notes:"SaaS pricing sent.", tags:["SaaS"] },
  { id:"e8", type:"followup", title:"Proposal Review",               counterpart:{ name:"Board", org:"EastWorks" },       dateISO:"2025-09-05", mode:"virtual", status:"in-progress", notes:"Legal redlines pending.", tags:["proposal"] },
];

const TYPE_LABEL = { intro:"Introduction", meeting:"Meeting", followup:"Follow-up", deal:"Deal" };
const STATUS_LABEL = { completed:"Completed", scheduled:"Scheduled", "in-progress":"In progress", won:"Won", lost:"Lost", "no-show":"No-show" };

function toCSV(rows){
  const cols = ["id","type","title","counterpart","date","mode","status","tags"];
  const esc = (v)=> `"${String(v??"").replaceAll('"','""')}"`;
  const lines = [cols.join(",")].concat(
    rows?.map(r=>[
      r.id, r.type, r.title,
      (r.counterpart?.org||r.counterpart?.name||""),
      (r.dateISO||""), (r.mode||""), (r.status||""),
      (r.tags||[]).join("|")
    ]?.map(esc).join(","))
  );
  return lines.join("\r\n");
}

export default function BusinessEngagements({
  heading="Engagements",
  subheading="Introductions, meetings, and follow-ups that move deals forward.",
  items = '',//DEMO,
  onView,     // (item) => void
  onRebook,   // (item) => void
  onExport,   // (csvString) => void  (optional)
}) {
  const data = Array.isArray(items)&&items.length ? items : '';//DEMO;

  // --- Filters ---
  const years = React.useMemo(()=>{
    const set = new Set(data?.map(d=> (d.dateISO? new Date(d.dateISO).getFullYear(): null)).filter(Boolean));
    return ["All", ...Array.from(set).sort((a,b)=>b-a)];
  },[data]);
  const [q,setQ] = React.useState("");
  const [year,setYear] = React.useState(years[0]||"All");
  const [type,setType] = React.useState("All");
  const [status,setStatus] = React.useState("All");
  const [sort,setSort] = React.useState("new"); // new | old

  const filtered = React.useMemo(()=>{
    const t = q.trim().toLowerCase();
    return data
      .filter(r=>{
        const y = r.dateISO ? new Date(r.dateISO).getFullYear() : null;
        const okYear = year==="All" || y===year;
        const okType = type==="All" || r.type===type;
        const okStatus = status==="All" || r.status===status;
        const blob = [r.title, r.counterpart?.org, r.counterpart?.name, r.tags?.join(" ")].join(" ").toLowerCase();
        const okQ = !t || blob.includes(t);
        return okYear && okType && okStatus && okQ;
      })
      .sort((a,b)=>{
        const A = a.dateISO ? new Date(a.dateISO).getTime() : 0;
        const B = b.dateISO ? new Date(b.dateISO).getTime() : 0;
        return sort==="new" ? B-A : A-B;
      });
  },[data,q,year,type,status,sort]);

  // --- Stats header ---
  const stats = React.useMemo(()=>{
    const total = filtered.length;
    const meetings = filtered.filter(r=>r.type==="meeting").length;
    const intros = filtered.filter(r=>r.type==="intro").length;
    const won = filtered.filter(r=>r.status==="won").length;
    const completion = (()=> {
      const done = filtered.filter(r=>["completed","won","lost"].includes(r.status)).length;
      return total? Math.round((done/total)*100) : 0;
    })();
    return { total, meetings, intros, won, completion };
  },[filtered]);

  // --- export ---
  const doExport = () => {
    const csv = toCSV(filtered);
    if (onExport) { onExport(csv); return; }
    const blob = new Blob([csv],{type:"text/csv;charset=utf-8"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "engagements.csv";
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="beng">
      <header className="beng-head">
        <div>
          <h3 className="beng-title">{heading}</h3>
          {subheading ? <p className="beng-sub">{subheading}</p> : null}
        </div>
        <button type="button" className="btn-ghost" onClick={doExport} aria-label="Export CSV">
          <I.download/> Export CSV
        </button>
      </header>

      {/* summary tiles */}
      <div className="beng-tiles">
        <div className="tile"><div className="t-k">Total</div><div className="t-v">{stats.total}</div></div>
        <div className="tile"><div className="t-k">Meetings</div><div className="t-v">{stats.meetings}</div></div>
        <div className="tile"><div className="t-k">Introductions</div><div className="t-v">{stats.intros}</div></div>
        <div className="tile"><div className="t-k">Wins</div><div className="t-v">{stats.won}</div></div>
        <div className="tile"><div className="t-k">Completion</div><div className="t-v">{stats.completion}%</div></div>
      </div>

      {/* toolbar */}
      <div className="beng-toolbar">
        <div className="search">
          <I.search/>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search title, company, tags…" aria-label="Search engagements"/>
        </div>
        <div className="filters">
          <span className="lab"><I.filter/> Filters</span>
          <select value={year} onChange={e=>setYear(e.target.value==="All"?"All":Number(e.target.value))}>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select value={type} onChange={e=>setType(e.target.value)}>
            {["All","intro","meeting","followup","deal"].map(t=><option key={t} value={t}>{t==="All"?"All types":TYPE_LABEL[t]||t}</option>)}
          </select>
          <select value={status} onChange={e=>setStatus(e.target.value)}>
            {["All","scheduled","in-progress","completed","won","lost","no-show"].map(s=><option key={s} value={s}>{s==="All"?"All status":STATUS_LABEL[s]||s}</option>)}
          </select>
          <select value={sort} onChange={e=>setSort(e.target.value)}>
            <option value="new">Newest first</option>
            <option value="old">Oldest first</option>
          </select>
        </div>
      </div>

      {/* list */}
      <div className="beng-list">
        {filtered?.map(item=>{
          const d = item.dateISO ? new Date(item.dateISO) : null;
          const dateStr = d ? d.toLocaleDateString(undefined,{year:"numeric",month:"short",day:"2-digit"}) : "—";
          return (
            <article key={item.id} className="rowcard">
              <div className={`row-badge t-${item.type}`}>{TYPE_LABEL[item.type]||item.type}</div>
              <div className="row-main">
                <h4 className="row-title">
                  {item.title}
                  {item.tags?.length ? <span className="row-tags">{item.tags.slice(0,3).map(t=><em key={t}>#{t}</em>)}</span> : null}
                </h4>
                <div className="row-meta">
                  <span className="meta"><I.calendar/>{dateStr}</span>
                  <span className="meta"><I.user/>{item.counterpart?.org || item.counterpart?.name || "—"}</span>
                  <span className="meta"><I.map/>{item.mode || "—"}</span>
                </div>
                {item.notes ? <p className="row-notes">{item.notes}</p> : null}
              </div>
              <div className="row-end">
                <span className={`status s-${(item.status||"").replace(" ","")}`}>{STATUS_LABEL[item.status]||item.status}</span>
                <div className="row-actions">
                  <button type="button" className="btn-ghost" onClick={()=> onView ? onView(item) : window.alert("View details")}>Details</button>
                  {item.type!=="deal" && (
                    <button type="button" className="btn" onClick={()=> onRebook ? onRebook(item) : window.alert("Rebook meeting")}>
                      Rebook <I.arrowNE/>
                    </button>
                  )}
                </div>
              </div>
            </article>
          );
        })}
        {filtered.length===0 && <div className="empty">No engagements match your filters.</div>}
      </div>
    </section>
  );
}

BusinessEngagements.propTypes = {
  heading: PropTypes.string,
  subheading: PropTypes.string,
  items: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    type: PropTypes.oneOf(["intro","meeting","followup","deal"]).isRequired,
    title: PropTypes.string.isRequired,
    counterpart: PropTypes.shape({ name: PropTypes.string, org: PropTypes.string }),
    dateISO: PropTypes.string,
    mode: PropTypes.string,
    status: PropTypes.oneOf(["scheduled","in-progress","completed","won","lost","no-show"]),
    notes: PropTypes.string,
    tags: PropTypes.arrayOf(PropTypes.string),
  })),
  onView: PropTypes.func,
  onRebook: PropTypes.func,
  onExport: PropTypes.func,
};
