// src/pages/register/AttendeeRegisterPage.jsx
import React, { useMemo, useRef, useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useSearchParams, useNavigate } from 'react-router-dom';
import ReactCountryFlag from 'react-country-flag';
import "./attendee-register.css";

/** RTK hooks */
import { useGetEventQuery } from "../../features/events/eventsApiSlice";
import { useAttendeeRegisterMutation } from "../../features/auth/authApiSlice";
import { useGetEventSessionsQuery } from "../../features/events/scheduleApiSlice";
import imageLink from '../../utils/imageLink';
import HeaderShell from '../../components/layout/HeaderShell';
import { cta, footerData, nav, topbar } from '../main.mock';
import Footer from '../../components/footer/Footer';

/* === Helpers === */
const toISODate = v => (v ? new Date(v).toLocaleDateString() : '');
const required = v => (typeof v === 'string' ? v.trim() : v) ? true : false;

/* Catalog of “actor types” */
const ROLE_TYPES = [
  { key: 'BusinessOwner', title: 'Business Owner', desc: 'Owns or co-owns a company. Can later create a full business profile, sectors, products & services.' },
  { key: 'Consultant',    title: 'Consultant',    desc: 'Advises businesses. Perfect if you sell expertise and want to list services later.' },
  { key: 'Employee',      title: 'Employee',      desc: 'Represents an organization without owning it. Can network and book meetings.' },
  { key: 'Expert',        title: 'Expert',        desc: 'Subject-matter specialist. Good for workshops, mentoring, and B2B leads.' },
  { key: 'Investor',      title: 'Investor',      desc: 'Angel, VC or corporate. Signal interests and match with startups/exhibitors.' },
  { key: 'Student',       title: 'Student',       desc: 'Early-career attendee. Learn, network, and explore opportunities.' },
];

/* Track constants */
const TRACK_B2B_NAME = "B2B";
const MASTERCLASS = "masterclass";
const ATELIER = "atelier";

/* Determine a normalized "family" for conflict logic */
function familyOfTrack(track) {
  const t = String(track || '').toLowerCase();
  if (t.includes('masterclass')) return MASTERCLASS;
  if (t.includes('atelier')) return ATELIER;
  return 'other';
}

function compareTracks(a, b) {
  const A = (a || "").trim();
  const B = (b || "").trim();
  const aIsB2B = A.toLowerCase() === TRACK_B2B_NAME.toLowerCase();
  const bIsB2B = B.toLowerCase() === TRACK_B2B_NAME.toLowerCase();
  if (aIsB2B && !bIsB2B) return 1;
  if (!aIsB2B && bIsB2B) return -1;
  return A?.localeCompare(B, undefined, { sensitivity: "base" });
}

/* SubRole options */
const SUBROLE_OPTIONS = [
  'Researchers','Students','Coaches & Trainers','Experts & Consultants','Employees & Professionals','Entrepreneurs & Startups','Developers & Engineers',
  'Marketing & Communication','Audit, Accounting & Finance','Investment & Banking','Insurance & Microfinance','Legal & Lawyers','AI, IoT & Emerging Tech',
  'Audiovisual & Creative Industries','Media & Journalists','Universities & Academies','NGOs & Civil Society','Public Sector & Government'
];

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

/* Order tracks by earliest time; keep B2B last */
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
    return String(a.track || "").localeCompare(String(b.track || ""), undefined, { sensitivity: "base" });
  });

  return entries;
}

/* Country list (trimmed) */
const COUNTRIES = [
  { code: 'TN', name: 'Tunisia' }, { code: 'FR', name: 'France' }, { code: 'US', name: 'United States' },
  { code: 'DE', name: 'Germany' }, { code: 'IT', name: 'Italy' },  { code: 'ES', name: 'Spain' },
  { code: 'MA', name: 'Morocco' }, { code: 'DZ', name: 'Algeria' },{ code: 'EG', name: 'Egypt' },
  { code: 'SA', name: 'Saudi Arabia' }, { code: 'AE', name: 'United Arab Emirates' },
  { code: 'GB', name: 'United Kingdom' }, { code: 'CA', name: 'Canada' },
];

/* Language list (max 3) */
const LANGS = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'French'  },
  { code: 'ar', label: 'Arabic'  },
];

