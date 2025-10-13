// src/components/FreightCalculator.jsx
import React, { useEffect, useRef, useState, useMemo } from "react";
import { searchPorts, getRates, requestQuote } from "../../services/api";
import MapRouteView from "./MapRouteView";
import Footer from "../../components/footer/Footer";
import { cta, footerData, nav, topbar } from "../main.mock";
import HeaderShell from "../../components/layout/HeaderShell";

/* ----------------------
   Helpers
   ---------------------- */
const formatDisplay = (p) =>
  p ? `${p.name}${p.subdivision ? `, ${p.subdivision}` : ""}${p.country ? `, ${p.country}` : ""}` : "";
const coordsText = (p) =>
  p && p.lat != null && p.lon != null ? `${Number(p.lat).toFixed(2)}, ${Number(p.lon).toFixed(2)}` : "";

/** escape user query for regex */
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** return array of React nodes with matches wrapped in <mark> styled span */
function highlightText(text = "", query = "") {
  if (!query) return text;
  const q = query.trim();
  if (!q) return text;
  try {
    const re = new RegExp(`(${escapeRegExp(q)})`, "ig");
    const parts = text.split(re);
    return parts.map((part, idx) =>
      re.test(part) ? (
        <span key={idx} className="bg-yellow-100 text-indigo-700 font-semibold px-[2px] rounded">
          {part}
        </span>
      ) : (
        <span key={idx}>{part}</span>
      )
    );
  } catch {
    return text;
  }
}

/* ----------------------
   Small SVG icons
   ---------------------- */
function PinIcon({ className = "h-5 w-5 text-indigo-600" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 2C8.134 2 5 5.134 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.866-3.134-7-7-7z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="9" r="2.3" fill="currentColor" />
    </svg>
  );
}

/** small round country token — uses first two letters of country (fallback) */
function CountryToken({ country }) {
  const label = (country || "—").slice(0, 2).toUpperCase();
  return (
    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold border border-indigo-100">
      {label}
    </div>
  );
}

/* ----------------------
   Enhanced PortInput
   - highlights matches
   - icons & nicer layout
   - click-to-select
   ---------------------- */
