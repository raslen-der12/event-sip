import React, { useMemo, useState } from "react";
import {
  FiZap,
  FiFilter,
  FiClock,
  FiBriefcase,
  FiVideo,
  FiCheck,
  FiX,
  FiSkipForward,
} from "react-icons/fi";
import "./event-manager-b2b.css";

const MEETINGS = [
  {
    id: 1,
    requester: {
      name: "Sarah Johnson",
      company: "TechCorp",
      role: "CTO",
      industry: "Technology",
      avatar: "👩‍💼",
    },
    receiver: {
      name: "Michael Chen",
      company: "Innovate",
      role: "CEO",
      industry: "Technology",
      avatar: "👨‍💼",
    },
    time: "10:00 – 10:30",
    date: "May 15, 2025",
    status: "confirmed",
    mode: "Physical",
  },
  {
    id: 2,
    requester: {
      name: "Emily Rodriguez",
      company: "Startup Hub",
      role: "Director",
      industry: "Innovation",
      avatar: "👩‍🔬",
    },
    receiver: {
      name: "David Park",
      company: "FinTech",
      role: "VP Product",
      industry: "Finance",
      avatar: "👨‍💻",
    },
    time: "11:00 – 11:30",
    date: "May 15, 2025",
    status: "pending",
    mode: "Online",
  },
  {
    id: 3,
    requester: {
      name: "Jennifer Smith",
      company: "Design Co",
      role: "Creative Director",
      industry: "Design",
      avatar: "👩‍🎨",
    },
    receiver: {
      name: "Alex Kumar",
      company: "DataFlow",
      role: "Analytics Lead",
      industry: "Analytics",
      avatar: "👨‍💼",
    },
    time: "14:00 – 14:30",
    date: "May 15, 2025",
    status: "canceled",
    mode: "Physical",
  },
  {
    id: 4,
    requester: {
      name: "Omar El Said",
      company: "MENA Trade",
      role: "Head of Growth",
      industry: "Trade",
      avatar: "👨‍💼",
    },
    receiver: {
      name: "Lisa Wang",
      company: "AI Labs",
      role: "COO",
      industry: "Technology",
      avatar: "👩‍🔬",
    },
    time: "15:00 – 15:30",
    date: "May 16, 2025",
    status: "confirmed",
    mode: "Online",
  },
];

const AI_MATCHES = [
  {
    id: "m1",
    person1: {
      name: "Robert Lee",
      company: "CloudSys",
      role: "Head of Platform",
      industry: "Cloud / AI",
      interests: ["AI", "Scalability", "Security"],
      avatar: "👨‍💼",
    },
    person2: {
      name: "Lisa Wang",
      company: "AI Labs",
      role: "COO",
      industry: "Artificial Intelligence",
      interests: ["AI", "Machine Learning", "Cloud"],
      avatar: "👩‍🔬",
    },
    score: 95,
    reason: "Both are focused on AI infrastructure and cloud-native products.",
  },
  {
    id: "m2",
    person1: {
      name: "Tom Anderson",
      company: "HealthTech",
      role: "Product Lead",
      industry: "Digital Health",
      interests: ["Digital Health", "IoT", "Data"],
      avatar: "👨‍⚕️",
    },
    person2: {
      name: "Maya Patel",
      company: "MedData",
      role: "Data Director",
      industry: "Healthcare Data",
      interests: ["Healthcare", "Data Science", "AI"],
      avatar: "👩‍💼",
    },
    score: 88,
    reason: "Strong overlap in healthcare and data, with complementary roles.",
  },
  {
    id: "m3",
    person1: {
      name: "Anna Müller",
      company: "GreenCity",
      role: "Sustainability Manager",
      industry: "Smart Cities",
      interests: ["Sustainability", "Smart Cities", "Mobility"],
      avatar: "👩‍💼",
    },
    person2: {
      name: "Youssef Ben Salah",
      company: "Urban Mobility Lab",
      role: "Founder",
      industry: "Mobility",
      interests: ["Mobility", "IoT", "Public-Private Partnerships"],
      avatar: "👨‍💼",
    },
    score: 82,
    reason:
      "City sustainability focus matches perfectly with mobility innovation.",
  },
];

