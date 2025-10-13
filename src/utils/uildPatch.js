// Build a minimal patch from a draft object keyed by field.key,
// using the field definitions to map each key → dot path on the raw profile.
//
// Usage:
//   const patch = buildPatch({ draft, fields: overviewFields, original: profile });
//
// Notes:
// - Only emits keys that actually changed (strict !==).
// - Arrays are compared shallowly by JSON.stringify.
// - Skips empty keys and missing paths.

const get = (obj, path) =>
  (Array.isArray(path) ? path : String(path).split("."))
    .reduce((a, k) => (a && a[k] != null ? a[k] : undefined), obj);

const equal = (a, b) => {
  if (Array.isArray(a) || Array.isArray(b)) {
    try { return JSON.stringify(a) === JSON.stringify(b); }
    catch { return false; }
  }
  return a === b;
};

export function buildPatch({ draft = {}, fields = [], original = {} }) {
  const patch = {};
  for (const f of fields) {
    if (!f || !f.key) continue;

    // Source of truth:
    const path = f.path || f.sourcePath; // allow either name
    if (!path) continue;

    // Draft value only present for edited fields; otherwise use original value.
    const nextVal = Object.prototype.hasOwnProperty.call(draft, f.key)
      ? draft[f.key]
      : get(original, path);

    const prevVal = get(original, path);

    // Only emit actual changes
    if (!equal(nextVal, prevVal)) {
      patch[path] = nextVal;
    }
  }
  return patch;
}
