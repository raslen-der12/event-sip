// src/components/eventManager/EmDashboardSidebar.jsx
import React from "react";
import {
  FiImage,
  FiUsers,
  FiCalendar,
  FiMapPin,
} from "react-icons/fi";
import "../../pages/eventManager/event-manager-dashboard.css";

/**
 * Props:
 *  aside = {
 *    primaryEventCard: {
 *      title,
 *      target,
 *      capacity,
 *      cover,
 *      chipDates: { startDate, endDate },
 *      chipLocation: { city, country }
 *    },
 *    tabs: [{ id, label, iconId? }]
 *  }
 *  activeTab: string
 *  onTabChange: (tabId) => void
 */
const EmDashboardSidebar = ({ aside, activeTab, onTabChange }) => {
  const card = aside?.primaryEventCard || {};
  const tabs = aside?.tabs || [];

  const start = card.chipDates?.startDate
    ? formatDate(card.chipDates.startDate)
    : "Start";
  const end = card.chipDates?.endDate
    ? formatDate(card.chipDates.endDate)
    : "End";

  return (
    <aside className="emd-sidebar">
      <div className="emd-event-card">
        <div className="emd-event-cover">
          {card.cover ? (
            <img src={card.cover} alt="" />
          ) : (
            <div className="emd-event-cover-placeholder">
              <FiImage />
            </div>
          )}
        </div>
        <div className="emd-event-body">
          <p className="emd-event-title">
            {card.title || "New event"}
          </p>
          <p className="emd-event-target">
            {card.target || "Audience not specified yet"}
          </p>

          <div className="emd-event-meta-row">
            <span className="emd-event-meta">
              <FiCalendar />
              {start} – {end}
            </span>
            <span className="emd-event-meta">
              <FiMapPin />
              {card.chipLocation?.city || "City"},{" "}
              {card.chipLocation?.country || "Country"}
            </span>
          </div>

          <p className="emd-event-meta">
            <FiUsers />
            Capacity:{" "}
            {card.capacity != null && card.capacity !== ""
              ? card.capacity
              : "not set"}
          </p>
        </div>
      </div>

      <nav className="emd-nav">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              className={
                "emd-nav-item" +
                (isActive ? " emd-nav-item--active" : "")
              }
              onClick={() => onTabChange(tab.id)}
            >
              {renderTabIcon(tab.id)}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
};

function renderTabIcon(tabId) {
  switch (tabId) {
    case "schedule":
      return <FiCalendar />;
    case "tickets":
      return <FiUsers />;
    case "organizers":
      return <FiImage />;
    case "basics":
    default:
      return <FiMapPin />;
  }
}

function formatDate(input) {
  if (!input) return "";
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default EmDashboardSidebar;
