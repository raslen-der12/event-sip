// src/pages/products/ProductPage.jsx
import React, { useMemo } from "react";
import { useParams } from "react-router-dom";
import PropTypes from "prop-types";
import HeaderShell from "../../components/layout/HeaderShell";
import Footer from "../../components/footer/Footer";
import { topbar, nav, cta, footerData } from "../main.mock";
import { useGetMarketItemQuery } from "../../features/bp/BPApiSlice";
import imageLink from "../../utils/imageLink";
import "./product-page.css";

const cap = (s = "") => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const fmtPrice = (v, cur, unit, note) => {
  const num = typeof v === "number" ? v : (v ? Number(v) : null);
  if (!num || num === 0) return note || "";
  return `${num} ${cur || ""}${unit ? ` / ${unit}` : ""}`.trim();
};

export default function ProductPage({ fallbackProduct }) {
  const { productId } = useParams();
  const { data: item, isFetching } = useGetMarketItemQuery(productId);

  const view = useMemo(() => {
    const prod = item || fallbackProduct;
    if (!prod) return null;

    const imgs = Array.isArray(prod.images) ? prod.images.map(imageLink) : [];
    const thumb = prod.thumbnailUpload ? imageLink(prod.thumbnailUpload) : "";
    const cover = imgs[0] || thumb || "";

    const profile = prod.profile || {};
    const industries = Array.isArray(profile.industries) ? profile.industries : [];
    const countries = Array.isArray(profile.countries) ? profile.countries : [];
    const languages = Array.isArray(profile.languages) ? profile.languages : [];

    const priceStr = fmtPrice(prod.priceValue, prod.priceCurrency, prod.priceUnit, prod.pricingNote);

    return {
      cover,
      title: prod.title || "—",
      kind: cap(prod.kind || "product"),
      sector: cap(prod.sector || ""),
      subsector: prod.subsectorName || "",
      summary: prod.summary || "",
      details: prod.details || "",
      tags: Array.isArray(prod.tags) ? prod.tags : [],
      gallery: imgs,
      priceStr,
      bp: {
        id: profile.id || "",
        slug: profile.slug || "",
        name: profile.name || "",
        logo: profile.logoUpload ? imageLink(profile.logoUpload) : "",
        industries,
        countries,
        languages,
      },
    };
  }, [item, fallbackProduct]);

  const notFoundUI = (
    <>
      <HeaderShell top={topbar} nav={nav} cta={cta} />
      <main className="pd">
        <div className="pd-container">
          <div className="pd-card pd-empty">Item not found.</div>
        </div>
      </main>
      <Footer
        brand={footerData.brand}
        columns={footerData.columns}
        socials={footerData.socials}
        actions={footerData.actions}
        bottomLinks={footerData.bottomLinks}
      />
    </>
  );

  if (isFetching) {
    return (
      <>
        <HeaderShell top={topbar} nav={nav} cta={cta} />
        <main className="pd">
          <div className="pd-container">
            <div className="pd-skel" />
          </div>
        </main>
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
  if (!view) return notFoundUI;

  const { cover, title, kind, sector, subsector, summary, details, gallery, tags, priceStr, bp } = view;
  const bpHref = bp.slug || bp.id ? `/BusinessProfile/${bp.id}` : null;

  return (
    <>
      <HeaderShell top={topbar} nav={nav} cta={cta} />

      <main className="pd">
        {/* header */}
        <section className="pd-head">
          <div className={`pd-cover ${cover ? "has" : ""}`} style={cover ? { backgroundImage: `url(${cover})` } : undefined} />
          <div className="pd-hmeta">
            <h1 className="pd-title">{title}</h1>

            <div className="pd-chips">
              {kind ? <span className="chip">{kind}</span> : null}
              {sector ? <span className="chip">{sector}</span> : null}
              {subsector ? <span className="chip">{subsector}</span> : null}
              {priceStr ? <span className="chip chip-strong">{priceStr}</span> : null}
            </div>

            {/* BP inline */}
            {(bp.name || bp.logo) && (
              <div className="pd-bp">
                {bp.logo ? <img className="pd-bp-logo" src={bp.logo} alt={bp.name} /> : <div className="pd-bp-logo" />}
                <div className="pd-bp-meta">
                  <div className="pd-bp-name">{bp.name || "—"}</div>
                  <div className="pd-bp-tags">
                    {bp.industries?.slice(0, 3).map((t) => (
                      <span className="chip chip-soft" key={`ind-${t}`}>{cap(t)}</span>
                    ))}
                    {bp.languages?.slice(0, 3).map((t) => (
                      <span className="chip chip-soft" key={`lng-${t}`}>{cap(t)}</span>
                    ))}
                    {bp.countries?.slice(0, 2).map((t) => (
                      <span className="chip chip-soft" key={`cty-${t}`}>{cap(t)}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="pd-cta">
              {bpHref ? <a className="pd-btn" href={bpHref}>View company</a> : null}
              <a className="pd-btn pd-btn-ghost" href="/market">Back to market</a>
            </div>
          </div>
        </section>

        {/* body */}
        <section className="pd-body">
          <div className="pd-grid">
            {/* left */}
            <article className="pd-card">
              {summary ? <p className="pd-text">{summary}</p> : null}
              {details ? <div className="pd-rich" dangerouslySetInnerHTML={{ __html: details }} /> : null}

              {tags?.length ? (
                <>
                  <h3 className="pd-h3">Highlights</h3>
                  <ul className="pd-list">
                    {tags.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                </>
              ) : null}

              {gallery?.length ? (
                <>
                  <h3 className="pd-h3">Gallery</h3>
                  <div className="pd-gallery">
                    {gallery.map((src, i) => (
                      <a className="pd-gimg" key={`${src}-${i}`} href={src} target="_blank" rel="noreferrer" style={{ backgroundImage: `url(${src})` }} />
                    ))}
                  </div>
                </>
              ) : null}
            </article>

            {/* right */}
            {(bp.name || bp.logo) && (
              <aside className="pd-card pd-bpcard">
                <div className="pd-bp-row">
                  {bp.logo ? <img className="pd-bp-logo lg" src={bp.logo} alt={bp.name} /> : <div className="pd-bp-logo lg" />}
                  <div>
                    <div className="pd-bp-name">{bp.name || "—"}</div>
                    <div className="pd-bp-tags">
                      {bp.industries?.slice(0, 4).map((t) => (
                        <span className="chip chip-soft" key={`i-${t}`}>{cap(t)}</span>
                      ))}
                    </div>
                  </div>
                </div>

                {(bp.countries?.length || bp.languages?.length) ? (
                  <div className="pd-kv">
                    {bp.countries?.length ? (
                      <div className="pd-kv-row">
                        <div className="pd-k">Countries</div>
                        <div className="pd-v">{bp.countries.map(cap).join(", ")}</div>
                      </div>
                    ) : null}
                    {bp.languages?.length ? (
                      <div className="pd-kv-row">
                        <div className="pd-k">Languages</div>
                        <div className="pd-v">{bp.languages.map(cap).join(", ")}</div>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                <div className="pd-actions">
                  {bpHref ? <a className="pd-btn" href={bpHref}>Open Business Profile</a> : null}
                  <a className="pd-btn pd-btn-ghost" href="/messages">Contact Supplier</a>
                </div>
              </aside>
            )}
          </div>
        </section>
      </main>

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

ProductPage.propTypes = {
  fallbackProduct: PropTypes.object,
};
