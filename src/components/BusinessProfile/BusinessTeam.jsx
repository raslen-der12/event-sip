// BusinessTeam.jsx (replace your current file)
import React from "react";
import PropTypes from "prop-types";
import imageLink from "../../utils/imageLink";

/* icons kept as in your original file */
const I = {
  search: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-slate-400">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="M20 20l-3-3" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
  map: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="inline-block align-middle">
      <path d="M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11Z" stroke="currentColor" />
      <circle cx="12" cy="10" r="2" stroke="currentColor" />
    </svg>
  ),
  brief: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="inline-block align-middle">
      <rect x="3" y="7" width="18" height="13" rx="2" stroke="currentColor" />
      <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" stroke="currentColor" />
    </svg>
  ),
  chat: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="inline-block align-middle">
      <path d="M21 14a7 7 0 0 1-7 7H6l-4 2 2-4v-5a7 7 0 1 1 17 0Z" stroke="currentColor" />
    </svg>
  ),
  user: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="inline-block align-middle">
      <circle cx="12" cy="8" r="4" stroke="currentColor" />
      <path d="M4 21c0-3.3 5-5 8-5s8 1.7 8 5" stroke="currentColor" />
    </svg>
  ),
};

/* ---------- Utilities ---------- */

/** Normalize a candidate string/object into a safe string or null */
function normalizeCandidateRaw(candidate) {
  if (!candidate && candidate !== 0) return null;
  // If candidate is an object with url
  if (typeof candidate === "object") {
    if (candidate.url && typeof candidate.url === "string" && candidate.url.trim()) return candidate.url.trim();
    return null;
  }
  if (typeof candidate !== "string") return null;
  const t = candidate.trim();
  if (!t) return null;
  const lower = t.toLowerCase();
  if (lower === "undefined" || lower === "null" || lower === "—" || lower === "-" ) return null;
  return t;
}

/** Safe wrapper that resolves a single candidate to a usable URL or null
 * - protects against passing "undefined" to imageLink
 * - if imageLink returns suspicious value we ignore it
 */
function resolveSafeImage(candidate) {
  const raw = normalizeCandidateRaw(candidate);
  if (!raw) return null;

  try {
    const maybe = imageLink(raw) || raw || "";
    if (typeof maybe !== "string" || !maybe.trim()) return null;
    const trimmed = maybe.trim();
    // reject obviously broken results
    const badPatterns = ["undefined", "null", ":///", "://undefined", "/undefined", "undefined/"];
    for (const p of badPatterns) {
      if (trimmed.includes(p)) return null;
    }
    // If it's a relative path (starts with '/'), make it absolute client-side
    if (trimmed.startsWith("/")) {
      if (typeof window !== "undefined" && window.location && window.location.origin) {
        return `${window.location.origin}${trimmed}`;
      }
      return trimmed;
    }
    return trimmed;
  } catch (err) {
    // If imageLink throws for some reason, fall back to raw if it looks absolute
    if (raw.startsWith("http://") || raw.startsWith("https://") || raw.startsWith("data:")) return raw;
    return null;
  }
}

/** Compose display name from all plausible fields and ignore placeholder markers */
function getDisplayName(m) {
  if (!m || typeof m !== "object") return "—";
  const candOrder = [
    m.fullName,
    m.name,
    m.displayName,
    (m.firstName || "") + " " + (m.lastName || ""),
    m.profile && (m.profile.fullName || m.profile.name),
    m.attributes && m.attributes.displayName,
  ];
  for (let c of candOrder) {
    if (typeof c === "string") {
      const t = c.trim();
      if (t && t.toLowerCase() !== "—" && t !== "-" && t.toLowerCase() !== "undefined") return t;
    }
  }
  return "—";
}

/** Pull possible avatar candidates (strings or objects) in the same order you use elsewhere */
function avatarCandidates(m) {
  if (!m || typeof m !== "object") return [];
  const arr = [
    m.avatarUpload,
    m.photoUpload,
    m.logoUpload,
    Array.isArray(m.images) && m.images.length ? m.images[0] : null,
    m.avatar,
    m.picture,
    m.profile && m.profile.avatar,
    m.attributes && m.attributes.avatar,
  ];
  return arr.filter(Boolean);
}

/* ---------- Component ---------- */

