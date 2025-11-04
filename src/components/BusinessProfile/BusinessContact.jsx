import React from "react";
import PropTypes from "prop-types";
import "./business-contact.css";
import imageLink from "../../utils/imageLink";

/* tiny inline icons */
const I = {
  mail: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="3" y="6" width="18" height="12" rx="2" stroke="currentColor"/><path d="M3 7l9 6 9-6" stroke="currentColor"/></svg>),
  phone: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M4 5c0 8 7 15 15 15l2-3-4-3-2 2a12 12 0 0 1-6-6l2-2-3-4L4 5z" stroke="currentColor" strokeWidth="2"/></svg>),
  map: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11Z" stroke="currentColor"/><circle cx="12" cy="10" r="2" stroke="currentColor"/></svg>),
  arrow: () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M7 17 17 7M9 7h8v8" stroke="currentColor" strokeWidth="2"/></svg>),
  link: () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M10 14a5 5 0 0 1 0-7l1-1a5 5 0 0 1 7 7l-1 1M14 10a5 5 0 0 1 0 7l-1 1a5 5 0 0 1-7-7l1-1" stroke="currentColor" strokeWidth="2"/></svg>),
  file: () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12V9l-4-6Z" stroke="currentColor"/><path d="M14 3v6h6" stroke="currentColor"/></svg>),
  chat: () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M21 14a7 7 0 0 1-7 7H6l-4 2 2-4v-5a7 7 0 1 1 17 0Z" stroke="currentColor"/></svg>),
};

function initialsOf(name = "") {
  return (name || "?").split(/\s+/).filter(Boolean).slice(0, 2).map(s => s[0].toUpperCase()).join("");
}

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
      s.label || (k ? (k[0].toUpperCase() + k.slice(1)) : "Link");
    out.push({ label, href });
  }
  return out;
}

