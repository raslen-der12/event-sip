// EventsList.jsx — cleaner typography, truncation, responsive; no clipping
import React from "react";

const D = (s)=> (s ? new Date(s).toLocaleDateString() : "—");
const clipWords = (txt, n=8) => {
  if (!txt) return "";
  const parts = String(txt).split(/\s+/);
  return parts.length > n ? parts.slice(0, n).join(" ") + "…" : txt;
};

export default function EventsList({ loading, items = [], selectedId, onSelect, onTogglePublish }) {
  return (
    <section className="card" aria-label="Events list">
      <div className="card-head"><h3 className="card-title">Events ({items.length})</h3></div>

      <div className="tbl">
        <div className="tbl-head events-head">
          <div className="th">Event</div>
          <div className="th">Dates</div>
          <div className="th">Status</div>
          <div className="th">Live</div>
        </div>

        <div className="tbl-body">
          {loading ? Array.from({length:8}).map((_,i)=>(
            <div key={i} className="tr events-row">
              <div className="td"><div className="is-skeleton" style={{height:22}}/></div>
              <div className="td"><div className="is-skeleton" style={{height:22}}/></div>
              <div className="td"><div className="is-skeleton" style={{height:22}}/></div>
              <div className="td"><div className="is-skeleton" style={{height:22}}/></div>
            </div>
          )) : null}

          {!loading && !items.length ? (
            <div className="esg-empty" style={{ margin: 10 }}>No events found.</div>
          ) : null}

          {!loading && items.map((e)=>{
            const id = e.id || e._id;
            const isSel = id === selectedId;
            const statusPill = e.isCancelled ? "cancelled" : e.isPublished ? "live" : "draft";
            const occ = Math.round((e.seatsTaken / Math.max(1, e.capacity)) * 100);

            return (
              <button
                key={id}
                className={`tr events-row ${isSel ? "is-selected" : ""}`}
                onClick={()=>onSelect(id)}
                title={e.title}
              >
                <div className="td td-name">
                  <div className="evt-title line-2">{clipWords(e.title, 10)}</div>
                  <div className="evt-sub">
                    <span className="line-1">{e.city}, {e.country}</span>
                    <span>{occ}% full</span>
                  </div>
                </div>

                <div className="td td-date">
                  <span className="line-1">{D(e.startDate)} → {D(e.endDate)}</span>
                </div>

                <div className="td td-status">
                  <span className={`pill-status ${statusPill}`}>{e.isCancelled ? "Cancelled" : e.isPublished ? "Published" : "Draft"}</span>
                </div>

                <div className="td td-switch">
                  <label className="switch" onClick={(ev)=>ev.stopPropagation()}>
                    <input type="checkbox" checked={!!e.isPublished} disabled={!!e.isCancelled} onChange={(ev)=>onTogglePublish(e, ev.target.checked)} />
                    <span />
                  </label>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
