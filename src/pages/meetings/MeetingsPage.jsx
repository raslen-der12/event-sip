// src/pages/meetings/MeetingsPage.jsx
import React, { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiChevronLeft, FiChevronRight, FiCalendar, FiClock, FiUser, FiMail,
  FiCornerUpRight, FiXCircle, FiCheckCircle, FiMessageSquare, FiRefreshCw,
  FiTrash2, FiMapPin, FiTag
} from "react-icons/fi";
import {
  useGetMeetingsQuery,
  useGetSuggestedListQuery,
  useMakeMeetingActionMutation,
} from "../../features/meetings/meetingsApiSlice";
import "../attendees/global-meet.css";
import { useGetEventQuery } from "../../features/events/eventsApiSlice";
import { useGetAvailableSlotsQuery } from "../../features/Actor/toolsApiSlice";
import "./meetings.css";
import Footer from "../../components/footer/Footer";
import { cta, footerData, nav, topbar } from "../main.mock";
import HeaderShell from "../../components/layout/HeaderShell";
import imageLink from "../../utils/imageLink";
import useAuth from "../../lib/hooks/useAuth";
import { useTranslation } from "react-i18next";
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
const fmtLocalDate = (iso) => {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "—";
  }
};
const fmtLocalTime = (iso) => {
  try {
    return new Date(iso).toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return "—";
  }
};
/* ADD THIS BLOCK */
const fmtBookedDate = (iso) => {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "—";
  }
};
const startOfWeekMonday = (d) => {
  const x = new Date(d || Date.now());
  const day = (x.getDay() + 6) % 7; // Monday=0
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - day);
  return x;
};
const addDays = (d, n) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
const ymdLocal = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};
const whereStr = (ev) => [ev?.city, ev?.country].filter(Boolean).join(", ");
const compactB2X = (s = "") => String(s).replace(/^(\s*B2[BCG])\b.*$/i, "$1");
const statusClassName = (s) => {
  const k = String(s || "").toLowerCase();
  if (k === "pending") return "-pending";
  if (k === "rescheduled") return "-resched";
  if (k === "confirmed") return "-ok";
  if (k === "rejected") return "-bad";
  if (k === "cancelled" || k === "canceled") return "-muted";
  return "-muted";
};
function initials(name = "") {
  const p = String(name).trim().split(/\s+/).slice(0, 2);
  return p.map((x) => x[0]?.toUpperCase?.() || "").join("") || "—";
}
const trimWords = (t = "", limit = 10) => {
  const a = String(t).trim().split(/\s+/);
  return a.length > limit ? a.slice(0, limit).join(" ") + "…" : t;
};
/* ------------------------ CHILD: EventMini ------------------------ */
function EventMini({ eventId, children }) {
  const { data } = useGetEventQuery(eventId, { skip: !eventId });
  const ev = data || {};
  return children(ev);
}
/* ------------------------ SUGGESTIONS LIST (gma-style) ------------------------ */
function SuggestionsList({ myId, onOpen, onBook, onFav, onMessage }) {
  const { t } = useTranslation();
  const { data, isFetching, refetch } =
    useGetSuggestedListQuery({ actorId: myId }, { skip: !myId });
  console.log("data",data);
  // normalize payload flexibly (accepts {data:[]}, {items:[]}, or [] directly)
  const list = React.useMemo(() => {
    const raw =
      (Array.isArray(data?.data) && data.data) ||
      (Array.isArray(data?.items) && data.items) ||
      (Array.isArray(data) && data) ||
      [];
    return raw
      .map((a) => {
        const p = a.profile || a;
        const id = p.id || p._id || a.id || a._id || "";
        const role = (p.role || a.role || "attendee").toLowerCase();
        const name = p.name || p.fullName || p.exhibitorName || p.orgName || "—";
        const photo = imageLink(p.avatar || p.photo || p.profilePic || "");
        const tag = String(p.tag || a.tag || a.purpose || "");
        const matchPct = typeof (a.matchPct ?? p.matchPct) === "number" ? (a.matchPct ?? p.matchPct) : undefined;
        const virtual = !!(p.virtualMeet ?? a.virtualMeet ?? a.virtual);
        const eventId = a.id_event || a.eventId || p.eventId || "";
        const country = p.country || a.country || p.personal?.country || "";
        const city = p.city || a.city || p.personal?.city || "";
        const jobTitle = p.jobTitle || a.jobTitle || p.organization?.jobTitle || "";
        const orgName = p.orgName || a.orgName || p.organization?.orgName || "";
        const objectives = Array.isArray(p.objectives || a.objectives || p.matchingIntent?.objectives)
          ? (p.objectives || a.objectives || p.matchingIntent?.objectives)
          : [];
        return {
          id, role, name, photo, tag, matchPct, virtual,
          eventId, country, city, jobTitle, orgName, objectives,
        };
      })
      .filter((x) => x.id);
  }, [data]);
  console.log("list",list);
  return (
    <section className={`sugg-section mt-6 ${isFetching ? "is-dim" : ""}`}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-bold">{t("meetings.suggestedMatches")}</h2>
        <button className="btn -pri" onClick={() => refetch()}>
          {t("meetings.generateAiSuggestions")}
        </button>
      </div>
      {!myId ? (
        <div className="muted">{t("meetings.signInToSeeSuggestions")}</div>
      ) : !list.length ? (
        <div className="muted">{t("meetings.noSuggestionsRightNow")}</div>
      ) : (
        <div className="gma-grid">
          {list.map((s) => (
            <article key={s.id} className="gma-card">
              {/* head */}
              <div className="gma-card-head">
                <div className="gma-avatar">
                  {s.photo ? (
                    <img src={s.photo} alt={s.name} />
                  ) : (
                    <div className="gma-avatar-fallback">
                      {(s.name || "?").slice(0, 1).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="gma-meta">
                  <div className="gma-name">{s.name}</div>
                  <div className="gma-sub">
                    {/* country • city */}
                    {s.country ? <span className={`fi fi-${String(s.country).toLowerCase()}`} style={{ marginRight: 6 }} /> : null}
                    {s.country || "—"}{s.city ? ` • ${s.city}` : ""}
                    {s.virtual ? <span className="gma-chip" style={{ marginLeft: 8 }}>{t("meetings.virtual")}</span> : null}
                  </div>
                  <div className="gma-sub tiny">
                    {s.jobTitle || "—"}{s.orgName ? ` @ ${s.orgName}` : ""} • {s.role}
                  </div>
                  {/* match chip */}
                  {typeof s.matchPct === "number" && (
                    <div className="gma-tags">
                      <span className="gma-chip gma-match" title={t("meetings.matchScore")}>⭐ {s.matchPct}%</span>
                      {s.tag ? <span className="gma-chip">{s.tag}</span> : null}
                    </div>
                  )}
                </div>
              </div>
              {/* objectives/tags */}
              {!!s.objectives?.length && (
                <div className="gma-tags">
                  {s.objectives.slice(0, 4).map((t, i) => (
                    <span key={i} className="gma-chip">#{t}</span>
                  ))}
                  {s.objectives.length > 4
                    ? <span className="gma-chip">+{s.objectives.length - 4}</span>
                    : null}
                </div>
              )}
              {/* event badge (re-use EventMini) */}
              {s.eventId ? (
                <div className="gma-tags" style={{ marginTop: 6 }}>
                  <EventMini eventId={s.eventId}>
                    {(ev) => (
                      <span className="gma-evbadge">
                        {ev?.title || ev?.name || t("meetings.eventFallback", { id: String(s.eventId).slice(-6) })}
                      </span>
                    )}
                  </EventMini>
                </div>
              ) : null}
              {/* actions */}
              <div className="gma-actions">
                <button
                  className="gma-btn -outline"
                  title={t("meetings.viewProfile")}
                  onClick={() => onOpen?.(s.id)}
                >
                  <FiUser /> {t("meetings.profile")}
                </button>
                <button
                  className="gma-btn -outline"
                  title={t("meetings.message")}
                  onClick={() => onMessage?.(s.id)}
                >
                  <FiMessageSquare /> {t("meetings.message")}
                </button>
                <button
                  className="gma-btn"
                  title={t("meetings.bookMeeting")}
                  onClick={() => onBook?.(s.id)}
                >
                  <FiCalendar /> {t("meetings.book")}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
/* ------------------------ Reschedule Modal ------------------------ */
function RescheduleModal({ meId, meeting, onClose, onSubmit }) {
  const { t } = useTranslation();
  // meeting is guaranteed when this component is rendered
  const m = meeting;
  console.log(m);
  const eventId = m.eventId;
  const isSender = String(m.senderId) === String(meId);
  const otherId = isSender ? m.receiverId : m.senderId;
  // lock the day to the meeting’s current (or proposed) slot
  const baseISO = m.slotISO || "2025-11-13T13:00:00.000+00:00";
  console.log("baseISO",baseISO);
  const dayStr = baseISO ? new Date(baseISO).toISOString().slice(0,10) : "";
  // fetch available slots for THAT day (local time variations are shown by label only)
  const { data: slotsRaw, isFetching: slotsLoading } =
    useGetAvailableSlotsQuery(
      { eventId, actorId: otherId, date: dayStr },
      { skip: !eventId || !otherId || !dayStr }
    );
  const slots = useMemo(() => {
    const raw = (Array.isArray(slotsRaw?.data) && slotsRaw.data) ||
                (Array.isArray(slotsRaw) && slotsRaw) || [];
    return raw.map((r) => {
      const iso = r.iso || r.slotISO || r.startISO || r;
      const isCap = r.isCap !== undefined ? !!r.isCap : true;
      return iso
        ? { iso, isCap, label: `${fmtLocalDate(iso)} • ${fmtLocalTime(iso)}${isCap ? "" : " [FULL]"}` }
        : null;
    }).filter(Boolean);
  }, [slotsRaw]);
  const [slotISO, setSlotISO] = useState("");
  const submit = (e) => {
    e.preventDefault();
    if (!slotISO) return;
    onSubmit(slotISO);
  };
  return (
    <div className="modal-wrap" role="dialog" aria-modal="true">
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card resched-card" role="document" aria-label={t("meetings.proposeNewTime")}>
        <div className="modal-head-row">
          <h3>{t("meetings.proposeNewTime")}</h3>
          <button className="modal-close" onClick={onClose} aria-label={t("meetings.close")}>×</button>
        </div>
        <form onSubmit={submit} className="resched-form">
          <div className="resched-field">
            <span className="resched-label"><FiCalendar/> {t("meetings.date")}</span>
            <div className="clean-input" aria-readonly="true">
              {dayStr ? fmtLocalDate(`${dayStr}T00:00:00Z`) : "—"}
            </div>
            <div className="muted small">{t("meetings.dateFixedToMeetingDay")}</div>
          </div>
          <label className="resched-field">
            <span className="resched-label"><FiClock/> {t("meetings.availableSlotsLocalTime")}</span>
            <select
              className="clean-input"
              value={slotISO}
              onChange={(e)=>setSlotISO(e.target.value)}
              required
              disabled={!slots.length || slotsLoading}
            >
              <option value="">{slotsLoading ? t("meetings.loading") : t("meetings.selectASlot")}</option>
              {slots.map((s) => (
                <option
                  key={s.iso}
                  value={s.iso}
                  disabled={!s.isCap}
                  title={!s.isCap ? t("meetings.b2bRoomFullForSlot") : undefined}
                >
                  {s.label}
                </option>
              ))}
            </select>
            {!slotsLoading && !slots.length ? (
              <div className="muted small" style={{marginTop:6}}>{t("meetings.noFreeSlotsForDate")}</div>
            ) : null}
          </label>
          <div className="resched-actions">
            <button
              type="submit"
              className={`mtg-btn -confirm ${!slotISO ? "is-disabled" : ""}`}
              disabled={!slotISO}
            >
              <FiRefreshCw/> {t("meetings.propose")}
            </button>
            <button type="button" className="mtg-btn -ghost" onClick={onClose}>
              <FiXCircle/> {t("meetings.cancel")}
            </button>
          </div>
        </form>
      </div>
      {/* modal styles (scoped) */}
      <style>{`
        .modal-wrap{position:fixed;inset:0;z-index:1000;display:flex;align-items:center;justify-content:center}
        .modal-backdrop{position:absolute;inset:0;background:rgba(0,0,0,.45);z-index:1000}
        .modal-card{position:relative;z-index:1001;background:#fff;border-radius:12px;border:1px solid #e2e8f0;box-shadow:0 20px 50px rgba(0,0,0,.25);padding:20px;max-width:560px;width:92%}
        .modal-head-row{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}
        .modal-close{appearance:none;background:transparent;border:none;font-size:20px;cursor:pointer;color:#475569}
        .resched-form{display:flex;flex-direction:column;gap:14px}
        .resched-field{display:flex;flex-direction:column;gap:6px}
        .resched-label{font-weight:600;color:#1f2937;display:flex;gap:6px;align-items:center}
        .resched-actions{display:flex;gap:10px;justify-content:flex-end;margin-top:6px}
      `}</style>
    </div>
  );
}
/* ------------------------ ROW ------------------------ */
function MeetingRow({
  m,
  myId,
  openReschedule,
  onAction,
  onMessage,
  onOpen,
}) {
  const { t } = useTranslation();
  const iAmSender = String(m?.senderId || "") === String(myId);
  const statusKey = String(m?.status || "unknown").toLowerCase();
  const st = { className: statusClassName(m?.status) };
  const statusLabel = t(`meetings.status.${statusKey}`);
  // choose display slot
  const showSlot = m?.status === "rescheduled" ? m?.proposedNewAt : (m?.slotISO || m?.requestedAt);
  const day = fmtDay(showSlot);
  const time = fmtTime(showSlot);
  // normalized “other” meta (the API already sends these)
  const otherName = m?.otherName || (iAmSender ? m?.receiverName : m?.senderName) || "—";
  const otherPhoto = m?.otherPhoto || (iAmSender ? m?.receiverPhoto : m?.senderPhoto) || "";
  const otherRole = iAmSender ? m?.receiverRole : m?.senderRole;
  const senderVirtual = !!m?.senderVirtual;
  const receiverVirtual = !!m?.receiverVirtual;
  const bothVirtual = senderVirtual && receiverVirtual;
  const halfVirtual = senderVirtual !== receiverVirtual;
  const modeLabel = t(`meetings.mode.${bothVirtual ? 'online' : halfVirtual ? 'hybrid' : 'inperson'}`);
  const modeClass = bothVirtual ? "-online" : (halfVirtual ? "-hybrid" : "-inperson");
  /* === PATCH END === */
  // prefer server-validated actions; fallback to local matrix when absent
  const actions = useMemo(() => {
    if (Array.isArray(m?.allowedActions)) return m.allowedActions;
    const whoProposed = String(m?.proposedBy || "");
    const iAmProposer = whoProposed && whoProposed === String(myId);
    const s = String(m?.status || "").toLowerCase();
    if (s === "pending") {
      return iAmSender ? ["cancel","reschedule","delete"] : ["confirm","reject","reschedule"];
    }
    if (s === "rescheduled") {
      return iAmProposer ? ["cancel","reschedule","delete"] : ["confirm","reject","reschedule"];
    }
    if (s === "confirmed") return ["reschedule","cancel"];
    if (s === "rejected") return iAmSender ? [] : ["delete"];
    if (s === "cancelled" || s === "canceled") return ["delete"];
    return [];
  }, [m?.allowedActions, m?.proposedBy, m?.status, myId, iAmSender]);
  const onBtn = (act) => (e) => {
    e.stopPropagation();
    if (act === "reschedule") openReschedule(m);
    else onAction(m, act);
  };
  return (
    <article
      className="mtg-item clean-card compact"
      tabIndex={0}
      onClick={()=>onOpen?.(m)}
      aria-label={t("meetings.openMeetingWith", { name: otherName })}
    >
      <div className="mtg-left">
        <div className="mtg-avatar" aria-hidden="true" title={t("meetings.viewProfile")}>
          {otherPhoto ? <img src={otherPhoto} alt="" /> : <span className="mtg-initials">{initials(otherName)}</span>}
        </div>
      </div>
      <div className="mtg-mid">
        <div className="mtg-topline">
          <h3 className="mtg-name" title={otherName}>{otherName}</h3>
          <div className={`mtg-status-pill ${st.className}`}>{statusLabel}</div>
        </div>
        <div className="mtg-row">
          <span className="mtg-chip"><FiUser/> {otherRole || "—"}</span>
          <span className="mtg-chip"><FiTag/> {compactB2X(m?.purpose || m?.subject || "—")}</span>
          {(senderVirtual || receiverVirtual) && (
            <span className={`mtg-chip mode ${modeClass}`}>{modeLabel}</span>
          )}
        </div>
        <div className="mtg-row">
          <span className="mtg-chip"><FiCalendar/> {day}</span>
          <span className="mtg-chip"><FiClock/> {time}</span>
          <span className="mtg-chip">
            <FiCornerUpRight/> {String(m?.senderId) === String(myId) ? t("meetings.sentByYou") : t("meetings.receivedByYou")}
          </span>
        </div>
        {m?.createdAt && (
  <span className="mtg-chip -muted">
    {t("meetings.bookedOn", { date: fmtBookedDate(m.createdAt) })}
  </span>
)}
        <div className="mtg-row">
          <span className="mtg-chip -muted"><FiMail/> {m?.subject || "—"}</span>
        </div>
        <EventMini eventId={m?.eventId}>
          {(ev) => {
            const titleTrim = trimWords(ev?.title || "—", 10);
            return (
              <div className="mtg-row">
                <a
                  className="mtg-evt"
                  href={m?.eventId ? `/event/${m.eventId}` : "#"}
                  onClick={(e)=> (!m?.eventId ? e.preventDefault() : null)}
                >
                  <strong className="evt-title" title={ev?.title || "—"}>{titleTrim}</strong>
                  {whereStr(ev) ? <span className="mtg-evt-sub"><FiMapPin/> {whereStr(ev)}</span> : null}
                </a>
              </div>
            );
          }}
        </EventMini>
      </div>
      <div className="mtg-ctl">
        {actions.includes("confirm") && (
          <button className="mtg-btn -confirm" onClick={onBtn("confirm")}><FiCheckCircle/> {t("meetings.confirm")}</button>
        )}
        {actions.includes("reject") && (
          <button className="mtg-btn -danger" onClick={onBtn("reject")}><FiXCircle/> {t("meetings.reject")}</button>
        )}
        {actions.includes("cancel") && (
          <button className="mtg-btn -danger" onClick={onBtn("cancel")}><FiXCircle/> {t("meetings.cancel")}</button>
        )}
        {actions.includes("reschedule") && (
          <button className="mtg-btn -ghost" onClick={onBtn("reschedule")}><FiRefreshCw/> {t("meetings.reschedule")}</button>
        )}
        {actions.includes("delete") && (
          <button className="mtg-btn -warn" onClick={onBtn("delete")}><FiTrash2/> {t("meetings.delete")}</button>
        )}
        <button className="mtg-btn -ghost" onClick={(e)=>onMessage?.(m.otherId)}>
          <FiMessageSquare/> {t("meetings.message")}
        </button>
      </div>
    </article>
  );
}
/* ------------------------ Meeting Modal ------------------------ */
function MeetingModal({ meeting, onClose }) {
  const { t } = useTranslation();
  if (!meeting) return null;
  const iAmSender = String(meeting?.senderId || "") === String(meeting?.meId || meeting?.actorId || "");
  const otherName = meeting?.otherName || (iAmSender ? meeting?.receiverName : meeting?.senderName) || "—";
  const otherPhoto = meeting?.otherPhoto || (iAmSender ? meeting?.receiverPhoto : meeting?.senderPhoto) || "";
  const otherRole = iAmSender ? meeting?.receiverRole : meeting?.senderRole;
  const otherEmail = meeting?.otherEmail || (iAmSender ? meeting?.receiverEmail : meeting?.senderEmail) || "";
  const slot = meeting?.status === "rescheduled"
    ? meeting?.proposedNewAt
    : (meeting?.slotISO || meeting?.requestedAt);
  const statusKey = String(meeting?.status || "unknown").toLowerCase();
  return (
    <div className="modal-wrap" role="dialog" aria-modal="true">
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-card">
        <button className="modal-close" onClick={onClose} aria-label={t("meetings.close")}>×</button>
        <div className="modal-head">
          <div className="modal-avatar">{otherPhoto ? <img src={otherPhoto} alt=""/> : <span>{initials(otherName)}</span>}</div>
          <div>
            <h3>{otherName}</h3>
            <div className="muted">{otherRole || "—"} • {t(`meetings.status.${statusKey}`)}</div>
            <div className="muted">{otherEmail || "—"}</div>
          </div>
        </div>
        <div className="modal-body">
          <h4>{t("meetings.meeting")}</h4>
          <p><strong>{fmtLocalDate(slot)}</strong> · {fmtLocalTime(slot)}</p>
          {meeting?.roomId ? <p>{t("meetings.room", { room: meeting.roomId })}</p> : null}
          <p className="muted">{meeting?.subject}</p>
          <p style={{marginTop:8}}>{meeting?.notes || t("meetings.noAdditionalNotes")}</p>
          {meeting?.createdAt && (
          <p className="muted" style={{ marginTop: 6, fontSize: '0.875rem' }}>
            {t("meetings.bookedOn", { date: fmtBookedDate(meeting.createdAt) })}
          </p>
        )}
        </div>
      </div>
      <style>{`
        .modal-wrap{position:fixed;inset:0;z-index:1000;display:flex;align-items:center;justify-content:center}
        .modal-backdrop{position:absolute;inset:0;background:rgba(0,0,0,.45);z-index:1000}
        .modal-card{position:relative;z-index:1001;width:90%;max-width:600px;background:#fff;border-radius:12px;padding:24px;border:1px solid #e2e8f0;box-shadow:0 20px 50px rgba(0,0,0,.25)}
        .modal-close{position:absolute;right:16px;top:16px;background:transparent;border:none;cursor:pointer;color:#475569;font-size:18px}
        .modal-head{display:flex;gap:16px;align-items:center;margin-bottom:16px}
        .modal-avatar{width:60px;height:60px;border-radius:50%;background:#f1f5f9;display:grid;place-items:center;overflow:hidden}
        .modal-avatar img{width:100%;height:100%;object-fit:cover}
      `}</style>
    </div>
  );
}
/* ------------------------ MAIN PAGE ------------------------ */
export default function MeetingsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { ActorId } =useAuth();
  const { data, isLoading, isError, refetch } = useGetMeetingsQuery();
  const items = useMemo(() => {
    const arr =
      (Array.isArray(data?.items) && data.items) ||
      (Array.isArray(data?.data) && data.data) ||
      (Array.isArray(data) && data) ||
      [];
    return arr.filter(Boolean);
  }, [data]);
  const myId = ActorId || data?.me?.id || data?.actorId || "";
  // UI state
  const [searchQ, setSearchQ] = useState("");
  const [filterCompany, setFilterCompany] = useState("");
  const [filterSectors, setFilterSectors] = useState([]);
  const [filterDate, setFilterDate] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [viewMode, setViewMode] = useState("list");
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showSectorDropdown, setShowSectorDropdown] = useState(false);
  const didInitWeek = useRef(false);
  const sectorKeys = ["Sustainability", "Agriculture", "Industry", "Retail", "Services", "Tech", "Finance"];
  const toggleSector = (sector) => {
    setFilterSectors((prev) => (prev.includes(sector) ? prev.filter((s) => s !== sector) : [...prev, sector]));
  };
  // Stats
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
        (m?.otherName || m?.receiverName || m?.senderName || "")
          .toLowerCase()
          .includes(filterCompany.toLowerCase())
      );
    if (filterSectors.length) arr = arr.filter((m) => filterSectors.includes(m?.sector));
    if (filterDate) arr = arr.filter((m) => {
      const iso = m?.slotISO || m?.proposedNewAt || m?.requestedAt || "";
      if (!iso) return false;
      return ymdLocal(new Date(iso)) === filterDate;
    });
    if (searchQ) {
      const q = searchQ.toLowerCase();
      arr = arr.filter((m) => {
        const name = m?.otherName || m?.receiverName || m?.senderName || "";
        const subject = m?.subject || "";
        return name.toLowerCase().includes(q) || subject.toLowerCase().includes(q);
      });
    }
    return arr;
  }, [items, searchQ, filterCompany, filterSectors, filterDate, filterStatus]);
  // Init week to first meeting day
  useEffect(() => {
    if (didInitWeek.current) return;
    if (!items.length) return;
    const dates = items
      .map((m) => new Date(m.slotISO || m.proposedNewAt || m.requestedAt))
      .filter((d) => !isNaN(d))
      .sort((a, b) => a - b);
    if (dates.length) {
      setCurrentDate(dates[0]);
      didInitWeek.current = true;
    }
  }, [items]);
  // Jump to week of filter date
  useEffect(() => {
    if (!filterDate) return;
    const [y, m, d] = filterDate.split("-").map(Number);
    const dt = new Date(y, (m || 1) - 1, d || 1);
    if (!isNaN(dt)) setCurrentDate(dt);
  }, [filterDate]);
  const handleBook = useCallback((id) => navigate(`/meeting/${id}`));
  const handleMessage = useCallback((id) => navigate(`/messages?member=${id}`));
  // Toast
  const pushToast = (text, opts = {}) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, text, ...opts }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), opts.duration || 4500);
  };
  // RTK action
  const [makeAction] = useMakeMeetingActionMutation();
  // Reschedule modal
  const [reschedMeeting, setReschedMeeting] = useState(null);
  const openMeetingModal = (m) => setSelectedMeeting(m);
  const closeMeetingModal = () => setSelectedMeeting(null);
  const openReschedule = (m) => setReschedMeeting(m);
  const closeReschedule = () => setReschedMeeting(null);
  const runAction = async (m, action, extra = {}) => {
    try {
      await makeAction({
        meetingId: m.id || m._id,
        action,
        actorId: myId,
        ...(action === "reschedule" ? { proposedNewAt: extra.proposedNewAt } : {})
      }).unwrap();
      pushToast(t("meetings.actionApplied", { action }));
      await refetch();
    } catch (e) {
      const msg = e?.data?.message || e?.message || String(e);
      pushToast(msg || t("meetings.actionFailed"), { type: "err", duration: 6000 });
    }
  };
  const onAction = (m, act) => {
    if (act === "reschedule") return openReschedule(m);
    runAction(m, act);
  };
  /* -------------------- WEEK CALENDAR (08:00–18:00 default, auto-expand) -------------------- */
  const weekStart = useMemo(() => startOfWeekMonday(currentDate), [currentDate]);
  const weekEnd = useMemo(() => addDays(weekStart, 6), [weekStart]);
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  // Determine hour range: default 08..18, but expand to include any meeting hours so nothing is hidden
  const hourRange = useMemo(() => {
    let minH = 8, maxH = 18;
    const startMs = weekStart.getTime();
    const endMs = addDays(weekStart, 7).getTime();
    for (const m of filtered) {
      const iso = m?.slotISO || m?.proposedNewAt || m?.requestedAt;
      if (!iso) continue;
      const d = new Date(iso);
      const t = d.getTime();
      if (t >= startMs && t < endMs) {
        const h = d.getHours();
        if (h < minH) minH = h;
        if (h > maxH) maxH = h;
      }
    }
    // hard cap reasonable bounds
    minH = Math.max(0, Math.min(23, minH));
    maxH = Math.max(minH, Math.min(23, maxH));
    return { minH, maxH };
  }, [filtered, weekStart]);
  const hoursArr = useMemo(() => {
    const out = [];
    for (let h = hourRange.minH; h <= hourRange.maxH; h++) out.push(h);
    return out;
  }, [hourRange]);
  const headerLabel = useMemo(() => {
    const a = weekStart.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    const b = weekEnd.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
    return `${a} – ${b}`;
  }, [weekStart, weekEnd]);
  const prevWeek = () => setCurrentDate(addDays(weekStart, -7));
  const nextWeek = () => setCurrentDate(addDays(weekStart, 7));
  // Pre-group meetings by day+hour for faster render
  const mtgMap = useMemo(() => {
    const map = new Map(); // key: `${ymd}-${hour}` -> array
    for (const m of filtered) {
      const iso = m?.slotISO || m?.proposedNewAt || m?.requestedAt;
      if (!iso) continue;
      const d = new Date(iso);
      const key = `${ymdLocal(d)}-${d.getHours()}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(m);
    }
    return map;
  }, [filtered]);
  const cellMeetings = (date, hour) => {
    return mtgMap.get(`${ymdLocal(date)}-${hour}`) || [];
  };
  const isB2BHour = (h) => h >= 14 && h < 18; // subtle highlight (optional visual cue)
  return (
    <>
      <HeaderShell top={topbar} nav={nav} cta={cta} />
      <main className="mtg clean-page">
        <div className="container clean-container">
          {/* Header */}
          <div className="mtg-head clean-head">
            <div className="head-left">
              <button className="mtg-back minimal" onClick={() => navigate(-1)} aria-label={t("meetings.return")}>
                <FiChevronLeft />
              </button>
              <div>
                <h1 className="mtg-title">{t("meetings.myB2bMeetings")}</h1>
                <p className="muted small">
                  {t("meetings.viewMatchesManage")}
                </p>
              </div>
            </div>
          </div>
          {/* Stats */}
          <div className="stats-row clean-stats" role="navigation" aria-label={t("meetings.meetingStats")}>
            <button
              className={`stat-card -total ${filterStatus === "" ? "active" : ""}`}
              onClick={() => setFilterStatus("")}
              aria-pressed={filterStatus === ""}
            >
              <div className="stat-label">{t("meetings.total")}</div>
              <div className="stat-value">{stats.total}</div>
            </button>
            <button
              className={`stat-card -confirmed ${filterStatus === "confirmed" ? "active" : ""}`}
              onClick={() => setFilterStatus("confirmed")}
              aria-pressed={filterStatus === "confirmed"}
            >
              <div className="stat-label">{t("meetings.status.confirmed")}</div>
              <div className="stat-value">{stats.confirmed}</div>
            </button>
            <button
              className={`stat-card -pending ${filterStatus === "pending" ? "active" : ""}`}
              onClick={() => setFilterStatus("pending")}
              aria-pressed={filterStatus === "pending"}
            >
              <div className="stat-label">{t("meetings.status.pending")}</div>
              <div className="stat-value">{stats.pending}</div>
            </button>
            <button
              className={`stat-card -cancelled ${filterStatus === "cancelled" ? "active" : ""}`}
              onClick={() => setFilterStatus("cancelled")}
              aria-pressed={filterStatus === "cancelled"}
            >
              <div className="stat-label">{t("meetings.cancelledRescheduled")}</div>
              <div className="stat-value">{stats.cancelled}</div>
            </button>
            <button
              className={`stat-card -slots ${filterStatus === "slots" ? "active" : ""}`}
              onClick={() => setFilterStatus("slots")}
              aria-pressed={filterStatus === "slots"}
              disabled
              title={t("meetings.comingSoon")}
            >
              <div className="stat-label">{t("meetings.availableSlots")}</div>
              <div className="stat-value">{stats.availableSlots}</div>
            </button>
          </div>
          {/* Filters */}
          <div className="mtg-filters">
            <input
              className="clean-input"
              placeholder={t("meetings.searchRequestedMeetings")}
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              aria-label={t("meetings.searchRequestedMeetings")}
            />
            <input
              className="clean-input small"
              placeholder={t("meetings.name")}
              value={filterCompany}
              onChange={(e) => setFilterCompany(e.target.value)}
              aria-label={t("meetings.filterByParticipantName")}
            />
            <div className="sector-dropdown">
              <button
                className="clean-input small sector-btn"
                onClick={() => setShowSectorDropdown(!showSectorDropdown)}
              >
                {t("meetings.sectors")} {filterSectors.length ? `(${filterSectors.length})` : ""}
              </button>
              {showSectorDropdown && (
                <div className="sector-menu">
                  {sectorKeys.map((sector) => (
                    <label key={sector} className="sector-item">
                      <input
                        type="checkbox"
                        checked={filterSectors.includes(sector)}
                        onChange={() => toggleSector(sector)}
                      />
                      {t(`meetings.sector.${sector.toLowerCase()}`)}
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
              aria-label={t("meetings.filterByDate")}
            />
            <select
              className="clean-input small"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              aria-label={t("meetings.filterByStatus")}
            >
              <option value="">{t("meetings.allStatuses")}</option>
              <option value="pending">{t("meetings.status.pending")}</option>
              <option value="rescheduled">{t("meetings.status.rescheduled")}</option>
              <option value="confirmed">{t("meetings.status.confirmed")}</option>
              <option value="rejected">{t("meetings.status.rejected")}</option>
              <option value="cancelled">{t("meetings.status.cancelled")}</option>
            </select>
          </div>
          <div className="main-col">
            {/* Suggestions */}
           
            {/* View Toggle */}
            <div className="view-toggle clean-toggle" role="tablist" aria-label={t("meetings.viewMode")} style={{ marginBottom: 16 }}>
              <button
                className={`view-btn ${viewMode === "list" ? "active" : ""}`}
                onClick={() => setViewMode("list")}
                role="tab"
                aria-selected={viewMode === "list"}
              >
                {t("meetings.list")}
              </button>
              <button
                className={`view-btn ${viewMode === "calendar" ? "active" : ""}`}
                onClick={() => setViewMode("calendar")}
                role="tab"
                aria-selected={viewMode === "calendar"}
              >
                {t("meetings.calendar")}
              </button>
            </div>
            {/* List / WEEK CALENDAR */}
            {isLoading ? (
              <div className="mtg-list">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="mtg-item skel" />
                ))}
              </div>
            ) : isError ? (
              <div className="mtg-empty">{t("meetings.couldntLoadMeetings")}</div>
            ) : !filtered.length ? (
              <div className="mtg-empty">{t("meetings.noMeetingsMatchFilters")}</div>
            ) : viewMode === "list" ? (
              <div className="mtg-list">
                {filtered.map((m) => (
                  <MeetingRow
                    key={m.id || m._id}
                    m={m}
                    myId={myId}
                    openReschedule={(mm) => setReschedMeeting(mm)}
                    onAction={onAction}
                    onMessage={handleMessage}
                    onOpen={openMeetingModal}
                  />
                ))}
              </div>
            ) : (
              <div className="week-cal">
                {/* Nav */}
                <div className="cal-nav">
                  <button onClick={prevWeek} title={t("meetings.previousWeek")}>
                    <FiChevronLeft />
                  </button>
                  <h3>{headerLabel}</h3>
                  <button onClick={nextWeek} title={t("meetings.nextWeek")}>
                    <FiChevronRight />
                  </button>
                </div>
                {/* Grid */}
                <div className="week-grid">
                  {/* Header row */}
                  <div className="wg-timehead"></div>
                  {weekDays.map((d, idx) => (
                    <div key={`h${idx}`} className="wg-dayhead">
                      {d.toLocaleDateString(undefined, { weekday: "short" })} {d.getDate()}
                    </div>
                  ))}
                  {/* Rows by hour (auto-expanded) */}
                  {hoursArr.map((h) => (
                    <React.Fragment key={`r${h}`}>
                      <div className="wg-timecell">{String(h).padStart(2,"0")}:00</div>
                      {weekDays.map((d, i) => (
                        <div key={`c${h}-${i}`} className={`wg-cell ${isB2BHour(h) ? "b2b" : ""}`}>
                          {cellMeetings(d, h).map((m) => (
                            <div
                              key={m.id || m._id}
                              className={`cal-item ${(m.status || "").toLowerCase()}`}
                              onClick={() => openMeetingModal(m)}
                            >
                              <div className="cal-time">{fmtLocalTime(m.slotISO || m.proposedNewAt || m.requestedAt)}</div>
                              <div className="cal-title">{m.otherName || m.receiverName || m.senderName || "—"}</div>
                            </div>
                          ))}
                        </div>
                      ))}
                    </React.Fragment>
                  ))}
                </div>
                {/* scoped styles */}
                <style>{`
                  .week-cal{border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;background:#fff}
                  .cal-nav{display:flex;align-items:center;justify-content:space-between;padding:10px 12px;border-bottom:1px solid #e2e8f0}
                  .cal-nav h3{margin:0;font-weight:700}
                  .cal-nav button{border:none;background:transparent;cursor:pointer;padding:6px 8px;color:#334155}
                  .week-grid{display:grid;grid-template-columns: 80px repeat(7, 1fr);grid-auto-rows:auto}
                  .wg-timehead{background:#f8fafc;border-right:1px solid #e2e8f0}
                  .wg-dayhead{padding:8px 10px;background:#f8fafc;border-left:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0;font-weight:600}
                  .wg-timecell{padding:8px 10px;border-right:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0;background:#f8fafc;color:#475569;font-weight:600}
                  .wg-cell{min-height:56px;border-left:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0;padding:6px;display:flex;flex-direction:column;gap:6px}
                  .wg-cell.b2b{background:linear-gradient(180deg, rgba(236,253,245,.6), rgba(236,253,245,.3))}
                  .cal-item{background:#eef2ff;border:1px solid #c7d2fe;border-radius:8px;padding:6px 8px;cursor:pointer}
                  .cal-item.confirmed{background:#ecfdf5;border-color:#a7f3d0}
                  .cal-item.pending{background:#fff7ed;border-color:#fed7aa}
                  .cal-item.rescheduled{background:#fef2f2;border-color:#fecaca}
                  .cal-item.rejected,.cal-item.cancelled,.cal-item.canceled{background:#f8fafc;border-color:#e2e8f0;opacity:.75}
                  .cal-time{font-weight:700;margin-bottom:2px}
                  .cal-title{font-size:.92rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
                  @media (max-width:900px){
                    .week-grid{grid-template-columns: 60px repeat(7, 1fr)}
                    .wg-cell{min-height:48px}
                  }
                `}</style>
              </div>
            )}
          </div>
          <SuggestionsList
              myId={myId}
              onOpen={(id) => navigate(`/profile/${id}`)}
              onBook={handleBook}
              onFav={() => pushToast(t("meetings.addedToFavorites"))}
              onMessage={handleMessage}
            />
          {/* Modals */}
          {selectedMeeting ? <MeetingModal meeting={selectedMeeting} onClose={closeMeetingModal} /> : null}
          {reschedMeeting ? (
            <RescheduleModal
              meId={myId}
              meeting={reschedMeeting}
              onClose={closeReschedule}
              onSubmit={async (iso) => {
                await runAction(reschedMeeting, "reschedule", { proposedNewAt: iso });
                closeReschedule();
              }}
            />
          ) : null}
          {/* Toasts */}
          <div className="toasts" aria-live="polite">
            {toasts.map((t) => (
              <div key={t.id} className={`toast ${t.type || ""}`}>{t.text}</div>
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