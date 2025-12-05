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
  FiClock,
  FiMapPin,
  FiPieChart,
  FiGlobe,
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

const todaySnapshot = {
  sessions: 9,
  meetings: 136,
  checkIns: 812,
  checkInRate: "67%",
  busiestSlot: "10:30–11:30",
  room: "Meetings Zone A",
};

const daysSummary = [
  {
    day: "Day 1",
    date: "Mar 15",
    label: "Opening & keynotes",
    registrations: 1024,
    meetings: 132,
    checkInRate: "58%",
  },
  {
    day: "Day 2",
    date: "Mar 16",
    label: "B2B meetings & expo",
    registrations: 1820,
    meetings: 196,
    checkInRate: "64%",
  },
  {
    day: "Day 3",
    date: "Mar 17",
    label: "Investor sessions",
    registrations: 2847,
    meetings: 228,
    checkInRate: "71%",
  },
];

const checkInsByHour = [
  { label: "09h", value: 42 },
  { label: "10h", value: 96 },
  { label: "11h", value: 128 },
  { label: "12h", value: 84 },
  { label: "13h", value: 73 },
  { label: "14h", value: 118 },
  { label: "15h", value: 135 },
  { label: "16h", value: 102 },
];

const meetingTypes = [
  { label: "On-site meetings", value: 52 },
  { label: "Virtual meetings", value: 31 },
  { label: "Hybrid meetings", value: 17 },
];

const topCountries = [
  { label: "Tunisia", value: 640 },
  { label: "France", value: 412 },
  { label: "Morocco", value: 285 },
  { label: "Germany", value: 216 },
  { label: "UAE", value: 188 },
];

const typeConfig = {
  registration: {
    label: "Registration",
    className: "emov-activity-tag--reg",
    Icon: FiUsers,
  },
  meeting: {
    label: "Meeting",
    className: "emov-activity-tag--meet",
    Icon: FiCheck,
  },
  exhibitor: {
    label: "Exhibitor",
    className: "emov-activity-tag--exh",
    Icon: FiBriefcase,
  },
  speaker: {
    label: "Speaker",
    className: "emov-activity-tag--speak",
    Icon: FiCalendar,
  },
};

const BAR_MAX_HEIGHT = 120; // px for big chart
const BAR_SMALL_MAX_HEIGHT = 110; // px for small chart

