// src/utils/countries.js

// Minimal seed if Intl.supportedValuesOf is unavailable (keep this short):
const BASIC_CODES = [
  'TN','FR','US','DE','IT','ES','MA','DZ','EG','SA','AE','GB','CA','KE','NG','ZA','SN','GH','CM','ET',
  'TR','IR','IQ','QA','BH','KW','OM','JO','LB','SY','YE','PS','LY','SD','MR','NE','ML','BF','CI','TG','BJ',
  'RU','UA','BY','PL','CZ','SK','HU','RO','BG','GR','PT','NL','BE','CH','AT','SE','NO','DK','FI','IE','IS',
  'CN','JP','KR','TW','HK','VN','TH','MY','SG','PH','ID','IN','PK','BD','LK','NP','MM','KH','LA','AU','NZ',
  'BR','AR','CL','PE','CO','VE','UY','PY','BO','MX','GT','SV','HN','NI','CR','PA','CU','DO','HT'
];

// Try to build a large fallback list from the runtime itself (no network):
function buildRuntimeFallbackList(locale = 'en') {
  try {
    const codes = typeof Intl.supportedValuesOf === 'function'
      ? Intl.supportedValuesOf('region').filter(c => /^[A-Z]{2}$/.test(c))
      : BASIC_CODES;

    const namer = (typeof Intl.DisplayNames === 'function')
      ? new Intl.DisplayNames([locale], { type: 'region' })
      : null;

    const toName = (cc) => (namer ? namer.of(cc) : cc);

    return codes
      .map(code => ({ code, name: toName(code) || code }))
      // a few normalizations people expect:
      .map(x => (x.code === 'GB' ? { code: 'GB', name: 'United Kingdom' } : x))
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch {
    return BASIC_CODES
      .map(code => ({ code, name: code }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }
}

// Network fetch (fast & complete) -> REST Countries
export async function fetchAllCountries({ signal, locale = 'en' } = {}) {
  const res = await fetch(
    'https://restcountries.com/v3.1/all?fields=cca2,name',
    { signal }
  );
  if (!res.ok) throw new Error('Failed to fetch countries');
  const data = await res.json();
  const arr = (Array.isArray(data) ? data : [])
    .map(r => {
      const code = String(r?.cca2 || '').toUpperCase();
      const name = r?.name?.common || '';
      return code && name ? { code, name } : null;
    })
    .filter(Boolean);

  // Dedup + sort
  const seen = new Set();
  const out = [];
  for (const c of arr) {
    if (!seen.has(c.code)) { seen.add(c.code); out.push(c); }
  }

  // Ensure some “usuals” have expected labels
  for (const c of out) {
    if (c.code === 'GB') c.name = 'United Kingdom';
    if (c.code === 'KR') c.name = 'South Korea';
    if (c.code === 'CG') c.name = 'Congo (Republic)';
    if (c.code === 'CD') c.name = 'Congo (DRC)';
    if (c.code === 'TZ') c.name = 'Tanzania';
    if (c.code === 'PS') c.name = 'Palestine';
  }

  out.sort((a, b) => a.name.localeCompare(b.name));
  return out;
}

// One-call helper: try network → fallback (runtime) → minimal seed
export async function getCountries(opts = {}) {
  try {
    return await fetchAllCountries(opts);
  } catch {
    return buildRuntimeFallbackList(opts.locale || 'en');
  }
}

// Synchronous fallback (useful for SSR initial render or “static” usage)
export const FALLBACK_COUNTRIES = buildRuntimeFallbackList('en');

// Small helpers
export function findCountryName(code, list = FALLBACK_COUNTRIES) {
  const cc = String(code || '').toUpperCase();
  return (list.find(c => c.code === cc)?.name) || '';
}
export function isIsoCountry(code, list = FALLBACK_COUNTRIES) {
  const cc = String(code || '').toUpperCase();
  return list.some(c => c.code === cc);
}
