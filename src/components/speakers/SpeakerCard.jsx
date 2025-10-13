import React from "react";
import PropTypes from "prop-types";
import "./speakers.css";

/* tiny inline icons */
const IcCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" stroke="currentColor"/><path d="M7 12l3 3 7-7" stroke="currentColor"/>
  </svg>
);

const colorOf = (v) =>
  v === "blue"  ? "var(--accent-blue)"  :
  v === "teal"  ? "var(--accent-teal)"  :
  v === "amber" ? "var(--accent-amber)" :
  v === "pink"  ? "var(--accent-pink)"  :
  "var(--brand-600)";

export default function SpeakerCard({
  name, title, org, photo, href, tags = [], variant = "purple", verified = false, sessions = 1, onQuick
}) {
  const color = colorOf(variant);

  return (
    <article className="spk-card v" style={{ "--spk-color": color }}>
      {/* Media top */}
      <div className="spk-media">
        {photo ? <img src={photo} alt={`${name} headshot`} loading="lazy" /> : <div className="spk-ph" />}
        <span className="spk-ring" aria-hidden="true" />
      </div>

      {/* Content */}
      <div className="spk-content">
        <div className="spk-line">
          <h3 className="spk-name" title={name}>{name}</h3>
          {verified && <span className="spk-verified" title="Verified speaker"><IcCheck/></span>}
        </div>

        {(title || org) && (
          <div className="spk-meta" title={`${title || ""}${org ? ` · ${org}` : ""}`}>
            {title}{org ? ` · ${org}` : ""}
          </div>
        )}

        <div className="spk-badges">
          <span className="spk-badge">{sessions} {sessions > 1 ? "sessions" : "session"}</span>
          {tags.slice(0, 3).map((t) => <span key={t} className="spk-tag">{t}</span>)}
        </div>

        {/* spacer pushes CTAs to bottom = equal visual height */}
        <div className="spk-spacer" />

        <div className="spk-ctas">
          {href ? <a className="btn btn-outline-dark rounded-pill px-3" href={href}>Profile</a> : <span/>}
          <button type="button" className="btn-brand rounded-pill px-3" onClick={onQuick}>Quick view</button>
        </div>
      </div>
    </article>
  );
}

SpeakerCard.propTypes = {
  name: PropTypes.string.isRequired,
  title: PropTypes.string,
  org: PropTypes.string,
  photo: PropTypes.string,
  href: PropTypes.string,
  tags: PropTypes.arrayOf(PropTypes.string),
  variant: PropTypes.oneOf(["purple","blue","teal","amber","pink"]),
  verified: PropTypes.bool,
  sessions: PropTypes.number,
  onQuick: PropTypes.func
};
