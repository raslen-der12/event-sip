import React from "react";
import "./business-profile-sectors.css";
import imageLink from "../../utils/imageLink";
const CUR_SYM = { USD:"$", EUR:"€", GBP:"£", JPY:"¥", CNY:"¥", INR:"₹", TND:"TND", AED:"AED", SAR:"SAR" };
/* tiny inline icons (no deps) */
const I = {
  sector: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 13h7v7H4v-7Zm9 0h7v7h-7v-7ZM4 4h7v7H4V4Zm9 0h7v7h-7V4Z" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  ),
  pkg: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m21 7-9-4-9 4 9 4 9-4Zm-9 4v10M3 7v10l9 4 9-4V7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  srv: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M20 7h-6l-2-2H4a2 2 0 0 0-2 2v11h20V9a2 2 0 0 0-2-2Z" stroke="currentColor" strokeWidth="1.6"/>
      <path d="M7 15h10M7 12h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  ),
  link: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M14 10l6-6M15 4h5v5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M21 14v4a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  ),
};

/* best-effort thumbnail from backend fields */
const getThumb = (it) => {
  if (!it) return "";
  const t = it.thumbnailUpload ? imageLink(it.thumbnailUpload) : "";
  const first = Array.isArray(it.images) && it.images.length ? imageLink(it.images[0]) : "";
  return t || first || (it.image || ""); // allow pre-shaped `image`
};

/* price rule:
   - if it.price?.value > 0 => show `$` + value (+ unit if provided)
   - if 0 or missing => hide price entirely
   - if pricingNote exists use it instead */
const renderPrice = (it) => {
  const note = String(it?.pricingNote || "").trim();
  if (note) return <div className="bps-price">{note}</div>;

  // support new flat fields + legacy nested
  const vRaw = (it?.priceValue ?? it?.price?.value);
  const val = Number(vRaw);
  if (!Number.isFinite(val) || val <= 0) return <span/>;

  const cur = String(it?.priceCurrency ?? it?.price?.currency ?? "").toUpperCase();
  const sym = CUR_SYM[cur] || (cur || "$");
  const unit = (it?.priceUnit ?? it?.price?.unit) ? ` / ${it.priceUnit ?? it.price?.unit}` : "";

  const fmt = (n) => (n % 1 === 0)
    ? n.toLocaleString()
    : n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return <div className="bps-price">{sym}{fmt(val)}{unit && <span className="bps-muted">{unit}</span>}</div>;
};
/**
 * Props:
 * sectors: [
 *  { id, title, description?, subsectors: [
 *      { id, title, kind: 'products'|'services'|'both', items: [
 *          { _id|id, kind, title, summary?, images?, thumbnailUpload?, price?, pricingNote?, tags? }
 *      ] }
 *    ]
 *  }
 * ]
 * onItemClick?: (item)=>void
 */
