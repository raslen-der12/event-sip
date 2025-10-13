import React from "react";
import PropTypes from "prop-types";

/* tiny inline icons */
const IcCode = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M8 16L4 12l4-4M16 8l4 4-4 4" stroke="currentColor"/><path d="M14 5l-4 14" stroke="currentColor"/></svg>);
const IcMic  = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="9" y="3" width="6" height="11" rx="3" stroke="currentColor"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3" stroke="currentColor"/></svg>);
const IcUsers= () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="8" cy="8" r="3" stroke="currentColor"/><path d="M2 20c0-3 3-5 6-5" stroke="currentColor"/><circle cx="17" cy="10" r="3" stroke="currentColor"/><path d="M12 20c0-2.5 2.5-4.5 5-4.5" stroke="currentColor"/></svg>);

const iconBy = { code: <IcCode/>, mic: <IcMic/>, users: <IcUsers/> };

export default function LaneColumn({ id, label, icon = "code", variant = "purple", items = [] }) {
  // map variant to token color (no hex here)
  const color =
    variant === "purple" ? "var(--brand-600)" :
    variant === "blue"   ? "var(--accent-blue)" :
    variant === "teal"   ? "var(--accent-teal)" :
    variant === "amber"  ? "var(--accent-amber)" :
    variant === "pink"   ? "var(--accent-pink)" :
    "var(--brand-600)";

  return (
    <div className="lane-col" data-variant={variant} style={{ "--lane-color": color }}>
      <div className="lane-head">
        <div className="lane-chip" aria-hidden="true">{iconBy[icon]}</div>
        <h3 className="lane-title">{label}</h3>
      </div>

      <ul className="lane-list">
        {items.map((it) => (
          <li key={it.id} className="lane-item">
            <div className="lane-time">{it.time}</div>
            <div className="lane-body">
              <div className="lane-name">{it.title}</div>
              {it.desc ? <p className="lane-desc">{it.desc}</p> : null}
              {it.tags?.length ? (
                <div className="lane-tags">
                  {it.tags.map((t) => <span className="tag" key={t}>{t}</span>)}
                </div>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

LaneColumn.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  icon: PropTypes.oneOf(["code","mic","users"]),
  variant: PropTypes.oneOf(["purple","blue","teal","amber","pink"]),
  items: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    time: PropTypes.string,
    title: PropTypes.string.isRequired,
    desc: PropTypes.string,
    tags: PropTypes.arrayOf(PropTypes.string),
  })),
};
