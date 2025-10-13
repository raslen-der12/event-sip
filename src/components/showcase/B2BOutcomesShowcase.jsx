import React from "react";
import "./b2b-outcomes-showcase.css";

/**
 * B2BOutcomesShowcase
 * - Left: vertical list of outcomes (hover/focus selects)
 * - Right: large visual with metric + blurb + single CTA "See all events"
 * - No continuous animations; only transitions on state change
 * - Mobile: right panel hidden; list remains
 *
 * Props:
 *  - items?: [{ id, title, blurb, metricLabel, metricValue, imgUrl }]
 *  - allEventsHref?: string (default "/events")
 */
export default function B2BOutcomesShowcase({
  items = [],
  allEventsHref = "/events",
}) {
  const DEMO = [
    {
      id: "deal",
      title: "Close deals faster",
      blurb:
        "Meet pre-qualified buyers at curated sessions and convert meetings into pipeline.",
      metricLabel: "Avg. cycle reduction",
      metricValue: "-32%",
      imgUrl:
        "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=1600&auto=format&fit=crop",
    },
    {
      id: "sourcing",
      title: "Source verified suppliers",
      blurb:
        "Skip cold outreach. Get matched with vetted vendors and negotiate on-site.",
      metricLabel: "Vetted suppliers",
      metricValue: "2,100+",
      imgUrl:
        "https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=1600&auto=format&fit=crop",
    },
    {
      id: "partnerships",
      title: "Build partnerships",
      blurb:
        "Find distribution, tech, and channel partners with shared ICPs and goals.",
      metricLabel: "Partner intros",
      metricValue: "9,400+",
      imgUrl:
        "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=1600&auto=format&fit=crop",
    },
  ];

  const data = Array.isArray(items) && items.length ? items : DEMO;
  const [active, setActive] = React.useState(0);

  const onPick = (i) => setActive(i);

  const cur = data[active] || {};

  return (
    <section className="bo">
      <div className="bo-grid container">
        {/* LEFT — vertical list */}
        <div className="bo-list" role="tablist" aria-label="Platform outcomes">
          {data.map((it, i) => {
            const isActive = i === active;
            return (
              <button
                key={it.id || i}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`bo-item ${isActive ? "is-active" : ""}`}
                onMouseEnter={() => onPick(i)}
                onFocus={() => onPick(i)}
                onClick={() => onPick(i)}
              >
                <div className="bo-title">{it.title}</div>
                <div className="bo-mini">
                  <span className="bo-metric-pill">
                    {it.metricValue}
                    <span className="bo-metric-sub">{it.metricLabel}</span>
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* RIGHT — hero visual (hidden on mobile) */}
        <aside className="bo-hero" aria-live="polite">
          {/* cross-fade stack */}
          <div className="bo-img-stack">
            {data.map((it, i) => (
              <div
                key={`img-${it.id || i}`}
                className={`bo-img ${i === active ? "on" : ""}`}
                style={{
                  backgroundImage: `linear-gradient(to top, rgba(36,58,102,.9) 0%, rgba(36,58,102,.35) 50%, rgba(36,58,102,0) 80%), url(${it.imgUrl})`,
                }}
                aria-hidden={i === active ? "false" : "true"}
              />
            ))}
          </div>

          {/* overlay content */}
          <div className="bo-overlay">
            <div className="bo-badge">
              <span className="bo-badge-val">{cur.metricValue || "—"}</span>
              <span className="bo-badge-lab">{cur.metricLabel || ""}</span>
            </div>

            <div className="bo-copy">
              <h4 className="bo-head">{cur.title || ""}</h4>
              <p className="bo-blurb">{cur.blurb || ""}</p>
              <a className="bo-cta" href={allEventsHref}>
                See all events
              </a>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
