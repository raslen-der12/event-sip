import React from "react";
import "./event-voices.css";

/**
 * EventVoices
 * Props:
 *  title?: string
 *  subtitle?: string
 *  comments?: Array<{
 *    _id?: string, id?: string
 *    text: string
 *    verified?: boolean
 *    createdAt?: string|Date
 *    actorModel?: 'speaker'|'attendee'|'exhibitor'|'admin'
 *    actor?: {
 *      fullName?: string,
 *      identity?: { exhibitorName?: string },
 *      organization?: { orgName?: string },
 *      personal?: { fullName?: string, profilePic?: string },
 *      enrichments?: { profilePic?: string }
 *    }
 *    actorName?: string
 *    actorOrg?: string
 *    avatarUrl?: string
 *  }>
 */
export default function EventVoices({
  title = "What people say",
  subtitle = "Real words from speakers, exhibitors, and attendees.",
  comments = [],
}) {
  const FALLBACK = [
    {
      id: "f1",
      text:
        "The B2B matchmaking was spot on—we closed two partnerships within a week.",
      verified: true,
      actorModel: "exhibitor",
      actorName: "Vectorly Team",
      actorOrg: "Vectorly",
      avatarUrl:
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=300",
      createdAt: new Date().toISOString(),
    },
    {
      id: "f2",
      text:
        "Crisp talks, zero fluff. Best AI/industry crossover content this year.",
      verified: true,
      actorModel: "speaker",
      actorName: "Amira K.",
      actorOrg: "DataForge",
      avatarUrl:
        "https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?q=80&w=300",
      createdAt: new Date().toISOString(),
    },
    {
      id: "f3",
      text:
        "Great networking—met buyers from three regions. Definitely coming back.",
      verified: true,
      actorModel: "attendee",
      actorName: "Yassine B.",
      actorOrg: "SME Owner",
      avatarUrl:
        "https://images.unsplash.com/photo-1502685104226-ee32379fefbe?q=80&w=300",
      createdAt: new Date().toISOString(),
    },
  ];

  const normalized = (Array.isArray(comments) ? comments : [])
    .map((c, idx) => normalizeComment(c, idx))
    .filter(Boolean);

  const hasServerData = normalized.length > 0;

  const [role, setRole] = React.useState("all");

  // prefer verified if available
  const pool = (() => {
    const ver = normalized.filter((c) => c.verified);
    return ver.length ? ver : normalized;
  })();

  // filter by role BEFORE slicing
  const filteredByRole =
    role === "all" ? pool : pool.filter((c) => c.actorModel === role);

  const list = (hasServerData ? filteredByRole : fallbackByRole(FALLBACK, role)).slice(0, 12);

  const roles = [
    { key: "all", label: "All" },
    { key: "speaker", label: "Speakers" },
    { key: "exhibitor", label: "Exhibitors" },
    { key: "attendee", label: "Attendees" },
  ];

  return (
    <section className="ev-voices">
      <div className="container">
        <header className="evv-head">
          <h2 className="evv-title">{title}</h2>
          {subtitle ? <p className="evv-sub">{subtitle}</p> : null}
          <div className="evv-tabs" role="tablist" aria-label="Filter testimonials by role">
            {roles.map((r) => (
              <button
                key={r.key}
                role="tab"
                aria-selected={role === r.key}
                className={`evv-tab ${role === r.key ? "is-active" : ""}`}
                onClick={() => setRole(r.key)}
                type="button"
              >
                <RoleDot role={r.key} />
                {r.label}
              </button>
            ))}
          </div>
        </header>

        {/* Empty state (when server has data but no results for this role) */}
        {hasServerData && list.length === 0 ? (
          <div className="evv-empty">
            <div className="evv-empty-card">
              <div className="evv-empty-title">No comments yet for this role</div>
              <div className="evv-empty-sub">Check another tab or come back later.</div>
            </div>
          </div>
        ) : null}

        <div className="evv-row">
          {list.map((c) => (
            <article key={c.id} className="evv-card">
              {/* TOP: profile/meta (reversed order vs previous version) */}
              <header className="evv-foot">
                <div className="evv-avatar">
                  {c.avatarUrl ? (
                    <img src={c.avatarUrl} alt={`${c.actorName || "User"} avatar`} />
                  ) : (
                    <span className="evv-initials">
                      {initials(c.actorName || c.actorOrg || "User")}
                    </span>
                  )}
                </div>
                <div className="evv-meta">
                  <div className="evv-name-row">
                    <span className="evv-name">{c.actorName || "Guest"}</span>
                    {c.verified ? <VerifiedBadge /> : null}
                  </div>
                  <div className="evv-line2">
                    <span className={`evv-role evv-${c.actorModel || "guest"}`}>
                      {labelForRole(c.actorModel)}
                    </span>
                    {c.actorOrg ? <span className="evv-sep">•</span> : null}
                    {c.actorOrg ? <span className="evv-org">{c.actorOrg}</span> : null}
                    {c.createdAt ? (
                      <>
                        <span className="evv-sep">•</span>
                        <time className="evv-time" dateTime={c.createdAt}>
                          {timeAgo(c.createdAt)}
                        </time>
                      </>
                    ) : null}
                  </div>
                </div>
              </header>

              {/* BOTTOM: comment text */}
              <blockquote className="evv-quote">“{c.text}”</blockquote>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── helpers ───────────────────────── */

function normalizeComment(c = {}, idx = 0) {
  const id = c._id || c.id || `c-${idx}`;
  const text = (c.text || "").toString().trim();
  if (!text) return null;

  const verified = !!c.verified;
  const role = c.actorModel || "guest";
  const createdAt = c.createdAt ? new Date(c.createdAt).toISOString() : null;

  const a = c.actor || {};
  const name =
    a.personal?.fullName ||
    a.fullName ||
    a.identity?.exhibitorName ||
    c.actorName ||
    "";
  const org =
    a.organization?.orgName ||
    a.orgName ||
    c.actorOrg ||
    "";
  const avatar =
    a.enrichments?.profilePic ||
    a.personal?.profilePic ||
    a.profilePic ||
    c.avatarUrl ||
    "";

  return {
    id,
    text,
    verified,
    actorModel: role,
    actorName: name,
    actorOrg: org,
    avatarUrl: avatar,
    createdAt,
  };
}

function fallbackByRole(list, role) {
  if (role === "all") return list;
  return list.filter((c) => c.actorModel === role);
}

function initials(name = "") {
  const t = name.trim();
  if (!t) return "U";
  return t
    .split(/\s+/)
    .map((x) => x[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function timeAgo(iso) {
  try {
    const now = new Date();
    const then = new Date(iso);
    const sec = Math.max(0, Math.floor((now - then) / 1000));
    if (sec < 60) return `${sec}s ago`;
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}m ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h ago`;
    const day = Math.floor(hr / 24);
    if (day < 7) return `${day}d ago`;
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(then);
  } catch {
    return "";
  }
}

function labelForRole(r) {
  switch (r) {
    case "speaker": return "Speaker";
    case "exhibitor": return "Exhibitor";
    case "attendee": return "Attendee";
    case "admin": return "Admin";
    default: return "Guest";
  }
}

function VerifiedBadge() {
  return (
    <span className="evv-verified" title="Verified comment" aria-label="Verified">
      <svg viewBox="0 0 20 20" width="14" height="14" aria-hidden="true">
        <path
          fill="currentColor"
          d="M10 1.5 12 4l3 .5-2 2  .5 3-3-1.5L7.5 10 8 7l-2-2 3-.5L10 1.5z"
          opacity=".35"
        />
        <path
          fill="currentColor"
          d="M8.6 13.3 5.9 10.6l1.2-1.2 1.5 1.5 4.3-4.3 1.2 1.2-5.5 5.5z"
        />
      </svg>
    </span>
  );
}

function RoleDot({ role }) {
  return <span className={`evv-dot evv-${role}`} aria-hidden="true" />;
}
