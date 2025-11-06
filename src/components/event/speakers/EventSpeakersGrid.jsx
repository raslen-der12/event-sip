// EventSpeakersGrid.jsx (aggressive tooltip removal)
import React, { useEffect, useRef } from "react";
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

export default function EventSpeakersGrid(props) {
  const {
    heading = "Speakers",
    subheading = "",
    items = [],
    isLoading = false,
    errorText = "",
    isLoggedIn = false,
    onPreview,
    getReadMoreHref,
    selectedIds = new Set(),
    onToggleSelect,
    sentinelRef,
    onBook,
  } = props;

  const safe = Array.isArray(items) ? items : [];
  const rootRef = useRef(null);
  const { pathname, search } = useLocation();
  const loginHref = `/login?from=${encodeURIComponent(pathname + search)}`;

  const hrefOf = (s) =>
    (typeof getReadMoreHref === "function" && getReadMoreHref(s)) ||
    `/speaker/${s?._id || s?.id || ""}`;

  useEffect(() => {
    // Helpers
    const removeTitleAttr = (el) => {
      try {
        if (!el) return;
        if (el.hasAttribute && el.hasAttribute("title"))
          el.removeAttribute("title");
      } catch (e) {
        /* ignore cross-origin */
      }
    };
    const removeSvgTitleNodes = (root) => {
      try {
        const svgTitles = (root || document).querySelectorAll("svg > title");
        svgTitles.forEach((t) => t.remove());
      } catch (e) {}
    };
    const stripOnNodeAndChildren = (node) => {
      try {
        if (!node) return;
        if (node.querySelectorAll) {
          node.querySelectorAll("[title]").forEach((el) => removeTitleAttr(el));
          removeSvgTitleNodes(node);
        } else {
          removeTitleAttr(node);
        }
      } catch (e) {}
    };

    // 1) Remove titles immediately in the whole document (aggressive)
    stripOnNodeAndChildren(document);

    // 2) Also remove titles in the grid root (redundant but focused)
    stripOnNodeAndChildren(rootRef.current);

    // 3) MutationObserver on the whole document body to remove any future title attributes or added <svg><title>
    const mo = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === "attributes" && m.attributeName === "title") {
          removeTitleAttr(m.target);
        }
        if (m.addedNodes?.length) {
          m.addedNodes.forEach((n) => {
            if (n.nodeType === 1) stripOnNodeAndChildren(n);
          });
        }
      }
    });

    try {
      mo.observe(document.body, {
        attributes: true,
        attributeFilter: ["title"],
        childList: true,
        subtree: true,
      });
    } catch (e) {
      // ignoring possible CSP / cross-origin issues
    }

    // 4) mouseover listener: remove title from hovered target and its ancestors (extra defense)
    const onMouseOver = (ev) => {
      let node = ev.target;
      let depth = 0;
      while (node && depth < 8) {
        removeTitleAttr(node);
        node = node.parentElement;
        depth += 1;
      }
      // remove any svg title child on the target
      try {
        if (ev.target && ev.target.querySelectorAll) {
          ev.target.querySelectorAll("svg > title").forEach((t) => t.remove());
        }
      } catch (e) {}
    };
    document.addEventListener("mouseover", onMouseOver, {
      capture: true,
      passive: true,
    });

    // cleanup
    return () => {
      try {
        mo.disconnect();
      } catch (e) {}
      document.removeEventListener("mouseover", onMouseOver, { capture: true });
    };
  }, []);
  useEffect(() => {
    const root =
      rootRef.current || document.querySelector(".esg") || document.body;
    function removeEsqPillNodes(node) {
      try {
        if (!node) return;
        node.querySelectorAll &&
          node.querySelectorAll(".esq-pill").forEach((n) => n.remove());
        node.querySelectorAll &&
          node.querySelectorAll("*").forEach((el) => {
            if (el.textContent && el.textContent.trim() === "Unknown")
              el.remove();
          });
      } catch (e) {}
    }
    removeEsqPillNodes(root);
    const mo = new MutationObserver((muts) => {
      muts.forEach((m) => {
        if (m.addedNodes?.length)
          Array.from(m.addedNodes).forEach((n) => removeEsqPillNodes(n));
      });
    });
    mo.observe(root, { childList: true, subtree: true });
    const onHover = (e) => removeEsqPillNodes(e.target);
    root.addEventListener("mouseover", onHover, {
      capture: true,
      passive: true,
    });
    return () => {
      try {
        mo.disconnect();
      } catch (e) {}
      root.removeEventListener("mouseover", onHover, { capture: true });
    };
  }, []);

  // Render fallback states
  if (isLoading) {
    return (
      <section className="esg" aria-label="Speakers grid" ref={rootRef}>
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
      <section className="esg" aria-label="Speakers grid" ref={rootRef}>
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
      <section className="esg" aria-label="Speakers grid" ref={rootRef}>
        <div className="esg-head">
          <h3 className="esg-title">{heading}</h3>
          {subheading ? <p className="esg-sub">{subheading}</p> : null}
        </div>
        <div className="esg-empty">No speakers yet.</div>
      </section>
    );
  }

  // Main render
  return (
    <section className="esg" aria-label="Speakers grid" ref={rootRef}>
      <div className="esg-head">
        <h3 className="esg-title">{heading}</h3>
        {subheading ? <p className="esg-sub">{subheading}</p> : null}
      </div>

      <div className="esg-grid" role="list">
        {safe.map((s, idx) => {
          const photo =
            s?.profilePic ||
            "https://images.unsplash.com/photo-1527980965255-d3b416303d12?q=80&w=600";
          const name = s?.fullName || "Speaker";
          const org = s?.orgName || s?.organization || "";
          const title = s?.jobTitle || "";
          const role = s?.BusinessRole || s?.businessRole || "";
          const open = !!s?.openMeetings;
          const id = s?._id || s?.id || String(idx);
          const isSelected = selectedIds.has(id);

          return (
            <article
              key={id}
              className={`esg-card ${isSelected ? "is-selected" : ""}`}
              aria-labelledby={`speaker-${id}-name`}
              role="listitem"
            >
              <div
                role="button"
                tabIndex={0}
                className="esg-media esg-square"
                style={{ backgroundImage: `url(${imageLink(photo)})` }}
                onClick={() => onPreview?.(s, idx)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onPreview?.(s, idx);
                  }
                }}
                aria-label={`Preview ${name}`}
              >
                <span className="esg-overlay" aria-hidden="true" />

                <span className="esg-namebar">
                  <span className="esg-name-strong" id={`speaker-${id}-name`}>
                    <FiUser aria-hidden="true" focusable="false" />
                    <span className="truncate">{name}</span>
                  </span>

                  {title ? (
                    <span className="esg-name-sub">
                      <FiBriefcase aria-hidden="true" focusable="false" />
                      <span className="truncate">{title}</span>
                    </span>
                  ) : null}
                </span>

                {open ? (
                  <span className="esg-open-tri" aria-hidden="true">
                    <span className="esg-open-tri-text">Open to meet</span>
                  </span>
                ) : null}

                <span className="esg-badges" aria-hidden="true">
                  {org ? <span className="esg-badge">{org}</span> : null}
                  {role ? (
                    <span className="esg-badge esg-badge-ghost">{role}</span>
                  ) : null}
                </span>

                <button
                  type="button"
                  className={`esg-compare ${isSelected ? "on" : ""}`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onToggleSelect?.(s);
                  }}
                  aria-pressed={isSelected}
                  aria-label={
                    isSelected ? "Confirmed for compare" : "Confirm for compare"
                  }
                >
                  <FiCheckCircle aria-hidden="true" focusable="false" />
                </button>

                {isLoggedIn ? (
                  <button
                    type="button"
                    className="esg-msg"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      alert("Message: TODO");
                    }}
                    aria-label={`Message ${name}`}
                  >
                    <FiMessageSquare aria-hidden="true" focusable="false" />
                  </button>
                ) : null}
              </div>

              <div className="esg-footer">
                <Link
                  className="esg-btn esg-primary"
                  to={isLoggedIn ? hrefOf(s) : loginHref}
                  aria-label={`Read more about ${name}`}
                >
                  <FiExternalLink aria-hidden="true" focusable="false" />
                  Read more
                </Link>

                <div className="esg-foot-right">
                  {isLoggedIn && open ? (
                    <button
                      type="button"
                      className="esg-btn esg-btn-strong"
                      onClick={onBook}
                      aria-label={`Book a meeting with ${name}`}
                    >
                      <FiUserPlus aria-hidden="true" focusable="false" />
                      Book meeting
                    </button>
                  ) : null}
                </div>
              </div>
            </article>
          );
        })}

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
