// src/pages/admin/bp/AdminBpTools.jsx
import React, { useMemo, useState, useCallback } from "react";
import {
  // Profiles & items
  useAdminListProfilesQuery,
  useAdminDeleteProfileMutation,
  useAdminListItemsQuery,
  useAdminDeleteItemMutation,
  useAdminHideItemMutation,
  // Taxonomy
  useAdminTaxonomyListQuery,
  useAdminTaxonomyAddSectorMutation,
  useAdminTaxonomyAddSubsectorsMutation,
  useAdminTaxonomyDeleteSectorMutation,
  useAdminTaxonomyDeleteSubsectorMutation,
} from "../../../features/bp/BPAdminApiSlice";
import imageLink from "../../../utils/imageLink";
import "./admin-bp.css";

function askConfirm(msg) {
  return typeof window !== "undefined" && typeof window.confirm === "function"
    ? window.confirm(msg)
    : true;
}

/* ---------- Tiny inline icons ---------- */
const I = {
  search: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
  trash: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 7h16M9 7V5h6v2M6 7l1 12h10l1-12" stroke="currentColor" strokeWidth="1.5" fill="none" />
    </svg>
  ),
  eyeOff: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 3l18 18M10.6 10.6A3 3 0 0012 15a3 3 0 002.4-4.4M21 12s-3.6 6-9 6c-1.3 0-2.5-.3-3.6-.8M3 12s3.6-6 9-6c.8 0 1.7.1 2.4.4" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    </svg>
  ),
  plus: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
};

function Chip({ children, soft }) {
  return <span className={`abp-tag ${soft ? "soft" : ""}`}>{children}</span>;
}

