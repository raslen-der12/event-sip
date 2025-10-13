import React from "react";
import "./impacts.manager.css"
/** impact model: { title (req), description (req) } */
export default function ImpactManager({ items = [], onCreate, onUpdate, onDelete }) {
  const [draft, setDraft] = React.useState({ title:"", description:"" });
  const ok = draft.title.trim() && draft.description.trim();

  return (
    <section className="card soft p-10">
      <div className="featm-head"><div className="featm-title">Impact</div><div className="muted">Tell outcomes, metrics, etc.</div></div>

      <form className="featm-new" onSubmit={(e)=>{ e.preventDefault(); if(!ok) return; onCreate?.({ ...draft }); setDraft({ title:"", description:"" }); }}>
        <input className="input" placeholder="Title *" value={draft.title} onChange={(e)=>setDraft({...draft,title:e.target.value})} />
        <textarea className="input" rows={2} placeholder="Description *" value={draft.description} onChange={(e)=>setDraft({...draft,description:e.target.value})} />
        <button className="btn brand" disabled={!ok}>Add</button>
      </form>

      <div className="featm-list">
        {items.map((it)=>(
          <article key={it.id||it._id} className="featm-row">
            <Inline label="Title" value={it.title} onSave={(v)=>onUpdate?.(it.id||it._id,{ title:v })} required />
            <InlineTextArea label="Description" value={it.description} onSave={(v)=>onUpdate?.(it.id||it._id,{ description:v })} required />
            <div className="featm-actions"><button className="btn tiny danger" onClick={()=>onDelete?.(it.id||it._id)}>Delete</button></div>
          </article>
        ))}
        {!items.length && <div className="muted">No impact records.</div>}
      </div>
    </section>
  );
}

function Inline({ label, value, onSave, required }) {
  const [v, setV] = React.useState(value || "");
  React.useEffect(()=>setV(value || ""), [value]);
  return (
    <label className="featm-edit">
      <div className="featm-lbl">{label}{required?" *":""}</div>
      <div className="featm-rowctrl">
        <input className="input" value={v} onChange={(e)=>setV(e.target.value)} />
        <button className="btn tiny" disabled={required && !v.trim()} onClick={()=>onSave?.(v)}>Save</button>
      </div>
    </label>
  );
}
function InlineTextArea({ label, value, onSave, required }) {
  const [v, setV] = React.useState(value || "");
  React.useEffect(()=>setV(value || ""), [value]);
  return (
    <label className="featm-edit full">
      <div className="featm-lbl">{label}{required?" *":""}</div>
      <div className="featm-rowctrl">
        <textarea className="input" rows={2} value={v} onChange={(e)=>setV(e.target.value)} />
        <button className="btn tiny" disabled={required && !v.trim()} onClick={()=>onSave?.(v)}>Save</button>
      </div>
    </label>
  );
}
