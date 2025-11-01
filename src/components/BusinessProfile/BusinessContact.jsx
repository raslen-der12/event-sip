import React from "react";
import PropTypes from "prop-types";
import "./business-contact.css";
import imageLink from "../../utils/imageLink";

/* tiny inline icons (no deps) */
const I = {
  mail: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="3" y="6" width="18" height="12" rx="2" stroke="currentColor"/><path d="M3 7l9 6 9-6" stroke="currentColor"/></svg>),
  phone: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M4 5c0 8 7 15 15 15l2-3-4-3-2 2a12 12 0 0 1-6-6l2-2-3-4L4 5z" stroke="currentColor" strokeWidth="2"/></svg>),
  map: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11Z" stroke="currentColor"/><circle cx="12" cy="10" r="2" stroke="currentColor"/></svg>),
  arrow: () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M7 17 17 7M9 7h8v8" stroke="currentColor" strokeWidth="2"/></svg>),
  link: () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M10 14a5 5 0 0 1 0-7l1-1a5 5 0 0 1 7 7l-1 1M14 10a5 5 0 0 1 0 7l-1 1a5 5 0 0 1-7-7l1-1" stroke="currentColor" strokeWidth="2"/></svg>),
  file: () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12V9l-4-6Z" stroke="currentColor"/><path d="M14 3v6h6" stroke="currentColor"/></svg>),
  user: () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="currentColor"/><path d="M4 21c0-3.3 5-5 8-5s8 1.7 8 5" stroke="currentColor"/></svg>),
  chat: () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M21 14a7 7 0 0 1-7 7H6l-4 2 2-4v-5a7 7 0 1 1 17 0Z" stroke="currentColor"/></svg>),
};

/* helpers */
function initialsOf(name = "") {
  return (name || "?").split(/\s+/).filter(Boolean).slice(0, 2).map(s => s[0].toUpperCase()).join("");
}

/* social normalize -> list of {label, href} */
function normalizesocial(social = []) {
  const out = [];
  const arr = Array.isArray(social) ? social : [];
  for (const s of arr) {
    if (!s || !s.url) continue;
    const k = String(s.kind || "").toLowerCase();
    const href = String(s.url);
    let label =
      k === "website" || k === "site" || k === "web" ? "Website" :
      k === "linkedin"  ? "LinkedIn" :
      k === "twitter" || k === "x" ? "Twitter/X" :
      k === "facebook"  ? "Facebook" :
      k === "instagram" ? "Instagram" :
      k === "youtube"   ? "YouTube" :
      k === "github"    ? "GitHub" :
      s.label || (k ? (k[0].toUpperCase()+k.slice(1)) : "Link");
    out.push({ label, href });
  }
  return out;
}

/* collateral normalize -> split images vs files, and DROP items with label "Legal" */
function normalizeCollateral(collateral = []) {
  const imgs = [];
  const files = [];
  (Array.isArray(collateral) ? collateral : []).forEach((c, i) => {
    if (!c || !c.href) return;
    const labelRaw = String(c.label || "").trim();
    if (labelRaw.toLowerCase() === "legal") return; // filter out
    const type = String(c.type || "").toLowerCase();
    const href = imageLink(c.href);
    const row = { id: c.id || `${labelRaw || "asset"}-${i}`, label: labelRaw || "Asset", href, type };
    if (type === "image") imgs.push(row);
    else files.push(row);
  });
  return { imgs, files };
}

