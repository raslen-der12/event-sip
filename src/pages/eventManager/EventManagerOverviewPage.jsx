// src/pages/eventManager/EventManagerOverviewPage.jsx
import React from "react";
import {
  FiUsers,
  FiUserCheck,
  FiBriefcase,
  FiCheck,
  FiTrendingUp,
  FiCalendar,
  FiArrowUp,
  FiArrowDown,
} from "react-icons/fi";
import "./event-manager-overview.css";

const kpiData = [
  {
    id: "registrations",
    title: "Registrations",
    value: "2,847",
    change: "+18.4%",
    trend: "up",
    color: "indigo",
    Icon: FiUsers,
  },
  {
    id: "validated",
    title: "Validated attendees",
    value: "2,134",
    change: "+9.2%",
    trend: "up",
    color: "teal",
    Icon: FiUserCheck,
  },
  {
    id: "exhibitors",
    title: "Exhibitors",
    value: "73",
    change: "+3",
    trend: "up",
    color: "purple",
    Icon: FiBriefcase,
  },
  {
    id: "meetings",
    title: "B2B meetings",
    value: "428",
    change: "+24.1%",
    trend: "up",
    color: "blue",
    Icon: FiCheck,
  },
  {
    id: "conversion",
    title: "Registration → Check-in",
    value: "61%",
    change: "-2.3%",
    trend: "down",
    color: "green",
    Icon: FiTrendingUp,
  },
  {
    id: "days",
    title: "Event days",
    value: "3",
    change: "Live",
    trend: "up",
    color: "orange",
    Icon: FiCalendar,
  },
];

const registrationTrend = [
  { label: "Jan 1", value: 120 },
  { label: "Jan 8", value: 280 },
  { label: "Jan 15", value: 450 },
  { label: "Jan 22", value: 680 },
  { label: "Jan 29", value: 920 },
  { label: "Feb 5", value: 1250 },
  { label: "Feb 12", value: 1680 },
  { label: "Feb 19", value: 2150 },
  { label: "Feb 26", value: 2580 },
  { label: "Mar 4", value: 2847 },
];

const segmentDistribution = [
  { name: "Attendees", value: 1850, color: "indigo" },
  { name: "Speakers", value: 145, color: "purple" },
  { name: "Exhibitors", value: 287, color: "teal" },
  { name: "VIPs", value: 565, color: "blue" },
];

const industryData = [
  { label: "Technology", value: 890 },
  { label: "Healthcare", value: 645 },
  { label: "Finance", value: 520 },
  { label: "Education", value: 380 },
  { label: "Manufacturing", value: 412 },
];

const channelData = [
  { label: "Direct", value: 35 },
  { label: "Social media", value: 28 },
  { label: "Email", value: 22 },
  { label: "Organic search", value: 15 },
];

const activities = [
  {
    type: "registration",
    title: "New registration from Sarah Chen",
    company: "TechCorp Inc.",
    time: "2 minutes ago",
  },
  {
    type: "meeting",
    title: "Meeting confirmed between Green Logistics & PortX",
    company: "B2B meetings",
    time: "12 minutes ago",
  },
  {
    type: "exhibitor",
    title: "Exhibitor booth updated: Meditech Tunisia",
    company: "Expo zone B",
    time: "24 minutes ago",
  },
  {
    type: "speaker",
    title: "Speaker slides uploaded: AI & Manufacturing",
    company: "Main stage",
    time: "32 minutes ago",
  },
];

