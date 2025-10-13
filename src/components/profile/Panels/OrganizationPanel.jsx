import React from "react";
import PropTypes from "prop-types";
import { FiBriefcase, FiExternalLink } from "react-icons/fi";
import { useUpdateProfileMutation } from "../../../features/Actor/toolsApiSlice";

const norm = (r="") => r.toLowerCase()==="attendee" ? "attendee" : r.toLowerCase();

export default function OrganizationPanel({ role, actor, loading }) {
  const r = norm(role);
  const A = actor || {};
  const id = A?._id || A?.id || "";

  const isAtt = r === "attendee";
  const isExh = r === "exhibitor";
  const isSpk = r === "speaker";

  const section = isAtt ? "organization"
                : isExh ? "identity"
                : isSpk ? "organization"
                : "organization";

  const src = A?.[section] || {};
  const [form, setForm] = React.useState({
    orgName:     src.orgName || "",
    orgWebsite:  src.orgWebsite || "",
    businessRole: src.businessRole || "",
    department:  src.department || "",
    decisionMaker: !!src.decisionMaker,
    // exhibitor-only
    exhibitorName: src.exhibitorName || "",
    contactName:   src.contactName || "",
  });

  React.useEffect(()=> {
    const s = A?.[section] || {};
    setForm({
      orgName:     s.orgName || "",
      orgWebsite:  s.orgWebsite || "",
      businessRole: s.businessRole || "",
      department:  s.department || "",
      decisionMaker: !!s.decisionMaker,
      exhibitorName: s.exhibitorName || "",
      contactName:   s.contactName || "",
    });
  }, [A, section]);

  const [edit, setEdit] = React.useState(false);
  const [updateActor, { isLoading: saving, isSuccess, isError, error }] = useUpdateProfileMutation();

  const onSave = async () => {
    if (!id) return;

    if (isExh) {
      // exhibitor identity includes both orgName + exhibitorName/contactName
      const patch = { identity: {
        ...A?.identity,
        orgName: form.orgName || "",
        orgWebsite: form.orgWebsite || "",
        exhibitorName: form.exhibitorName || "",
        contactName: form.contactName || "",
      }};
      try { await updateActor({ role: r, id, patch }).unwrap(); setEdit(false); } catch {}
      return;
    }

    // attendee/speaker organization
    const patch = { organization: {
      ...A?.organization,
      orgName: form.orgName || "",
      orgWebsite: form.orgWebsite || "",
      businessRole: form.businessRole || "",
      department: form.department || "",
      decisionMaker: !!form.decisionMaker,
    }};
    try { await updateActor({ role: r, id, patch }).unwrap(); setEdit(false); } catch {}
  };

  return (
    <div className="pp-section">
      <header className="pp-head">
        <div className="pp-title-row">
          <span className="pp-ico"><FiBriefcase/></span>
          <h3 className="pp-title">{isExh ? "Exhibitor identity" : "Organization & Role"}</h3>
        </div>
        <p className="pp-sub">{isExh ? "Booth identity and organization basics." : "Who you represent and your role."}</p>
      </header>

      {isSuccess ? <div className="pp-alert -ok">Saved.</div> : null}
      {isError ? <div className="pp-alert -error">{error?.data?.message || error?.error || "Update failed"}</div> : null}

      <div className="pf-grid">
        {isExh ? (
          <>
            <div className="pf-field">
              <label className="pf-label">Exhibitor / Team name</label>
              <input className="pf-input" disabled={!edit || loading || saving}
                value={form.exhibitorName}
                onChange={(e)=>setForm(s=>({ ...s, exhibitorName:e.target.value }))}/>
            </div>
            <div className="pf-field">
              <label className="pf-label">Contact name</label>
              <input className="pf-input" disabled={!edit || loading || saving}
                value={form.contactName}
                onChange={(e)=>setForm(s=>({ ...s, contactName:e.target.value }))}/>
            </div>
          </>
        ) : null}

        <div className="pf-field">
          <label className="pf-label">Organization name</label>
          <input className="pf-input" disabled={!edit || loading || saving}
            value={form.orgName}
            onChange={(e)=>setForm(s=>({ ...s, orgName:e.target.value }))}/>
        </div>

        <div className="pf-field">
          <label className="pf-label">Organization website</label>
          <input className="pf-input" disabled={!edit || loading || saving}
            value={form.orgWebsite}
            onChange={(e)=>setForm(s=>({ ...s, orgWebsite:e.target.value }))}/>
          <div className="pf-hint"><FiExternalLink/> http/https</div>
        </div>

        {!isExh && (
          <>
            <div className="pf-field">
              <label className="pf-label">Business role / Title</label>
              <input className="pf-input" disabled={!edit || loading || saving}
                value={form.businessRole}
                onChange={(e)=>setForm(s=>({ ...s, businessRole:e.target.value }))}/>
            </div>

            <div className="pf-field">
              <label className="pf-label">Department</label>
              <input className="pf-input" disabled={!edit || loading || saving}
                value={form.department}
                onChange={(e)=>setForm(s=>({ ...s, department:e.target.value }))}/>
            </div>

            <div className="pf-field">
              <label className="pf-label">Decision maker</label>
              <select className="pf-select" disabled={!edit || loading || saving}
                value={form.decisionMaker ? "yes" : "no"}
                onChange={(e)=>setForm(s=>({ ...s, decisionMaker: e.target.value === "yes" }))}>
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </div>
          </>
        )}
      </div>

      <div className="pf-actions">
        {!edit ? (
          <button className="pf-btn -outline" onClick={()=>setEdit(true)} disabled={saving || loading}>Edit</button>
        ) : (
          <>
            <button className="pf-btn" onClick={onSave} disabled={saving || loading}>Save changes</button>
            <button className="pf-btn -outline" onClick={()=>setEdit(false)} disabled={saving}>Cancel</button>
          </>
        )}
      </div>
    </div>
  );
}

OrganizationPanel.propTypes = {
  role: PropTypes.string.isRequired,
  actor: PropTypes.object,
  loading: PropTypes.bool,
};
