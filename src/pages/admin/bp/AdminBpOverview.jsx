import React from "react";
import {
  useAdminOverviewQuery,
  useAdminListProfilesQuery,
} from "../../../features/bp/BPAdminApiSlice";
import imageLink from "../../../utils/imageLink";
import "./admin-bp.css";

/* ---- tiny inline icons ---- */
const I = {
  check: ({ size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M20 6 9 17 4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  search: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M20 20l-3.2-3.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  ),
};

function Stat({ k, v }) {
  return (
    <div className="abp-tile">
      <div className="abp-k">{k}</div>
      <div className="abp-v">{v}</div>
    </div>
  );
}

/* ---- csv/xls helpers (unchanged) ---- */
const esc = (v) => `"${String(v ?? "").replaceAll('"', '""')}"`;
function download(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}
function buildOverviewCsv({ totals = {}, sectors = [], topProfiles = [] }){
  const parts = [];
  parts.push("# Totals");
  parts.push(["metric","value"].join(","));
  Object.entries(totals).forEach(([k,v]) => parts.push([esc(k), esc(v)].join(",")));
  parts.push("\n# Sectors");
  parts.push(["sector","count"].join(","));
  sectors.forEach(s => parts.push([esc(s.sector||""), esc(s.count||0)].join(",")));
  parts.push("\n# Top Profiles");
  parts.push(["id","name","slug","published","items"].join(","));
  topProfiles.forEach(p => parts.push([esc(p.id),esc(p.name),esc(p.slug),esc(p.published),esc(p.items)].join(",")));
  return parts.join("\r\n");
}
function buildProfilesCsv(list = []){
  const head = ["id","name","slug","published","featured","industries","countries","createdAt","updatedAt"];
  const lines = [head.join(",")];
  list.forEach(p=>{
    lines.push([
      esc(p.id), esc(p.name), esc(p.slug),
      esc(p.published), esc(p.featured),
      esc((p.industries||[]).join("|")),
      esc((p.countries||[]).join("|")),
      esc(p.createdAt || ""), esc(p.updatedAt || "")
    ].join(","));
  });
  return lines.join("\r\n");
}
function tableSection(title, headers=[], rows=[]){
  const th = headers.map(h=>`<th style="text-align:left;border-bottom:1px solid #ddd;padding:6px">${h}</th>`).join("");
  const trs = rows.map(r=>`<tr>${r.map(c=>`<td style="padding:6px">${c ?? ""}</td>`).join("")}</tr>`).join("");
  return `
    <h3 style="font:700 14px system-ui;margin:12px 0 6px">${title}</h3>
    <table style="border-collapse:collapse;width:100%;font:12px system-ui">${th?`<thead><tr>${th}</tr></thead>`:""}<tbody>${trs}</tbody></table>
  `;
}
function buildOverviewExcelBlob({ totals={}, sectors=[], topProfiles=[] }){
  const totalsRows = Object.entries(totals).map(([k,v])=>[k, v]);
  const sectorRows = sectors.map(s=>[s.sector||"", s.count||0]);
  const topRows = topProfiles.map(p=>[p.id, p.name, p.slug, p.published ? "yes":"no", p.items||0]);
  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office"
          xmlns:x="urn:schemas-microsoft-com:office:excel"
          xmlns="http://www.w3.org/TR/REC-html40">
      <head><meta charset="utf-8" /></head>
      <body>
        ${tableSection("Totals", ["Metric","Value"], totalsRows)}
        ${tableSection("Sectors", ["Sector","Count"], sectorRows)}
        ${tableSection("Top Profiles", ["ID","Name","Slug","Published","Items"], topRows)}
      </body>
    </html>`;
  return new Blob([html], { type: "application/vnd.ms-excel" });
}
function buildProfilesExcelBlob(list=[]){
  const rows = list.map(p=>[
    p.id, p.name, p.slug, p.published?"yes":"no", p.featured?"yes":"no",
    (p.industries||[]).join(" | "),
    (p.countries||[]).join(" | "),
    p.createdAt ? new Date(p.createdAt).toLocaleString() : "",
    p.updatedAt ? new Date(p.updatedAt).toLocaleString() : "",
  ]);
  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office"
          xmlns:x="urn:schemas-microsoft-com:office:excel"
          xmlns="http://www.w3.org/TR/REC-html40">
      <head><meta charset="utf-8" /></head>
      <body>
        ${tableSection("Profiles", ["ID","Name","Slug","Published","Featured","Industries","Countries","Created At","Updated At"], rows)}
      </body>
    </html>`;
  return new Blob([html], { type: "application/vnd.ms-excel" });
}

/* ---- sector normalizer: take only the top-level label (no subsectors) ---- */
function pickSectorsMaxOne(inds = []) {
  const S = (x) => String(x || "");
  return inds
    .map((x) => S(x).split(/>|\/|:|\|/)[0].trim()) // keep before any delimiter
    .filter(Boolean)
    .slice(0, 1);
}

export default function AdminBpOverview() {
  const { data: ov, isFetching } = useAdminOverviewQuery();
  const totals         = ov?.data?.totals || {};
  const sectorsRaw     = ov?.data?.sectors || [];
  const topProfiles    = ov?.data?.topProfiles || [];
  const recentProfiles = (ov?.data?.recentProfiles || []).slice(0, 5);

  // filters/paging
  const [q, setQ] = React.useState("");
  const [published, setPublished] = React.useState("all");
  const [limit, setLimit] = React.useState(5);
  const [page, setPage] = React.useState(1);

  const { data: listResp, isFetching: isListLoading } =
    useAdminListProfilesQuery({ q, published, page, limit });

  const profiles = listResp?.data || [];
  const total    = listResp?.total || 0;
  const maxPage  = Math.max(1, Math.ceil(total / Math.max(1, limit)));

  // quality signals pool
  const qualityPool   = profiles.length ? profiles : recentProfiles;
  const missingLogo   = qualityPool.filter(p => !p.logoUpload).slice(0, 10);
  const noIndustries  = qualityPool.filter(p => !p.industries || !p.industries.length).slice(0, 10);

  // sectors coverage view
  const [showAllSectors, setShowAllSectors] = React.useState(false);
  const sectorsSorted  = [...sectorsRaw].sort((a,b)=>(b.count||0)-(a.count||0));
  const maxSectorCount = sectorsSorted.reduce((m, s) => Math.max(m, s.count||0), 1);
  const sectors        = showAllSectors ? sectorsSorted : sectorsSorted.slice(0, 12);

  // exports
  const exportOverviewCsv = () => download(new Blob([buildOverviewCsv({ totals, sectors: sectorsRaw, topProfiles })], { type:"text/csv;charset=utf-8" }), "bp_overview_export.csv");
  const exportProfilesCsv = () => download(new Blob([buildProfilesCsv(profiles)], { type:"text/csv;charset=utf-8" }), "bp_profiles_export.csv");
  const exportOverviewXls = () => download(buildOverviewExcelBlob({ totals, sectors: sectorsRaw, topProfiles }), "bp_overview.xls");
  const exportProfilesXls = () => download(buildProfilesExcelBlob(profiles), "bp_profiles.xls");

  return (
    <section className="abp">
      <header className="abp-head">
        <div>
          <h1>Business Profiles — Overview</h1>
          <p>Global stats, coverage, and quality signals.</p>
        </div>
        <div className="abp-actions">
          <button type="button" className="btn" onClick={exportOverviewCsv}>Export CSV</button>
          <button type="button" className="btn" onClick={exportOverviewXls}>Export Excel</button>
          <button type="button" className="btn-ghost" onClick={exportProfilesCsv}>Export Profiles CSV</button>
          <button type="button" className="btn-ghost" onClick={exportProfilesXls}>Export Profiles Excel</button>
        </div>
      </header>

      {isFetching ? <div className="abp-skel-lg" /> : null}

      {/* KPIs */}
      <div className="abp-tiles">
        <Stat k="Profiles"   v={totals.profiles ?? 0} />
        <Stat k="Published"  v={totals.profilesPublished ?? 0} />
        <Stat k="Pending"    v={totals.profilesPending ?? 0} />
        <Stat k="Items"      v={totals.items ?? 0} />
        <Stat k="Products"   v={totals.products ?? 0} />
        <Stat k="Services"   v={totals.services ?? 0} />
      </div>

      <div className="abp-grid">
        {/* Sectors coverage */}
        <div className="abp-card p-4">
          <div className="abp-card-head">
            <h3>Sectors coverage</h3>
            {sectorsSorted.length > 12 ? (
              <button type="button" className="btn-ghost" onClick={()=>setShowAllSectors(v=>!v)}>
                {showAllSectors ? "Show top 12" : "Show all"}
              </button>
            ) : null}
          </div>
          <div className="abp-bars">
            {sectors.length ? sectors.map((s) => {
              const c = s.count || 0;
              const pct = Math.round((c / maxSectorCount) * 100);
              return (
                <div key={s.sector} className="abp-bar">
                  <div className="abp-bar-head">
                    <span className="abp-tag">{s.sector}</span>
                    <span className="abp-mono">{c} • {pct}%</span>
                  </div>
                  <div className="abp-bar-track" aria-hidden="true">
                    <div className="abp-bar-fill" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            }) : <div className="abp-muted">No sectors yet.</div>}
          </div>
        </div>

        {/* Top profiles by items */}
        <div className="abp-card">
          <h3>Top profiles by items</h3>
          <ul className="abp-list">
            {topProfiles.map((p) => (
              <li key={p.id} className="abp-row">
                <div className="abp-row-l">
                  {p.logoUpload ? (
                    <img className="abp-logo" src={imageLink(p.logoUpload)} alt={p.name} />
                  ) : (
                    <div className="abp-logo abp-logo-ph" />
                  )}
                  <div>
                    <div className="abp-strong">{p.name}</div>
                    <div className="abp-sub">{p.slug}</div>
                  </div>
                </div>
                <div className="abp-row-r">
                  <span className={`abp-badge ${p.published ? "ok" : ""}`}>
                    {p.published ? "Published" : "Pending"}
                  </span>
                  <span className="abp-mono">{p.items} items</span>
                </div>
              </li>
            ))}
            {!topProfiles.length && <li className="abp-muted">No data.</li>}
          </ul>
        </div>

        {/* Recently created (5) */}
        <div className="abp-card">
          <h3>Recently created</h3>
          <ul className="abp-list">
            {recentProfiles.map(p=>(
              <li key={p.id} className="abp-row">
                <div className="abp-row-l">
                  {p.logoUpload ? (
                    <img className="abp-logo" src={imageLink(p.logoUpload)} alt={p.name} />
                  ) : <div className="abp-logo abp-logo-ph" />}
                  <div>
                    <div className="abp-strong">{p.name}</div>
                    <div className="abp-sub">{p.slug}</div>
                  </div>
                </div>
                <div className="abp-row-r">
                  <span className={`abp-badge ${p.published ? "ok" : ""}`}>
                    {p.published ? "Published" : "Pending"}
                  </span>
                  <span className="abp-mono">
                    {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : ""}
                  </span>
                </div>
              </li>
            ))}
            {!recentProfiles.length && <li className="abp-muted">No recent profiles.</li>}
          </ul>
        </div>

        {/* Profiles — filters + pagination (polished toolbar); Sectors-only chips (max 1) */}
        <div className="abp-card">
          <div className="abp-card-head m-4">
            <h3 className="fs-5 fw-bolder">Profiles</h3>

            {/* Toolbar layout: tighter, aligned, labeled selects */}
            <div
              className="abp-toolbar "
              style={{ gap: 12, flexWrap: "wrap", alignItems: "stretch" }}
            >
              {/* Search box */}
              <div
                className="abp-inp"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  paddingInline: 12,
                  minWidth: 280,
                  height: 38,
                }}
                title="Search"
              >
                <I.search />
                <input
                  style={{
                    border: "none",
                    outline: "none",
                    width: "100%",
                    background: "transparent",
                    height: 34,
                  }}
                  placeholder="Search name, tagline, industries…"
                  value={q}
                  onChange={(e)=>{ setQ(e.target.value); setPage(1); }}
                  aria-label="Search profiles"
                />
              </div>

              {/* Published filter with label */}
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                <span className="abp-sub" style={{ fontSize: 12, opacity: .75 }}>Status</span>
                <select
                  className="abp-inp"
                  value={published}
                  onChange={(e)=>{ setPublished(e.target.value); setPage(1); }}
                  aria-label="Published filter"
                  title="Filter by publish status"
                  style={{ minWidth: 160, height: 38 }}
                >
                  <option value="all">All statuses</option>
                  <option value="yes">Published</option>
                  <option value="no">Pending</option>
                </select>
              </div>

              {/* Per page with label */}
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                <span className="abp-sub" style={{ fontSize: 12, opacity: .75 }}>Per page</span>
                <select
                  className="abp-inp"
                  value={String(limit)}
                  onChange={(e)=>{ setLimit(Number(e.target.value)|| 5); setPage(1); }}
                  aria-label="Items per page"
                  title="Items per page"
                  style={{ minWidth: 140, height: 38 }}
                >
                  {[5,10,20,30,50,100].map(n => <option key={n} value={n}>{n}/page</option>)}
                </select>
              </div>
            </div>
          </div>

          {isListLoading ? <div className="abp-skel" /> : null}

          <ul className="abp-list">
            {profiles.map(p=>{
              const sectorChips = pickSectorsMaxOne(p.industries || []);
              return (
                <li key={p.id} className="abp-row">
                  <div className="abp-row-l">
                    {p.logoUpload ? (
                      <img className="abp-logo" src={imageLink(p.logoUpload)} alt={p.name} />
                    ) : <div className="abp-logo abp-logo-ph" />}
                    <div>
                      <div className="abp-strong">{p.name}</div>
                      <div className="abp-sub">{p.slug}</div>

                      {sectorChips.length ? (
                        <div className="abp-tags">
                          <span className="abp-tag soft">{sectorChips[0]}</span>
                        </div>
                      ) : null}
                    </div>
                  </div>
                  <div className="abp-row-r">
                    <span className={`abp-badge ${p.published ? "ok" : ""}`}>
                      {p.published ? "Published" : "Pending"}
                    </span>
                    <span className="abp-mono">
                      {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : ""}
                    </span>
                  </div>
                </li>
              );
            })}
            {!profiles.length && !isListLoading && <li className="abp-muted">No profiles match.</li>}
          </ul>

          <div className="abp-pager">
            <button
              type="button"
              className="btn-ghost"
              disabled={page<=1}
              onClick={()=> setPage(p=>Math.max(1,p-1))}
              title="Previous page"
            >Prev</button>
            <span className="abp-mono">Page {page} / {maxPage}</span>
            <button
              type="button"
              className="btn"
              disabled={page>=maxPage}
              onClick={()=> setPage(p=>Math.min(maxPage,p+1))}
              title="Next page"
            >Next</button>
          </div>
        </div>

        {/* Quality signals */}
        <div className="abp-card">
          <h3>Quality signals</h3>
          <div className="abp-qgrid">
            <div>
              <div className="abp-subh" style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span>Missing logo</span>
                <span className={`abp-badge ${missingLogo.length ? "warn" : "ok"}`}>{missingLogo.length}</span>
              </div>
              <ul className="abp-list compact">
                {missingLogo.map(p=>(
                  <li key={`nologo-${p.id}`} className="abp-row">
                    <div className="abp-row-l">
                      <div className="abp-logo abp-logo-ph" />
                      <div>
                        <div className="abp-strong">{p.name}</div>
                        <div className="abp-sub">{p.slug}</div>
                      </div>
                    </div>
                    <div className="abp-row-r"><span className="abp-badge warn">Fix</span></div>
                  </li>
                ))}
                {!missingLogo.length && (
                  <li className="abp-row">
                    <div className="abp-row-l" style={{ gap:10, alignItems:"center" }}>
                      <span className="abp-badge ok" title="All good"><I.check /></span>
                      <div className="abp-strong">All good here</div>
                    </div>
                  </li>
                )}
              </ul>
            </div>

            <div>
              <div className="abp-subh" style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span>No industries</span>
                <span className={`abp-badge ${noIndustries.length ? "warn" : "ok"}`}>{noIndustries.length}</span>
              </div>
              <ul className="abp-list compact">
                {noIndustries.map(p=>(
                  <li key={`noind-${p.id}`} className="abp-row">
                    <div className="abp-row-l">
                      {p.logoUpload ? (
                        <img className="abp-logo" src={imageLink(p.logoUpload)} alt={p.name} />
                      ) : <div className="abp-logo abp-logo-ph" />}
                      <div>
                        <div className="abp-strong">{p.name}</div>
                        <div className="abp-sub">{p.slug}</div>
                      </div>
                    </div>
                    <div className="abp-row-r"><span className="abp-badge warn">Fix</span></div>
                  </li>
                ))}
                {!noIndustries.length && (
                  <li className="abp-row">
                    <div className="abp-row-l" style={{ gap:10, alignItems:"center" }}>
                      <span className="abp-badge ok" title="All good"><I.check /></span>
                      <div className="abp-strong">All good here</div>
                    </div>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
