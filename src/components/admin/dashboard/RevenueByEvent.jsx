import React, { useMemo } from "react";
import "./admin.dashboard.css";

function fmtCompactCurrency(v, currency = "USD") {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(v);
}

export default function RevenueByEvent({
  data = [],            // [{ name: "AI Summit", value: 128000 }, ...]
  currency = "USD",
  title = "Revenue by event",
  limit,                // optional (omit to show all)
}) {
  const sorted = useMemo(() => {
    const arr = [...data].sort((a, b) => (b.value || 0) - (a.value || 0));
    return (limit ? arr.slice(0, limit) : arr);
  }, [data, limit]);

  const max = useMemo(() => Math.max(1, ...sorted.map(d => d.value || 0)), [sorted]);
  const total = useMemo(() => sorted.reduce((a, b) => a + (b.value || 0), 0), [sorted]);

  return (
    <section className="card rbe-wrap" aria-label={title}>
      <div className="card-head">
        <h3 className="card-title">{title}</h3>
        <div className="card-actions">
          <span className="chip-total">Total {fmtCompactCurrency(total, currency)}</span>
        </div>
      </div>

      <div className="rbe-list">
        {sorted.map((d, i) => {
          const widthPct = Math.max(0, Math.min(100, Math.round((d.value / max) * 100)));
          const ofTotal = total ? Math.round((d.value / total) * 100) : 0;
          return (
            <div className="rbe-row" key={i}>
              <div className="rbe-label" title={d.name}>{d.name}</div>
              <div
                className="rbe-bar"
                role="img"
                aria-label={`${d.name} ${fmtCompactCurrency(d.value, currency)} (${ofTotal}% of total)`}
              >
                <div className="rbe-fill" style={{ width: widthPct + "%" }} />
              </div>
              <div className="rbe-value">
                {fmtCompactCurrency(d.value, currency)}
                <span className="pct">{ofTotal}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
