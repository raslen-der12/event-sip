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

/* Catalog of “actor types” (FR) */
const ROLE_TYPES = [
  { key: 'BusinessOwner', title: 'Chef d’entreprise', desc: 'Possède ou co-détient une entreprise. Peut ensuite créer un profil complet, définir les secteurs, produits et services.' },
  { key: 'Consultant',    title: 'Consultant',        desc: 'Conseille les entreprises. Idéal si vous vendez votre expertise et souhaitez lister vos services plus tard.' },
  { key: 'Employee',      title: 'Employé',           desc: 'Représente une organisation sans en être le propriétaire. Peut réseauter et planifier des rendez-vous.' },
  { key: 'Expert',        title: 'Expert',            desc: 'Spécialiste dans un domaine. Parfait pour les ateliers, le mentorat et les opportunités B2B.' },
  { key: 'Investor',      title: 'Investisseur',      desc: 'Business angel, VC ou investisseur corporate. Peut indiquer ses intérêts et se connecter avec des startups/exposants.' },
  { key: 'Student',       title: 'Étudiant',          desc: 'Début de carrière. Apprend, développe son réseau et découvre des opportunités.' },
];

/* Track constants + family logic (lets Masterclass & Atelier be parallel) */
const TRACK_B2B_NAME = "B2B";
const MASTERCLASS = "masterclass";
const ATELIER = "atelier";

function familyOfTrack(track) {
  const t = String(track || '').toLowerCase();
  if (t.includes('masterclass')) return MASTERCLASS;
  if (t.includes('atelier')) return ATELIER;
  return 'other';
}

/* SubRole options (checkbox list) */
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

