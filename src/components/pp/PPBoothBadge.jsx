import React from "react";
import PropTypes from "prop-types";
import {
  FiHash,        // booth number
  FiBox,         // booth size
  FiTool,        // needs equipment
  FiZap,         // live demo
} from "react-icons/fi";
import "./pp-booth-badge.css";

/**
 * Public Profile – Booth Badge (READ-ONLY)
 * Works great on Exhibitor profiles. Safe when values are missing.
 *
 * Props:
 *  - booth?: { boothNumber, boothSize, needsEquipment, liveDemo }
 *  - identity?: { exhibitorName, orgName }
 *  - image?: string (optional background image for the badge)
 *  - compact?: boolean (renders a small inline pill variant)
 *  - className?: string
 */
export default function PPBoothBadge({
  booth = {},
  identity = {},
  image,
  compact = false,
  className = "",
}) {
  const number = booth?.boothNumber || null;
  const size = booth?.boothSize || null;
  const needsEq = !!booth?.needsEquipment;
  const live = !!booth?.liveDemo;

  if (compact) {
    // Inline pill variant (tiny)
    return (
      <span className={`ppbth-pill ${className}`}>
        <span className="ppbth-pill-ico"><FiHash /></span>
        <span className="ppbth-pill-txt">{number || "Booth —"}</span>
        {size ? <span className="ppbth-tag">{size}</span> : null}
        {live ? <span className="ppbth-tag -ok"><FiZap /> Live</span> : null}
      </span>
    );
  }

  const title = identity?.exhibitorName || identity?.orgName || "—";

  return (
    <section className={`ppbth ${className}`}>
      {/* media / ribbon */}
      <div
        className="ppbth-media"
        style={image ? { backgroundImage: `url(${image})` } : undefined}
        aria-hidden="true"
      >
        <div className="ppbth-grad" />
        <div className="ppbth-ribbon" title={number ? `Booth ${number}` : "Booth —"}>
          <span className="ppbth-ribbon-txt">
            <FiHash />
            {number || "—"}
          </span>
        </div>
      </div>

      {/* body */}
      <div className="ppbth-body">
        <h3 className="ppbth-title" title={title}>{title}</h3>

        <div className="ppbth-meta">
          <span className="ppbth-chip">
            <FiBox />
            {size || "Size —"}
          </span>

          <span className={`ppbth-chip ${live ? "-ok" : "-muted"}`}>
            <FiZap />
            {live ? "Live demo" : "No live demo"}
          </span>

          <span className={`ppbth-chip ${needsEq ? "-warn" : ""}`}>
            <FiTool />
            {needsEq ? "Needs equipment" : "No special equipment"}
          </span>
        </div>
      </div>
    </section>
  );
}

PPBoothBadge.propTypes = {
  booth: PropTypes.object,
  identity: PropTypes.object,
  image: PropTypes.string,
  compact: PropTypes.bool,
  className: PropTypes.string,
};

/* alias to match the requested name (typo-safe) */
export const PPBootheBadge = PPBoothBadge;
