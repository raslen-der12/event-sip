// src/pages/meetings/MeetingsPage.jsx
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiChevronLeft, FiChevronRight, FiCalendar, FiClock, FiUser, FiMail,
  FiCornerUpRight, FiXCircle, FiCheckCircle, FiMessageSquare, FiRefreshCw,
  FiTrash2, FiMapPin, FiTag
} from "react-icons/fi";

import {
  useGetMeetingsQuery,
  useGetSuggestedListQuery,
  useMakeMeetingActionMutation,   // ⬅ NEW
} from "../../features/meetings/meetingsApiSlice";

import { useGetEventQuery } from "../../features/events/eventsApiSlice";

import "./meetings.css";
import Footer from "../../components/footer/Footer";
import { cta, footerData, nav, topbar } from "../main.mock";
import HeaderShell from "../../components/layout/HeaderShell";
import useAuth from "../../lib/hooks/useAuth";

/* ------------------------ UTILITIES ------------------------ */
const fmtDay = (iso) => {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
};
const fmtTime = (iso) => {
  try {
    return new Date(iso).toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
};

const whereStr = (ev) => [ev?.city, ev?.country].filter(Boolean).join(", ");
const compactB2X = (s = "") => String(s).replace(/^(\s*B2[BCG])\b.*$/i, "$1");
const statusMeta = (s) => {
  const k = String(s || "").toLowerCase();
  if (k === "pending") return { label: "Pending", className: "-pending" };
  if (k === "rescheduled") return { label: "Rescheduled", className: "-resched" };
  if (k === "confirmed") return { label: "Confirmed", className: "-ok" };
  if (k === "rejected") return { label: "Rejected", className: "-bad" };
  if (k === "cancelled" || k === "canceled") return { label: "Cancelled", className: "-muted" };
  return { label: "—", className: "-muted" };
};
function initials(name = "") {
  const p = String(name).trim().split(/\s+/).slice(0, 2);
  return p.map((x) => x[0]?.toUpperCase?.() || "").join("") || "—";
}
const trimWords = (t = "", limit = 10) => {
  const a = String(t).trim().split(/\s+/);
  return a.length > limit ? a.slice(0, limit).join(" ") + "…" : t;
};

/* ------------------------ CHILD: EventMini (safe hook) ------------------------ */
function EventMini({ eventId, children }) {
  const { data } = useGetEventQuery(eventId, { skip: !eventId });
  const ev = data || {};
  return children(ev);
}

/* ------------------------ SUGGESTIONS LIST ------------------------ */
function SuggestionsList({ myId, onOpen, onBook, onFav, onMessage }) {
  const { data, isFetching, refetch } =
    useGetSuggestedListQuery({ actorId: myId }, { skip: !myId });

  const normalize = (a = {}) => {
    const p = a.profile || a;
    const role = (p.role || a.role || "attendee").toLowerCase();
    const name = p.name || p.fullName || p.exhibitorName || p.orgName || "—";
    const photo = p.avatar || p.photo || p.profilePic || "";
    const tag = String(p.tag || a.tag || a.purpose || "");
    const id = p.id || p._id || a.id || a._id;
    const matchPct = a.matchPct ?? p.matchPct ?? null;
    return { id, role, name, photo, tag, matchPct };
  };

  const list = useMemo(() => {
    const raw =
      (Array.isArray(data?.data) && data.data) ||
      (Array.isArray(data?.items) && data.items) ||
      (Array.isArray(data) && data) ||
      [];
    return raw.map(normalize).filter((x) => x.id);
  }, [data]);

  return (
    <section className={`sugg-section ${isFetching ? "is-dim" : ""}`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Suggested Matches</h2>
        <button className="btn -pri" onClick={() => refetch()}>
          Generate AI Suggestions
        </button>
      </div>

      {!myId ? (
        <div className="muted">Sign in to see suggestions.</div>
      ) : !list.length ? (
        <div className="muted">No suggestions right now.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map((s) => (
            <div key={s.id} className="card p-4 border rounded-lg shadow-sm bg-white relative">
              {s.matchPct != null && (
                <div className="absolute top-2 right-2 px-2 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-800">
                  {s.matchPct}% Match
                </div>
              )}

              <div className="flex items-center gap-4">
                <div className="avatar">
                  {s.photo ? <img src={s.photo} alt="" /> : <span>{initials(s.name)}</span>}
                </div>
                <div>
                  <div className="font-semibold">{s.name}</div>
                  <div className="muted small">
                    {compactB2X(s.tag)} • {s.role}
                  </div>
                </div>
              </div>

              <div className="mt-2 flex gap-2 flex-wrap">
                <button className="btn -ghost" onClick={() => onMessage?.(s.id)}>
                  Message
                </button>
                <button className="btn -pri" onClick={() => onBook?.(s.id)}>
                  Book
                </button>
                <button className="btn -ghost" onClick={() => onFav?.(s.id)}>
                  ♥
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/* ------------------------ ROW ------------------------ */
function MeetingRow({
  m,
  myId,
  onReschedule,
  onReject,
  onConfirm,
  onCancel,
  onDelete,
  onMessage,
  onOpen,
}) {
  const iAmSender = (m?.senderId || "") === myId;
  const st = statusMeta(m?.status);
  const showSlot = m?.status === "rescheduled" ? m?.proposedNewAt : m?.slotISO || m?.requestedAt;
  const day = fmtDay(showSlot || m?.slotISO || m?.requestedAt);
  const time = fmtTime(showSlot || m?.slotISO || m?.requestedAt);

  const otherName = m?.receiverName || m?.senderName || "—";
  const otherPhoto = m?.receiverPhoto || m?.senderPhoto || "";
  const match = m?.matchPct ?? null;

  const Buttons = () => {
    const s = String(m?.status || "").toLowerCase();
    if (s === "pending") {
      return (
        <>
          <button
            className="mtg-btn -ghost"
            onClick={(e) => {
              e.stopPropagation();
              onReschedule(m);
            }}
          >
            <FiRefreshCw /> Reschedule
          </button>
          <button
            className="mtg-btn -danger"
            onClick={(e) => {
              e.stopPropagation();
              onReject(m);
            }}
          >
            <FiXCircle /> Reject
          </button>
          <button
            className="mtg-btn -ghost"
            onClick={(e) => {
              e.stopPropagation();
              onMessage(m);
            }}
          >
            <FiMessageSquare /> Message
          </button>
        </>
      );
    }
    if (s === "rescheduled") {
      return iAmSender ? (
        <>
          <button
            className="mtg-btn -ghost"
            onClick={(e) => {
              e.stopPropagation();
              onCancel(m);
            }}
          >
            <FiXCircle /> Cancel
          </button>
          <button
            className="mtg-btn -danger"
            onClick={(e) => {
              e.stopPropagation();
              onReject(m);
            }}
          >
            <FiXCircle /> Reject
          </button>
          <button
            className="mtg-btn -ghost"
            onClick={(e) => {
              e.stopPropagation();
              onMessage(m);
            }}
          >
            <FiMessageSquare /> Message
          </button>
        </>
      ) : (
        <>
          <button
            className="mtg-btn -confirm"
            onClick={(e) => {
              e.stopPropagation();
              onConfirm(m);
            }}
          >
            <FiCheckCircle /> Confirm
          </button>
          <button
            className="mtg-btn -danger"
            onClick={(e) => {
              e.stopPropagation();
              onReject(m);
            }}
          >
            <FiXCircle /> Reject
          </button>
          <button
            className="mtg-btn -ghost"
            onClick={(e) => {
              e.stopPropagation();
              onMessage(m);
            }}
          >
            <FiMessageSquare /> Message
          </button>
        </>
      );
    }
    if (s === "confirmed") {
      return (
        <>
          <button
            className="mtg-btn -ghost"
            onClick={(e) => {
              e.stopPropagation();
              onReschedule(m);
            }}
          >
            <FiRefreshCw /> Reschedule
          </button>
          <button
            className="mtg-btn -danger"
            onClick={(e) => {
              e.stopPropagation();
              onCancel(m);
            }}
          >
            <FiXCircle /> Cancel
          </button>
          <button
            className="mtg-btn -ghost"
            onClick={(e) => {
              e.stopPropagation();
              onMessage(m);
            }}
          >
            <FiMessageSquare /> Message
          </button>
        </>
      );
    }
    if (s === "rejected") {
      return iAmSender ? (
        <button
          className="mtg-btn -ghost"
          onClick={(e) => {
            e.stopPropagation();
            onMessage(m);
          }}
        >
          <FiMessageSquare /> Message
        </button>
      ) : (
        <>
          <button
            className="mtg-btn -ghost"
            onClick={(e) => {
              e.stopPropagation();
              onMessage(m);
            }}
          >
            <FiMessageSquare /> Message
          </button>
          <button
            className="mtg-btn -warn"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(m);
            }}
          >
            <FiTrash2 /> Delete
          </button>
        </>
      );
    }
    if (s === "cancelled" || s === "canceled") {
      return (
        <>
          <button
            className="mtg-btn -ghost"
            onClick={(e) => {
              e.stopPropagation();
              onMessage(m);
            }}
          >
            <FiMessageSquare /> Message
          </button>
          {!iAmSender ? (
            <button
              className="mtg-btn -warn"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(m);
              }}
            >
              <FiTrash2 /> Delete
            </button>
          ) : null}
        </>
      );
    }
    return (
      <button
        className="mtg-btn -ghost"
        onClick={(e) => {
          e.stopPropagation();
          onMessage(m);
        }}
      >
        <FiMessageSquare /> Message
      </button>
    );
  };

  return (
    <article
      className="mtg-item clean-card compact"
      tabIndex={0}
      onClick={() => onOpen?.(m)}
      aria-label={`Open meeting with ${otherName}`}
    >
      <div className="mtg-left">
        <div className="mtg-avatar" aria-hidden="true" title="View profile">
          {otherPhoto ? <img src={otherPhoto} alt="" /> : <span className="mtg-initials">{initials(otherName)}</span>}
        </div>
      </div>

      <div className="mtg-mid">
        <div className="mtg-topline">
          <h3 className="mtg-name" title={otherName}>
            {otherName}
          </h3>
          <div className={`mtg-status-pill ${st.className}`}>{st.label}</div>
        </div>

        <div className="mtg-row">
          <span className="mtg-chip">
            <FiUser /> {m?.receiverRole || m?.senderRole || "—"}
          </span>
          <span className="mtg-chip">
            <FiTag /> {compactB2X(m?.purpose || m?.subject || "—")}
          </span>
          {match ? <span className="mtg-chip -match">{match}% match</span> : null}
        </div>

        <div className="mtg-row">
          <span className="mtg-chip">
            <FiCalendar /> {day}
          </span>
          <span className="mtg-chip">
            <FiClock /> {time}
          </span>
          <span className="mtg-chip">
            <FiCornerUpRight /> {m?.senderId === myId ? "Sent by you" : "Received by you"}
          </span>
        </div>

        <div className="mtg-row">
          <span className="mtg-chip -muted">
            <FiMail /> {m?.subject || "—"}
          </span>
        </div>

        <EventMini eventId={m?.eventId}>
          {(ev) => {
            const titleTrim = trimWords(ev?.title || "—", 10);
            return (
              <div className="mtg-row">
                <a
                  className="mtg-evt"
                  href={m?.eventId ? `/event/${m.eventId}` : "#"}
                  onClick={(e) => (!m?.eventId ? e.preventDefault() : null)}
                >
                  <strong className="evt-title" title={ev?.title || "—"}>
                    {titleTrim}
                  </strong>
                  {whereStr(ev) ? (
                    <span className="mtg-evt-sub">
                      <FiMapPin /> {whereStr(ev)}
                    </span>
                  ) : null}
                </a>
              </div>
            );
          }}
        </EventMini>
      </div>

      <div className="mtg-ctl">
        <Buttons />
      </div>
    </article>
  );
}

/* ------------------------ Meeting Modal ------------------------ */
function MeetingModal({
  meeting,
  onClose,
  onConfirm,
  onReschedule,
  onCancel,
  onMessage,
  onComplete,
  onShowQR,
  onAddCalendar,
}) {
  if (!meeting) return null;
  const otherName = meeting?.receiverName || meeting?.senderName || "—";
  const otherPhoto = meeting?.receiverPhoto || meeting?.senderPhoto || "";
  const slot =
    meeting?.status === "rescheduled"
      ? meeting?.proposedNewAt
      : meeting?.slotISO || meeting?.requestedAt;

  return (
    <div className="modal-wrap" role="dialog" aria-modal="true">
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card">
        <button className="modal-close" onClick={onClose}>
          Close
        </button>
        <div className="modal-head">
          <div className="modal-avatar">
            {otherPhoto ? <img src={otherPhoto} alt="" /> : <span>{initials(otherName)}</span>}
          </div>
          <div>
            <h3>{otherName}</h3>
            <div className="muted">
              {meeting?.receiverRole || meeting?.senderRole || "—"} • {meeting?.sector || "—"}
            </div>
            <div className="muted">{meeting?.receiverEmail || meeting?.senderEmail || "—"}</div>
          </div>
        </div>

        <div className="modal-body">
          <h4>Meeting</h4>
          <p>
            <strong>{fmtDay(slot)}</strong> · {fmtTime(slot)}
          </p>
          {meeting?.roomId ? <p>Room: {meeting.roomId}</p> : null}
          <p className="muted">{meeting?.subject}</p>
          <p style={{ marginTop: 8 }}>{meeting?.notes || "No additional notes."}</p>

          <div className="modal-actions">
            {meeting?.status !== "confirmed" && (
              <button className="mtg-btn -confirm" onClick={() => onConfirm(meeting)}>
                <FiCheckCircle /> Confirm
              </button>
            )}
            <button className="mtg-btn -ghost" onClick={() => onReschedule(meeting)}>
              <FiRefreshCw /> Reschedule
            </button>
            <button className="mtg-btn -danger" onClick={() => onCancel(meeting)}>
              <FiXCircle /> Cancel
            </button>
            <button className="mtg-btn -ghost" onClick={() => onMessage(meeting)}>
              <FiMessageSquare /> Message
            </button>
            <button className="mtg-btn -ghost" onClick={() => onComplete(meeting)}>
              Mark Completed
            </button>
            <button className="mtg-btn -ghost" onClick={() => onShowQR(meeting)}>
              QR Code
            </button>
            <button className="mtg-btn -ghost" onClick={() => onAddCalendar(meeting)}>
              Add to Calendar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------ MAIN PAGE ------------------------ */
export default function MeetingsPage() {
  const { ActorId } = useAuth();
  const navigate = useNavigate();

  // Meetings
  const { data, isLoading, isError, refetch } = useGetMeetingsQuery();

  // Optimistic patches per meeting id
  const [patches, setPatches] = useState({}); // { [id]: { status, proposedNewAt, ... } }

  const rawItems = useMemo(() => {
    const arr =
      (Array.isArray(data?.items) && data.items) ||
      (Array.isArray(data?.data) && data.data) ||
      (Array.isArray(data) && data) ||
      [];
    return arr.filter(Boolean);
  }, [data]);

  // Merge server items with local patches
  const items = useMemo(() => {
    return rawItems.map((it) => {
      const id = it.id || it._id;
      return patches[id] ? { ...it, ...patches[id] } : it;
    });
  }, [rawItems, patches]);

  const myId = ActorId || data?.me?.id || data?.actorId || "";

  // NEW: mutation hook for actions
  const [makeAction, { isLoading: actionLoading }] = useMakeMeetingActionMutation();

  // Helpers
  const [selectedId, setSelectedId] = useState(null);
  const selectedMeeting = useMemo(
    () => items.find((m) => (m.id || m._id) === selectedId) || null,
    [items, selectedId]
  );

  const [searchQ, setSearchQ] = useState("");
  const [filterCompany, setFilterCompany] = useState("");
  const [filterSectors, setFilterSectors] = useState([]);
  const [filterDate, setFilterDate] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [viewMode, setViewMode] = useState("list");
  const [toasts, setToasts] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showSectorDropdown, setShowSectorDropdown] = useState(false);

  const sectors = ["Sustainability", "Agriculture", "Industry", "Retail", "Services", "Tech", "Finance"];

  const toggleSector = (sector) => {
    setFilterSectors((prev) => (prev.includes(sector) ? prev.filter((s) => s !== sector) : [...prev, sector]));
  };

  // Stats derived
  const stats = useMemo(() => {
    const total = items.length;
    const confirmed = items.filter((m) => String(m?.status || "").toLowerCase() === "confirmed").length;
    const pending = items.filter((m) => String(m?.status || "").toLowerCase() === "pending").length;
    const cancelled = items.filter((m) =>
      ["cancelled", "canceled", "rejected", "rescheduled"].includes(String(m?.status || "").toLowerCase())
    ).length;
    const availableSlots = 0;
    return { total, confirmed, pending, cancelled, availableSlots };
  }, [items]);

  // Filtering
  const filtered = useMemo(() => {
    let arr = items.slice();
    if (filterStatus) arr = arr.filter((m) => String(m?.status || "").toLowerCase() === filterStatus.toLowerCase());
    if (filterCompany)
      arr = arr.filter((m) =>
        (m?.receiverName || m?.senderName || "")
          .toLowerCase()
          .includes(filterCompany.toLowerCase())
      );
    if (filterSectors.length) arr = arr.filter((m) => filterSectors.includes(m?.sector));
    if (filterDate) arr = arr.filter((m) => (m?.slotISO || m?.proposedNewAt || m?.requestedAt || "").startsWith(filterDate));
    if (searchQ) {
      const q = searchQ.toLowerCase();
      arr = arr.filter((m) => {
        const otherName = m?.receiverName || m?.senderName || "";
        const subject = m?.subject || "";
        return otherName.toLowerCase().includes(q) || subject.toLowerCase().includes(q);
      });
    }
    return arr;
  }, [items, searchQ, filterCompany, filterSectors, filterDate, filterStatus]);

  // Toasts
  const pushToast = (text, opts = {}) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, text, ...opts }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), opts.duration || 4500);
  };

  // ---- Action wiring (CONFIRM / REJECT / CANCEL / RESCHEDULE) ----
  const doAction = async (meeting, action, extra = {}) => {
    const id = meeting?.id || meeting?._id;
    if (!id) return;
    try {
      await makeAction({
        meetingId: id,
        action,           // "confirm" | "reject" | "cancel" | "reschedule"
        actorId: myId,
        ...extra          // e.g. { proposedNewAt }
      }).unwrap();

      // Optimistic patch for instant UI change
      setPatches((prev) => {
        const next = { ...prev };
        if (action === "confirm") next[id] = { ...prev[id], status: "confirmed", proposedNewAt: undefined };
        else if (action === "reject") next[id] = { ...prev[id], status: "rejected" };
        else if (action === "cancel") next[id] = { ...prev[id], status: "cancelled" };
        else if (action === "reschedule") {
          const when = extra?.proposedNewAt;
          next[id] = { ...prev[id], status: "rescheduled", proposedNewAt: when || prev[id]?.proposedNewAt };
        }
        return next;
      });

      // Success feedback
      const msg =
        action === "confirm" ? "Meeting confirmed." :
        action === "reject" ? "Meeting rejected." :
        action === "cancel" ? "Meeting cancelled." :
        action === "reschedule" ? "Reschedule proposed." :
        "Action done.";
      pushToast(msg);

      // Sync from server
      refetch();
    } catch (err) {
      pushToast(err?.data?.message || "Action failed.", { type: "err" });
    }
  };

  const handleReschedule = (m) => {
    const seed = m?.proposedNewAt || m?.slotISO || new Date().toISOString();
    const input = window.prompt("New time (ISO 8601, e.g. 2025-09-03T14:30:00Z):", seed);
    if (!input) return;
    // Minimal validation
    const dt = new Date(input);
    if (isNaN(dt.getTime())) {
      pushToast("Invalid datetime format.");
      return;
    }
    doAction(m, "reschedule", { proposedNewAt: dt.toISOString() });
  };
  const handleReject = (m) => doAction(m, "reject");
  const handleConfirm = (m) => doAction(m, "confirm");
  const handleCancel = (m) => doAction(m, "cancel");
  const handleDelete = () => pushToast("Delete thread (not wired).");
  const handleMessage = () => pushToast("Open messaging (not wired).");

  // Modal helpers
  const openMeetingModal = (m) => setSelectedId(m?.id || m?._id || null);
  const closeMeetingModal = () => setSelectedId(null);

  // Stat card toggles filterStatus
  const onStatClick = (key) => {
    if (key === "total") {
      setFilterStatus("");
      return;
    }
    setFilterStatus((prev) => (prev === key ? "" : key));
  };

  // Calendar
  const monthName = currentDate.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = (new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay() + 6) % 7; // Monday start
  const calendarDays = Array.from({ length: 42 }, (_, i) => {
    const day = i - firstDayOfMonth + 1;
    if (day < 1 || day > daysInMonth) return null;
    return new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
  });

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const getMeetingsForDay = (date) => {
    const dayISO = date.toISOString().slice(0, 10);
    return filtered.filter((m) => (m?.slotISO || m?.proposedNewAt || m?.requestedAt || "").startsWith(dayISO));
  };

  return (
    <>
      <HeaderShell top={topbar} nav={nav} cta={cta} />

      <main className={`mtg clean-page ${actionLoading ? "is-dim" : ""}`}>
        <div className="container clean-container">
          {/* Header */}
          <div className="mtg-head clean-head">
            <div className="head-left">
              <button className="mtg-back minimal" onClick={() => navigate(-1)} aria-label="Return">
                <FiChevronLeft />
              </button>
              <div>
                <h1 className="mtg-title">My B2B Meetings</h1>
                <p className="muted small">
                  View your matches, manage your meetings, and explore new business connections.
                </p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="stats-row clean-stats" role="navigation" aria-label="Meeting stats">
            <button
              className={`stat-card -total ${filterStatus === "" ? "active" : ""}`}
              onClick={() => onStatClick("total")}
              aria-pressed={filterStatus === ""}
            >
              <div className="stat-label">Total</div>
              <div className="stat-value">{stats.total}</div>
            </button>
            <button
              className={`stat-card -confirmed ${filterStatus === "confirmed" ? "active" : ""}`}
              onClick={() => onStatClick("confirmed")}
              aria-pressed={filterStatus === "confirmed"}
            >
              <div className="stat-label">Confirmed</div>
              <div className="stat-value">{stats.confirmed}</div>
            </button>
            <button
              className={`stat-card -pending ${filterStatus === "pending" ? "active" : ""}`}
              onClick={() => onStatClick("pending")}
              aria-pressed={filterStatus === "pending"}
            >
              <div className="stat-label">Pending</div>
              <div className="stat-value">{stats.pending}</div>
            </button>
            <button
              className={`stat-card -cancelled ${filterStatus === "cancelled" ? "active" : ""}`}
              onClick={() => onStatClick("cancelled")}
              aria-pressed={filterStatus === "cancelled"}
            >
              <div className="stat-label">Cancelled / Rescheduled</div>
              <div className="stat-value">{stats.cancelled}</div>
            </button>
            <button
              className={`stat-card -slots ${filterStatus === "slots" ? "active" : ""}`}
              onClick={() => onStatClick("slots")}
              aria-pressed={filterStatus === "slots"}
            >
              <div className="stat-label">Available Slots</div>
              <div className="stat-value">{stats.availableSlots}</div>
            </button>
          </div>

          {/* Filters */}
          <div className="mtg-filters">
            <input
              className="clean-input"
              placeholder="Search attendee or subject"
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              aria-label="Search meetings"
            />
            <input
              className="clean-input small"
              placeholder="Name"
              value={filterCompany}
              onChange={(e) => setFilterCompany(e.target.value)}
              aria-label="Filter by participant name"
            />
            <div className="sector-dropdown">
              <button
                className="clean-input small sector-btn"
                onClick={() => setShowSectorDropdown(!showSectorDropdown)}
              >
                Sectors {filterSectors.length ? `(${filterSectors.length})` : ""}
              </button>
              {showSectorDropdown && (
                <div className="sector-menu">
                  {sectors.map((sector) => (
                    <label key={sector} className="sector-item">
                      <input
                        type="checkbox"
                        checked={filterSectors.includes(sector)}
                        onChange={() => toggleSector(sector)}
                      />
                      {sector}
                    </label>
                  ))}
                </div>
              )}
            </div>
            <input
              type="date"
              className="clean-input small"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              aria-label="Filter by date"
            />
            <select
              className="clean-input small"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              aria-label="Filter by status"
            >
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="rescheduled">Rescheduled</option>
              <option value="confirmed">Confirmed</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="main-col">
            {/* Suggestions (from backend only) */}
            <SuggestionsList
              myId={myId}
              onOpen={(id) => navigate(`/profile/${id}`)}
              onBook={() => pushToast("Book meeting flow (not wired).")}
              onFav={() => pushToast("Added to favorites.")}
              onMessage={() => pushToast("Message user")}
            />

            {/* View Toggle */}
            <div className="view-toggle clean-toggle" role="tablist" aria-label="View mode" style={{ marginBottom: 16 }}>
              <button
                className={`view-btn ${viewMode === "list" ? "active" : ""}`}
                onClick={() => setViewMode("list")}
                role="tab"
                aria-selected={viewMode === "list"}
              >
                List
              </button>
              <button
                className={`view-btn ${viewMode === "calendar" ? "active" : ""}`}
                onClick={() => setViewMode("calendar")}
                role="tab"
                aria-selected={viewMode === "calendar"}
              >
                Calendar
              </button>
            </div>

            {/* List / Calendar */}
            {isLoading ? (
              <div className="mtg-list">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="mtg-item skel" />
                ))}
              </div>
            ) : isError ? (
              <div className="mtg-empty">Couldn’t load meetings.</div>
            ) : !filtered.length ? (
              <div className="mtg-empty">No meetings match your filters.</div>
            ) : viewMode === "list" ? (
              <div className="mtg-list">
                {filtered.map((m) => (
                  <MeetingRow
                    key={m.id || m._id}
                    m={m}
                    myId={myId}
                    onReschedule={handleReschedule}
                    onReject={handleReject}
                    onConfirm={handleConfirm}
                    onCancel={handleCancel}
                    onDelete={handleDelete}
                    onMessage={handleMessage}
                    onOpen={openMeetingModal}
                  />
                ))}
              </div>
            ) : (
              <div className="mtg-calendar clean-calendar">
                <div className="cal-nav">
                  <button onClick={prevMonth}>
                    <FiChevronLeft />
                  </button>
                  <h3>{monthName}</h3>
                  <button onClick={nextMonth}>
                    <FiChevronRight />
                  </button>
                </div>
                <div className="cal-header">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                    <div key={day} className="cal-day-head">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="cal-body">
                  {calendarDays.map((date, i) => (
                    <div key={i} className={`cal-cell ${date ? "" : "empty"}`}>
                      {date ? (
                        <>
                          <div className="cal-date">{date.getDate()}</div>
                          <div className="cal-meetings">
                            {getMeetingsForDay(date).map((m) => (
                              <div
                                key={m.id || m._id}
                                className={`cal-item ${(m.status || "").toLowerCase()}`}
                                onClick={() => openMeetingModal(m)}
                              >
                                <div className="cal-time">
                                  {fmtTime(m.slotISO || m.proposedNewAt || m.requestedAt)}
                                </div>
                                <div className="cal-title">{m.receiverName || m.senderName || "—"}</div>
                              </div>
                            ))}
                          </div>
                        </>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Modal */}
          {selectedMeeting ? (
            <MeetingModal
              meeting={selectedMeeting}
              onClose={closeMeetingModal}
              onConfirm={(m) => {
                handleConfirm(m);
                closeMeetingModal();
              }}
              onReschedule={(m) => {
                handleReschedule(m);
                closeMeetingModal();
              }}
              onCancel={(m) => {
                handleCancel(m);
                closeMeetingModal();
              }}
              onMessage={(m) => {
                handleMessage(m);
              }}
              onComplete={() => {
                pushToast("Marked as completed.");
              }}
              onShowQR={() => {
                pushToast("Open QR for check-in.");
              }}
              onAddCalendar={() => {
                pushToast("Add to calendar (not wired).");
              }}
            />
          ) : null}

          {/* Toasts */}
          <div className="toasts" aria-live="polite">
            {toasts.map((t) => (
              <div key={t.id} className={`toast ${t.type || ""}`}>
                {t.text}
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer
        brand={footerData.brand}
        columns={footerData.columns}
        socials={footerData.socials}
        actions={footerData.actions}
        bottomLinks={footerData.bottomLinks}
      />
    </>
  );
}
