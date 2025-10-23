import React from "react";

export default function BestBusinessProfiles({ items = [] }) {
  // items: [{ label: 'Org name', value: 12 }]
  const top = Array.isArray(items) ? items.slice(0, 3) : [];

  return (
    <section className="dash-card">
      <div className="dash-card-head">
        <h3>Best Business Profiles</h3>
        <div className="sub">Top organizations by attendee count</div>
      </div>
      {!top.length ? (
        <div className="dash-empty">No data yet.</div>
      ) : (
        <div className="list">
          {top.map((it, i) => (
            <div key={i} className="list-row">
              <div className="list-k">{it.label || "—"}</div>
              <div className="list-v">{it.value ?? 0}</div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