/* Objective chips (checkbox-like) */
const OBJECTIVES = [
  { code: 'networking',     label: 'Networking' },
  { code: 'find-partners',  label: 'Réseautage' },
  { code: 'find-investors', label: 'Trouver des investisseurs' },
  { code: 'find-clients',   label: 'Trouver des clients' },
  { code: 'learn-trends',   label: 'Apprendre les tendances' },
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
function TrackSelect({ options = [], value = '', onChange, placeholder = 'Toutes les pistes' }) {
  const [open, setOpen] = React.useState(false);
  const wrapRef = React.useRef(null);

  // close on outside click
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
          <div className="sel-item" onClick={() => { onChange(''); setOpen(false); }}>Toutes</div>
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

function GenderSelect({ value = '', onChange, name = 'gender' }) {
  const Item = ({ val, label }) => {
    const active = value === val;
    return (
      <label className={`lang-item ${active ? 'active' : ''}`} style={{ cursor:'pointer' }}>
        <input
          type="radio"
          name={name}
          value={val}
          checked={active}
          onChange={() => onChange(val)}
          style={{ display: 'none' }}
        />
        <span>{label}</span>
      </label>
    );
  };

  return (
    <div className="lang-grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0,1fr))' }}>
      <Item val="male" label="Homme" />
      <Item val="female" label="Femme" />
    </div>
  );
}

function ObjectiveSelect({ values = [], onChange }) {
  const toggle = (code) => {
    const has = values.includes(code);
    if (has) onChange(values.filter(v => v !== code));
    else onChange([...values, code]);
  };

  const remove = (code) => onChange(values.filter(v => v !== code));

  return (
    <div>
      <div className="objective-grid">
        {OBJECTIVES.map(o => {
          const active = values.includes(o.code);
          return (
            <div
              key={o.code}
              className={`lang-item ${active ? 'active' : ''}`}
              onClick={() => toggle(o.code)}
            >
              {o.label}
            </div>
          );
        })}
      </div>

      <div className="lang-chips" style={{ marginTop: 8 }}>
        {values.map(code => {
          const item = OBJECTIVES.find(x => x.code === code);
          return (
            <span key={code} className="lang-chip">
              {item?.label || code}
              <span className="x" onClick={() => remove(code)}>×</span>
            </span>
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
    seatsTaken: typeof s.seatsTaken === 'number'
      ? s.seatsTaken
      : (typeof s.seats_taken === 'number' ? s.seats_taken : 0),
    startISO,
    endISO: end ? new Date(end).toISOString() : '',
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
    return String(a.track || "").localeCompare(String(b.track || ""), undefined, { sensitivity: "base" });
  });

  return entries;
}

const groupByDayAndSlot = (raw) => {
  const sessions = raw.map(normSession).filter(x => x.startISO);
  const dayMap = new Map();
  for (const s of sessions) {
    if (!dayMap.has(s.dayISO)) dayMap.set(s.dayISO, new Map());
    const slotKey = s.startISO;
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

  const regFromSession = typeof session?.seatsTaken === 'number' ? session.seatsTaken : NaN;
  const reg = Number.isFinite(regFromSession) ? regFromSession : Number(counts?.[session?._id]?.registered || 0);
  const wait = Number(counts?.[session?._id]?.waitlisted || 0);
  const cap  = session?.roomCapacity || 0;
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

/* ===== Main (single-page progressive flow) ===== */
export default function AttendeeRegisterPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const eventId = params.get('eventId') || '68e6764bb4f9b08db3ccec04';
  const { data: event, isLoading: evLoading, isError: evErr } = useGetEventQuery(eventId, { skip: !eventId });

  // progressive reveal
  const [roleType, setRoleType] = useState('');
  const [showSessions, setShowSessions] = useState(false);
  const [finished, setFinished] = useState(false);

  // sessions filter
  const [track, setTrack] = useState('');

  const { data: schedulePack, isFetching: schedFetching } = useGetEventSessionsQuery(
    { eventId, track, includeCounts: 1 },
    { skip: !eventId || !showSessions },
  );

  const [attendeeRegister, { isLoading: regLoading }] = useAttendeeRegisterMutation();

  /* Photo (optional) */
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

  // initial form factory (role can affect requireds later if you want)
  const makeInitialForm = () => ({
    fullName: '',
    email: '',
    phone: '',
    country: '',
    city: '',
    orgName: '',
    jobTitle: '',
    website: '',
    linkedin: '',
    languages: [],
    objective: [],
    gender: 'male',
    inviteCode: '',
    pwd: '',
    pwd2: '',
    virtualMeet: '',
    openToMeetings: true,
    subRoles: [],
  });

  const [form, setForm] = useState(makeInitialForm());
  const setField = (k, v) => setForm(prev => ({ ...prev, [k]: v }));
  const [errs, setErrs] = useState({});

  const isStudent = roleType === 'Student';
  const showSubRoles = roleType && roleType !== 'BusinessOwner';
  const shouldShowOrgFields = !isStudent;

  // Changing role resets everything below + sessions
  const handlePickRole = (key) => {
    if (key === roleType) return;
    setRoleType(key);
    setForm(makeInitialForm());
    setErrs({});
    setPhotoFile(null);
    setShowSessions(false);
    setSelectedBySlot({});
    setFinished(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /* Track-aware selection (parallel families) */
  const [selectedBySlot, setSelectedBySlot] = useState({}); // { compositeKey: session }
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

  /* Normalize sessions */
  const { sessions } = useMemo(() => {
    const raw = (schedulePack?.data || schedulePack?.sessions || schedulePack || []);
    return groupByDayAndSlot(Array.isArray(raw) ? raw : []);
  }, [schedulePack]);

  // --- place right after:  const { sessions } = useMemo(...);

// find earliest day (day 1)
const earliestDayISO = useMemo(() => {
  const ds = Array.from(new Set((sessions || []).map(s => s.dayISO).filter(Boolean)));
  ds.sort((a, b) => new Date(a) - new Date(b));
  return ds[0] || null;
}, [sessions]);

// sessions to actually display (no day 1, no "Formation")
const displaySessions = useMemo(() => {
  const rxFormation = /^\s*formation\s*$/i;
  return (sessions || []).filter(s => {
    if (earliestDayISO && s.dayISO === earliestDayISO) return false;   // drop day 1
    if (rxFormation.test(s.track || '')) return false;                  // drop "Formation"
    return true;
  });
}, [sessions, earliestDayISO]);

// Track/day options (filter list too)
const uniqueTracks = useMemo(() => {
  const t = new Set();
  displaySessions.forEach(s => { if (s.track) t.add(s.track); });
  return Array.from(t);
}, [displaySessions]);

// Compact sections (use filtered sessions)
const trackSections = useMemo(() => {
  if (!Array.isArray(displaySessions) || !displaySessions.length) return [];

  const group = {};
  for (const s of displaySessions) {
    if (track && s.track !== track) continue;
    const key = (s.track || "Autre").trim();
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

  /* Validate & reveal sessions */
  const submitForm = (e) => {
    e.preventDefault();
    const e2 = {};
    if (!required(form.pwd)) e2.pwd = 'Requis';
    else if ((form.pwd || '').length < 8) e2.pwd = 'Min 8 caractères';
    if (form.pwd2 !== form.pwd) e2.pwd2 = 'Les mots de passe ne correspondent pas';

    if (!required(form.fullName)) e2.fullName = 'Requis';
    if (!required(form.email)) e2.email = 'Requis';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email || '')) e2.email = 'Email invalide';
    if (!required(form.country)) e2.country = 'Requis';
    if (!form.languages?.length) e2.languages = 'Choisissez au moins 1 langue';
    if (!form.gender) e2.gender = 'Requis';
    if (shouldShowOrgFields) {
      if (!required(form.orgName)) e2.orgName = 'Requis';
      if (!required(form.jobTitle)) e2.jobTitle = 'Requis';
    }
    if (form.virtualMeet !== true && form.virtualMeet !== false) e2.virtualMeet = 'Requis';
    setErrs(e2);
    if (Object.keys(e2).length) return;

    setShowSessions(true);
    setTimeout(() => {
      const anchor = document.getElementById('sessions-anchor');
      if (anchor) anchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 40);
  };

  /* Submit all */
  const finishAll = async () => {
    if (!selectedSessionIds.length) {
      alert('Veuillez choisir au moins une session (une par créneau horaire et par famille de piste).');
      return;
    }
    const fd = new FormData();
    fd.append('eventId', eventId);
    fd.append('role', 'attendee');
    fd.append('actorType', roleType);
    fd.append('pwd', form.pwd);
    fd.append('personal.gender', form.gender || '');
    fd.append('personal.fullName', form.fullName);
    fd.append('personal.email', form.email);
    fd.append('personal.phone', form.phone);
    fd.append('personal.country', (form.country || '').toUpperCase());
    fd.append('personal.city', form.city);
    fd.append('personal.profilePic', '');

    if (shouldShowOrgFields) {
      fd.append('organization.orgName', form.orgName);
      fd.append('organization.jobTitle', form.jobTitle);
    }

    fd.append('businessProfile.preferredLanguages', form.languages.join(','));
    fd.append('matchingIntent.objective', Array.isArray(form.objective) ? form.objective.join(',') : form.objective);
    fd.append('matchingIntent.openToMeetings', String(!!form.openToMeetings));
    fd.append('links.website', form.website);
    fd.append('links.linkedin', form.linkedin);
    fd.append('inviteCode', form.inviteCode);
    fd.append('virtualMeet', String(form.virtualMeet === true));
    if (Array.isArray(form.subRoles)) {
      form.subRoles.forEach(v => fd.append('subRole[]', v));
    }

    selectedSessionIds.forEach(id => fd.append('sessionIds[]', id));
    if (photoFile) fd.append('photo', photoFile);

    try {
      await attendeeRegister(fd).unwrap();
      triggerPopup({
        title: "Inscription terminée",
        body: "Commencez votre parcours B2B",
        type: "success",
        link: { href: "/login", label: "Aller à la connexion" }
      });
      setFinished(true);
      setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 60);
      setTimeout(() => navigate('/'), 1400);
    } catch (e) {
      triggerPopup({
        title: "Échec de l’inscription",
        body: e?.data?.message || "Une erreur s’est produite. Veuillez réessayer.",
        type: "error"
      });
      alert(e?.data?.message || 'Registration failed');
    }
  };

  /* Compact sessions data (space-efficient) */

  /* ===== UI ===== */
  return (
    <>
      <HeaderShell top={topbar} nav={nav} cta={cta} />
      <div className="reg-wrap">
        {/* Event header */}
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
              </div>
            </>
          )}
        </header>

        {/* ===== SECTION 1: Role (always visible) ===== */}
        <section className="anim-in">
          <div className="att-section-head">
            <div className="t">Choisissez votre type d'acteur</div>
            <div className="h">En sélectionnant, le formulaire s’affiche juste en dessous. Changer le type réinitialise le formulaire et les choix de sessions.</div>
          </div>

          <div className="role-grid">
            {ROLE_TYPES.map(r => {
              const active = roleType === r.key;
              return (
                <article
                  key={r.key}
                  onClick={() => handlePickRole(r.key)}
                  className={`role-card ${active ? 'active' : ''}`}
                  title={r.title}
                >
                  <div className="role-title">{r.title}</div>
                  <div className="role-desc">{r.desc}</div>
                </article>
              );
            })}
          </div>
        </section>

        {/* ===== SECTION 2: Form (appears after role picked) ===== */}
        {roleType && !finished && (
          <form className="anim-in reg-card" onSubmit={submitForm} style={{ marginTop: 14 }}>
            <div className="att-section-head">
              <div className="t">Détails des participants</div>
              <div className="h">Tous les champs marqués <span className="req" style={{ color:'#ef4444', fontWeight:800 }}>*</span> sont obligatoires</div>
            </div>

            <div className="att-form-grid">
              <div className="att-field">
                <label>Nom complet <span className="req">*</span></label>
                <input value={form.fullName} onChange={e=>setField('fullName', e.target.value)} />
                {errs.fullName && <div style={{ color:'#ef4444', fontWeight:800 }}>{errs.fullName}</div>}
              </div>

              <div className="att-field">
                <label>Email <span className="req">*</span></label>
                <input type="email" value={form.email} onChange={e=>setField('email', e.target.value)} />
                {errs.email && <div style={{ color:'#ef4444', fontWeight:800 }}>{errs.email}</div>}
              </div>

              <div className="att-field">
                <label>Téléphone</label>
                <input value={form.phone} onChange={e=>setField('phone', e.target.value)} />
              </div>

              <div className="att-field">
                <label>Pays <span className="req">*</span></label>
                <CountrySelect
                  value={form.country}
                  onChange={code => setField('country', (code || '').toUpperCase())}
                />
                {errs.country && <div style={{ color:'#ef4444', fontWeight:800 }}>{errs.country}</div>}
              </div>

              <div className="att-field">
                <label>Ville</label>
                <input value={form.city} onChange={e=>setField('city', e.target.value)} />
              </div>
              <div className="att-field">
                <label>Genre<span className="req"> *</span></label>
                <GenderSelect value={form.gender} onChange={v => setField('gender', v)} />
              </div>
                            {shouldShowOrgFields && (
                <>
                  <div className="att-field">
                    <label>Organisation <span className="req">*</span></label>
                    <input value={form.orgName} onChange={e=>setField('orgName', e.target.value)} />
                    {errs.orgName && <div style={{ color:'#ef4444', fontWeight:800 }}>{errs.orgName}</div>}
                  </div>

                  <div className="att-field">
                    <label>Intitulé du poste <span className="req">*</span></label>
                    <input value={form.jobTitle} onChange={e=>setField('jobTitle', e.target.value)} />
                    {errs.jobTitle && <div style={{ color:'#ef4444', fontWeight:800 }}>{errs.jobTitle}</div>}
                  </div>
                </>
              )}

              <div className="att-field">
                <label>Mot de passe <span className="req">*</span></label>
                <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:8 }}>
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={form.pwd}
                    onChange={e => setField('pwd', e.target.value)}
                    placeholder="Au moins 8 caractères"
                  />
                  <button
                    type="button"
                    className="btn-line"
                    onClick={() => setShowPwd(v => !v)}
                    aria-label={showPwd ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  >
                    {showPwd ? 'Masquer' : 'Afficher'}
                  </button>
                </div>
                {errs.pwd && <div style={{ color:'#ef4444', fontWeight:800 }}>{errs.pwd}</div>}
              </div>

              <div className="att-field">
                <label>Confirmer le mot de passe <span className="req">*</span></label>
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={form.pwd2}
                  onChange={e => setField('pwd2', e.target.value)}
                  placeholder="Répétez votre mot de passe"
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
              <div className="att-field">
                <label>Invite code</label>
                <input placeholder="optional if you had one" value={form.inviteCode} onChange={e=>setField('inviteCode', e.target.value)} />
              </div>

              <div className="att-field full">
                <label>Langues préférées <span className="req">*</span></label>
                <LanguageSelect value={form.languages} onChange={v => setField('languages', v)} max={3} />
                {errs.languages && <div style={{ color:'#ef4444', fontWeight:800 }}>{errs.languages}</div>}
              </div>

              {showSubRoles  && (
                <div className="att-field full">
                  <label>Votre secteur de spécialité (multi-select)</label>
                  <SubRoleSelect
                    values={form.subRoles}
                    onChange={v => setField('subRoles', v)}
                    options={SUBROLE_OPTIONS}
                  />
                  <div className="hint">Sélectionnez toutes les options qui s'appliquent.</div>
                </div>
              )}

              <div className="att-field full">
                <label>Objectif</label>
                <ObjectiveSelect
                  values={form.objective}
                  onChange={(v) => setField('objective', v)}
                />
              </div>
              <div className="att-field full" style={{ alignItems:'flex-start' }}>
                <label>Disponible pour des rendez-vous ?</label>
                <label className="chk-inline as-switch">
                  <input
                    type="checkbox"
                    checked={!!form.openToMeetings}
                    onChange={e=>setField('openToMeetings', e.target.checked)}
                  />
                  <span className="sw" aria-hidden="true"><span className="knob" /></span>
                  <span className="txt">Oui, autoriser les demandes B2B</span>
                </label>
              </div>
              <div className="att-field full">
                <label>Mode des rendez-vous <span className="req">*</span></label>
                <div className="lang-grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0,1fr))' }}>
                  <label className={`lang-item ${form.virtualMeet === false ? 'active' : ''}`} style={{ cursor:'pointer' }}>
                    <input
                      type="radio"
                      name="virtualMeet"
                      value="physical"
                      checked={form.virtualMeet === false}
                      onChange={() => setField('virtualMeet', false)}
                      style={{ display:'none' }}
                    />
                    <span>Présentiel (physique)</span>
                  </label>

                  <label className={`lang-item ${form.virtualMeet === true ? 'active' : ''}`} style={{ cursor:'pointer' }}>
                    <input
                      type="radio"
                      name="virtualMeet"
                      value="virtual"
                      checked={form.virtualMeet === true}
                      onChange={() => setField('virtualMeet', true)}
                      style={{ display:'none' }}
                    />
                    <span>Virtuel</span>
                  </label>
                </div>
                {errs.virtualMeet && <div style={{ color:'#ef4444', fontWeight:800 }}>{errs.virtualMeet}</div>}
              </div>
              {/* Photo (OPTIONNELLE) */}
              <div className="att-field full">
                <label>Photo de profil (optionnelle)</label>
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
                      <div className="t">Déposez une image ici ou cliquez pour choisir</div>
                      <div className="h">PNG/JPG, moins de 5 Mo (optionnel)</div>
                    </div>
                  ) : (
                    <div className="att-photo-prev">
                      <img src={photoUrl} alt="preview" />
                      <div className="att-photo-actions">
                        <button type="button" className="btn-line" onClick={() => fileRef.current?.click()}>Changer</button>
                        <button type="button" className="btn-line" onClick={() => setPhotoFile(null)}>Supprimer</button>
                      </div>
                    </div>
                  )}
                  <input ref={fileRef} type="file" accept="image/*" hidden onChange={e => setPhotoFile(e.target.files?.[0] || null)} />
                </div>
              </div>
            </div>

            <div className="att-actions" style={{ justifyContent:'flex-end' }}>
              <button type="submit" className="btn">Continuer</button>
            </div>
          </form>
        )}

        {/* ===== SECTION 3: Sessions (appears after form is valid) ===== */}
        {roleType && showSessions && !finished && (
          <section className="anim-in" id="sessions-anchor" style={{ marginTop: 16 }}>
            <div className="att-section-head">
              <div className="t">Sélectionnez vos sessions</div>
              <div className="h">Pistes parallèles: vous pouvez choisir une <b>masterclass</b> et un <b>atelier</b> sur le même créneau, mais pas deux de la même famille.</div>
            </div>

            {/* Compact filter bar */}
            <div className="filter-bar">
               <TrackSelect options={uniqueTracks} value={track} onChange={setTrack} placeholder="Toutes les pistes" />
            </div>


            {schedFetching ? (
              <div className="reg-skel" style={{ height: 160 }} />
            ) : !trackSections.length ? (
              <div className="reg-empty">Aucune session disponible pour le moment.</div>
            ) : (
              <div className="att-session-list-v2">
                {trackSections.map(section => (
                  <div key={section.track} className="att-track-section-v2">
                    <div className="att-track-sep-v2">{section.track}</div>

                    {section.items?.map(s => {
                      const compositeKey = compositeKeyFor(s);
                      const isSelected = selectedBySlot[compositeKey]?._id === s._id;
                      const c   = counts?.[s._id] || {};
                      const reg = Number(
                        (typeof s.seatsTaken === 'number' ? s.seatsTaken : NaN)
                      );
                      const regSafe = Number.isFinite(reg) ? reg : Number(c.registered || 0);
                      console.log("reg:", regSafe, "s:", s);
                      const cap = s.roomCapacity || 0;
                      const pct = cap ? Math.min(100, Math.round((reg / cap) * 100)) : 0;
                      const title = s.title || s.sessionTitle || 'Session';
                      const when = new Date(s.startISO);

                      return (
                        <article
                          key={s._id}
                          className={`att-session-card-v2 ${isSelected ? 'is-selected' : ''}`}
                          onClick={() => toggleSession(s)}
                          title={title}
                        >
                          <div className="session-head-v2">
                            <div className="session-chipline-v2">
                              {s.track ? <span className="badge">{s.track}</span> : <span className="chip">Session</span>}
                              {s.roomName ? <span className="chip">Salle: {s.roomName}</span> : null}
                              {s.roomLocation ? <span className="chip">Loc: {s.roomLocation}</span> : null}
                              <span className="chip">
                                {when.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} • {when.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                                <span><b>{regSafe}</b> inscrits</span>
                                {cap ? <span>• <b>{cap}</b> capacité</span> : null}
                                {c.waitlisted ? <span>• <b>{c.waitlisted}</b> liste d’attente</span> : null}
                              </div>
                            </div>
                          ) : null}

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
                              {isSelected ? 'Sélectionné' : 'Sélectionner'}
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
                {regLoading ? 'Envoi en cours…' : 'Soumettre'}
              </button>
            </div>
          </section>
        )}

        {/* ===== DONE ===== */}
        {finished && (
          <div className="anim-in">
            <div className="reg-empty" style={{ borderStyle:'solid', color:'#111827' }}>
              ✅ Inscription reçue. Nous avons également affiché une fenêtre contextuelle avec un lien rapide.
              <div style={{ marginTop: 8 }}>
                <a className="btn" href="/login">Découvrez votre compte B2B</a>
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
