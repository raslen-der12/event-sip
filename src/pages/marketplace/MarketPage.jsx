// src/pages/market/MarketPage.jsx
import React, { useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useGetMarketFacetsQuery, useGetMarketItemsQuery } from "../../features/bp/BPApiSlice";
import "./market.css";
import Footer from "../../components/footer/Footer";
import { cta, footerData, nav, topbar } from "../main.mock";
import HeaderShell from "../../components/layout/HeaderShell";
import imageLink from "../../utils/imageLink";

const cap = s => String(s || "").replace(/\b\w/g, m => m.toUpperCase());
const isOn = (arr, v) => arr.includes(v);
const normTags = (t) =>
  Array.isArray(t) ? t
  : typeof t === "string" ? t.split(",").map(s => s.trim()).filter(Boolean)
  : [];

function BusinessCard({ d }) {
  const navigate = useNavigate();
  const tags = normTags(d.tags).slice(0, 3);

  return (
    <article className="mk-card">
      <div className="mk-card-media">
        {d.logo ? <img src={imageLink(d.logo)} alt={d.name} /> : <div className="mk-media-fallback" />}
        <div className="mk-chip-pill">Business</div>
      </div>

      <div className="mk-card-body">
        <div className="mk-title">{d.name}</div>

        {/* mk-sub MUST hold the tags */}
        <div className="mk-sub" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {tags.length
            ? tags.map((t, i) => (
                <span key={`${d.id}-tag-${i}`} className="mk-chip" title={t}>
                  {cap(t)}
                </span>
              ))
            : null}
        </div>

        {!!(d.featuredItems?.length) && (
          <>
            <div className="mk-sec-title">Featured</div>
            <div className="mk-thumbs">
              {d.featuredItems.slice(0, 3).map((x) => (
                <div key={x.id} className="mk-thumb">
                  {x.thumb ? <img src={imageLink(x.thumb)} alt="" /> : <div className="mk-thumb-fallback" />}
                </div>
              ))}
            </div>
          </>
        )}

        <div className="mk-card-actions">
          <button className="mk-btn ghost" onClick={() => navigate(`/BusinessProfile/${d.id}`)}>
            View Profile
          </button>
          <button className="mk-btn primary" onClick={() => navigate(`/products/${d.id}`)}>
            View Products
          </button>
        </div>
      </div>
    </article>
  );
}

