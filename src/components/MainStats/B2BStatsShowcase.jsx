import React from "react";
import { FiUsers, FiBriefcase, FiCalendar, FiLink } from "react-icons/fi";
import "./b2b-stats.css";

export default function B2BStatsShowcase({ items = [] }) {
  const DEMO = [
    {
      id:"A",
      subject:"Meetings",
      desc:"Verified B2B meetings hosted across summits and expos, matching buyers with the right solutions.",
      statNum:"12,540",
      bgUrl:"https://gits.seketak-eg.com/wp-content/uploads/2025/05/DSC_2502-1.png"
    },
    {
      id:"B",
      subject:"Attendees",
      desc:"Professionals who joined our events to network, learn, and close real deals.",
      statNum:"85,210",
      bgUrl:"https://gits.seketak-eg.com/wp-content/uploads/2025/05/DSC_2708.png"
    },
    {
      id:"C",
      subject:"Events",
      desc:"Conferences and expos delivered with curated matchmaking and hands-on demos.",
      statNum:"132",
      bgUrl:"https://gits.seketak-eg.com/wp-content/uploads/2025/05/DSC_2321.png"
    },
    {
      id:"D",
      subject:"Connections",
      desc:"Introductions that became lasting commercial relationships and partnerships.",
      statNum:"47,800",
      bgUrl:"https://gits.seketak-eg.com/wp-content/uploads/2025/05/DSC_2046.png"
    },
  ];

  const data = Array.isArray(items) && items.length ? items.slice(0,4) : DEMO;
  const [active, setActive] = React.useState(0);

  const iconFor = (subject="")=>{
    const s=subject.toLowerCase();
    if(s.includes("meeting")) return <FiBriefcase/>;
    if(s.includes("attend"))  return <FiUsers/>;
    if(s.includes("event"))   return <FiCalendar/>;
    if(s.includes("connect")) return <FiLink/>;
    return <FiLink/>;
  };

  return (
    <section className="b2bx">
      <h2 className="ev-title text-center m-5">The latest from Insights</h2>
      <div className="b2bx-row" role="list">
        {data.map((it, idx) => {
          const isOpen = active === idx;
          return (
            <article
              key={it.id || idx}
              role="listitem"
              className={`b2bx-card ${isOpen ? "is-open" : "is-closed"}`}
              style={{ flex: isOpen ? "3 1 0" : "1 1 0" }}
              onMouseEnter={() => setActive(idx)}
              onFocus={() => setActive(idx)}
              tabIndex={0}
              aria-selected={isOpen}
            >
              <span className="b2bx-subject">{it.subject || "Stat"}</span>

              {isOpen ? (
                <span className="b2bx-metric-open">
                  <span className="ico">{iconFor(it.subject)}</span>
                  <span className="num">{it.statNum ?? "—"}</span>
                </span>
              ) : (
                <>
                </>
              )}

              <div
  className="b2bx-bg"
  style={{ "--bg": `url(${it.bgUrl || ""})` }}
/>

              <div className="b2bx-body">
                {!isOpen ? <div className="b2bx-num-closed">{it.statNum ?? "—"}</div> : null}
                <p className={`b2bx-desc ${isOpen ? "open" : ""}`}>{it.desc || "—"}</p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
