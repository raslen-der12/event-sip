import React from "react";
import "./features.manager.css"
/** feature model: { title (req), subtitle, desc (req), image } */
export default function FeaturesManager({ items = [], onCreate, onUpdate, onDelete }) {
  const [draft, setDraft] = React.useState({ title:"", subtitle:"", desc:"", image:"" });
  const ok = draft.title.trim() && draft.desc.trim();

  return (
    <section className="card soft p-10 featm">
      <div className="featm-head">
        <div className="featm-title">Features</div>
        <div className="muted">Title, subtitle, description & image URL</div>
      </div>

      {/* Create form */}
      <form
        className="featm-new"
        onSubmit={(e)=>{ e.preventDefault(); if(!ok) return; onCreate?.({ ...draft }); setDraft({ title:"", subtitle:"", desc:"", image:"" }); }}
      >
        <div className="featm-cell featm-cell--ntitle">
          <label className="featm-edit">
            <div className="featm-lbl">Title *</div>
            <div className="featm-rowctrl">
              <input className="input" value={draft.title} onChange={(e)=>setDraft({...draft,title:e.target.value})} />
            </div>
          </label>
        </div>

        <div className="featm-cell featm-cell--nsubtitle">
          <label className="featm-edit">
            <div className="featm-lbl">Subtitle</div>
            <div className="featm-rowctrl">
              <input className="input" value={draft.subtitle} onChange={(e)=>setDraft({...draft,subtitle:e.target.value})} />
            </div>
          </label>
        </div>

        <div className="featm-cell featm-cell--nimage">
          <label className="featm-edit">
            <div className="featm-lbl">Image URL</div>
            <div className="featm-rowctrl">
              <input className="input" value={draft.image} onChange={(e)=>setDraft({...draft,image:e.target.value})} />
            </div>
          </label>
        </div>

        <div className="featm-cell featm-cell--ndesc">
          <label className="featm-edit full">
            <div className="featm-lbl">Description *</div>
            <div className="featm-rowctrl">
              <textarea className="input" rows={2} value={draft.desc} onChange={(e)=>setDraft({...draft,desc:e.target.value})} />
            </div>
          </label>
        </div>

        <div className="featm-cell featm-cell--nbtn">
          <button className="btn brand" disabled={!ok}>Add</button>
        </div>
      </form>

      {/* List */}
      <div className="featm-list">
        {items.map((f)=>(
          <article key={f.id||f._id} className="featm-row">
            <div className="featm-cell featm-cell--title">
              <Inline label="Title" value={f.title} onSave={(v)=>onUpdate?.(f.id||f._id,{ title:v })} required />
            </div>

            <div className="featm-cell featm-cell--subtitle">
              <Inline label="Subtitle" value={f.subtitle} onSave={(v)=>onUpdate?.(f.id||f._id,{ subtitle:v })} />
            </div>

            <div className="featm-cell featm-cell--image">
              <Inline label="Image URL" value={f.image} onSave={(v)=>onUpdate?.(f.id||f._id,{ image:v })} />
            </div>

            <div className="featm-cell featm-cell--desc">
              <InlineTextArea label="Description" value={f.desc} onSave={(v)=>onUpdate?.(f.id||f._id,{ desc:v })} required />
            </div>

            <div className="featm-cell featm-cell--actions">
              <div className="featm-actions">
                <button className="btn tiny danger" onClick={()=>onDelete?.(f.id||f._id)}>Delete</button>
              </div>
            </div>
          </article>
        ))}
        {!items.length && <div className="muted">No features.</div>}
      </div>
    </section>
  );
}

/* Reuse the inline editors */
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
