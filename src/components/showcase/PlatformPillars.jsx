import React from "react";
import "./platform-pillars.css";

/* tiny inline icons (no deps) */
const I = {
  network: () => (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <circle cx="5" cy="12" r="3" fill="currentColor" />
      <circle cx="19" cy="7" r="3" fill="currentColor" />
      <circle cx="19" cy="17" r="3" fill="currentColor" />
      <path
        d="M8 12h7M8 11l8-3M8 13l8 3"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        opacity=".7"
      />
    </svg>
  ),
  idcard: () => (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <rect
        x="3"
        y="5"
        width="18"
        height="14"
        rx="3"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
      <circle cx="9" cy="12" r="2.2" fill="currentColor" />
      <path
        d="M6.5 16.5c.8-1.5 2.2-2.3 4-2.3s3.2.8 4 2.3"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
      <path
        d="M13.5 9.5h4M13.5 12.5h4M13.5 15.5h3"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  ),
  briefcase: () => (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        d="M8 7V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
      <rect
        x="3"
        y="7"
        width="18"
        height="12"
        rx="2"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
      <path d="M3 12h18" stroke="currentColor" strokeWidth="2" />
      <rect x="10.5" y="11" width="3" height="2" fill="currentColor" />
    </svg>
  ),
};

export default function PlatformPillarsSplit({
  POINTS = [
    {
      id: "b2b",
      icon: <I.network />,
      title: "Premium B2B environment",
      desc: "Verified matchmaking, hosted meeting points, and deal rooms that move conversations into contracts.",
      img: "https://gits.seketak-eg.com/wp-content/uploads/2025/10/d6b7dc86-0885-4c9a-8a4a-222cf7974fe4-1.png",
    },
    {
      id: "profiles",
      icon: <I.idcard />,
      title: "Business profiles",
      desc: "Rich company pages with offerings, use-cases, and credentials—discoverable by buyers and partners.",
      img: "https://gits.seketak-eg.com/wp-content/uploads/2025/05/DSC_2128.png",
    },
    {
      id: "services",
      icon: <I.briefcase />,
      title: "Find & offer services",
      desc: "Publish what you need or provide. Match instantly and keep momentum with structured follow-ups.",
      img: "https://gits.seketak-eg.com/wp-content/uploads/2025/05/DSC_2354.png",
    },
  ],
}) {
  // fixed, non-configurable content

  const [active, setActive] = React.useState(0);

  return (
    <section className="pp2">
      <div className="pp2-grid container">
        {/* LEFT: vertical list */}
        <div className="pp2-left" role="list">
          {POINTS.map((p, i) => {
            const on = i === active;
            return (
              <button
                key={p.id}
                type="button"
                role="listitem"
                className={`pp2-item ${on ? "is-active" : ""}`}
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onClick={() => setActive(i)}
                aria-pressed={on}
              >
                <span className="pp2-ico">{p.icon}</span>
                <div className="pp2-copy">
                  <h4 className="pp2-h">{p.title}</h4>
                  <p className="pp2-p">{p.desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* RIGHT: image stage (hidden on phones) */}
        <aside className="pp2-right" aria-label="Preview">
          <div className="pp2-stage">
            {POINTS.map((p, i) => (
              <figure
                key={p.id}
                className={`pp2-shot ${i === active ? "is-on" : ""}`}
                style={{ backgroundImage: `url(${p.img})` }}
                aria-hidden={i !== active}
              />
            ))}
            {/* decorative frame (no motion) */}
            <span className="pp2-frame" aria-hidden="true" />
          </div>
        </aside>
      </div>
    </section>
  );
}
