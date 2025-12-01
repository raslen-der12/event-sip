// src/pages/register/AttendeeRegisterPage.jsx
import React, { useMemo, useRef, useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { useSearchParams, useNavigate } from "react-router-dom";
import ReactCountryFlag from "react-country-flag";
import "./attendee-register.css";

/** RTK hooks */
import { useGetEventQuery } from "../../features/events/eventsApiSlice";
import { useAttendeeRegisterMutation } from "../../features/auth/authApiSlice";
import { useGetEventSessionsQuery } from "../../features/events/scheduleApiSlice";
import imageLink from "../../utils/imageLink";
import HeaderShell from "../../components/layout/HeaderShell";
import { cta, footerData, nav, topbar } from "../main.mock";
import Footer from "../../components/footer/Footer";
import useCountries from "../../lib/hooks/useCountries";
import CountrySelect from "../../components/CountrySelect";
import { useTranslation } from "react-i18next";

/* === Helpers === */
const toISODate = (v) => (v ? new Date(v).toLocaleDateString() : "");
const required = (v) => ((typeof v === "string" ? v.trim() : v) ? true : false);

/* Catalog of “actor types” (FR) */
const ROLE_TYPES = [
  {
    key: "BusinessOwner",
    title: "Chef d’entreprise",
    desc: "Possède ou co-détient une entreprise. Peut ensuite créer un profil complet, définir les secteurs, produits et services.",
  },
  {
    key: "Consultant",
    title: "Consultant",
    desc: "Conseille les entreprises. Idéal si vous vendez votre expertise et souhaitez lister vos services plus tard.",
  },
  {
    key: "Employee",
    title: "Employé",
    desc: "Représente une organisation sans en être le propriétaire. Peut réseauter et planifier des rendez-vous.",
  },
  {
    key: "Expert",
    title: "Expert",
    desc: "Spécialiste dans un domaine. Parfait pour les ateliers, le mentorat et les opportunités B2B.",
  },
  {
    key: "Investor",
    title: "Investisseur",
    desc: "Business angel, VC ou investisseur corporate. Peut indiquer ses intérêts et se connecter avec des startups/exposants.",
  },
  {
    key: "Student",
    title: "Étudiant",
    desc: "Début de carrière. Apprend, développe son réseau et découvre des opportunités.",
  },
];

/* Track constants + family logic */
const TRACK_B2B_NAME = "B2B";
const MASTERCLASS = "masterclass";
const ATELIER = "atelier";

function familyOfTrack(track) {
  const t = String(track || "").toLowerCase();
  if (t.includes("masterclass")) return MASTERCLASS;
  if (t.includes("atelier")) return ATELIER;
  return "other";
}

const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // 5MB

function extractError(e) {
  if (!e) return "Registration failed";
  const d = e.data;
  if (typeof d === "string") return d;
  if (d?.message) return d.message;
  if (Array.isArray(d?.errors) && d.errors.length) {
    return d.errors
      .map((x) => x.msg || x.message || `${x.field || "field"} invalid`)
      .join("\n");
  }
  return e.error || e.message || "Registration failed";
}

function acceptPhotoFile(file, { onOK, onTooLarge, onNotImage }) {
  if (!file) return;
  if (!(file.type || "").startsWith("image/")) {
    onNotImage?.();
    return;
  }
  if (file.size > MAX_PHOTO_BYTES) {
    onTooLarge?.(file.size);
    return;
  }
  onOK?.(file);
}

/* SubRole options */
const SUBROLE_OPTIONS = [
  "Researchers",
  "Students",
  "Coaches & Trainers",
  "Experts & Consultants",
  "Employees & Professionals",
  "Entrepreneurs & Startups",
  "Developers & Engineers",
  "Marketing & Communication",
  "Audit, Accounting & Finance",
  "Investment & Banking",
  "Insurance & Microfinance",
  "Legal & Lawyers",
  "AI, IoT & Emerging Tech",
  "Audiovisual & Creative Industries",
  "Media & Journalists",
  "Universities & Academies",
  "NGOs & Civil Society",
  "Public Sector & Government",
  "Other"
];

function triggerPopup({ title, body, type = "success", link }) {
  try {
    const item = {
      type,
      status: type,
      title: title || "Notification",
      body: body || "",
      message: body || "",
      ts: Date.now(),
      showOnce: true,
      link: link ? { href: link.href, label: link.label || "Open" } : null,
      _source: "local",
    };
    localStorage.setItem("popup", JSON.stringify([item]));
    requestAnimationFrame(() => {
      window.dispatchEvent(new CustomEvent("app:popup:ready"));
    });
  } catch {}
}

/* Country list (fallback) */
const COUNTRIES = [
  { code: "TN", name: "Tunisia" },
  { code: "FR", name: "France" },
  { code: "US", name: "United States" },
  { code: "DE", name: "Germany" },
  { code: "IT", name: "Italy" },
  { code: "ES", name: "Spain" },
  { code: "MA", name: "Morocco" },
  { code: "DZ", name: "Algeria" },
  { code: "EG", name: "Egypt" },
  { code: "SA", name: "Saudi Arabia" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "GB", name: "United Kingdom" },
  { code: "CA", name: "Canada" },
];

/* Language list (max 3) */
const LANGS = [
  { code: "en", label: "English" },
  { code: "fr", label: "French" },
  { code: "ar", label: "Arabic" },
];

/* Objective chips */
const OBJECTIVES = [
  { code: "networking", label: "Networking" },
  { code: "find-partners", label: "Réseautage" },
  { code: "find-investors", label: "Trouver des investisseurs" },
  { code: "find-clients", label: "Trouver des clients" },
  { code: "learn-trends", label: "Apprendre les tendances" },
];

/* ===== Reusable Controls ===== */
function LanguageSelect({ value = [], onChange, max = 3 }) {
  const { t } = useTranslation("common");
  const toggle = (code) => {
    const has = value.includes(code);
    if (has) onChange(value.filter((v) => v !== code));
    else if (value.length < max) onChange([...value, code]);
  };
  const remove = (code) => onChange(value.filter((v) => v !== code));

  return (
    <div>
      <div className="lang-chips">
        {value.map((c) => {
          const item = LANGS.find((l) => l.code === c);
          return (
            <span key={c} className="lang-chip">
              {item?.label || c}
              <span className="x" onClick={() => remove(c)}>
                ×
              </span>
            </span>
          );
        })}
      </div>
      <div className="lang-grid">
        {LANGS.map((l) => {
          const active = value.includes(l.code);
          const disabled = !active && value.length >= max;
          return (
            <div
              key={l.code}
              className={`lang-item ${active ? "active" : ""} ${
                disabled ? "disabled" : ""
              }`}
              onClick={() => {
                if (!disabled || active) toggle(l.code);
              }}
              title={
                disabled
                  ? t("partnership.langLimit", "You can only select up to 3 languages")
                  : ""
              }
            >
              {l.label}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TrackSelect({ options = [], value = "", onChange, placeholder }) {
  const { t } = useTranslation("common");
  const [open, setOpen] = React.useState(false);
  const wrapRef = React.useRef(null);

  React.useEffect(() => {
    const onDoc = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const label = value || placeholder || t("partnership.allTracks", "All tracks");

  return (
    <div className="sel-wrap" ref={wrapRef}>
      <div className="sel-head" onClick={() => setOpen((v) => !v)}>
        <span className={value ? "" : "ph"}>{label}</span>
        <span style={{ fontWeight: 900, color: "#64748b" }}>
          {open ? "Up Arrow" : "Down Arrow"}
        </span>
      </div>
      {open && (
        <div className="sel-pop">
          <div
            className="sel-item"
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
          >
            {t("partnership.all", "All")}
          </div>
          {options.map((opt) => (
            <div
              key={opt}
              className="sel-item"
              onClick={() => {
                onChange(opt);
                setOpen(false);
              }}
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function GenderSelect({ value = "", onChange, name = "gender" }) {
  const { t } = useTranslation("common");
  const Item = ({ val, label }) => {
    const active = value === val;
    return (
      <label
        className={`lang-item ${active ? "active" : ""}`}
        style={{ cursor: "pointer" }}
      >
        <input
          type="radio"
          name={name}
          value={val}
          checked={active}
          onChange={() => onChange(val)}
          style={{ display: "none" }}
        />
        <span>{label}</span>
      </label>
    );
  };

  return (
    <div
      className="lang-grid"
      style={{ gridTemplateColumns: "repeat(2, minmax(0,1fr))" }}
    >
      <Item val="male" label={t("partnership.male", "Male")} />
      <Item val="female" label={t("partnership.female", "Female")} />
    </div>
  );
}

function ObjectiveSelect({ values = [], onChange }) {
  const { t } = useTranslation("common");
  const toggle = (code) => {
    const has = values.includes(code);
    if (has) onChange(values.filter((v) => v !== code));
    else onChange([...values, code]);
  };
  const remove = (code) => onChange(values.filter((v) => v !== code));

  return (
    <div>
      <div className="objective-grid">
        {OBJECTIVES.map((o) => {
          const active = values.includes(o.code);
          return (
            <div
              key={o.code}
              className={`lang-item ${active ? "active" : ""}`}
              onClick={() => toggle(o.code)}
            >
              {t(`partnership.objectives.${o.code}`, o.label)}
            </div>
          );
        })}
      </div>
      <div className="lang-chips" style={{ marginTop: 8 }}>
        {values.map((code) => {
          const item = OBJECTIVES.find((x) => x.code === code);
          return (
            <span key={code} className="lang-chip">
              {t(`partnership.objectives.${code}`, item?.label || code)}
              <span className="x" onClick={() => remove(code)}>
                ×
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

function SubRoleSelect({ values = [], onChange, options = [] }) {
  const toggle = (val) => {
    const has = values.includes(val);
    if (has) onChange(values.filter((v) => v !== val));
    else onChange([...values, val]);
  };
  return (
    <div className="subrole-grid">
      {options.map((opt) => {
        const active = values.includes(opt);
        return (
          <label
            key={opt}
            className={`subrole-item ${active ? "active" : ""}`}
          >
            <input type="checkbox" checked={active} onChange={() => toggle(opt)} />
            <span>{opt}</span>
          </label>
        );
      })}
    </div>
  );
}

/* ===== Session Helpers ===== */
const normSession = (s) => {
  const start =
    s.startAt || s.startTime || s.start || s.timeStart || s.startsAt;
  const end = s.endAt || s.endTime || s.end || s.timeEnd || s.endsAt;
  const startISO = start ? new Date(start).toISOString() : "";
  const dayISO = start ? startISO.slice(0, 10) : "unknown";
  return {
    _id: s._id,
    title: s.title || s.sessionTitle || "Session",
    summary: s.description || s.summary || "",
    track: s.track || "",
    tags: Array.isArray(s.tags) ? s.tags : [],
    speakers: Array.isArray(s.speakers) ? s.speakers : [],
    cover: s.cover || s.coverImage || s.photo || s.image || "",
    roomName: s.room?.name || s.roomName || "",
    roomLocation: s.room?.location || "",
    roomCapacity: s.room?.capacity || 0,
    seatsTaken:
      typeof s.seatsTaken === "number"
        ? s.seatsTaken
        : typeof s.seats_taken === "number"
        ? s.seats_taken
        : 0,
    startISO,
    endISO: end ? new Date(end).toISOString() : "",
    dayISO,
  };
};

function orderTracksWithEarliestFirst(groups) {
  const entries = Object.entries(groups).map(([track, items]) => {
    const earliest = items.reduce((min, s) => {
      const t = new Date(s.startISO).getTime();
      return Number.isFinite(t) ? Math.min(min, t) : min;
    }, Infinity);
    return { track, items, earliest };
  });

  entries.sort((a, b) => {
    const aIsB2B = a.track?.trim().toLowerCase() === TRACK_B2B_NAME.toLowerCase();
    const bIsB2B = b.track?.trim().toLowerCase() === TRACK_B2B_NAME.toLowerCase();
    if (aIsB2B && !bIsB2B) return 1;
    if (!aIsB2B && bIsB2B) return -1;
    if (a.earliest !== b.earliest) return a.earliest - b.earliest;
    return String(a.track || "").localeCompare(String(b.track || ""), undefined, {
      sensitivity: "base",
    });
  });

  return entries;
}

const groupByDayAndSlot = (raw) => {
  const sessions = raw.map(normSession).filter((x) => x.startISO);
  const dayMap = new Map();
  for (const s of sessions) {
    if (!dayMap.has(s.dayISO)) dayMap.set(s.dayISO, new Map());
    const slotKey = s.startISO;
    const slot = dayMap.get(s.dayISO);
    if (!slot.has(slotKey)) slot.set(slotKey, []);
    slot.get(slotKey).push(s);
  }

  const days = Array.from(dayMap.entries())
    .sort((a, b) => new Date(a[0]) - new Date(b[0]))
    .map(([dayISO, slotMap]) => ({
      dayISO,
      label: new Date(dayISO).toLocaleDateString(),
      slots: Array.from(slotMap.entries())
        .sort((a, b) => new Date(a[0]) - new Date(b[0]))
        .map(([startISO, items]) => ({ startISO, items })),
    }));

  return { sessions, days };
};

/* ===== Modal ===== */
function SessionModal({ open, onClose, session, counts }) {
  const { t } = useTranslation("common");
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  if (!open || !session) return null;

  const regFromSession = typeof session?.seatsTaken === "number" ? session.seatsTaken : NaN;
  const reg = Number.isFinite(regFromSession)
    ? regFromSession
    : Number(counts?.[session?._id]?.registered || 0);
  const wait = Number(counts?.[session?._id]?.waitlisted || 0);
  const cap = session?.roomCapacity || 0;
  const pct = cap ? Math.min(100, Math.round((reg / cap) * 100)) : 0;
  const title = session.title || session.sessionTitle || t("partnership.session", "Session");

  const node = (
    <div className="reg-modal-backdrop" onClick={onClose}>
      <div
        className="reg-modal reg-modal-lg"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="reg-modal-head">
          <div className="t">{title}</div>
          <button className="btn-line sm" onClick={onClose}>
            {t("partnership.close", "Close")}
          </button>
        </div>

        {session.cover ? (
          <img
            src={session.cover}
            alt={title}
            style={{
              width: "100%",
              height: 220,
              objectFit: "cover",
              borderRadius: 12,
              border: "1px solid #e5e7eb",
            }}
          />
        ) : null}

        <div className="reg-modal-body">
          <div className="meta-row">
            <span className="badge">
              {session.track || t("partnership.session", "Session")}
            </span>
            {session.roomName && (
              <span className="chip">
                {t("partnership.room", "Room")}: {session.roomName}
              </span>
            )}
            {session.roomLocation && (
              <span className="chip">
                {t("partnership.location", "Location")}: {session.roomLocation}
              </span>
            )}
            <span className="chip">
              {new Date(session.startISO).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}{" "}
              –{" "}
              {session.endISO
                ? new Date(session.endISO).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "—"}
            </span>
          </div>

          {!!session.speakers?.length && (
            <div className="speakers-row">
              <div className="subt">{t("partnership.speakers", "Speakers")}</div>
              <div className="speakers-list">
                {session.speakers.map((sp, i) => (
                  <span key={i} className="chip">
                    {(sp && (sp.name || sp.fullName)) || sp}
                  </span>
                ))}
              </div>
            </div>
          )}

          {!!session.tags?.length && (
            <div className="tag-row">
              {session.tags.map((t, i) => (
                <span key={i} className="tag">
                  {t}
                </span>
              ))}
            </div>
          )}

          {session.summary && <p className="descr">{session.summary}</p>}

          {(cap || reg || wait) && (
            <div className="capacity-row">
              <div className="subt">{t("partnership.capacity", "Capacity")}</div>
              <div className="cap-line">
                <div className="cap-bar" style={{ width: `${pct}%` }} />
              </div>
              <div className="cap-meta">
                <span>
                  <b>{reg}</b> {t("partnership.registered", "registered")}
                </span>
                {cap ? (
                  <span>
                    • <b>{cap}</b> {t("partnership.capacity", "capacity")}
                  </span>
                ) : null}
                {wait ? (
                  <span>
                    • <b>{wait}</b> {t("partnership.waitlisted", "waitlisted")}
                  </span>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(node, document.body);
}

/* ===== Main Component ===== */
export default function AttendeeRegisterPage() {
  const { t } = useTranslation("common");
  const { countries, loading: countriesLoading } = useCountries({ locale: "en" });
  const safeCountries = useMemo(
    () =>
      Array.isArray(countries) && countries.length ? countries : COUNTRIES,
    [countries]
  );

  const [params] = useSearchParams();
  const navigate = useNavigate();
  const eventId = params.get("eventId") || "68e6764bb4f9b08db3ccec04";
  const { data: event, isLoading: evLoading, isError: evErr } =
    useGetEventQuery(eventId, { skip: !eventId });

  const [roleType, setRoleType] = useState("");
  const [showSessions, setShowSessions] = useState(false);
  const [finished, setFinished] = useState(false);
  const [track, setTrack] = useState("");

  const { data: schedulePack, isFetching: schedFetching } =
    useGetEventSessionsQuery(
      { eventId, track, includeCounts: 1 },
      { skip: !eventId || !showSessions }
    );

  const [attendeeRegister, { isLoading: regLoading }] =
    useAttendeeRegisterMutation();

  const fileRef = useRef(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoUrl, setPhotoUrl] = useState("");
  useEffect(() => {
    if (photoFile) {
      const u = URL.createObjectURL(photoFile);
      setPhotoUrl(u);
      return () => URL.revokeObjectURL(u);
    }
    setPhotoUrl("");
  }, [photoFile]);

  const makeInitialForm = () => ({
    fullName: "",
    email: "",
    phone: "",
    country: "",
    city: "",
    orgName: "",
    jobTitle: "",
    website: "",
    linkedin: "",
    languages: [],
    objective: [],
    gender: "male",
    inviteCode: "",
    pwd: "",
    pwd2: "",
    virtualMeet: "",
    openToMeetings: true,
    subRoles: [],
  });

  const [form, setForm] = useState(makeInitialForm());
  const setField = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));
  const [errs, setErrs] = useState({});

  const isStudent = roleType === "Student";
  const showSubRoles = roleType && roleType !== "BusinessOwner";
  const shouldShowOrgFields = !isStudent;

  const handlePickRole = (key) => {
    if (key === roleType) return;
    setRoleType(key);
    setForm(makeInitialForm());
    setErrs({});
    setPhotoFile(null);
    setShowSessions(false);
    setSelectedBySlot({});
    setFinished(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const [selectedBySlot, setSelectedBySlot] = useState({});
  const compositeKeyFor = (session) => {
    const fam = familyOfTrack(session.track);
    const base = session.startISO;
    if (fam === MASTERCLASS || fam === ATELIER) return `${fam}|${base}`;
    return `*|${base}`;
  };

  const [modalSession, setModalSession] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const counts = schedulePack?.counts || {};

  const { sessions } = useMemo(() => {
    const raw =
      schedulePack?.data || schedulePack?.sessions || schedulePack || [];
    return groupByDayAndSlot(Array.isArray(raw) ? raw : []);
  }, [schedulePack]);

  const earliestDayISO = useMemo(() => {
    const ds = Array.from(
      new Set((sessions || []).map((s) => s.dayISO).filter(Boolean))
    );
    ds.sort((a, b) => new Date(a) - new Date(b));
    return ds[0] || null;
  }, [sessions]);

  const displaySessions = useMemo(() => {
    const rxFormation = /^\s*formation\s*$/i;
    return (sessions || []).filter((s) => {
      if (earliestDayISO && s.dayISO === earliestDayISO) return false;
      if (rxFormation.test(s.track || "")) return false;
      return true;
    });
  }, [sessions, earliestDayISO]);

  const uniqueTracks = useMemo(() => {
    const t = new Set();
    displaySessions.forEach((s) => {
      if (s.track) t.add(s.track);
    });
    return Array.from(t);
  }, [displaySessions]);

  const trackSections = useMemo(() => {
    if (!Array.isArray(displaySessions) || !displaySessions.length) return [];

    const group = {};
    for (const s of displaySessions) {
      if (track && s.track !== track) continue;
      const key = (s.track || t("partnership.other", "Other")).trim();
      if (!group[key]) group[key] = [];
      group[key].push(s);
    }
    for (const t of Object.keys(group)) {
      group[t].sort((a, b) => new Date(a.startISO) - new Date(b.startISO));
    }

    const ordered = orderTracksWithEarliestFirst(group);
    return ordered.map(({ track, items }) => ({ track, items }));
  }, [displaySessions, track, t]);

  useEffect(() => {
    setModalOpen(false);
    setModalSession(null);
    setSelectedBySlot({});
  }, [track]);

  const toggleSession = (session) => {
    const key = compositeKeyFor(session);
    setSelectedBySlot((prev) => {
      const curr = prev[key];
      if (curr && curr._id === session._id) {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      }
      return { ...prev, [key]: session };
    });
  };

  const selectedSessionIds = useMemo(
    () => Object.values(selectedBySlot).map((s) => s._id),
    [selectedBySlot]
  );

  const submitForm = (e) => {
    e.preventDefault();
    const e2 = {};
    if (!required(form.pwd)) e2.pwd = t("partnership.required", "Required");
    else if ((form.pwd || "").length < 8)
      e2.pwd = t("partnership.min8Chars", "Min 8 characters");
    if (form.pwd2 !== form.pwd)
      e2.pwd2 = t("partnership.passwordsDontMatch", "Passwords do not match");

    if (!required(form.fullName)) e2.fullName = t("partnership.required", "Required");
    if (!required(form.email)) e2.email = t("partnership.required", "Required");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email || ""))
      e2.email = t("partnership.invalidEmail", "Invalid email");
    if (!required(form.country)) e2.country = t("partnership.required", "Required");
    if (!form.languages?.length)
      e2.languages = t("partnership.chooseAtLeastOneLang", "Choose at least 1 language");
    if (!form.gender) e2.gender = t("partnership.required", "Required");
    if (shouldShowOrgFields) {
      if (!required(form.orgName)) e2.orgName = t("partnership.required", "Required");
      if (!required(form.jobTitle)) e2.jobTitle = t("partnership.required", "Required");
    }
    if (form.virtualMeet !== true && form.virtualMeet !== false)
      e2.virtualMeet = t("partnership.required", "Required");

    setErrs(e2);
    if (Object.keys(e2).length) return;

    setShowSessions(true);
    setTimeout(() => {
      const anchor = document.getElementById("sessions-anchor");
      if (anchor) anchor.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 40);
  };

  const finishAll = async () => {
    if (!selectedSessionIds.length) {
      alert(
        t(
          "partnership.selectAtLeastOneSession",
          "Please choose at least one session (one per time slot and track family)."
        )
      );
      return;
    }

    const fd = new FormData();
    fd.append("eventId", eventId);
    fd.append("role", "attendee");
    fd.append("actorType", roleType);
    fd.append("pwd", form.pwd);
    fd.append("personal.gender", form.gender || "");
    fd.append("personal.fullName", form.fullName);
    fd.append("personal.email", form.email);
    fd.append("personal.phone", form.phone);
    fd.append("personal.country", (form.country || "").toUpperCase());
    fd.append("personal.city", form.city);
    fd.append("personal.profilePic", "");

    if (shouldShowOrgFields) {
      fd.append("organization.orgName", form.orgName);
      fd.append("organization.jobTitle", form.jobTitle);
    }

    fd.append("businessProfile.preferredLanguages", form.languages.join(","));
    fd.append(
      "matchingIntent.objective",
      Array.isArray(form.objective) ? form.objective.join(",") : form.objective
    );
    fd.append("matchingIntent.openToMeetings", String(!!form.openToMeetings));
    fd.append("links.website", form.website);
    fd.append("links.linkedin", form.linkedin);
    fd.append("inviteCode", form.inviteCode);
    fd.append("virtualMeet", String(form.virtualMeet === true));
    if (Array.isArray(form.subRoles)) {
      form.subRoles.forEach((v) => fd.append("subRole[]", v));
    }
    selectedSessionIds.forEach((id) => fd.append("sessionIds[]", id));
    if (photoFile) fd.append("photo", photoFile);

    try {
      await attendeeRegister(fd).unwrap();
      triggerPopup({
        title: t("partnership.registrationComplete", "Registration complete"),
        body: t("partnership.startB2BJourney", "Start your B2B journey"),
        type: "success",
        link: { href: "/login", label: t("partnership.goToLogin", "Go to login") },
      });
      setFinished(true);
      setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 60);
      setTimeout(() => navigate("/"), 1400);
    } catch (e) {
      const msg = extractError(e);
      triggerPopup({
        title: t("partnership.registrationFailed", "Registration failed"),
        body: msg,
        type: "error",
      });
      setErrs((prev) => ({ ...prev, _submit: msg }));
    }
  };

  return (
    <>
      <HeaderShell top={topbar} nav={nav} cta={cta} />
      <div className="reg-wrap">
        {/* Event Header */}
        <header
          className="anim-in"
          style={{
            display: "grid",
            gridTemplateColumns: "140px 1fr",
            gap: 12,
            alignItems: "center",
          }}
        >
          {evLoading ? (
            <div className="reg-skel" />
          ) : evErr || !event ? (
            <div className="reg-empty">
              {t("partnership.eventNotFound", "Event not found")}
            </div>
          ) : (
            <>
              <img
                src={imageLink(event.cover) || imageLink("/default/cover.png")}
                alt={event.title}
                style={{
                  width: 140,
                  height: 90,
                  objectFit: "cover",
                  borderRadius: 12,
                  border: "1px solid #e5e7eb",
                }}
              />
              <div>
                <div style={{ fontWeight: 900, fontSize: 18 }}>
                  {event.title}
                </div>
                <div
                  style={{
                    color: "#475569",
                    fontWeight: 800,
                    display: "flex",
                    gap: 8,
                    alignItems: "center",
                  }}
                >
                  {toISODate(event.startDate)} → {toISODate(event.endDate)} •{" "}
                  {event.city || ""}
                  {event.country ? (
                    <>
                      <ReactCountryFlag
                        svg
                        countryCode={(event.country || "").toUpperCase()}
                        style={{ fontSize: "1.1em" }}
                      />
                      <span style={{ color: "#64748b", fontWeight: 700 }}>
                        {(event.country || "").toUpperCase()}
                      </span>
                    </>
                  ) : null}
                </div>
              </div>
            </>
          )}
        </header>

        {/* Role Selection */}
        <section className="anim-in">
          <div className="att-section-head">
            <div className="t">
              {t("partnership.chooseActorType", "Choose your actor type")}
            </div>
            <div className="h">
              {t(
                "partnership.selectRoleHint",
                "By selecting, the form appears below. Changing the type resets the form and session choices."
              )}
            </div>
          </div>
          <div className="role-grid">
            {ROLE_TYPES.map((r) => {
              const active = roleType === r.key;
              return (
                <article
                  key={r.key}
                  onClick={() => handlePickRole(r.key)}
                  className={`role-card ${active ? "active" : ""}`}
                  title={t(`partnership.roles.${r.key}.title`, r.title)}
                >
                  <div className="role-title">
                    {t(`partnership.roles.${r.key}.title`, r.title)}
                  </div>
                  <div className="role-desc">
                    {t(`partnership.roles.${r.key}.desc`, r.desc)}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* Registration Form */}
        {roleType && !finished && (
          <form
            className="anim-in reg-card"
            onSubmit={submitForm}
            style={{ marginTop: 14 }}
          >
            <div className="att-section-head">
              <div className="t">
                {t("partnership.participantDetails", "Participant details")}
              </div>
              <div className="h">
                {t("partnership.requiredFields", "All fields marked")}{" "}
                <span
                  className="req"
                  style={{ color: "#ef4444", fontWeight: 800 }}
                >
                  *
                </span>{" "}
                {t("partnership.areRequired", "are required")}
              </div>
            </div>

            <div className="att-form-grid">
              {/* Full Name */}
              <div className="att-field">
                <label>
                  {t("partnership.fullName", "Full name")}{" "}
                  <span className="req">*</span>
                </label>
                <input
                  value={form.fullName}
                  onChange={(e) => setField("fullName", e.target.value)}
                />
                {errs.fullName && (
                  <div style={{ color: "#ef4444", fontWeight: 800 }}>
                    {errs.fullName}
                  </div>
                )}
              </div>

              {/* Email */}
              <div className="att-field">
                <label>
                  {t("partnership.email", "Email")}{" "}
                  <span className="req">*</span>
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setField("email", e.target.value)}
                />
                {errs.email && (
                  <div style={{ color: "#ef4444", fontWeight: 800 }}>
                    {errs.email}
                  </div>
                )}
              </div>

              {/* Phone */}
              <div className="att-field">
                <label>{t("partnership.phone", "Phone")}</label>
                <input
                  value={form.phone}
                  onChange={(e) => setField("phone", e.target.value)}
                />
              </div>

              {/* Country */}
              <div className="att-field">
                <label className="mp-field">
                  <span className="mp-label">
                    {t("partnership.country", "Country")}
                  </span>
                  <CountrySelect
                    value={form.country || ""}
                    onChange={(v) =>
                      setField("country", v?.target ? v.target.value : v)
                    }
                    options={safeCountries}
                    placeholder={t("partnership.selectCountry", "Select country")}
                  />
                  {countriesLoading && (
                    <div className="hint">
                      {t("partnership.loadingCountries", "Loading countries…")}
                    </div>
                  )}
                </label>
                {errs.country && (
                  <div style={{ color: "#ef4444", fontWeight: 800 }}>
                    {errs.country}
                  </div>
                )}
              </div>

              {/* City */}
              <div className="att-field">
                <label>{t("partnership.city", "City")}</label>
                <input
                  value={form.city}
                  onChange={(e) => setField("city", e.target.value)}
                />
              </div>

              {/* Gender */}
              <div className="att-field">
                <label>
                  {t("partnership.gender", "Gender")}
                  <span className="req"> *</span>
                </label>
                <GenderSelect
                  value={form.gender}
                  onChange={(v) => setField("gender", v)}
                />
              </div>

              {/* Org Fields */}
              {shouldShowOrgFields && (
                <>
                  <div className="att-field">
                    <label>
                      {t("partnership.organization", "Organization")}{" "}
                      <span className="req">*</span>
                    </label>
                    <input
                      value={form.orgName}
                      onChange={(e) => setField("orgName", e.target.value)}
                    />
                    {errs.orgName && (
                      <div style={{ color: "#ef4444", fontWeight: 800 }}>
                        {errs.orgName}
                      </div>
                    )}
                  </div>

                  <div className="att-field">
                    <label>
                      {t("partnership.jobTitle", "Job title")}{" "}
                      <span className="req">*</span>
                    </label>
                    <input
                      value={form.jobTitle}
                      onChange={(e) => setField("jobTitle", e.target.value)}
                    />
                    {errs.jobTitle && (
                      <div style={{ color: "#ef4444", fontWeight: 800 }}>
                        {errs.jobTitle}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Password */}
              <div className="att-field">
                <label>
                  {t("partnership.password", "Password")}{" "}
                  <span className="req">*</span>
                </label>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto",
                    gap: 8,
                  }}
                >
                  <input
                    type={showPwd ? "text" : "password"}
                    value={form.pwd}
                    onChange={(e) => setField("pwd", e.target.value)}
                    placeholder={t(
                      "partnership.atLeast8Chars",
                      "At least 8 characters"
                    )}
                  />
                  <button
                    type="button"
                    className="btn-line"
                    onClick={() => setShowPwd((v) => !v)}
                    aria-label={
                      showPwd
                        ? t("partnership.hidePassword", "Hide password")
                        : t("partnership.showPassword", "Show password")
                    }
                  >
                    {showPwd
                      ? t("partnership.hide", "Hide")
                      : t("partnership.show", "Show")}
                  </button>
                </div>
                {errs.pwd && (
                  <div style={{ color: "#ef4444", fontWeight: 800 }}>
                    {errs.pwd}
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="att-field">
                <label>
                  {t("partnership.confirmPassword", "Confirm password")}{" "}
                  <span className="req">*</span>
                </label>
                <input
                  type={showPwd ? "text" : "password"}
                  value={form.pwd2}
                  onChange={(e) => setField("pwd2", e.target.value)}
                  placeholder={t(
                    "partnership.repeatPassword",
                    "Repeat your password"
                  )}
                />
                {errs.pwd2 && (
                  <div style={{ color: "#ef4444", fontWeight: 800 }}>
                    {errs.pwd2}
                  </div>
                )}
              </div>

              {/* Website */}
              <div className="att-field">
                <label>
                  {t("partnership.website", "Website / Facebook / Instagram…")}
                </label>
                <input
                  placeholder="https://…"
                  value={form.website}
                  onChange={(e) => setField("website", e.target.value)}
                />
              </div>

              {/* LinkedIn */}
              <div className="att-field">
                <label>{t("partnership.linkedin", "LinkedIn")}</label>
                <input
                  placeholder="https://linkedin.com/in/…"
                  value={form.linkedin}
                  onChange={(e) => setField("linkedin", e.target.value)}
                />
              </div>

              {/* Invite Code */}
              <div className="att-field">
                <label>{t("partnership.inviteCode", "Invite code")}</label>
                <input
                  placeholder={t(
                    "partnership.optionalInvite",
                    "optional if you had one"
                  )}
                  value={form.inviteCode}
                  onChange={(e) => setField("inviteCode", e.target.value)}
                />
              </div>

              {/* Languages */}
              <div className="att-field full">
                <label>
                  {t("partnership.preferredLanguages", "Preferred languages")}{" "}
                  <span className="req">*</span>
                </label>
                <LanguageSelect
                  value={form.languages}
                  onChange={(v) => setField("languages", v)}
                  max={3}
                />
                {errs.languages && (
                  <div style={{ color: "#ef4444", fontWeight: 800 }}>
                    {errs.languages}
                  </div>
                )}
              </div>

              {/* Sub Roles */}
              {showSubRoles && (
                <div className="att-field full">
                  <label>
                    {t(
                      "partnership.specialtySector",
                      "Your specialty sector (multi-select)"
                    )}
                  </label>
                  <SubRoleSelect
                    values={form.subRoles}
                    onChange={(v) => setField("subRoles", v)}
                    options={SUBROLE_OPTIONS}
                  />
                  <div className="hint">
                    {t("partnership.selectAllThatApply", "Select all that apply.")}
                  </div>
                </div>
              )}

              {/* Objectives */}
              <div className="att-field full">
                <label>{t("partnership.objective", "Objective")}</label>
                <ObjectiveSelect
                  values={form.objective}
                  onChange={(v) => setField("objective", v)}
                />
              </div>

              {/* Open to Meetings */}
              <div
                className="att-field full"
                style={{ alignItems: "flex-start" }}
              >
                <label>
                  {t("partnership.availableForMeetings", "Available for meetings?")}
                </label>
                <label className="chk-inline as-switch">
                  <input
                    type="checkbox"
                    checked={!!form.openToMeetings}
                    onChange={(e) =>
                      setField("openToMeetings", e.target.checked)
                    }
                  />
                  <span className="sw" aria-hidden="true">
                    <span className="knob" />
                  </span>
                  <span className="txt">
                    {t("partnership.yesAllowB2B", "Yes, allow B2B requests")}
                  </span>
                </label>
              </div>

              {/* Meeting Mode */}
              <div className="att-field full">
                <label>
                  {t("partnership.meetingMode", "Meeting mode")}{" "}
                  <span className="req">*</span>
                </label>
                <div
                  className="lang-grid"
                  style={{ gridTemplateColumns: "repeat(2, minmax(0,1fr))" }}
                >
                  <label
                    className={`lang-item ${
                      form.virtualMeet === false ? "active" : ""
                    }`}
                    style={{ cursor: "pointer" }}
                  >
                    <input
                      type="radio"
                      name="virtualMeet"
                      value="physical"
                      checked={form.virtualMeet === false}
                      onChange={() => setField("virtualMeet", false)}
                      style={{ display: "none" }}
                    />
                    <span>
                      {t("partnership.inPerson", "In-person (physical)")}
                    </span>
                  </label>
                  <label
                    className={`lang-item ${
                      form.virtualMeet === true ? "active" : ""
                    }`}
                    style={{ cursor: "pointer" }}
                  >
                    <input
                      type="radio"
                      name="virtualMeet"
                      value="virtual"
                      checked={form.virtualMeet === true}
                      onChange={() => setField("virtualMeet", true)}
                      style={{ display: "none" }}
                    />
                    <span>{t("partnership.virtual", "Virtual")}</span>
                  </label>
                </div>
                {errs.virtualMeet && (
                  <div style={{ color: "#ef4444", fontWeight: 800 }}>
                    {errs.virtualMeet}
                  </div>
                )}
              </div>

              {/* Photo Upload */}
              <div className="att-field full">
                <label>
                  {t("partnership.profilePhoto", "Profile photo (optional)")}
                </label>
                <div
                  className="att-photo-drop"
                  onClick={() => fileRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const f = e.dataTransfer.files?.[0];
                    acceptPhotoFile(f, {
                      onOK: (file) => {
                        setErrs((p) => ({ ...p, photo: "" }));
                        setPhotoFile(file);
                      },
                      onTooLarge: () => {
                        setPhotoFile(null);
                        setErrs((p) => ({
                          ...p,
                          photo: t(
                            "partnership.imageTooLarge",
                            "Image too large (max 5 MB)"
                          ),
                        }));
                        triggerPopup({
                          type: "error",
                          title: t("partnership.invalidImage", "Invalid image"),
                          body: t(
                            "partnership.photoExceeds5MB",
                            "The photo exceeds 5 MB. Please choose a smaller image."
                          ),
                        });
                      },
                      onNotImage: () => {
                        setPhotoFile(null);
                        setErrs((p) => ({
                          ...p,
                          photo: t("partnership.notAnImage", "Not an image file"),
                        }));
                        triggerPopup({
                          type: "error",
                          title: t("partnership.unsupportedFile", "Unsupported file"),
                          body: t(
                            "partnership.selectImagePNGJPG",
                            "Please select an image (PNG/JPG)."
                          ),
                        });
                      },
                    });
                  }}
                >
                  {!photoUrl ? (
                    <div className="att-photo-empty">
                      <div className="ico">Photo Icon</div>
                      <div className="t">
                        {t(
                          "partnership.dropImageHere",
                          "Drop an image here or click to choose"
                        )}
                      </div>
                      <div className="h">
                        {t(
                          "partnership.pngJpgLess5MB",
                          "PNG/JPG, less than 5 MB (optional)"
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="att-photo-prev">
                      <img src={photoUrl} alt={t("partnership.preview", "preview")} />
                      <div className="att-photo-actions">
                        <button
                          type="button"
                          className="btn-line"
                          onClick={() => fileRef.current?.click()}
                        >
                          {t("partnership.change", "Change")}
                        </button>
                        <button
                          type="button"
                          className="btn-line"
                          onClick={() => setPhotoFile(null)}
                        >
                          {t("partnership.delete", "Delete")}
                        </button>
                      </div>
                    </div>
                  )}
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => {
                      const f = e.target.files?.[0] || null;
                      acceptPhotoFile(f, {
                        onOK: (file) => {
                          setErrs((p) => ({ ...p, photo: "" }));
                          setPhotoFile(file);
                        },
                        onTooLarge: () => {
                          setPhotoFile(null);
                          setErrs((p) => ({
                            ...p,
                            photo: t(
                              "partnership.imageTooLarge",
                              "Image too large (max 5 MB)"
                            ),
                          }));
                          triggerPopup({
                            type: "error",
                            title: t("partnership.invalidImage", "Invalid image"),
                            body: t(
                              "partnership.photoExceeds5MB",
                              "The photo exceeds 5 MB. Please choose a smaller image."
                            ),
                          });
                        },
                        onNotImage: () => {
                          setPhotoFile(null);
                          setErrs((p) => ({
                            ...p,
                            photo: t("partnership.notAnImage", "Not an image file"),
                          }));
                          triggerPopup({
                            type: "error",
                            title: t("partnership.unsupportedFile", "Unsupported file"),
                            body: t(
                              "partnership.selectImagePNGJPG",
                              "Please select an image (PNG/JPG)."
                            ),
                          });
                        },
                      });
                    }}
                  />
                </div>
                {errs.photo && (
                  <div style={{ color: "#ef4444", fontWeight: 800, marginTop: 8 }}>
                    {errs.photo}
                  </div>
                )}
              </div>
            </div>

            <div className="att-actions" style={{ justifyContent: "flex-end" }}>
              <button type="submit" className="btn">
                {t("partnership.continue", "Continue")}
              </button>
            </div>
          </form>
        )}

        {/* Session Selection */}
        {roleType && showSessions && !finished && (
          <section
            className="anim-in"
            id="sessions-anchor"
            style={{ marginTop: 16 }}
          >
            <div className="att-section-head">
              <div className="t">
                {t("partnership.selectSessions", "Select your sessions")}
              </div>
              <div className="h">
                {t(
                  "partnership.parallelTracksHint",
                  "Parallel tracks: you can choose a masterclass and an atelier in the same slot, but not two from the same family."
                )}
              </div>
            </div>

            <div className="filter-bar">
              <TrackSelect
                options={uniqueTracks}
                value={track}
                onChange={setTrack}
                placeholder={t("partnership.allTracks", "All tracks")}
              />
            </div>

            {schedFetching ? (
              <div className="reg-skel" style={{ height: 160 }} />
            ) : !trackSections.length ? (
              <div className="reg-empty">
                {t("partnership.noSessionsAvailable", "No sessions available at the moment.")}
              </div>
            ) : (
              <div className="att-session-list-v2">
                {trackSections.map((section) => (
                  <div key={section.track} className="att-track-section-v2">
                    <div className="att-track-sep-v2">{section.track}</div>
                    {section.items?.map((s) => {
                      const compositeKey = compositeKeyFor(s);
                      const isSelected =
                        selectedBySlot[compositeKey]?._id === s._id;
                      const c = counts?.[s._id] || {};
                      const reg = Number(
                        typeof s.seatsTaken === "number" ? s.seatsTaken : NaN
                      );
                      const regSafe = Number.isFinite(reg)
                        ? reg
                        : Number(c.registered || 0);
                      const cap = s.roomCapacity || 0;
                      const pct = cap
                        ? Math.min(100, Math.round((reg / cap) * 100))
                        : 0;
                      const title = s.title || s.sessionTitle || t("partnership.session", "Session");
                      const when = new Date(s.startISO);

                      return (
                        <article
                          key={s._id}
                          className={`att-session-card-v2 ${
                            isSelected ? "is-selected" : ""
                          }`}
                          onClick={() => toggleSession(s)}
                          title={title}
                        >
                          <div className="session-head-v2">
                            <div className="session-chipline-v2">
                              {s.track ? (
                                <span className="badge">{s.track}</span>
                              ) : (
                                <span className="chip">
                                  {t("partnership.session", "Session")}
                                </span>
                              )}
                              {s.roomName ? (
                                <span className="chip">
                                  {t("partnership.room", "Room")}: {s.roomName}
                                </span>
                              ) : null}
                              {s.roomLocation ? (
                                <span className="chip">
                                  {t("partnership.loc", "Loc")}: {s.roomLocation}
                                </span>
                              ) : null}
                              <span className="chip">
                                {when.toLocaleDateString(undefined, {
                                  weekday: "short",
                                  month: "short",
                                  day: "numeric",
                                })}{" "}
                                •{" "}
                                {when.toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                            <div className="att-session-title-v2">{title}</div>
                            {!!s.speakers?.length && (
                              <div className="att-session-meta-v2">
                                {s.speakers
                                  .map(
                                    (x) => (x && (x.name || x.fullName)) || x
                                  )
                                  .join(", ")}
                              </div>
                            )}
                          </div>

                          {s.summary ? (
                            <div className="session-summary-v2">
                              {s.summary.length > 220
                                ? `${s.summary.slice(0, 220)}…`
                                : s.summary}
                            </div>
                          ) : null}

                          {(cap || reg) && (
                            <div className="cap-mini-v2">
                              <div className="cap-mini-line">
                                <div
                                  className="cap-mini-bar"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <div className="cap-mini-meta">
                                <span>
                                  <b>{regSafe}</b>{" "}
                                  {t("partnership.registered", "registered")}
                                </span>
                                {cap ? (
                                  <span>
                                    • <b>{cap}</b>{" "}
                                    {t("partnership.capacity", "capacity")}
                                  </span>
                                ) : null}
                                {c.waitlisted ? (
                                  <span>
                                    • <b>{c.waitlisted}</b>{" "}
                                    {t("partnership.waitlist", "waitlist")}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          )}

                          <div className="session-actions-v2">
                            <button
                              type="button"
                              className="btn-line sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setModalSession(s);
                                setModalOpen(true);
                              }}
                            >
                              {t("partnership.info", "Info")}
                            </button>
                            <button
                              type="button"
                              className={`btn sm`}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleSession(s);
                              }}
                            >
                              {isSelected
                                ? t("partnership.selected", "Selected")
                                : t("partnership.select", "Select")}
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}

            <div className="att-actions" style={{ marginTop: 16 }}>
              <button
                className="btn"
                disabled={regLoading}
                onClick={finishAll}
              >
                {regLoading
                  ? t("partnership.sending", "Sending…")
                  : t("partnership.submit", "Submit")}
              </button>
            </div>
          </section>
        )}

        {/* Success */}
        {finished && (
          <div className="anim-in">
            <div
              className="reg-empty"
              style={{ borderStyle: "solid", color: "#111827" }}
            >
              Success Icon {t("partnership.registrationReceived", "Registration received. We also displayed a popup with a quick link.")}
              <div style={{ marginTop: 8 }}>
                <a className="btn" href="/login">
                  {t(
                    "partnership.discoverYourAccount",
                    "Discover your B2B account"
                  )}
                </a>
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer
        brand={footerData.brand}
        columns={footerData.columns}
        socials={footerData.socials}
        actions={footerData.actions}
        bottomLinks={footerData.bottomLinks}
      />

      <SessionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        session={modalSession}
        counts={counts}
      />
    </>
  );
}