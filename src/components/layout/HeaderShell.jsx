// src/components/header/HeaderShell.jsx
import React, { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import useToggle from "../../lib/hooks/useToggle";
import useOnClickOutside from "../../lib/hooks/useOnClickOutside";
import useScrollElevate from "../../lib/hooks/useScrollElevate";
import "./header.css";
import useAuth from "../../lib/hooks/useAuth";
import AvatarMenu from "../user/AvatarMenu";
import imageLink from "../../utils/imageLink";
import { useTranslation } from "react-i18next";
/* notifications hooks (existing in your app) */
import {
  useListActorNotificationsQuery,
  useAckActorNotificationMutation,
} from "../../features/Actor/toolsApiSlice";
/* social icons */
const SocialIcon = {
  fb: () => (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path
        fill="currentColor"
        d="M22 12.06C22 6.48 17.52 2 11.94 2S2 6.48 2 12.06C2 17.06 5.66 21.2 10.44 22v-7.03H7.9v-2.9h2.54V9.41c0-2.5 1.49-3.88 3.77-3.88 1.09 0 2.22.2 2.22.2v2.44h-1.25c-1.23 0-1.61.76-1.61 1.55v1.86h2.73l-.44 2.9h-2.29V22C18.34 21.2 22 17.06 22 12.06z"
      />
    </svg>
  ),
  ig: () => (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 2c-1.51 0-1.96 0-3.16.05-1.21.05-2.1.24-2.85.54a5 5 0 0 0-2.06 1.36A5 5 0 0 0 2.53 6.1c-.3.75-.49 1.64-.54 2.85C1.94 10.15 1.94 10.6 1.94 12c0 1.4 0 1.85.05 3.05.05 1.21.24 2.1.54 2.85.3.76.7 1.42 1.36 2.06.64.64 1.3 1.04 2.06 1.34.75.3 1.64.49 2.85.54 1.2.05 1.65.05 3.16.05s1.96 0 3.16-.05c1.21-.05 2.1-.24 2.85-.54a5 5 0 0 0 2.06-1.36 5 5 0 0 0 1.34-2.06c.3-.75.49-1.64.54-2.85.05-1.2.05-1.65.05-3.16 0-1.5 0-1.95-.05-3.16-.05-1.21-.24-2.1-.54-2.85a5 5 0 0 0-1.36-2.06A5 5 0 0 0 19 3.14c-.75-.3-1.64-.49-2.85-.54C14.96 2 14.51 2 13 2H12zM12 7.2A4.8 4.8 0 1 1 12 16.8 4.8 4.8 0 0 1 12 7.2zm6.8-1.3a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4z"
      />
    </svg>
  ),
  tw: () => (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path
        fill="currentColor"
        d="M20.98 7.16c.01.16.01.33.01.5 0 5.12-3.9 11.03-11.03 11.03-2.19 0-4.23-.64-5.94-1.76.3.03.6.05.9.05 1.82 0 3.5-.62 4.83-1.66a3.88 3.88 0 0 1-3.62-2.69c.24.05.49.07.74.07.36 0 .72-.05 1.06-.14a3.88 3.88 0 0 1-3.11-3.8v-.05c.52.29 1.12.47 1.76.49a3.88 3.88 0 0 1-1.73-3.23c0-.71.19-1.38.53-1.96a11 11 0 0 0 7.98 4.05 3.88 3.88 0 0 1 6.61-3.54 7.77 7.77 0 0 0 2.46-.94 3.9 3.9 0 0 1-1.7 2.14 7.75 7.75 0 0 0 2.23-.61 8.34 8.34 0 0 1-1.94 2.01z"
      />
    </svg>
  ),
  yt: () => (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path
        fill="currentColor"
        d="M23.5 7.5s-.23-1.63-.95-2.35c-.91-.95-1.93-.95-2.4-1C16.95 4 12 4 12 4s-4.95 0-8.15.15c-.47.05-1.49.05-2.4 1C.73 5.87.5 7.5.5 7.5S.35 9.34.35 11.19v1.62c0 1.85.15 3.69.15 3.69s.23 1.63.95 2.35c.91.95 2.11.92 2.64 1.02C6.1 20.03 12 20.1 12 20.1s4.95-.01 8.15-.16c.47-.05 1.49-.05 2.4-1 .72-.72.95-2.35.95-2.35s.15-1.84.15-3.69v-1.62c0-1.85-.15-3.69-.15-3.69zM9.75 14.5V8.5l5.5 3-5.5 3z"
      />
    </svg>
  ),
  in: () => (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path
        fill="currentColor"
        d="M4.98 3.5a2.25 2.25 0 1 1 0 4.5 2.25 2.25 0 0 1 0-4.5zM3.5 9h3v11h-3V9zm6 0h2.87v1.5h.04c.4-.76 1.36-1.56 2.8-1.56 2.99 0 3.55 1.97 3.55 4.53V20H16.8v-5.04c0-1.2-.02-2.75-1.68-2.75-1.69 0-1.95 1.32-1.95 2.67V20H9.5V9z"
      />
    </svg>
  ),
};

const SOCIAL_LABEL = {
  fb: "Facebook",
  ig: "Instagram",
  tw: "Twitter/X",
  yt: "YouTube",
  in: "LinkedIn",
};

/* Normalize socials: expect [{ fb:'...', ig:'...', tw:'...', yt:'...' }] */
function getSocialsObject(top) {
  const first = Array.isArray(top?.socials) ? top.socials[0] : null;
  return first && typeof first === "object" ? first : {};
}
function ensureHttp(url) {
  if (!url) return "";
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

/* icons */
const Icon = {
  phone: () => (
    <svg className="icon" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 5c0 8 7 15 15 15l2-3-4-3-2 2a12 12 0 0 1-6-6l2-2-3-4L4 5z"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  ),
  mail: () => (
    <svg className="icon" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="6" width="18" height="12" rx="2" stroke="currentColor" />
      <path d="M3 7l9 6 9-6" stroke="currentColor" />
    </svg>
  ),
  clock: () => (
    <svg className="icon" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" />
      <path d="M12 7v6l4 2" stroke="currentColor" />
    </svg>
  ),
  burger: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M3 6h18M3 12h18M3 18h18" stroke="#fff" strokeWidth="2" />
    </svg>
  ),
  close: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="M6 6l12 12M18 6L6 18"
        stroke="#fff"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  ),
  bell: () => (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path
        d="M12 3a6 6 0 00-6 6v2.586l-1.707 1.707A1 1 0 005 15h14a1 1 0 00.707-1.707L18 11.586V9a6 6 0 00-6-6z"
        fill="currentColor"
      />
      <path d="M9 18a3 3 0 006 0" fill="currentColor" />
    </svg>
  ),
  b2b: () => (
    <svg viewBox="0 0 64 64" width="22" height="22" aria-hidden="true">
      <rect
        x="3"
        y="3"
        width="58"
        height="58"
        rx="14"
        ry="14"
        fill="none"
        strokeWidth="5"
      />
      <text
        x="50%"
        y="50%"
        fontFamily="Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif"
        fontWeight="800"
        fontSize="28"
        textAnchor="middle"
        dominantBaseline="central"
        fill="currentColor"
        letterSpacing="-1"
      >
        B2B
      </text>
    </svg>
  ),
};

/* ── Disable rules (robust) ───────────────────────── */
const norm = (s) =>
  String(s || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
const LABEL_ALIASES = { communitites: "communities" }; // guard common typo
const DISABLED_LABELS = new Set([
  "marketplace",
  "communities",
  "load calculator: mena & africa",
  "container shipping costs: informations",
]);
const keyOf = (label) => LABEL_ALIASES[norm(label)] || norm(label);
const isDisabledLabel = (label) => DISABLED_LABELS.has(keyOf(label));

/* ── Notifications bell ───────────────────────────── */
function NotificationBell({ actorId }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  useOnClickOutside(wrapRef, () => setOpen(false));

  const { data, isFetching } = useListActorNotificationsQuery(
    actorId ? { actorId, limit: 3 } : { skip: true },
    { skip: !actorId }
  );
  const [ack] = useAckActorNotificationMutation();

  const list = Array.isArray(data?.data)
    ? data.data
    : Array.isArray(data?.notifications)
    ? data.notifications
    : Array.isArray(data)
    ? data
    : [];

  const recent = list.slice(0, 3);
  const unreadCount = recent.filter((n) => !n.read).length;

  const handleClickItem = async (n) => {
    try {
      if (!n.read) await ack(n._id).unwrap();
    } catch {}
    if (n.link) window.location.href = n.link;
    setOpen(false);
  };

  return (
    <div className="notif-wrap" ref={wrapRef}>
      <button
        type="button"
        className="icon-btn notif-btn"
        aria-haspopup="menu"
        aria-expanded={open ? "true" : "false"}
        onClick={() => setOpen((v) => !v)}
        title="Notifications"
      >
        <Icon.bell />
        {unreadCount > 0 && (
          <span className="notif-dot" aria-label={`${unreadCount} unread`} />
        )}
      </button>

      <div
        className={`notif-dd ${open ? "open" : ""}`}
        role="menu"
        aria-label="Notifications"
      >
        <div className="notif-head">
          <span>Notifications</span>
          {isFetching && <span className="muted">…</span>}
        </div>

        {recent.length === 0 ? (
          <div className="notif-empty">No notifications</div>
        ) : (
          <ul className="notif-list">
            {recent.map((n) => (
              <li
                key={n._id}
                className={`notif-item ${n.read ? "is-read" : "is-unread"}`}
              >
                <button
                  type="button"
                  className="notif-link"
                  onClick={() => handleClickItem(n)}
                  title={n.title}
                >
                  <div className="notif-title">{n.title}</div>
                  {n.body ? <div className="notif-body">{n.body}</div> : null}
                  {n.createdAt ? (
                    <div className="notif-time" aria-hidden="true">
                      {new Date(n.createdAt).toLocaleString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
NotificationBell.propTypes = { actorId: PropTypes.string };

/* ── Main header ─────────────────────────────────── */
export default function HeaderShell({ top, nav, cta }) {
  const { i18n } = useTranslation();
  const curLang = (i18n.resolvedLanguage || i18n.language || "en").slice(0, 2);
  const setLang = (lng) => {
    i18n.changeLanguage(lng);
    try {
      localStorage.setItem("i18nextLng", lng);
    } catch {}
    document.documentElement.lang = lng;
  };
  useEffect(() => {
    document.documentElement.lang = curLang;
  }, [curLang]);
  const { status, ActorId } = useAuth();
  const isAuthed = status !== "Guest" && !!ActorId;

  const elevated = useScrollElevate(8);
  const [openDD, setOpenDD] = useState(null); // desktop dropdown index

  /* mobile drawer */
  const drawer = useToggle(false);
  const drawerRef = useRef(null);

  // lock body scroll when drawer open
  useEffect(() => {
    document.body.style.overflow = drawer.open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawer.open]);

  // Focus trap inside drawer
  useEffect(() => {
    if (!drawer.open || !drawerRef.current) return;
    const root = drawerRef.current;
    const selectors =
      'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const nodes = Array.from(root.querySelectorAll(selectors)).filter(
      (el) => !el.hasAttribute("disabled")
    );
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    first?.focus();

    const onKey = (e) => {
      if (e.key === "Tab" && nodes.length) {
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
      if (e.key === "Escape") drawer.close();
    };
    root.addEventListener("keydown", onKey);
    return () => root.removeEventListener("keydown", onKey);
  }, [drawer.open]);

  /* dropdown outside click (desktop) */
  const ddRef = useRef(null);
  useOnClickOutside(ddRef, () => setOpenDD(null));

  /* search overlay */
  const search = useToggle(false);

  // Close all on ESC (desktop global)
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        setOpenDD(null);
        drawer.close();
        search.close();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* MOBILE: accordion state per item label */
  const [openAcc, setOpenAcc] = useState({});
  const toggleAcc = (label) =>
    setOpenAcc((s) => ({ ...s, [label]: !s[label] }));

  // Click-only dropdowns (no hover)
  const onTopClick = (e, idx, item, disabledTop) => {
    if (disabledTop) {
      e.preventDefault();
      return;
    }
    if (item.children?.length) {
      e.preventDefault();
      setOpenDD(openDD === idx ? null : idx);
    }
  };

  return (
    <div className="header">
      {/* TOPBAR */}
      <div className="topbar">
        <div className="container">
          <div className="row">
            <div className="left">
              <span className="item">
                <Icon.mail />
                {top?.phone}
              </span>
              
              <span className="item d-none d-md-flex">
                <Icon.clock />
                {top?.hours}
              </span>
            </div>
            <div className="top-actions">
              {/* tiny language select */}
              <label className="lang-wrap" aria-label="Language">
                <select
                  className="lang-select"
                  value={curLang}
                  onChange={(e) => setLang(e.target.value)}
                >
                  <option value="en">EN</option>
                  <option value="fr">FR</option>
                </select>
              </label>
              <div
                className="social"
                role="navigation"
                aria-label="Social links"
              >
                {["fb", "ig", "tw", "yt", "in"].map((key) => {
                  const map = getSocialsObject(top);
                  const href = ensureHttp(map[key]);
                  if (!href) return null;
                  const IconEl = SocialIcon[key];
                  const label = SOCIAL_LABEL[key];

                  return (
                    <a
                      key={key}
                      className="social-link"
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      title={label}
                    >
                      <IconEl />
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* NAVBAR */}
      <div className={`nav ${elevated ? "elevated" : ""}`}>
        <div
          className="container"
          style={{
            height: "72px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* brand */}
          <a className="brand" href="/">
            <img
              width={190}
              src="https://gits.seketak-eg.com/wp-content/uploads/2025/10/Asset-1logo-eventra-.png"
              alt="Brand"
            />
          </a>

          {/* desktop links (click to open) */}
          <div className="menu">
            {nav.map((item, idx) => {
              const disabledTop = isDisabledLabel(item.label);
              const ddClass =
                item.label === "Logistics Solutions"
                  ? "dd--wide"
                  : item.label === "Events"
                  ? "dd--fit"
                  : "";
              const hasChildren = !!item.children?.length;

              return (
                <div
                  key={item.label}
                  className={`dd ${openDD === idx ? "open" : ""} ${ddClass}`}
                  ref={openDD === idx ? ddRef : null}
                >
                  {hasChildren ? (
                    <button
                      type="button"
                      className={`link ${disabledTop ? "is-disabled" : ""}`}
                      aria-expanded={openDD === idx ? "true" : "false"}
                      aria-controls={`dd-${idx}`}
                      disabled={disabledTop}
                      onClick={(e) => onTopClick(e, idx, item, disabledTop)}
                      title={disabledTop ? "Coming soon" : undefined}
                    >
                      {item.label} ▾
                    </button>
                  ) : disabledTop ? (
                    <span
                      className="link is-disabled"
                      style={{ opacity: 0.5, cursor: "not-allowed" }}
                      aria-disabled="true"
                      title="Coming soon"
                    >
                      {item.label}
                    </span>
                  ) : (
                    <a
                      href={item.href || "#"}
                      className="link"
                      onClick={(e) => onTopClick(e, idx, item, disabledTop)}
                    >
                      {item.label}
                    </a>
                  )}

                  {hasChildren && (
                    <div id={`dd-${idx}`} className="dd-menu">
                      {item.children.map((s) => {
                        const childDisabled = isDisabledLabel(s.label);
                        return childDisabled ? (
                          <span
                            key={`${item.label}-${s.label}`}
                            style={{
                              opacity: 0.5,
                              cursor: "not-allowed",
                              padding: "10px 12px",
                              display: "inline-flex",
                              borderRadius: 10,
                            }}
                            aria-disabled="true"
                            title="Coming soon"
                          >
                            {s.label}
                          </span>
                        ) : (
                          <a key={s.href || s.label} href={s.href}>
                            {s.label}
                          </a>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* right: Avatar + Notifications + burger */}
          <div
            className="right"
            style={{ display: "flex", alignItems: "center", gap: 12 }}
          >
            {/* B2B icon (programmatic nav, tooltip desktop-only) */}
            <button
              type="button"
              className="icon-btn b2b-btn d-none d-lg-inline-flex"
              aria-label="see attendees"
              onClick={() => {
                window.location.href = "/attendees/open-to-meet";
              }}
            >
              <Icon.b2b />
              <span className="tt">Open-to-Meet</span>
            </button>

            {isAuthed && <NotificationBell actorId={ActorId} />}
            {isAuthed ? (
              <AvatarMenu />
            ) : cta ? (
              <a className="btn-brand cta" href={cta.href}>
                {cta.label || "log in"}
              </a>
            ) : null}
            <button
              className="icon-btn burger d-lg-none"
              onClick={drawer.openFn}
              aria-label="Menu"
            >
              <Icon.burger />
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE DRAWER OVERLAY */}
      <div
        className={`drawer-overlay ${drawer.open ? "open" : ""}`}
        onClick={drawer.close}
        aria-hidden={drawer.open ? "false" : "true"}
      />

      {/* MOBILE DRAWER */}
      <aside
        ref={drawerRef}
        className={`drawer ${drawer.open ? "open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="mobileMenuTitle"
      >
        <div className="section drawer-header">
          <a className="brand" href="/">
            <img
              width={130}
              src={imageLink("default/LOGO GITS COLOR.png")}
              alt="Brand"
            />
          </a>
          <button
            className="icon-btn drawer-close"
            onClick={drawer.close}
            aria-label="Close menu"
          >
            <Icon.close />
          </button>
        </div>

        <div
          className="section list"
          role="menu"
          aria-labelledby="mobileMenuTitle"
        >
          <h2 id="mobileMenuTitle" className="sr-only">
            Main Menu
          </h2>

          {nav.map((item) => {
            const disabledTop = isDisabledLabel(item.label);
            const hasChildren = !!item.children?.length;
            const open = !!openAcc[item.label];

            return (
              <div key={item.label} className="m-item">
                {hasChildren ? (
                  <button
                    type="button"
                    className={`m-toggle ${disabledTop ? "is-disabled" : ""}`}
                    aria-expanded={open}
                    aria-controls={`sub-${item.label}`}
                    disabled={disabledTop}
                    onClick={() => toggleAcc(item.label)}
                    title={disabledTop ? "Coming soon" : undefined}
                  >
                    <span>{item.label}</span>
                    <span className={`chev ${open ? "open" : ""}`}>▾</span>
                  </button>
                ) : disabledTop ? (
                  <span
                    className="m-link is-disabled"
                    aria-disabled="true"
                    title="Coming soon"
                  >
                    {item.label}
                  </span>
                ) : (
                  <a
                    className="m-link"
                    href={item.href || "#"}
                    onClick={drawer.close}
                  >
                    {item.label}
                  </a>
                )}

                {hasChildren && (
                  <div
                    id={`sub-${item.label}`}
                    className={`m-sub ${open ? "open" : ""}`}
                    role="region"
                    aria-hidden={open ? "false" : "true"}
                  >
                    {item.children.map((s) => {
                      const childDisabled = isDisabledLabel(s.label);
                      return childDisabled ? (
                        <span
                          key={`${item.label}-${s.label}`}
                          className="m-sublink is-disabled"
                          aria-disabled="true"
                          title="Coming soon"
                        >
                          {s.label}
                        </span>
                      ) : (
                        <a
                          key={s.href || s.label}
                          href={s.href}
                          className="m-sublink"
                          onClick={drawer.close}
                        >
                          {s.label}
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="section actions">
          <button
            className="btn-brand alt"
            onClick={() => {
              window.location.href = "/attendees/open-to-meet";
              drawer.close();
            }}
          >
            Open-to-Meet
          </button>
          {cta?.href && (
            <a className="btn-brand cta" href={cta.href} onClick={drawer.close}>
              {cta.label || "Buy Ticket"}
            </a>
          )}
        </div>
      </aside>

      {/* SEARCH OVERLAY */}
      <div
        className={`search-overlay ${search.open ? "open" : ""}`}
        onClick={search.close}
      >
        <div className="search-card" onClick={(e) => e.stopPropagation()}>
          <div className="search-row">
            <input
              type="text"
              placeholder="Search events, speakers, or cities…"
              autoFocus
            />
            <button className="btn-brand" onClick={search.close}>
              Search
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

HeaderShell.propTypes = {
  top: PropTypes.shape({
    phone: PropTypes.string,
    email: PropTypes.string,
    hours: PropTypes.string,
    socials: PropTypes.arrayOf(PropTypes.string),
  }).isRequired,
  nav: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      href: PropTypes.string,
      children: PropTypes.arrayOf(
        PropTypes.shape({ label: PropTypes.string, href: PropTypes.string })
      ),
    })
  ).isRequired,
  cta: PropTypes.shape({ href: PropTypes.string, label: PropTypes.string }),
};
