import React, { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useGetMarketFacetsQuery, useGetMarketItemsQuery } from "../../features/bp/BPApiSlice";
import ProductCard from "./ProductCard";
import "./market.css";
import Footer from "../../components/footer/Footer";
import { cta, footerData, nav, topbar } from "../main.mock";
import HeaderShell from "../../components/layout/HeaderShell";

const KIND = [
  { v: "all", label: "All" },
  { v: "product", label: "Products" },
  { v: "service", label: "Services" },
];

function Segmented({ value, onChange }) {
  return (
    <div className="mk-seg">
      {KIND.map(k => (
        <button
          key={k.v}
          type="button"
          onClick={() => onChange(k.v)}
          className={value === k.v ? "is-on" : ""}
        >
          {k.label}
        </button>
      ))}
    </div>
  );
}

function Chip({ active, onClick, children }) {
  return (
    <button type="button" onClick={onClick} className={"mk-chip" + (active ? " is-active" : "")}>
      {children}
    </button>
  );
}

export default function MarketPage() {
  const [sp, setSp] = useSearchParams();

  const sector      = sp.get("sector") || "";
  const subsectorId = sp.get("subsectorId") || "";
  const kind        = sp.get("kind") || "all";
  const q           = sp.get("q") || "";
  const sort        = sp.get("sort") || "new";
  const hasImages   = sp.get("hasImages") || "";
  const page        = Math.max(1, parseInt(sp.get("page") || "1", 10));

  const setParam = (k, v) => {
    const next = new URLSearchParams(sp);
    if (v === "" || v == null) next.delete(k); else next.set(k, v);
    if (k !== "page") next.set("page", "1");
    setSp(next, { replace: true });
  };

  const { data: facets } = useGetMarketFacetsQuery();
  const sectors = facets?.sectors || [];
  const subsectors = useMemo(() => {
    const s = sectors.find(x => x.sector === (sector || "").toLowerCase());
    return s ? (s.subsectors || []) : [];
  }, [sectors, sector]);

  const query = {
    q,
    kind: kind === "all" ? "" : kind,
    sector,
    subsectorId,
    hasImages,
    sort,
    page,
    limit: 24
  };
  const { data, isFetching } = useGetMarketItemsQuery(query);
  const items = data?.items || [];
  const total = data?.total || 0;

  return (
    <>
        <HeaderShell top={topbar} nav={nav} cta={cta} />
    <div className="mk">
      <div className="mk-wrap">
        {/* Toolbar */}
        <div className="mk-toolbar">
          {/* Sector chips */}
          <div className="mk-chips">
            <Chip active={!sector} onClick={() => { setParam("sector",""); setParam("subsectorId",""); }}>All sectors</Chip>
            {sectors.map(s => (
              <Chip
                key={s.sector}
                active={sector === s.sector}
                onClick={() => { setParam("sector", s.sector); setParam("subsectorId",""); }}
              >
                {s.sector.replace(/\b\w/g, m => m.toUpperCase())}
              </Chip>
            ))}
          </div>

          {/* Controls row */}
          <div className="mk-controls">
            <Segmented value={kind} onChange={(v)=>setParam("kind", v)} />

            <input
              className="mk-input"
              placeholder="Search…"
              value={q}
              onChange={(e)=>setParam("q", e.target.value)}
            />

            {sector ? (
              <select
                className="mk-select"
                value={subsectorId}
                onChange={(e)=>setParam("subsectorId", e.target.value)}
                title="Sub-sector"
              >
                <option value="">{`All ${sector} sub-sectors`}</option>
                {subsectors.map(ss => <option key={ss.id} value={ss.id}>{ss.name}</option>)}
              </select>
            ) : (
              <select
                className="mk-select"
                value={sort}
                onChange={(e)=>setParam("sort", e.target.value)}
                title="Sort"
              >
                <option value="new">Newest</option>
                <option value="az">A–Z</option>
              </select>
            )}

            <label className="mk-check">
              <input
                type="checkbox"
                checked={hasImages === "1"}
                onChange={(e)=>setParam("hasImages", e.target.checked ? "1" : "")}
              />
              With images
            </label>
          </div>
        </div>

        {/* Summary */}
        <div className="mk-summary">
          <span>{total ? `${total} results` : (isFetching ? "Loading…" : "No results")}</span>
          {sector ? <button onClick={()=>{ setParam("sector",""); setParam("subsectorId",""); }} className="mk-pagebtn">Clear sector</button> : null}
        </div>

        {/* Grid */}
        <div className="mk-grid">
          {isFetching && !items.length
            ? Array.from({ length: 9 }).map((_,i)=> <div key={i} className="mk-skel" style={{height:260}}/>)
            : items.map(it => <ProductCard key={String(it.id || it._id || it)} item={it} />)
          }
        </div>

        {/* Pager */}
        <div className="mk-pager">
          <button
            className="mk-pagebtn"
            disabled={page <= 1}
            onClick={()=>setParam("page", String(page-1))}
          >Prev</button>
          <span style={{fontWeight:800}}>Page {page}</span>
          <button
            className="mk-pagebtn primary"
            disabled={items.length < (query.limit || 24)}
            onClick={()=>setParam("page", String(page+1))}
          >Next</button>
        </div>
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