function normalizeCollateral(collateral = []) {
  const imgs = [];
  const files = [];
  (Array.isArray(collateral) ? collateral : []).forEach((c, i) => {
    if (!c || !c.href) return;
    const labelRaw = String(c.label || "").trim();
    if (labelRaw.toLowerCase() === "legal") return;
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
  people = [],
  bpContacts = [],
  social = [],
  locations = [],
  collateral = [],
  topics = [],
  onSend,
  onMessage,
  onMeet,
}) {
  const contactRows = React.useMemo(() => {
    const rows = [];
    bpContacts.forEach((c, i) => {
      if (!c?.value) return;
      const kind = String(c.kind || "").toLowerCase();
      const isEmail = kind.includes("email") || kind.includes("mail");
      const isPhone = kind.includes("phone") || kind.includes("tel");

      rows.push({
        id: `${kind}-${i}`,
        label: c.label || (isEmail ? "Email" : isPhone ? "Phone" : kind),
        value: c.value,
        href: isEmail ? `mailto:${c.value}` : isPhone ? `tel:${c.value}` : undefined,
        icon: isEmail ? I.mail : isPhone ? I.phone : I.link,
      });
    });
    return rows;
  }, [bpContacts]);

  const links = normalizesocial(social);
  const { imgs, files } = normalizeCollateral(collateral);
  const [form, setForm] = React.useState({
    name: "", email: "", company: "", topic: topics[0] || "Sales Inquiry", message: ""
  });
  const setVal = (k, v) => setForm(s => ({ ...s, [k]: v }));

  const handleSubmit = e => {
    e.preventDefault();
    const payload = { ...form, source: "BusinessContact", ts: Date.now() };
    if (onSend) onSend(payload);
    else window.alert("Submitted:\n" + JSON.stringify(payload, null, 2));
  };

  return (
    <section className="bcontact" style={{ paddingBottom: 24 }}>
      {/* HEADER */}
      <header className="bc-head">
        <div>
          <h3 className="bc-title">{heading}</h3>
          <p className="bc-sub">{subheading}</p>
        </div>
        {companyName ? <div className="bc-company">{companyName}</div> : null}
      </header>

      <div className="bc-grid">
        {/* LEFT */}
        <aside className="bc-left" style={{ minWidth: 0 }}>
          {/* TALK TO A PERSON */}
          <div className="card">
            <h4 className="card-title">Talk to a person</h4>
            <div className="people" style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12, width: "100%" }}>
              {contactRows.length ? (
                contactRows.map(c => (
                  <article key={c.id} className="person" style={{ display: "flex", gap: 12, minWidth: 0 }}>
                    <div className="p-body" style={{ minWidth: 0, flex: 1 }}>
                      <div className="p-row" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <strong className="p-name">{c.label}</strong>
                      </div>
                      <div className="p-meta" style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {c.href ? (
                          <a className="chip" href={c.href}>
                            <c.icon />{c.value}
                          </a>
                        ) : (
                          <span className="chip"><c.icon />{c.value}</span>
                        )}
                      </div>
                    </div>
                  </article>
                ))
              ) : (
                <div className="bc-muted">No contacts available yet.</div>
              )}
            </div>
          </div>

          {/* LOCATIONS */}
          <div className="card">
            <h4 className="card-title">Locations &amp; hours</h4>
            <div className="locs">
              {(locations || []).map(loc => (
                <div key={loc.id || `${loc.label}-${loc.city}`} className="loc">
                  <span className="badge">{loc.label || "Office"}</span>
                  <div className="addr">
                    <I.map />
                    {[loc.address, loc.city, loc.country].filter(Boolean).join(", ")}
                  </div>
                </div>
              ))}
            </div>
            <div className="hours">
              <span className="h-dot" aria-hidden="true" /> Mon–Fri, 9:00–18:00 (local)
            </div>
          </div>

          {/* LINKS */}
          <div className="card">
            <h4 className="card-title">Links</h4>
            <div className="files" style={{ display: "grid", gap: 8 }}>
              {links.length ? links.map((f, idx) => (
                <a key={`${f.href}-${idx}`} className="file" href={f.href} target="_blank" rel="noreferrer"
                  style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                    <I.link />
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.label}</span>
                  </span>
                  <I.arrow />
                </a>
              )) : <div className="bc-muted">No links available.</div>}
            </div>
          </div>
        </aside>

        {/* RIGHT */}
        <div className="bc-form" style={{ minWidth: 0 }}>
          <form className="form" onSubmit={handleSubmit}>
            <div className="row">
              <div className="field">
                <label htmlFor="bc-name">Full name</label>
                <input id="bc-name" value={form.name} onChange={e => setVal("name", e.target.value)} placeholder="Jane Doe" required />
              </div>
              <div className="field">
                <label htmlFor="bc-email">Work email</label>
                <input id="bc-email" type="email" value={form.email} onChange={e => setVal("email", e.target.value)} placeholder="jane@company.com" required />
              </div>
            </div>
            <div className="row">
              <div className="field">
                <label htmlFor="bc-company">Company</label>
                <input id="bc-company" value={form.company} onChange={e => setVal("company", e.target.value)} placeholder="Company Inc." />
              </div>
              <div className="field">
                <label htmlFor="bc-topic">Topic</label>
                <select id="bc-topic" value={form.topic} onChange={e => setVal("topic", e.target.value)}>
                  {(topics.length ? topics : ["Sales Inquiry"]).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div className="field">
              <label htmlFor="bc-msg">Message</label>
              <textarea id="bc-msg" rows={6} value={form.message} onChange={e => setVal("message", e.target.value)} placeholder="Tell us about your use case…" />
            </div>
            <div className="actions">
              <button type="submit" className="btn-lg">Send message</button>
              <span className="hint">You’ll hear back within 1–2 business days.</span>
            </div>
          </form>

          <div className="card" style={{ marginTop: 16 }}>
            <h4 className="card-title">Collateral</h4>
            {imgs.length ? (
              <div className="asset-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12, marginTop: 8 }}>
                {imgs.map(img => (
                  <a key={img.id} href={img.href} target="_blank" rel="noreferrer" className="asset" title={img.label}
                    style={{ display: "block", borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,.08)", border: "1px solid rgba(0,0,0,.06)" }}>
                    <div className="asset-img" style={{ aspectRatio: "4 / 3", width: "100%", backgroundImage: `url(${img.href})`, backgroundSize: "cover", backgroundPosition: "center" }} />
                    <div className="asset-cap" style={{ padding: "8px 10px", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {img.label}
                    </div>
                  </a>
                ))}
              </div>
            ) : null}
            <div className="files" style={{ marginTop: imgs.length ? 12 : 0, display: "grid", gap: 8 }}>
              {files.length ? files.map(f => (
                <a key={f.id} className="file" href={f.href} target="_blank" rel="noreferrer"
                  style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                    <I.file />
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.label}</span>
                  </span>
                  <I.arrow />
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
  people: PropTypes.array,
  bpContacts: PropTypes.arrayOf(PropTypes.shape({
    kind: PropTypes.string,
    value: PropTypes.string,
    label: PropTypes.string,
  })),
  social: PropTypes.array,
  locations: PropTypes.array,
  collateral: PropTypes.array,
  topics: PropTypes.arrayOf(PropTypes.string),
  onSend: PropTypes.func,
  onMessage: PropTypes.func,
  onMeet: PropTypes.func,
};