import React from "react";
import PropTypes from "prop-types";

const IcMail = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor"/><path d="M4 7l8 6 8-6" stroke="currentColor"/></svg>);
const IcHandshake = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M7 12l3 3 7-7" stroke="currentColor"/><path d="M3 8l5-3 3 3 3-3 7 3v8l-7 3-3-3-3 3-5-3V8z" stroke="currentColor"/></svg>);
const IcKit = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="4" y="7" width="16" height="11" rx="2" stroke="currentColor"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" stroke="currentColor"/></svg>);

const iconMap = { mail: <IcMail/>, partner: <IcHandshake/>, kit: <IcKit/> };

export default function FooterActions({ items = [] }) {
  return (
    <aside className="ft-acts">
      {items.map((a) => (
        <a key={a.id} href={a.href || "#"} className="ft-act">
          <span className="i">{iconMap[a.icon] || <IcMail/>}</span>
          <span className="t">{a.label}</span>
        </a>
      ))}
    </aside>
  );
}

FooterActions.propTypes = {
  items: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    href: PropTypes.string,
    icon: PropTypes.oneOf(["mail","partner","kit"]),
  })),
};
