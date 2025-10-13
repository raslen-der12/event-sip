import React from "react";
import PropTypes from "prop-types";

/**
 * BusinessPanel
 *  attendee: businessProfile (primaryIndustry, subIndustry, businessModel, companySize, exportReady)
 *  Exhibitor: business (industry, subIndustry, businessModel[B2B|B2C|Both], productTags[], techLevel, exportMarkets[])
 *  Speaker: organization (orgName, orgWebsite, jobTitle, businessRole)
 *
 * Null-safe and edit-per-section (only one toggle group here for simplicity).
 */

function Row({ label, value }) {
  return (
    <div className="pp-row">
      <div className="pp-label">{label}</div>
      <div className="pp-value">{value || <span className="pp-muted">—</span>}</div>
    </div>
  );
}

function Input({ id, label, value, onChange, type="text", placeholder }) {
  return (
    <div className="pp-row">
      <label className="pp-label" htmlFor={id}>{label}</label>
      <input
        id={id}
        className="pp-input"
        type={type}
        value={value ?? ""}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

function Select({ id, label, value, onChange, options = [] }) {
  return (
    <div className="pp-row">
      <label className="pp-label" htmlFor={id}>{label}</label>
      <select
        id={id}
        className="pp-input"
        value={value ?? ""}
        onChange={e => onChange(e.target.value)}
      >
        <option value="">Select…</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

/* A tiny tag editor for arrays (productTags, exportMarkets) */
function TagEditor({ id, label, value = [], onChange, placeholder = "Add and press Enter" }) {
  const [draft, setDraft] = React.useState("");
  const add = () => {
    const t = draft.trim();
    if (!t) return;
    const set = new Set(value);
    set.add(t);
    onChange(Array.from(set));
    setDraft("");
  };
  const remove = (t) => {
    const next = (value || []).filter(x => x !== t);
    onChange(next);
  };
  return (
    <div className="pp-row">
      <div className="pp-label">{label}</div>
      <div className="pp-value">
        <div className="pp-taglist">
          {(value || []).length
            ? value.map(t => (
                <span key={t} className="pp-tag">
                  {t}
                  <button type="button" className="pp-tag-x" onClick={() => remove(t)}>×</button>
                </span>
              ))
            : <span className="pp-muted">No items</span>}
        </div>
        <div className="pp-taginput">
          <input
            id={id}
            className="pp-input"
            value={draft}
            onChange={e=>setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
            placeholder={placeholder}
          />
          <button type="button" className="pp-btn -ghost" onClick={add}>Add</button>
        </div>
      </div>
    </div>
  );
}

export default function BusinessPanel({ role, actor, loading, onPatch }) {
  const r = (role || "").toLowerCase();
  const isAtt = r === "attendee" || r === "attendee";
  const isExh = r === "exhibitor";
  const isSpk = r === "speaker";

  const A = actor || {};
  const bp  = isAtt ? (A.businessProfile || {}) : {};
  const biz = isExh ? (A.business || {}) : {};
  const org = isSpk ? (A.organization || {}) : {};

  const [edit, setEdit] = React.useState(false);

  // form state (role-aware)
  const [form, setForm] = React.useState({});
  React.useEffect(() => {
    if (isAtt) {
      setForm({
        primaryIndustry: bp.primaryIndustry || "",
        subIndustry: bp.subIndustry || "",
        businessModel: bp.businessModel || "",
        companySize: bp.companySize || "",
        exportReady: !!bp.exportReady,
      });
    } else if (isExh) {
      setForm({
        industry: biz.industry || "",
        subIndustry: biz.subIndustry || "",
        businessModel: biz.businessModel || "",
        productTags: Array.isArray(biz.productTags) ? biz.productTags : [],
        techLevel: biz.techLevel || "",
        exportMarkets: Array.isArray(biz.exportMarkets) ? biz.exportMarkets : [],
      });
    } else if (isSpk) {
      setForm({
        orgName: org.orgName || "",
        orgWebsite: org.orgWebsite || "",
        jobTitle: org.jobTitle || "",
        businessRole: org.businessRole || "",
      });
    } else {
      setForm({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, actor, edit]);

  const set = (k, v) => setForm(s => ({ ...s, [k]: v }));

  function buildPatch() {
    if (isAtt) {
      return { businessProfile: {
        primaryIndustry: form.primaryIndustry || "",
        subIndustry: form.subIndustry || "",
        businessModel: form.businessModel || "",
        companySize: form.companySize || "",
        exportReady: !!form.exportReady,
      }};
    }
    if (isExh) {
      return { business: {
        industry: form.industry || "",
        subIndustry: form.subIndustry || "",
        businessModel: form.businessModel || "",
        productTags: form.productTags || [],
        techLevel: form.techLevel || "",
        exportMarkets: form.exportMarkets || [],
      }};
    }
    if (isSpk) {
      return { organization: {
        orgName: form.orgName || "",
        orgWebsite: form.orgWebsite || "",
        jobTitle: form.jobTitle || "",
        businessRole: form.businessRole || "",
      }};
    }
    return {};
  }

  const disabled = !!loading;

  // Select options (static here; you can later hydrate from forms API if needed)
  const attendee_MODELS = ["B2B", "B2C", "B2G"];
  const EXHIBITOR_MODELS = ["B2B", "B2C", "Both"];
  const SIZES = ["Startup","SME","Mid-market","Enterprise"];
  const TECH = ["Low-tech","High-tech","Deep-tech"];

  return (
    <div className="pp-wrap">
      <section className="pp-section">
        <header className="pp-head">
          <h3 className="pp-title">Business & Market</h3>
          <div className="pp-actions">
            {!edit ? (
              <button className="pp-btn -ghost" type="button" onClick={() => setEdit(true)} disabled={disabled}>
                ✏️ Edit
              </button>
            ) : (
              <>
                <button
                  className="pp-btn"
                  type="button"
                  disabled={disabled}
                  onClick={async ()=>{
                    try {
                      await onPatch?.(buildPatch());
                      setEdit(false);
                    } catch(_){}
                  }}
                >
                  Save
                </button>
                <button className="pp-btn -ghost" type="button" onClick={() => setEdit(false)}>
                  Cancel
                </button>
              </>
            )}
          </div>
        </header>

        <div className="pp-card">
          {!edit && (
            <>
            <div className="pp-grid">
              {isAtt && (
                <>
                  <Row label="Primary industry" value={bp.primaryIndustry} />
                  <Row label="Sub-industry" value={bp.subIndustry} />
                  <Row label="Business model" value={bp.businessModel} />
                  <Row label="Company size" value={bp.companySize} />
                  <Row label="Export-ready" value={bp.exportReady ? "Yes" : "No"} />
                </>
              )}

              {isExh && (
                <>
                  <Row label="Industry" value={biz.industry} />
                  <Row label="Sub-industry" value={biz.subIndustry} />
                  <Row label="Business model" value={biz.businessModel} />
                  <Row label="Product tags" value={(biz.productTags || []).join(", ")} />
                  <Row label="Tech level" value={biz.techLevel} />
                  <Row label="Export markets" value={(biz.exportMarkets || []).join(", ")} />
                </>
              )}

              {isSpk && (
                <>
                  <Row label="Organization" value={org.orgName} />
                  <Row label="Website" value={org.orgWebsite} />
                  <Row label="Job title" value={org.jobTitle} />
                  <Row label="Business role" value={org.businessRole} />
                </>
              )}
              </div>
            </>
          )}

          {edit && (
            <div className="pp-grid">
              {isAtt && (
                <>
                  <Input id="pi" label="Primary industry" value={form.primaryIndustry} onChange={v=>set("primaryIndustry", v)} />
                  <Input id="si" label="Sub-industry" value={form.subIndustry} onChange={v=>set("subIndustry", v)} />
                  <Select id="bm" label="Business model" value={form.businessModel} onChange={v=>set("businessModel", v)} options={attendee_MODELS} />
                  <Select id="cs" label="Company size" value={form.companySize} onChange={v=>set("companySize", v)} options={SIZES} />
                  <div className="pp-row">
                    <div className="pp-label">Export-ready</div>
                    <div className="pp-value">
                      <label className="switch">
                        <input type="checkbox" checked={!!form.exportReady} onChange={e=>set("exportReady", e.target.checked)} />
                        <span>Yes</span>
                      </label>
                    </div>
                  </div>
                </>
              )}

              {isExh && (
                <>
                  <Input id="ind" label="Industry" value={form.industry} onChange={v=>set("industry", v)} />
                  <Input id="sub" label="Sub-industry" value={form.subIndustry} onChange={v=>set("subIndustry", v)} />
                  <Select id="bm" label="Business model" value={form.businessModel} onChange={v=>set("businessModel", v)} options={EXHIBITOR_MODELS} />
                  <Select id="tech" label="Tech level" value={form.techLevel} onChange={v=>set("techLevel", v)} options={TECH} />
                  <TagEditor id="pt" label="Product tags" value={form.productTags} onChange={v=>set("productTags", v)} />
                  <TagEditor id="mk" label="Export markets" value={form.exportMarkets} onChange={v=>set("exportMarkets", v)} />
                </>
              )}

              {isSpk && (
                <>
                  <Input id="on" label="Organization" value={form.orgName} onChange={v=>set("orgName", v)} />
                  <Input id="ws" label="Website" value={form.orgWebsite} onChange={v=>set("orgWebsite", v)} type="url" placeholder="https://..." />
                  <Input id="jt" label="Job title" value={form.jobTitle} onChange={v=>set("jobTitle", v)} />
                  <Input id="br" label="Business role" value={form.businessRole} onChange={v=>set("businessRole", v)} />
                </>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

BusinessPanel.propTypes = {
  role: PropTypes.string.isRequired,
  actor: PropTypes.object,
  loading: PropTypes.bool,
  onPatch: PropTypes.func,
  event: PropTypes.object,
};
