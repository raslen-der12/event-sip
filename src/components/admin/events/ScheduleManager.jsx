import React from "react";
import "./schedule.manager.css";

/**
 * schedule model:
 *  { sessionTitle (required), room, speaker (ObjectId string), startTime (Date ISO), endTime (Date ISO) }
 * We group by calendar day using startTime's date part.
 */
export default function ScheduleManager({
  items = [],
  onCreate,
  onUpdate,
  onDelete,
  onReorder,      // optional (we still emit order rows)
  eventStart,
  eventEnd,
}) {
  const byDay = React.useMemo(() => {
    const map = new Map();
    for (const s of items) {
      const d = dateOnly(s.startTime);
      if (!map.has(d)) map.set(d, []);
      map.get(d).push(s);
    }
    for (const [k, arr] of map) arr.sort((a,b)=> new Date(a.startTime) - new Date(b.startTime));
    return map;
  }, [items]);

  const derivedDays = React.useMemo(() => {
    const daysFromData = Array.from(byDay.keys()).sort();
    if (daysFromData.length) return daysFromData;
    const s = eventStart ? new Date(eventStart) : null;
    const e = eventEnd ? new Date(eventEnd) : null;
    if (!s || !e || isNaN(+s) || isNaN(+e) || e < s) return [];
    const out = [];
    const cur = new Date(s);
    while (cur <= e) { out.push(cur.toISOString().slice(0,10)); cur.setDate(cur.getDate()+1); }
    return out;
  }, [byDay, eventStart, eventEnd]);

  const [day, setDay] = React.useState(derivedDays[0] || "");
  React.useEffect(()=>{ if (!day && derivedDays[0]) setDay(derivedDays[0]); }, [derivedDays, day]);

  const dayItems = (byDay.get(day) || []);
  const [dragId, setDragId] = React.useState(null);
  const [order, setOrder] = React.useState(dayItems.map(x=>x.id||x._id));
  React.useEffect(()=> setOrder(dayItems.map(x=>x.id||x._id)), [day, items.length]);

  const rearrange = (list, aId, bId) => { const a=list.indexOf(aId), b=list.indexOf(bId); if(a<0||b<0) return list; const cp=list.slice(); const [m]=cp.splice(a,1); cp.splice(b,0,m); return cp; };

  // draft slot (we build ISO dates from day + times)
  const [draft, setDraft] = React.useState({ sessionTitle:"", room:"", speakerId:"", start:"09:00", end:"10:00" });
  const ok = draft.sessionTitle.trim() && !!day && draft.start < draft.end;

  return (
    <section className="card soft p-10 schm">
      <div className="schm-head">
        <div className="schm-title">Schedule</div>
        <div className="schm-days">
          {derivedDays.length ? derivedDays.map(d => (
            <button key={d} className={`schm-day ${day===d?"is-active":""}`} onClick={()=>setDay(d)}>{fmtDay(d)}</button>
          )) : <span className="muted">No days yet — add one below.</span>}
        </div>
      </div>

      {/* Add day */}
      <AddDay derivedDays={derivedDays} setDay={setDay} onCreateFirst={(firstDay)=> onCreate?.({
        sessionTitle: "Opening", room:"", speaker: null,
        startTime: toISO(firstDay, "09:00"), endTime: toISO(firstDay, "09:15"),
      })} />

      {/* New slot for the selected day */}
      {day ? (
        <form className="schm-new" onSubmit={(e)=>{ e.preventDefault(); if(!ok) return;
          onCreate?.({
            sessionTitle: draft.sessionTitle.trim(),
            room: draft.room.trim(),
            speaker: draft.speakerId || null,
            startTime: toISO(day, draft.start),
            endTime: toISO(day, draft.end),
          });
          setDraft({ ...draft, sessionTitle:"" });
        }}>
          <input className="input" placeholder="Session title *" value={draft.sessionTitle} onChange={(e)=>setDraft({...draft,sessionTitle:e.target.value})} />
          <input className="input" placeholder="Room"           value={draft.room} onChange={(e)=>setDraft({...draft,room:e.target.value})} />
          <input className="input" placeholder="Speaker ID"     value={draft.speakerId} onChange={(e)=>setDraft({...draft,speakerId:e.target.value})} />
          <input type="time" className="input" value={draft.start} onChange={(e)=>setDraft({...draft,start:e.target.value})} />
          <input type="time" className="input" value={draft.end}   onChange={(e)=>setDraft({...draft,end:e.target.value})} />
          <button className="btn brand" disabled={!ok}>Add</button>
        </form>
      ) : null}

      {/* Slots */}
      <div className="schm-list">
        {dayItems.map((s)=>{
          const id = s.id || s._id;
          return (
            <article key={id} className={`schm-row ${dragId===id?"is-dragging":""}`} draggable
              onDragStart={()=>setDragId(id)}
              onDragOver={(e)=>{ e.preventDefault(); setOrder(prev=>rearrange(prev,id, s.id||s._id)); }}
              onDragEnd={()=>{ setDragId(null); onReorder?.(order.map((id,i)=>({ id, order:i })), day); }}
            >
              <div className="schm-handle">☰</div>

              <div className="schm-time">
                <TimeEdit value={timeOnly(s.startTime)} onSave={(v)=>onUpdate?.(id,{ startTime: toISO(day, v) })} />
                <span className="arrow">→</span>
                <TimeEdit value={timeOnly(s.endTime)}   onSave={(v)=>onUpdate?.(id,{ endTime: toISO(day, v) })} />
              </div>

              <div className="schm-main">
                <InlineEdit value={s.sessionTitle} className="schm-titleline" onSave={(v)=>onUpdate?.(id,{ sessionTitle:v })} required />
                <div className="schm-sub">
                  <InlineEdit value={s.room} placeholder="Room" onSave={(v)=>onUpdate?.(id,{ room:v })} />
                  <span className="dot">•</span>
                  <InlineEdit value={s.speaker || ""} placeholder="Speaker ID" onSave={(v)=>onUpdate?.(id,{ speaker:v||null })} />
                </div>
              </div>

              <div className="schm-actions"><button className="btn tiny danger" onClick={()=>onDelete?.(id)}>Delete</button></div>
            </article>
          );
        })}
        {!dayItems.length && day ? <div className="muted">No sessions on {fmtDay(day)} yet — add one above.</div> : null}
      </div>
    </section>
  );
}