export default function BusinessTeam({
  heading = "Team",
  subheading = "Meet the people behind the work.",
  members = [],
  loading = false,
  onMessage,
  onMeet,
  onProfile,
}) {
  const data = Array.isArray(members) ? members : [];

  // small debug - useful while you're in dev; remove in final prod if you want silence
  React.useEffect(() => {
    if (data.length) {
      console.group("BusinessTeam DEBUG");
      console.log("sample members (first 3):", data.slice(0, 3));
      data.slice(0, 5).forEach((m, i) => {
        const name = getDisplayName(m);
        const av = avatarCandidates(m).map(normalizeCandidateRaw).map(resolveSafeImage);
        console.log(`member[${i}] name ->`, name, " avatarCandidates ->", av);
      });
      console.groupEnd();
    } else {
      console.debug("BusinessTeam: no members");
    }
  }, [data]);

  const [q, setQ] = React.useState("");
  const [dept, setDept] = React.useState("All");
  const [sort, setSort] = React.useState("name");

  const depts = React.useMemo(
    () => ["All", ...Array.from(new Set(data.map((d) => d && d.dept).filter(Boolean)))],
    [data]
  );

  const filtered = React.useMemo(() => {
    const t = q.trim().toLowerCase();
    const arr = data.filter((m) => {
      const name = getDisplayName(m);
      const title = m && (m.title || m.position || m.jobTitle || m.role) || "";
      const text = [name, title, m && m.dept, m && m.city, m && m.country, ...(m && Array.isArray(m.skills) ? m.skills : [])]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const byDept = dept === "All" || (m && m.dept) === dept;
      return (!t || text.includes(t)) && byDept;
    });

    arr.sort((a, b) => {
      const A = sort === "dept" ? (a && a.dept) || "" : getDisplayName(a);
      const B = sort === "dept" ? (b && b.dept) || "" : getDisplayName(b);
      return A.localeCompare(B, undefined, { sensitivity: "base" });
    });

    return arr;
  }, [data, q, dept, sort]);

  return (
    <section id="team" className="bg-white rounded-lg shadow-sm p-4 md:p-6">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">{heading}</h3>
          {subheading ? <p className="text-sm text-slate-500 mt-1">{subheading}</p> : null}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-md px-3 py-2">
            <div className="text-slate-400">{I.search()}</div>
            <input
              className="bg-transparent outline-none text-sm w-[220px] sm:w-80"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name, role, skill, or city…"
              aria-label="Search team"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={dept}
              onChange={(e) => setDept(e.target.value)}
              aria-label="Filter by department"
              className="rounded-md border border-slate-200 px-3 py-2 text-sm bg-white"
            >
              {depts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              aria-label="Sort"
              className="rounded-md border border-slate-200 px-3 py-2 text-sm bg-white"
            >
              <option value="name">Sort: Name</option>
              <option value="dept">Sort: Department</option>
            </select>
          </div>
        </div>
      </header>

      {/* Loading */}
      {loading ? (
        <div className="py-8 text-center text-sm text-slate-500">Loading…</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((m, idx) => {
            const key = (m && (m.id || m.entityId || `member-${idx}`)) || `member-${idx}`;
            const fullName = getDisplayName(m);
            // find the first usable avatar candidate and resolve it
            const avatar = avatarCandidates(m)
              .map(normalizeCandidateRaw)
              .map(resolveSafeImage)
              .find(Boolean) || null;

            const title = m && (m.title || m.position || m.jobTitle || m.role) || "—";
            const location = (m && m.city ? m.city : "") + (m && m.country ? (m && m.city ? ", " : "") + m.country : "");

            return (
              <article
                key={key}
                id={`team-${key}`}
                className="flex flex-col bg-slate-50 rounded-lg overflow-hidden border border-slate-100"
              >
                <div className="w-full h-36 flex-shrink-0 bg-slate-100">
                  {avatar ? (
                    <img
                      src={avatar}
                      alt={fullName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        const parent = e.currentTarget.parentElement;
                        if (parent) parent.classList.add("bg-slate-200", "flex", "items-center", "justify-center");
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl font-semibold text-slate-500">
                      {fullName && fullName !== "—" ? fullName[0] : "—"}
                    </div>
                  )}
                </div>

                <div className="p-3 flex-1 flex flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-semibold text-slate-800 truncate">{fullName}</h4>
                    {m && m.open ? (
                      <span className="text-emerald-500 text-xs ml-2" title="Open to meetings">
                        ●
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-2 text-xs text-slate-500 flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1">
                        <I.brief /> <span className="truncate">{title}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1">
                        <I.map /> <span className="truncate">{location || "—"}</span>
                      </span>
                    </div>
                    {m && m.dept ? <div className="text-xs text-slate-400">{m.dept}</div> : null}
                  </div>

                  {Array.isArray(m && m.skills) && m.skills.length ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {m.skills.slice(0, 4).map((s) => (
                        <span key={s} className="text-xs px-2 py-1 bg-white border border-slate-200 rounded-full">
                          {s}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  <div className="mt-4 flex items-center gap-2">
                    <button
                      type="button"
                      className="flex-1 inline-flex items-center gap-2 justify-center px-3 py-2 text-sm rounded-md border border-slate-200 bg-white hover:bg-slate-100"
                      onClick={() => (onProfile ? onProfile(m) : window.alert(`Open profile: ${fullName}`))}
                    >
                      <I.user /> Profile
                    </button>

                    <button
                      type="button"
                      className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
                      onClick={() => (onMessage ? onMessage(m) : window.alert(`Message: ${fullName}`))}
                    >
                      <I.chat /> Message
                    </button>

                    <button
                      type="button"
                      className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md border border-slate-200 bg-white hover:bg-slate-100"
                      onClick={() => (onMeet ? onMeet(m) : window.alert(`Book meeting with ${fullName}`))}
                    >
                      Meet
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {!loading && !filtered.length && <div className="py-8 text-center text-sm text-slate-500">No team members match your filters.</div>}

      <footer className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm text-slate-600">
        <div className="flex items-center gap-3">
          <div>
            <div className="text-lg font-semibold text-slate-800">{data.length}</div>
            <div className="text-xs text-slate-500">People</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-slate-800">{data.filter((x) => x && x.open).length}</div>
            <div className="text-xs text-slate-500">Open to meet</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-slate-800">{Math.max(0, depts.length - 1)}</div>
            <div className="text-xs text-slate-500">Departments</div>
          </div>
        </div>
      </footer>
    </section>
  );
}

BusinessTeam.propTypes = {
  heading: PropTypes.string,
  subheading: PropTypes.string,
  members: PropTypes.array,
  loading: PropTypes.bool,
  onMessage: PropTypes.func,
  onMeet: PropTypes.func,
  onProfile: PropTypes.func,
};
