import React from "react";
import PropTypes from "prop-types";
import "./business-team.css";
import imageLink from "../../utils/imageLink";

const I = {
  search: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/><path d="M20 20l-3-3" stroke="currentColor" strokeWidth="2"/></svg>),
  map:    () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11Z" stroke="currentColor"/><circle cx="12" cy="10" r="2" stroke="currentColor"/></svg>),
  brief:  () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="3" y="7" width="18" height="13" rx="2" stroke="currentColor"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" stroke="currentColor"/></svg>),
  chat:   () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M21 14a7 7 0 0 1-7 7H6l-4 2 2-4v-5a7 7 0 1 1 17 0Z" stroke="currentColor"/></svg>),
  user:   () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="currentColor"/><path d="M4 21c0-3.3 5-5 8-5s8 1.7 8 5" stroke="currentColor"/></svg>),
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
    () => ["All", ...Array.from(new Set(data.map(d => d.dept).filter(Boolean)))],
    [data]
  );

  const filtered = React.useMemo(() => {
    const t = q.trim().toLowerCase();
    let arr = data.filter(m => {
      const text = [
        m.fullName, m.title, m.dept, m.city, m.country, ...(m.skills||[])
      ].filter(Boolean).join(" ").toLowerCase();
      const byDept = dept === "All" || m.dept === dept;
      return (!t || text.includes(t)) && byDept;
    });
    arr.sort((a,b) => {
      const A = (sort === "dept" ? (a.dept || "") : (a.fullName || ""));
      const B = (sort === "dept" ? (b.dept || "") : (b.fullName || ""));
      return A?.localeCompare(B, undefined, { sensitivity:"base" });
    });
    return arr;
  }, [data, q, dept, sort]);

  return (
    <section className="bteam" id="team">
      <header className="bt-head">
        <div>
          <h3 className="bt-title">{heading}</h3>
          {subheading ? <p className="bt-sub">{subheading}</p> : null}
        </div>

        <div className="bt-tools">
          <div className="bt-search">
            <I.search />
            <input
              value={q}
              onChange={(e)=>setQ(e.target.value)}
              placeholder="Search name, role, skill, or city…"
              aria-label="Search team"
            />
          </div>
          <div className="bt-selects">
            <select value={dept} onChange={(e)=>setDept(e.target.value)} aria-label="Filter by department">
              {depts?.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <select value={sort} onChange={(e)=>setSort(e.target.value)} aria-label="Sort">
              <option value="name">Sort: Name</option>
              <option value="dept">Sort: Department</option>
            </select>
          </div>
        </div>
      </header>

      {loading ? <div className="bt-loading">Loading…</div> : (
        <div className="bt-grid">
          {filtered?.map(m => (
            <article key={m.id} className="bt-card" id={`team-${m.id}`}>
              <div
                className="bt-avatar"
                style={{
                  backgroundImage:`url(${imageLink(m.avatar)||""})`,
                  backgroundSize:"cover",
                  backgroundPosition:"center",
                  borderRadius:"12px",
                }}
              />
              <div className="bt-body">
                <div className="bt-row">
                  <h4 className="bt-name">{m.fullName || "—"}</h4>
                  {m.open ? <span className="bt-open" title="Open to meetings">●</span> : null}
                </div>
                <div className="bt-meta">
                  <span className="bt-role"><I.brief/> {m.title || "—"}</span>
                  <span className="bt-loc"><I.map/> {(m.city||"") + (m.country ? (m.city ? ", " : "") + m.country : "")}</span>
                  {m.dept ? <span className="bt-dept">{m.dept}</span> : null}
                </div>
                {Array.isArray(m.skills) && m.skills.length ? (
                  <div className="bt-skills">
                    {m.skills.slice(0,4)?.map(s => <span key={s} className="chip">{s}</span>)}
                  </div>
                ) : null}
                <div className="bt-actions">
                  <button type="button" className="btn-ghost"
                    onClick={()=> onProfile ? onProfile(m) : window.alert(`Open profile: ${m.fullName}`)}>
                    <I.user/> Profile
                  </button>
                  <button type="button" className="btn"
                    onClick={()=> onMessage ? onMessage(m) : window.alert(`Message: ${m.fullName}`)}>
                    <I.chat/> Message
                  </button>
                  <button type="button" className="btn-alt"
                    onClick={()=> onMeet ? onMeet(m) : window.alert(`Book meeting with ${m.fullName}`)}>
                    Meet
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {!loading && !filtered.length && (
        <div className="bt-empty">No team members match your filters.</div>
      )}

      <footer className="bt-foot">
        <div className="stat"><span className="k">{data.length}</span><span className="l">People</span></div>
        <div className="stat"><span className="k">{data.filter(x=>x.open).length}</span><span className="l">Open to meet</span></div>
        <div className="stat"><span className="k">{depts.length-1}</span><span className="l">Departments</span></div>
      </footer>
    </section>
  );
}

BusinessTeam.propTypes = {
  heading: PropTypes.string,
  subheading: PropTypes.string,
  members: PropTypes.arrayOf(PropTypes.shape({
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
  })),
  loading: PropTypes.bool,
  onMessage: PropTypes.func,
  onMeet: PropTypes.func,
  onProfile: PropTypes.func,
};