const EventManagerOverviewPage = () => {
  const maxRegistration = Math.max(...registrationTrend.map((p) => p.value));
  const maxIndustry = Math.max(...industryData.map((i) => i.value));

  return (
    <div className="emov-root">
      <div className="emov-inner container">
        {/* Header */}
        <header className="emov-header">
          <div className="emov-header-left">
            <div className="emov-badge">Event manager · Overview</div>

            <h1 className="emov-title">Tech Summit 2025</h1>
            <p className="emov-sub">
              March 15–17, 2025 • San Francisco, CA
            </p>

            <div className="emov-status-row">
              <span className="emov-status-pill emov-status-pill--published">
                <span className="emov-status-dot" />
                Published
              </span>
              <span className="emov-status-pill">
                2,847 registrations · 73 exhibitors · 428 meetings
              </span>
            </div>
          </div>

          <div className="emov-header-right">
            <div className="emov-health">
              <div className="emov-health-ring">
                <div className="emov-health-ring-inner">
                  <span>82%</span>
                </div>
              </div>
              <div className="emov-health-text">
                <p className="emov-health-label">Event health score</p>
                <p className="emov-health-note">
                  Based on registrations, meetings & engagement.
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* KPI cards */}
        <section className="emov-kpi-grid">
          {kpiData.map((kpi) => (
            <article key={kpi.id} className="emov-kpi-card">
              <div className="emov-kpi-header">
                <div
                  className={
                    "emov-kpi-icon emov-kpi-icon--" + kpi.color
                  }
                >
                  <kpi.Icon className="emov-kpi-icon-inner" />
                </div>
                <div className="emov-kpi-trend">
                  {kpi.trend === "up" && (
                    <>
                      <FiArrowUp className="emov-kpi-trend-icon emov-kpi-trend-icon--up" />
                      <span className="emov-kpi-trend-text emov-kpi-trend-text--up">
                        {kpi.change}
                      </span>
                    </>
                  )}
                  {kpi.trend === "down" && (
                    <>
                      <FiArrowDown className="emov-kpi-trend-icon emov-kpi-trend-icon--down" />
                      <span className="emov-kpi-trend-text emov-kpi-trend-text--down">
                        {kpi.change}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="emov-kpi-body">
                <div className="emov-kpi-value">{kpi.value}</div>
                <div className="emov-kpi-label">{kpi.title}</div>
              </div>
            </article>
          ))}
        </section>

        {/* Main content grid */}
        <section className="emov-main-grid">
          {/* Left column */}
          <div className="emov-col emov-col--left">
            {/* Registrations over time */}
            <article className="emov-card">
              <div className="emov-card-header">
                <h2 className="emov-card-title">Registrations over time</h2>
                <p className="emov-card-subtitle">
                  Weekly cumulative registrations for this event.
                </p>
              </div>
              <div className="emov-chart">
                <div className="emov-chart-body">
                  {registrationTrend.map((point) => {
                    const pct = (point.value / maxRegistration) * 100;
                    return (
                      <div
                        key={point.label}
                        className="emov-chart-bar-item"
                      >
                        <div
                          className="emov-chart-bar"
                          style={{ height: `${pct || 2}%` }}
                        />
                        <span className="emov-chart-bar-label">
                          {point.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </article>

            {/* Top industries */}
            <article className="emov-card">
              <div className="emov-card-header">
                <h2 className="emov-card-title">Top industries</h2>
                <p className="emov-card-subtitle">
                  Where your participants are coming from.
                </p>
              </div>
              <div className="emov-list emov-list--industry">
                {industryData.map((row) => {
                  const pct = Math.round(
                    (row.value / maxIndustry) * 100
                  );
                  return (
                    <div key={row.label} className="emov-list-row">
                      <div className="emov-list-main">
                        <span className="emov-list-label">
                          {row.label}
                        </span>
                        <span className="emov-list-value">
                          {row.value}
                        </span>
                      </div>
                      <div className="emov-progress-track">
                        <div
                          className="emov-progress-fill"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </article>
          </div>

          {/* Right column */}
          <div className="emov-col emov-col--right">
            {/* Audience segments */}
            <article className="emov-card">
              <div className="emov-card-header">
                <h2 className="emov-card-title">Audience segments</h2>
                <p className="emov-card-subtitle">
                  Distribution between attendees, exhibitors, speakers and VIPs.
                </p>
              </div>
              <div className="emov-segments">
                {segmentDistribution.map((seg) => (
                  <div
                    key={seg.name}
                    className="emov-segment-row"
                  >
                    <div className="emov-segment-left">
                      <span
                        className={
                          "emov-segment-dot emov-segment-dot--" +
                          seg.color
                        }
                      />
                      <span className="emov-segment-name">
                        {seg.name}
                      </span>
                    </div>
                    <span className="emov-segment-value">
                      {seg.value.toLocaleString("en-US")} participants
                    </span>
                  </div>
                ))}
              </div>
            </article>

            {/* Registration channels */}
            <article className="emov-card">
              <div className="emov-card-header">
                <h2 className="emov-card-title">Registration channels</h2>
                <p className="emov-card-subtitle">
                  Breakdown of how registrations are coming in.
                </p>
              </div>
              <div className="emov-list emov-list--channels">
                {channelData.map((row) => (
                  <div key={row.label} className="emov-list-row">
                    <div className="emov-list-main">
                      <span className="emov-list-label">
                        {row.label}
                      </span>
                      <span className="emov-list-value">
                        {row.value}%
                      </span>
                    </div>
                    <div className="emov-progress-track emov-progress-track--soft">
                      <div
                        className="emov-progress-fill emov-progress-fill--soft"
                        style={{ width: `${row.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </section>

        {/* Activity feed */}
        <section className="emov-card emov-card--activity">
          <div className="emov-card-header">
            <h2 className="emov-card-title">Recent activity</h2>
            <p className="emov-card-subtitle">
              Latest registrations, B2B meetings and updates across your
              event.
            </p>
          </div>
          <div className="emov-activity-list">
            {activities.map((item, idx) => (
              <div
                key={idx}
                className="emov-activity-item"
              >
                <div className="emov-activity-icon">
                  <div className="emov-activity-dot" />
                </div>
                <div className="emov-activity-main">
                  <p className="emov-activity-title">{item.title}</p>
                  <p className="emov-activity-company">
                    {item.company}
                  </p>
                </div>
                <span className="emov-activity-time">
                  {item.time}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default EventManagerOverviewPage;
