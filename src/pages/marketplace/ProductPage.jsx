// src/pages/products/ProductPage.jsx
import React from "react";
import { useParams, useLocation } from "react-router-dom";
import PropTypes from "prop-types";
import HeaderShell from "../../components/layout/HeaderShell";
import Footer from "../../components/footer/Footer";
import { topbar, nav, cta, footerData } from "../main.mock";
import { useGetMarketItemQuery } from "../../features/bp/BPApiSlice";
import imageLink from "../../utils/imageLink";
import "./product-page.css";

const I = {
  check: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="m4 12 5 5 11-11" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
  globe: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M12 3a9 9 0 100 18 9 9 0 000-18Zm0 0c3.5 3.5 3.5 14.5 0 18M3 12h18" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  ),
  map: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M9 18l-6 3V6l6-3 6 3 6-3v15l-6 3-6-3zM9 3v15M15 6v15" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  ),
  mail: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M4 6h16v12H4z" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M4 7l8 6 8-6" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  ),
};

const cap = (s="") => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;

export default function ProductPage({ fallbackProduct }) {
  const { productId } = useParams();
  const location = useLocation(); // kept to not disturb your router usage

  const { data: item, isFetching } = useGetMarketItemQuery(productId);

  // derive display fields from API shape you provided
  const profile = item?.profile || {};
  const imgs = Array.isArray(item?.images) ? item.images : [];
  const cover = imgs[0] ? imageLink(imgs[0]) : "";
  const companyName = profile?.name || "";
  const companyHref = profile?.slug || profile?.id ? `/businessprofile/${ profile.id}#sectors` : "#";
  const country = Array.isArray(profile?.countries) && profile.countries.length ? cap(String(profile.countries[0])) : "";
  const city = ""; // API sample doesn't include city

  // map optional sections to your existing UI expectations
  const product = item ? {
    title: item.title || "—",
    company: companyName || "—",
    companyId: profile?.slug || profile?.id || "",
    sector: cap(item.sector || "—"),
    city,
    country,
    cover,
    description: item.summary || "",
    summary: item.summary || "",
    features: Array.isArray(item.tags) ? item.tags : [],       // reuse tags as features (optional)
    specs: {},                                                // API has no specs; keeps your "empty" state
    gallery: imgs.map(imageLink),                             // for the gallery grid
  } : null;

  // business profile block (keep classes, just fill with available data)
  const bp = {
    orgName: profile?.name || "—",
    logo: profile?.logoUpload ? imageLink(profile.logoUpload) : "",
    tagline: Array.isArray(profile?.industries) && profile.industries.length
      ? profile.industries.map(cap).join(" • ")
      : "",
    city: "", // not in payload
    country: country || "",
    website: "", // not in payload
    email: "",   // not in payload
    offerings: Array.isArray(item?.tags) ? item.tags : [],
    badges: Array.isArray(profile?.languages) ? profile.languages.map(cap) : [],
    openHref: companyHref,
  };

  if (isFetching) {
    return (
      <>
        <HeaderShell top={topbar} nav={nav} cta={cta} />
        <main className="ppg">
          <div className="container">
            <div className="ppg-body">
              <div className="ppg-card ppg-empty">Loading…</div>
            </div>
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

  if (!product) {
    return (
      <>
        <HeaderShell top={topbar} nav={nav} cta={cta} />
        <main className="ppg">
          <div className="container">
            <div className="ppg-body">
              <div className="ppg-card ppg-empty">Product not found.</div>
            </div>
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

  const bannerStyle = product.cover
    ? { backgroundImage: `linear-gradient(180deg, rgba(22,36,65,.35), rgba(22,36,65,.80)), url(${product.cover})` }
    : { backgroundImage: `linear-gradient(135deg, var(--brand), var(--brand-2))` };

  return (
    <>
      <HeaderShell top={topbar} nav={nav} cta={cta} />

      <main className="ppg">
        {/* HERO */}
        <header className="ppg-hero">
          <div className="ppg-banner" style={bannerStyle} aria-hidden="true" />
          <div className="container ppg-hero-inner">
            <div>
              <h1 className="ppg-title">{product.title}</h1>
              <div className="ppg-meta">
                <span className="chip">{product.company}</span>
                <span className="chip">{product.sector}</span>
                <span className="chip">
                  {product.city && product.country
                    ? `${product.city}, ${product.country}`
                    : product.city || product.country || "—"}
                </span>
              </div>
            </div>
            <div className="ppg-cta">
              {product.companyId ? (
                <a className="ppg-btn" href={companyHref}>View company</a>
              ) : null}
              <a className="ppg-btn ppg-btn-ghost" href="/marketplace">Back to marketplace</a>
            </div>
          </div>
        </header>

        {/* BODY */}
        <section className="container ppg-body">
          <div className="ppg-grid">
            {/* LEFT: Overview */}
            <div className="ppg-card">
              <h3 className="ppg-h">Overview</h3>
              <p className="ppg-text">{product.description || product.summary || "—"}</p>

              {Array.isArray(product.features) && product.features.length ? (
                <>
                  <h4 className="ppg-sub">Key features</h4>
                  <ul className="ppg-list">
                    {product.features.map((f, i) => (
                      <li key={i}>
                        <I.check /> {f}
                      </li>
                    ))}
                  </ul>
                </>
              ) : null}

              {product.gallery.length ? (
                <>
                  <h4 className="ppg-sub">Gallery</h4>
                  <div className="ppg-gallery">
                    {product.gallery.map((g, i) => (
                      <figure className="ppg-gimg" key={`${i}-${g}`}>
                        <img src={g} alt={`${product.title} ${i + 1}`} />
                      </figure>
                    ))}
                  </div>
                </>
              ) : null}
            </div>

            {/* RIGHT: Specs */}
            <aside className="ppg-card">
              <h3 className="ppg-h">Specs</h3>
              {product.specs && Object.keys(product.specs).length ? (
                <div className="ppg-specs">
                  {Object.entries(product.specs).map(([k, v]) => (
                    <div className="ppg-spec" key={k}>
                      <div className="ppg-spec-k">{k}</div>
                      <div className="ppg-spec-v">{String(v)}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="ppg-empty">No technical specs provided.</div>
              )}
            </aside>
          </div>

          {/* Business Profile (kept layout/classes, populated from API) */}
          <aside className="ppg-card bp my-2">
            <div className="bp-head">
              <img className="bp-logo" src={bp.logo} alt={bp.orgName} />
              <div className="bp-meta">
                <h3 className="bp-name">{bp.orgName}</h3>
                {bp.tagline ? <p className="bp-tagline">{bp.tagline}</p> : null}
              </div>
            </div>

            {bp.badges?.length ? (
              <div className="bp-badges">
                {bp.badges.map((b) => (
                  <span key={b} className="chip chip-soft">{b}</span>
                ))}
              </div>
            ) : null}

            {bp.offerings?.length ? (
              <div className="bp-offerings">
                <h4 className="bp-sub">Offerings</h4>
                <ul className="bp-list">
                  {bp.offerings.map((o) => (
                    <li key={o}><I.check /> {o}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {(bp.country || bp.city || bp.website || bp.email) ? (
              <div className="bp-info">
                {(bp.city || bp.country) ? (
                  <div className="bp-row">
                    <I.map /><span>{[bp.city, bp.country].filter(Boolean).join(", ")}</span>
                  </div>
                ) : null}
                {bp.website ? (
                  <a className="bp-row" href={bp.website} target="_blank" rel="noreferrer">
                    <I.globe /><span>{bp.website.replace(/^https?:\/\//, "")}</span>
                  </a>
                ) : null}
                {bp.email ? (
                  <a className="bp-row" href={`mailto:${bp.email}`}>
                    <I.mail /><span>{bp.email}</span>
                  </a>
                ) : null}
              </div>
            ) : null}

            <div className="bp-actions">
              {product.companyId ? (
                <a className="ppg-btn" href={companyHref}>Open Business Profile</a>
              ) : null}
              <a className="ppg-btn ppg-btn-ghost" href="/messages">Contact Supplier</a>
            </div>
          </aside>
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
