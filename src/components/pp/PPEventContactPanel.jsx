// src/components/pp/PPEventContactPanel.jsx
import React, { useMemo } from "react";
import PropTypes from "prop-types";
import {
  FiGlobe,
  FiLinkedin,
  FiMail,
  FiLink,
  FiMessageSquare,
  FiUserPlus,
  FiCalendar,
  FiMapPin,
  FiClock,
} from "react-icons/fi";
import "./pp-event-contact.css";

/**
 * Public Profile – Contact / CTA (READ-ONLY)
 * - Shows public links (website, LinkedIn, email, socials) ONLY if present
 * - Shows Event info (title • where • when) if provided
 * - Shows "Book meeting" / "Message" if open-to-meet (role-aware)
 *
 * Props:
 *  - role: string
 *  - actor: object
 *  - event?: { title, startDate, endDate, venueName, city, country }
 *  - onBook?: () => void           (optional; otherwise fallback to href route)
 *  - onMessage?: () => void        (optional; otherwise fallback to href route)
 *  - loginHref?: string
 */
export default function PPContactPanel({
  role = "",
  actor = {},
  event = null,
  onBook,
  onMessage,
  loginHref = "/login",
}) {
  const r = (role || "").toLowerCase();
  const actorId = actor?._id || actor?.id || "";

  // Role-aware links + open flag
  const links = useMemo(() => collectLinks(r, actor), [r, actor]);
  const openToMeet = useMemo(() => isOpenToMeet(r, actor), [r, actor]);

  // Event summary (safe)
  const eventInfo = useMemo(() => buildEventInfo(event), [event]);

  // If no handler provided, link falls back to route (or login if no id)
  const meetingHref = actorId ? `/meeting/${actorId}` : loginHref;
  const messageHref = actorId ? `/messages?member=${encodeURIComponent(actorId)}` : loginHref;

  const actionHref = (cb, fallback) => (typeof cb === "function" ? undefined : fallback);
  const onClickMaybe = (cb) => (e) => {
    if (typeof cb === "function") {
      e.preventDefault();
      cb();
    }
  };

  // Build link slots ONLY for existing values
  const visibleSlots = [
    links.website && {
      key: "website",
      icon: <FiGlobe />,
      value: prettyUrl(links.website),
      href: normalizeUrl(links.website),
    },
    links.linkedin && {
      key: "linkedin",
      icon: <FiLinkedin />,
      value: prettyUrl(links.linkedin),
      href: normalizeUrl(links.linkedin),
    },
    links.email && {
      key: "email",
      icon: <FiMail />,
      value: links.email,
      href: `mailto:${links.email}`,
    },
    ...(Array.isArray(links.socials)
      ? links.socials
          .filter(Boolean)
          .map((u, i) => ({
            key: `social-${i}`,
            icon: <FiLink />,
            value: prettyUrl(u),
            href: normalizeUrl(u),
          }))
      : []),
  ].filter(Boolean);

  return (
    <section className="ppc-card">
      <header className="ppc-head">
        <h3 className="ppc-title">Contact & Links</h3>
      </header>

      {/* Event strip */}
      <div className="ppc-event">
        <div className="ppc-eitem">
          <span className="ppc-eico"><FiCalendar /></span>
          <span className="ppc-etxt">{eventInfo.title}</span>
        </div>
        <div className="ppc-eitem">
          <span className="ppc-eico"><FiMapPin /></span>
          <span className="ppc-etxt">{eventInfo.where}</span>
        </div>
        <div className="ppc-eitem">
          <span className="ppc-eico"><FiClock /></span>
          <span className="ppc-etxt">{eventInfo.when}</span>
        </div>
      </div>

      {/* Links grid (only existing links) */}
      {visibleSlots.length ? (
        <div className="ppc-grid">
          {visibleSlots.map((slot) => (
            <a
              key={slot.key}
              className="ppc-link"
              href={slot.href}
              target="_blank"
              rel="noreferrer"
              title={slot.value}
            >
              <span className="ppc-ico">{slot.icon}</span>
              <span className="ppc-txt">{slot.value}</span>
            </a>
          ))}
        </div>
      ) : (
        <div className="ppc-empty">No public links provided.</div>
      )}

      {/* CTA row */}
      <div className="ppc-ctas">
        {openToMeet ? (
          <>
            <a
              className="ppc-btn ppc-primary"
              href={actionHref(onBook, meetingHref)}
              onClick={onClickMaybe(onBook)}
            >
              <FiUserPlus />
              Book meeting
            </a>
            <a
              className="ppc-btn"
              href={actionHref(onMessage, messageHref)}
              onClick={onClickMaybe(onMessage)}
            >
              <FiMessageSquare />
              Message
            </a>
          </>
        ) : (
          <span className="ppc-note">Not currently open to meetings</span>
        )}
      </div>
    </section>
  );
}

