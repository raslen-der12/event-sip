import React from "react";
import PropTypes from "prop-types";
import { FiTrendingUp, FiAward, FiUsers, FiCheckCircle } from "react-icons/fi";
import { useTranslation } from "react-i18next";
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
  heading,
  subheading,
  impacts = [],
  isLoading = false,
  onItemClick,
}) {
  const { t } = useTranslation();

  // Provide fallback impact data with translation keys
  const fallback = [
    {
      id: "f1",
      title: t("impact.participantsTitle", "1.5k+ participants"),
      description: t(
        "impact.participantsDesc",
        "International audience across MENA, EU, and NA."
      ),
    },
    {
      id: "f2",
      title: t("impact.meetingsTitle", "400+ B2B meetings"),
      description: t(
        "impact.meetingsDesc",
        "Curated matchmaking produced measurable deal flow."
      ),
    },
    {
      id: "f3",
      title: t("impact.satisfactionTitle", "95% satisfaction"),
      description: t(
        "impact.satisfactionDesc",
        "Post-event survey: content, logistics, and value."
      ),
    },
    {
      id: "f4",
      title: t("impact.exhibitorsTitle", "120 exhibitors"),
      description: t(
        "impact.exhibitorsDesc",
        "Showcasing solutions from startups and enterprises."
      ),
    },
    {
      id: "f5",
      title: t("impact.sessionsTitle", "30+ sessions"),
      description: t(
        "impact.sessionsDesc",
        "Keynotes, panels, and workshops across 2 days."
      ),
    },
    {
      id: "f6",
      title: t("impact.coverageTitle", "Global coverage"),
      description: t(
        "impact.coverageDesc",
        "Media mentions and social reach across regions."
      ),
    },
  ];

  const list = isLoading ? [] : impacts?.length ? impacts : fallback;

  const IconFor = (idx) => {
    switch (idx % 4) {
      case 0:
        return <FiTrendingUp />;
      case 1:
        return <FiAward />;
      case 2:
        return <FiUsers />;
      default:
        return <FiCheckCircle />;
    }
  };

  return (
    <section className="imp">
      <div className="container">
        <header className="imp-head">
          <div className="imp-titles">
            <h2 className="imp-title">{heading ?? t("impact.heading", "Event Impact")}</h2>
            {subheading ? (
              <p className="imp-sub">{subheading}</p>
            ) : (
              <p className="imp-sub">
                {t(
                  "impact.subheading",
                  "Key outcomes and highlights achieved by the event."
                )}
              </p>
            )}
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
          <div className="imp-empty">{t("impact.noData", "No impact highlights published yet.")}</div>
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
