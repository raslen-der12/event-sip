import React from "react";
import PropTypes from "prop-types";

/** Horizontal scroll chips to jump between event groups */
export default function JumpRail({ items = [], onJump }) {
  if (!items.length) return null;
  return (
    <nav className="gsp-rail" aria-label="Jump to event">
      {items.map((ev) => (
        <button key={ev.id} type="button" className="gsp-rail-btn" onClick={() => onJump?.(ev.id)}>
          {ev.label}
        </button>
      ))}
    </nav>
  );
}

JumpRail.propTypes = {
  items: PropTypes.array,        // [{id,label}]
  onJump: PropTypes.func         // (id)=>void
};
