// src/pages/register/ExhibitorRegisterPage.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { useSearchParams, useNavigate } from "react-router-dom";
import ReactCountryFlag from "react-country-flag";
import "./exhibitor-register.css";

import HeaderShell from "../../components/layout/HeaderShell";
import { cta, footerData, nav, topbar } from "../main.mock";
import Footer from "../../components/footer/Footer";

/** RTK hooks */
import { useGetEventQuery } from "../../features/events/eventsApiSlice";
import { useGetEventSessionsQuery } from "../../features/events/scheduleApiSlice";
import { useExhibitorRegisterMutation } from "../../features/auth/authApiSlice";
import imageLink from "../../utils/imageLink";

/* ================= Small helpers (same tone as attendee) ================= */
const toISODate = (v) => (v ? new Date(v).toLocaleDateString() : "");
const required = (v) => ((typeof v === "string" ? v.trim() : v) ? true : false);
const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/* Actor types (no Student/Expert here, matches prior exhibitor scope) */
const ROLE_TYPES = [
  { key: "BusinessOwner", title: "Business Owner", desc: "Owns or co-owns a company. Can later add sectors, products & services." },
  { key: "Consultant",    title: "Consultant",    desc: "Advises businesses. Good fit if you sell expertise/services." },
  { key: "Employee",      title: "Employee",      desc: "Represents an organization. Network and book meetings." },
  { key: "Investor",      title: "Investor",      desc: "Angel/VC/Corporate. Signal interests and match with startups/exhibitors." },
];

/* SubRole options (kept lightweight) */
const SUBROLE_OPTIONS = [
  "Coaches & Trainers","Experts & Consultants","Students","Employees & Professionals","Researchers",
  "Media & Journalists","Legal & Lawyers","Developers & Engineers","Audit & Accounting","Investment & Banking",
  "Insurance & Microfinance","Marketing & Communication","Audiovisual & Creative Industries","AI, IoT & Emerging Tech",
];

/* Countries (trimmed) */
const COUNTRIES = [
  { code: "TN", name: "Tunisia" }, { code: "FR", name: "France" }, { code: "US", name: "United States" },
  { code: "DE", name: "Germany" }, { code: "IT", name: "Italy" },  { code: "ES", name: "Spain" },
  { code: "MA", name: "Morocco" }, { code: "DZ", name: "Algeria" },{ code: "EG", name: "Egypt" },
  { code: "SA", name: "Saudi Arabia" }, { code: "AE", name: "United Arab Emirates" },
  { code: "GB", name: "United Kingdom" }, { code: "CA", name: "Canada" },
];

/* Languages (max 3) */
const LANGS = [
  { code: "en", label: "English" },
  { code: "fr", label: "French"  },
  { code: "ar", label: "Arabic"  },
];

/* Exhibitor industries (simple list) */
const INDUSTRIES = [
  "AI & IoT","Logistics","Fintech","Marketing","Media","Insurance","Micro Finance",
  "Audit & Accounting","Audio Visual","Investment","Other",
];

/* ==== Shared mini-controls (mirrors AttendeeRegisterPage look/feel) ==== */
function CountrySelect({ value, onChange, placeholder = "Select country" }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const list = useMemo(() => {
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    return COUNTRIES.filter(c => rx.test(c.name) || rx.test(c.code));
  }, [q]);
  const selected = COUNTRIES.find(c => c.code === (value || "").toUpperCase()) || null;

  return (
    <div className="sel-wrap">
      <div className="sel-head" onClick={() => setOpen(v => !v)}>
        {!selected ? (
          <span className="ph">{placeholder}</span>
        ) : (
          <span className="sel-flag">
            <ReactCountryFlag svg countryCode={selected.code} style={{ fontSize: "1.2em" }} />
            {selected.name} <span style={{ color:"#64748b", fontWeight:800 }}>({selected.code})</span>
          </span>
        )}
        <span style={{ fontWeight:900, color:"#64748b" }}>{open ? "▲" : "▼"}</span>
      </div>
      {open && (
        <div className="sel-pop">
          <div className="sel-search">
            <input placeholder="Search country…" value={q} onChange={e => setQ(e.target.value)} />
          </div>
          {list.map(c => (
            <div key={c.code} className="sel-item" onClick={() => { onChange(c.code); setOpen(false); setQ(""); }}>
              <ReactCountryFlag svg countryCode={c.code} style={{ fontSize:"1.1em" }} />
              <span className="name">{c.name}</span>
              <span className="code">{c.code}</span>
            </div>
          ))}
          {!list.length && <div className="sel-item" style={{ color:"#64748b" }}>No results</div>}
        </div>
      )}
    </div>
  );
}

