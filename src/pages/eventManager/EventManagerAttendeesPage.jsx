// src/pages/eventManager/EventManagerAttendeesPage.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  FiSearch,
  FiFilter,
  FiDownload,
  FiMail,
  FiMoreVertical,
  FiUsers,
  FiPackage,
  FiCalendar,
  FiCheckCircle,
  FiAlertCircle,
} from "react-icons/fi";
import "./event-manager-attendees.css";

const MOCK_ATTENDEES = [
  {
    id: 1,
    name: "Sarah Johnson",
    email: "sarah.johnson@innovationhub.com",
    company: "Innovation Hub Africa",
    role: "CEO",
    status: "validated",
    ticketType: "VIP",
    registrationDate: "2025-02-10",
    meetings: 8,
    segment: "Attendees",
  },
  {
    id: 2,
    name: "James Carter",
    email: "j.carter@fintrade.io",
    company: "FinTrade.io",
    role: "Investment Manager",
    status: "pending",
    ticketType: "Standard",
    registrationDate: "2025-02-12",
    meetings: 2,
    segment: "VIPs",
  },
  {
    id: 3,
    name: "Amina Ben Ali",
    email: "amina.benali@meditech.tn",
    company: "Meditech Tunisia",
    role: "Business Developer",
    status: "validated",
    ticketType: "Exhibitor",
    registrationDate: "2025-02-09",
    meetings: 5,
    segment: "Exhibitors",
  },
  {
    id: 4,
    name: "Lucas Moreau",
    email: "lucas.moreau@enterprisesolutions.fr",
    company: "Enterprise Solutions",
    role: "VP Engineering",
    status: "validated",
    ticketType: "VIP",
    registrationDate: "2025-01-10",
    meetings: 12,
    segment: "VIPs",
  },
  {
    id: 5,
    name: "Dr. Robert Smith",
    email: "robert.smith@university.edu",
    company: "Tech University",
    role: "Professor",
    status: "invited",
    ticketType: "Speaker",
    registrationDate: "2025-02-03",
    meetings: 0,
    segment: "Speakers",
  },
  {
    id: 6,
    name: "Noura El Fassi",
    email: "noura.elfassi@greenfuture.org",
    company: "Green Future NGO",
    role: "Program Manager",
    status: "validated",
    ticketType: "NGO Pass",
    registrationDate: "2025-02-01",
    meetings: 3,
    segment: "Attendees",
  },
];

const statusConfig = {
  validated: {
    label: "Validated",
    className: "ema-status ema-status--validated",
  },
  pending: {
    label: "Pending",
    className: "ema-status ema-status--pending",
  },
  invited: {
    label: "Invited",
    className: "ema-status ema-status--invited",
  },
  rejected: {
    label: "Rejected",
    className: "ema-status ema-status--rejected",
  },
};

