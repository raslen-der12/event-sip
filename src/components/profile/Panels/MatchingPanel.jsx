import React from "react";
import PropTypes from "prop-types";

/* Small UI atoms */
function Row({ label, value }) {
  return (
    <div className="pp-row">
      <div className="pp-label">{label}</div>
      <div className="pp-value">{value ?? <span className="pp-muted">—</span>}</div>
    </div>
  );
}
function Textarea({ id, label, value, onChange, rows = 3, placeholder }) {
  return (
    <div className="pp-row">
      <label className="pp-label" htmlFor={id}>{label}</label>
      <textarea
        id={id}
        className="pp-input"
        rows={rows}
        value={value ?? ""}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
      />
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
function Switch({ label, checked, onChange }) {
  return (
    <div className="pp-row">
      <div className="pp-label">{label}</div>
      <div className="pp-value">
        <label className="pp-switch">
          <input type="checkbox" checked={!!checked} onChange={e=>onChange(e.target.checked)} />
          <span />
        </label>
      </div>
    </div>
  );
}
/* Free-form tag editor */
function TagEditor({ id, label, value = [], onChange, placeholder = "Add and press Enter" }) {
  const [draft, setDraft] = React.useState("");
  const add = () => {
    const t = (draft || "").trim();
    if (!t) return;
    const set = new Set(value);
    set.add(t);
    onChange(Array.from(set));
    setDraft("");
  };
  const remove = (t) => onChange((value || []).filter(x => x !== t));
  return (
    <div className="pp-row">
      <div className="pp-label">{label}</div>
      <div className="pp-value">
        <div className="pp-taglist">
          {(value || []).length
            ? value.map(t => (
                <span key={t} className="pp-tag">
                  {t}
                  <button type="button" className="pp-tag-x" onClick={()=>remove(t)}>×</button>
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
            onKeyDown={e=>{ if(e.key==="Enter"){ e.preventDefault(); add(); } }}
            placeholder={placeholder}
          />
          <button type="button" className="pp-btn -ghost" onClick={add}>Add</button>
        </div>
      </div>
    </div>
  );
}
/* Chip suggestions (multi-select) */
function ChipSelect({ label, value = [], onToggle, suggestions = [] }) {
  const on = new Set(value || []);
  return (
    <div className="pp-row">
      <div className="pp-label">{label}</div>
      <div className="pp-value">
        <div className="pp-chips">
          {suggestions.map(s => {
            const selected = on.has(s);
            return (
              <button
                key={s}
                type="button"
                className={`pp-chip ${selected ? "is-on" : ""}`}
                onClick={()=>onToggle(s)}
              >
                {s}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
/* Date array editor */
function DateList({ label, value = [], onChange }) {
  const add = () => onChange([...(value || []), ""]);
  const set = (i, v) => {
    const arr = [...(value || [])];
    arr[i] = v;
    onChange(arr);
  };
  const del = (i) => {
    const arr = [...(value || [])];
    arr.splice(i,1);
    onChange(arr);
  };
  return (
    <div className="pp-row pp-row-span2">
      <div className="pp-label">{label}</div>
      <div className="pp-value">
        <div className="pp-dategrid">
          {(value || []).length ? value.map((d,i)=>(
            <div key={i} className="pp-daterow">
              <input type="date" className="pp-input" value={d || ""} onChange={e=>set(i, e.target.value)} />
              <button type="button" className="pp-btn -ghost" onClick={()=>del(i)}>Remove</button>
            </div>
          )) : <span className="pp-muted">No dates</span>}
        </div>
        <button type="button" className="pp-btn" onClick={add}>+ Add date</button>
      </div>
    </div>
  );
}

export default function MatchingPanel({ role, actor, loading, onPatch }) {
  const r = (role || "").toLowerCase();
  const isAtt = r === "attendee" || r === "attendee";
  const isExh = r === "exhibitor";
  const isSpk = r === "speaker";

  const A = actor || {};
  // Model slices (null-safe)
  const attMI = isAtt ? (A.matchingIntent || {}) : {};
  const exhCM = isExh ? (A.commercial || {}) : {};
  const spkB2B = isSpk ? (A.b2bIntent || {}) : {};
  // Edit mode
  const [edit, setEdit] = React.useState(false);

  // Initial form per role
  const [form, setForm] = React.useState({});
  React.useEffect(() => {
    if (isAtt) {
      setForm({
        objectives: Array.isArray(attMI.objectives) ? attMI.objectives : [],
        offering: attMI.offering || "",
        needs: attMI.needs || "",
        openToMeetings: !!attMI.openToMeetings,
        availableDays: Array.isArray(attMI.availableDays) ? attMI.availableDays.map(d=> (typeof d === "string" ? d : (d ? new Date(d).toISOString().slice(0,10) : ""))) : [],
      });
    } else if (isExh) {
      setForm({
        offering: exhCM.offering || "",
        lookingFor: exhCM.lookingFor || "",
        lookingPartners: !!exhCM.lookingPartners,
        partnerTypes: Array.isArray(exhCM.partnerTypes) ? exhCM.partnerTypes : [],
        targetSectors: Array.isArray(exhCM.targetSectors) ? exhCM.targetSectors : [],
        regionInterest: Array.isArray(exhCM.regionInterest) ? exhCM.regionInterest : [],
        availableMeetings: !!exhCM.availableMeetings,
        preferredLanguages: Array.isArray(exhCM.preferredLanguages) ? exhCM.preferredLanguages : [],
      });
    } else if (isSpk) {
      setForm({
        openMeetings: !!spkB2B.openMeetings,
        representingBiz: !!spkB2B.representingBiz,
        businessSector: spkB2B.businessSector || "",
        offering: spkB2B.offering || "",
        lookingFor: spkB2B.lookingFor || "",
        regionsInterest: Array.isArray(spkB2B.regionsInterest) ? spkB2B.regionsInterest : [],
        investmentSeeking: !!spkB2B.investmentSeeking,
        investmentRange: typeof spkB2B.investmentRange === "number" ? spkB2B.investmentRange : "",
      });
    } else {
      setForm({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, actor, edit]);

  const set = (k, v) => setForm(s => ({ ...s, [k]: v }));
  const toggleIn = (key, value) => {
    setForm(s => {
      const t = new Set(s[key] || []);
      t.has(value) ? t.delete(value) : t.add(value);
      return { ...s, [key]: Array.from(t) };
    });
  };

  const buildPatch = () => {
    if (isAtt) {
      const days = (form.availableDays || [])
        .map(d => (d || "").trim())
        .filter(Boolean)
        .map(d => new Date(d))
        .filter(d => !Number.isNaN(d.getTime()));
      return { matchingIntent: {
        objectives: form.objectives || [],
        offering: form.offering || "",
        needs: form.needs || "",
        openToMeetings: !!form.openToMeetings,
        availableDays: days,
      }};
    }
    if (isExh) {
      return { commercial: {
        offering: form.offering || "",
        lookingFor: form.lookingFor || "",
        lookingPartners: !!form.lookingPartners,
        partnerTypes: form.partnerTypes || [],
        targetSectors: form.targetSectors || [],
        regionInterest: form.regionInterest || [],
        availableMeetings: !!form.availableMeetings,
        preferredLanguages: form.preferredLanguages || [],
      }};
    }
    if (isSpk) {
      return { b2bIntent: {
        openMeetings: !!form.openMeetings,
        representingBiz: !!form.representingBiz,
        businessSector: form.businessSector || "",
        offering: form.offering || "",
        lookingFor: form.lookingFor || "",
        regionsInterest: form.regionsInterest || [],
        investmentSeeking: !!form.investmentSeeking,
        investmentRange: form.investmentSeeking ? Number(form.investmentRange || 0) : undefined,
      }};
    }
    return {};
  };

  // Suggestions (UI only; can be replaced by forms API later)
  const OBJ_SUG = ["Find buyers","Find suppliers","Partnerships","Investors","Hiring","Media exposure"];
  const PTYPES  = ["Distributor","Reseller","Integrator","R&D","Marketing"];
  const SECTORS = ["AI","SaaS","Health","Agri","Fintech","Energy"];
  const REGIONS = ["MENA","EU","NA","SSA","APAC"];
  const LANGS   = ["en","fr","ar"];

  const disabled = !!loading;
  console.log("MatchingPanel", A);
  console.log("spkB2B.openMeetings", spkB2B);
  return (
    <div className="pp-wrap">
      <section className="pp-section">
        <header className="pp-head">
          <h3 className="pp-title">Matching & Meetings</h3>
          <div className="pp-actions">
            {!edit ? (
              <button className="pp-btn -ghost" type="button" onClick={()=>setEdit(true)} disabled={disabled}>
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
                <button className="pp-btn -ghost" type="button" onClick={()=>setEdit(false)}>
                  Cancel
                </button>
              </>
            )}
          </div>
        </header>

        <div className="pp-card">
          {/* VIEW MODE */}
          {!edit && (
            <>
            <div className="pp-grid">
              {isAtt && (
                <>
                  <Row label="Objectives" value={(attMI.objectives || []).join(", ")} />
                  <Row label="Offering" value={attMI.offering} />
                  <Row label="Needs" value={attMI.needs} />
                  <Row label="Open to meetings" value={attMI.openToMeetings ? "Yes" : "No"} />
                </>
              )}

              {isExh && (
                <>
                  <Row label="Offering" value={exhCM.offering} />
                  <Row label="Looking for" value={exhCM.lookingFor} />
                  <Row label="Looking partners" value={exhCM.lookingPartners ? "Yes":"No"} />
                  <Row label="Partner types" value={(exhCM.partnerTypes || []).join(", ")} />
                  <Row label="Target sectors" value={(exhCM.targetSectors || []).join(", ")} />
                  <Row label="Region interest" value={(exhCM.regionInterest || []).join(", ")} />
                  <Row label="Available for meetings" value={exhCM.availableMeetings ? "Yes":"No"} />
                  <Row label="Preferred languages" value={(exhCM.preferredLanguages || []).join(", ")} />
                </>
              )}

              {isSpk && (
                <>
                  <Row label="Open to meetings" value={spkB2B.openMeetings ? "Yes" : "No"} />
                  <Row label="Representing a business" value={spkB2B.representingBiz ? "Yes" : "No"} />
                  <Row label="Business sector" value={spkB2B.businessSector} />
                  <Row label="Offering" value={spkB2B.offering} />
                  <Row label="Looking for" value={spkB2B.lookingFor} />
                  <Row label="Regions of interest" value={(spkB2B.regionsInterest || []).join(", ")} />
                  <Row label="Seeking investment" value={spkB2B.investmentSeeking ? "Yes" : "No"} />
                  <Row label="Investment range" value={spkB2B.investmentSeeking ? String(spkB2B.investmentRange ?? "—") : "—"} />
                </>
              )}
              </div>
            </>
          )}

          {/* EDIT MODE */}
          {edit && (
            <div className="pp-grid">
              {isAtt && (
                <>
                  <ChipSelect
                    label="Objectives"
                    value={form.objectives}
                    onToggle={(v)=>toggleIn("objectives", v)}
                    suggestions={OBJ_SUG}
                  />
                  <Textarea id="off" label="What are you offering?" value={form.offering} onChange={v=>set("offering", v)} />
                  <Textarea id="need" label="What do you need?" value={form.needs} onChange={v=>set("needs", v)} />
                  <Switch label="Open to meetings" checked={form.openToMeetings} onChange={v=>set("openToMeetings", v)} />
                </>
              )}

              {isExh && (
                <>
                  <Textarea id="off" label="Offering" value={form.offering} onChange={v=>set("offering", v)} />
                  <Textarea id="lf" label="Looking for" value={form.lookingFor} onChange={v=>set("lookingFor", v)} />
                  <Switch label="Looking for partners" checked={form.lookingPartners} onChange={v=>set("lookingPartners", v)} />
                  <TagEditor id="pt" label="Partner types" value={form.partnerTypes} onChange={v=>set("partnerTypes", v)} />
                  <TagEditor id="ts" label="Target sectors" value={form.targetSectors} onChange={v=>set("targetSectors", v)} />
                  <TagEditor id="rg" label="Region interest" value={form.regionInterest} onChange={v=>set("regionInterest", v)} />
                  <Switch label="Available for meetings" checked={form.availableMeetings} onChange={v=>set("availableMeetings", v)} />
                  <ChipSelect
                    label="Preferred languages"
                    value={form.preferredLanguages}
                    onToggle={(v)=>toggleIn("preferredLanguages", v)}
                    suggestions={LANGS}
                  />
                </>
              )}

              {isSpk && (
                <>
                  <Switch label="Open to meetings" checked={form.openMeetings} onChange={v=>set("openMeetings", v)} />
                  <Switch label="Representing a business" checked={form.representingBiz} onChange={v=>set("representingBiz", v)} />
                  <Input id="bs" label="Business sector" value={form.businessSector} onChange={v=>set("businessSector", v)} placeholder="e.g., Fintech" />
                  <Textarea id="off" label="Offering" value={form.offering} onChange={v=>set("offering", v)} />
                  <Textarea id="lf" label="Looking for" value={form.lookingFor} onChange={v=>set("lookingFor", v)} />
                  <TagEditor id="ri" label="Regions of interest" value={form.regionsInterest} onChange={v=>set("regionsInterest", v)} />
                  <Switch label="Seeking investment" checked={form.investmentSeeking} onChange={v=>set("investmentSeeking", v)} />
                  {form.investmentSeeking ? (
                    <Input id="ir" type="number" label="Investment range" value={form.investmentRange} onChange={v=>set("investmentRange", v)} placeholder="e.g., 50000" />
                  ) : null}
                </>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

MatchingPanel.propTypes = {
  role: PropTypes.string.isRequired,
  actor: PropTypes.object,
  loading: PropTypes.bool,
  onPatch: PropTypes.func,
  event: PropTypes.object,
};
