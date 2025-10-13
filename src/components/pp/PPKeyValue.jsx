import React from "react";

export default function PPKeyValue({ items = [] }) {
  const safe = Array.isArray(items) ? items : [];
  return (
    <dl className="ppp-kv">
      {safe.map((it, i) => (
        <div key={i} className="ppp-kv-row">
          <dt>{it.label}</dt>
          <dd>{renderVal(it.value)}</dd>
        </div>
      ))}
    </dl>
  );
}

function renderVal(v) {
  if (v === null || v === undefined || (typeof v === "string" && !v.trim())) return "—";
  if (Array.isArray(v)) {
    if (!v.length) return "—";
    return v.join(", ");
  }
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (v && typeof v === "object") return JSON.stringify(v);
  return String(v);
}