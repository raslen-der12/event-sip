import React, { useEffect, useMemo, useRef } from "react";
import PropTypes from "prop-types";
import "./speakers.css";

/* tiny social icons */
const IcX = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 4l16 16M20 4L4 20" stroke="currentColor"/></svg>);
const IcIn = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor"/><circle cx="8" cy="9" r="1.5" stroke="currentColor"/><path d="M7 17v-5h2v5H7zm5 0v-3c0-2 3-2 3 0v3h-2v-3" stroke="currentColor"/></svg>);
const IcWeb = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" stroke="currentColor"/></svg>);

const colorOf = (v) =>
  v === "blue"  ? "var(--accent-blue)"  :
  v === "teal"  ? "var(--accent-teal)"  :
  v === "amber" ? "var(--accent-amber)" :
  v === "pink"  ? "var(--accent-pink)"  :
  "var(--brand-600)";

export default function SpeakerModal({ speaker, onClose }) {
  const accent = useMemo(() => colorOf(speaker.variant), [speaker.variant]);

  const modalRef = useRef(null);
  const closeRef = useRef(null);

  // ESC + focus trap
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
      if (e.key === "Tab") {
        const root = modalRef.current;
        if (!root) return;
        const focusables = root.querySelectorAll(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
        );
        const list = Array.from(focusables);
        if (!list.length) return;
        const first = list[0], last = list[list.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  const iconFor = (t) => (t === "in" ? <IcIn/> : t === "web" ? <IcWeb/> : <IcX/>);

  return (
    <div className="spk-modal" role="dialog" aria-modal="true" onClick={onClose}>
      <div
        className="spk-modal-quick"
        role="document"
        onClick={(e) => e.stopPropagation()}
        style={{ "--spk-accent": accent }}
        ref={modalRef}
      >
        {/* Close */}
        <button className="spkq-close" onClick={onClose} aria-label="Close" ref={closeRef}>✕</button>

        {/* HERO */}
        <header className="spkq-hero">
          <img className="spkq-hero-bg" src={speaker.photo} alt="" aria-hidden="true" />
          <div className="spkq-hero-overlay" />
          <div className="spkq-ident">
            <div className="spkq-avatar">
              {speaker.photo ? <img src={speaker.photo} alt={`${speaker.name} headshot`} /> : <div className="spk-ph" />}
              <span className="spkq-ring" aria-hidden="true" />
            </div>
            <div className="spkq-meta">
              <h3 className="spkq-name">{speaker.name}</h3>
              {(speaker.title || speaker.org) && (
                <div className="spkq-role">{speaker.title}{speaker.org ? ` · ${speaker.org}` : ""}</div>
              )}
              {speaker.tags?.length ? (
                <div className="spkq-tags">
                  {speaker.tags.slice(0, 4).map((t) => <span key={t} className="spkq-tag">{t}</span>)}
                </div>
              ) : null}
            </div>
          </div>
        </header>

        {/* BODY */}
        <div className="spkq-body">
          <div className="spkq-col">
            {speaker.bio ? <p className="spkq-bio">{speaker.bio}</p> : null}

            {speaker.socials?.length ? (
              <div className="spkq-socials">
                {speaker.socials.map((s, i) => (
                  <a key={i} href={s.url} className="spkq-soc" aria-label={s.type}>
                    {iconFor(s.type)}
                  </a>
                ))}
              </div>
            ) : null}
          </div>

          <div className="spkq-col">
            <div className="spkq-stats">
              <div className="spkq-stat">
                <div className="v">{speaker.sessions ?? 1}</div>
                <div className="l">{(speaker.sessions ?? 1) > 1 ? "sessions" : "session"}</div>
              </div>
              {typeof speaker.rating === "number" && (
                <div className="spkq-stat">
                  <div className="v">{speaker.rating.toFixed(1)}★</div>
                  <div className="l">avg rating</div>
                </div>
              )}
              {speaker.city && (
                <div className="spkq-stat">
                  <div className="v">{speaker.city}</div>
                  <div className="l">location</div>
                </div>
              )}
            </div>

            <div className="spkq-ctas">
              {speaker.href ? (
                <a className="btn btn-outline-dark rounded-pill px-3" href={speaker.href}>View profile</a>
              ) : null}
              <button type="button" className="btn-brand rounded-pill px-3">Request meeting</button>
              <button type="button" className="btn btn-outline-dark rounded-pill px-3">Add to schedule</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

SpeakerModal.propTypes = {
  speaker: PropTypes.shape({
    name: PropTypes.string.isRequired,
    title: PropTypes.string,
    org: PropTypes.string,
    photo: PropTypes.string,
    href: PropTypes.string,
    tags: PropTypes.arrayOf(PropTypes.string),
    socials: PropTypes.arrayOf(PropTypes.shape({ type: PropTypes.string, url: PropTypes.string })),
    sessions: PropTypes.number,
    rating: PropTypes.number,
    city: PropTypes.string,
    variant: PropTypes.oneOf(["purple","blue","teal","amber","pink"]),
    bio: PropTypes.string,
  }).isRequired,
  onClose: PropTypes.func,
};