const MODES = ["All modes", "Online", "Physical"];
const INDUSTRIES = [
  "All industries",
  "Technology",
  "Finance",
  "Innovation",
  "Design",
  "Analytics",
  "Trade",
  "Health",
  "Mobility",
];

function statusClasses(status) {
  if (status === "confirmed")
    return "em-b2bm-badge em-b2bm-badge--success";
  if (status === "pending")
    return "em-b2bm-badge em-b2bm-badge--warning";
  return "em-b2bm-badge em-b2bm-badge--danger";
}

export default function EventManagerB2BMeetingsPage() {
  const [showAIModal, setShowAIModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

  const [modeFilter, setModeFilter] = useState("All modes");
  const [industryFilter, setIndustryFilter] = useState("All industries");
  const [minScore, setMinScore] = useState("70");
  const [filtersApplied, setFiltersApplied] = useState(false);
  const [lastGenerated, setLastGenerated] = useState(null);

  const stats = useMemo(() => {
    const total = MEETINGS.length;
    const confirmed = MEETINGS.filter((m) => m.status === "confirmed").length;
    const pending = MEETINGS.filter((m) => m.status === "pending").length;
    const canceled = MEETINGS.filter((m) => m.status === "canceled").length;
    const rate = total ? Math.round((confirmed / total) * 100) : 0;
    return { total, confirmed, pending, canceled, rate };
  }, []);

  const filteredMeetings = useMemo(() => {
    return MEETINGS.filter((m) => {
      if (modeFilter !== "All modes" && m.mode !== modeFilter) return false;
      if (
        industryFilter !== "All industries" &&
        m.requester.industry !== industryFilter &&
        m.receiver.industry !== industryFilter
      ) {
        return false;
      }
      return true;
    });
  }, [modeFilter, industryFilter]);

  const filteredAiMatches = useMemo(() => {
    return AI_MATCHES.filter((match) => {
      if (
        industryFilter !== "All industries" &&
        match.person1.industry !== industryFilter &&
        match.person2.industry !== industryFilter
      ) {
        return false;
      }
      const min = parseInt(minScore || "0", 10);
      if (!Number.isNaN(min) && match.score < min) return false;
      return true;
    });
  }, [industryFilter, minScore]);

  const matchList = filtersApplied ? filteredAiMatches : AI_MATCHES;
  const safeIndex =
    matchList.length === 0
      ? 0
      : Math.min(currentMatchIndex, matchList.length - 1);
  const currentMatch = matchList.length > 0 ? matchList[safeIndex] : null;

  const handleApplyFilters = () => {
    setFiltersApplied(true);
    setCurrentMatchIndex(0);
  };

  const handleClearFilters = () => {
    setModeFilter("All modes");
    setIndustryFilter("All industries");
    setMinScore("70");
    setFiltersApplied(false);
    setCurrentMatchIndex(0);
  };

  const nextMatch = () => {
    if (matchList.length === 0) return;
    setCurrentMatchIndex((prev) => (prev + 1) % matchList.length);
  };

  const handleGenerateMeeting = () => {
    if (!currentMatch) return;
    setLastGenerated(currentMatch);
    // In the real app you would call your backend here.
  };

  return (
    <div className="em-b2bm-root">
      <div className="em-b2bm-inner">
        {/* Header */}
        <header className="em-b2bm-header">
          <div className="em-b2bm-header-main">
            <div className="em-b2bm-chip">
              <FiZap />
              <span>B2B matchmaking</span>
            </div>
            <h1 className="em-b2bm-title">Manage B2B matchmaking</h1>
            <p className="em-b2bm-sub">
              Control how attendees and exhibitors get matched, track
              confirmations and experiment with AI-powered suggestions.
            </p>
          </div>

          <div className="em-b2bm-header-side">
            <p className="em-b2bm-header-note">
              This layer is manager-only. In production you will plug your own
              algorithm, scoring rules and business logic.
            </p>
            <div className="em-b2bm-header-actions">
              <button
                type="button"
                className="em-b2bm-btn em-b2bm-btn--ghost"
                onClick={() => setShowConfigModal(true)}
              >
                <FiVideo />
                Video meeting config
              </button>
              <button
                type="button"
                className="em-b2bm-btn em-b2bm-btn--primary"
                onClick={() => {
                  setShowAIModal(true);
                  setCurrentMatchIndex(0);
                }}
              >
                <FiZap />
                Generate matches with AI
              </button>
            </div>
          </div>
        </header>

        {/* Stats */}
        <section className="em-b2bm-stats">
          <div className="em-b2bm-stat">
            <p className="em-b2bm-stat-label">Total meetings</p>
            <p className="em-b2bm-stat-value">{stats.total}</p>
            <p className="em-b2bm-stat-hint">
              Across all confirmed, pending and canceled.
            </p>
          </div>
          <div className="em-b2bm-stat">
            <p className="em-b2bm-stat-label">Confirmation rate</p>
            <p className="em-b2bm-stat-value em-b2bm-stat-value--success">
              {stats.rate}%
            </p>
            <p className="em-b2bm-stat-hint">
              Aim for 70–80% for a healthy schedule.
            </p>
          </div>
          <div className="em-b2bm-stat">
            <p className="em-b2bm-stat-label">Pending</p>
            <p className="em-b2bm-stat-value em-b2bm-stat-value--warning">
              {stats.pending}
            </p>
            <p className="em-b2bm-stat-hint">
              Waiting for at least one side to confirm.
            </p>
          </div>
          <div className="em-b2bm-stat">
            <p className="em-b2bm-stat-label">Canceled</p>
            <p className="em-b2bm-stat-value em-b2bm-stat-value--danger">
              {stats.canceled}
            </p>
            <p className="em-b2bm-stat-hint">
              Reuse these slots for last-minute matches.
            </p>
          </div>
        </section>

        {/* Filters + layout */}
        <section className="em-b2bm-main">
          <div className="em-b2bm-filters-row">
            <div className="em-b2bm-filters">
              <div className="em-b2bm-filter">
                <label className="em-b2bm-filter-label">Industry</label>
                <select
                  className="em-b2bm-select"
                  value={industryFilter}
                  onChange={(e) => setIndustryFilter(e.target.value)}
                >
                  {INDUSTRIES.map((ind) => (
                    <option key={ind} value={ind}>
                      {ind}
                    </option>
                  ))}
                </select>
              </div>
              <div className="em-b2bm-filter">
                <label className="em-b2bm-filter-label">Mode</label>
                <select
                  className="em-b2bm-select"
                  value={modeFilter}
                  onChange={(e) => setModeFilter(e.target.value)}
                >
                  {MODES.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div className="em-b2bm-filter">
                <label className="em-b2bm-filter-label">
                  Minimum AI score
                </label>
                <input
                  className="em-b2bm-input"
                  type="number"
                  min="0"
                  max="100"
                  value={minScore}
                  onChange={(e) => setMinScore(e.target.value)}
                />
              </div>
            </div>
            <div className="em-b2bm-filter-actions">
              <button
                type="button"
                className="em-b2bm-btn em-b2bm-btn--ghost-small"
                onClick={handleClearFilters}
              >
                Reset
              </button>
              <button
                type="button"
                className="em-b2bm-btn em-b2bm-btn--primary-small"
                onClick={handleApplyFilters}
              >
                <FiFilter />
                Apply filters
              </button>
            </div>
          </div>

          <div className="em-b2bm-layout">
            {/* Meetings table */}
            <div className="em-b2bm-card em-b2bm-card--main">
              <div className="em-b2bm-card-header">
                <div>
                  <h3 className="em-b2bm-card-title">Scheduled meetings</h3>
                  <p className="em-b2bm-card-caption">
                    This data is mock-only. In the real app it will come from
                    your backend.
                  </p>
                </div>
                <div className="em-b2bm-card-kpi">
                  <span className="em-b2bm-card-kpi-label">
                    Upcoming slot
                  </span>
                  <span className="em-b2bm-card-kpi-value">
                    {MEETINGS[0].time}
                  </span>
                </div>
              </div>

              <div className="em-b2bm-table-wrapper">
                <table className="em-b2bm-table">
                  <thead>
                    <tr>
                      <th>Request</th>
                      <th>Profiles</th>
                      <th>Mode</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMeetings.length === 0 && (
                      <tr>
                        <td colSpan={4}>
                          <div className="em-b2bm-empty">
                            No meetings match the current filters.
                          </div>
                        </td>
                      </tr>
                    )}

                    {filteredMeetings.map((meeting) => (
                      <tr key={meeting.id}>
                        <td>
                          <div className="em-b2bm-meeting-meta">
                            <div className="em-b2bm-meeting-id">
                              #{meeting.id}
                            </div>
                            <div className="em-b2bm-meeting-time">
                              <FiClock />
                              <span>{meeting.time}</span>
                            </div>
                            <div className="em-b2bm-meeting-date">
                              {meeting.date}
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="em-b2bm-profiles">
                            <div className="em-b2bm-profile">
                              <div className="em-b2bm-avatar">
                                {meeting.requester.avatar}
                              </div>
                              <div className="em-b2bm-profile-body">
                                <p className="em-b2bm-profile-name">
                                  {meeting.requester.name}
                                </p>
                                <p className="em-b2bm-profile-meta">
                                  {meeting.requester.company} ·{" "}
                                  {meeting.requester.role}
                                </p>
                              </div>
                            </div>
                            <div className="em-b2bm-profile-separator">
                              <span />
                              <FiBriefcase />
                              <span />
                            </div>
                            <div className="em-b2bm-profile">
                              <div className="em-b2bm-avatar em-b2bm-avatar--secondary">
                                {meeting.receiver.avatar}
                              </div>
                              <div className="em-b2bm-profile-body">
                                <p className="em-b2bm-profile-name">
                                  {meeting.receiver.name}
                                </p>
                                <p className="em-b2bm-profile-meta">
                                  {meeting.receiver.company} ·{" "}
                                  {meeting.receiver.role}
                                </p>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span
                            className={
                              meeting.mode === "Online"
                                ? "em-b2bm-mode em-b2bm-mode--online"
                                : "em-b2bm-mode em-b2bm-mode--physical"
                            }
                          >
                            {meeting.mode === "Online" && <FiVideo />}
                            {meeting.mode}
                          </span>
                        </td>
                        <td>
                          <span className={statusClasses(meeting.status)}>
                            {meeting.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {lastGenerated && (
                <div className="em-b2bm-generated-info">
                  Last AI match turned into a meeting:{" "}
                  <strong>
                    {lastGenerated.person1.name} &amp;{" "}
                    {lastGenerated.person2.name}
                  </strong>
                  . Hook this into your backend when you are ready.
                </div>
              )}
            </div>

            {/* Right side: AI summary */}
            <aside className="em-b2bm-card em-b2bm-card--side">
              <h3 className="em-b2bm-card-title">
                AI suggestions overview
              </h3>
              <p className="em-b2bm-card-caption">
                Preview how many high-score matches you can generate with your
                current filters.
              </p>

              <div className="em-b2bm-ai-summary">
                <div className="em-b2bm-ai-summary-item">
                  <span className="em-b2bm-ai-summary-label">
                    Total AI matches
                  </span>
                  <span className="em-b2bm-ai-summary-value">
                    {AI_MATCHES.length}
                  </span>
                </div>
                <div className="em-b2bm-ai-summary-item">
                  <span className="em-b2bm-ai-summary-label">
                    Matches after filters
                  </span>
                  <span className="em-b2bm-ai-summary-value">
                    {filteredAiMatches.length}
                  </span>
                </div>
              </div>

              <div className="em-b2bm-ai-bar">
                <div
                  className="em-b2bm-ai-bar-fill"
                  style={{
                    width:
                      AI_MATCHES.length === 0
                        ? "0%"
                        : `${Math.round(
                            (filteredAiMatches.length / AI_MATCHES.length) *
                              100
                          )}%`,
                  }}
                />
              </div>
              <p className="em-b2bm-ai-bar-label">
                Based on minimum score and selected industry.
              </p>

              <button
                type="button"
                className="em-b2bm-btn em-b2bm-btn--primary-wide"
                onClick={() => {
                  setShowAIModal(true);
                  setCurrentMatchIndex(0);
                }}
              >
                <FiZap />
                Open AI suggestions
              </button>

              <div className="em-b2bm-side-note">
                You can use this as a sandbox to test different strategies
                before applying them to your real matchmaking rules.
              </div>
            </aside>
          </div>
        </section>
      </div>

      {/* AI Matchmaking Modal */}
      {showAIModal && (
        <div
          className="em-b2bm-modal-backdrop"
          onClick={() => setShowAIModal(false)}
        >
          <div
            className="em-b2bm-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="em-b2bm-modal-header">
              <div>
                <h2 className="em-b2bm-modal-title">AI-powered match</h2>
                <p className="em-b2bm-modal-sub">
                  This is a fake AI example – in real life you will plug in your
                  own scoring logic and constraints.
                </p>
              </div>
              <button
                type="button"
                className="em-b2bm-modal-close"
                onClick={() => setShowAIModal(false)}
              >
                <FiX />
              </button>
            </div>

            <div className="em-b2bm-modal-body">
              {matchList.length === 0 && (
                <div className="em-b2bm-empty-modal">
                  No AI matches for the current filters. Try relaxing the
                  minimum score or switching the industry.
                </div>
              )}

              {currentMatch && (
                <>
                  <div className="em-b2bm-modal-top">
                    <div className="em-b2bm-modal-col">
                      <div className="em-b2bm-profile-large">
                        <div className="em-b2bm-avatar-large">
                          {currentMatch.person1.avatar}
                        </div>
                        <div>
                          <h3 className="em-b2bm-profile-large-name">
                            {currentMatch.person1.name}
                          </h3>
                          <p className="em-b2bm-profile-large-role">
                            {currentMatch.person1.role}
                          </p>
                        </div>
                      </div>

                      <div className="em-b2bm-profile-details">
                        <div className="em-b2bm-profile-detail-line">
                          <FiBriefcase />
                          <span>{currentMatch.person1.company}</span>
                        </div>
                        <div className="em-b2bm-profile-detail-block">
                          <span className="em-b2bm-detail-label">
                            Industry
                          </span>
                          <span className="em-b2bm-detail-value">
                            {currentMatch.person1.industry}
                          </span>
                        </div>
                        <div className="em-b2bm-profile-detail-block">
                          <span className="em-b2bm-detail-label">
                            Interests
                          </span>
                          <div className="em-b2bm-chips">
                            {currentMatch.person1.interests.map((tag) => (
                              <span
                                key={tag}
                                className="em-b2bm-chip-tag"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="em-b2bm-modal-center">
                      <div className="em-b2bm-score-circle">
                        <span className="em-b2bm-score-main">
                          {currentMatch.score}
                        </span>
                        <span className="em-b2bm-score-sub">/ 100</span>
                      </div>
                      <p className="em-b2bm-score-label">Match score</p>
                      <p className="em-b2bm-score-reason">
                        {currentMatch.reason}
                      </p>
                    </div>

                    <div className="em-b2bm-modal-col">
                      <div className="em-b2bm-profile-large">
                        <div className="em-b2bm-avatar-large em-b2bm-avatar-large--secondary">
                          {currentMatch.person2.avatar}
                        </div>
                        <div>
                          <h3 className="em-b2bm-profile-large-name">
                            {currentMatch.person2.name}
                          </h3>
                          <p className="em-b2bm-profile-large-role">
                            {currentMatch.person2.role}
                          </p>
                        </div>
                      </div>

                      <div className="em-b2bm-profile-details">
                        <div className="em-b2bm-profile-detail-line">
                          <FiBriefcase />
                          <span>{currentMatch.person2.company}</span>
                        </div>
                        <div className="em-b2bm-profile-detail-block">
                          <span className="em-b2bm-detail-label">
                            Industry
                          </span>
                          <span className="em-b2bm-detail-value">
                            {currentMatch.person2.industry}
                          </span>
                        </div>
                        <div className="em-b2bm-profile-detail-block">
                          <span className="em-b2bm-detail-label">
                            Interests
                          </span>
                          <div className="em-b2bm-chips">
                            {currentMatch.person2.interests.map((tag) => (
                              <span
                                key={tag}
                                className="em-b2bm-chip-tag"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="em-b2bm-modal-actions">
                    <button
                      type="button"
                      className="em-b2bm-action-btn em-b2bm-action-btn--muted"
                      onClick={nextMatch}
                    >
                      <FiSkipForward />
                      Skip
                    </button>
                    <button
                      type="button"
                      className="em-b2bm-action-btn em-b2bm-action-btn--danger"
                      onClick={nextMatch}
                    >
                      <FiX />
                      Decline
                    </button>
                    <button
                      type="button"
                      className="em-b2bm-action-btn em-b2bm-action-btn--primary"
                      onClick={handleGenerateMeeting}
                    >
                      <FiCheck />
                      Generate meeting
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Video config modal */}
      {showConfigModal && (
        <div
          className="em-b2bm-modal-backdrop"
          onClick={() => setShowConfigModal(false)}
        >
          <div
            className="em-b2bm-modal em-b2bm-modal--small"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="em-b2bm-modal-header em-b2bm-modal-header--light">
              <div>
                <h2 className="em-b2bm-modal-title">
                  Video meeting configuration
                </h2>
                <p className="em-b2bm-modal-sub">
                  These settings only affect how links and durations are
                  suggested. Your real app will override them.
                </p>
              </div>
              <button
                type="button"
                className="em-b2bm-modal-close"
                onClick={() => setShowConfigModal(false)}
              >
                <FiX />
              </button>
            </div>

            <div className="em-b2bm-modal-body em-b2bm-modal-body--form">
              <div className="em-b2bm-field">
                <label className="em-b2bm-label">Default provider</label>
                <select className="em-b2bm-input">
                  <option>Google Meet</option>
                  <option>Zoom</option>
                  <option>Microsoft Teams</option>
                </select>
              </div>

              <div className="em-b2bm-field">
                <label className="em-b2bm-label">
                  Default meeting duration
                </label>
                <select className="em-b2bm-input">
                  <option>30 minutes</option>
                  <option>45 minutes</option>
                  <option>60 minutes</option>
                </select>
              </div>

              <div className="em-b2bm-field">
                <label className="em-b2bm-label">
                  Meeting link format (example)
                </label>
                <input
                  className="em-b2bm-input"
                  type="text"
                  disabled
                  value="meet.google.com/xxx-xxxx-xxx"
                />
              </div>

              <div className="em-b2bm-config-options">
                <label className="em-b2bm-config-checkbox">
                  <input type="checkbox" defaultChecked />
                  <span>Auto-send calendar invitation to both sides</span>
                </label>
                <label className="em-b2bm-config-checkbox">
                  <input type="checkbox" defaultChecked />
                  <span>Send email reminder 24 hours before</span>
                </label>
                <label className="em-b2bm-config-checkbox">
                  <input type="checkbox" />
                  <span>Send SMS reminder 1 hour before</span>
                </label>
              </div>

              <div className="em-b2bm-modal-actions em-b2bm-modal-actions--right">
                <button
                  type="button"
                  className="em-b2bm-btn em-b2bm-btn--ghost-small"
                  onClick={() => setShowConfigModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="em-b2bm-btn em-b2bm-btn--primary-small"
                  onClick={() => setShowConfigModal(false)}
                >
                  Save configuration
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