function LanguageSelect({ value = [], onChange, max = 3 }) {
  const toggle = (code) => {
    const has = value.includes(code);
    if (has) onChange(value.filter(v => v !== code));
    else if (value.length < max) onChange([...value, code]);
  };
  const remove = (code) => onChange(value.filter(v => v !== code));

  return (
    <div>
      <div className="lang-chips">
        {value.map(c => {
          const item = LANGS.find(l => l.code === c);
          return (
            <span key={c} className="lang-chip">
              {item?.label || c}
              <span className="x" onClick={() => remove(c)}>×</span>
            </span>
          );
        })}
        {value.length === 0 && <span style={{ color:"#94a3b8", fontWeight:700 }}>Pick up to 3</span>}
      </div>
      <div className="lang-grid">
        {LANGS.map(l => {
          const active = value.includes(l.code);
          const disabled = !active && value.length >= max;
          return (
            <div
              key={l.code}
              className={`lang-item ${active ? "active":""} ${disabled ? "disabled":""}`}
              onClick={() => { if (!disabled || active) toggle(l.code); }}
              title={disabled ? "You can only select up to 3 languages" : ""}
            >
              {l.label}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* Same compact track picker as Attendee page */
function TrackSelect({ options = [], value = "", onChange, placeholder = "All tracks" }) {
  const [open, setOpen] = React.useState(false);
  const wrapRef = React.useRef(null);
  React.useEffect(() => {
    const onDoc = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);
  const label = value || placeholder;
  return (
    <div className="sel-wrap" ref={wrapRef}>
      <div className="sel-head" onClick={() => setOpen(v => !v)}>
        <span className={value ? '' : 'ph'}>{label}</span>
        <span style={{ fontWeight: 900, color: '#64748b' }}>{open ? '▲' : '▼'}</span>
      </div>
      {open && (
        <div className="sel-pop">
          <div className="sel-item" onClick={() => { onChange(''); setOpen(false); }}>All</div>
          {options.map(opt => (
            <div key={opt} className="sel-item" onClick={() => { onChange(opt); setOpen(false); }}>
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* Popup trigger (same bridge) */
function triggerPopup({ title, body, type = "success", link }) {
  try {
    const item = {
      type, status: type,
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

/* ================== Sessions helpers (normalize & sort) ================== */
const normSession = (s) => {
  const start = s.startAt || s.startTime || s.start || s.timeStart || s.startsAt;
  const end   = s.endAt   || s.endTime   || s.end   || s.timeEnd   || s.endsAt;
  const startISO = start ? new Date(start).toISOString() : "";
  const dayISO = start ? startISO.slice(0,10) : "unknown";
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
    seatsTaken: typeof s.seatsTaken === 'number' ? s.seatsTaken : 0,
    startISO,
    endISO: end ? new Date(end).toISOString() : "",
    dayISO,
  };
};

const isB2B = (name) => String(name || '').trim().toLowerCase() === 'b2b';

function orderTracksWithEarliestFirst(groups) {
  const entries = Object.entries(groups).map(([track, items]) => {
    const earliest = items.reduce((min, s) => {
      const t = new Date(s.startISO).getTime();
      return Number.isFinite(t) ? Math.min(min, t) : min;
    }, Infinity);
    return { track, items, earliest };
  });

  entries.sort((a, b) => {
    const aIsB2B = isB2B(a.track);
    const bIsB2B = isB2B(b.track);
    if (aIsB2B && !bIsB2B) return 1;   // B2B last
    if (!aIsB2B && bIsB2B) return -1;
    if (a.earliest !== b.earliest) return a.earliest - b.earliest;
    return String(a.track || "").localeCompare(String(b.track || ""), undefined, { sensitivity: "base" });
  });
  return entries;
}

/* Separate families like attendee logic (masterclass vs atelier vs other) */
function conflictBucket(track) {
  const t = String(track || "").toLowerCase();
  if (t.includes("atelier")) return "atelier";
  if (t.includes("masterclass")) return "masterclass";
  return "other";
}

/* Session details modal (same style) */
function SessionModal({ open, onClose, session, counts }) {
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = prev; };
    }
  }, [open]);
  if (!open || !session) return null;

  const regFromS = typeof session?.seatsTaken === 'number' ? session.seatsTaken : NaN;
  const reg = Number.isFinite(regFromS) ? regFromS : Number(counts?.[session?._id]?.registered || 0);
  const wait = Number(counts?.[session?._id]?.waitlisted || 0);
  const cap  = session.roomCapacity || 0;
  const pct  = cap ? Math.min(100, Math.round((reg / cap) * 100)) : 0;
  const title = session.title || session.sessionTitle || "Session";

  const node = (
    <div className="reg-modal-backdrop" onClick={onClose}>
      <div className="reg-modal reg-modal-lg" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
        <div className="reg-modal-head">
          <div className="t">{title}</div>
          <button className="btn-line sm" onClick={onClose}>Close</button>
        </div>

        {session.cover ? (
          <img
            src={session.cover}
            alt={title}
            style={{ width:"100%", height:220, objectFit:"cover", borderRadius:12, border:"1px solid #e5e7eb" }}
          />
        ) : null}

        <div className="reg-modal-body">
          <div className="meta-row">
            <span className="badge">{session.track || "Session"}</span>
            {session.roomName && <span className="chip">Room: {session.roomName}</span>}
            {session.roomLocation && <span className="chip">Location: {session.roomLocation}</span>}
            <span className="chip">
              {new Date(session.startISO).toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" })} – {session.endISO ? new Date(session.endISO).toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" }) : "—"}
            </span>
          </div>

          {!!session.speakers?.length && (
            <div className="speakers-row">
              <div className="subt">Speakers</div>
              <div className="speakers-list">
                {session.speakers.map((sp, i) => (
                  <span key={i} className="chip">{(sp && (sp.name || sp.fullName)) || sp}</span>
                ))}
              </div>
            </div>
          )}

          {!!session.tags?.length && (
            <div className="tag-row">
              {session.tags.map((t, i) => <span key={i} className="tag">{t}</span>)}
            </div>
          )}

          {(cap || reg || wait) ? (
            <div className="capacity-row">
              <div className="subt">Capacity</div>
              <div className="cap-line"><div className="cap-bar" style={{ width: `${pct}%` }} /></div>
              <div className="cap-meta">
                <span><b>{reg}</b> registered</span>
                {cap ? <span>• <b>{cap}</b> capacity</span> : null}
                {wait ? <span>• <b>{wait}</b> waitlisted</span> : null}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
  return ReactDOM.createPortal(node, document.body);
}

/* ============================== Main ============================== */
export default function ExhibitorRegisterPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  // progressive reveal like attendee (role → form → sessions → done)
  const [step, setStep] = useState(1);

  const eventId = params.get("eventId") || "68e6764bb4f9b08db3ccec04";
  const { data: event, isLoading: evLoading, isError: evErr } = useGetEventQuery(eventId, { skip: !eventId });

  /* Track filter (compact selector to match attendee style) */
  const [track, setTrack] = useState("");

  const { data: schedulePack, isFetching: schedFetching } = useGetEventSessionsQuery(
    { eventId, track, includeCounts: 1 },
    { skip: !eventId || step !== 3 },
  );

  const [exhibitorRegister, { isLoading: regLoading }] = useExhibitorRegisterMutation();

  /* Files: logo (optional) + contact photo (optional) */
  const logoRef = useRef(null);
  const [logoFile, setLogoFile] = useState(null);
  const [logoUrl, setLogoUrl] = useState("");

  const photoRef = useRef(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoUrl, setPhotoUrl] = useState("");

  useEffect(() => {
    if (logoFile) {
      const u = URL.createObjectURL(logoFile);
      setLogoUrl(u);
      return () => URL.revokeObjectURL(u);
    }
    setLogoUrl("");
  }, [logoFile]);

  useEffect(() => {
    if (photoFile) {
      const u = URL.createObjectURL(photoFile);
      setPhotoUrl(u);
      return () => URL.revokeObjectURL(u);
    }
    setPhotoUrl("");
  }, [photoFile]);

  /* Role + form */
  const [roleType, setRoleType] = useState("");

  const [form, setForm] = useState({
    exhibitorName: "",
    contactName: "",
    email: "",
    phone: "",
    country: "",
    city: "",
    orgName: "",
    industry: "",
    website: "",
    linkedin: "",
    languages: [],
    availableMeetings: true,
    subRoles: [],
    pwd: "",
    pwd2: "",
  });
  const setField = (k, v) => setForm(prev => ({ ...prev, [k]: v }));
  const [errs, setErrs] = useState({});
  const [showPwd, setShowPwd] = useState(false);

  // show sub-roles for all except BusinessOwner (aligns with attendee vibe)
  const showSubRoles = roleType && roleType !== "BusinessOwner";
  useEffect(() => { if (!showSubRoles && form.subRoles.length) setField("subRoles", []); }, [showSubRoles]); // eslint-disable-line

  /* Sessions & modal */
  const [selectedBySlot, setSelectedBySlot] = useState({});
  const [modalSession, setModalSession] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const counts = schedulePack?.counts || {};

  /* Normalize sessions */
  const sessionsRaw = useMemo(() => {
    const raw = (schedulePack?.data || schedulePack?.sessions || schedulePack || []);
    return (Array.isArray(raw) ? raw : []).map(normSession).filter(x => x.startISO);
  }, [schedulePack]);

  // Match attendee display: drop earliest day entirely + drop “Formation” track
  const earliestDayISO = useMemo(() => {
    const ds = Array.from(new Set((sessionsRaw || []).map(s => s.dayISO).filter(Boolean)));
    ds.sort((a, b) => new Date(a) - new Date(b));
    return ds[0] || null;
  }, [sessionsRaw]);

  const displaySessions = useMemo(() => {
    const rxFormation = /^\s*formation\s*$/i;
    return (sessionsRaw || []).filter(s => {
      if (earliestDayISO && s.dayISO === earliestDayISO) return false;
      if (rxFormation.test(s.track || '')) return false;
      return true;
    });
  }, [sessionsRaw, earliestDayISO]);

  // Track options & sections (B2B last)
  const uniqueTracks = useMemo(() => {
    const t = new Set();
    displaySessions.forEach(s => { if (s.track) t.add(s.track); });
    return Array.from(t);
  }, [displaySessions]);

  const trackSections = useMemo(() => {
    if (!Array.isArray(displaySessions) || !displaySessions.length) return [];
    const group = {};
    for (const s of displaySessions) {
      if (track && s.track !== track) continue;
      const key = (s.track || "Other").trim();
      if (!group[key]) group[key] = [];
      group[key].push(s);
    }
    for (const t of Object.keys(group)) {
      group[t].sort((a, b) => new Date(a.startISO) - new Date(b.startISO));
    }
    const ordered = orderTracksWithEarliestFirst(group);
    return ordered.map(({ track, items }) => ({ track, items }));
  }, [displaySessions, track]);

  useEffect(() => {
    setModalOpen(false);
    setModalSession(null);
    setSelectedBySlot({});
  }, [track]);

  // one per time slot per family
  const toggleSession = (s) => {
    const slotKey = `${s.startISO}|${conflictBucket(s.track)}`;
    setSelectedBySlot(prev => {
      const curr = prev[slotKey];
      if (curr && curr._id === s._id) {
        const copy = { ...prev };
        delete copy[slotKey];
        return copy;
      }
      return { ...prev, [slotKey]: s };
    });
  };

  const selectedSessionIds = useMemo(() => Object.values(selectedBySlot).map(s => s._id), [selectedBySlot]);

  /* Step: role → form */
  const goForm = () => {
    const e = {};
    if (!roleType) e.roleType = "Select your actor type";
    setErrs(e);
    if (Object.keys(e).length) return;
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* Form → sessions (logo + photo optional; no gender) */
  const submitForm = (e) => {
    e.preventDefault();
    const e2 = {};
    if (!required(form.exhibitorName)) e2.exhibitorName = "Required";
    if (!required(form.contactName)) e2.contactName = "Required";
    if (!required(form.email)) e2.email = "Required";
    if (!EMAIL_RX.test(form.email || "")) e2.email = "Invalid email";
    if (!required(form.country)) e2.country = "Required";
    if (!form.languages?.length) e2.languages = "Pick at least 1 language";
    if (!required(form.pwd)) e2.pwd = "Required";
    else if ((form.pwd || "").length < 8) e2.pwd = "Min 8 characters";
    if (form.pwd2 !== form.pwd) e2.pwd2 = "Passwords do not match";
    setErrs(e2);
    if (Object.keys(e2).length) return;

    setStep(3);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* Final submit */
  const finishAll = async () => {
    if (!selectedSessionIds.length) {
      alert("Please pick at least one session (one per time slot/family).");
      return;
    }
    const fd = new FormData();
    fd.append("eventId", eventId);
    fd.append("role", "exhibitor");
    fd.append("actorType", roleType);
    fd.append("pwd", form.pwd);

    // identity/contact
    fd.append("identity.exhibitorName", form.exhibitorName);
    fd.append("identity.contactName", form.contactName);
    fd.append("identity.email", form.email);
    fd.append("identity.phone", form.phone);
    fd.append("identity.country", (form.country || "").toUpperCase());
    fd.append("identity.city", form.city);
    fd.append("identity.orgName", form.orgName || "");

    // business/commercial
    fd.append("business.industry", form.industry || "");
    fd.append("commercial.availableMeetings", String(!!form.availableMeetings));

    // links & languages
    fd.append("links.website", form.website || "");
    fd.append("links.linkedin", form.linkedin || "");
    fd.append("identity.preferredLanguages", form.languages.join(",")); // limit enforced in BE

    // sub-roles
    if (roleType !== "BusinessOwner" && Array.isArray(form.subRoles)) {
      form.subRoles.forEach(v => fd.append("subRole[]", v));
    }

    // sessions
    selectedSessionIds.forEach(id => fd.append("sessionIds[]", id));

    // files (optional)
    if (logoFile)  fd.append("logo",  logoFile);
    if (photoFile) fd.append("photo", photoFile); // contact photo (optional)

    try {
      await exhibitorRegister(fd).unwrap();
      triggerPopup({
        title: "Registration complete",
        body: "Start your B2B journey",
        type: "success",
        link: { href: "/login", label: "Go to login" }
      });
      setStep(4);
      setTimeout(() => navigate("/"), 1400);
    } catch (err) {
      console.error(err);
      triggerPopup({
        title: "Registration failed",
        body: err?.data?.message || "Something went wrong. Please try again.",
        type: "error"
      });
      alert(err?.data?.message || "Registration failed");
    }
  };

  /* ============================== UI ============================== */
  return (
    <>
      <HeaderShell top={topbar} nav={nav} cta={cta} />
      <div className="reg-wrap">
        {/* Event header (same layout as attendee) */}
        <header className="anim-in" style={{ display:"grid", gridTemplateColumns:"140px 1fr", gap:12, alignItems:"center" }}>
          {evLoading ? (
            <div className="reg-skel" />
          ) : evErr || !event ? (
            <div className="reg-empty">Event not found</div>
          ) : (
            <>
              <img
                src={imageLink(event.cover) || imageLink("/default/cover.png")}
                alt={event.title}
                style={{ width:140, height:90, objectFit:"cover", borderRadius:12, border:"1px solid #e5e7eb" }}
              />
              <div>
                <div style={{ fontWeight:900, fontSize:18 }}>{event.title}</div>
                <div style={{ color:"#475569", fontWeight:800, display:"flex", gap:8, alignItems:"center" }}>
                  {toISODate(event.startDate)} → {toISODate(event.endDate)} • {event.city || ""}
                  {event.country ? (
                    <>
                      <ReactCountryFlag svg countryCode={(event.country || "").toUpperCase()} style={{ fontSize:"1.1em" }} />
                      <span style={{ color:"#64748b", fontWeight:700 }}>{(event.country || "").toUpperCase()}</span>
                    </>
                  ) : null}
                </div>
                {event.registrationDeadline && (
                  <div style={{ color:"#64748b", fontWeight:700, marginTop:4 }}>
                    Registration closes {toISODate(event.registrationDeadline)}
                  </div>
                )}
              </div>
            </>
          )}
        </header>

        {/* ===== STEP 1: Role catalog (cards like attendee) ===== */}
        {step === 1 && (
          <section className="anim-in">
            <div className="att-section-head">
              <div className="t">Choose your actor type</div>
              <div className="h">This only adds two lightweight fields now. You can build a full Business Profile later.</div>
            </div>

            <div className="role-grid">
              {ROLE_TYPES.map(r => {
                const active = roleType === r.key;
                return (
                  <article
                    key={r.key}
                    onClick={() => setRoleType(r.key)}
                    className={`role-card ${active ? "active" : ""}`}
                    title={r.title}
                  >
                    <div className="role-title">{r.title}</div>
                    <div className="role-desc">{r.desc}</div>
                  </article>
                );
              })}
            </div>

            {errs.roleType && <div className="reg-empty" style={{ borderStyle:"dashed", marginTop:12 }}>{errs.roleType}</div>}

            <div className="att-actions">
              <button className="btn btn-line" onClick={() => navigate("/register")}>Back</button>
              <button className="btn" onClick={goForm}>Continue</button>
            </div>
          </section>
        )}

        {/* ===== STEP 2: Exhibitor form (logo + contact photo both optional) ===== */}
        {step === 2 && (
          <form className="anim-in reg-card" onSubmit={submitForm} style={{ marginTop: 14 }}>
            <div className="att-section-head">
              <div className="t">Exhibitor details</div>
              <div className="h">All fields marked <span className="req">*</span> are required</div>
            </div>

            <div className="att-form-grid">
              {/* Logo (OPTIONAL) */}
              <div className="att-field full">
                <label>Company logo <span style={{ color:"#64748b", fontWeight:700 }}>(optional)</span></label>
                <div
                  className="att-photo-drop"
                  onClick={() => logoRef.current?.click()}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => { e.preventDefault(); if (e.dataTransfer.files?.[0]) setLogoFile(e.dataTransfer.files[0]); }}
                >
                  {!logoUrl ? (
                    <div className="att-photo-empty">
                      <div className="ico">🖼️</div>
                      <div className="t">Drop an image here, or click to choose</div>
                      <div className="h">PNG/JPG, under 5MB</div>
                    </div>
                  ) : (
                    <div className="att-photo-prev">
                      <img src={logoUrl} alt="logo-preview" />
                      <div className="att-photo-actions">
                        <button type="button" className="btn-line" onClick={() => logoRef.current?.click()}>Change</button>
                        <button type="button" className="btn-line" onClick={() => setLogoFile(null)}>Remove</button>
                      </div>
                    </div>
                  )}
                  <input ref={logoRef} type="file" accept="image/*" hidden onChange={e => setLogoFile(e.target.files?.[0] || null)} />
                </div>
              </div>

              {/* Contact photo (OPTIONAL) — new */}
              <div className="att-field full">
                <label>Contact photo <span style={{ color:"#64748b", fontWeight:700 }}>(optional)</span></label>
                <div
                  className="att-photo-drop"
                  onClick={() => photoRef.current?.click()}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => { e.preventDefault(); if (e.dataTransfer.files?.[0]) setPhotoFile(e.dataTransfer.files[0]); }}
                >
                  {!photoUrl ? (
                    <div className="att-photo-empty">
                      <div className="ico">📷</div>
                      <div className="t">Drop an image here, or click to choose</div>
                      <div className="h">PNG/JPG, under 5MB</div>
                    </div>
                  ) : (
                    <div className="att-photo-prev">
                      <img src={photoUrl} alt="contact-preview" />
                      <div className="att-photo-actions">
                        <button type="button" className="btn-line" onClick={() => photoRef.current?.click()}>Change</button>
                        <button type="button" className="btn-line" onClick={() => setPhotoFile(null)}>Remove</button>
                      </div>
                    </div>
                  )}
                  <input ref={photoRef} type="file" accept="image/*" hidden onChange={e => setPhotoFile(e.target.files?.[0] || null)} />
                </div>
              </div>

              {/* Identity fields */}
              <div className="att-field">
                <label>Exhibitor / Brand name <span className="req">*</span></label>
                <input value={form.exhibitorName} onChange={e => setField("exhibitorName", e.target.value)} />
                {errs.exhibitorName && <div style={{ color:"#ef4444", fontWeight:800 }}>{errs.exhibitorName}</div>}
              </div>

              <div className="att-field">
                <label>Contact person <span className="req">*</span></label>
                <input value={form.contactName} onChange={e => setField("contactName", e.target.value)} />
                {errs.contactName && <div style={{ color:"#ef4444", fontWeight:800 }}>{errs.contactName}</div>}
              </div>

              <div className="att-field">
                <label>Email <span className="req">*</span></label>
                <input type="email" value={form.email} onChange={e => setField("email", e.target.value)} />
                {errs.email && <div style={{ color:"#ef4444", fontWeight:800 }}>{errs.email}</div>}
              </div>

              <div className="att-field">
                <label>Phone</label>
                <input value={form.phone} onChange={e => setField("phone", e.target.value)} />
              </div>

              {/* Country / city */}
              <div className="att-field">
                <label>Country <span className="req">*</span></label>
                <CountrySelect value={form.country} onChange={code => setField("country", (code || "").toUpperCase())} />
                {errs.country && <div style={{ color:"#ef4444", fontWeight:800 }}>{errs.country}</div>}
              </div>

              <div className="att-field">
                <label>City</label>
                <input value={form.city} onChange={e => setField("city", e.target.value)} />
              </div>

              <div className="att-field">
                <label>Organization (legal name)</label>
                <input value={form.orgName} onChange={e => setField("orgName", e.target.value)} />
              </div>

              <div className="att-field">
                <label>Industry</label>
                <select value={form.industry} onChange={e => setField("industry", e.target.value)}>
                  <option value="">Select…</option>
                  {INDUSTRIES.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>

              {/* Passwords (same show/hide button pattern) */}
              <div className="att-field">
                <label>Password <span className="req">*</span></label>
                <div style={{ display:"grid", gridTemplateColumns:"1fr auto", gap:8 }}>
                  <input
                    type={showPwd ? "text" : "password"}
                    value={form.pwd}
                    onChange={e => setField("pwd", e.target.value)}
                    placeholder="At least 8 characters"
                  />
                  <button
                    type="button"
                    className="btn-line"
                    onClick={() => setShowPwd(v => !v)}
                    aria-label={showPwd ? "Hide password" : "Show password"}
                  >
                    {showPwd ? "Hide" : "Show"}
                  </button>
                </div>
                {errs.pwd && <div style={{ color:"#ef4444", fontWeight:800 }}>{errs.pwd}</div>}
              </div>

              <div className="att-field">
                <label>Confirm password <span className="req">*</span></label>
                <input
                  type={showPwd ? "text" : "password"}
                  value={form.pwd2}
                  onChange={e => setField("pwd2", e.target.value)}
                  placeholder="Repeat your password"
                />
                {errs.pwd2 && <div style={{ color:"#ef4444", fontWeight:800 }}>{errs.pwd2}</div>}
              </div>

              <div className="att-field">
                <label>Website</label>
                <input placeholder="https://…" value={form.website} onChange={e => setField("website", e.target.value)} />
              </div>

              <div className="att-field">
                <label>LinkedIn</label>
                <input placeholder="https://linkedin.com/company/…" value={form.linkedin} onChange={e => setField("linkedin", e.target.value)} />
              </div>

              {/* Languages */}
              <div className="att-field full">
                <label>Preferred languages <span className="req">*</span></label>
                <LanguageSelect value={form.languages} onChange={v => setField("languages", v)} max={3} />
                {errs.languages && <div style={{ color:"#ef4444", fontWeight:800 }}>{errs.languages}</div>}
              </div>

              {/* Sub-roles */}
              {showSubRoles && (
                <div className="att-field full">
                  <label>Sub-roles (multi-select)</label>
                  <div className="subrole-grid">
                    {SUBROLE_OPTIONS.map(opt => {
                      const active = form.subRoles.includes(opt);
                      return (
                        <label key={opt} className={`subrole-item ${active ? "active" : ""}`}>
                          <input
                            type="checkbox"
                            checked={active}
                            onChange={() => {
                              const has = form.subRoles.includes(opt);
                              setField("subRoles", has ? form.subRoles.filter(v => v !== opt) : [...form.subRoles, opt]);
                            }}
                          />
                          <span>{opt}</span>
                        </label>
                      );
                    })}
                  </div>
                  <div className="hint">Choose any that apply. This is simple metadata saved on your actor profile.</div>
                </div>
              )}

              <div className="att-field full" style={{ alignItems:"flex-start" }}>
                <label>Open to meetings?</label>
                <label className="chk-inline as-switch">
                  <input
                    type="checkbox"
                    checked={!!form.availableMeetings}
                    onChange={e => setField("availableMeetings", e.target.checked)}
                  />
                  <span className="sw" aria-hidden="true"><span className="knob" /></span>
                  <span className="txt">Yes, allow B2B requests</span>
                </label>
              </div>
            </div>

            <div className="att-actions" style={{ justifyContent:"flex-end" }}>
              <button type="button" className="btn btn-line" onClick={() => setStep(1)}>Back</button>
              <button type="submit" className="btn">Continue</button>
            </div>
          </form>
        )}

        {/* ===== STEP 3: Sessions (same compact design as attendee) ===== */}
        {step === 3 && (
          <section className="anim-in" style={{ marginTop: 16 }}>
            <div className="att-section-head">
              <div className="t">Choose your sessions</div>
              <div className="h">Pick one session per time slot. <b>Masterclass</b> and <b>Atelier</b> are separate families — you can select one in each at the same time.</div>
            </div>

            {/* Compact filter bar */}
            <div className="filter-bar">
              <TrackSelect options={uniqueTracks} value={track} onChange={setTrack} placeholder="All tracks" />
            </div>

            {schedFetching ? (
              <div className="reg-skel" style={{ height: 160 }} />
            ) : !trackSections.length ? (
              <div className="reg-empty">No sessions available yet.</div>
            ) : (
              <div className="att-session-list-v2">
                {trackSections.map(({ track: tname, items }) => (
                  <div key={tname || 'Other'} className="att-track-section-v2">
                    <div className="att-track-sep-v2">{tname || 'Other'}</div>

                    {items.map(s => {
                      const slotKey = `${s.startISO}|${conflictBucket(s.track)}`;
                      const isSelected = selectedBySlot[slotKey]?._id === s._id;
                      const c   = counts?.[s._id] || {};
                      const regFromS = typeof s.seatsTaken === 'number' ? s.seatsTaken : NaN;
                      const reg = Number.isFinite(regFromS) ? regFromS : Number(c.registered || 0);
                      const cap = s.roomCapacity || 0;
                      const pct = cap ? Math.min(100, Math.round((reg / cap) * 100)) : 0;
                      const title = s.title || s.sessionTitle || 'Session';
                      const when  = new Date(s.startISO);

                      return (
                        <article
                          key={s._id}
                          className={`att-session-card-v2 ${isSelected ? 'is-selected' : ''} ${isB2B(tname) ? 'bg-new' : ''}`}
                          onClick={() => toggleSession(s)}
                          title={title}
                        >
                          {s.cover ? (
                            <img src={s.cover} alt={title} className="session-cover-v2" />
                          ) : null}

                          <div className="session-head-v2">
                            <div className="session-chipline-v2">
                              {s.track ? <span className="badge">{s.track}</span> : <span className="badge">Session</span>}
                              {s.roomName && <span className="chip">Room: {s.roomName}</span>}
                              {s.roomLocation && <span className="chip">Loc: {s.roomLocation}</span>}
                              <span className="chip">
                                {when.toLocaleDateString(undefined, { weekday:'short', month:'short', day:'numeric' })} • {when.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}
                              </span>
                            </div>

                            <div className="att-session-title-v2">{title}</div>

                            {!!s.speakers?.length && (
                              <div className="att-session-meta-v2">
                                {s.speakers.map(x => (x && (x.name || x.fullName)) || x).join(', ')}
                              </div>
                            )}
                          </div>

                          {s.summary ? (
                            <div className="session-summary-v2">
                              {s.summary.length > 220 ? `${s.summary.slice(0, 220)}…` : s.summary}
                            </div>
                          ) : null}

                          {(cap || reg) ? (
                            <div className="cap-mini-v2">
                              <div className="cap-mini-line"><div className="cap-mini-bar" style={{ width: `${pct}%` }} /></div>
                              <div className="cap-mini-meta">
                                <span><b>{reg}</b> registered</span>
                                {cap ? <span>• <b>{cap}</b> capacity</span> : null}
                                {c.waitlisted ? <span>• <b>{c.waitlisted}</b> waitlisted</span> : null}
                              </div>
                            </div>
                          ) : null}

                          {!!s.tags?.length && (
                            <div className="tag-row">
                              {s.tags.slice(0,8).map(t => <span key={t} className="tag">{t}</span>)}
                            </div>
                          )}

                          <div className="session-actions-v2">
                            <button
                              type="button"
                              className="btn-line sm"
                              onClick={(e) => { e.stopPropagation(); setModalSession(s); setModalOpen(true); }}
                            >
                              Info
                            </button>
                            <button
                              type="button"
                              className={`btn sm`}
                              onClick={(e) => { e.stopPropagation(); toggleSession(s); }}
                            >
                              {isSelected ? 'Selected' : 'Select'}
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}

            <div className="att-actions" style={{ marginTop:16 }}>
              <button className="btn btn-line" onClick={() => setStep(2)}>Back</button>
              <button className="btn" disabled={regLoading} onClick={finishAll}>
                {regLoading ? "Submitting…" : "Finish registration"}
              </button>
            </div>

            <SessionModal open={modalOpen} onClose={() => setModalOpen(false)} session={modalSession} counts={counts} />
          </section>
        )}

        {/* ===== STEP 4: Done ===== */}
        {step === 4 && (
          <div className="anim-in">
            <div className="reg-empty" style={{ borderStyle:"solid", color:"#111827" }}>
              ✅ Registration received. We’ve also shown a popup with a quick link.
              <div style={{ marginTop: 8 }}>
                <a className="btn" href="/login">Go to login</a>
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
    </>
  );
}