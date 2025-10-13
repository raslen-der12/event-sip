import React from "react";
import KpiCard from "./KpiCard";
import "./admin.dashboard.css";

export default function KpiRow({ currency = "USD", items = [] }) {
  // items: [{ title, value, delta, trend, footnote }]
  return (
    <div className="kpi-row">
      {items.map((it, i) => (
        <KpiCard key={i} currency={currency} {...it} />
      ))}
    </div>
  );
}
