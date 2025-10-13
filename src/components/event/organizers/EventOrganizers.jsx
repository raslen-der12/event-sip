import React from "react";
import PropTypes from "prop-types";
import "./organizers.css";

/**
 * Visible tabs (UI wording) mapped to a canonical backend type filter.
 * We normalize incoming item.type -> one of: host | co-host | sponsor | partner | media
 */
const VISIBLE_TABS = [
  { key: "all",             label: "All",                filter: null },
  { key: "organizers",      label: "Organizers",         filter: "host" },
  { key: "co-funders",      label: "Co-Funders",         filter: "sponsor" },
  { key: "co-organizers",   label: "Co-Organizers",      filter: "co-host" },
  { key: "media-partners",  label: "Media Partners",     filter: "media" },
  { key: "hospitality",     label: "Hospitality Partners", filter: "partner" },
];

/** map various backend variants to canonical buckets */
const TYPE_ALIASES = {
  "cl-host": "co-host",
  "cohost": "co-host",
  "co_host": "co-host",
  "co-organizer": "co-host",
  "co-organizers": "co-host",

  "organizer": "host",
  "organizers": "host",

  "co-funder": "sponsor",
  "co-funders": "sponsor",

  "media partners": "media",
  "media-partners": "media",
  "media_partner": "media",

  "hospitality partners": "partner",
  "hospitality": "partner",
};

function canonType(t) {
  const raw = String(t || "").trim().toLowerCase();
  if (!raw) return "partner"; // sensible default bucket
  return TYPE_ALIASES[raw] || raw; // if already canonical we keep it
}

function titleCase(s = "") {
  return String(s).replace(/\b\w/g, (m) => m.toUpperCase());
}

function InitialLogo({ text }) {
  const letters =
    (text || "LOGO")
      .split(/\s+/)
      .map((w) => w[0])
      .join("")
      .slice(0, 3)
      .toUpperCase() || "LOGO";
  return <div className="org-initial">{letters}</div>;
}

export default function EventOrganizers({
  heading = "Organizers & Partners",
  subheading = "Hosts, co-hosts, sponsors, partners and media for this event.",
  items = [],
  loading = false,
  error = "",
}) {
  const [tab, setTab] = React.useState("all");

  // Normalize input
  const normalized = Array.isArray(items)
    ? items.map((x, i) => {
        const id = x._id || x.id || `org-${i}`;
        const name = x.name || x.type || "Organization";
        const link = x.link || "";
        const logo = x.logo || "";
        const ctype = canonType(x.type);
        return {
          id,
          name,
          link,
          logo,
          type: ctype, // canonical type used for filter
          typeLabel: titleCase(ctype.replace(/-/g, " ")),
        };
      })
    : [];

  // Counts per visible tab (based on its canonical filter)
  const counts = VISIBLE_TABS.reduce((acc, t) => {
    if (t.filter == null) {
      acc[t.key] = normalized.length;
    } else {
      acc[t.key] = normalized.filter((x) => x.type === t.filter).length;
    }
    return acc;
  }, {});

  // Filter by selected tab
  const activeTab = VISIBLE_TABS.find((t) => t.key === tab) || VISIBLE_TABS[0];
  const filtered =
    activeTab.filter == null
      ? normalized
      : normalized.filter((x) => x.type === activeTab.filter);

  return (
    <section className="orgs">
      <div className="container">
        <header className="org-head">
          <div className="org-titles">
            <h2 className="org-title">{heading}</h2>
            {subheading ? <p className="org-sub">{subheading}</p> : null}
          </div>

          <div className="org-tabs" role="tablist" aria-label="Organizer types">
            {VISIBLE_TABS.map((t) => (
              <button
                key={t.key}
                role="tab"
                aria-selected={tab === t.key}
                className={`org-tab ${tab === t.key ? "is-active" : ""}`}
                onClick={() => setTab(t.key)}
              >
                <span className="org-dot" data-type={t.key} />
                <span className="org-tab-label">{t.label}</span>
                <span className="org-count">{counts[t.key] || 0}</span>
              </button>
            ))}
          </div>
        </header>

        {/* States */}
        {loading ? (
          <div className="org-skel">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="org-skel-item" />
            ))}
          </div>
        ) : error ? (
          <div className="org-alert">Failed to load organizers.</div>
        ) : filtered.length === 0 ? (
          <div className="org-empty">No organizers found for this filter.</div>
        ) : (
          <div className="org-grid">
            {filtered.map((o) => {
              const cell = (
                <div key={o.id} className="org-card" title={o.name}>
                  <div className="org-frame">
                    <div className="org-grad" />
                    {o.logo ? (
                      <img
                        src={o.logo}
                        alt={o.name}
                        className="org-logo"
                        loading="lazy"
                      />
                    ) : (
                      <InitialLogo text={o.name} />
                    )}
                    <span className="org-type">{o.typeLabel}</span>
                  </div>
                </div>
              );
              return o.link ? (
                <a
                  key={o.id}
                  className="org-link"
                  href={o.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${o.name} (${o.typeLabel})`}
                >
                  {cell}
                </a>
              ) : (
                cell
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

EventOrganizers.propTypes = {
  heading: PropTypes.string,
  subheading: PropTypes.string,
  items: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string,
      id: PropTypes.string,
      logo: PropTypes.string,
      link: PropTypes.string,
      // accept any string type from backend; we normalize it internally
      type: PropTypes.string,
      name: PropTypes.string,
    })
  ),
  loading: PropTypes.bool,
  error: PropTypes.string,
};
