// src/components/admin/dashboard/LinksCoverageCard.jsx
import React from "react";
import "./admin.dashboard.css";

function Meter({ label, pct = 0 }) {
  const v = Math.max(0, Math.min(100, Number(pct) || 0));
  return (
    <div className="meter-row">
      <div className="meter-head">
        <div className="meter-label">{label}</div>
        <div className="meter-val">{v}%</div>
      </div>
      <div className="meter-track"><div className="meter-fill" style={{ width: `${v}%` }} /></div>
    </div>
  );
}

export default function LinksCoverageCard({ linkedinPct = 0, websitePct = 0 }) {
  return (
    <section className="card">
      <div className="card-head"><h3 className="card-title">Profile Links Coverage</h3></div>
      <div className="meter-wrap">
        <Meter label="Has LinkedIn" pct={linkedinPct} />
        <Meter label="Has Website" pct={websitePct} />
      </div>
    </section>
  );
}
