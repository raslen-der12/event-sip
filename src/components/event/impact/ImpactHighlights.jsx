import React from "react";
import PropTypes from "prop-types";
import { FiTrendingUp, FiAward, FiUsers, FiCheckCircle } from "react-icons/fi";
import "./impact.css";

/**
 * Props:
 *  - heading?: string
 *  - subheading?: string
 *  - impacts?: Array<{ id?: string|number, title: string, description?: string }>
 *  - isLoading?: boolean
 *  - onItemClick?: (item) => void
 *
 * Data source:
 *  - From useGetFullEventQuery(eventId) → impacts (array of eventImpact docs)
 */
export default function ImpactHighlights({
  heading = "Event Impact",
  subheading = "Key outcomes and highlights achieved by the event.",
  impacts = [],
  isLoading = false,
  onItemClick,
}) {
  const fallback = [
    { id: "f1", title: "1.5k+ participants", description: "Audience internationale Afrique, MENA region & Europe " },
    { id: "f2", title: "400+ B2B meetings", description: "Matchmaking structuré et résultats mesurables" },
    { id: "f3", title: "95% satisfaction", description: "Enquête post-événement : contenu, logistique, valeur ajoutée" },
    { id: "f4", title: "50+ exposants ", description: "Startups, entreprises et institutions" },
    { id: "f5", title: "50+ sessions ", description: "Conférences, panels, ateliers sur 2 jours" },
    { id: "f6", title: "Couverture mondiale ", description: "Médias et réseaux sociaux à portée internationale" },
  ];

  const list = isLoading ? [] : (impacts?.length ? impacts : fallback);

  const IconFor = (idx) => {
    switch (idx % 4) {
      case 0: return <FiTrendingUp />;
      case 1: return <FiAward />;
      case 2: return <FiUsers />;
      default: return <FiCheckCircle />;
    }
  };

  return (
    <section className="imp">
      <div className="container">
        <header className="imp-head">
          <div className="imp-titles">
            <h2 className="imp-title">{heading}</h2>
            {subheading ? <p className="imp-sub">{subheading}</p> : null}
          </div>
        </header>

        {isLoading ? (
          <div className="imp-skel" aria-hidden>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="imp-skel-card" />
            ))}
          </div>
        ) : list.length ? (
          <div className="imp-grid" role="list">
            {list.map((it, idx) => (
              <article
                role="listitem"
                key={it.id ?? idx}
                className="imp-card"
                onClick={() => onItemClick?.(it)}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") onItemClick?.(it);
                }}
                aria-label={it.title}
              >
                <div className="imp-badge">{String(idx + 1).padStart(2, "0")}</div>
                <div className="imp-ico" aria-hidden>
                  {IconFor(idx)}
                </div>
                <h3 className="imp-item-title">{it.title}</h3>
                {it.description ? (
                  <p className="imp-item-desc">{it.description}</p>
                ) : null}
              </article>
            ))}
          </div>
        ) : (
          <div className="imp-empty">No impact highlights published yet.</div>
        )}
      </div>
    </section>
  );
}

ImpactHighlights.propTypes = {
  heading: PropTypes.string,
  subheading: PropTypes.string,
  impacts: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      title: PropTypes.string.isRequired,
      description: PropTypes.string,
    })
  ),
  isLoading: PropTypes.bool,
  onItemClick: PropTypes.func,
};
