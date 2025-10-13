import React, { useMemo, useState } from "react";
import "./admin.dashboard.css";
import { FiArrowUpRight, FiArrowDownRight } from "react-icons/fi";

const cols = [
  { key: "name", label: "Event" },
  { key: "dates", label: "Dates" },
  { key: "status", label: "Status" },
  { key: "tickets", label: "Tickets" },
  { key: "revenue", label: "Revenue" },
  { key: "occ", label: "Occupancy" },
];

function formatMoney(v, currency = "USD") {
  return new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 0 }).format(v);
}

export default function EventsTable({
  title = "Recent events",
  currency = "USD",
  rows = [
    { name: "AI Summit",               start: "2025-10-05", end: "2025-10-06", status: "live",     tickets: 1280, capacity: 1600, revenue: 128000 },
    { name: "Digital Innovation Forum",start: "2025-09-18", end: "2025-09-19", status: "scheduled",tickets:  940, capacity: 1500, revenue:  94000 },
    { name: "AgriTech Expo",           start: "2025-07-21", end: "2025-07-22", status: "ended",    tickets:  720, capacity: 1200, revenue:  72000 },
    { name: "HealthTech Day",          start: "2025-11-03", end: "2025-11-03", status: "draft",    tickets:   80, capacity:  900, revenue:   8000 },
  ],
}) {
  const base = useMemo(() => rows.map(r => ({
    ...r,
    dates: `${r.start} → ${r.end}`,
    occ: Math.round((r.tickets / Math.max(1, r.capacity)) * 100),
  })), [rows]);

  const [sort, setSort] = useState({ key: "start", dir: "desc" });
  const data = useMemo(() => {
    const arr = [...base];
    const { key, dir } = sort;
    arr.sort((a, b) => {
      const va = a[key]; const vb = b[key];
      if (typeof va === "number" && typeof vb === "number") return dir === "asc" ? va - vb : vb - va;
      return dir === "asc" ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
    });
    return arr;
  }, [base, sort]);

  const toggle = (key) => {
    setSort(s => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));
  };

  return (
    <section className="card">
      <div className="card-head">
        <h3 className="card-title">{title}</h3>
      </div>

      <div className="tbl">
        <div className="tbl-head">
          {cols.map(c => (
            <button
              key={c.key}
              className={`th ${sort.key === c.key ? "is-sorted" : ""}`}
              onClick={() => toggle(c.key)}
            >
              <span>{c.label}</span>
              {sort.key === c.key ? (sort.dir === "asc" ? <FiArrowUpRight /> : <FiArrowDownRight />) : null}
            </button>
          ))}
        </div>

        <div className="tbl-body">
          {data.map((r, i) => (
            <div className="tr" key={i}>
              <div className="td td-name">
                <span className="txt">{r.name}</span>
              </div>

              <div className="td td-date">{r.dates}</div>

              <div className="td td-status">
                <span className={`pill-status ${r.status}`}>{r.status}</span>
              </div>

              <div className="td td-tickets">{r.tickets.toLocaleString()}</div>

              <div className="td td-money">{formatMoney(r.revenue, currency)}</div>

              <div className="td td-occ">
                <div className="progress-mini" role="img" aria-label={`${r.occ}%`}>
                  <div className="bar" style={{ width: r.occ + "%" }} />
                </div>
                <span className="pct">{r.occ}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
