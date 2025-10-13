import React from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import {
  FiX,
  FiExternalLink,
  FiUserPlus,
  FiMessageCircle,
  FiZap,
} from "react-icons/fi";
import "./exhibitor-quickview.css";

/**
 * A11y-friendly modal. Blocks background; ESC closes; click backdrop closes.
 * Props:
 * - open: bool
 * - item: { orgName, industry, logo, offering, openToMeet, _id/id }
 * - isLoggedIn: bool
 * - onClose: fn
 * - onReadMore: (item) => href string
 * - onBook: (item) => void
 * - onMessage: (item) => void
 */
export default function ExhibitorQuickView({
  open,
  item,
  isLoggedIn,
  onClose,
  onReadMore,
  onBook,
  onMessage,
}) {
  const ref = React.useRef(null);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !item) return null;

  const org = item?.orgName || "—";
  const ind = item?.industry || "—";
  const logo =
    item?.logo || "https://dummyimage.com/240x240/ffffff/0f1221.png&text=LOGO";
  const offering = item?.offering || "—";
  const openMeet = !!item?.openToMeet;

  const readHref = typeof onReadMore === "function" ? onReadMore(item) : "#";

  return (
    <div className="xv-overlay" role="dialog" aria-modal="true" aria-label={`${org} preview`}>
      <div className="xv-scrim" onClick={onClose} />
      <div className="xv-modal" ref={ref}>
        <button className="xv-close" onClick={onClose} aria-label="Close">
          <FiX />
        </button>

        {/* Brand header */}
        <div className="xv-head">
          <div
            className="xv-logo"
            style={{ backgroundImage: `url(${logo})` }}
            role="img"
            aria-label={`${org} logo`}
          />
          <div className="xv-meta">
            <h3 className="xv-name">{org}</h3>
            <div className="xv-tags">
              <span className="xv-pill">{ind}</span>
              {openMeet ? (
                <span className="xv-ribbon">
                  <FiZap />
                  Open to meet
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="xv-body">
          <p className="xv-desc">{offering}</p>
        </div>

        {/* Actions */}
        <div className="xv-actions">
          <Link className="xv-btn xv-primary" to={readHref} onClick={onClose}>
            <FiExternalLink />
            Read more
          </Link>
          {isLoggedIn ? (
            <>
              <button className="xv-btn" onClick={() => onBook?.(item)}>
                <FiUserPlus />
                Meet
              </button>
              <button className="xv-btn" onClick={() => onMessage?.(item)}>
                <FiMessageCircle />
                Message
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

ExhibitorQuickView.propTypes = {
  open: PropTypes.bool,
  item: PropTypes.object,
  isLoggedIn: PropTypes.bool,
  onClose: PropTypes.func,
  onReadMore: PropTypes.func,
  onBook: PropTypes.func,
  onMessage: PropTypes.func,
};
