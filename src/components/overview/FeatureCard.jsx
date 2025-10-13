import React from "react";
import PropTypes from "prop-types";
import "./overview.css";

export default function FeatureCard({ icon, title, desc, bullets = [] }) {
  return (
    <article className="feature-card">
      <div className="fc-head">
        <div className="fc-icon" aria-hidden="true">{icon}</div>
        <h3 className="fc-title">{title}</h3>
      </div>
      {desc ? <p className="fc-desc">{desc}</p> : null}
      {bullets.length ? (
        <ul className="fc-list">
          {bullets.map((b, i) => <li key={i}>{b}</li>)}
        </ul>
      ) : null}
    </article>
  );
}

FeatureCard.propTypes = {
  icon: PropTypes.node,
  title: PropTypes.string.isRequired,
  desc: PropTypes.string,
  bullets: PropTypes.arrayOf(PropTypes.string),
};
