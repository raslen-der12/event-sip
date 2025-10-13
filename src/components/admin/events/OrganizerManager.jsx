import React from "react";
import { openCropper, CropPortal } from "./_tinyCropper";
import "./organizer.manager.css";

/** organizer model: { logo (required), link, type: 'host'|'co-host'|'sponsor'|'partner'|'media' } */
const TYPES = ["host","co-host","sponsor","partner","media"];

export default function OrganizerManager({ items = [], onCreate, onUpdate, onDelete, onReorder, onUploadLogo }) {
  const [draft, setDraft] = React.useState({ link:"", type:"host", file:null });
  const [dragId, setDragId] = React.useState(null);
  const [order, setOrder] = React.useState(items.map(x=>x.id||x._id));
  React.useEffect(()=> setOrder(items.map(x=>x.id||x._id)), [items]);

  const rearrange = (list, aId, bId) => { const a=list.indexOf(aId), b=list.indexOf(bId); if(a<0||b<0) return list; const cp=list.slice(); const [m]=cp.splice(a,1); cp.splice(b,0,m); return cp; };

  const submit = async (e) => {
    e.preventDefault();
    if (!draft.file) return;
    await onCreate?.({ logo: draft.file, link: draft.link || null, type: draft.type });
    setDraft({ link:"", type:"host", file:null });
  };

  const onDragStart=(id)=> setDragId(id);
  const onDragOver =(e,over)=>{ e.preventDefault(); if(dragId===over) return; setOrder(prev=>rearrange(prev,dragId,over)); };
  const onDragEnd  = async ()=>{ setDragId(null); await onReorder?.(order.map((id,i)=>({ id, order:i }))); };

  return (
    <section className="card soft p-10 orgm">
      <div className="orgm-head"><div className="orgm-title">Organizers</div><div className="muted">Logo, link & type</div></div>

      <form className="orgm-new" onSubmit={submit}>
        <label className="btn">
          <input hidden type="file" accept="image/*" onChange={(e)=> e.target.files?.[0] && openCropper(e.target.files[0], (blob)=> {
   const name = e.target.files?.[0]?.name || 'logo.png'
  const f = (typeof File !== 'undefined')
    ? new File([blob], name, { type: blob.type || 'image/png' })
     : blob;
   setDraft(d => ({ ...d, file: f }))
 })} />
          Upload logo *
        </label>
        <input className="input" placeholder="Link (optional)" value={draft.link} onChange={(e)=>setDraft({...draft, link:e.target.value})} />
        <select className="input select" value={draft.type} onChange={(e)=>setDraft({...draft, type:e.target.value})}>{TYPES.map(t=><option key={t}>{t}</option>)}</select>
        <button className="btn brand" disabled={!draft.file}>Add organizer</button>
      </form>

      <div className="orgm-list">
        {order.map(id=>{
          const o = items.find(x=>(x.id||x._id)===id); if(!o) return null;
          return (
            <article key={id} className={`org-card ${dragId===id?"is-dragging":""}`} draggable onDragStart={()=>onDragStart(id)} onDragOver={(e)=>onDragOver(e,id)} onDragEnd={onDragEnd}>
              <div className="org-drag">☰</div>

              <label className="org-avatar">
                <input type="file" accept="image/*" hidden onChange={(e)=> e.target.files?.[0] && openCropper(e.target.files[0], (blob)=> {
   const name = e.target.files?.[0]?.name || 'logo.png'
   const f = (typeof File !== 'undefined')
     ? new File([blob], name, { type: blob.type || 'image/png' })
     : blob;
  onUploadLogo?.(id, f)
 }) } />
                <div className="org-avatar-img" style={{ backgroundImage: o.logo ? `url(${o.logo})` : "none" }} />
                <div className="org-avatar-cta">Change logo</div>
              </label>

              <div className="org-fields">
                <label className="org-field">
                  <div className="org-label">Link</div>
                  <div className="org-edit">
                    <input className="input" defaultValue={o.link || ""} onBlur={(e)=> onUpdate?.(id, { link: e.target.value || null })} />
                    <button className="btn tiny" onClick={(e)=>{ e.preventDefault(); onUpdate?.(id, { link: o.link || null }); }}>Save</button>
                  </div>
                </label>
                <label className="org-field">
                  <div className="org-label">Type</div>
                  <div className="org-edit">
                    <select className="input select" defaultValue={o.type || "host"} onChange={(e)=> onUpdate?.(id, { type: e.target.value })}>
                      {TYPES.map(t=><option key={t}>{t}</option>)}
                    </select>
                    <button className="btn tiny" onClick={(e)=>e.preventDefault()}>Save</button>
                  </div>
                </label>
              </div>

              <div className="org-actions">
                <button className="btn tiny danger" onClick={()=>onDelete?.(id)}>Delete</button>
              </div>
            </article>
          );
        })}
      </div>

      <CropPortal />
    </section>
  );
}
