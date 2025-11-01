// src/components/profile/panels/IdentityPanel.jsx
import React from "react";
import PropTypes from "prop-types";

function TextRow({ label, value, extra }) {
  return (
    <div className="pp-row">
      <div className="pp-label">{label}</div>
      <div className="pp-value">
        {value ? value : <span className="pp-muted">—</span>}
        {extra ? <span style={{ marginLeft: 8 }}>{extra}</span> : null}
      </div>
    </div>
  );
}

function LinkRow({ label, href }) {
  const url = normalizeUrl(href);
  return (
    <div className="pp-row">
      <div className="pp-label">{label}</div>
      <div className="pp-value">
        {url ? (
          <a className="pp-link" href={url} target="_blank" rel="noreferrer">
            {prettyUrl(url)}
          </a>
        ) : (
          <span className="pp-muted">—</span>
        )}
      </div>
    </div>
  );
}

function InputRow({ id, label, type = "text", value, onChange, placeholder, disabled=false }) {
  return (
    <div className="pp-row">
      <label className="pp-label" htmlFor={id}>{label}</label>
      <input
        id={id}
        className="pp-input"
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
      />
    </div>
  );
}

function UrlRow(props) { return <InputRow {...props} type="url" placeholder="https://…" />; }

/* helpers */
function normalizeUrl(u = "") {
  const t = String(u || "").trim();
  if (!t) return "";
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t}`;
}
function prettyUrl(u = "") {
  try { const x = new URL(u); return `${x.hostname}${x.pathname.replace(/\/$/, "")}`; }
  catch { return u; }
}
const safeStr = (v) => (typeof v === "string" ? v.trim() : v ?? "");

function prune(obj) {
  if (!obj || typeof obj !== "object") return obj;
  const out = Array.isArray(obj) ? [] : {};
  Object.entries(obj).forEach(([k, v]) => {
    if (v && typeof v === "object") {
      const pv = prune(v);
      if (pv && ((Array.isArray(pv) && pv.length) || (!Array.isArray(pv) && Object.keys(pv).length))) out[k] = pv;
    } else if (v !== "" && v !== undefined && v !== null) {
      out[k] = v;
    }
  });
  return out;
}
function diffPatch(current, desired) {
  const patch = {};
  Object.keys(desired).forEach((k) => {
    const cur = current?.[k];
    const nxt = desired[k];
    if (nxt && typeof nxt === "object" && !Array.isArray(nxt)) {
      const sub = diffPatch(cur || {}, nxt);
      if (sub && Object.keys(sub).length) patch[k] = sub;
    } else {
      const same = (cur ?? "") === (nxt ?? "");
      if (!same && nxt !== "" && nxt !== undefined && nxt !== null) patch[k] = nxt;
    }
  });
  return patch;
}

export default function IdentityPanel({ role, actor, loading, onPatch }) {
  const r = String(role || "").toLowerCase();
  const isAtt = r === "attendee";
  const isExh = r === "exhibitor";
  const isSpk = r === "speaker";

  // Safe paths
  const A         = actor || {};
  const personal  = (isAtt || isSpk) ? (A.personal || {}) : {};
  const org       = (isAtt || isSpk) ? (A.organization || {}) : {};
  const identity  = isExh ? (A.identity || {}) : {};
  const links     = A.links || {};
  const enrich    = isSpk ? (A.enrichments || {}) : {};

  // Canonical email (non-editable), and firstEmail snapshot (non-editable)
  console.log(A);
  const accountEmail = safeStr(A.personal?.email);
  const firstEmail   = safeStr(A.personal?.firstEmail);

  // Non-editable country (comes from role-specific object)
  const countryCode = safeStr(
    (isExh ? identity.country : personal.country) || ""
  ).toUpperCase();
  const allowedCountries = ["TN", "FR"];
  const countryBadge =
    countryCode && !allowedCountries.includes(countryCode)
      ? <span className="ps-badge -warn">Not TN/FR</span>
      : null;

  // Edit toggles
  const [editPub, setEditPub]   = React.useState(false);
  const [editPriv, setEditPriv] = React.useState(false);

  // Form states (no email/country here—they’re locked)
  const [pub, setPub]   = React.useState({});
  const [priv, setPriv] = React.useState({});

  // Current snapshots for diff
  const currentPublic = React.useMemo(() => {
    if (isAtt) {
      return {
        personal: { fullName: safeStr(personal.fullName), /* country locked */ city: safeStr(personal.city) },
        organization: { orgName: safeStr(org.orgName), businessRole: safeStr(org.businessRole) },
        links: { website: safeStr(links.website), linkedin: safeStr(links.linkedin) },
      };
    }
    if (isExh) {
      return {
        identity: { exhibitorName: safeStr(identity.exhibitorName), orgName: safeStr(identity.orgName), /* country locked */ city: safeStr(identity.city) },
        links: { website: safeStr(links.website), linkedin: safeStr(links.linkedin) },
      };
    }
    if (isSpk) {
      return {
        personal: { fullName: safeStr(personal.fullName), /* country locked */ city: safeStr(personal.city) },
        organization: { orgName: safeStr(org.orgName), jobTitle: safeStr(org.jobTitle) },
        links: { website: safeStr(links.website), linkedin: safeStr(links.linkedin) },
      };
    }
    return {};
  }, [isAtt, isExh, isSpk, personal, org, identity, links]);

  const currentPrivate = React.useMemo(() => {
    if (isExh) return { identity: { contactName: safeStr(identity.contactName), /* email locked */ phone: safeStr(identity.phone) } };
    return { personal: { /* email locked */ phone: safeStr(personal.phone) } };
  }, [isExh, identity, personal]);

  // Seed forms
  React.useEffect(() => {
    if (isAtt) {
      setPub({
        fullName: personal.fullName || "",
        orgName:  org.orgName || "",
        businessRole: org.businessRole || "",
        // country locked
        city: personal.city || "",
        website: links.website || "",
        linkedin: links.linkedin || "",
      });
      setPriv({
        // email locked
        phone: personal.phone || "",
      });
    } else if (isExh) {
      setPub({
        exhibitorName: identity.exhibitorName || "",
        orgName: identity.orgName || "",
        // country locked
        city: identity.city || "",
        website: links.website || "",
        linkedin: links.linkedin || "",
      });
      setPriv({
        contactName: identity.contactName || "",
        // email locked
        phone: identity.phone || "",
      });
    } else if (isSpk) {
      setPub({
        fullName: personal.fullName || "",
        orgName:  org.orgName || "",
        jobTitle: org.jobTitle || "",
        // country locked
        city: personal.city || "",
        website: links.website || "",
        linkedin: links.linkedin || "",
      });
      setPriv({
        // email locked
        phone: personal.phone || "",
      });
    } else {
      setPub({});
      setPriv({});
    }
  }, [role, actor, editPub, editPriv]); // keep in sync

  // Build patches (diff-only, no country/email)
  function buildPublicPatch() {
    let desired;
    if (isAtt) {
      desired = {
        personal: { fullName: safeStr(pub.fullName), city: safeStr(pub.city) },
        organization: { orgName: safeStr(pub.orgName), businessRole: safeStr(pub.businessRole) },
        links: { website: normalizeUrl(pub.website), linkedin: normalizeUrl(pub.linkedin) },
      };
    } else if (isExh) {
      desired = {
        identity: { exhibitorName: safeStr(pub.exhibitorName), orgName: safeStr(pub.orgName), city: safeStr(pub.city) },
        links: { website: normalizeUrl(pub.website), linkedin: normalizeUrl(pub.linkedin) },
      };
    } else if (isSpk) {
      desired = {
        personal: { fullName: safeStr(pub.fullName), city: safeStr(pub.city) },
        organization: { orgName: safeStr(pub.orgName), jobTitle: safeStr(pub.jobTitle) },
        links: { website: normalizeUrl(pub.website), linkedin: normalizeUrl(pub.linkedin) },
      };
    } else desired = {};
    return prune(diffPatch(currentPublic, desired));
  }
  function buildPrivatePatch() {
    let desired;
    if (isExh) desired = { identity: { contactName: safeStr(priv.contactName), phone: safeStr(priv.phone) } };
    else desired = { personal: { phone: safeStr(priv.phone) } };
    return prune(diffPatch(currentPrivate, desired));
  }

  const disabled = !!loading;

  return (
    <div className="pp-wrap">
      {/* Visible (public) */}
      <section className="pp-section">
        <header className="pp-head">
          <h3 className="pp-title">Visible information</h3>
          <div className="pp-actions">
            {!editPub ? (
              <button className="pp-btn -ghost" type="button" onClick={() => setEditPub(true)} disabled={disabled}>✏️ Edit</button>
            ) : (
              <>
                <button className="pp-btn" type="button" onClick={async () => {
                  try { const patch = buildPublicPatch(); if (Object.keys(patch).length) await onPatch?.(patch); setEditPub(false); } catch {}
                }} disabled={disabled}>Save</button>
                <button className="pp-btn -ghost" type="button" onClick={() => setEditPub(false)}>Cancel</button>
              </>
            )}
          </div>
        </header>

        <div className="pp-card">
          {!editPub && (
            <div className="pp-grid">
              {isAtt && (
                <>
                  <TextRow label="Full name" value={personal.fullName} />
                  <TextRow label="Organization" value={org.orgName} />
                  <TextRow label="Role / Title" value={org.jobTitle} />
                  <TextRow label="Country" value={countryCode} extra={countryBadge} />
                  <TextRow label="City" value={personal.city} />
   
                </>
              )}
              {isExh && (
                <>
                  <TextRow label="Exhibitor name" value={identity.exhibitorName} />
                  <TextRow label="Organization" value={identity.orgName} />
                  <TextRow label="Country" value={countryCode} extra={countryBadge} />
                  <TextRow label="City" value={identity.city} />
                  <LinkRow label="Website" href={links.website} />
                  <LinkRow label="LinkedIn" href={links.linkedin} />
                </>
              )}
              {isSpk && (
                <>
                  <TextRow label="Full name" value={personal.fullName} />
                  <TextRow label="Organization" value={org.orgName} />
                  <TextRow label="Job title" value={org.jobTitle} />
                  <TextRow label="Country" value={countryCode} extra={countryBadge} />
                  <TextRow label="City" value={personal.city} />
                  <LinkRow label="Website" href={links.website} />
                  <LinkRow label="LinkedIn" href={links.linkedin} />
                </>
              )}
            </div>
          )}

          {editPub && (
            <div className="pp-grid">
              {isAtt && (
                <>
                  <InputRow id="fn" label="Full name" value={pub.fullName} onChange={(v) => setPub((s) => ({ ...s, fullName: v }))} />
                  <InputRow id="on" label="Organization" value={pub.orgName} onChange={(v) => setPub((s) => ({ ...s, orgName: v }))} />
                  <InputRow id="br" label="Role / Title" value={pub.businessRole} onChange={(v) => setPub((s) => ({ ...s, businessRole: v }))} />
                  {/* Country locked */}
                  <TextRow label="Country" value={countryCode} extra={countryBadge} />
                  <InputRow id="ci" label="City" value={pub.city} onChange={(v) => setPub((s) => ({ ...s, city: v }))} />
                  <UrlRow id="ws" label="Website" value={pub.website} onChange={(v) => setPub((s) => ({ ...s, website: v }))} />
                  <UrlRow id="li" label="LinkedIn" value={pub.linkedin} onChange={(v) => setPub((s) => ({ ...s, linkedin: v }))} />
                </>
              )}
              {isExh && (
                <>
                  <InputRow id="exh" label="Exhibitor name" value={pub.exhibitorName} onChange={(v) => setPub((s) => ({ ...s, exhibitorName: v }))} />
                  <InputRow id="on" label="Organization" value={pub.orgName} onChange={(v) => setPub((s) => ({ ...s, orgName: v }))} />
                  {/* Country locked */}
                  <TextRow label="Country" value={countryCode} extra={countryBadge} />
                  <InputRow id="ci" label="City" value={pub.city} onChange={(v) => setPub((s) => ({ ...s, city: v }))} />
                  <UrlRow id="ws" label="Website" value={pub.website} onChange={(v) => setPub((s) => ({ ...s, website: v }))} />
                  <UrlRow id="li" label="LinkedIn" value={pub.linkedin} onChange={(v) => setPub((s) => ({ ...s, linkedin: v }))} />
                </>
              )}
              {isSpk && (
                <>
                  <InputRow id="fn" label="Full name" value={pub.fullName} onChange={(v) => setPub((s) => ({ ...s, fullName: v }))} />
                  <InputRow id="on" label="Organization" value={pub.orgName} onChange={(v) => setPub((s) => ({ ...s, orgName: v }))} />
                  <InputRow id="jt" label="Job title" value={pub.jobTitle} onChange={(v) => setPub((s) => ({ ...s, jobTitle: v }))} />
                  {/* Country locked */}
                  <TextRow label="Country" value={countryCode} extra={countryBadge} />
                  <InputRow id="ci" label="City" value={pub.city} onChange={(v) => setPub((s) => ({ ...s, city: v }))} />
                  <UrlRow id="ws" label="Website" value={pub.website} onChange={(v) => setPub((s) => ({ ...s, website: v }))} />
                  <UrlRow id="li" label="LinkedIn" value={pub.linkedin} onChange={(v) => setPub((s) => ({ ...s, linkedin: v }))} />
                </>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Private (contact) */}
      <section className="pp-section">
        <header className="pp-head">
          <h3 className="pp-title">Private information</h3>
          <div className="pp-actions">
            {!editPriv ? (
              <button className="pp-btn -ghost" type="button" onClick={() => setEditPriv(true)} disabled={disabled}>✏️ Edit</button>
            ) : (
              <>
                <button className="pp-btn" type="button" onClick={async () => {
                  try { const patch = buildPrivatePatch(); if (Object.keys(patch).length) await onPatch?.(patch); setEditPriv(false); } catch {}
                }} disabled={disabled}>Save</button>
                <button className="pp-btn -ghost" type="button" onClick={() => setEditPriv(false)}>Cancel</button>
              </>
            )}
          </div>
        </header>

        <div className="pp-card">
          {/* Always show non-editable canonical emails */}
          <div className="pp-grid">
            <TextRow label="Account email" value={accountEmail} />
            {firstEmail ? <TextRow label="Registration email" value={firstEmail} /> : null}
          </div>

          {!editPriv && (
            <div className="pp-grid">
              {isExh ? (
                <>
                  <TextRow label="Contact name" value={identity.contactName} />
                  <TextRow label="Phone" value={identity.phone} />
                </>
              ) : (
                <TextRow label="Phone" value={personal.phone} />
              )}
            </div>
          )}

          {editPriv && (
            <div className="pp-grid">
              {isExh ? (
                <>
                  <InputRow id="cn" label="Contact name" value={priv.contactName} onChange={(v) => setPriv((s) => ({ ...s, contactName: v }))} />
                  {/* Email locked */}
                  <InputRow id="ph" label="Phone" value={priv.phone} onChange={(v) => setPriv((s) => ({ ...s, phone: v }))} />
                </>
              ) : (
                <>
                  {/* Email locked */}
                  <InputRow id="ph" label="Phone" value={priv.phone} onChange={(v) => setPriv((s) => ({ ...s, phone: v }))} />
                </>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Speaker presentation */}
      {isSpk && enrich?.slidesFile ? (
        <section className="pp-section">
          <header className="pp-head"><h3 className="pp-title">Presentation</h3></header>
          <div className="pp-card">
            <a className="pp-link" href={enrich.slidesFile} target="_blank" rel="noreferrer">View uploaded slides</a>
          </div>
        </section>
      ) : null}
    </div>
  );
}

IdentityPanel.propTypes = {
  role: PropTypes.string.isRequired,
  actor: PropTypes.object,
  loading: PropTypes.bool,
  onPatch: PropTypes.func,
  event: PropTypes.object,
};
