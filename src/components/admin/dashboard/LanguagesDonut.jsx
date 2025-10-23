import React, { useMemo } from "react";
import "./admin.dashboard.css";

export default function LanguagesDonut({
  title = "Languages used",
  data = [], // [{label:'en', value: 120}, ...]
}) {
  const total = useMemo(() => data.reduce((a,b)=>a + (b.value||0), 0), [data]);
  const palette = ["var(--c1)","var(--c2)","var(--c3)","var(--c4)","var(--c5)","var(--c6)"];
  const parts = useMemo(() => {
    const C = 2 * Math.PI * 70; let acc = 0;
    return data.map((d, i) => {
      const frac = total ? d.value / total : 0;
      const len = frac * C; const off = C - acc; acc += len;
      return { ...d, len, off, C, frac, color: d.color || palette[i % palette.length] };
    });
  }, [data, total]);

  return (
    <section className="card rbk-wrap" aria-label={title}>
      <div className="card-head"><h3 className="card-title">{title}</h3></div>
      <div className="rbk-body">
        <svg viewBox="0 0 200 200" width="180" height="180" role="img" aria-label={title}>
          <g transform="rotate(-90 100 100)">
            <circle cx="100" cy="100" r="70" fill="none" stroke="#e5e7eb" strokeWidth="24" />
            {parts.map((p, i) => (
              <circle key={i} cx="100" cy="100" r="70" fill="none"
                stroke={p.color} strokeWidth="24"
                strokeDasharray={`${p.len} ${p.C - p.len}`} strokeDashoffset={p.off} />
            ))}
          </g>
          <text x="100" y="96" textAnchor="middle" fontSize="16" fontWeight="900" fill="var(--dash-ink)">
            {total}
          </text>
          <text x="100" y="116" textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--dash-muted)">
            total responses
          </text>
        </svg>
        <div className="rbk-legend">
          {parts.map((p, i) => (
            <div key={i} className="rbk-li">
              <span className="rbk-dot" style={{ background: p.color }} />
              <div>{p.label}<div className="rbk-sub">{Math.round(p.frac*100)}%</div></div>
              <div style={{ fontWeight:900 }}>{p.value}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
