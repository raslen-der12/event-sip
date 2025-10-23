import React from "react";
import "./admin.dashboard.css";

export default function OpenToMeetingsCard({ pct = 0 }) {
  const v = Math.max(0, Math.min(100, Number(pct) || 0));
  const R = 70;
  const C = 2 * Math.PI * R;
  const len = (v / 100) * C;

  return (
    <section className="card rbk-wrap" aria-label="Open to meetings">
      <div className="card-head"><h3 className="card-title">% Open to Meetings</h3></div>
      <div className="rbk-body">
        <svg viewBox="0 0 200 200" width="180" height="180" role="img" aria-label="% Open to Meetings">
          <g transform="rotate(-90 100 100)">
            <circle cx="100" cy="100" r={R} fill="none" stroke="#e5e7eb" strokeWidth="20" />
            <circle
              cx="100" cy="100" r={R} fill="none"
              stroke="var(--dash-brand)" strokeWidth="20"
              strokeDasharray={`${len} ${C - len}`} strokeDashoffset="0"
              strokeLinecap="round"
            />
          </g>
          <text x="100" y="96" textAnchor="middle" fontSize="24" fontWeight="900" fill="var(--dash-ink)">
            {Math.round(v)}%
          </text>
          <text x="100" y="116" textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--dash-muted)">
            opt-in to meetings
          </text>
        </svg>
        <div className="rbk-legend">
          <div className="rbk-li">
            <span className="rbk-dot" style={{ background: "var(--dash-brand)" }} />
            <div>Open to Meetings</div>
            <div style={{ fontWeight:900 }}>{Math.round(v)}%</div>
          </div>
        </div>
      </div>
    </section>
  );
}