const EventManagerOverviewPage = () => {
  const safeMax = (values) => {
    const m = Math.max(...values);
    return m > 0 ? m : 1;
  };

  const maxRegistration = safeMax(registrationTrend.map((p) => p.value));
  const maxIndustry = safeMax(industryData.map((i) => i.value));
  const maxCheckIns = safeMax(checkInsByHour.map((h) => h.value));
  const maxCountry = safeMax(topCountries.map((c) => c.value));
  const totalMeetingsType =
    meetingTypes.reduce((acc, m) => acc + m.value, 0) || 1;

  // --- Line chart points for registrations (0–100 SVG space) ---
  const linePoints = registrationTrend
    .map((p, idx) => {
      const x =
        registrationTrend.length === 1
          ? 0
          : (idx / (registrationTrend.length - 1)) * 100;
      const y = 100 - (p.value / maxRegistration) * 100;
      return `${x},${y}`;
    })
    .join(" ");

  // --- Pie chart gradient for meeting types (conic-gradient) ---
  let pieOffset = 0;
  const pieGradientStops = meetingTypes
    .map((seg) => {
      const start = pieOffset;
      const end =
        pieOffset +
        Math.round((seg.value / totalMeetingsType) * 100);
      pieOffset = end;

      const key = seg.label.startsWith("On-site")
        ? "onsite"
        : seg.label.startsWith("Virtual")
        ? "virtual"
        : "hybrid";

      const color =
        key === "onsite"
          ? "#6366f1"
          : key === "virtual"
          ? "#22c55e"
          : "#f97316";

      return `${color} ${start}% ${end}%`;
    })
    .join(", ");

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

            {/* Filter chips */}
            <div className="emov-status-row" style={{ marginTop: 6, gap: 4 }}>
              <button
                type="button"
                className="emov-status-pill"
                style={{
                  borderColor: "#6366f1",
                  color: "#4338ca",
                  background: "#eef2ff",
                  fontWeight: 500,
                }}
              >
                This event
              </button>
              <button type="button" className="emov-status-pill">
                All events
              </button>
              <button type="button" className="emov-status-pill">
                Today only
              </button>
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
                <div className={"emov-kpi-icon emov-kpi-icon--" + kpi.color}>
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

        {/* MAIN GRID */}
        <section className="emov-main-grid">
          {/* LEFT COLUMN: all main charts + days + small activity */}
          <div className="emov-col">
            {/* Registrations over time (bars) */}
            <article className="emov-card">
              <div className="emov-card-header">
                <h2 className="emov-card-title">Registrations over time</h2>
                <p className="emov-card-subtitle">
                  Weekly cumulative registrations for this event.
                </p>
              </div>

              {/* Today snapshot */}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 6,
                  marginBottom: 8,
                }}
              >
                <div className="emov-chip-inline">
                  <FiClock style={{ width: 13, height: 13 }} />
                  Today: <strong>{todaySnapshot.sessions}</strong> sessions ·{" "}
                  <strong>{todaySnapshot.meetings}</strong> meetings
                </div>
                <div className="emov-chip-inline">
                  <FiMapPin style={{ width: 13, height: 13 }} />
                  Busiest slot: {todaySnapshot.busiestSlot} ·{" "}
                  {todaySnapshot.room}
                </div>
              </div>

              <div className="emov-chart">
                <div className="emov-chart-body">
                  {registrationTrend.map((point) => {
                    const bar =
                      (point.value / maxRegistration) * BAR_MAX_HEIGHT;
                    const barHeight = Math.max(8, bar);
                    return (
                      <div key={point.label} className="emov-chart-bar-item">
                        <div
                          className="emov-chart-bar"
                          style={{ height: `${barHeight}px` }}
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

            {/* Registration trend (line chart) */}
            <article className="emov-card">
              <div className="emov-card-header">
                <h2 className="emov-card-title">Registration trend (line)</h2>
                <p className="emov-card-subtitle">
                  Line view of cumulative registrations across weeks.
                </p>
              </div>
              <div className="emov-line-chart-wrapper">
                <svg
                  className="emov-line-chart"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                >
                  <polyline
                    className="emov-line-path"
                    points={linePoints}
                  />
                </svg>
                <div className="emov-line-chart-labels">
                  {registrationTrend.map((p) => (
                    <span
                      key={p.label}
                      className="emov-line-chart-label"
                    >
                      {p.label}
                    </span>
                  ))}
                </div>
              </div>
            </article>

            {/* Check-ins throughout the day (bars) */}
            <article className="emov-card">
              <div className="emov-card-header">
                <h2 className="emov-card-title">Check-ins throughout the day</h2>
                <p className="emov-card-subtitle">
                  Live check-ins by hour for the current event day.
                </p>
              </div>
              <div className="emov-chart">
                <div className="emov-chart-body emov-chart-body--compact">
                  {checkInsByHour.map((slot) => {
                    const bar =
                      (slot.value / maxCheckIns) * BAR_SMALL_MAX_HEIGHT;
                    const barHeight = Math.max(8, bar);
                    return (
                      <div key={slot.label} className="emov-chart-bar-item">
                        <div
                          className="emov-chart-bar emov-chart-bar--green"
                          style={{ height: `${barHeight}px` }}
                        />
                        <span className="emov-chart-bar-label">
                          {slot.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </article>

            {/* Event days at a glance */}
            <article className="emov-card">
              <div className="emov-card-header">
                <h2 className="emov-card-title">Event days at a glance</h2>
                <p className="emov-card-subtitle">
                  High-level view of how each event day is performing.
                </p>
              </div>
              <div className="emov-list">
                {daysSummary.map((day) => (
                  <div key={day.day} className="emov-list-row">
                    <div className="emov-list-main">
                      <div className="emov-days-label-row">
                        <span className="emov-days-pill">
                          {day.day} · {day.date}
                        </span>
                        <span className="emov-days-text">
                          {day.label}
                        </span>
                      </div>
                      <span className="emov-days-metrics">
                        {day.registrations.toLocaleString("en-US")} regs ·{" "}
                        {day.meetings} meetings · check-in {day.checkInRate}
                      </span>
                    </div>
                    <div className="emov-progress-track emov-progress-track--soft">
                      <div
                        className="emov-progress-fill emov-progress-fill--soft"
                        style={{
                          width: day.checkInRate.replace("%", "") + "%",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </article>

            {/* Recent activity – SMALL card under event days */}
            <article className="emov-card emov-card--activity-small">
              <div className="emov-card-header">
                <h2 className="emov-card-title">Recent activity</h2>
                <p className="emov-card-subtitle">
                  Latest registrations and B2B updates.
                </p>
              </div>
              <div className="emov-activity-list emov-activity-list--compact">
                {activities.slice(0, 3).map((item, idx) => (
                  <div key={idx} className="emov-activity-item">
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
            </article>
          </div>

          {/* RIGHT COLUMN: segments, channels, industries, pie, countries */}
          <div className="emov-col">
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
                  <div key={seg.name} className="emov-segment-row">
                    <div className="emov-segment-left">
                      <span
                        className={
                          "emov-segment-dot emov-segment-dot--" + seg.color
                        }
                      />
                      <span className="emov-segment-name">{seg.name}</span>
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
                      <span className="emov-list-label">{row.label}</span>
                      <span className="emov-list-value">{row.value}%</span>
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
                  const pct = Math.round((row.value / maxIndustry) * 100);
                  return (
                    <div key={row.label} className="emov-list-row">
                      <div className="emov-list-main">
                        <span className="emov-list-label">{row.label}</span>
                        <span className="emov-list-value">{row.value}</span>
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

            {/* Meeting types (PIE chart) */}
            <article className="emov-card">
              <div className="emov-card-header">
                <h2 className="emov-card-title">
                  <span className="emov-card-title-with-icon">
                    <FiPieChart className="emov-card-title-icon emov-card-title-icon--indigo" />
                    Meeting types (pie)
                  </span>
                </h2>
                <p className="emov-card-subtitle">
                  Distribution across on-site, virtual and hybrid meetings.
                </p>
              </div>
              <div className="emov-pie-wrapper">
                <div
                  className="emov-pie-circle"
                  style={{
                    backgroundImage: `conic-gradient(${pieGradientStops})`,
                  }}
                >
                  <div className="emov-pie-center">100%</div>
                </div>
                <div className="emov-pie-legend">
                  {meetingTypes.map((row) => {
                    const pct = Math.round(
                      (row.value / totalMeetingsType) * 100
                    );
                    const key = row.label.startsWith("On-site")
                      ? "onsite"
                      : row.label.startsWith("Virtual")
                      ? "virtual"
                      : "hybrid";
                    return (
                      <div
                        key={row.label}
                        className="emov-pie-legend-item"
                      >
                        <span
                          className={
                            "emov-pie-dot emov-pie-dot--" + key
                          }
                        />
                        <span className="emov-pie-legend-label">
                          {row.label}
                        </span>
                        <span className="emov-pie-legend-value">
                          {pct}% ({row.value})
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </article>

            {/* Top countries */}
            <article className="emov-card">
              <div className="emov-card-header">
                <h2 className="emov-card-title">
                  <span className="emov-card-title-with-icon">
                    <FiGlobe className="emov-card-title-icon emov-card-title-icon--blue" />
                    Top countries
                  </span>
                </h2>
                <p className="emov-card-subtitle">
                  Countries with the highest number of participants.
                </p>
              </div>
              <div className="emov-list">
                {topCountries.map((row) => {
                  const pct = Math.round((row.value / maxCountry) * 100);
                  return (
                    <div key={row.label} className="emov-list-row">
                      <div className="emov-list-main">
                        <span className="emov-list-label">{row.label}</span>
                        <span className="emov-list-value">{row.value}</span>
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
        </section>
      </div>
    </div>
  );
};

export default EventManagerOverviewPage;
