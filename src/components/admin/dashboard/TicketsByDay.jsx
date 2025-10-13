import React, { useMemo } from "react";
import "./admin.dashboard.css";

function buildArea(points, w = 520, h = 160, pad = 8){
  if (!points.length) return { line:"", area:"", ticks: [] };
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = Math.max(1, max - min);
  const stepX = (w - pad * 2) / (points.length - 1);
  const y = (v) => h - pad - ((v - min) / span) * (h - pad * 2);

  let d = "";
  points.forEach((v, i) => {
    const X = pad + i * stepX;
    const Y = y(v);
    d += (i ? " L " : "M ") + X + " " + Y;
  });
  const area = d + ` L ${pad + (points.length - 1) * stepX} ${h - pad} L ${pad} ${h - pad} Z`;

  // 4 horizontal grid lines
  const ticks = Array.from({ length: 4 }, (_, i) => {
    const t = i / 3;
    const Y = pad + t * (h - pad * 2);
    return Math.round(Y);
  });

  return { line: d, area, ticks };
}

export default function TicketsByDay({
  data = [],                    // [numbers per day]
  title = "Tickets by day",
}) {
  const W = 520, H = 160;
  const { line, area, ticks } = useMemo(() => buildArea(data, W, H), [data]);

  return (
    <section className="card">
      <div className="card-head">
        <h3 className="card-title">{title}</h3>
      </div>

      <svg className="tbd-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={title}>
        <defs>
          <linearGradient id="gradArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--dash-brand)" stopOpacity="0.5" />
            <stop offset="100%" stopColor="var(--dash-brand)" stopOpacity="0" />
          </linearGradient>
        </defs>

        <g className="tbd-grid">
          {ticks.map((y, i) => (
            <line key={i} x1="0" x2={W} y1={y} y2={y} />
          ))}
        </g>

        {area && <path className="tbd-area" d={area} />}
        {line && <path className="tbd-line" d={line} />}
      </svg>
    </section>
  );
}
