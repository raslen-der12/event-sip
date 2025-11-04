import React from "react";
import PropTypes from "prop-types";
import { FiTrendingUp, FiAward, FiUsers, FiCheckCircle } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import "./impact.css";

/**
 * Generic, fully i18n-ready component for Event Impact section.
 * Automatically loads fallback translated data if no API impacts are provided.
 */
export default function ImpactHighlights({
  heading,
  subheading,
  impacts = [],
  isLoading = false,
  onItemClick,
}) {
  const { t } = useTranslation();

  // Fallback data with translations
  const fallback = [
    {
      id: "f1",
      title: t("impact.participantsTitle"),
      description: t("impact.participantsDesc"),
    },
    {
      id: "f2",
      title: t("impact.meetingsTitle"),
      description: t("impact.meetingsDesc"),
    },
    {
      id: "f3",
      title: t("impact.satisfactionTitle"),
      description: t("impact.satisfactionDesc"),
    },
    {
      id: "f4",
      title: t("impact.exhibitorsTitle"),
      description: t("impact.exhibitorsDesc"),
    },
    {
      id: "f5",
      title: t("impact.sessionsTitle"),
      description: t("impact.sessionsDesc"),
    },
    {
      id: "f6",
      title: t("impact.coverageTitle"),
      description: t("impact.coverageDesc"),
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
            <h2 className="imp-title">{heading ?? t("impact.heading")}</h2>
            <p className="imp-sub">
              {subheading ?? t("impact.subheading")}
            </p>
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
                <div className="imp-badge">
                  {String(idx + 1).padStart(2, "0")}
                </div>
                <div className="imp-ico" aria-hidden>
                  {IconFor(idx)}
                </div>
                <h3 className="imp-item-title">{it.title}</h3>
                {it.description && (
                  <p className="imp-item-desc">{it.description}</p>
                )}
              </article>
            ))}
          </div>
        ) : (
          <div className="imp-empty">{t("impact.noData")}</div>
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
