import React from "react";
import PropTypes from "prop-types";
import "./globalstats.css";

const colorOf = (v) =>
  v === "blue"  ? "var(--accent-blue)"  :
  v === "teal"  ? "var(--accent-teal)"  :
  v === "amber" ? "var(--accent-amber)" :
  v === "pink"  ? "var(--accent-pink)"  :
  /* purple */    "var(--brand-600)";

export default function StatTile({ img, value, label, hint, variant = "purple" }) {
  return (
    <article className="gs-tile" style={{ "--tile-color": colorOf(variant) }}>
      <div className="gs-tile-media">
        <img src={img} alt="" />
      </div>
      <div className="gs-tile-sheen" />
      <div className="gs-tile-edge" />
      <div className="gs-tile-body">
        <div className="gs-tile-value">{value}</div>
        <div className="gs-tile-label">{label}</div>
        {hint ? <div className="gs-tile-hint">{hint}</div> : null}
      </div>
    </article>
  );
}

StatTile.propTypes = {
  img: PropTypes.string.isRequired,      // background photo
  value: PropTypes.string.isRequired,    // e.g., "18k+"
  label: PropTypes.string.isRequired,    // e.g., "Total attendees"
  hint: PropTypes.string,                // e.g., "+12% YoY"
  variant: PropTypes.oneOf(["purple","blue","teal","amber","pink"]),
};
