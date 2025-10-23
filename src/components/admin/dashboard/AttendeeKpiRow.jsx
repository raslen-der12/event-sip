import React from "react";
import "./admin.dashboard.css";

function Kpi({ title, value, footnote, unit }) {
  return (
    <div className="kpi">
      <div className="kpi-head">
        <h4 className="kpi-title">{title}</h4>
      </div>
      <div className="kpi-main">
        <div className="kpi-value">
          {value?.toLocaleString?.() ?? value}
          {unit ? <span className="kpi-unit">{unit}</span> : null}
        </div>
      </div>
      {footnote ? <div className="kpi-delta flat">{footnote}</div> : null}
    </div>
  );
}

export default function AttendeeKpiRow({
  stats = {
    total: 0, verified: 0, orgsCount: 0, countriesCount: 0, languagesCount: 0, new7d: 0, new30d: 0,
  },
}) {
  const items = [
    { title: "Total Attendees", value: stats.total, footnote: `+${stats.new30d} last 30d` },
    { title: "Verified Attendees", value: stats.verified, footnote: `${Math.round((stats.verified / Math.max(1, stats.total))*100)}% of total` },
    { title: "Organizations", value: stats.orgsCount },
    { title: "Countries", value: stats.countriesCount },
  ];
  return (
    <div className="kpi-row">
      {items.map((k, i) => <Kpi key={i} {...k} />)}
    </div>
  );
}