/* ===== Small controls reused ===== */
function CountrySelect({ value, onChange, placeholder='Select country' }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const list = useMemo(() => {
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    return COUNTRIES.filter(c => rx.test(c.name) || rx.test(c.code));
  }, [q]);

  const selected = COUNTRIES.find(c => c.code === (value || '').toUpperCase()) || null;

  return (
    <div className="sel-wrap">
      <div className="sel-head" onClick={() => setOpen(v => !v)}>
        {!selected ? (
          <span className="ph">{placeholder}</span>
        ) : (
          <span className="sel-flag">
            <ReactCountryFlag svg countryCode={selected.code} style={{ fontSize: '1.2em' }} />
            {selected.name} <span style={{ color:'#64748b', fontWeight:800 }}>({selected.code})</span>
          </span>
        )}
        <span style={{ fontWeight:900, color:'#64748b' }}>{open ? '▲' : '▼'}</span>
      </div>
      {open && (
        <div className="sel-pop">
          <div className="sel-search">
            <input
              placeholder="Search country…"
              value={q}
              onChange={e => setQ(e.target.value)}
            />
          </div>
          {list.map(c => (
            <div
              key={c.code}
              className="sel-item"
              onClick={() => { onChange(c.code); setOpen(false); setQ(''); }}
            >
              <ReactCountryFlag svg countryCode={c.code} style={{ fontSize:'1.1em' }} />
              <span className="name">{c.name}</span>
              <span className="code">{c.code}</span>
            </div>
          ))}
          {!list.length && <div className="sel-item" style={{ color:'#64748b' }}>No results</div>}
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
      </div>
      <div className="lang-grid">
        {LANGS.map(l => {
          const active = value.includes(l.code);
          const disabled = !active && value.length >= max;
          return (
            <div
              key={l.code}
              className={`lang-item ${active ? 'active':''} ${disabled ? 'disabled':''}`}
              onClick={() => { if (!disabled || active) toggle(l.code); }}
              title={disabled ? 'You can only select up to 3 languages' : ''}
            >
              {l.label}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* SubRole checkbox grid */
function SubRoleSelect({ values = [], onChange, options = [] }) {
  const toggle = (val) => {
    const has = values.includes(val);
    if (has) onChange(values.filter(v => v !== val));
    else onChange([...values, val]);
  };
  return (
    <div className="subrole-grid">
      {options.map(opt => {
        const active = values.includes(opt);
        return (
          <label key={opt} className={`subrole-item ${active ? 'active' : ''}`}>
            <input
              type="checkbox"
              checked={active}
              onChange={() => toggle(opt)}
            />
            <span>{opt}</span>
          </label>
        );
      })}
    </div>
  );
}

/* ===== Session helpers (normalize & group) ===== */
const normSession = (s) => {
  const start = s.startAt || s.startTime || s.start || s.timeStart || s.startsAt;
  const end   = s.endAt   || s.endTime   || s.end   || s.timeEnd   || s.endsAt;
  const startISO = start ? new Date(start).toISOString() : '';
  const dayISO = start ? startISO.slice(0,10) : 'unknown';
  return {
    _id: s._id,
    title: s.title || s.sessionTitle || 'Session',
    summary: s.description || s.summary || '',
    track: s.track || '',
    tags: Array.isArray(s.tags) ? s.tags : [],
    speakers: Array.isArray(s.speakers) ? s.speakers : [],
    cover: s.cover || s.coverImage || s.photo || s.image || '',
    roomName: s.room?.name || s.roomName || '',
    roomLocation: s.room?.location || '',
    roomCapacity: s.room?.capacity || 0,
    startISO,
    endISO: end ? new Date(end).toISOString() : '',
    dayISO,
  };
};

const groupByDayAndSlot = (raw) => {
  const sessions = raw.map(normSession).filter(x => x.startISO);
  const dayMap = new Map();
  for (const s of sessions) {
    if (!dayMap.has(s.dayISO)) dayMap.set(s.dayISO, new Map());
    const slotKey = s.startISO; // column per timeslot
    const slot = dayMap.get(s.dayISO);
    if (!slot.has(slotKey)) slot.set(slotKey, []);
    slot.get(slotKey).push(s);
  }

  const days = Array.from(dayMap.entries())
    .sort((a,b) => new Date(a[0]) - new Date(b[0]))
    .map(([dayISO, slotMap]) => ({
      dayISO,
      label: new Date(dayISO).toLocaleDateString(),
      slots: Array.from(slotMap.entries())
        .sort((a,b) => new Date(a[0]) - new Date(b[0]))
        .map(([startISO, items]) => ({ startISO, items })),
    }));

  return { sessions, days };
};

/* ===== Modal (portal) ===== */
function SessionModal({ open, onClose, session, counts }) {
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [open]);

  if (!open || !session) return null;

  const reg = counts?.[session._id]?.registered || 0;
  const wait = counts?.[session._id]?.waitlisted || 0;
  const cap  = session.roomCapacity || 0;
  const pct  = cap ? Math.min(100, Math.round((reg / cap) * 100)) : 0;
  const title = session.title || session.sessionTitle || 'Session';

  const node = (
    <div className="reg-modal-backdrop" onClick={onClose}>
      <div
        className="reg-modal reg-modal-lg"
        role="dialog"
        aria-modal="true"
        onClick={e => e.stopPropagation()}
      >
        <div className="reg-modal-head">
          <div className="t">{title}</div>
          <button className="btn-line sm" onClick={onClose}>Close</button>
        </div>

        {session.cover ? (
          <img
            src={session.cover}
            alt={title}
            style={{ width:'100%', height:220, objectFit:'cover', borderRadius:12, border:'1px solid #e5e7eb' }}
          />
        ) : null}

        <div className="reg-modal-body">
          <div className="meta-row">
            <span className="badge">{session.track || 'Session'}</span>
            {session.roomName && <span className="chip">Room: {session.roomName}</span>}
            {session.roomLocation && <span className="chip">Location: {session.roomLocation}</span>}
            <span className="chip">
              {new Date(session.startISO).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })} – {session.endISO ? new Date(session.endISO).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }) : '—'}
            </span>
          </div>

          {!!session.speakers?.length && (
            <div className="speakers-row">
              <div className="subt">Speakers</div>
              <div className="speakers-list">
                {session.speakers.map((sp, i) => (
                  <span key={i} className="chip">{sp.name || sp}</span>
                ))}
              </div>
            </div>
          )}

          {!!session.tags?.length && (
            <div className="tag-row">
              {session.tags.map((t, i) => <span key={i} className="tag">{t}</span>)}
            </div>
          )}

          {session.summary && (
            <p className="descr">{session.summary}</p>
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

const isB2B = (name) => String(name || '').trim().toLowerCase() === 'b2b';

/* ===== Main component ===== */
export default function AttendeeRegisterPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  /* Steps: 1 = pick role, 2 = form, 3 = sessions, 4 = done */
  const [step, setStep] = useState(1);

  const eventId = params.get('eventId') || '68e6764bb4f9b08db3ccec04';
  const { data: event, isLoading: evLoading, isError: evErr } = useGetEventQuery(eventId, { skip: !eventId });

  /* ---- Session filters (NO ROOM) ---- */
  const [track, setTrack] = useState('');

  const { data: schedulePack, isFetching: schedFetching } = useGetEventSessionsQuery(
    { eventId, track, includeCounts: 1 },
    { skip: !eventId || step !== 3 },
  );

  const [attendeeRegister, { isLoading: regLoading }] = useAttendeeRegisterMutation();

  /* Photo */
  const fileRef = useRef(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoUrl, setPhotoUrl] = useState('');
  useEffect(() => {
    if (photoFile) {
      const u = URL.createObjectURL(photoFile);
      setPhotoUrl(u);
      return () => URL.revokeObjectURL(u);
    }
    setPhotoUrl('');
  }, [photoFile]);

  /* Role extras */
  const [roleType, setRoleType] = useState('');

  /* Form state */
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    country: '',
    city: '',
    orgName: '',
    jobTitle: '',
    businessRole: '',
    website: '',
    linkedin: '',
    languages: [],
    objective: '',
    pwd: '',
    pwd2: '',
    openToMeetings: true,
    subRoles: [],
  });
  const setField = (k, v) => setForm(prev => ({ ...prev, [k]: v }));
  const [errs, setErrs] = useState({});

  const isStudent = roleType === 'Student';
  const showSubRoles = roleType && roleType !== 'BusinessOwner';
  const shouldShowOrgFields = !isStudent;

  /* ========= KEY CHANGE: track-aware selection ========= */
  // We now key selections by a composite key:
  //  - "masterclass|<startISO>" for Masterclass
  //  - "atelier|<startISO>" for Atelier
  //  - "*|<startISO>" for all other tracks (conflict across others as before)
  const [selectedBySlot, setSelectedBySlot] = useState({}); // { compositeKey: session }
  const compositeKeyFor = (session) => {
    const fam = familyOfTrack(session.track);
    const base = session.startISO;
    if (fam === MASTERCLASS || fam === ATELIER) return `${fam}|${base}`;
    return `*|${base}`;
  };

  const [activeDay, setActiveDay] = useState(null);
  const [modalSession, setModalSession] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const counts = schedulePack?.counts || {};

  /* Build days/slotted view from API data */
  const { sessions, days } = useMemo(() => {
    const raw = (schedulePack?.data || schedulePack?.sessions || schedulePack || []);
    return groupByDayAndSlot(Array.isArray(raw) ? raw : []);
  }, [schedulePack]);

  /* Track/day options */
  const allSessions = sessions;
  const uniqueTracks = useMemo(() => {
    const t = new Set();
    allSessions.forEach(s => { if (s.track) t.add(s.track); });
    return Array.from(t);
  }, [allSessions]);

  useEffect(() => {
    setModalOpen(false);
    setModalSession(null);
    setSelectedBySlot({});
  }, [track]);

  const toggleSession = (session) => {
    const key = compositeKeyFor(session);
    setSelectedBySlot(prev => {
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
    () => Object.values(selectedBySlot).map(s => s._id),
    [selectedBySlot]
  );

  /* Step 1 → 2 */
  const goForm = () => {
    const e = {};
    if (!roleType) e.roleType = 'Select your actor type';
    setErrs(e);
    if (Object.keys(e).length) return;
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /* Step 2 → 3 */
  const submitForm = (e) => {
    e.preventDefault();
    const e2 = {};
    if (!required(form.pwd)) e2.pwd = 'Required';
    else if ((form.pwd || '').length < 8) e2.pwd = 'Min 8 characters';
    if (form.pwd2 !== form.pwd) e2.pwd2 = 'Passwords do not match';

    if (!required(form.fullName)) e2.fullName = 'Required';
    if (!required(form.email)) e2.email = 'Required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email || '')) e2.email = 'Invalid email';
    if (!required(form.country)) e2.country = 'Required';
    if (!photoFile) e2.photo = 'Photo is required';
    if (!form.languages?.length) e2.languages = 'Pick at least 1 language';
    if (shouldShowOrgFields) {
      if (!required(form.orgName)) e2.orgName = 'Required';
      if (!required(form.jobTitle)) e2.jobTitle = 'Required';
      if (!required(form.businessRole)) e2.businessRole = 'Required';
    }
    setErrs(e2);
    if (Object.keys(e2).length) return;

    setStep(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /* Filtered/ordered sessions and sections (unchanged) */
  const filteredSortedSessions = useMemo(() => {
    if (!Array.isArray(sessions) || !sessions.length) return [];

    const daySet = new Set(sessions.map(s => s.dayISO).filter(Boolean));
    const dayList = Array.from(daySet).sort((a, b) => new Date(a) - new Date(b));
    const firstDay = dayList[0] || null;

    const filtered = sessions.filter(s => {
      if (firstDay && s.dayISO === firstDay) return false;
      if (track && s.track !== track) return false;
      return true;
    });

    filtered.sort((a, b) => {
      const t = compareTracks(a.track, b.track);
      if (t !== 0) return t;
      return new Date(a.startISO) - new Date(b.startISO);
    });

    return filtered;
  }, [sessions, track]);

  const trackSections = useMemo(() => {
    if (!Array.isArray(sessions) || !sessions.length) return [];

    const daySet = new Set(sessions.map(s => s.dayISO).filter(Boolean));
    const dayList = Array.from(daySet).sort((a, b) => new Date(a) - new Date(b));
    const firstDay = dayList[0] || null;

    const filtered = sessions.filter(s => {
      if (firstDay && s.dayISO === firstDay) return false;
      if (track && s.track !== track) return false;
      return true;
    });

    if (!filtered.length) return [];

    const group = {};
    for (const s of filtered) {
      const key = (s.track || "Other").trim();
      if (!group[key]) group[key] = [];
      group[key].push(s);
    }
    for (const t of Object.keys(group)) {
      group[t].sort((a, b) => new Date(a.startISO) - new Date(b.startISO));
    }

    const ordered = orderTracksWithEarliestFirst(group);
    return ordered.map(({ track, items }) => ({ track, items }));
  }, [sessions, track]);

  /* Final submit */
  const finishAll = async () => {
    if (!selectedSessionIds.length) {
      alert('Please pick at least one session (one per time slot & per track family).');
      return;
    }
    const fd = new FormData();
    fd.append('eventId', eventId);
    fd.append('role', 'attendee');

    fd.append('actorType', roleType);
    fd.append('pwd', form.pwd);

    fd.append('personal.fullName', form.fullName);
    fd.append('personal.email', form.email);
    fd.append('personal.phone', form.phone);
    fd.append('personal.country', (form.country || '').toUpperCase());
    fd.append('personal.city', form.city);
    fd.append('personal.profilePic', '');

    if (shouldShowOrgFields) {
      fd.append('organization.orgName', form.orgName);
      fd.append('organization.jobTitle', form.jobTitle);
      fd.append('organization.businessRole', form.businessRole);
    }

    fd.append('businessProfile.preferredLanguages', form.languages.join(','));
    fd.append('matchingIntent.objective', form.objective);
    fd.append('matchingIntent.openToMeetings', String(!!form.openToMeetings));
    fd.append('links.website', form.website);
    fd.append('links.linkedin', form.linkedin);

    if (showSubRoles && Array.isArray(form.subRoles)) {
      form.subRoles.forEach(v => fd.append('subRole[]', v));
    }

    selectedSessionIds.forEach(id => fd.append('sessionIds[]', id));
    if (photoFile) fd.append('photo', photoFile);

    try {
      await attendeeRegister(fd).unwrap();
      triggerPopup({
        title: "Registration complete",
        body: "Start your B2B journey",
        type: "success",
        link: { href: "/login", label: "Go to login" }
      });
      setStep(4);
      setTimeout(() => navigate('/'), 1400);
    } catch (e) {
      triggerPopup({
        title: "Registration failed",
        body: e?.data?.message || "Something went wrong. Please try again.",
        type: "error"
      });
      alert(e?.data?.message || 'Registration failed');
    }
  };

  /* ===== UI ===== */
  return (
    <>
      <HeaderShell top={topbar} nav={nav} cta={cta} />
      <div className="reg-wrap">
        {/* Header */}
        <header className="anim-in" style={{ display:'grid', gridTemplateColumns:'140px 1fr', gap:12, alignItems:'center' }}>
          {evLoading ? (
            <div className="reg-skel" />
          ) : evErr || !event ? (
            <div className="reg-empty">Event not found</div>
          ) : (
            <>
              <img
                src={imageLink(event.cover) || imageLink('/default/cover.png')}
                alt={event.title}
                style={{ width:140, height:90, objectFit:'cover', borderRadius:12, border:'1px solid #e5e7eb' }}
              />
              <div>
                <div style={{ fontWeight:900, fontSize:18 }}>{event.title}</div>
                <div style={{ color:'#475569', fontWeight:800, display:'flex', gap:8, alignItems:'center' }}>
                  {toISODate(event.startDate)} → {toISODate(event.endDate)} • {event.city || ''}
                  {event.country ? (
                    <>
                      <ReactCountryFlag svg countryCode={(event.country || '').toUpperCase()} style={{ fontSize:'1.1em' }} />
                      <span style={{ color:'#64748b', fontWeight:700 }}>{(event.country || '').toUpperCase()}</span>
                    </>
                  ) : null}
                </div>
                <div style={{ color:'#64748b', fontWeight:700, marginTop:4 }}>
                  Registration closes {toISODate(event.registrationDeadline)}
                </div>
              </div>
            </>
          )}
        </header>

        {/* Step dots */}
        <div className="reg-steps">
          <span className={`reg-step-dot ${step === 4 ? 'active':''}`} />
          <span className={`reg-step-dot ${step === 1 ? 'active':''}`} />
          <span className={`reg-step-dot ${step === 2 ? 'active':''}`} />
          <span className={`reg-step-dot ${step === 3 ? 'active':''}`} />
        </div>

        {/* STEP 1 */}
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
                    className={`role-card ${active ? 'active' : ''}`}
                  >
                    <div className="role-title">{r.title}</div>
                    <div className="role-desc">{r.desc}</div>
                  </article>
                );
              })}
            </div>

            <div className="att-form-grid" style={{ marginTop:14 }}>
              <div className="att-field full d-none">
                <label>Selected actor type <span className="req">*</span></label>
                <input value={roleType || ''} readOnly />
                {errs.roleType && <div style={{ color:'#ef4444', fontWeight:800 }}>{errs.roleType}</div>}
              </div>
            </div>

            <div className="att-actions">
              <button className="btn btn-line" onClick={() => navigate('/register')}>Back</button>
              <button className="btn" onClick={goForm}>Continue</button>
            </div>
          </section>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <form className="anim-in" onSubmit={submitForm}>
            <div className="att-section-head">
              <div className="t">Attendee details</div>
              <div className="h">All fields marked <span className="req">*</span> are required</div>
            </div>

            <div className="att-form-grid">
              {/* Photo */}
              <div className="att-field full">
                <label>Profile photo</label>
                <div
                  className="att-photo-drop"
                  onClick={() => fileRef.current?.click()}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => {
                    e.preventDefault();
                    if (e.dataTransfer.files?.[0]) setPhotoFile(e.dataTransfer.files[0]);
                  }}
                >
                  {!photoUrl ? (
                    <div className="att-photo-empty">
                      <div className="ico">📷</div>
                      <div className="t">Drop an image here, or click to choose</div>
                      <div className="h">PNG/JPG, under 5MB (optional)</div>
                    </div>
                  ) : (
                    <div className="att-photo-prev">
                      <img src={photoUrl} alt="preview" />
                      <div className="att-photo-actions">
                        <button type="button" className="btn-line" onClick={() => fileRef.current?.click()}>Change</button>
                        <button type="button" className="btn-line" onClick={() => setPhotoFile(null)}>Remove</button>
                      </div>
                    </div>
                  )}
                  <input ref={fileRef} type="file" accept="image/*" hidden onChange={e => setPhotoFile(e.target.files?.[0] || null)} />
                </div>
                {errs.photo && <div style={{ color:'#ef4444', fontWeight:800, marginTop:4 }}>{errs.photo}</div>}
              </div>

              <div className="att-field">
                <label>Full name <span className="req">*</span></label>
                <input value={form.fullName} onChange={e=>setField('fullName', e.target.value)} />
                {errs.fullName && <div style={{ color:'#ef4444', fontWeight:800 }}>{errs.fullName}</div>}
              </div>

              <div className="att-field">
                <label>Email <span className="req">*</span></label>
                <input type="email" value={form.email} onChange={e=>setField('email', e.target.value)} />
                {errs.email && <div style={{ color:'#ef4444', fontWeight:800 }}>{errs.email}</div>}
              </div>

              <div className="att-field">
                <label>Phone</label>
                <input value={form.phone} onChange={e=>setField('phone', e.target.value)} />
              </div>

              {/* Country */}
              <div className="att-field">
                <label>Country <span className="req">*</span></label>
                <CountrySelect
                  value={form.country}
                  onChange={code => setField('country', (code || '').toUpperCase())}
                />
                {errs.country && <div style={{ color:'#ef4444', fontWeight:800 }}>{errs.country}</div>}
              </div>

              <div className="att-field">
                <label>City</label>
                <input value={form.city} onChange={e=>setField('city', e.target.value)} />
              </div>

              {/* Org fields — hidden for Student */}
              {shouldShowOrgFields && (
                <>
                  <div className="att-field">
                    <label>Organization <span className="req">*</span></label>
                    <input value={form.orgName} onChange={e=>setField('orgName', e.target.value)} />
                    {errs.orgName && <div style={{ color:'#ef4444', fontWeight:800 }}>{errs.orgName}</div>}
                  </div>

                  <div className="att-field">
                    <label>Job title <span className="req">*</span></label>
                    <input value={form.jobTitle} onChange={e=>setField('jobTitle', e.target.value)} />
                    {errs.jobTitle && <div style={{ color:'#ef4444', fontWeight:800 }}>{errs.jobTitle}</div>}
                  </div>

                  <div className="att-field">
                    <label>Business role <span className="req">*</span></label>
                    <input placeholder="Founder, Manager, Consultant…" value={form.businessRole} onChange={e=>setField('businessRole', e.target.value)} />
                    {errs.businessRole && <div style={{ color:'#ef4444', fontWeight:800 }}>{errs.businessRole}</div>}
                  </div>
                </>
              )}

              <div className="att-field">
                <label>Password <span className="req">*</span></label>
                <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:8 }}>
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={form.pwd}
                    onChange={e => setField('pwd', e.target.value)}
                    placeholder="At least 8 characters"
                  />
                  <button
                    type="button"
                    className="btn-line"
                    onClick={() => setShowPwd(v => !v)}
                    aria-label={showPwd ? 'Hide password' : 'Show password'}
                  >
                    {showPwd ? 'Hide' : 'Show'}
                  </button>
                </div>
                {errs.pwd && <div style={{ color:'#ef4444', fontWeight:800 }}>{errs.pwd}</div>}
              </div>

              <div className="att-field">
                <label>Confirm password <span className="req">*</span></label>
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={form.pwd2}
                  onChange={e => setField('pwd2', e.target.value)}
                  placeholder="Repeat your password"
                />
                {errs.pwd2 && <div style={{ color:'#ef4444', fontWeight:800 }}>{errs.pwd2}</div>}
              </div>

              <div className="att-field">
                <label>Website / Facebook / Instagram…</label>
                <input placeholder="https://…" value={form.website} onChange={e=>setField('website', e.target.value)} />
              </div>

              <div className="att-field">
                <label>LinkedIn</label>
                <input placeholder="https://linkedin.com/in/…" value={form.linkedin} onChange={e=>setField('linkedin', e.target.value)} />
              </div>

              {/* Languages */}
              <div className="att-field full">
                <label>Preferred languages <span className="req">*</span></label>
                <LanguageSelect value={form.languages} onChange={v => setField('languages', v)} max={3} />
                {errs.languages && <div style={{ color:'#ef4444', fontWeight:800 }}>{errs.languages}</div>}
              </div>

              {/* SubRole — hidden for Student */}
              {showSubRoles  && (
                <div className="att-field full">
                  <label>Sub-roles (multi-select)</label>
                  <SubRoleSelect
                    values={form.subRoles}
                    onChange={v => setField('subRoles', v)}
                    options={SUBROLE_OPTIONS}
                  />
                  <div className="hint">Choose any that apply. This is simple metadata saved on your actor profile.</div>
                </div>
              )}

              <div className="att-field full">
                <label>Objective</label>
                <select value={form.objective} onChange={e=>setField('objective', e.target.value)}>
                  <option value="">Select…</option>
                  <option value="networking">Networking</option>
                  <option value="find-partners">Find partners</option>
                  <option value="find-investors">Find investors</option>
                  <option value="find-clients">Find clients</option>
                  <option value="learn-trends">Learn trends</option>
                </select>
              </div>

              <div className="att-field full" style={{ alignItems:'flex-start' }}>
                <label>Open to meetings?</label>
                <label className="chk-inline">
                  <input type="checkbox" checked={!!form.openToMeetings} onChange={e=>setField('openToMeetings', e.target.checked)} />
                  Yes, allow B2B requests
                </label>
              </div>
            </div>

            <div className="att-actions">
              <button type="button" className="btn btn-line" onClick={() => setStep(1)}>Back</button>
              <button type="submit" className="btn">Continue</button>
            </div>
          </form>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <div className="animate-fade-in">
            <div className="max-w-6xl mx-auto px-4 py-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-light text-gray-800">Choose Your Journey at IPDAYS X GITS 2025</h2>
                <p className="text-gray-600 mt-2">Select the sessions you’d like to attend.</p>
              </div>

              {schedFetching ? (
                <div className="h-64 bg-gray-100 rounded-lg animate-pulse" />
              ) : !filteredSortedSessions.length ? (
                <div className="text-center text-gray-500 py-8">No sessions available yet.</div>
              ) : (
                <>
                  <div className="bg-blue-50 p-4 rounded-lg mb-6 max-w-3xl mx-auto">
                    <p className="text-sm text-gray-700">
                      <strong>Note:</strong> Masterclasses and Ateliers run in parallel tracks. You can pick one <em>Masterclass</em> and one <em>Atelier</em> at the same time, but not two in the same family/time slot.
                    </p>
                  </div>

                  <div className="space-y-12">
                    {trackSections.map(section => (
                      <div key={section.track} className="att-track-section">
                        <h3 className="text-xl font-semibold text-gray-800 mb-4 border-b border-gray-200 pb-2">
                          {section.track}
                        </h3>
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                          {section.items.map(s => {
                            const compositeKey = compositeKeyFor(s);
                            const isSelected = selectedBySlot[compositeKey]?._id === s._id;
                            const c = counts?.[s._id] || {};
                            const reg = c.registered || 0;
                            const cap = s.roomCapacity || 0;
                            const pct = cap ? Math.min(100, Math.round((reg / cap) * 100)) : 0;
                            const title = s.title || s.sessionTitle || 'Session';
                            const when = new Date(s.startISO);

                            return (
                              <article
                                key={s._id}
                                className={`p-4 bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow ${isSelected ? 'ring-2 ring-blue-500' : ''} ${section.track === 'B2B' ? 'bg-blue-50' : ''}`}
                              >
                                {s.cover ? (
                                  <img
                                    src={s.cover}
                                    alt={title}
                                    className="w-full h-32 object-cover rounded-md mb-4"
                                  />
                                ) : null}

                                <div className="space-y-2">
                                  <div className="flex flex-wrap gap-2">
                                    {s.track ? (
                                      <span className="inline-block px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-full">
                                        {s.track}
                                      </span>
                                    ) : (
                                      <span className="inline-block px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-full">
                                        Session
                                      </span>
                                    )}
                                    {s.roomName ? (
                                      <span className="inline-block px-2 py-1 text-xs text-gray-600 bg-gray-100 rounded-full">
                                        Room: {s.roomName}
                                      </span>
                                    ) : null}
                                    {s.roomLocation ? (
                                      <span className="inline-block px-2 py-1 text-xs text-gray-600 bg-gray-100 rounded-full">
                                        Loc: {s.roomLocation}
                                      </span>
                                    ) : null}
                                    <span className="inline-block px-2 py-1 text-xs text-gray-600 bg-gray-100 rounded-full">
                                      {when.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} •{' '}
                                      {when.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>

                                  <h4 className="text-lg font-medium text-gray-800">{title}</h4>

                                  {!!s.speakers?.length && (
                                    <p className="text-sm text-gray-600">
                                      {s.speakers.map(x => x.name || x).join(', ')}
                                    </p>
                                  )}

                                  {s.summary ? (
                                    <p className="text-sm text-gray-600 line-clamp-3">{s.summary}</p>
                                  ) : null}

                                  <div className="mt-2">
                                    <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                                      <div className="h-full bg-blue-500" style={{ width: `${pct}%` }} />
                                    </div>
                                    <div className="flex gap-2 text-xs text-gray-600 mt-1">
                                      <span><b>{reg}</b> registered</span>
                                      {cap ? <span>• <b>{cap}</b> capacity</span> : null}
                                      {c.waitlisted ? <span>• <b>{c.waitlisted}</b> waitlisted</span> : null}
                                    </div>
                                  </div>

                                  {!!s.tags?.length && (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                      {s.tags.slice(0, 8).map(t => (
                                        <span key={t} className="inline-block px-2 py-1 text-xs text-gray-600 bg-gray-100 rounded-full">
                                          {t}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                <div className="flex gap-2 mt-4">
                                  <button
                                    type="button"
                                    className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                                    onClick={() => { setModalSession(s); setModalOpen(true); }}
                                  >
                                    Info
                                  </button>
                                  <button
                                    type="button"
                                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                                      isSelected
                                        ? 'bg-blue-500 text-white hover:bg-blue-600'
                                        : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                    }`}
                                    onClick={() => toggleSession(s)}
                                  >
                                    {isSelected ? 'Selected' : 'Select'}
                                  </button>
                                </div>
                              </article>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between mt-8">
                    <button
                      className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                      onClick={() => setStep(2)}
                    >
                      Back
                    </button>
                    <button
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600 transition-colors disabled:bg-blue-300"
                      disabled={regLoading}
                      onClick={finishAll}
                    >
                      {regLoading ? 'Submitting…' : 'Finish Registration'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* STEP 4 */}
        {step === 4 && (
          <div className="anim-in">
            <div className="reg-empty" style={{ borderStyle:'solid', color:'#111827' }}>
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
