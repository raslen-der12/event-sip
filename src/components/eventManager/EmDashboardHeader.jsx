// src/components/eventManager/EmDashboardHeader.jsx
import React from "react";
import {
  FiCalendar,
  FiMapPin,
  FiBarChart2,
  FiActivity,
  FiImage,
} from "react-icons/fi";
import "../../pages/eventManager/event-manager-dashboard.css";

/**
 * Props:
 *  header = {
 *    title: string,
 *    dates: { startDate, endDate },
 *    location: { city, country },
 *    stats: {
 *      sessionsCount,
 *      ticketTypesCount,
 *      mediaCount,
 *      organizersCount
 *    }
 *  }
 */
const EmDashboardHeader = ({ header }) => {
  const title = header?.title || "New event";
  const dates = header?.dates || {};
  const location = header?.location || {};
  const stats = header?.stats || {};

  const startLabel = dates.startDate
    ? formatDate(dates.startDate)
    : "Start";
  const endLabel = dates.endDate
    ? formatDate(dates.endDate)
    : "End";

  return (
    <header className="emd-header">
      <div className="emd-header-main">
        <p className="emd-kicker">Event Manager dashboard</p>
        <h1 className="emd-title">{title}</h1>
        <p className="emd-sub">
          Edit your event data, schedule and tickets before going live.
        </p>
      </div>

      <div className="emd-header-meta">
        <div className="emd-event-chip">
          <FiCalendar />
          {startLabel} – {endLabel}
        </div>
        <div className="emd-event-chip">
          <FiMapPin />
          {location.city || "City"},{" "}
          {location.country || "Country"}
        </div>

        <div className="emd-stats-row">
          <StatChip
            icon={FiActivity}
            label="Sessions"
            value={stats.sessionsCount ?? "—"}
          />
          <StatChip
            icon={FiBarChart2}
            label="Ticket types"
            value={stats.ticketTypesCount ?? "—"}
          />
          <StatChip
            icon={FiImage}
            label="Media"
            value={stats.mediaCount ?? "—"}
          />
        </div>
      </div>
    </header>
  );
};

const StatChip = ({ icon: Icon, label, value }) => {
  return (
    <div className="emd-stat-chip">
      <div className="emd-stat-icon">
        <Icon />
      </div>
      <div className="emd-stat-text">
        <span className="emd-stat-value">{value}</span>
        <span className="emd-stat-label">{label}</span>
      </div>
    </div>
  );
};

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

export default EmDashboardHeader;