function ItemCard({ d }) {
  const navigate = useNavigate();
  const isService = d.kind === "service";
  const prof = d.profile || null;
  const tags = normTags(d.tags).slice(0, 3);

  return (
    <article className="mk-card">
      {/* Media */}
      <div className="mk-card-media">
        {d.thumb ? <img src={imageLink(d.thumb)} alt={d.title} /> : <div className="mk-media-fallback" />}
        <div className="mk-chip-pill">{isService ? "Service" : "Product"}</div>
        {d.priceValue != null && <div className="mk-price">{`${d.priceCurrency || ""} ${d.priceValue}`.trim()}</div>}
      </div>

      {/* Body */}
      <div className="mk-card-body">
        <div className="mk-title">{d.title}</div>

        {/* mk-sub MUST hold the tags (fallback to summary if no tags) */}
        <div className="mk-sub" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {tags.length
            ? tags.map((t, i) => (
                <span key={`${d.id}-tag-${i}`} className="mk-chip" title={t}>
                  {cap(t)}
                </span>
              ))
            : <span className="mk-muted">{d.summary || "—"}</span>}
        </div>

        {/* Business profile strip INSIDE the item card */}
        {prof && (
          <div className="mk-profile-mini">
            {prof.logo ? (
              <img className="mk-profile-logo" src={imageLink(prof.logo)} alt={prof.name} />
            ) : (
              <div className="mk-profile-logo mk-logo-fallback" />
            )}
            <div className="mk-profile-info">
              <div className="mk-profile-name">{prof.name || "—"}</div>
              {!!(prof.countries?.length) && (
                <div className="mk-profile-meta">{String(prof.countries[0]).toUpperCase()}</div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mk-card-actions">
          <button
            className="mk-btn ghost"
            onClick={() => prof?.id && navigate(`/BusinessProfile/${prof.id}`)}
            disabled={!prof?.id}
            title={prof?.id ? "Open business profile" : "No profile data"}
          >
            View Profile
          </button>
          <button className="mk-btn primary" onClick={() => navigate(`/products/${d.id}`)} title="Open product/service">
            View {isService ? "Service" : "Product"}
          </button>
        </div>
      </div>
    </article>
  );
}

const Card = ({ it }) => (it.type === "business" ? <BusinessCard d={it} /> : <ItemCard d={it} />);

export default function MarketPage() {
  const [sp, setSp] = useSearchParams();

  // defaults: kind=business
  const q = sp.get("q") || "";
  const industry = sp.get("industry") || "";
  const country = sp.get("country") || "";
  const kind = sp.get("kind") || "business";
  const sector = sp.get("sector") || "";
  const subsectorId = sp.get("subsectorId") || "";
  const size = sp.get("size") || "";
  const sort = sp.get("sort") || "new";
  const hasImages = sp.get("hasImages") || "";
  const badges = sp.getAll("badge");
  const page = Math.max(1, parseInt(sp.get("page") || "1", 10));

  const setParam = (k, v) => {
    const next = new URLSearchParams(sp);
    if (v === undefined || v === null || String(v).trim() === "") next.delete(k);
    else next.set(k, String(v));
    if (k !== "page") next.set("page", "1");
    setSp(next, { replace: true });
  };
  const toggleBadge = (b) => {
    const next = new URLSearchParams(sp);
    const s = new Set(next.getAll("badge"));
    s.has(b) ? s.delete(b) : s.add(b);
    next.delete("badge");
    [...s].forEach((x) => next.append("badge", x));
    next.set("page", "1");
    setSp(next, { replace: true });
  };

  const { data: facets } = useGetMarketFacetsQuery();
  const sectors = facets?.sectors || [];
  const industries = facets?.industries || [];
  const countries = facets?.countries || [];
  const sizes = facets?.sizes || [];
  const certs = facets?.badges || [];

  const subsectors = useMemo(() => {
    const s = sectors.find((x) => x.sector === sector);
    return s ? s.subsectors || [] : [];
  }, [sectors, sector]);

  const query = {
    q,
    kind,
    sector,
    subsectorId,
    industry,
    country,
    size,
    badges: badges.join(","),
    hasImages,
    sort,
    page,
    limit: 24,
  };
  const { data, isFetching } = useGetMarketItemsQuery(query);

  const items = data?.items || [];
  const total = data?.total || 0;
  const businessCount = data?.counts?.businesses ?? items.filter((i) => i.type === "business").length;

  // optional: aggregated tags for sidebar (if backend returns data.tags). We keep it but don't touch mk-sub requirement.
  const tagsAgg = data?.tags || [];

  const isTagActive = (t) => q.trim().toLowerCase() === String(t || "").toLowerCase();
  const onTagClick = (t) => setParam("q", isTagActive(t) ? "" : t);

  return (
    <>
      <HeaderShell top={topbar} nav={nav} cta={cta} />
      <div className="mk container-lg">
        {/* Header */}
        <div className="mk-header card">
          <div className="mk-h-title">Marketplace</div>
          <div className="mk-h-sub">Discover Businesses & Products</div>
          <div className="mk-toprow">
            <input
              className="mk-input grow"
              placeholder="Search businesses or products…"
              value={q}
              onChange={(e) => setParam("q", e.target.value)}
            />
            <select className="mk-select" value={industry} onChange={(e) => setParam("industry", e.target.value)}>
              <option value="">All Industries</option>
              {industries.map((it) => (
                <option key={it.name} value={it.name}>
                  {cap(it.name)}
                  {it.count ? ` (${it.count})` : ""}
                </option>
              ))}
            </select>
            <select className="mk-select" value={country} onChange={(e) => setParam("country", e.target.value)}>
              <option value="">All Countries</option>
              {countries.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code.toUpperCase()}
                  {c.count ? ` (${c.count})` : ""}
                </option>
              ))}
            </select>
            <select className="mk-select" value={kind} onChange={(e) => setParam("kind", e.target.value)}>
              <option value="business">Businesses</option>
              <option value="product">Products</option>
              <option value="service">Services</option>
              <option value="all">All Types</option>
            </select>
          </div>
        </div>

        <div className="mk-layout">
          {/* Sidebar */}
          <aside className="mk-aside card">
            <div className="mk-aside-title">Advanced Filters</div>

            <div className="mk-group">
              <div className="mk-label">Business Size</div>
              <select className="mk-select w100" value={size} onChange={(e) => setParam("size", e.target.value)}>
                <option value="">All</option>
                {sizes.map((s) => (
                  <option key={s.size} value={s.size}>
                    {s.size}
                    {s.count ? ` (${s.count})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="mk-group">
              <div className="mk-label">Certifications</div>
              <div className="mk-checklist">
                {certs.map((b) => {
                  const v = b.badge;
                  const on = isOn(badges, v);
                  return (
                    <label key={v} className="mk-check">
                      <input type="checkbox" checked={on} onChange={() => toggleBadge(v)} />
                      {cap(v)} {b.count ? `(${b.count})` : ""}
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="mk-group">
              <div className="mk-label">Media</div>
              <label className="mk-check">
                <input
                  type="checkbox"
                  checked={hasImages === "1"}
                  onChange={(e) => setParam("hasImages", e.target.checked ? "1" : "")}
                />
                With images
              </label>
            </div>

            {!!tagsAgg.length && (
              <div className="mk-group">
                <div className="mk-label">Top Tags</div>
                <div className="mk-taglist">
                  {tagsAgg.slice(0, 24).map((t) => (
                    <button
                      key={t.name}
                      className={"mk-chip" + (isTagActive(t.name) ? " is-active" : "")}
                      title={t.count ? `${t.count} items` : "Filter by tag"}
                      onClick={() => onTagClick(t.name)}
                    >
                      {cap(t.name)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </aside>

          {/* Content */}
          <main className="mk-main">
            {/* Sectors row */}
            <div className="mk-chiprow">
              <button
                className={"mk-chip" + (sector ? "" : " is-active")}
                onClick={() => {
                  setParam("sector", "");
                  setParam("subsectorId", "");
                }}
              >
                All Sectors
              </button>
              {sectors.map((s) => (
                <button
                  key={s.sector}
                  className={"mk-chip" + (sector === s.sector ? " is-active" : "")}
                  onClick={() => {
                    setParam("sector", s.sector);
                    setParam("subsectorId", "");
                  }}
                >
                  {cap(s.sector)}
                </button>
              ))}
            </div>

            {/* Subsector & sort */}
            <div className="mk-controls">
              {sector ? (
                <select className="mk-select" value={subsectorId} onChange={(e) => setParam("subsectorId", e.target.value)}>
                  <option value="">{`All ${cap(sector)} Sub-sectors`}</option>
                  {subsectors.map((ss) => (
                    <option key={ss.id} value={ss.id}>
                      {ss.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div />
              )}
              <div className="mk-right">
                <span className="mk-muted">
                  {kind === "business" ? `Showing ${businessCount} businesses` : isFetching ? "Loading…" : `${total} results`}
                </span>
                <select className="mk-select" value={sort} onChange={(e) => setParam("sort", e.target.value)}>
                  <option value="new">Newest</option>
                  <option value="az">A–Z</option>
                  <option value="priceAsc">Price ↑</option>
                  <option value="priceDesc">Price ↓</option>
                </select>
              </div>
            </div>

            {/* Grid */}
            <div className="mk-grid">
              {isFetching && !items.length
                ? Array.from({ length: 9 }).map((_, i) => <div key={i} className="mk-skel" />)
                : items.map((it) => <Card key={`${it.type}-${it.id}`} it={it} />)}
            </div>

            {/* Pager */}
            <div className="mk-loadmore">
              <button
                className="mk-btn outline"
                disabled={items.length < 24}
                onClick={() => setParam("page", String(page + 1))}
              >
                Load More
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
