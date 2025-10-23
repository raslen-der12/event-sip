import React from "react";
import "./admin.dashboard.css";

export default function BarListCard({ title, data = [], maxItems = 10 }) {
  const rows = (Array.isArray(data) ? data : []).slice(0, maxItems);
  const max = Math.max(1, ...rows.map(r => Number(r.value) || 0));
  return (
    <section className="card">
      <div className="card-head">
        <h3 className="card-title">{title}</h3>
      </div>
      <div className="listbars">
        {!rows.length ? (
          <div className="empty">No data</div>
        ) : rows.map((r, i) => {
          const v = Number(r.value) || 0;
          const w = Math.round((v / max) * 100);
          return (
            <div key={i} className="listbars-row">
              <div className="listbars-meta">
                <div className="listbars-label" title={r.label}>{r.label}</div>
                <div className="listbars-val">{v.toLocaleString?.() ?? v}</div>
              </div>
              <div className="listbars-bar">
                <div className="listbars-fill" style={{ width: `${w}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
