// src/services/api.js
const getEnv = () => {
  const vite = (typeof import.meta !== "undefined" && import.meta.env) || {};
  const proc = typeof process !== "undefined" ? process.env : {};
  return { vite, proc };
};

const { vite, proc } = getEnv();

export const API_BASE =
  proc?.REACT_APP_API_BASE ||
  proc?.REACT_APP_API_URL ||
  process.env.REACT_APP_API_URL || 'https://api.eventra.cloud';

const API_KEY =
  vite?.VITE_API_KEY ||
  proc?.REACT_APP_API_KEY ||
  proc?.VITE_API_KEY ||
  proc?.APP_API_KEY ||
  null;

const API_KEY_HEADER =
  vite?.VITE_API_KEY_HEADER ||
  proc?.REACT_APP_API_KEY_HEADER ||
  proc?.VITE_API_KEY_HEADER ||
  "Authorization";

function buildHeaders(extra = {}) {
  const headers = { Accept: "application/json", ...extra };
  if (API_KEY) {
    if (API_KEY_HEADER.toLowerCase() === "authorization") {
      headers[API_KEY_HEADER] = API_KEY.startsWith("Bearer ")
        ? API_KEY
        : `Bearer ${API_KEY}`;
    } else {
      headers[API_KEY_HEADER] = API_KEY;
    }
  }
  return headers;
}

async function fetchJson(url, opts = {}) {
  const finalOpts = {
    credentials: "same-origin",
    ...opts,
    headers: buildHeaders(opts.headers || {}),
  };
  const res = await fetch(url, finalOpts);
  const text = await res.text().catch(() => "");
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch (e) {
    throw new Error(`Invalid JSON from ${url}: ${text}`);
  }
  if (!res.ok) {
    const errMsg = json?.error || json?.message || `HTTP ${res.status}`;
    const e = new Error(errMsg);
    e.response = json;
    e.status = res.status;
    throw e;
  }
  return json;
}

export async function searchPorts(q = "") {
  const url = `${API_BASE.replace(/\/$/, "")}/api/ports?q=${encodeURIComponent(
    q || ""
  )}`;
  const json = await fetchJson(url);
  if (json && Array.isArray(json)) return json;
  return json?.data || [];
}

export async function getRates() {
  const url = `${API_BASE.replace(/\/$/, "")}/api/rates`;
  const json = await fetchJson(url);
  if (!json) return { USD: 1 };
  return json?.data || json || { USD: 1 };
}

export async function requestQuote(payload) {
  const url = `${API_BASE.replace(/\/$/, "")}/api/quote`;
  const json = await fetchJson(url, {
    method: "POST",
    body: JSON.stringify(payload),
    headers: { "Content-Type": "application/json" },
  });
  return json;
}

export async function health() {
  const url = `${API_BASE.replace(/\/$/, "")}/api/health`;
  try {
    return await fetchJson(url);
  } catch (err) {
    return { ok: false, error: err.message || "unreachable" };
  }
}
