import React from "react";
import PropTypes from "prop-types";
import "./business-contact.css";

/* tiny inline icons (no deps) */
const I = {
  mail: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="3" y="6" width="18" height="12" rx="2" stroke="currentColor"/><path d="M3 7l9 6 9-6" stroke="currentColor"/></svg>),
  phone: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M4 5c0 8 7 15 15 15l2-3-4-3-2 2a12 12 0 0 1-6-6l2-2-3-4L4 5z" stroke="currentColor" strokeWidth="2"/></svg>),
  map: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11Z" stroke="currentColor"/><circle cx="12" cy="10" r="2" stroke="currentColor"/></svg>),
  arrow: () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M7 17 17 7M9 7h8v8" stroke="currentColor" strokeWidth="2"/></svg>),
  file: () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12V9l-4-6Z" stroke="currentColor"/><path d="M14 3v6h6" stroke="currentColor"/></svg>),
  user: () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="currentColor"/><path d="M4 21c0-3.3 5-5 8-5s8 1.7 8 5" stroke="currentColor"/></svg>),
  chat: () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M21 14a7 7 0 0 1-7 7H6l-4 2 2-4v-5a7 7 0 1 1 17 0Z" stroke="currentColor"/></svg>),
};

/* ---- Demo fallbacks (only used if no data arrives) ---- */
const DEMO_CONTACTS = [
  { id:"c1", name:"Sales Desk",   role:"New Business", email:"sales@yourco.com",   phone:"+1 415 555 0199", avatar:"" },
  { id:"c2", name:"Partnerships", role:"Alliances",    email:"partners@yourco.com", phone:"+44 20 7946 0111", avatar:"" },
  { id:"c3", name:"Support",      role:"Customer Care",email:"support@yourco.com",  phone:"+971 4 000 0000", avatar:"" },
];
const DEMO_LOCATIONS = [
  { id:"l1", label:"HQ", address:"120 Market St", city:"San Francisco", country:"USA" },
  { id:"l2", label:"EU Office", address:"Friedrichstr. 88", city:"Berlin", country:"Germany" },
];
const DEMO_COLLATERAL = [
  { id:"f1", label:"Media Kit (PDF)", href:"#"},
  { id:"f2", label:"Product Catalog", href:"#"},
  { id:"f3", label:"Security Overview", href:"#"},
];
const DEMO_TOPICS = ["Sales Inquiry","Partnership","Support","Press","Other"];

/* ---------- helpers: normalize dashboard contacts ---------- */
/**
 * Dashboard saves contacts like:
 *   { kind: 'email'|'phone'|'whatsapp', value: '...', label: 'Sales' }
 * We group rows by label so each label becomes a card with email/phone/whatsapp merged.
 */
function groupContacts(contacts) {
  const arr = Array.isArray(contacts) ? contacts : [];
  const map = new Map();
  for (const c of arr) {
    if (!c || !c.label || !c.kind || !c.value) continue;
    const key = String(c.label).trim();
    if (!map.has(key)) map.set(key, { id: key, name: key, role: "", email: "", phone: "", whatsapp: "", avatar: "" });
    const row = map.get(key);
    const kind = String(c.kind).toLowerCase();
    if (kind === "email") row.email = c.value;
    else if (kind === "phone") row.phone = c.value;
    else if (kind === "whatsapp") row.whatsapp = c.value;
  }
  return Array.from(map.values());
}

function initialsOf(name = "") {
  return (name || "?")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(s => s[0].toUpperCase())
    .join("");
}