export default function BusinessProfileSectorsTab({ sectors = [], onItemClick , profileHasAnySector = true }) {
  const data = Array.isArray(sectors) ? sectors : [];
  const [active, setActive] = React.useState(0);
  const [expanded, setExpanded] = React.useState(() => new Set()); // subsector ids

  const toggleSub = (id) => {
    setExpanded((cur) => {
      const n = new Set(cur);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

 if (!data.length) {
  return (
    <section className="bps bps--min">
      <div className="container bps-empty-main">
        <div className="bps-empty-big">
          {profileHasAnySector
            ? "No products or services yet."
            : "No products available."}
        </div>
        <div className="bps-empty-sub">
          {profileHasAnySector
            ? "Check back soon — this company hasn’t published any items."
            : "This business profile doesn’t have any published products (no sector selected)."}
        </div>
      </div>
    </section>
  );
}

  const clampedActive = Math.min(active, data.length - 1);
  const sector = data[clampedActive];

  return (
    <section className="bps bps--min">
      <div className="bps-grid container">
        {/* LEFT: sectors list */}
        <aside className="bps-left" aria-label="Sectors">
          <h3 className="bps-left-h">Sectors</h3>
          <ul className="bps-nav" role="tablist">
            {data.map((s, i) => {
              const sel = i === clampedActive;
              return (
                <li key={s.id || i} className={`bps-nav-li ${sel ? "is-active" : ""}`}>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={sel}
                    className="bps-nav-btn"
                    onClick={() => setActive(i)}
                    title={s.title}
                  >
                    <span className="bps-nav-ico"><I.sector/></span>
                    <span className="bps-nav-txt">{s.title}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          {/* mobile sector selector */}
          <div className="bps-select-wrap">
            <select
              className="bps-select"
              value={clampedActive}
              onChange={(e)=> setActive(Number(e.target.value))}
              aria-label="Select sector"
            >
              {data.map((s, i) => <option key={s.id || i} value={i}>{s.title}</option>)}
            </select>
          </div>
        </aside>

        {/* RIGHT: subsectors & items */}
        <div className="bps-main" role="tabpanel" aria-label={sector?.title || "Selected sector"}>
          <header className="bps-head">
            <div className="bps-head-titles">
              <h3 className="bps-h">{sector?.title}</h3>
              {sector?.description ? <p className="bps-sub">{sector.description}</p> : null}
            </div>
            <div className="bps-head-badges">
              <span className="bps-badge">{(sector?.subsectors?.length || 0)} subsectors</span>
              <span className="bps-badge bps-badge--muted">
                {(sector?.subsectors || []).reduce((n, ss)=> n + (ss.items?.length||0), 0)} items
              </span>
            </div>
          </header>

          {/* If a sector exists but has no subsectors/items */}
          {!((sector?.subsectors || []).length) && (
            <div className="bps-empty-main">
              <div className="bps-empty">No products in this sector.</div>
            </div>
          )}

          {(sector?.subsectors || []).map((ss) => {
            const isOpen = expanded.has(ss.id);
            const count = ss.items?.length || 0;
            return (
              <section key={ss.id} className={`bps-acc ${isOpen ? "is-open" : ""}`}>
                <button
                  type="button"
                  className="bps-acc-h"
                  onClick={() => toggleSub(ss.id)}
                  aria-expanded={isOpen}
                >
                  <span className="bps-kind">
                    {ss.kind === "products" ? <I.pkg/> : ss.kind === "services" ? <I.srv/> : <I.sector/>}
                  </span>
                  <span className="bps-acc-title">{ss.title}</span>
                  <span className="bps-acc-count">{count}</span>
                </button>

                <div className="bps-acc-body" style={{ maxHeight: isOpen ? 9999 : 0 }}>
                  <div className="bps-cards">
                    {ss.items?.map((it) => {
                      const isProduct = (it.kind || "").toLowerCase() === "product" || !!it.price;
                      const id = it._id || it.id;
                      const href =
                        it.href ||
                        (isProduct && id ? `/products/${id}` : undefined);
                      const thumb = getThumb(it);

                      const CardContent = (
                        <>
                          <div className="bps-card-img">
                            {thumb ? (
                              <img src={thumb} alt={it.title || "Item"} />
                            ) : (
                              <div className="bps-card-img-fallback" />
                            )}
                          </div>
                          <div className="bps-card-body">
                            <div className="bps-card-top">
                              <span className={`bps-chip ${isProduct ? "bps-chip--prod" : "bps-chip--srv"}`}>
                                {isProduct ? "Product" : "Service"}
                              </span>
                              {it.tags?.slice(0,2).map(t => <span key={t} className="bps-chip bps-chip--tag">{t}</span>)}
                            </div>
                            <h4 className="bps-card-title">{it.title}</h4>
                            {it.summary ? <p className="bps-card-sum">{it.summary}</p> : null}
                            <div className="bps-card-foot">
                              {renderPrice(it)}
                              {href ? (
                                <span className="bps-link">
                                  <I.link/> <span>Open</span>
                                </span>
                              ) : <span />}
                            </div>
                          </div>
                        </>
                      );

                      return href ? (
                        <a
                          key={id}
                          href={href}
                          className="bps-card bps-card--link"
                          onClick={(e) => {
                            if (onItemClick) { e.preventDefault(); onItemClick(it); }
                          }}
                          title={it.title}
                        >
                          {CardContent}
                        </a>
                      ) : (
                        <article key={id} className="bps-card">
                          {CardContent}
                        </article>
                      );
                    })}
                    {!count ? <div className="bps-empty">No products in this subsector.</div> : null}
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </section>
  );
}
