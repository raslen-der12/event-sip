// src/components/event/organizers/EventOrganizers.jsx
import React from "react";
import PropTypes from "prop-types";
import "./organizers.css";
import imageLink from "../../../utils/imageLink";

function titleCase(s = "") {
  return String(s)
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

// order comparator: smaller first; 0 goes to the end; then by name
function orderComparator(a, b) {
  const ak = a.order && a.order > 0 ? a.order : Number.MAX_SAFE_INTEGER;
  const bk = b.order && b.order > 0 ? b.order : Number.MAX_SAFE_INTEGER;
  if (ak !== bk) return ak - bk;
  return String(a.name || "").localeCompare(String(b.name || ""), undefined, { sensitivity: "base" });
}

function normalizeType(raw) {
  return String(raw || "partner").trim(); // keep adaptive; no alias map
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
        const id    = x._id || x.id || `org-${i}`;
        const name  = x.name || x.type || "Organization";
        const link  = x.link || "";
        const logo  = x.logo || "";
        const type  = normalizeType(x.type);
        const order = typeof x.order === "number" ? x.order : Number(x.order) || 0;
        return {
          id, name, link, logo, type, order,
          typeLabel: titleCase(type),
        };
      })
    : [];

  // Build adaptive tabs from existing types (alpha order)
  const typeList = Array.from(
    new Set(normalized.map((o) => o.type).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));

  const tabs = React.useMemo(() => {
    const base = [{ key: "all", label: "All", filter: null }];
    const dyn  = typeList.map((t) => ({
      key: t,
      label: titleCase(t),
      filter: t,
    }));
    return base.concat(dyn);
  }, [typeList]);

  // Counts per tab
  const counts = React.useMemo(() => {
    const acc = { all: normalized.length };
    typeList.forEach((t) => {
      acc[t] = normalized.filter((x) => x.type === t).length;
    });
    return acc;
  }, [normalized, typeList]);

  // Active tab/filter
  const activeTab = tabs.find((t) => t.key === tab) || tabs[0];

  // Filter + order
  const filtered = React.useMemo(() => {
    const arr = activeTab.filter == null
      ? normalized.slice()
      : normalized.filter((x) => x.type === activeTab.filter);
    arr.sort(orderComparator);
    return arr;
  }, [normalized, activeTab]);

  return (
    <section className="orgs">
      <div className="container">
        <header className="org-head">
          <div className="org-titles">
            <h2 className="org-title">{heading}</h2>
            {subheading ? <p className="org-sub">{subheading}</p> : null}
          </div>

          <div className="org-tabs" role="tablist" aria-label="Organizer types">
            {tabs.map((t) => (
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
              const card = (
                <div key={o.id} className="org-card" title={o.name}>
                  <div className="org-frame">
                    <div className="org-grad" />
                    {o.logo ? (
                      <img
                        src={imageLink(o.logo)}
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
                  {card}
                </a>
              ) : (
                card
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
      type: PropTypes.string, // any string; UI adapts
      name: PropTypes.string,
      order: PropTypes.number,
    })
  ),
  loading: PropTypes.bool,
  error: PropTypes.string,
};
