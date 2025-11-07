import React from "react";
import PropTypes from "prop-types";
import imageLink from "../../utils/imageLink";

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

  const [q, setQ] = React.useState("");
  const [dept, setDept] = React.useState("All");
  const [sort, setSort] = React.useState("name");

  const depts = React.useMemo(
    () => ["All", ...Array.from(new Set(data.map((d) => d.dept).filter(Boolean)))],
    [data]
  );

  const filtered = React.useMemo(() => {
    const t = q.trim().toLowerCase();
    let arr = data.filter((m) => {
      const text = [
        m.fullName,
        m.title,
        m.dept,
        m.city,
        m.country,
        ...(m.skills || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const byDept = dept === "All" || m.dept === dept;
      return (!t || text.includes(t)) && byDept;
    });
    arr.sort((a, b) => {
      const A = (sort === "dept" ? (a.dept || "") : (a.fullName || ""));
      const B = (sort === "dept" ? (b.dept || "") : (b.fullName || ""));
      return A?.localeCompare(B, undefined, { sensitivity: "base" });
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
          {/* Search */}
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

          {/* Filters */}
          <div className="flex items-center gap-2">
            <select
              value={dept}
              onChange={(e) => setDept(e.target.value)}
              aria-label="Filter by department"
              className="rounded-md border border-slate-200 px-3 py-2 text-sm bg-white"
            >
              {depts?.map((d) => (
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
          {filtered?.map((m) => (
            <article
              key={m.id}
              id={`team-${m.id}`}
              className="flex flex-col bg-slate-50 rounded-lg overflow-hidden border border-slate-100"
            >
              {/* Avatar */}
              <div
                className="w-full h-36 flex-shrink-0 bg-center bg-cover"
                style={{
                  backgroundImage: `url(${imageLink(m.avatar) || ""})`,
                }}
                aria-hidden
              />

              <div className="p-3 flex-1 flex flex-col">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-semibold text-slate-800 truncate">{m.fullName || "—"}</h4>
                  {m.open ? <span className="text-emerald-500 text-xs ml-2" title="Open to meetings">●</span> : null}
                </div>

                <div className="mt-2 text-xs text-slate-500 flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1"><I.brief /> <span className="truncate">{m.title || "—"}</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1"><I.map /> <span className="truncate">{(m.city || "") + (m.country ? (m.city ? ", " : "") + m.country : "")}</span></span>
                  </div>
                  {m.dept ? <div className="text-xs text-slate-400">{m.dept}</div> : null}
                </div>

                {Array.isArray(m.skills) && m.skills.length ? (
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
                    onClick={() => (onProfile ? onProfile(m) : window.alert(`Open profile: ${m.fullName}`))}
                  >
                    <I.user /> Profile
                  </button>

                  <button
                    type="button"
                    className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
                    onClick={() => (onMessage ? onMessage(m) : window.alert(`Message: ${m.fullName}`))}
                  >
                    <I.chat /> Message
                  </button>

                  <button
                    type="button"
                    className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md border border-slate-200 bg-white hover:bg-slate-100"
                    onClick={() => (onMeet ? onMeet(m) : window.alert(`Book meeting with ${m.fullName}`))}
                  >
                    Meet
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !filtered.length && (
        <div className="py-8 text-center text-sm text-slate-500">No team members match your filters.</div>
      )}

      {/* Footer stats */}
      <footer className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm text-slate-600">
        <div className="flex items-center gap-3">
          <div>
            <div className="text-lg font-semibold text-slate-800">{data.length}</div>
            <div className="text-xs text-slate-500">People</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-slate-800">{data.filter((x) => x.open).length}</div>
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
  members: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      fullName: PropTypes.string,
      title: PropTypes.string,
      dept: PropTypes.string,
      city: PropTypes.string,
      country: PropTypes.string,
      avatar: PropTypes.string,
      open: PropTypes.bool,
      skills: PropTypes.arrayOf(PropTypes.string),
      peerId: PropTypes.string,
      entityType: PropTypes.string,
      entityId: PropTypes.string,
    })
  ),
  loading: PropTypes.bool,
  onMessage: PropTypes.func,
  onMeet: PropTypes.func,
  onProfile: PropTypes.func,
};
