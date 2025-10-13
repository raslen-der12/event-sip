// EventInspector.jsx — simpler header, compact meta, no duplicate KPIs
import React from "react";

const toInputDate = (d) => {
  if (!d) return "";
  const t = new Date(d);
  return `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,"0")}-${String(t.getDate()).padStart(2,"0")}`;
};

export default function EventInspector({
  event,
  currency,
  // statsAll not used here (KPIs are rendered in AdminEvents above)
  onTogglePublish, onToggleCancel, onChangeDates,
  gallery = [], onSetCover,
}) {
  if (!event) {
    return (
      <div className="muted" style={{ padding:"12px 0" }}>
        Select an event on the left to view quick actions and details.
      </div>
    );
  }

  const coverId = gallery.find(g => g.isCover)?.id || gallery.find(g => g._id && g.isCover)?._id || null;

  return (
    <div className="inspector">
      {/* Header */}
      <div className="inspector-head">
        <div className="inspector-head__title">
          <div className="inspector-title line-2" title={event.title}>{event.title}</div>
          <div className="inspector-meta">
            <span className="line-1">{event.city}, {event.country}</span>
          </div>
        </div>
        <div className="inspector-head__toggles">
          <label className="switch">
            <input type="checkbox" checked={!!event.isPublished} disabled={!!event.isCancelled}
                   onChange={(e)=>onTogglePublish(event, e.target.checked)} />
            <span>Published</span>
          </label>
          <label className="switch">
            <input type="checkbox" checked={!!event.isCancelled}
                   onChange={(e)=>onToggleCancel(event, e.target.checked)} />
            <span>Cancelled</span>
          </label>
        </div>
      </div>

      {/* Dates quick-edit */}
      <div className="card soft p-10 inspector-block">
        <div className="inspector-block__title">Dates</div>
        <div className="inspector-dates">
          <input type="date" defaultValue={toInputDate(event.startDate)}
                 onChange={(e)=>onChangeDates(event, e.target.value, toInputDate(event.endDate))} />
          <span className="arrow">→</span>
          <input type="date" defaultValue={toInputDate(event.endDate)}
                 onChange={(e)=>onChangeDates(event, toInputDate(event.startDate), e.target.value)} />
          <small className="muted">End must be after start</small>
        </div>
      </div>

      {/* Cover picker */}
      <div className="card soft p-10 inspector-block">
        <div className="inspector-block__title">Cover photo</div>
        <div className="gallery-grid">
          {gallery?.length ? gallery.map((g)=> {
            const gid = g.id || g._id;
            return (
              <button
                key={gid}
                className={`thumb ${coverId === gid ? "is-active" : ""}`}
                style={{ backgroundImage:`url(${g.file})` }}
                title={g.type}
                onClick={()=>onSetCover(event.id || event._id, gid)}
              />
            );
          }) : <span className="muted">No media.</span>}
        </div>
      </div>

      {/* Meta grid */}
      <div className="card soft p-10 inspector-block">
        <div className="inspector-meta-grid">
          <MetaRow label="City"      value={event.city} />
          <MetaRow label="Country"   value={event.country} />
          <MetaRow label="Capacity"  value={event.capacity} />
          <MetaRow label="Occupied"  value={
            (event.capacity ? Math.round((event.seatsTaken / event.capacity) * 100) : 0) + "%"
          } />
          <MetaRow label="Sessions"  value={event.sessions ?? "—"} />
          <MetaRow label="Tickets"   value={event.tickets ?? "—"} />
        </div>
      </div>
    </div>
  );
}

function MetaRow({ label, value }) {
  return (
    <div className="meta-row">
      <div className="meta-label">{label}</div>
      <div className="meta-value line-1" title={String(value ?? "—")}>{value ?? "—"}</div>
    </div>
  );
}
