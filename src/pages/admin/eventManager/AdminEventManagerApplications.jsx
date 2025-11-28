// src/pages/admin/eventManager/AdminEventManagerApplications.jsx
import React, { useMemo, useState } from "react";
import {
  FiCheckCircle,
  FiClock,
  FiXCircle,
  FiSearch,
  FiFilter,
  FiMail,
  FiPhone,
  FiMapPin,
  FiCalendar,
  FiUsers,
} from "react-icons/fi";
import { useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import {
  useAdminListEventManagerApplicationsQuery,
  useAdminUpdateEventManagerApplicationStatusMutation,
} from "../../../features/eventManager/eventManagerApiSlice";
import "./admin-event-manager.css";

const STATUS_OPTIONS = ["All", "Pending", "Approved", "Rejected"];

const formatDate = (value) => {
  if (!value) return "-";
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
};

const AdminEventManagerApplications = () => {
  const [statusFilter, setStatusFilter] = useState("Pending");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [reviewNotes, setReviewNotes] = useState("");

  const { data, isLoading, isFetching, isError } =
    useAdminListEventManagerApplicationsQuery(statusFilter);

  const [updateStatus, { isLoading: isUpdating }] =
    useAdminUpdateEventManagerApplicationStatusMutation();

  const applications = data?.applications || [];

  const filteredApplications = useMemo(() => {
    if (!search.trim()) return applications;
    const term = search.toLowerCase();
    return applications.filter((a) => {
      const haystack = [
        a.orgName,
        a.eventName,
        a.planLabel,
        a.workEmail,
        a.phone,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [applications, search]);

  const selected = useMemo(
    () => filteredApplications.find((a) => a.id === selectedId) || null,
    [filteredApplications, selectedId]
  );

  // Auto-select first pending on load / filter change
  React.useEffect(() => {
    if (!selected && filteredApplications.length > 0) {
      setSelectedId(filteredApplications[0].id);
      setReviewNotes("");
    }
    if (filteredApplications.length === 0) {
      setSelectedId(null);
      setReviewNotes("");
    }
  }, [filteredApplications, selected]);

  const handleChangeStatus = async (nextStatus) => {
    if (!selected) return;

    const actionLabel =
      nextStatus === "Approved" ? "Approve application" : "Reject application";

    const ok = window.confirm(
      `${actionLabel} for "${selected.eventName}" by "${selected.orgName}"?`
    );
    if (!ok) return;

    try {
      await updateStatus({
        id: selected.id,
        status: nextStatus,
        reviewNotes: reviewNotes?.trim() || undefined,
      }).unwrap();

      toast.success(
        nextStatus === "Approved" ? "Application approved" : "Application rejected"
      );
      setReviewNotes("");
    } catch (err) {
      console.error("adminUpdateEventManagerApplicationStatus error", err);
      toast.error("Could not update application status.");
    }
  };

  return (
    <div className="admin-em-page">
      <div className="admin-em-header">
        <div>
          <h1 className="admin-em-title">Event Manager requests</h1>
          <p className="admin-em-sub">
            Review applications to become Event Manager. Approve only when
            details look legitimate and complete.
          </p>
        </div>
        <div className="admin-em-header-meta">
          {isFetching && <span className="admin-em-badge admin-em-badge--soft">Refreshing…</span>}
          <span className="admin-em-badge">
            {applications.length} request{applications.length !== 1 ? "s" : ""}{" "}
            loaded
          </span>
        </div>
      </div>

      <div className="admin-em-toolbar">
        <div className="admin-em-search">
          <FiSearch />
          <input
            type="text"
            placeholder="Search by organization, event, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="admin-em-filters">
          <div className="admin-em-status-filter">
            <FiFilter />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="admin-em-layout">
        <section className="admin-em-list-section">
          {isLoading ? (
            <div className="admin-em-skeleton-list">
              {[1, 2, 3].map((i) => (
                <div key={i} className="admin-em-skeleton-card" />
              ))}
            </div>
          ) : isError ? (
            <div className="admin-em-empty">
              <p>Could not load applications. Please retry.</p>
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className="admin-em-empty">
              <p>No applications with this filter.</p>
            </div>
          ) : (
            <ul className="admin-em-list">
              {filteredApplications.map((a) => {
                const isSelected = a.id === selectedId;
                return (
                  <li key={a.id}>
                    <button
                      type="button"
                      className={[
                        "admin-em-item",
                        isSelected ? "admin-em-item--selected" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      onClick={() => {
                        setSelectedId(a.id);
                        setReviewNotes("");
                      }}
                    >
                      <div className="admin-em-item-main">
                        <p className="admin-em-item-event">{a.eventName}</p>
                        <p className="admin-em-item-org">{a.orgName}</p>
                      </div>
                      <div className="admin-em-item-meta">
                        <span className="admin-em-item-plan">
                          {a.planLabel}
                        </span>
                        <span className="admin-em-item-date">
                          <FiClock />
                          {formatDate(a.createdAt)}
                        </span>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="admin-em-detail-section">
          {!selected ? (
            <div className="admin-em-detail-empty">
              <p>Select a request on the left to review its details.</p>
            </div>
          ) : (
            <div className="admin-em-detail-card">
              <div className="admin-em-detail-header">
                <div>
                  <p className="admin-em-detail-plan">{selected.planLabel}</p>
                  <h2 className="admin-em-detail-event">{selected.eventName}</h2>
                  <p className="admin-em-detail-org">{selected.orgName}</p>
                </div>
                <div className="admin-em-detail-status">
                  {selected.status === "Pending" && (
                    <span className="admin-em-status admin-em-status--pending">
                      <FiClock />
                      Pending
                    </span>
                  )}
                  {selected.status === "Approved" && (
                    <span className="admin-em-status admin-em-status--approved">
                      <FiCheckCircle />
                      Approved
                    </span>
                  )}
                  {selected.status === "Rejected" && (
                    <span className="admin-em-status admin-em-status--rejected">
                      <FiXCircle />
                      Rejected
                    </span>
                  )}
                  <p className="admin-em-detail-created">
                    Requested on {formatDate(selected.createdAt)}
                  </p>
                </div>
              </div>

              <div className="admin-em-detail-grid">
                <div className="admin-em-detail-block">
                  <h3>Contact & organization</h3>
                  <div className="admin-em-field-row">
                    <span className="admin-em-field-label">Organization</span>
                    <span className="admin-em-field-value">
                      {selected.orgName || "-"}
                    </span>
                  </div>
                  <div className="admin-em-field-row">
                    <span className="admin-em-field-label">Email</span>
                    <span className="admin-em-field-value admin-em-field-value--icon">
                      <FiMail />
                      {selected.workEmail || "-"}
                    </span>
                  </div>
                  <div className="admin-em-field-row">
                    <span className="admin-em-field-label">Phone</span>
                    <span className="admin-em-field-value admin-em-field-value--icon">
                      <FiPhone />
                      {selected.phone || "-"}
                    </span>
                  </div>
                  <div className="admin-em-field-row">
                    <span className="admin-em-field-label">Location</span>
                    <span className="admin-em-field-value admin-em-field-value--icon">
                      <FiMapPin />
                      {selected.city || selected.country
                        ? `${selected.city || ""}${
                            selected.city && selected.country ? ", " : ""
                          }${selected.country || ""}`
                        : "-"}
                    </span>
                  </div>
                </div>

                <div className="admin-em-detail-block">
                  <h3>Event summary</h3>
                  <div className="admin-em-field-row">
                    <span className="admin-em-field-label">Event</span>
                    <span className="admin-em-field-value">
                      {selected.eventName || "-"}
                    </span>
                  </div>
                  <div className="admin-em-field-row">
                    <span className="admin-em-field-label">Approx. date</span>
                    <span className="admin-em-field-value admin-em-field-value--icon">
                      <FiCalendar />
                      {selected.eventMonth || "-"}
                    </span>
                  </div>
                  <div className="admin-em-field-row">
                    <span className="admin-em-field-label">Expected size</span>
                    <span className="admin-em-field-value admin-em-field-value--icon">
                      <FiUsers />
                      {selected.expectedSize || "-"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="admin-em-detail-block">
                <h3>Sectors & notes</h3>
                <div className="admin-em-field-row">
                  <span className="admin-em-field-label">Main sectors</span>
                  <span className="admin-em-field-value">
                    {selected.sectors || "—"}
                  </span>
                </div>
                <div className="admin-em-field-row admin-em-field-row--stacked">
                  <span className="admin-em-field-label">Request notes</span>
                  <span className="admin-em-field-value admin-em-field-value--multiline">
                    {selected.notes || "No additional notes."}
                  </span>
                </div>
              </div>

              <div className="admin-em-review">
                <h3>Review & decision</h3>
                <textarea
                  className="admin-em-review-notes"
                  rows={3}
                  placeholder="Internal notes for this decision (optional, visible only to admins)."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                />
                <div className="admin-em-review-actions">
                  <button
                    type="button"
                    className="admin-em-btn admin-em-btn--reject"
                    disabled={isUpdating || selected.status === "Rejected"}
                    onClick={() => handleChangeStatus("Rejected")}
                  >
                    <FiXCircle />
                    Reject
                  </button>
                  <button
                    type="button"
                    className="admin-em-btn admin-em-btn--approve"
                    disabled={isUpdating || selected.status === "Approved"}
                    onClick={() => handleChangeStatus("Approved")}
                  >
                    <FiCheckCircle />
                    Approve
                  </button>
                </div>
                {selected.reviewedAt && (
                  <p className="admin-em-review-meta">
                    Already reviewed on {formatDate(selected.reviewedAt)}.
                  </p>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default AdminEventManagerApplications;
