import React from "react";
import PropTypes from "prop-types";
import { Link, useNavigate } from "react-router-dom";
import {
  FiUser,
  FiBriefcase,
  FiExternalLink,
  FiMessageSquare,
  FiUserPlus,
  FiCheck,
} from "react-icons/fi";
import "./event-attendees.css";
import { FiSlash } from "react-icons/fi";
import imageLink from "../../../utils/imageLink";

/**
 * Grid of attendee cards, with:
 * - selectable cards (for compare)
 * - "Read more" routes to /attendee/:id (or getReadMoreHref)
 */
export default function EventAttendeesGrid({
  heading = "Attendees",
  subheading = "",
  items = [],
  isLoading = false,
  errorText = "",
  isLoggedIn = false,
  onPreview,               // (item, index)
  getReadMoreHref,         // (item) => string
  anchorMap = {},          // kept in signature, not used/changed
  selectedIds = new Set(), // Set of selected ids
  onToggleSelect,          // (item) => void
  sentinelRef,             // for infinite scroll
}) {
  const navigate = useNavigate();
  const safe = Array.isArray(items) ? items : [];
  const hrefOf = (s) =>`/profile/${s?._id || s?.id || ""}`;
  const hrefOfMeet = (s) =>`/meeting/${s?._id || s?.id || ""}`;
  const hrefOfMess = (s) =>`/messages?member=${s?._id || s?.id || ""}`;

  if (isLoading) {
    return (
      <section className="esg">
        <div className="esg-head">
          <h3 className="esg-title">{heading}</h3>
          {subheading ? <p className="esg-sub">{subheading}</p> : null}
        </div>
        <div className="esg-grid">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="esg-card is-skeleton" />
          ))}
        </div>
      </section>
    );
  }

  if (errorText) {
    return (
      <section className="esg">
        <div className="esg-head">
          <h3 className="esg-title">{heading}</h3>
          {subheading ? <p className="esg-sub">{subheading}</p> : null}
        </div>
        <div className="esg-empty">{errorText}</div>
      </section>
    );
  }

  if (!safe.length) {
    return (
      <section className="esg">
        <div className="esg-head">
          <h3 className="esg-title">{heading}</h3>
          {subheading ? <p className="esg-sub">{subheading}</p> : null}
        </div>
        <div className="esg-empty">No attendees yet.</div>
      </section>
    );
  }

  return (
    <section className="esg">
      <div className="esg-head">
        <h3 className="esg-title">{heading}</h3>
        {subheading ? <p className="esg-sub">{subheading}</p> : null}
      </div>

      <div className="esg-grid">
        {safe.map((s, idx) => {
          const photo =
            s?.ProfilePic ||
            "https://images.unsplash.com/photo-1527980965255-d3b416303d12?q=80&w=600";
          const name = s?.fullName || "—";
          const org = s?.orgName || s?.organization || "";
          const title = s?.jobTitle || "";
          const role = s?.BusinessRole || s?.businessRole || "";
          const open = !!s?.openMeetings;
          const id = s?._id || s?.id || String(idx);
          const isSelected = selectedIds.has(id);

          return (
            <React.Fragment key={id}>
              <article className={`esg-card ${isSelected ? "is-selected" : ""}`}>
                {/* MEDIA with corner badge */}
                <button
                  type="button"
                  className="esg-media"
                  style={{ backgroundImage: `url(${imageLink(photo)})`,backgroundPosition:"top" }}
                  onClick={() => onPreview?.(s, idx)}
                  aria-label={`Preview ${name}`}
                >
                  {open ? (
  <span className="esg-open-badge" aria-hidden="true">
    <span className="esg-open-badge__txt">Open to meets</span>
  </span>
) : (
  <span className="esg-closed-ico" aria-label="Not open to meetings">
    <FiSlash />
  </span>
)}

                </button>

                {/* gradient overlay stays as-is */}
                <div className="esg-grad" />

                {/* select toggle stays as-is */}
                <button
                  type="button"
                  className={`esg-select ${isSelected ? "on" : ""}`}
                  onClick={() => onToggleSelect?.(s)}
                  aria-pressed={isSelected}
                  title={isSelected ? "Remove from compare" : "Add to compare"}
                >
                  <FiCheck />
                </button>

                {/* BODY */}
                <div className="esg-body">
                  <h4 className="esg-name">
                    <FiUser />
                    <span>{name}</span>
                  </h4>
                  <div className="esg-meta">
                    {title ? (
                      <span className="esg-pill">
                        <FiBriefcase />
                        {title}
                      </span>
                    ) : null}
                    {org ? <span className="esg-pill">{org}</span> : null}
                    {role ? <span className="esg-chip">{role}</span> : null}
                    {/* removed old "esg-open" meta chip per request */}
                  </div>

                  <div className="esg-actions">
                    <Link className="esg-btn esg-primary" to={hrefOf(s)}>
                      <FiExternalLink />
                      Read more
                    </Link>

                    {isLoggedIn ? (
                      <>
                        <button
                          type="button"
                          className="esg-btn"
                          onClick={() => navigate(hrefOfMeet(s))}
                        >
                          <FiUserPlus />
                          Book meeting
                        </button>
                        <button
                          type="button"
                          className="esg-btn"
                          onClick={() => navigate(hrefOfMess(s))}
                        >
                          <FiMessageSquare />
                          Message
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>
              </article>
            </React.Fragment>
          );
        })}

        {/* infinite scroll sentinel */}
        <div ref={sentinelRef} className="esg-sentinel" />
      </div>
    </section>
  );
}

EventAttendeesGrid.propTypes = {
  heading: PropTypes.string,
  subheading: PropTypes.string,
  items: PropTypes.array,
  isLoading: PropTypes.bool,
  errorText: PropTypes.string,
  isLoggedIn: PropTypes.bool,
  onPreview: PropTypes.func,
  getReadMoreHref: PropTypes.func,
  anchorMap: PropTypes.object,
  selectedIds: PropTypes.instanceOf(Set),
  onToggleSelect: PropTypes.func,
  sentinelRef: PropTypes.any,
};
