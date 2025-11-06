// src/pages/market/MarketPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useGetMarketFacetsQuery, useGetMarketBusinessesQuery } from "../../features/bp/BPApiSlice";
import "./market.css";
import Footer from "../../components/footer/Footer";
import { cta, footerData, nav, topbar } from "../main.mock";
import HeaderShell from "../../components/layout/HeaderShell";
import imageLink from "../../utils/imageLink";

const cap = (s) => String(s || "").replace(/\b\w/g, (m) => m.toUpperCase());
const uniq = (a) => Array.from(new Set(a));

/* ---------------- Business card (banner on top, logo + name inline, tiny product thumbs) ---------------- */
function BusinessCard({ d }) {
  const navigate = useNavigate();

  // Use first featured item image as banner; fallback to logo; fallback to empty block
  const bannerSrc =
    (d.featuredItems?.find((x) => x.thumb)?.thumb && imageLink(d.featuredItems.find((x) => x.thumb).thumb)) ||
    (d.logoUpload ? imageLink(d.logoUpload) : null);

  return (
    <article className="mk-card">
      {/* Top banner */}
      <div className="mk-card-media">
        {bannerSrc ? <img src={bannerSrc} alt={d.name} /> : <div className="mk-media-fallback" />}
        <div className="mk-chip-pill">Business</div>
      </div>

      <div className="mk-card-body">
        {/* Inline logo + name */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          {d.logoUpload ? (
            <img
              src={imageLink(d.logoUpload)}
              alt={d.name}
              style={{ width: 28, height: 28, borderRadius: 6, objectFit: "cover" }}
            />
          ) : (
            <div className="mk-logo-fallback" style={{ width: 28, height: 28, borderRadius: 6 }} />
          )}
          <div className="mk-title" style={{ margin: 0 }}>{d.name}</div>
        </div>

        {/* tags row (max 3) */}
        {!!(d.tags?.length) && (
          <div className="mk-tags" style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
            {d.tags.slice(0, 3).map((t, i) => (
              <span key={`${d.id}-tag-${i}`} className="mk-chip" style={{ fontSize: 12, padding: "4px 8px" }}>
                {cap(t)}
              </span>
            ))}
          </div>
        )}

        {/* tiny featured thumbnails (up to 4) */}
        {!!(d.featuredItems?.length) && (
          <>
            <div className="mk-sec-title">Featured Products</div>
            <div className="mk-thumbs">
              {d.featuredItems.slice(0, 4).map((x) => (
                <div key={x.id} className="mk-thumb">
                  {x.thumb ? <img src={imageLink(x.thumb)} alt={x.title} /> : <div className="mk-thumb-fallback" />}
                </div>
              ))}
            </div>
          </>
        )}

        <div className="mk-card-actions">
          <button className="mk-btn ghost" onClick={() => navigate(`/BusinessProfile/${d.id}`)}>View Profile</button>
          <button className="mk-btn primary" onClick={() => navigate(`/BusinessProfile/${d.id}#sectors`)}>View Products</button>
        </div>
      </div>
    </article>
  );
}

export default function MarketPage() {
  const [sp, setSp] = useSearchParams();

  // query params
  const q        = sp.get("q") || "";
  const industry = sp.get("industry") || "";
  const country  = sp.get("country") || "";
  const sizes    = sp.getAll("size");     // multi
  const badges   = sp.getAll("badge");    // multi
  const sectors  = sp.getAll("sector");   // multi
  const page     = Math.max(1, parseInt(sp.get("page") || "1", 10));
  const sort     = sp.get("sort") || "new"; // "new" | "az"

  const setParam = (k, v, { multi = false } = {}) => {
    const next = new URLSearchParams(sp);
    if (multi) {
      next.delete(k);
      (Array.isArray(v) ? v : [v]).filter(Boolean).forEach((val) => next.append(k, String(val)));
    } else {
      if (v === undefined || v === null || String(v).trim() === "") next.delete(k);
      else next.set(k, String(v));
    }
    if (k !== "page") next.set("page", "1");
    setSp(next, { replace: true });
  };
  const toggleMulti = (k, val) => {
    const list = new Set(sp.getAll(k));
    list.has(val) ? list.delete(val) : list.add(val);
    setParam(k, [...list], { multi: true });
  };

  /* facets */
  const { data: facets } = useGetMarketFacetsQuery();
  const sectorsFac = facets?.sectors || [];
  const industries = facets?.industries || [];
  const countries  = facets?.countries || [];
  const sizesFac   = facets?.sizes || [];
  const certs      = facets?.badges || [];

  // (kept in case you later show subsectors somewhere)
  const subsectorOptions = useMemo(() => {
    const present = new Map(sectorsFac.map((s) => [s.sector, s]));
    return sectors.map((s) => present.get(s)?.subsectors || []).flat();
  }, [sectorsFac, sectors]);

  /* backend query (CSV for multi-selects) */
  const params = {
    q,
    industry,
    country,
    size: sizes.join(","),     // CSV -> backend sizeList
    badges: badges.join(","),  // CSV -> backend badgeList
    sector: sectors.join(","), // CSV -> backend sectorList
    sort,
    page,
    limit: 24
  };
  const { data, isFetching } = useGetMarketBusinessesQuery(params);

  /* accumulate pages so "Load more" appends (and resets when filters change) */
  const [acc, setAcc] = useState([]);
  const depsKey = JSON.stringify({ q, industry, country, sizes: uniq(sizes), badges: uniq(badges), sectors: uniq(sectors), sort });
  useEffect(() => { setAcc([]); }, [depsKey]);
  useEffect(() => {
    const incoming = data?.items || [];
    setAcc((prev) => (page === 1 ? incoming : [...prev, ...incoming]));
  }, [data?.items, page]);

  const items = acc;
  const total = data?.total || 0;
  const canLoadMore = items.length < total;

  return (
    <>
      <HeaderShell top={topbar} nav={nav} cta={cta} />
      <div className="mk container-lg">
        {/* Header */}
        <div className="mk-header card">
          <div className="mk-h-title">Marketplace</div>
          <div className="mk-h-sub">Discover Businesses &amp; Products</div>
          <div className="mk-toprow">
            <input
              className="mk-input grow"
              placeholder="Search businesses…"
              value={q}
              onChange={(e) => setParam("q", e.target.value)}
            />
            <select className="mk-select" value={industry} onChange={(e) => setParam("industry", e.target.value)}>
              <option value="">All Industries</option>
              {industries.map((it) => (
                <option key={it.name} value={it.name}>
                  {cap(it.name)}{it.count ? ` (${it.count})` : ""}
                </option>
              ))}
            </select>
            <select className="mk-select" value={country} onChange={(e) => setParam("country", e.target.value)}>
              <option value="">All Countries</option>
              {countries.map((c) => (
                <option key={c.code} value={c.code}>
                  {String(c.code).toUpperCase()}{c.count ? ` (${c.count})` : ""}
                </option>
              ))}
            </select>
            <select className="mk-select" value={sort} onChange={(e) => setParam("sort", e.target.value)}>
              <option value="new">Newest</option>
              <option value="az">A–Z</option>
            </select>
          </div>
        </div>

        <div className="mk-layout">
          {/* Sidebar */}
          <aside className="mk-aside card">
            <div className="mk-aside-title">Advanced Filters</div>

            {/* Sectors (multi column checklist) */}
            <div className="mk-group">
              <div className="mk-label">Sectors</div>
              <div className="mk-checklist cols-2">
                {sectorsFac.map((s) => (
                  <label key={s.sector} className="mk-check fw-lighter fs-6">
                    <input
                      type="checkbox"
                      checked={sectors.includes(s.sector)}
                      onChange={() => toggleMulti("sector", s.sector)}
                    />
                    {cap(s.sector)}
                  </label>
                ))}
              </div>
            </div>

            {/* Business Size (multi) */}
            <div className="mk-group">
              <div className="mk-label">Business Size</div>
              <div className="mk-checklist cols-2">
                {sizesFac.map((s) => (
                  <label key={s.size} className="mk-check fw-lighter fs-6">
                    <input
                      type="checkbox"
                      checked={sizes.includes(s.size)}
                      onChange={() => toggleMulti("size", s.size)}
                    />
                    {s.size}{s.count ? ` (${s.count})` : ""}
                  </label>
                ))}
              </div>
            </div>

            {/* Certifications / Badges (multi) */}
            
          </aside>

          {/* Content */}
          <main className="mk-main">
            <div className="mk-controls">
              <div />
              <div className="mk-right">
                <span className="mk-muted">
                  {isFetching && !items.length ? "Loading…" : `Showing ${items.length} of ${total} businesses`}
                </span>
              </div>
            </div>

            {/* Grid of BUSINESS CARDS ONLY */}
            <div className="mk-grid">
              {isFetching && !items.length
                ? Array.from({ length: 9 }).map((_, i) => <div key={i} className="mk-skel" />)
                : items.map((it) => <BusinessCard key={it.id} d={it} />)}
            </div>

            {/* Load more */}
            <div className="mk-loadmore">
              <button
                className="mk-btn outline"
                disabled={!canLoadMore || isFetching}
                onClick={() => setParam("page", String(page + 1))}
              >
                {isFetching ? "Loading…" : (canLoadMore ? "Load More Businesses" : "No more results")}
              </button>
            </div>
          </main>
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
