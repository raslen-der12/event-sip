// components/CountrySelect.jsx
import React, { useMemo, useState } from "react";
import ReactCountryFlag from "react-country-flag";

export default function CountrySelect({
  value,
  onChange,
  placeholder = "Select country",
  options = [],            // <-- renamed from "list"
  disabled = false,
  name = "country",
  id = "country",
  className = "mp-select",
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return options;
    return options.filter(
      (c) =>
        c.code.toLowerCase().includes(t) ||
        c.name.toLowerCase().includes(t)
    );
  }, [q, options]);

  const handleSelect = (cc) => {
    onChange?.({ target: { name, value: cc } });
    setOpen(false);
  };

  return (
    <div className="country-select">
      <div className="cs-row">
        <input
          id={id}
          name={name}
          value={value || ""}
          onChange={(e) => onChange?.(e)}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className={className}
          disabled={disabled}
          autoComplete="off"
        />
        <button type="button" className="mp-btn" onClick={() => setOpen((s) => !s)}>
          {open ? "Close" : "Browse"}
        </button>
      </div>

      {open && (
        <div className="cs-panel">
          <input
            type="text"
            className="mp-input"
            placeholder="Search country…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            autoFocus
          />
          <div className="cs-list">
            {filtered.map((c) => (
              <button
                key={c.code}
                type="button"
                className={`cs-item ${c.code === value ? "is-active" : ""}`}
                onClick={() => handleSelect(c.code)}
                title={c.name}
              >
                <span className="cs-name">{c.name}</span>
                <span className="cs-code"><ReactCountryFlag svg countryCode={(c.code || '').toUpperCase()} style={{ fontSize:'1.1em' }} /></span>
              </button>
            ))}
            {!filtered.length && <div className="cs-empty">No matches</div>}
          </div>
        </div>
      )}

      <style>{`
        .country-select{position:relative}
        .cs-row{display:flex;gap:8px}
        .cs-panel{position:absolute;z-index:30;inset-inline:0;top:100%;margin-top:6px;background:#fff;border:1px solid #e5e7eb;border-radius:10px;box-shadow:0 10px 30px rgba(0,0,0,.08);padding:10px}
        .cs-list{max-height:240px;overflow:auto;margin-top:8px}
        .cs-item{display:flex;justify-content:space-between;width:100%;text-align:left;padding:8px 10px;border-radius:8px;border:1px solid transparent}
        .cs-item:hover{background:#f8fafc;border-color:#e5e7eb}
        .cs-item.is-active{background:#eef2ff;border-color:#c7d2fe}
        .cs-name{font-weight:600}
        .cs-code{opacity:.7;font-variant:all-small-caps}
        .cs-empty{padding:6px 4px;color:#64748b}
      `}</style>
    </div>
  );
}
