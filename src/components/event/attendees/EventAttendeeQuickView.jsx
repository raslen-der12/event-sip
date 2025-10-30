import React from "react";
import PropTypes from "prop-types";
import {
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiBriefcase,
  FiMapPin,
  FiExternalLink,
  FiMessageSquare,
  FiUserPlus,
} from "react-icons/fi";
import "./event-attendees-quick.css";
import imageLink from "../../../utils/imageLink";

/**
 * Modal quick-view for a single attendee.
 * Keyboard: Esc closes, ←/→ navigate (when handlers provided).
 */
export default function EventAttendeeQuickView({
  open = false,
  item = null,
  index = 0,
  total = 0,
  onClose,
  onPrev,
  onNext,
  onReadMore,
  onBook,
  onMessage,
  isLoggedIn = false,
}) {
  const ref = React.useRef(null);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
      if (e.key === "ArrowLeft") onPrev?.();
      if (e.key === "ArrowRight") onNext?.();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose, onPrev, onNext]);

  React.useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;
  console.log(item);

  const s = item || {};
  const photo =
    s.ProfilePic ||
    "https://images.unsplash.com/photo-1527980965255-d3b416303d12?q=80&w=600";
  const name = s.fullName || "—";
  const org = s.orgName || s.organization || "";
  const title = s.jobTitle || "";
  const role = s.BusinessRole || s.businessRole || "";
  const place = s.city || s.country || "";
  const openMeet = !!s.openMeetings;
  const id = s.id || s.actorId || s.attendeeId || "";
  return (
    <div className="esq-overlay" role="dialog" aria-modal="true" aria-label="Attendee preview">
      <div className="esq-dialog" ref={ref}>
        {/* Gradient frame */}
        <div className="esq-frame" />

        {/* Header */}
        <div className="esq-top">
          <button className="esq-iconbtn" onClick={onPrev} disabled={!onPrev}>
            <FiChevronLeft />
          </button>

          <div className="esq-count">
            <span>{(index ?? 0) + 1}</span>
            <span className="sep">/</span>
            <span>{total ?? 0}</span>
          </div>

          <button className="esq-close" onClick={onClose} aria-label="Close">
            <FiX />
          </button>
        </div>

        {/* Body */}
        <div className="esq-body">
          <div className="esq-avatar" style={{ backgroundImage: `url(${imageLink(photo)})` }} />

          <div className="esq-main">
            <h3 className="esq-name">{name}</h3>

            <div className="esq-meta">
              {title ? (
                <span className="esq-pill">
                  <FiBriefcase />
                  {title}
                </span>
              ) : null}
              {org ? <span className="esq-pill">{org}</span> : null}
              {role ? <span className="esq-chip">{role}</span> : null}
              {place ? (
                <span className="esq-pill">
                  <FiMapPin />
                  {place}
                </span>
              ) : null}
              {openMeet ? <span className="esq-open">Open to meetings</span> : null}
            </div>

            {/* Actions */}
            <div className="esq-actions">
              <button className="esq-btn esq-primary" onClick={onReadMore}>
                <FiExternalLink />
                Read more
              </button>

              {isLoggedIn ? (
                <>
                  <button className="esq-btn" onClick={() => onBook?.(id)}>
                    <FiUserPlus />
                    Book meeting
                  </button>
                  <button className="esq-btn" onClick={onMessage}>
                    <FiMessageSquare />
                    Message
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </div>

        {/* Next arrow (floater) */}
        <button className="esq-next" onClick={onNext} disabled={!onNext}>
          <FiChevronRight />
        </button>
      </div>

      {/* Backdrop click closes */}
      <button className="esq-backdrop" aria-label="Close" onClick={onClose} />
    </div>
  );
}

EventAttendeeQuickView.propTypes = {
  open: PropTypes.bool,
  item: PropTypes.object,
  index: PropTypes.number,
  total: PropTypes.number,
  onClose: PropTypes.func,
  onPrev: PropTypes.func,
  onNext: PropTypes.func,
  onReadMore: PropTypes.func,
  onBook: PropTypes.func,
  onMessage: PropTypes.func,
  isLoggedIn: PropTypes.bool,
};
