import React from "react";
import PropTypes from "prop-types";
import {
  FiActivity,
  FiClock,
  FiUsers,
  FiCalendar,
  FiMessageSquare,
  FiShare2,
  FiDownload,
} from "react-icons/fi";
import "./pp-activity.css";

/**
 * PPActivityPanel
 * - Tabs: Activity | Sessions | Comments
 * - Toolbar: Share profile / Download vCard
 * - Reads whatever exists on the actor object (null-safe).
 * - If no data for a tab, shows a graceful empty state.
 *
 * Props:
 *  - role: 'speaker' | 'exhibitor' | 'attendee' | ...
 *  - actor: full actor object from useGetActorPPQuery
 *  - eventMini: optional mini event (title/city/country/dates) from useGetEventQuery
 *  - canEdit: boolean (not used for now, but left for future actions)
 */

export default function PPActivityPanel({ role, actor, eventMini, canEdit }) {
  const r = (role || "").toLowerCase();
  const a = actor || {};

  const createdAt = safeDate(a?.createdAt);
  const verified = !!a?.verified;
  const adminVerified = !!a?.adminVerified;

  // Role-aware sources we might have
  const speakerMeta = a?.matchMeta || a?.matchingMeta || {};
  const exhibMeta   = a?.matchingMeta || {};
  const attendMeta  = a?.matchingMeta || {};

  // --- Derived activity rows (super light inference) ---
  const activityRows = [
    createdAt && {
      icon: <FiClock />,
      title: "Joined",
      desc: eventMini?.title ? `Registered for ${eventMini.title}` : "Profile created",
      at: createdAt,
    },
    verified && {
      icon: <FiActivity />,
      title: "Email verified",
      desc: "Verification completed",
      at: createdAt,
    },
    adminVerified && {
      icon: <FiUsers />,
      title: "Admin approved",
      desc: "Profile validated by organizers",
      at: createdAt,
    },
    // bonus: some role meta if exists
    r === "speaker" && speakerMeta?.sessionEngage != null && {
      icon: <FiActivity />,
      title: "Session engagement updated",
      desc: `${speakerMeta.sessionEngage} engagement score`,
      at: createdAt,
    },
    r === "exhibitor" && exhibMeta?.profileVisits != null && {
      icon: <FiActivity />,
      title: "Profile visits",
      desc: `${exhibMeta.profileVisits} visits`,
      at: createdAt,
    },
    r === "attendee" && attendMeta?.engagementScore != null && {
      icon: <FiActivity />,
      title: "Engagement score",
      desc: `${attendMeta.engagementScore} points`,
      at: createdAt,
    },
  ].filter(Boolean);

  // Sessions: we don’t have schedule hook here, so show empty unless you pass in future
  const sessionRows = []; // reserved for integration with schedule-by-actor later

  // Comments: if your backend gives admin comments on the actor, map them here
  const comments = []; // reserved for integration later

  // Tabs
  const [tab, setTab] = React.useState(0);
  const tabs = [
    { label: "Activity", icon: <FiActivity /> },
    { label: "Sessions", icon: <FiCalendar /> },
    { label: "Comments", icon: <FiMessageSquare /> },
  ];

  // Toolbar handlers
  const onShare = async () => {
    try {
      const url = typeof window !== "undefined" ? window.location.href : "";
      const title = displayName(r, a);
      const text = `Check out ${title}'s profile${eventMini?.title ? ` @ ${eventMini.title}` : ""}.`;
      if (navigator.share) {
        await navigator.share({ title, text, url });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        alert("Profile link copied to clipboard.");
      }
    } catch {}
  };

  const onVCard = () => {
    try {
      const card = buildVCard(r, a);
      const blob = new Blob([card], { type: "text/vcard;charset=utf-8" });
      const href = URL.createObjectURL(blob);
      const aTag = document.createElement("a");
      aTag.href = href;
      aTag.download = `${safeFile(displayName(r, a) || "profile")}.vcf`;
      document.body.appendChild(aTag);
      aTag.click();
      aTag.remove();
      URL.revokeObjectURL(href);
    } catch {}
  };

  return (
    <section className="ppa">
      <div className="ppa-head">
        <div className="ppa-title-wrap">
          <h2 className="ppa-title">Activity</h2>
          <span className="ppa-underline" />
        </div>

        <div className="ppa-toolbar">
          <button className="ppa-tbtn" onClick={onShare} title="Share profile">
            <FiShare2 />
            <span>Share</span>
          </button>
          <button className="ppa-tbtn -primary" onClick={onVCard} title="Download vCard">
            <FiDownload />
            <span>vCard</span>
          </button>
        </div>
      </div>

      <div className="ppa-tabs" role="tablist" aria-label="Profile timeline tabs">
        {tabs.map((t, i) => (
          <button
            key={t.label}
            className={`ppa-tab ${tab === i ? "is-active" : ""}`}
            role="tab"
            aria-selected={tab === i}
            onClick={() => setTab(i)}
          >
            {t.icon}
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Tab panels */}
      <div className="ppa-body">
        {tab === 0 && (
          <div className="ppa-pane">
            {activityRows?.length ? (
              <ul className="ppa-timeline">
                {activityRows.map((row, idx) => (
                  <li key={idx} className="ppa-item">
                    <div className="ppa-ico">{row.icon}</div>
                    <div className="ppa-content">
                      <div className="ppa-top">
                        <strong className="ppa-tt">{row.title}</strong>
                        <time className="ppa-time">{fmtWhen(row.at)}</time>
                      </div>
                      <div className="ppa-desc">{row.desc || "—"}</div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="ppa-empty">No recent activity.</div>
            )}
          </div>
        )}

        {tab === 1 && (
          <div className="ppa-pane">
            {sessionRows?.length ? (
              <ul className="ppa-list">
                {sessionRows.map((s, i) => (
                  <li key={i} className="ppa-row">
                    <div className="ppa-row-l">
                      <FiCalendar />
                      <span className="ppa-row-title">{s.title}</span>
                    </div>
                    <div className="ppa-row-r">
                      <span className="ppa-chip">{s.room || "Room —"}</span>
                      <span className="ppa-chip">{s.when || "Time —"}</span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="ppa-empty">No sessions to show.</div>
            )}
          </div>
        )}

        {tab === 2 && (
          <div className="ppa-pane">
            {comments?.length ? (
              <ul className="ppa-comments">
                {comments.map((c, i) => (
                  <li key={i} className="ppa-cmt">
                    <div className="ppa-cmt-top">
                      <FiMessageSquare />
                      <span className="ppa-cmt-author">{c.author || "Admin"}</span>
                      <time className="ppa-time">{fmtWhen(c.at)}</time>
                    </div>
                    <p className="ppa-cmt-text">{c.text}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="ppa-empty">No comments yet.</div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

PPActivityPanel.propTypes = {
  role: PropTypes.string,
  actor: PropTypes.object,
  eventMini: PropTypes.object,
  canEdit: PropTypes.bool,
};

/* ---------------- helpers ---------------- */

function safeDate(d) {
  try { return d ? new Date(d) : null; } catch { return null; }
}

function fmtWhen(d) {
  if (!(d instanceof Date)) return "—";
  const diff = Date.now() - d.getTime();
  const sec = Math.max(1, Math.floor(diff / 1000));
  const min = Math.floor(sec / 60);
  const hr  = Math.floor(min / 60);
  const day = Math.floor(hr / 24);
  if (day > 0)  return `${day} day${day>1?"s":""} ago`;
  if (hr  > 0)  return `${hr} hour${hr>1?"s":""} ago`;
  if (min > 0)  return `${min} minute${min>1?"s":""} ago`;
  return "just now";
}

function displayName(role, a) {
  const r = (role || "").toLowerCase();
  if (r === "speaker") return a?.personal?.fullName || a?.fullName || a?.email || "Speaker";
  if (r === "exhibitor") return a?.identity?.exhibitorName || a?.identity?.orgName || "Exhibitor";
  if (r === "attendee" || r === "attendee") return a?.personal?.fullName || "Attendee";
  return a?.personal?.fullName || a?.fullName || a?.email || "Profile";
}

function safeFile(s) {
  return String(s || "file")
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function buildVCard(role, a) {
  const r = (role || "").toLowerCase();
  const lines = ["BEGIN:VCARD", "VERSION:3.0"];

  if (r === "speaker") {
    const fn = a?.personal?.fullName || "";
    const org = a?.organization?.orgName || "";
    const title = a?.organization?.jobTitle || "";
    const email = a?.personal?.email || a?.email || "";
    const tel   = a?.personal?.phone || "";
    const city  = a?.personal?.city || "";
    const country = a?.personal?.country || "";
    lines.push(`FN:${escapeVC(fn)}`);
    lines.push(`ORG:${escapeVC(org)}`);
    lines.push(`TITLE:${escapeVC(title)}`);
    if (email) lines.push(`EMAIL;TYPE=INTERNET:${email}`);
    if (tel)   lines.push(`TEL;TYPE=CELL:${tel}`);
    if (city || country) lines.push(`ADR:;;${escapeVC("")};${escapeVC(city)};;${escapeVC(country)};`);
    if (a?.enrichments?.profilePic) lines.push(`PHOTO;VALUE=uri:${escapeVC(a.enrichments.profilePic)}`);
  } else if (r === "exhibitor") {
    const org = a?.identity?.orgName || a?.identity?.exhibitorName || "";
    const email = a?.identity?.email || a?.email || "";
    const tel   = a?.identity?.phone || "";
    const city  = a?.identity?.city || "";
    const country = a?.identity?.country || "";
    lines.push(`FN:${escapeVC(org)}`);
    lines.push(`ORG:${escapeVC(org)}`);
    if (email) lines.push(`EMAIL;TYPE=INTERNET:${email}`);
    if (tel)   lines.push(`TEL;TYPE=WORK,VOICE:${tel}`);
    if (a?.identity?.orgWebsite) lines.push(`URL:${escapeVC(a.identity.orgWebsite)}`);
    if (city || country) lines.push(`ADR:;;${escapeVC("")};${escapeVC(city)};;${escapeVC(country)};`);
  } else {
    const fn = a?.personal?.fullName || a?.fullName || "";
    const email = a?.personal?.email || a?.email || "";
    const tel   = a?.personal?.phone || "";
    lines.push(`FN:${escapeVC(fn)}`);
    if (email) lines.push(`EMAIL;TYPE=INTERNET:${email}`);
    if (tel)   lines.push(`TEL;TYPE=CELL:${tel}`);
  }

  lines.push("END:VCARD");
  return lines.join("\r\n");
}

function escapeVC(s = "") {
  return String(s).replace(/[,;]/g, "\\$&");
}
