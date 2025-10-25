// src/components/hero/HeroB2B.jsx
import React from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import {
  useQuickSearchQuery,
  useRegisterSearchClickMutation,
  useTrendingTagsQuery,
} from "../../features/search/searchApiSlice";
import "./hero-v2.css";

/**
 * Fixed:
 * - Never mixes fallback demo tags with dynamic ones.
 * - Normalizes backend tag shapes (string | {tag} | {title} | {name}).
 * - Always renders EXACTLY up to 4 tags, styled with the same `.hb-tag` class.
 * - Deduplicates tags and keeps them inside the styled container.
 * - Removed duplicate QUICK_MAP key and tightened fallback.
 */

export default function HeroB2B({
  title = "Find the right B2B partners — fast",
  placeholder = "Search companies, people, industries, or cities…",
  tags = [],
  defaultQuery = "",
  actions, // [{label, sub, href, onClick}]
}) {
  /* ---------- TAGS (prop > server > fallback), max 4, styled ---------- */
  const DEMO_TAGS = ["AI", "FinTech", "Logistics", "CleanTech"]; // shown only if neither prop nor server provide tags

  const { data: dynTagsRaw = [], isFetching: tagsLoading } = useTrendingTagsQuery(undefined, {
    pollingInterval: 300_000,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });

  const normalizeTag = (x) => {
    if (typeof x === "string") return x.trim();
    if (x && typeof x === "object") {
      return String(x.tag ?? x.title ?? x.name ?? "").trim();
    }
    return "";
  };

  const pickFour = (list) => {
    const uniq = Array.from(
      new Set(
        list
          .map(normalizeTag)
          .filter(Boolean)
      )
    );
    return uniq.slice(0, 4);
  };

  // decide the single source of truth once (no mixing):
  const liveTags = React.useMemo(() => {
    const fromProp = pickFour(Array.isArray(tags) ? tags : []);
    if (fromProp.length) return fromProp;
    const fromServer = pickFour(Array.isArray(dynTagsRaw) ? dynTagsRaw : []);
    if (fromServer.length) return fromServer;
    return pickFour(DEMO_TAGS);
  }, [tags, dynTagsRaw]);

  /* ---------- Actions ---------- */
  const DEFAULT_ACTIONS = [
    { label: "Freight Calculator",    sub: "Instantly estimate your shipping costs and optimize your logistics",    href: "/logistics/freight-calculator" },
    { label: "Book a B2B", sub: "Discover participants, view profiles, and start booking your business meetings",  href: "/attendees/open-to-meets" },
    { label: "Build a Business Profile",  sub: "Present your company, products, and services to attract new partners", href: "/BusinessProfile/dashboard" },
    { label: "Browse Events",  sub: "Discover upcoming events, connect with participants, and join opportunities",        href: "/events" },
  ];
  const acts = Array.isArray(actions) && actions.length ? actions : DEFAULT_ACTIONS;

  /* ---------- Search (RTK suggestions + click tracking) ---------- */
  const navigate = useNavigate();
  const [q, setQ] = React.useState(defaultQuery);
  const [active, setActive] = React.useState(null);
  const [debouncedQ, setDebouncedQ] = React.useState(q);

  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 220);
    return () => clearTimeout(t);
  }, [q]);

  const { data: suggestions = [], isFetching } = useQuickSearchQuery(
    { q: debouncedQ, limit: 4 },
    { skip: (debouncedQ || "").length < 2 }
  );
  const [registerClick] = useRegisterSearchClickMutation();

  const QUICK_MAP = React.useMemo(
    () =>
      new Map([
        ["buyers", "/buyers"],
        ["suppliers", "/exhibitors"],
        ["exhibitors", "/exhibitors"],
        ["exhibitor", "/exhibitors"],
        ["meetings", "/meetings"],
        ["b2b", "/meetings"],
        ["events", "/events"],
        ["speakers", "/speakers"],
        ["agenda", "/events"],
        ["program", "/events"],
        ["logistics", "/solutions/logistics"],
        ["ai", "/tags/ai"],
        ["fintech", "/tags/fintech"],
        ["cleantech", "/tags/cleantech"],
      ]),
    []
  );

  const resolveFallback = (term) => {
    const t = (term || "").trim().toLowerCase();
    if (!t) return null;
    if (QUICK_MAP.has(t)) return QUICK_MAP.get(t);
    for (const [k, v] of QUICK_MAP.entries()) {
      if (t.includes(k)) return v;
    }
    return null;
  };

  const go = (href) => {
    if (!href) return;
    try {
      if (/^https?:\/\//i.test(href)) window.location.assign(href);
      else navigate(href);
    } catch {
      navigate("/events");
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    const term = q.trim();

    // Prefer server suggestion that already has an href
    const first = Array.isArray(suggestions) ? suggestions.find((s) => s?.href) : null;
    if (first?.href) {
      try { await registerClick({ id: first._id, type: first.type }).unwrap(); } catch {}
      return go(first.href);
    }

    // Next, local mapping
    const mapped = resolveFallback(term);
    if (mapped) return go(mapped);

    // Default safe page
    return go("/events");
  };

  const toggleTag = (t) => {
    const nv = active === t ? null : t;
    setActive(nv);
    if (nv) setQ(nv);
  };

  return (
    <section className="hero-v2 hero-b2b">
    <div className="hero-video-bg" aria-hidden="true">
      <iframe
    src="https://www.youtube.com/embed/Xg59b3ZuBwM?autoplay=1&mute=1&loop=1&playlist=Xg59b3ZuBwM&controls=0&modestbranding=1&rel=0"
        title="GITS background video"
        frameBorder="0"
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        allowFullScreen
      />
      <div className="hero-video-overlay" aria-hidden="true" />
    </div>

      <div className="hero2-bg" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />

      <div className="container hero-b2b-wrap">
        <h1 className="hero2-title hero-b2b-title">{title}</h1>

        {/* Search */}
        <form className="hb-search" onSubmit={submit} role="search" aria-label="Search B2B directory">
          <span className="hb-ico" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="7" stroke="#fff" strokeWidth="2" />
              <path d="M20 20l-3-3" stroke="#fff" strokeWidth="2" />
            </svg>
          </span>
          <input
            className="hb-input"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={placeholder}
            aria-label="Search"
          />
          <button className="hb-btn" type="submit" disabled={isFetching}>
            {isFetching ? "Searching…" : "Search"}
          </button>
        </form>

        {/* Tags (dynamic or prop), EXACTLY up to 4, same styling */}
        <div className="hb-tags" role="list" aria-busy={tagsLoading ? "true" : "false"}>
          {liveTags.map((t) => (
            <button
              key={t}
              type="button"
              role="listitem"
              className={`hb-tag ${active === t ? "on" : ""}`}
              onClick={() => toggleTag(t)}
              aria-pressed={active === t ? "true" : "false"}
              title={`Filter by ${t}`}
            >
              {t}
              <span className="shine" aria-hidden="true" />
            </button>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="hb-actions" aria-label="Quick actions">
          {(Array.isArray(actions) && actions.length ? actions : acts).map((a, i) => (
            <a
              key={`${a.label}-${i}`}
              className="hb-act"
              href={a.href || "#"}
              onClick={(e) => { if (a.onClick) { e.preventDefault(); a.onClick(); } }}
            >
              <div className="hb-act-top">
                <span className="hb-act-ico" aria-hidden="true">
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

        {/* Suggestions (max 4) */}
        {(debouncedQ.length >= 2 && Array.isArray(suggestions) && suggestions.length > 0) && (
          <div className="hb-suggest-row" aria-label="Suggestions">
            {suggestions.map((s) => (
              <button
                key={s._id}
                type="button"
                className="hb-suggest"
                onClick={async () => {
                  try { await registerClick({ id: s._id, type: s.type }).unwrap(); } catch {}
                  go(s.href || resolveFallback(s.title || s.tag) || "/events");
                }}
                title={s.title || s.tag}
              >
                {s.title || s.tag}
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

HeroB2B.propTypes = {
  title: PropTypes.string,
  placeholder: PropTypes.string,
  tags: PropTypes.arrayOf(PropTypes.string), // optional override to pin tags
  defaultQuery: PropTypes.string,
  actions: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      sub: PropTypes.string,
      href: PropTypes.string,
      onClick: PropTypes.func,
    })
  ),
};
