import React from "react";
import PropTypes from "prop-types";
import { FiX, FiTrash2 } from "react-icons/fi";
import "./event-speakers-compare.css";
import imageLink from "../../../utils/imageLink";

/** Bottom drawer with selected speakers (max 3) and simple compare view */
export default function EventSpeakersCompareDrawer({
  items = [],
  onRemove,
  onClear,
  open = false,
  onClose,
}) {
  const [expanded, setExpanded] = React.useState(false);
  React.useEffect(() => { if (!open) setExpanded(false); }, [open]);
  if (!open) return null;

  return (
    <div className="esc-wrap" role="dialog" aria-modal="true" aria-label="Compare speakers">
      <div className={`esc-bar ${expanded ? "is-open" : ""}`}>
        <div className="esc-row">
          <div className="esc-chips">
            {items.map((s, i) => {
              const photo = s?.profilePic || "https://images.unsplash.com/photo-1527980965255-d3b416303d12?q=80&w=600";
              const name  = s?.fullName || "—";
              return (
                <div className="esc-chip" key={(s && (s._id || s.id)) || i}>
                  <div className="esc-avatar" style={{ backgroundImage: `url(${imageLink(photo)})` }} />
                  <span className="esc-name">{name}</span>
                  <button className="esc-badge" onClick={() => onRemove?.(s)} aria-label="Remove">
                    <FiX />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="esc-actions">
            <button className="esc-btn" onClick={() => setExpanded((v) => !v)}>
              {expanded ? "Hide compare" : "Compare"}
            </button>
            <button className="esc-btn esc-danger d-flex align-items-center" onClick={onClear} title="Clear all">
              <FiTrash2 /> Clear
            </button>
            <button className="esc-close" onClick={onClose} aria-label="Close" />
          </div>
        </div>

        {expanded ? (
          <div className="esc-panel">
            <div className="esc-table">
              <div className="esc-thead">
                <div>Field</div>
                {items.map((s, i) => <div key={i}>{s?.fullName || "—"}</div>)}
              </div>
              {[
                ["Organization", (s)=>s?.orgName || s?.organization || "—"],
                ["Title",       (s)=>s?.jobTitle || "—"],
                ["Role",        (s)=>s?.BusinessRole || s?.businessRole || "—"],
                ["Open to meetings", (s)=> s?.openMeetings ? "Yes" : "No"],
              ].map(([label, pick]) => (
                <div className="esc-row" key={label}>
                  <div className="esc-label">{label}</div>
                  {items.map((s, i) => <div className="esc-cell" key={i}>{pick(s)}</div>)}
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
      <button className="esc-backdrop" aria-label="Close" onClick={onClose} />
    </div>
  );
}

EventSpeakersCompareDrawer.propTypes = {
  items: PropTypes.array,
  onRemove: PropTypes.func,
  onClear: PropTypes.func,
  open: PropTypes.bool,
  onClose: PropTypes.func,
};
