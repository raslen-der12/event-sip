import React from "react";
import PropTypes from "prop-types";
import StatTile from "./StatTile";
import MiniCard from "./MiniCard";
import "./globalstats.css";

export default function GlobalStatsSection({ heading, subheading, kpis = [], minis = [], banner }) {
  return (
    <section className="gstats">
      <div className="container">
        <header className="gs-head">
          <h2 className="gs-title">{heading}</h2>
          {subheading ? <p className="gs-sub">{subheading}</p> : null}
        </header>

        {/* KPI photo tiles */}
        <div className="gs-grid">
          {kpis.map((k) => <StatTile key={k.id} {...k} />)}
        </div>

        {/* Mini photo stat row */}
        {minis?.length ? (
          <div className="gs-minis">
            {minis.map((m) => <MiniCard key={m.id} {...m} />)}
          </div>
        ) : null}
      </div>

      {/* Optional wide banner */}
      {banner?.img ? (
        <div className="gs-banner">
          <img src={banner.img} alt={banner.alt || ""} />
          <div className="gs-banner-overlay">
            <div className="container gs-banner-inner">
              {banner.badges?.map((b) => (
                <div key={b.id} className="gs-badge" style={{ "--badge-color": b.color || "var(--brand-600)" }}>
                  <div className="gs-badge-value">{b.value}</div>
                  <div className="gs-badge-label">{b.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

GlobalStatsSection.propTypes = {
  heading: PropTypes.string.isRequired,
  subheading: PropTypes.string,
  kpis: PropTypes.arrayOf(PropTypes.object).isRequired,
  minis: PropTypes.arrayOf(PropTypes.object),
  banner: PropTypes.shape({
    img: PropTypes.string,
    alt: PropTypes.string,
    badges: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        value: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
        color: PropTypes.string, // token color var
      })
    ),
  }),
};