function PortInput({ label, value, setValue, selected, setSelected, searchFn = searchPorts, placeholder = "Type port / country / subdivision / code..." }) {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef(null);
  const rootRef = useRef(null);

  // debounce search
  useEffect(() => {
    if (!value || value.trim() === "") {
      setOptions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      try {
        const res = await searchFn(value);
        const list = Array.isArray(res) ? res : [];

        const q = value.trim().toLowerCase();

        // lightweight scoring to prioritize name / country / subdivision matches
        const scored = list
          .map((p) => {
            const name = (p.name || "").toLowerCase();
            const country = (p.country || "").toLowerCase();
            const sub = (p.subdivision || "").toLowerCase();
            let score = 0;
            if (name.includes(q)) score += 10;
            if (country.includes(q)) score += 6;
            if (sub.includes(q)) score += 6;
            if ((p.id || "").toLowerCase().includes(q)) score += 4;
            return { p, score };
          })
          .sort((a, b) => b.score - a.score || a.p.name.localeCompare(b.p.name))
          .map((s) => s.p)
          .slice(0, 80);

        setOptions(scored);
      } catch (err) {
        setOptions([]);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timerRef.current);
  }, [value, searchFn]);

  // outside click closes
  useEffect(() => {
    const onDoc = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOptions([]);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div ref={rootRef} className="relative">
      <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>

      <div className="flex items-center bg-white border border-slate-200 rounded-lg shadow-sm focus-within:ring-2 focus-within:ring-indigo-100">
        <input
          type="text"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (selected) setSelected(null); // clear previously selected when typing
          }}
          placeholder={placeholder}
          className="w-full px-4 py-3 text-sm rounded-lg bg-transparent outline-none"
          autoComplete="off"
        />

        {value ? (
          <button
            type="button"
            onClick={(ev) => {
              ev.stopPropagation();
              setValue("");
              setSelected(null);
              setOptions([]);
            }}
            className="px-3 text-slate-400 hover:text-slate-600"
            title="Clear"
          >
            ✕
          </button>
        ) : (
          <div className="px-3 text-slate-300 text-sm">Search</div>
        )}
      </div>

      {(loading || options.length > 0) && (
        <div className="absolute z-50 mt-2 w-full max-h-72 overflow-auto rounded-xl border border-slate-100 bg-white shadow-lg">
          {loading && <div className="p-3 text-sm text-slate-500">Searching…</div>}

          {!loading && options.length === 0 && <div className="p-3 text-sm text-slate-500">No results</div>}

          {!loading &&
            options.map((p, idx) => {
              const isSelected = selected && selected.id === p.id;
              return (
                <div
                  key={p.id || `${p.name}-${idx}`}
                  onMouseDown={(e) => {
                    e.preventDefault(); // prevent input blur before setting
                    setSelected(p);
                    setValue(formatDisplay(p));
                    setOptions([]);
                  }}
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 ${isSelected ? "bg-indigo-50" : ""}`}
                >
                  {/* left icons */}
                  <div className="flex flex-col items-center gap-2 w-12">
                    <div className="p-0.5 rounded bg-white">
                      <PinIcon className="h-5 w-5 text-indigo-600" />
                    </div>
                    <CountryToken country={p.country} />
                  </div>

                  {/* middle content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3">
                      <div className="truncate text-sm font-medium text-slate-900">
                        {highlightText(p.name || "-", value)}
                      </div>
                      <div className="text-xs text-slate-400 ml-3">{coordsText(p)}</div>
                    </div>
                    <div className="text-xs text-slate-500 mt-1 truncate">
                      {/* show subdivision & country & id; highlight matches */}
                      <span className="mr-2">
                        {p.subdivision ? highlightText(p.subdivision, value) : null}
                        {p.subdivision ? " • " : ""}
                        {p.country ? highlightText(p.country, value) : "—"}
                      </span>
                      <span className="ml-2 text-[11px] text-slate-400">{highlightText(p.id || "", value)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}

/* ----------------------
   FreightCalculator (main)
   (keeps your existing form & logic)
   ---------------------- */
export default function FreightCalculator() {
  // from/to text and selected objects
  const [fromQ, setFromQ] = useState("");
  const [toQ, setToQ] = useState("");
  const [selectedFrom, setSelectedFrom] = useState(null);
  const [selectedTo, setSelectedTo] = useState(null);

  // other form state kept minimal
  const [date, setDate] = useState(() => new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().slice(0, 10));
  const [containers, setContainers] = useState([{ id: Date.now(), type: "40std", qty: 1 }]);
  const [currency, setCurrency] = useState("USD");
  const [rates, setRates] = useState({ USD: 1 });

  const [loading, setLoading] = useState(false);
  const [quote, setQuote] = useState(null);
  const [error, setError] = useState(null);

  // mirror From -> To support
  const [sameAsFrom, setSameAsFrom] = useState(false);

  // fetch rates once
  useEffect(() => {
    let mounted = true;
    getRates()
      .then((r) => {
        if (mounted) setRates(r || { USD: 1 });
      })
      .catch(() => {
        if (mounted) setRates({ USD: 1 });
      });
    return () => {
      mounted = false;
    };
  }, []);

  // mirror when sameAsFrom
  useEffect(() => {
    if (sameAsFrom) {
      setSelectedTo(selectedFrom);
      setToQ(formatDisplay(selectedFrom));
    }
  }, [sameAsFrom, selectedFrom]);

  // containers helpers
  function addContainer() {
    setContainers((p) => [...p, { id: Date.now() + Math.random(), type: "40std", qty: 1 }]);
  }
  function updateContainer(id, patch) {
    setContainers((p) => p.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }
  function removeContainer(id) {
    setContainers((p) => p.filter((c) => c.id !== id));
  }

  function swapPorts() {
    const a = selectedFrom;
    const b = selectedTo;
    setSelectedFrom(b);
    setSelectedTo(a);
    setFromQ(formatDisplay(b));
    setToQ(formatDisplay(a));
    setSameAsFrom(false);
  }

  async function handleGetQuote(e) {
    e?.preventDefault();
    setError(null);
    if ((!selectedFrom && !fromQ) || (!selectedTo && !toQ)) {
      setError("Choose both origin and destination (select a suggestion).");
      return;
    }
    setLoading(true);
    setQuote(null);

    const payload = {
      from: selectedFrom?.id || selectedFrom?.name || fromQ,
      to: selectedTo?.id || selectedTo?.name || toQ,
      date,
      currency,
      containers: containers.map((c) => ({ type: c.type, qty: Number(c.qty || 1) })),
    };
    if (selectedFrom?.lat && selectedFrom?.lon) {
      payload.fromLat = selectedFrom.lat;
      payload.fromLon = selectedFrom.lon;
    }
    if (selectedTo?.lat && selectedTo?.lon) {
      payload.toLat = selectedTo.lat;
      payload.toLon = selectedTo.lon;
    }

    try {
      const res = await requestQuote(payload);
      if (!res?.ok) throw new Error(res?.error || res?.message || "Quote failed");
      setQuote(res.data);
    } catch (err) {
      setError(err.message || "Failed to get quote");
    } finally {
      setLoading(false);
    }
  }

  const currencyKeys = useMemo(() => Object.keys(rates || { USD: 1 }), [rates]);

  return (
    <>
      <HeaderShell top={topbar} nav={nav} cta={cta} />

    <div className="max-w-5xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Freight Calculator</h1>
          </div>
          <div className="text-sm text-slate-400">Mode: API</div>
        </div>

        <form onSubmit={handleGetQuote} className="mt-6 grid md:grid-cols-3 gap-6">
          <div>
            <PortInput
              label="From (port)"
              value={fromQ}
              setValue={(v) => {
                setFromQ(v);
              }}
              selected={selectedFrom}
              setSelected={(p) => {
                setSelectedFrom(p);
                if (p) setFromQ(formatDisplay(p));
              }}
            />

            <div className="mt-4">
              <label className="block text-sm text-slate-700 mb-1">Sailing / Loading date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full p-2 border rounded" />
            </div>

            <div className="mt-4">
              <label className="block text-sm text-slate-700 mb-1">Currency</label>
              <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full p-2 border rounded">
                {currencyKeys.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="md:col-span-2">
            <div className="flex gap-4 items-start">
              <div className="flex-1">
                <PortInput
                  label="To (port)"
                  value={toQ}
                  setValue={(v) => {
                    setToQ(v);
                    if (sameAsFrom) setSameAsFrom(false);
                  }}
                  selected={selectedTo}
                  setSelected={(p) => {
                    setSelectedTo(p);
                    if (p) setToQ(formatDisplay(p));
                    setSameAsFrom(false);
                  }}
                />
              </div>

              <div className="w-40">
                <div className="flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setFromQ("");
                      setToQ("");
                      setSelectedFrom(null);
                      setSelectedTo(null);
                      setQuote(null);
                      setSameAsFrom(false);
                      setError(null);
                    }}
                    className="px-3 py-2 border rounded"
                  >
                    Reset
                  </button>

                  <button type="submit" disabled={loading} className="px-3 py-2 bg-indigo-600 text-white rounded">
                    {loading ? "Calculating..." : "Get Quote"}
                  </button>

                  <button type="button" onClick={swapPorts} className="px-3 py-2 border rounded mt-1">
                    Swap
                  </button>

                  <label className="inline-flex items-center gap-2 mt-2">
                    <input
                      type="checkbox"
                      checked={sameAsFrom}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setSameAsFrom(checked);
                        if (checked) {
                          setSelectedTo(selectedFrom);
                          setToQ(formatDisplay(selectedFrom));
                        }
                      }}
                    />
                    <span className="text-sm text-slate-600">Same as From</span>
                  </label>
                </div>
              </div>
            </div>

            {/* containers */}
            <div className="mt-5">
              <div className="flex justify-between items-center">
                <div className="text-sm font-medium">Containers</div>
                <button type="button" onClick={addContainer} className="px-3 py-1 border rounded">
                  + Add
                </button>
              </div>

              <div className="mt-3 space-y-3">
                {containers.map((c, i) => (
                  <div key={c.id} className="p-3 border rounded grid grid-cols-6 gap-2 items-center">
                    <div className="col-span-3">
                      <select value={c.type} onChange={(e) => updateContainer(c.id, { type: e.target.value })} className="w-full p-2 border rounded">
                        <option value="20std">20' Standard</option>
                        <option value="40std">40' Standard</option>
                        <option value="40hc">40' High Cube</option>
                      </select>
                    </div>

                    <div className="col-span-1">
                      <input type="number" min="1" value={c.qty} onChange={(e) => updateContainer(c.id, { qty: Math.max(1, Number(e.target.value || 1)) })} className="w-full p-2 border rounded" />
                    </div>

                    <div className="col-span-2 flex justify-end gap-2">
                      <div className="text-xs text-slate-500">Line {i + 1}</div>
                      <button type="button" onClick={() => removeContainer(c.id)} disabled={containers.length === 1} className="px-3 py-1 border rounded">
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {error && <div className="mt-4 text-red-600">{error}</div>}

            {/* quote summary */}
            <div className="mt-6">
              {!quote && <div className="text-sm text-slate-500">No quote yet. Fill the form and click <strong>Get Quote</strong>.</div>}
              {quote && (
                <div className="mt-4 p-4 bg-slate-50 rounded">
                  <div className="flex justify-between">
                    <div>
                      <div className="text-sm text-slate-600">{quote.from} → {quote.to}</div>
                      <div className="text-xs text-slate-400">Distance: <strong>{quote.distance} nm</strong></div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-slate-600">Total</div>
                      <div className="text-2xl font-semibold">{new Intl.NumberFormat('en-US', { style: "currency", currency: quote.currency || "USD" }).format(quote.total)}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </form>

        <div className="mt-6">
          <div className="text-sm text-slate-500 mb-2">Map preview</div>
          <div style={{ height: 420 }} className="rounded overflow-hidden border">
            <MapRouteView from={selectedFrom} to={selectedTo} />
          </div>
        </div>
      </div>
    </div>
          <Footer
            brand={footerData.brand}
            columns={footerData.columns}
            socials={footerData.socials}
            actions={footerData.actions}
            bottomLinks={footerData.bottomLinks}
          />
        </>
  );
}
