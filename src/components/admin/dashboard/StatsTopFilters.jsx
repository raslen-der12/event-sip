// src/components/admin/dashboard/StatsTopFilters.jsx
import React from "react";
import "./top-controls.flags.css"; // reuse same CSS as your TopControls

export default function StatsTopFilters({
  events = [],                  // [{_id, title}]
  countries = DEFAULT_COUNTRIES, // [{ code, name }]
  defaultEventId = "",          // "" means all events
  defaultCountries = [],        // array of ISO codes ['TN','FR']
  onChange,                     // ({ eventId, countries }) => void
}) {
  const [eventId, setEventId] = React.useState(defaultEventId);
  const [pickedCountries, setPickedCountries] = React.useState(defaultCountries);

  React.useEffect(() => {
    onChange?.({ eventId, countries: pickedCountries });
  }, [eventId, pickedCountries]); // eslint-disable-line

  return (
    <div className="card p-8" style={{ display: "grid", gap: 10 }}>
      <div className="top-controls">
        <div className="tc-left" style={{ gap: 10 }}>
          <label className="select">
            <span>Event</span>
            <select value={eventId} onChange={(e) => setEventId(e.target.value)}>
              <option value="">All events</option>
              {events.map((ev) => (
                <option key={String(ev._id)} value={String(ev._id)}>
                  {ev.title || String(ev._id)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="tc-right" style={{ gap: 10 }}>
          <CountrySelect
            value={pickedCountries}
            onChange={setPickedCountries}
            options={countries}
            placeholder="Countries"
          />
          <button
            className="btn"
            onClick={() => onChange?.({ action: "refresh", eventId, countries: pickedCountries })}
          >
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
}

function CountrySelect({ value = [], onChange, options = DEFAULT_COUNTRIES, placeholder = "Countries" }) {
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState("");
  const ref = React.useRef(null);

  React.useEffect(() => {
    const onDoc = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const toggle = (code) => {
    const set = new Set(value);
    set.has(code) ? set.delete(code) : set.add(code);
    onChange(Array.from(set));
  };

  const filtered = options.filter(o =>
    !q.trim() ||
    o.name.toLowerCase().includes(q.trim().toLowerCase()) ||
    o.code.toLowerCase().includes(q.trim().toLowerCase())
  );

  return (
    <div className="country-dd" ref={ref}>
      <button
        className="country-dd__button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        {value.slice(0,3).map(code => (
          <span key={code} className={`fi fi-${code.toLowerCase()} country-flag`} />
        ))}
        {value.length > 3 ? <span className="pill">+{value.length - 3}</span> : null}
        <span className="country-dd__label">
          {value.length ? value.join(", ") : placeholder}
        </span>
      </button>

      {open && (
        <div className="country-dd__menu card p-8" role="listbox">
          <div className="esb-search" style={{ marginBottom: 8 }}>
            <input className="esb-input" placeholder="Search country…" value={q} onChange={(e)=>setQ(e.target.value)} />
          </div>

          <ul className="country-dd__list">
            {filtered.map(opt => {
              const checked = value.includes(opt.code);
              return (
                <li key={opt.code} className="country-dd__item" role="option" aria-selected={checked}>
                  <label className="row btn-row country-dd__row">
                    <input type="checkbox" checked={checked} onChange={() => toggle(opt.code)} />
                    <span className={`fi fi-${opt.code.toLowerCase()} country-flag`} />
                    <span className="country-dd__name">{opt.name}</span>
                    <span className="country-dd__code">{opt.code}</span>
                  </label>
                </li>
              );
            })}
            {!filtered.length && <li className="muted" style={{ padding: 8 }}>No matches</li>}
          </ul>
        </div>
      )}
    </div>
  );
}

export const DEFAULT_COUNTRIES = [
  { code:"TN", name:"Tunisia" },
  { code:"FR", name:"France" },
  { code:"DE", name:"Germany" },
  { code:"US", name:"United States" },
  { code:"MA", name:"Morocco" },
  { code:"AE", name:"United Arab Emirates" },
  { code:"GB", name:"United Kingdom" },
  { code:"IT", name:"Italy" },
  { code:"ES", name:"Spain" },
];
