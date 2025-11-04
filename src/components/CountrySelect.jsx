// components/CountrySelect.jsx
import React, { useMemo, useState, useEffect, useRef } from "react";
import ReactCountryFlag from "react-country-flag";

export default function CountrySelect({
  value,
  onChange,
  placeholder = "Select country",
  options = [],            // array of { code, name }
  disabled = false,
  name = "country",
  id = "country",
  className = "mp-select",
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Guard to ignore the immediate focus after programmatic blur (prevents reopen)
  const ignoreFocusRef = useRef(false);

  // close when clicking outside
  useEffect(() => {
    const onDoc = (e) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const selected = options.find((c) => c.code === value);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return options;
    return options.filter(
      (c) =>
        (c.code || "").toLowerCase().includes(t) ||
        (c.name || "").toLowerCase().includes(t)
    );
  }, [q, options]);

  // When user selects: call parent, close, blur input and set short ignore
  const handleSelect = (cc) => {
    // cc is { code, name }
    onChange?.({ target: { name, value: cc.code } });

    // close dropdown
    setOpen(false);

    // blur input and ignore its immediate focus event (prevents reopening)
    if (inputRef.current && typeof inputRef.current.blur === "function") {
      ignoreFocusRef.current = true;
      inputRef.current.blur();
      // clear after a short window (160ms)
      window.setTimeout(() => {
        ignoreFocusRef.current = false;
      }, 160);
    }
  };

  // ensure clicking anywhere on input opens the panel (not just chevron)
  const openOnInteraction = () => {
    if (ignoreFocusRef.current) return;
    setOpen(true);
    // focus input for immediate typing
    requestAnimationFrame(() => inputRef.current?.focus?.());
  };

  return (
    <div className="country-select" ref={containerRef}>
      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          name={name}
          value={selected ? selected.name : ""}
          onFocus={() => {
            if (ignoreFocusRef.current) return;
            setOpen(true);
          }}
          onClick={() => openOnInteraction()}
          placeholder={placeholder}
          className={`${className} w-full cursor-pointer`}
          readOnly
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={!!open}
        />
        <div
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 cursor-pointer"
          onClick={() => {
            if (open) {
              setOpen(false);
            } else {
              setOpen(true);
              // focus input when opening so typing works immediately
              requestAnimationFrame(() => inputRef.current?.focus?.());
            }
          }}
        >
          {/* down chevron */}
          <svg width="12" height="12" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

      {open && (
        <div className="cs-panel" role="dialog" aria-modal="false">
          <input
            type="text"
            className="mp-input"
            placeholder="Search country…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            autoFocus
            aria-label="Search countries"
          />
          <div className="cs-list" role="listbox">
            {filtered.map((c) => (
              <button
                key={c.code}
                type="button"
                className={`cs-item ${c.code === value ? "is-active" : ""}`}
                onClick={() => handleSelect(c)}
                title={c.name}
              >
                <span className="flex items-center gap-2">
                  <ReactCountryFlag
                    svg
                    countryCode={(c.code || "").toUpperCase()}
                    style={{ fontSize: "1.1em" }}
                  />
                  <span className="cs-name">{c.name}</span>
                </span>
              </button>
            ))}
            {!filtered.length && <div className="cs-empty">No matches</div>}
          </div>
        </div>
      )}

      <style>{`
        .country-select { position: relative; width: 100%; }
        .cs-panel {
          position: absolute;
          z-index: 30;
          inset-inline: 0;
          top: 100%;
          margin-top: 6px;
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          box-shadow: 0 10px 30px rgba(0,0,0,.08);
          padding: 10px;
        }
        .cs-list { max-height: 240px; overflow-y: auto; margin-top: 8px; }
        .cs-item {
          display: flex;
          justify-content: space-between;
          width: 100%;
          text-align: left;
          padding: 8px 10px;
          border-radius: 8px;
          border: 1px solid transparent;
          background: transparent;
        }
        .cs-item:hover { background: #f8fafc; border-color: #e5e7eb; }
        .cs-item.is-active { background: #eef2ff; border-color: #c7d2fe; }
        .cs-name { font-weight: 500; }
        .cs-empty { padding: 6px 4px; color: #64748b; text-align:center; }
      `}</style>
    </div>
  );
}
