import React, { useMemo } from "react";
import { FiArrowUpRight, FiArrowDownRight, FiMinus } from "react-icons/fi";
import "./admin.dashboard.css";

function formatNumber(v, { currency, compact } = {}) {
  if (currency) {
    return new Intl.NumberFormat(undefined, { style: "currency", currency, notation: compact ? "compact" : "standard", maximumFractionDigits: 0 }).format(v);
  }
  return new Intl.NumberFormat(undefined, { notation: compact ? "compact" : "standard", maximumFractionDigits: 0 }).format(v);
}

function buildPath(points, w = 120, h = 36, pad = 2) {
  if (!points || points.length === 0) return { d: "", fillD: "" };
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = Math.max(1, max - min);
  const stepX = (w - pad * 2) / (points.length - 1);
  const ys = points.map(v => {
    const t = (v - min) / span; // 0..1
    return h - pad - t * (h - pad * 2);
  });
  let d = "";
  points.forEach((_, i) => {
    const x = pad + i * stepX;
    const y = ys[i];
    d += (i ? " L " : "M ") + x + " " + y;
  });
  // area fill path
  const fillD = d + ` L ${pad + (points.length - 1) * stepX} ${h - pad} L ${pad} ${h - pad} Z`;
  return { d, fillD };
}

export default function KpiCard({
  title = "KPI",
  value = 0,
  currency,     // e.g. "USD"
  compact = true,
  delta = 0,    // +/- percentage number
  trend = [],   // array of numbers for sparkline
  footnote = "vs previous period",
}) {
  const DeltaIcon = delta > 0 ? FiArrowUpRight : delta < 0 ? FiArrowDownRight : FiMinus;
  const deltaClass = delta > 0 ? "up" : delta < 0 ? "down" : "flat";
  const text = formatNumber(value, { currency, compact });
  const { d, fillD } = useMemo(() => buildPath(trend), [trend]);

  return (
    <section className="kpi" tabIndex={0}>
      <div className="kpi-head">
        <h4 className="kpi-title">{title}</h4>
        <div className="kpi-actions" aria-hidden="true">
          {/* reserved for menu/actions later */}
        </div>
      </div>

      <div className="kpi-main">
        <div>
          <div className="kpi-value">
            {text} {currency ? <span className="kpi-unit">{currency}</span> : null}
          </div>
          <div className={`kpi-delta ${deltaClass}`} aria-label={`Change ${delta}%`}>
            <DeltaIcon /> {Math.abs(delta)}%
          </div>
        </div>

        <svg className="spark" viewBox="0 0 120 36" role="img" aria-label="trend">
          <defs>
            <linearGradient id="gradSpark" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--dash-brand)" stopOpacity="0.55" />
              <stop offset="100%" stopColor="var(--dash-brand)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {fillD && <path className="fill" d={fillD} />}
          {d && <path className="line" d={d} />}
        </svg>
      </div>

      <div className="kpi-foot">
        <span className="kpi-note">{footnote}</span>
      </div>
    </section>
  );
}