export default function BusinessContact({
  heading = "Contact",
  subheading = "Get in touch with the right team.",
  companyName = "",
  people = [],       // [{id,name,title,email,phone,avatar}]
  social = [],       // [{kind,url,label?}]
  locations = [],    // [{id?,label,address,city,country}]
  collateral = [],   // [{label, href, type: 'image'|'file'}]
  topics = [],       // ["Sales","Partnership",...]
  onSend,
  onMessage,
  onMeet
}) {
  const cards = Array.isArray(people) ? people : [];
  const links = normalizesocial(social);
  const { imgs, files } = normalizeCollateral(collateral);

  const [form, setForm] = React.useState({
    name:"", email:"", company:"", topic: topics[0] || "Sales Inquiry", message:""
  });
  const setVal = (k,v)=> setForm(s=>({ ...s, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { ...form, source:"BusinessContact", ts: Date.now() };
    if (onSend) onSend(payload); else window.alert("Submitted:\n" + JSON.stringify(payload,null,2));
  };

  return (
    <section className="bcontact" style={{ paddingBottom: 24 }}>
      {/* header */}
      <header className="bc-head">
        <div>
          <h3 className="bc-title">{heading}</h3>
          <p className="bc-sub">{subheading}</p>
        </div>
        {companyName ? <div className="bc-company">{companyName}</div> : null}
      </header>

      <div className="bc-grid">
        {/* LEFT: people + locations + links */}
        <aside className="bc-left" style={{ minWidth: 0 }}>
          <div className="card">
            <h4 className="card-title">Talk to a person</h4>
            <div
              className="people"
              style={{
                display: "grid",
                gridTemplateColumns: "1fr",
                gap: 12,
                width: "100%"
              }}
            >
              {cards.length ? cards.map((c)=>(
                <article key={c.id || c.name} className="person" style={{ display: "flex", gap: 12, minWidth: 0 }}>
                  <div className="avatar" aria-hidden="true">
                    {c.avatar
                      ? <span style={{backgroundImage:`url(${imageLink(c.avatar)})`}}/>
                      : <span className="initials">{initialsOf(c.name)}</span>}
                  </div>
                  <div className="p-body" style={{ minWidth: 0, flex: 1 }}>
                    <div className="p-row" style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                      <strong className="p-name" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {c.name || "—"}
                      </strong>
                      {c.title ? <span className="p-role" style={{ flexShrink: 0 }}>{c.title}</span> : null}
                    </div>
                    <div className="p-meta" style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {c.email && <a className="chip" href={`mailto:${c.email}`}><I.mail/>{c.email}</a>}
                      {c.phone && <a className="chip" href={`tel:${c.phone}`}><I.phone/>{c.phone}</a>}
                    </div>
                    <div className="p-actions" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
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
              )) : <div className="bc-muted">No contacts available yet.</div>}
            </div>
          </div>

          <div className="card">
            <h4 className="card-title">Locations &amp; hours</h4>
            <div className="locs">
              {(locations||[]).map(loc=>(
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
            <h4 className="card-title">Links</h4>
            <div className="files" style={{ display: "grid", gap: 8 }}>
              {links.length ? links.map((f, idx)=>(
                <a
                  key={`${f.href}-${idx}`}
                  className="file"
                  href={f.href}
                  target="_blank"
                  rel="noreferrer"
                  style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between" }}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                    <I.link/><span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.label}</span>
                  </span>
                  <I.arrow/>
                </a>
              )) : <div className="bc-muted">No links available.</div>}
            </div>
          </div>
        </aside>

        {/* RIGHT: contact form + collateral */}
        <div className="bc-form" style={{ minWidth: 0 }}>
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
                <select id="bc-topic" className="w-100" value={form.topic} onChange={e=>setVal("topic", e.target.value)}>
                  {(topics && topics.length ? topics : ["Sales Inquiry"]).map(t=> <option key={t} value={t}>{t}</option>)}
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

          {/* Collateral panel */}
          <div className="card" style={{ marginTop: 16 }}>
            <h4 className="card-title">Collateral</h4>

            {/* Image grid */}
            {imgs.length ? (
              <div
                className="asset-grid"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
                  gap: 12,
                  marginTop: 8
                }}
              >
                {imgs.map(img => (
                  <a
                    key={img.id}
                    href={img.href}
                    target="_blank"
                    rel="noreferrer"
                    className="asset"
                    title={img.label}
                    style={{
                      display: "block",
                      borderRadius: 12,
                      overflow: "hidden",
                      boxShadow: "0 1px 3px rgba(0,0,0,.08)",
                      border: "1px solid rgba(0,0,0,.06)"
                    }}
                  >
                    <div
                      className="asset-img"
                      style={{
                        aspectRatio: "4 / 3",
                        width: "100%",
                        backgroundImage: `url(${img.href})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center"
                      }}
                    />
                    <div
                      className="asset-cap"
                      style={{
                        padding: "8px 10px",
                        fontSize: 12,
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis"
                      }}
                    >
                      {img.label}
                    </div>
                  </a>
                ))}
              </div>
            ) : null}

            {/* File list */}
            <div className="files" style={{ marginTop: imgs.length ? 12 : 0, display: "grid", gap: 8 }}>
              {files.length ? files.map(f => (
                <a
                  key={f.id}
                  className="file"
                  href={f.href}
                  target="_blank"
                  rel="noreferrer"
                  style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between" }}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                    <I.file/><span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.label}</span>
                  </span>
                  <I.arrow/>
                </a>
              )) : (!imgs.length ? <div className="bc-muted">No collateral available.</div> : null)}
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
  people: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string, name: PropTypes.string, title: PropTypes.string,
    email: PropTypes.string, phone: PropTypes.string, avatar: PropTypes.string
  })),
  social: PropTypes.arrayOf(PropTypes.shape({
    kind: PropTypes.string, url: PropTypes.string, label: PropTypes.string
  })),
  locations: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string, label: PropTypes.string, address: PropTypes.string, city: PropTypes.string, country: PropTypes.string
  })),
  collateral: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string, label: PropTypes.string, href: PropTypes.string, type: PropTypes.string
  })),
  topics: PropTypes.arrayOf(PropTypes.string),
  onSend: PropTypes.func,
  onMessage: PropTypes.func,
  onMeet: PropTypes.func,
};