PPContactPanel.propTypes = {
  role: PropTypes.string,
  actor: PropTypes.object,
  event: PropTypes.object,
  onBook: PropTypes.func,
  onMessage: PropTypes.func,
  loginHref: PropTypes.string,
};

/* ------------------------- helpers -------------------------- */

function collectLinks(role, a) {
  // normalize from multiple possible fields across roles / data migrations
  const r = (role || "").toLowerCase();

  // new unified email (if your models were updated to top-level `email`)
  const unifiedEmail = a?.email || null;

  if (r === "speaker") {
    const p = a?.personal || {};
    const o = a?.organization || {};
    const e = a?.enrichments || {};
    return {
      website: o?.orgWebsite || o?.website || a?.links?.website || null,
      linkedin: p?.linkedIn || a?.links?.linkedin || null,
      email: unifiedEmail || p?.email || null,
      socials: Array.isArray(e?.socialLinks) ? e.socialLinks : [],
    };
  }

  if (r === "exhibitor") {
    const id = a?.identity || {};
    const v = a?.valueAdds || {};
    return {
      website: id?.orgWebsite || id?.website || a?.links?.website || null,
      linkedin: a?.links?.linkedin || null,
      email: unifiedEmail || id?.email || null,
      socials: v?.productBrochure ? [v.productBrochure] : (Array.isArray(a?.links?.socials) ? a.links.socials : []),
    };
  }

  // attendee (default)
  const p = a?.personal || {};
  const o = a?.organization || {};
  return {
    website: o?.orgWebsite || o?.website || a?.links?.website || null,
    linkedin: p?.linkedIn || a?.links?.linkedin || null,
    email: unifiedEmail || p?.email || null,
    socials: Array.isArray(a?.links?.socials) ? a.links.socials : [],
  };
}

function isOpenToMeet(role, a) {
  const r = (role || "").toLowerCase();
  if (r === "speaker") return !!a?.b2bIntent?.openMeetings;
  if (r === "exhibitor") return !!a?.commercial?.availableMeetings;
  return !!a?.matchingIntent?.openToMeetings;
}

function buildEventInfo(e) {
  const safe = e || {};
  const title = safe?.title || "—";
  const where =
    [safe?.venueName, safe?.city, safe?.country].filter(Boolean).join(", ") || "—";
  const s = safe?.startDate ? new Date(safe.startDate) : null;
  const nd = safe?.endDate ? new Date(safe.endDate) : null;

  const fmt = (d, opt) => new Intl.DateTimeFormat(undefined, opt).format(d);
  let when = "—";
  if (s && nd) {
    const sameMonth = s.getMonth() === nd.getMonth() && s.getFullYear() === nd.getFullYear();
    when = sameMonth
      ? `${fmt(s, { month: "short", day: "numeric" })} – ${fmt(nd, {
          day: "numeric",
          year: "numeric",
        })}`
      : `${fmt(s, { month: "short", day: "numeric", year: "numeric" })} – ${fmt(nd, {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}`;
  } else if (s) {
    when = fmt(s, { month: "short", day: "numeric", year: "numeric" });
  } else if (nd) {
    when = fmt(nd, { month: "short", day: "numeric", year: "numeric" });
  }
  return { title, where, when };
}

function normalizeUrl(u = "") {
  const t = String(u || "").trim();
  if (!t) return "";
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t}`;
}
function prettyUrl(u = "") {
  try {
    const x = new URL(normalizeUrl(u));
    return `${x.hostname}${x.pathname.replace(/\/$/, "")}`;
  } catch {
    return u;
  }
}
