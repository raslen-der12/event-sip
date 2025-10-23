import React, { useMemo } from "react";
import "./admin.dashboard.css";

// reuse logic from TicketsByDay but with [date,count] input
function build(points, w = 520, h = 160, pad = 8){
  if (!points.length) return { line:"", area:"", ticks: [] };
  const vals = points.map(p => p.count || 0);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const span = Math.max(1, max - min);
  const stepX = (w - pad * 2) / (points.length - 1);
  const y = (v) => h - pad - ((v - min) / span) * (h - pad * 2);

  let d = "";
  vals.forEach((v, i) => {
    const X = pad + i * stepX;
    const Y = y(v);
    d += (i ? " L " : "M ") + X + " " + Y;
  });
  const area = d + ` L ${pad + (vals.length - 1) * stepX} ${h - pad} L ${pad} ${h - pad} Z`;

  const ticks = Array.from({ length: 4 }, (_, i) => {
    const t = i / 3;
    const Y = pad + t * (h - pad * 2);
    return Math.round(Y);
  });

  return { line: d, area, ticks };
}

export default function RegistrationsOverTime({
  data = [], title = "Registrations over time",
}) {
  const W = 520, H = 160;
  const { line, area, ticks } = useMemo(() => build(data, W, H), [data]);

  return (
    <section className="card">
      <div className="card-head">
        <h3 className="card-title">{title}</h3>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={title}>
        <defs>
          <linearGradient id="gradArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--dash-brand)" stopOpacity="0.5" />
            <stop offset="100%" stopColor="var(--dash-brand)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <g className="tbd-grid">
          {ticks.map((y, i) => <line key={i} x1="0" x2={W} y1={y} y2={y} />)}
        </g>
        {area && <path className="tbd-area" d={area} fill="url(#gradArea)" />}
        {line && <path className="tbd-line" d={line} stroke="var(--dash-brand)" strokeWidth="2" fill="none" />}
      </svg>
    </section>
  );
}