function AddDay({ derivedDays, setDay, onCreateFirst }) {
  const [customDay, setCustomDay] = React.useState("");
  return (
    <div className="schm-addday">
      <input type="date" className="input" value={customDay} onChange={(e)=>setCustomDay(e.target.value)} />
      <button className="btn" onClick={()=>{ if (!customDay) return; setDay(customDay); if (!derivedDays.includes(customDay)) onCreateFirst?.(customDay); setCustomDay(""); }}>
        Add day
      </button>
    </div>
  );
}

function InlineEdit({ value, onSave, className="", placeholder="", required }){
  const [v,setV]=React.useState(value||""); React.useEffect(()=>setV(value||""),[value]);
  return (<div className={`ie ${className}`}><input className="input" value={v} placeholder={placeholder} onChange={(e)=>setV(e.target.value)}/><button className="btn tiny" disabled={required && !v.trim()} onClick={()=>onSave?.(v)}>Save</button></div>);
}
function TimeEdit({ value, onSave }){ const [v,setV]=React.useState(value||"09:00"); React.useEffect(()=>setV(value||"09:00"),[value]); return (<div className="ie-time"><input type="time" className="input" value={v} onChange={(e)=>setV(e.target.value)} /><button className="btn tiny" onClick={()=>onSave?.(v)}>Save</button></div>); }

function dateOnly(d){ if(!d) return ""; const t=new Date(d); const y=t.getFullYear(); const m=String(t.getMonth()+1).padStart(2,"0"); const da=String(t.getDate()).padStart(2,"0"); return `${y}-${m}-${da}`; }
function timeOnly(d){ if(!d) return "09:00"; const t=new Date(d); const hh=String(t.getHours()).padStart(2,"0"); const mm=String(t.getMinutes()).padStart(2,"0"); return `${hh}:${mm}`; }
function toISO(day, time){ return new Date(`${day}T${time}:00`).toISOString(); }
function fmtDay(iso){ if(!iso) return "N/A"; const d=new Date(iso+"T00:00:00"); return d.toLocaleDateString(undefined,{weekday:"short",month:"short",day:"numeric"}); }
