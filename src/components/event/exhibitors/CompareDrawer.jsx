import React from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import {
  FiX,
  FiExternalLink,
  FiUserPlus,
  FiMessageCircle,
  FiTrash2,
} from "react-icons/fi";
import "./compare-drawer.css";
import imageLink from "../../../utils/imageLink";

/**
 * Slide-up drawer that compares selected exhibitors.
 * Props:
 * - open: bool
 * - items: [{ id/_id, orgName, industry, logo, offering }]
 * - isLoggedIn: bool
 * - onClose: fn
 * - onRemove: (id) => void
 * - onClear: () => void
 * - getReadMoreHref: (item) => string
 * - onBook, onMessage: (item) => void
 */
export default function CompareDrawer({
  open,
  items = [],
  isLoggedIn,
  onClose,
  onRemove,
  onClear,
  getReadMoreHref,
  onBook,
  onMessage,
}) {
  const list = Array.isArray(items) ? items : [];

  React.useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose?.();
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <div className={`cdw ${open ? "is-open" : ""}`} aria-hidden={!open}>
      <div className="cdw-row">
        <div className="cdw-title">
          Compare <span className="cdw-count">{list.length}</span>
        </div>
        <div className="cdw-spacer" />
        {list.length > 0 ? (
          <button className="cdw-clear" onClick={onClear} title="Clear all">
            <FiTrash2 />
            Clear
          </button>
        ) : null}
        <button className="cdw-close" onClick={onClose} aria-label="Close compare">
          <FiX />
        </button>
      </div>

      <div className="cdw-grid">
        {list.length === 0 ? (
          <div className="cdw-empty">Select exhibitors to compare.</div>
        ) : (
          list.map((x, i) => {
            const id = x?._id || x?.id || `i-${i}`;
            const org = x?.orgName || "—";
            const ind = x?.industry || "—";
            const logo =
              x?.logo || "https://dummyimage.com/240x240/ffffff/0f1221.png&text=LOGO";
            const desc = x?.offering || "—";

            return (
              <article key={id} className="cdw-card">
                <button
                  className="cdw-remove"
                  title="Remove from compare"
                  onClick={() => onRemove?.(id)}
                >
                  <FiX />
                </button>
                <div
                  className="cdw-logo"
                  style={{ backgroundImage: `url(${imageLink(logo)})` }}
                  role="img"
                  aria-label={`${org} logo`}
                />
                <h4 className="cdw-name">{org}</h4>
                <div className="cdw-ind">{ind}</div>
                <p className="cdw-desc">{desc}</p>
                <div className="cdw-actions">
                  <Link className="cdw-btn cdw-primary" to={getReadMoreHref?.(x) || "#"} onClick={onClose}>
                    <FiExternalLink />
                    Read more
                  </Link>
                  {isLoggedIn ? (
                    <>
                      <button className="cdw-btn" onClick={() => onBook?.(x)}>
                        <FiUserPlus />
                        Meet
                      </button>
                      <button className="cdw-btn" onClick={() => onMessage?.(x)}>
                        <FiMessageCircle />
                        Message
                      </button>
                    </>
                  ) : null}
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}

CompareDrawer.propTypes = {
  open: PropTypes.bool,
  items: PropTypes.array,
  isLoggedIn: PropTypes.bool,
  onClose: PropTypes.func,
  onRemove: PropTypes.func,
  onClear: PropTypes.func,
  getReadMoreHref: PropTypes.func,
  onBook: PropTypes.func,
  onMessage: PropTypes.func,
};