export default function AdminBpTools() {
  /* ============================================================
   *  PROFILES — keep this block’s design/UX (your request)
   * ============================================================ */
  const [q, setQ] = useState("");
  const [published, setPublished] = useState("all"); // all|yes|no
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const { data: profResp, isFetching: profLoading } =
    useAdminListProfilesQuery({ q, published, page, limit });

  const profiles = profResp?.data || [];
  const totalProfiles = profResp?.total || 0;
  const maxPage = Math.max(1, Math.ceil(totalProfiles / Math.max(1, limit)));

  const [deleteProfile, { isLoading: deletingProfile }] = useAdminDeleteProfileMutation();

  const [selectedProfileId, setSelectedProfileId] = useState("");
  const selectedProfile = useMemo(
    () => profiles.find(p => String(p.id) === String(selectedProfileId)) || null,
    [profiles, selectedProfileId]
  );

  const runSearch = () => { setPage(1); };

  const onDeleteProfile = async (id) => {
    if (!id) return;
    if (!askConfirm("Delete this Business Profile and all its items?")) return;
    try {
      await deleteProfile(id).unwrap();
      if (selectedProfileId === id) setSelectedProfileId("");
    } catch (e) {
      console.error(e);
      alert("Failed to delete profile.");
    }
  };

  /* ============================================================
   *  ITEMS of the ONE selected profile — redesigned with Bootstrap
   * ============================================================ */
  const { data: itemsResp, isFetching: itemsLoading, refetch: refetchItems } = useAdminListItemsQuery(
    { profileId: selectedProfileId || "", page: 1, limit: 20 },
    { skip: !selectedProfileId }
  );
  const items = itemsResp?.data || [];
  const [deleteItem] = useAdminDeleteItemMutation();
  const [hideItem] = useAdminHideItemMutation();

  const onDeleteItem = useCallback(async (id) => {
    if (!id) return;
    if (!askConfirm("Delete this item?")) return;
    try {
      await deleteItem({ itemId: id }).unwrap(); // route is /admin/bp/items/:itemId
      refetchItems();
    } catch (e) {
      console.error(e);
      alert("Failed to delete item.");
    }
  }, [deleteItem, refetchItems]);

  const onHideItem = useCallback(async (id, hidden) => {
    try {
      await hideItem({ itemId: id, hidden }).unwrap();
      refetchItems();
    } catch (e) {
      console.error(e);
      alert("Failed to update visibility.");
    }
  }, [hideItem, refetchItems]);

  /* ============================================================
   *  TAXONOMY — add first; “Danger zone” (deletes) AFTER (your request)
   * ============================================================ */
  const { data: taxData, isFetching: taxLoading, refetch: refetchTax } = useAdminTaxonomyListQuery();
  const sectors = taxData?.data || [];

  const [newSector, setNewSector] = useState("");
  const [selSector, setSelSector] = useState("");
  const [subsText, setSubsText] = useState("");
  const [subsAllowProd, setSubsAllowProd] = useState(true);
  const [subsAllowServ, setSubsAllowServ] = useState(true);

  const [addSector,   { isLoading: addingSector }]   = useAdminTaxonomyAddSectorMutation();
  const [addSubs,     { isLoading: addingSubs }]     = useAdminTaxonomyAddSubsectorsMutation();
  const [delSector,   { isLoading: deletingSector }] = useAdminTaxonomyDeleteSectorMutation();
  const [delSub,      { isLoading: deletingSub }]    = useAdminTaxonomyDeleteSubsectorMutation();

  const activeSector = useMemo(
    () => sectors.find(s => String(s.sector).toLowerCase() === String(selSector).toLowerCase()) || null,
    [sectors, selSector]
  );

  const onAddSector = async () => {
    const sector = String(newSector || "").trim();
    if (!sector) return;
    try {
      await addSector({ sector }).unwrap();
      setNewSector("");
      refetchTax();
    } catch (e) {
      console.error(e);
      alert("Failed to add sector.");
    }
  };

  const onAddSubsectors = async () => {
    const sector = String(selSector || "").trim();
    if (!sector) { alert("Select a sector first."); return; }
    const names = subsText.split(/\n+/).map(s => s.trim()).filter(Boolean);
    if (!names.length) { alert("Add at least one subsector name."); return; }
    try {
      const list = names.map(name => ({ name, allowProducts: !!subsAllowProd, allowServices: !!subsAllowServ }));
      await addSubs({ sector, list }).unwrap();
      setSubsText("");
      refetchTax();
    } catch (e) {
      console.error(e);
      alert("Failed to add subsectors.");
    }
  };

  const onDeleteSector = async () => {
    const sector = String(selSector || "").trim();
    if (!sector) { alert("Select a sector to delete."); return; }
    if (!askConfirm(`Delete sector "${sector}"? (must not be in use)`)) return;
    try {
      await delSector(sector).unwrap();
      setSelSector("");
      refetchTax();
    } catch (e) {
      console.error(e);
      alert("Failed to delete sector (maybe in use).");
    }
  };

  const onDeleteSub = async (subId) => {
    const sector = String(selSector || "").trim();
    if (!sector || !subId) return;
    if (!askConfirm("Delete this subsector? (must not be in use)")) return;
    try {
      await delSub({ sector, subId }).unwrap();
      refetchTax();
    } catch (e) {
      console.error(e);
      alert("Failed to delete subsector (maybe in use).");
    }
  };

  /* ============================================================
   *  RENDER
   * ============================================================ */
  return (
    <section className="abp">
      <header className="abp-head">
        <div>
          <h1>Business Profiles — Admin Tools</h1>
          <p>Search & delete profiles, manage items of a selected profile, and edit taxonomy.</p>
        </div>
      </header>

      <div className="abp-grid">
        {/* ==================== PROFILES (unchanged visual style) ==================== */}
        <div className="abp-card p-3">
          <div className="abp-card-head">
            <h3>Profiles</h3>

            <div className="abp-toolbar abp-toolbar--tight">
              {/* Search with icon */}
              <label className="abp-inp abp-inp--withicon" title="Search profiles">
                <input
                  className="abp-inp__field"
                  placeholder="Search name, tagline, sectors…"
                  value={q}
                  onChange={(e)=> setQ(e.target.value)}
                  onKeyDown={(e)=> e.key === "Enter" && runSearch()}
                  aria-label="Search profiles"
                />
              </label>

              {/* Published filter */}
              <select
                className="abp-inp"
                value={published}
                onChange={(e)=>{ setPublished(e.target.value); setPage(1); }}
                aria-label="Published filter"
                title="Filter by status"
              >
                <option value="all">All</option>
                <option value="yes">Published</option>
                <option value="no">Pending</option>
              </select>

              {/* Per page */}
              <select
                className="abp-inp"
                value={String(limit)}
                onChange={(e)=>{ setLimit(Number(e.target.value)||10); setPage(1); }}
                aria-label="Items per page"
                title="Items per page"
              >
                {[5,10,20,30,50,100].map(n => <option key={n} value={n}>{n}/page</option>)}
              </select>

              <button className="abp-btn" onClick={runSearch}>Search</button>
            </div>
          </div>

          {profLoading ? <div className="abp-skel" /> : null}

          <ul className="abp-list">
            {profiles.map((p)=>(
              <li
                key={p.id}
                className={`abp-row ${selectedProfileId === p.id ? "selected" : ""}`}
                onClick={()=> setSelectedProfileId(p.id)}
                role="button"
                title="Click to manage items for this profile"
              >
                <div className="abp-row-l">
                  {p.logoUpload ? (
                    <img className="abp-logo" src={imageLink(p.logoUpload)} alt={p.name} />
                  ) : <div className="abp-logo abp-logo-ph" />}
                  <div>
                    <div className="abp-strong">{p.name}</div>
                    <div className="abp-sub">{p.slug}</div>
                    {(p.industries && p.industries.length) ? (
                      <div className="abp-tags">
                        {/* sectors only, max 1 */}
                        <Chip soft>{p.industries[0]}</Chip>
                      </div>
                    ) : null}
                  </div>
                </div>
                <div className="abp-row-r" style={{ gap: 8 }}>
                  <span className={`abp-badge ${p.published ? "ok" : ""}`}>
                    {p.published ? "Published" : "Pending"}
                  </span>
                  <button
                    className="abp-btn-ghost d-flex  align-items-center"
                    disabled={deletingProfile}
                    onClick={(e)=>{ e.stopPropagation(); onDeleteProfile(p.id); }}
                    title="Delete profile"
                  >
                    <I.trash /> Delete
                  </button>
                </div>
              </li>
            ))}
            {!profiles.length && !profLoading && <li className="abp-muted">No profiles match.</li>}
          </ul>

          {totalProfiles > 0 ? (
            <div className="abp-pager">
              <button
                type="button"
                className="btn-ghost"
                disabled={page<=1}
                onClick={()=> setPage(p=>Math.max(1,p-1))}
              >Prev</button>
              <span className="abp-mono">Page {page} / {maxPage}</span>
              <button
                type="button"
                className="btn"
                disabled={page>=maxPage}
                onClick={()=> setPage(p=>Math.min(maxPage,p+1))}
              >Next</button>
            </div>
          ) : null}
        </div>

        {/* ==================== ITEMS (Bootstrap card grid) ==================== */}
        <div className="abp-card p-3">
          <div className="abp-card-head">
            <h3>Items of selected profile</h3>
            <div className="abp-toolbar abp-toolbar--tight">
              <select
                className="abp-inp"
                value={selectedProfileId}
                onChange={(e)=> setSelectedProfileId(e.target.value)}
                title="Manage items of…"
                aria-label="Manage items of"
              >
                <option value="">Pick profile…</option>
                {profiles.map(pp => (
                  <option key={`opt-${pp.id}`} value={pp.id}>{pp.name}</option>
                ))}
              </select>
              <div className="abp-sub" aria-live="polite">
                {selectedProfile ? selectedProfile.name : "No profile selected"}
              </div>
            </div>
          </div>

          {!selectedProfileId ? (
            <div className="abp-muted">Pick a profile above or click a row in the list.</div>
          ) : (
            <>
              {itemsLoading ? <div className="abp-skel" /> : null}

              {/* Responsive grid of item cards */}
              <div className="container-fluid px-0">
                <div className="row g-3">
                  {items.map((r) => (
                    <div key={r.id} className="col-12 ">
                      <div className="card h-100 shadow-sm">
                        {r.thumbnailUpload ? (
                          <div
                            className="ratio ratio-16x9 bg-light"
                            style={{ backgroundImage: `url(${imageLink(r.thumbnailUpload)})`, backgroundSize: "cover", backgroundPosition: "center" }}
                          />
                        ) : (
                          <div className="ratio ratio-16x9 bg-light d-flex align-items-center justify-content-center">
                            <span className="text-muted">No image</span>
                          </div>
                        )}
                        <div className="card-body d-flex flex-column">
                          <div className="fw-semibold text-truncate" title={r.title}>{r.title}</div>
                          <div className="text-muted small mb-2 text-truncate" title={`${r.kind} • ${r.sector}${r.subsectorName ? " • "+r.subsectorName : ""}`}>
                            {r.kind} • {r.sector}{r.subsectorName ? ` • ${r.subsectorName}` : ""}
                          </div>
                          <div className="mt-auto d-flex gap-2">
                            <button
                              className="btn btn-outline-secondary btn-sm"
                              onClick={()=> onHideItem(r.id, true)}
                              title="Hide from public"
                            >
                              <I.eyeOff /> Hide
                            </button>
                            <button
                              className="btn btn-outline-danger btn-sm"
                              onClick={()=> onDeleteItem(r.id)}
                              title="Delete item"
                            >
                              <I.trash /> Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {!items.length && !itemsLoading && (
                    <div className="col-12">
                      <div className="abp-muted">No items for this profile.</div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* ==================== TAXONOMY (Bootstrap forms) ==================== */}
        <div className="abp-card p-3 w-100">
          <div className="abp-card-head">
            <h3>Taxonomy</h3>
            {taxLoading ? <div className="abp-skel" style={{ width: 120, height: 20 }} /> : null}
          </div>

          {/* Add sector */}
          <div className="mb-4">
            <div className="form-label fw-semibold">Add sector</div>
            <div className="input-group" style={{ maxWidth: 540 }}>
              <span className="input-group-text">+</span>
              <input
                className="form-control bg-white"
                placeholder="Sector name (e.g. greentech)"
                value={newSector}
                onChange={(e)=> setNewSector(e.target.value)}
              />
              <button
                className="btn btn-primary"
                disabled={addingSector || !newSector.trim()}
                onClick={onAddSector}
              >
                Add sector
              </button>
            </div>
          </div>

          {/* Add subsectors */}
          <div className="mb-3">
            <div className="form-label fw-semibold">Add subsectors</div>
            <div className="row g-3 align-items-center">
              <div className="col-lg-12">
                <select
                  className="form-select w-100"
                  value={selSector}
                  onChange={(e)=> setSelSector(e.target.value)}
                >
                  <option value="">Select sector…</option>
                  {sectors.map(s => (
                    <option key={s.id || s.sector} value={s.sector}>{s.sector}</option>
                  ))}
                </select>
              </div>
              <div className="col-lg-6 d-flex gap-4">
                <div className="form-check">
                  <input
                    id="allow-products"
                    type="checkbox"
                    className="form-check-input"
                    checked={subsAllowProd}
                    onChange={(e)=> setSubsAllowProd(e.target.checked)}
                  />
                  <label htmlFor="allow-products" className="form-check-label">allow products</label>
                </div>
                <div className="form-check">
                  <input
                    id="allow-services"
                    type="checkbox"
                    className="form-check-input"
                    checked={subsAllowServ}
                    onChange={(e)=> setSubsAllowServ(e.target.checked)}
                  />
                  <label htmlFor="allow-services" className="form-check-label">allow services</label>
                </div>
              </div>
              <div className="col-12">
                <textarea
                  className="form-control"
                  rows={6}
                  placeholder={"One subsector per line\nExample:\nsolar\nwind\nbattery-storage"}
                  value={subsText}
                  onChange={(e)=> setSubsText(e.target.value)}
                />
              </div>
              <div className="col-12">
                <button
                  className="btn btn-primary"
                  disabled={addingSubs || !selSector || !subsText.trim()}
                  onClick={onAddSubsectors}
                >
                  <I.plus /> Add subsectors”
                </button>
              </div>
            </div>
          </div>

          {/* Existing subsectors for the selected sector (compact, scrollable) */}
          {activeSector ? (
            <div className="mb-4">
              <div className="form-label fw-semibold">Existing subsectors — {activeSector.sector}</div>
              <div className="abp-chipbox">
                {(activeSector.subsectors || []).map((sc) => (
                  <div key={sc.id} className="d-inline-flex align-items-center gap-2 border rounded-5 px-3 py-1 me-2 mb-2 bg-light">
                    <span className="small">{sc.name}</span>
                    <span className="small text-muted">
                      {(sc.allowProducts ? "prod" : "")}{(sc.allowProducts && sc.allowServices) ? " • " : ""}{(sc.allowServices ? "serv" : "")}
                    </span>
                    <button
                      type="button"
                      className="btn btn-outline-danger btn-sm py-0"
                      onClick={()=> onDeleteSub(sc.id)}
                      title="Delete subsector"
                    >
                      <I.trash />
                    </button>
                  </div>
                ))}
                {(!activeSector.subsectors || !activeSector.subsectors.length) && (
                  <span className="abp-muted">No subsectors yet.</span>
                )}
              </div>
            </div>
          ) : null}

          {/* Danger zone AFTER adds (per your order) */}
          <div className="pt-3 border-top">
            <div className="text-danger fw-bold mb-2">Danger zone</div>
            <div className="d-flex gap-2 flex-wrap">
              <button
                className="btn btn-outline-danger"
                disabled={!selSector || deletingSector}
                onClick={onDeleteSector}
                title="Delete selected sector"
              >
                <I.trash /> Delete sector “{selSector || "—"}”
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