const EventManagerAttendeesPage = () => {
  // rows are mutable (for accept/refuse)
  const [attendees, setAttendees] = useState(MOCK_ATTENDEES);

  // filters / search / sort
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [segmentFilter, setSegmentFilter] = useState("all");
  const [ticketFilter, setTicketFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name-asc");

  // selection
  const [selectedIds, setSelectedIds] = useState([]);
  const headerCheckboxRef = useRef(null);

  // row menu
  const [openMenuId, setOpenMenuId] = useState(null);

  // --- DERIVED STATS --------------------------------------------------------

  const stats = useMemo(() => {
    const total = attendees.length;
    const validated = attendees.filter((a) => a.status === "validated").length;
    const pending = attendees.filter((a) => a.status === "pending").length;
    const vip = attendees.filter((a) => a.ticketType === "VIP").length;
    const meetingsTotal = attendees.reduce(
      (sum, a) => sum + (a.meetings || 0),
      0
    );
    return { total, validated, pending, vip, meetingsTotal };
  }, [attendees]);

  const segmentOptions = useMemo(() => {
    const set = new Set(attendees.map((a) => a.segment));
    return ["Attendees", "Speakers", "Exhibitors", "VIPs"].filter((s) =>
      set.has(s)
    );
  }, [attendees]);

  const ticketOptions = useMemo(() => {
    const set = new Set(attendees.map((a) => a.ticketType));
    return Array.from(set);
  }, [attendees]);

  const filtered = useMemo(() => {
    let list = [...attendees];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((a) => {
        return (
          a.name.toLowerCase().includes(q) ||
          a.email.toLowerCase().includes(q) ||
          a.company.toLowerCase().includes(q)
        );
      });
    }

    if (statusFilter !== "all") {
      list = list.filter((a) => a.status === statusFilter);
    }

    if (segmentFilter !== "all") {
      list = list.filter((a) => a.segment === segmentFilter);
    }

    if (ticketFilter !== "all") {
      list = list.filter((a) => a.ticketType === ticketFilter);
    }

    switch (sortBy) {
      case "name-asc":
        list.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "name-desc":
        list.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case "date-newest":
        list.sort(
          (a, b) =>
            new Date(b.registrationDate) - new Date(a.registrationDate)
        );
        break;
      case "date-oldest":
        list.sort(
          (a, b) =>
            new Date(a.registrationDate) - new Date(b.registrationDate)
        );
        break;
      case "meetings-desc":
        list.sort((a, b) => (b.meetings || 0) - (a.meetings || 0));
        break;
      default:
        break;
    }

    return list;
  }, [attendees, search, statusFilter, segmentFilter, ticketFilter, sortBy]);

  // selection derived
  const allVisibleSelected =
    filtered.length > 0 &&
    filtered.every((a) => selectedIds.includes(a.id));
  const someVisibleSelected =
    filtered.some((a) => selectedIds.includes(a.id)) &&
    !allVisibleSelected;

  useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate = someVisibleSelected;
    }
  }, [someVisibleSelected]);

  // --- SELECTION HANDLERS ---------------------------------------------------

  const handleToggleSelectAll = () => {
    if (allVisibleSelected) {
      // unselect all visible
      const visibleIds = filtered.map((a) => a.id);
      setSelectedIds((prev) =>
        prev.filter((id) => !visibleIds.includes(id))
      );
    } else {
      // select all visible
      const visibleIds = filtered.map((a) => a.id);
      setSelectedIds(visibleIds);
    }
  };

  const handleToggleRowSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleBulkUpdateStatus = (newStatus) => {
    if (!selectedIds.length) return;
    setAttendees((prev) =>
      prev.map((a) =>
        selectedIds.includes(a.id) ? { ...a, status: newStatus } : a
      )
    );
    setSelectedIds([]);
    setOpenMenuId(null);
  };

  const handleRowUpdateStatus = (id, newStatus) => {
    setAttendees((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a))
    );
    setOpenMenuId(null);
  };

  // --- RENDER ---------------------------------------------------------------

  return (
    <div className="ema-root">
      <div className="ema-inner container">
        {/* Header */}
        <header className="ema-header">
          <div className="ema-header-left">
            <div className="ema-badge">
              <FiUsers className="ema-badge-icon" />
              <span>Event manager • Attendees</span>
            </div>
            <div className="ema-title-row">
              <h1 className="ema-title">Attendees overview</h1>
              <span className="ema-live-pill">
                <span className="ema-live-dot" />
                Live event workspace
              </span>
            </div>
            <p className="ema-subtitle">
              See who registered, their status and activity. Use filters to
              focus on VIPs, exhibitors, speakers or active B2B participants.
            </p>
          </div>

          <div className="ema-header-actions">
            <button type="button" className="ema-btn ema-btn--ghost">
              <FiDownload className="ema-btn-icon" />
              <span>Export CSV</span>
            </button>
            <button type="button" className="ema-btn ema-btn--primary">
              <FiMail className="ema-btn-icon" />
              <span>Email selected</span>
            </button>
          </div>
        </header>

        {/* KPIs */}
        <section className="ema-kpi-grid">
          <article className="ema-kpi-card">
            <div className="ema-kpi-header">
              <div className="ema-kpi-title">
                <FiUsers className="ema-kpi-icon ema-kpi-icon--indigo" />
                <span>Total attendees</span>
              </div>
            </div>
            <div className="ema-kpi-value">{stats.total}</div>
            <p className="ema-kpi-caption">
              Across all segments (attendees, exhibitors, speakers, VIPs).
            </p>
          </article>

          <article className="ema-kpi-card">
            <div className="ema-kpi-header">
              <div className="ema-kpi-title">
                <FiCheckCircle className="ema-kpi-icon ema-kpi-icon--green" />
                <span>Validated</span>
              </div>
            </div>
            <div className="ema-kpi-value">{stats.validated}</div>
            <p className="ema-kpi-caption">
              Ready to access the event and B2B meetings.
            </p>
          </article>

          <article className="ema-kpi-card">
            <div className="ema-kpi-header">
              <div className="ema-kpi-title">
                <FiAlertCircle className="ema-kpi-icon ema-kpi-icon--amber" />
                <span>Pending review</span>
              </div>
            </div>
            <div className="ema-kpi-value">{stats.pending}</div>
            <p className="ema-kpi-caption">
              Applications waiting for manual validation.
            </p>
          </article>

          <article className="ema-kpi-card">
            <div className="ema-kpi-header">
              <div className="ema-kpi-title">
                <FiUsers className="ema-kpi-icon ema-kpi-icon--slate" />
                <span>VIP & meetings</span>
              </div>
            </div>
            <div className="ema-kpi-value-row">
              <span className="ema-kpi-value">{stats.vip}</span>
              <span className="ema-kpi-chip">VIP passes</span>
            </div>
            <p className="ema-kpi-caption">
              Total meetings booked:{" "}
              <span className="ema-kpi-strong">{stats.meetingsTotal}</span>.
            </p>
          </article>
        </section>

        {/* Filters + Table */}
        <section className="ema-main-card">
          {/* Filters row */}
          <div className="ema-filters-row">
            <div className="ema-filters-left">
              <div className="ema-search">
                <FiSearch className="ema-search-icon" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, email or company…"
                />
              </div>

              <div className="ema-status-chips">
                {[
                  { id: "all", label: "All" },
                  { id: "validated", label: "Validated" },
                  { id: "pending", label: "Pending" },
                  { id: "invited", label: "Invited" },
                  { id: "rejected", label: "Rejected" },
                ].map((opt) => {
                  const active = statusFilter === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setStatusFilter(opt.id)}
                      className={
                        "ema-chip " + (active ? "ema-chip--active" : "")
                      }
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="ema-filters-right">
              <div className="ema-filter-group">
                <FiFilter className="ema-filter-icon" />
                <span className="ema-filter-label">Segment</span>
                <select
                  value={segmentFilter}
                  onChange={(e) => setSegmentFilter(e.target.value)}
                >
                  <option value="all">All segments</option>
                  {segmentOptions.map((seg) => (
                    <option key={seg} value={seg}>
                      {seg}
                    </option>
                  ))}
                </select>
              </div>

              <div className="ema-filter-group">
                <span className="ema-filter-label">Ticket</span>
                <select
                  value={ticketFilter}
                  onChange={(e) => setTicketFilter(e.target.value)}
                >
                  <option value="all">All types</option>
                  {ticketOptions.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div className="ema-filter-group">
                <span className="ema-filter-label">Sort</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="name-asc">Name A → Z</option>
                  <option value="name-desc">Name Z → A</option>
                  <option value="date-newest">Newest registrations</option>
                  <option value="date-oldest">Oldest registrations</option>
                  <option value="meetings-desc">Most meetings</option>
                </select>
              </div>
            </div>
          </div>

          {/* Bulk actions bar – appears only when some selected */}
          {selectedIds.length > 0 && (
            <div className="ema-bulk-bar">
              <span className="ema-bulk-label">
                {selectedIds.length} attendee
                {selectedIds.length > 1 ? "s" : ""} selected
              </span>
              <div className="ema-bulk-actions">
                <button
                  type="button"
                  className="ema-btn ema-btn--ghost"
                  onClick={() => handleBulkUpdateStatus("validated")}
                >
                  Accept attendees
                </button>
                <button
                  type="button"
                  className="ema-btn ema-btn--danger"
                  onClick={() => handleBulkUpdateStatus("rejected")}
                >
                  Refuse attendees
                </button>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="ema-table-shell">
            <div className="ema-table-scroll">
              <table className="ema-table">
                <thead>
                  <tr>
                    <th>
                      <input
                        ref={headerCheckboxRef}
                        type="checkbox"
                        className="ema-checkbox"
                        checked={allVisibleSelected}
                        onChange={handleToggleSelectAll}
                      />
                    </th>
                    <th>Attendee</th>
                    <th>Company</th>
                    <th>Status</th>
                    <th>Ticket</th>
                    <th>Registered</th>
                    <th>Meetings</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((a) => {
                    const cfg =
                      statusConfig[a.status] || statusConfig.pending;
                    const initials = a.name
                      .split(" ")
                      .map((p) => p[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase();

                    const isSelected = selectedIds.includes(a.id);

                    return (
                      <tr key={a.id} className={isSelected ? "ema-row--selected" : ""}>
                        <td>
                          <input
                            type="checkbox"
                            className="ema-checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleRowSelect(a.id)}
                          />
                        </td>
                        <td>
                          <div className="ema-person">
                            <div className="ema-avatar">
                              <span>{initials}</span>
                            </div>
                            <div className="ema-person-text">
                              <div className="ema-person-name">
                                {a.name}
                              </div>
                              <div className="ema-person-email">
                                {a.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="ema-company">
                            <div className="ema-company-main">
                              <FiPackage className="ema-company-icon" />
                              <span>{a.company}</span>
                            </div>
                            <div className="ema-company-role">
                              {a.role}
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={cfg.className}>
                            <span className="ema-status-dot" />
                            {cfg.label}
                          </span>
                        </td>
                        <td>
                          <span className="ema-ticket-pill">
                            {a.ticketType}
                          </span>
                        </td>
                        <td>
                          <div className="ema-date">
                            <FiCalendar className="ema-date-icon" />
                            <span>{a.registrationDate}</span>
                          </div>
                        </td>
                        <td>
                          <span className="ema-meetings-pill">
                            <FiUsers className="ema-meetings-icon" />
                            <span>{a.meetings}</span>
                          </span>
                        </td>
                        <td>
                          <div className="ema-row-menu-wrapper">
                            <button
                              type="button"
                              className="ema-row-more"
                              onClick={() =>
                                setOpenMenuId(
                                  openMenuId === a.id ? null : a.id
                                )
                              }
                            >
                              <FiMoreVertical />
                            </button>

                            {openMenuId === a.id && (
                              <div className="ema-row-menu">
                                <button
                                  type="button"
                                  className="ema-row-menu-item"
                                >
                                  <span className="ema-row-menu-bullet ema-row-menu-bullet--neutral" />
                                  <span>View profile</span>
                                </button>
                                <button
                                  type="button"
                                  className="ema-row-menu-item"
                                >
                                  <span className="ema-row-menu-bullet ema-row-menu-bullet--neutral" />
                                  <span>Open meetings</span>
                                </button>

                                <div className="ema-row-menu-divider" />

                                <button
                                  type="button"
                                  className="ema-row-menu-item"
                                  onClick={() =>
                                    handleRowUpdateStatus(
                                      a.id,
                                      "validated"
                                    )
                                  }
                                >
                                  <span className="ema-row-menu-bullet ema-row-menu-bullet--success" />
                                  <span>Mark as validated</span>
                                </button>
                                <button
                                  type="button"
                                  className="ema-row-menu-item ema-row-menu-item--danger"
                                  onClick={() =>
                                    handleRowUpdateStatus(
                                      a.id,
                                      "rejected"
                                    )
                                  }
                                >
                                  <span className="ema-row-menu-bullet ema-row-menu-bullet--danger" />
                                  <span>Reject attendee</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={8} className="ema-empty">
                        No attendees match your filters. Try clearing
                        some filters or search with a different keyword.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default EventManagerAttendeesPage;
