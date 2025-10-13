import React from "react";
import "./comments.manager.css";

/** comment model: { text, verified, id_event, ... } */
export default function CommentsManager({ items = [], onApprove, onUnverify, onDelete }) {
  const [tab, setTab] = React.useState("pending"); // pending = !verified, approved = verified
  const [q, setQ] = React.useState("");
  const [sel, setSel] = React.useState(new Set());

  const status = (c) => (c.verified ? "approved" : "pending");
  const filtered = items.filter((c) => {
    const okTab = tab === "all" ? true : status(c) === tab;
    const t = `${c.text || ""}`.toLowerCase();
    const okQ = !q.trim() || t.includes(q.trim().toLowerCase());
    return okTab && okQ;
  });

  const allIds = filtered.map((x) => x.id || x._id);
  const toggle = (id) => setSel((s) => { const nx = new Set(s); nx.has(id) ? nx.delete(id) : nx.add(id); return nx; });

  return (
    <section className="card soft p-10 cm">
      <div className="cm-head">
        <div className="cm-title">Comments</div>
        <div className="cm-controls">
          <div className="segment">
            {["pending","approved","all"].map((t) => (
              <button key={t} className={tab===t?"is-active":""} onClick={()=>{ setTab(t); setSel(new Set()); }}>
                {t[0].toUpperCase()+t.slice(1)}
              </button>
            ))}
          </div>
          <div className="esb-search">
            <input className="esb-input" placeholder="Search…" value={q} onChange={(e)=>setQ(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="cm-bulk">
        <label className="switch">
          <input type="checkbox" checked={sel.size===allIds.length && allIds.length>0} onChange={(e)=>setSel(e.target.checked ? new Set(allIds) : new Set())} />
          <span>Select all</span>
        </label>
        <div className="cm-bulk-actions">
          <button className="btn tiny" disabled={!sel.size} onClick={()=>onApprove?.(Array.from(sel))}>Approve</button>
          <button className="btn tiny" disabled={!sel.size} onClick={()=>onUnverify?.(Array.from(sel))}>Unverify</button>
          <button className="btn tiny danger" disabled={!sel.size} onClick={()=>onDelete?.(Array.from(sel))}>Delete</button>
          {sel.size ? <span className="muted">{sel.size} selected</span> : null}
        </div>
      </div>

      <div className="cm-list">
        {filtered.map((c) => {
          const id = c.id || c._id; const st = status(c);
          return (
            <div key={id} className="cm-row">
              <div className="cm-cell"><input type="checkbox" checked={sel.has(id)} onChange={()=>toggle(id)} /></div>
              <div className="cm-body">
                <div className="cm-text line-2" title={c.text}>{c.text}</div>
                <div className="cm-sub"><span className="cm-author">{c.actorModel || "user"}</span></div>
              </div>
              <div className="cm-meta"><span className={`pill-status ${st==="approved"?"live":"draft"}`}>{st[0].toUpperCase()+st.slice(1)}</span></div>
              <div className="cm-actions">
                <button className="btn tiny" disabled={st==="approved"} onClick={()=>onApprove?.([id])}>Approve</button>
                <button className="btn tiny" disabled={st==="pending"} onClick={()=>onUnverify?.([id])}>Unverify</button>
                <button className="btn tiny danger" onClick={()=>onDelete?.([id])}>Delete</button>
              </div>
            </div>
          );
        })}
        {!filtered.length && <div className="muted">No comments.</div>}
      </div>
    </section>
  );
}
