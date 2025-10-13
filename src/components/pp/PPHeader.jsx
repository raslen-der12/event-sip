import React, { useMemo, useState } from "react";
import PropTypes from "prop-types";
import { FiMapPin, FiUserPlus, FiMessageSquare, FiShare2, FiX } from "react-icons/fi";
import ReactCountryFlag from "react-country-flag";
import "./pp-header.css";
import imageLink from "../../utils/imageLink";
import useAuth from "../../lib/hooks/useAuth";

/**
 * Public Profile Header (READ-ONLY)
 * - Real chips only (no placeholders)
 * - Country as flag
 * - Description (collapsible)
 * - Working CTAs:
 *    • Book:   /meeting/:actorId
 *    • Message /messages?member=:actorId
 *    • BP (if exists) /businessProfile/:bpId  (reads actor.bp.primary.id)
 */
export default function PPHeader({
  role = "",
  actor = {},
  loginHref = "/login",
}) {
  const r = (role || "").toLowerCase();

  const {
    photoUrl,
    displayName,
    orgName,
    city,
    countryCode,
    openToMeet,
    roleChip,
    about,
    actorType,
  } = useMemo(() => summarize(r, actor), [r, actor]);

  const { ActorId } = useAuth();
  const peerId = actor?.id || actor?._id || "";
  const isSelf = peerId && ActorId && String(peerId) === String(ActorId);
  const usableId = !isSelf ? peerId : ""; // don’t show CTAs for your own PP

  // HREFs (no handlers -> direct links)
  const meetingHref = usableId ? `/meeting/${usableId}` : loginHref;
  const messageHref = usableId ? `/messages?member=${usableId}` : loginHref;
  const businessProfileHref = resolveBusinessProfileHref(actor); // /businessProfile/:id or null

  const [expanded, setExpanded] = useState(false);
  const hasAbout = !!(about && String(about).trim().length);

  /* ======== QR modal ======== */
  const [qrOpen, setQrOpen] = useState(false);
  const pageUrl = typeof window !== "undefined" ? window.location.href : "";
  const qrSrc = useMemo(() => {
    const u = pageUrl || "";
    const size = 320;
    const margin = 10;
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=${margin}&data=${encodeURIComponent(
      u
    )}`;
  }, [pageUrl]);

  return (
    <section className="pph-card">
      <div className="pph-row -withdesc">
        {/* Avatar / Logo */}
        <div className="pph-avatar -xl" aria-hidden="true">
          {photoUrl ? (
            <img src={imageLink(photoUrl)} alt="" />
          ) : (
            <span className="pph-initials">{initials(displayName || "—")}</span>
          )}
        </div>

        {/* Meta + description */}
        <div className="pph-meta">
          <h1 className="pph-name">{displayName || "—"}</h1>

          <div className="pph-line">
            {roleChip ? <span className="pph-chip -role">{roleChip}</span> : null}

            {orgName ? (
              <span className="pph-chip">
                <span className="pph-chip-txt">{orgName}</span>
              </span>
            ) : null}

            {actorType ? (
              <span className="pph-chip">
                <span className="pph-chip-txt">{actorType}</span>
              </span>
            ) : null}

            {(city || countryCode) ? (
              <span className="pph-chip">
                <FiMapPin />
                {city ? <span className="pph-chip-txt">{city}</span> : null}
                {countryCode ? (
                  <span className="pph-flag">
                    <ReactCountryFlag
                      svg
                      countryCode={countryCode}
                      aria-label={countryCode}
                      style={{ width: "1.1em", height: "1.1em" }}
                    />
                  </span>
                ) : null}
              </span>
            ) : null}
          </div>

          {/* Long description */}
          {hasAbout ? (
            <div className={`pph-desc-wrap ${expanded ? "is-open" : "is-closed"}`}>
              <p className="pph-desc">{about}</p>
              {!expanded ? <span className="pph-desc-fade" aria-hidden="true" /> : null}
              <button
                type="button"
                className="pph-desc-toggle"
                onClick={() => setExpanded((v) => !v)}
                aria-expanded={expanded}
              >
                {expanded ? "Show less" : "Show more"}
              </button>
            </div>
          ) : null}
        </div>

        {/* CTAs + QR + Business Profile */}
        <div className="pph-ctas">
          {openToMeet && usableId ? (
            <>
              <a className="pph-btn pph-primary" href={meetingHref}>
                <FiUserPlus />
                Book meeting
              </a>
              <a className="pph-btn" href={messageHref}>
                <FiMessageSquare />
                Message
              </a>
            </>
          ) : null}

          <button
            type="button"
            className="pph-btn pph-ghost"
            onClick={() => setQrOpen(true)}
            aria-haspopup="dialog"
            aria-controls="pph-qr-dialog"
          >
            <FiShare2 />
            QR code
          </button>

          {businessProfileHref ? (
            <a className="pph-btn -line" href={businessProfileHref}>
              Business profile
            </a>
          ) : null}
        </div>
      </div>

      {/* ===== QR Modal ===== */}
      {qrOpen && (
        <div className="pph-qr-backdrop" onClick={() => setQrOpen(false)} role="presentation">
          <div
            className="pph-qr"
            id="pph-qr-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="Share via QR code"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="pph-qr-close" onClick={() => setQrOpen(false)} aria-label="Close">
              <FiX />
            </button>

            <div className="pph-qr-title">Scan to open this page</div>
            <div className="pph-qr-img">
              <img src={qrSrc} alt="QR code for this page" />
            </div>
            <div className="pph-qr-url" title={pageUrl}>
              {pageUrl}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

PPHeader.propTypes = {
  role: PropTypes.string,
  actor: PropTypes.object,
  loginHref: PropTypes.string,
};

/* ---------------- helpers ---------------- */

function pickFirst(...vals) {
  for (const v of vals.flat()) {
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

function summarize(role, a = {}) {
  const r = (role || "").toLowerCase();

  if (r === "speaker") {
    const p = a?.personal || {};
    const o = a?.organization || {};
    const b = a?.b2bIntent || {};
    const about = pickFirst(
      p?.desc,
      a?.enrichments?.bio,
      a?.bio,
      a?.about,
      a?.summary,
      a?.description
    );
    return {
      photoUrl: a?.enrichments?.profilePic || p?.profilePic || null,
      displayName: p.fullName || "—",
      orgName: o.orgName || "",
      city: p.city || "",
      countryCode: (p.countryCode || p.country || "").toString().slice(0, 2).toUpperCase(),
      roleChip: o.jobTitle || o.businessRole || "Speaker",
      openToMeet: !!b?.openMeetings,
      about,
      actorType: a?.actorType || "",
    };
  }

  if (r === "exhibitor") {
    const id = a?.identity || {};
    const com = a?.commercial || {};
    const about = pickFirst(
      id?.desc,
      a?.business?.about,
      a?.bio,
      a?.about,
      a?.summary,
      a?.description
    );
    return {
      photoUrl: id.logo || null,
      displayName: id.exhibitorName || id.orgName || "—",
      orgName: id.orgName || "",
      city: id.city || "",
      countryCode: (id.countryCode || id.country || "").toString().slice(0, 2).toUpperCase(),
      roleChip: "Exhibitor",
      openToMeet: !!com?.availableMeetings,
      about,
      actorType: a?.actorType || "",
    };
  }

  // attendee (default)
  const p = a?.personal || {};
  const o = a?.organization || {};
  const mi = a?.matchingIntent || {};
  const about = pickFirst(p?.desc, a?.bio, a?.about, a?.summary, a?.description);

  return {
    photoUrl: p.profilePic || null,
    displayName: p.fullName || "—",
    orgName: o.orgName || "",
    city: p.city || "",
    countryCode: (p.countryCode || p.country || "").toString().slice(0, 2).toUpperCase(),
    roleChip: o.businessRole || "Attendee",
    openToMeet: !!mi?.openToMeetings,
    about,
    actorType: a?.actorType || "",
  };
}

function resolveBusinessProfileHref(actor) {
  // Strict per your note: actor.bp.primary.id
  const bp = actor?.bp;
  const id = bp?.primary?.id || bp?.primary?._id || null;
  return id ? `/businessProfile/${id}` : null;
}

function initials(name = "") {
  const parts = String(name).trim().split(/\s+/).slice(0, 2);
  return parts.map((x) => x[0]?.toUpperCase?.() || "").join("") || "—";
}
