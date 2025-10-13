import React from "react";
import PropTypes from "prop-types";
import { Link, useLocation } from "react-router-dom";
import {
  FiUser,
  FiBriefcase,
  FiExternalLink,
  FiMessageSquare,
  FiUserPlus,
  FiCheckCircle,
} from "react-icons/fi";
import "./event-speakers.css";
import imageLink from "../../../utils/imageLink";

/**
 * Square photo cards:
 * - Name + Job title: always visible over the image (bottom-left).
 * - Org / Role badges: appear on hover/focus (softer on touch).
 * - Open-to-meet: brand-2 triangle in the bottom-right (hover/focus on desktop; soft-visible on touch).
 * - Compare toggle: round confirm badge (top-right).
 * - Message: floating round button inside photo (only if logged in).
 * - Footer: Read more (always), Book meeting (if logged in & open).
 */
export default function EventSpeakersGrid({
  heading = "Speakers",
  subheading = "",
  items = [],
  isLoading = false,
  errorText = "",
  isLoggedIn = false,
  onPreview,               // (item, index)
  getReadMoreHref,         // (item) => string
  selectedIds = new Set(), // Set of selected ids
  onToggleSelect,          // (item) => void
  sentinelRef,
  onBook,           // for infinite scroll
}) {
  const safe = Array.isArray(items) ? items : [];
  const hrefOf = (s) =>
    (typeof getReadMoreHref === "function" && getReadMoreHref(s)) ||
    `/speaker/${s?._id || s?.id || ""}`;

  const { pathname, search } = useLocation();
  const loginHref = `/login?from=${encodeURIComponent(pathname + search)}`;

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
        <div className="esg-empty">No speakers yet.</div>
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
            s?.profilePic ||
            "https://images.unsplash.com/photo-1527980965255-d3b416303d12?q=80&w=600";
          const name = s?.fullName || "—";
          const org = s?.orgName || s?.organization || "";
          const title = s?.jobTitle || "";
          const role = s?.BusinessRole || s?.businessRole || "";
          const open = !!s?.openMeetings;
          const id = s?._id || s?.id || String(idx);
          const isSelected = selectedIds.has(id);

          return (
            <article key={id} className={`esg-card ${isSelected ? "is-selected" : ""}`}>
              {/* MEDIA (square) */}
              <button
                type="button"
                className="esg-media esg-square"
                style={{ backgroundImage: `url(${imageLink(photo)})` }}
                onClick={() => onPreview?.(s, idx)}
                aria-label={`Preview ${name}`}
              >
                {/* gradient overlay below all ui */}
                <span className="esg-overlay" aria-hidden="true" />

                {/* name + title always visible */}
                <span className="esg-namebar">
                  <span className="esg-name-strong">
                    <FiUser />
                    <span className="truncate">{name}</span>
                  </span>
                  {title ? (
                    <span className="esg-name-sub">
                      <FiBriefcase />
                      <span className="truncate">{title}</span>
                    </span>
                  ) : null}
                </span>

                {/* corner triangle if open */}
                {open ? (
                  <span className="esg-open-tri" aria-hidden="true">
                    <span className="esg-open-tri-text">Open to meet</span>
                  </span>
                ) : null}

                {/* hover/focus badges (org / role) */}
                <span className="esg-badges">
                  {org ? <span className="esg-badge">{org}</span> : null}
                  {role ? <span className="esg-badge esg-badge-ghost">{role}</span> : null}
                </span>

                {/* compare toggle as round confirm badge */}
                <button
                  type="button"
                  className={`esg-compare ${isSelected ? "on" : ""}`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onToggleSelect?.(s);
                  }}
                  aria-pressed={isSelected}
                  title={isSelected ? "Confirmed for compare" : "Confirm for compare"}
                >
                  <FiCheckCircle />
                </button>

                {/* message floating button (only if logged in) */}
                {isLoggedIn ? (
                  <button
                    type="button"
                    className="esg-msg"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      alert("Message: TODO");
                    }}
                    title="Message"
                    aria-label={`Message ${name}`}
                  >
                    <FiMessageSquare />
                  </button>
                ) : null}
              </button>

              {/* FOOTER: Read more (always) + Book meeting (if logged in and open) */}
              <div className="esg-footer">
                <Link
                  className="esg-btn esg-primary"
                  to={isLoggedIn ? hrefOf(s) : loginHref}
                >
                  <FiExternalLink />
                  Read more
                </Link>

                <div className="esg-foot-right">
                  {isLoggedIn && open ? (
                    <button
                      type="button"
                      className="esg-btn esg-btn-strong"
                      onClick={onBook}
                      title="Book a meeting"
                    >
                      <FiUserPlus />
                      Book meeting
                    </button>
                  ) : null}
                </div>
              </div>
            </article>
          );
        })}

        {/* infinite scroll sentinel */}
        <div ref={sentinelRef} className="esg-sentinel" />
      </div>
    </section>
  );
}

EventSpeakersGrid.propTypes = {
  heading: PropTypes.string,
  subheading: PropTypes.string,
  items: PropTypes.array,
  isLoading: PropTypes.bool,
  errorText: PropTypes.string,
  isLoggedIn: PropTypes.bool,
  onPreview: PropTypes.func,
  getReadMoreHref: PropTypes.func,
  selectedIds: PropTypes.instanceOf(Set),
  onToggleSelect: PropTypes.func,
  sentinelRef: PropTypes.any,
};
