import React, { useMemo, useState } from "react";
import "./target-audience.css";

export default function TargetAudience({
  title = "Target Audience & Attendees",
  tags = [], // [{ tag, hero:{img, text}, minis:[{img,label},{...},{...}] }]
}) {
  const [active, setActive] = useState(0);
  const current = useMemo(() => (tags && tags.length ? tags[Math.min(active, tags.length - 1)] : null), [tags, active]);

  if (!tags || tags.length === 0) {
    return (
      <section className="ta-sec">
        <div className="ta-wrap">
          <h2 className="ta-title">{title}</h2>
          <div className="ta-empty">No audience data provided.</div>
        </div>
      </section>
    );
  }

  return (
    <section className="ta-sec">
      <div className="ta-wrap">
        <div className="ta-head">
          <h2 className="ta-title">{title}</h2>

          <div className="ta-tags" role="tablist" aria-label="Audience categories">
            {tags.map((t, i) => (
              <button
                key={t.tag}
                role="tab"
                aria-selected={active === i}
                className={`ta-tag ${active === i ? "is-active" : ""}`}
                onClick={() => setActive(i)}
              >
                {t.tag}
              </button>
            ))}
          </div>
        </div>

        {current && (
          <div className="ta-grid">
            {/* large hero with overlay sentence */}
            <figure className="ta-hero">
              <img src={current.hero.img} alt={`${current.tag} highlight`} loading="lazy" />
              <figcaption className="ta-hero-cap">
                <span className="ta-pill">{current.tag}</span>
                <span className="ta-hero-text">{current.hero.text}</span>
              </figcaption>
            </figure>

            {/* three small images with captions under each */}
            <div className="ta-minis">
              {current.minis.map((m, idx) => (
                <figure className="ta-mini" key={idx}>
                  <img src={m.img} alt={`${current.tag} — ${m.label}`} loading="lazy" />
                  <figcaption className="ta-mini-cap">{m.label}</figcaption>
                </figure>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