export default function BusinessContact({
  heading = "Contact",
  subheading = "Get in touch with the right team.",
  companyName = "",
  contacts,          // <-- raw from API (dashboard)
  locations = DEMO_LOCATIONS,
  collateral = DEMO_COLLATERAL,
  topics = DEMO_TOPICS,
  onSend,            // (payload) => void
  onMessage,         // (contactCard) => void
  onMeet             // (contactCard) => void
}) {
  // Build person-like cards from dashboard contacts
  const cards = React.useMemo(() => {
    const grouped = groupContacts(contacts);
    return grouped.length ? grouped : DEMO_CONTACTS;
  }, [contacts]);

  const [form, setForm] = React.useState({
    name:"", email:"", company:"", topic: topics[0] || "Sales Inquiry", message:""
  });
  const setVal = (k,v)=> setForm(s=>({ ...s, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { ...form, source:"BusinessContact", ts: Date.now() };
    if (onSend) onSend(payload);
    else window.alert("Submitted:\n" + JSON.stringify(payload,null,2));
  };

  const waHref = (num) => {
    if (!num) return null;
    // strip non-digits for wa.me format
    const digits = String(num).replace(/[^\d]/g, "");
    return digits ? `https://wa.me/${digits}` : null;
  };

  return (
    <section className="bcontact">
      {/* header */}
      <header className="bc-head">
        <div>
          <h3 className="bc-title">{heading}</h3>
          {subheading ? <p className="bc-sub">{subheading}</p> : null}
        </div>
        {companyName ? <div className="bc-company">{companyName}</div> : null}
      </header>

      <div className="bc-grid">
        {/* LEFT: people + locations + collateral */}
        <aside className="bc-left">
          <div className="card">
            <h4 className="card-title">Talk to a person</h4>
            <div className="people">
              {cards.map((c)=>(
                <article key={c.id || c.name} className="person">
                  <div className="avatar" aria-hidden="true">
                    {c.avatar
                      ? <span style={{backgroundImage:`url(${c.avatar})`}}/>
                      : <span className="initials">{initialsOf(c.name)}</span>}
                  </div>
                  <div className="p-body">
                    <div className="p-row">
                      <strong className="p-name">{c.name || "—"}</strong>
                      {c.role ? <span className="p-role">{c.role}</span> : null}
                    </div>
                    <div className="p-meta">
                      {c.email && <a className="chip" href={`mailto:${c.email}`}><I.mail/>{c.email}</a>}
                      {c.phone && <a className="chip" href={`tel:${c.phone}`}><I.phone/>{c.phone}</a>}
                      {c.whatsapp && <a className="chip" href={waHref(c.whatsapp)} target="_blank" rel="noreferrer"><I.phone/>{c.whatsapp}</a>}
                    </div>
                    <div className="p-actions">
                      <button
                        type="button"
                        className="btn-ghost"
                        onClick={()=> onMessage ? onMessage(c) : window.alert(`Message ${c.name||"contact"}`)}
                      ><I.chat/> Message</button>
                      <button
                        type="button"
                        className="btn"
                        onClick={()=> onMeet ? onMeet(c) : window.alert(`Book a meeting with ${c.name||"contact"}`)}
                      >Meet</button>
                    </div>
                  </div>
                </article>
              ))}
              {!cards.length && <div className="bc-muted">No contacts available yet.</div>}
            </div>
          </div>

          <div className="card">
            <h4 className="card-title">Locations &amp; hours</h4>
            <div className="locs">
              {locations.map(loc=>(
                <div key={loc.id || `${loc.label}-${loc.city}`} className="loc">
                  <span className="badge">{loc.label || "Office"}</span>
                  <div className="addr">
                    <I.map/>{[loc.address, loc.city, loc.country].filter(Boolean).join(", ")}
                  </div>
                </div>
              ))}
            </div>
            <div className="hours">
              <span className="h-dot" aria-hidden="true"/> Mon–Fri, 9:00–18:00 (local)
            </div>
          </div>

          <div className="card">
            <h4 className="card-title">Downloads</h4>
            <div className="files">
              {Array.isArray(collateral) && collateral.length ? collateral.map(f=>(
                <a key={f.id || f.label} className="file" href={f.href}>
                  <I.file/>{f.label}<I.arrow/>
                </a>
              )) : <div className="bc-muted">No downloads available.</div>}
            </div>
          </div>
        </aside>

        {/* RIGHT: contact form */}
        <div className="bc-form">
          <form className="form" onSubmit={handleSubmit}>
            <div className="row">
              <div className="field">
                <label htmlFor="bc-name">Full name</label>
                <input id="bc-name" value={form.name} onChange={e=>setVal("name", e.target.value)} placeholder="Jane Doe" required/>
              </div>
              <div className="field">
                <label htmlFor="bc-email">Work email</label>
                <input id="bc-email" type="email" value={form.email} onChange={e=>setVal("email", e.target.value)} placeholder="jane@company.com" required/>
              </div>
            </div>

            <div className="row">
              <div className="field">
                <label htmlFor="bc-company">Company</label>
                <input id="bc-company" value={form.company} onChange={e=>setVal("company", e.target.value)} placeholder="Company Inc."/>
              </div>
              <div className="field">
                <label htmlFor="bc-topic">Topic</label>
                <select id="bc-topic" value={form.topic} onChange={e=>setVal("topic", e.target.value)}>
                  {topics.map(t=> <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div className="field">
              <label htmlFor="bc-msg">Message</label>
              <textarea id="bc-msg" rows={6} value={form.message} onChange={e=>setVal("message", e.target.value)} placeholder="Tell us about your use case…"/>
            </div>

            <div className="actions">
              <button type="submit" className="btn-lg">Send message</button>
              <span className="hint">You’ll hear back within 1–2 business days.</span>
            </div>
          </form>

          {/* decorative map panel */}
          <div className="mapcard" aria-hidden="true" title="Service regions">
            <div className="m-overlay"/>
            <div className="m-badges">
              <span className="m-pill">Americas</span>
              <span className="m-pill">EMEA</span>
              <span className="m-pill">APAC</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

BusinessContact.propTypes = {
  heading: PropTypes.string,
  subheading: PropTypes.string,
  companyName: PropTypes.string,
  contacts: PropTypes.oneOfType([PropTypes.array, PropTypes.object]), // array expected; object tolerated (ignored)
  locations: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string, label: PropTypes.string, address: PropTypes.string, city: PropTypes.string, country: PropTypes.string
  })),
  collateral: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.string, label: PropTypes.string, href: PropTypes.string })),
  topics: PropTypes.arrayOf(PropTypes.string),
  onSend: PropTypes.func,
  onMessage: PropTypes.func,
  onMeet: PropTypes.func,
};
