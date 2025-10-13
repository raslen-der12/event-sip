import React from "react";
import PropTypes from "prop-types";
import "./hero-v2.css";   // keep your old animated background

export default function HeroB2B({
  title = "Find the right B2B partners — fast",
  placeholder = "Search companies, people, industries, or cities…",
  tags = [],
  defaultQuery = "",
  onSearch,             // (q) => void
  onTagClick,           // (tag) => void
  actions,              // optional override: [{label, sub, href, onClick, icon}]
}) {
  const DEMO_TAGS = [
    "AI","FinTech","GovTech","Smart Cities","Manufacturing","Logistics",
    "Energy","CleanTech","Health","Education","Cybersecurity","Telecom",
    "Retail","Agritech","Aerospace","Tourism"
  ];
  const list = Array.isArray(tags) && tags.length ? tags : DEMO_TAGS;

  const DEFAULT_ACTIONS = [
    { label:"Find Buyers",    sub:"Source qualified demand",    href:"/buyers" },
    { label:"Find Suppliers", sub:"Verified solution vendors",  href:"/exhibitors" },
    { label:"Book Meetings",  sub:"Instant scheduling & rooms", href:"/meetings" },
    { label:"Browse Events",  sub:"All upcoming & past",        href:"/events" },
  ];
  const acts = Array.isArray(actions) && actions.length ? actions : DEFAULT_ACTIONS;

  const [q, setQ] = React.useState(defaultQuery);
  const [active, setActive] = React.useState(null);

  const submit = (e) => { e.preventDefault(); onSearch?.(q.trim()); };
  const toggleTag = (t) => {
    const nv = active === t ? null : t;
    setActive(nv);
    onTagClick?.(nv ?? "");
    if (nv && !q.trim()) setQ(nv);
  };

  return (
    <section className="hero-v2 hero-b2b">
      <div className="hero2-bg" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />

      <div className="container hero-b2b-wrap">
        <h1 className="hero2-title hero-b2b-title">{title}</h1>

        {/* Search */}
        <form className="hb-search" onSubmit={submit} role="search" aria-label="Search B2B directory">
          <span className="hb-ico" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="7" stroke="#fff" strokeWidth="2"/>
              <path d="M20 20l-3-3" stroke="#fff" strokeWidth="2"/>
            </svg>
          </span>
          <input
            className="hb-input"
            type="search"
            value={q}
            onChange={(e)=>setQ(e.target.value)}
            placeholder={placeholder}
            aria-label="Search"
          />
          <button className="hb-btn" type="submit">Search</button>
        </form>

        {/* Tags (better look, more items) */}
        <div className="hb-tags" role="list">
          {list.map((t) => (
            <button
              key={t}
              type="button"
              role="listitem"
              className={`hb-tag ${active === t ? "on" : ""}`}
              onClick={()=>toggleTag(t)}
              aria-pressed={active === t ? "true" : "false"}
              title={`Filter by ${t}`}
            >
              {t}
              <span className="shine" aria-hidden="true" />
            </button>
          ))}
        </div>

        {/* Quick Actions (replaces the old thing under tags) */}
        <div className="hb-actions" aria-label="Quick actions">
          {acts.map((a, i) => (
            <a
              key={`${a.label}-${i}`}
              className="hb-act"
              href={a.href || "#"}
              onClick={(e)=>{ if (a.onClick){ e.preventDefault(); a.onClick(); } }}
            >
              <div className="hb-act-top">
                <span className="hb-act-ico" aria-hidden="true">
                  {/* tiny inline icon */}
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M4 12h16M4 6h12M4 18h8" stroke="currentColor" strokeWidth="2" />
                  </svg>
                </span>
              </div>
              <div className="hb-act-body">
                <div className="hb-act-title">{a.label}</div>
                <div className="hb-act-sub">{a.sub}</div>
              </div>
              <span className="hb-act-glow" aria-hidden="true" />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

HeroB2B.propTypes = {
  title: PropTypes.string,
  placeholder: PropTypes.string,
  tags: PropTypes.arrayOf(PropTypes.string),
  defaultQuery: PropTypes.string,
  onSearch: PropTypes.func,
  onTagClick: PropTypes.func,
  actions: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      sub: PropTypes.string,
      href: PropTypes.string,
      onClick: PropTypes.func,
    })
  ),
};
