// src/pages/products/ProductPage.jsx
import React, { useMemo } from "react";
import { useLocation, useParams } from "react-router-dom";
import PropTypes from "prop-types";
import HeaderShell from "../../components/layout/HeaderShell";
import Footer from "../../components/footer/Footer";
import { topbar, nav, cta, footerData } from "../main.mock";
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

/* ---------------------- Product fallbacks (unchanged) ---------------------- */
function pickFallback(productId, passed) {
  if (passed) return passed;
  const global = Array.isArray(window.__MK_PRODUCTS)
    ? window.__MK_PRODUCTS.find((p) => p.id === productId)
    : null;
  if (global) return global;
  try {
    const raw = sessionStorage.getItem("mk:lastProduct");
    const obj = raw ? JSON.parse(raw) : null;
    if (obj && obj.id === productId) return obj;
  } catch {}
  return null;
}

/* ---------------------- Business Profile Mock ---------------------- */
/* Keep it simple but useful. */
const BP_MOCK = [
  {
    id: 1,
    orgName: "YourCo Industries",
    logo: "https://api.dicebear.com/7.x/initials/svg?seed=YourCo",
    tagline: "Powering tomorrow’s infrastructure.",
    country: "DE",
    city: "Berlin",
    website: "https://yourco.example",
    email: "sales@yourco.example",
    overview:
      "YourCo builds modular hardware and cloud software for utilities and critical infrastructure. We deliver secure, standards-compliant systems deployed in 40+ countries.",
    offerings: ["Industrial gateways", "DER control", "Telemetry SaaS"],
    badges: ["ISO 27001", "CE", "RoHS"],
  },
  {
    id: 2,
    orgName: "HelioGrid",
    logo: "https://api.dicebear.com/7.x/initials/svg?seed=HelioGrid",
    tagline: "Cleaner grids, smarter storage.",
    country: "DE",
    city: "Leipzig",
    website: "https://heliogrid.example",
    email: "contact@heliogrid.example",
    overview:
      "HelioGrid designs advanced battery management systems and fleet software for utility-scale storage and C&I applications.",
    offerings: ["BMS hardware", "Fleet analytics", "Commissioning services"],
    badges: ["UL", "IEC 62619"],
  },
  {
    id: 3,
    orgName: "FlowOps",
    logo: "https://api.dicebear.com/7.x/initials/svg?seed=FlowOps",
    tagline: "Observe. Decide. Act.",
    country: "US",
    city: "Austin",
    website: "https://flowops.example",
    email: "hello@flowops.example",
    overview:
      "FlowOps is a SaaS suite for grid monitoring and real-time alerting. Utilities and IPPs use FlowOps to orchestrate DER and reduce downtime.",
    offerings: ["Monitoring", "Alerting", "APIs"],
    badges: ["SOC 2", "GDPR-ready"],
  },
  {
    id: 4,
    orgName: "Voltix",
    logo: "https://api.dicebear.com/7.x/initials/svg?seed=Voltix",
    tagline: "Measure to manage.",
    country: "IT",
    city: "Milan",
    website: "https://voltix.example",
    email: "sales@voltix.example",
    overview:
      "Voltix manufactures precision current transformers and metering accessories used by energy auditors and OEMs worldwide.",
    offerings: ["CT sensors", "Meters", "Calibration"],
    badges: ["CE", "MID"],
  },
  {
    id: 5,
    orgName: "SunFleet",
    logo: "https://api.dicebear.com/7.x/initials/svg?seed=SunFleet",
    tagline: "Orchestrate your DER.",
    country: "ES",
    city: "Madrid",
    website: "https://sunfleet.example",
    email: "info@sunfleet.example",
    overview:
      "SunFleet provides rule-based DER controllers and virtual power plant readiness for solar + storage deployments.",
    offerings: ["DER controller", "Rule engine", "Integration"],
    badges: ["CE", "UL"],
  },
  {
    id: 6,
    orgName: "AmpRoad",
    logo: "https://api.dicebear.com/7.x/initials/svg?seed=AmpRoad",
    tagline: "Fast, reliable charging.",
    country: "FR",
    city: "Lyon",
    website: "https://amproad.example",
    email: "contact@amproad.example",
    overview:
      "AmpRoad builds DC fast chargers with OCPP backends and smart billing for fleet and public charging networks.",
    offerings: ["DC chargers", "OCPP backend", "Maintenance"],
    badges: ["CE", "IEC"],
  },
];

/* Deterministic picker:
   Use the product title length → map to a BP id in 1..BP_MOCK.length */
function pickBusinessProfile(product) {
  const len = (product?.title || product?.name || "").length;
  const id = (len % BP_MOCK.length) + 1; // 1..N
  return BP_MOCK.find((b) => b.id === id) || BP_MOCK[0];
}

export default function ProductPage({ fallbackProduct }) {
  const { productId } = useParams();
  const location = useLocation();

  const product = useMemo(() => {
    const fromState = location.state?.product || null;
    const p = pickFallback(productId, fromState) || fallbackProduct || null;
    return p;
  }, [productId, location.state, fallbackProduct]);

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
    ? {
        backgroundImage: `linear-gradient(180deg, rgba(22,36,65,.35), rgba(22,36,65,.80)), url(${product.cover})`,
      }
    : { backgroundImage: `linear-gradient(135deg, var(--brand), var(--brand-2))` };

  const gallery = Array.isArray(product.gallery) ? product.gallery : [];
  const bp = pickBusinessProfile(product);

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
              <a className="ppg-btn" href={`/BusinessProfile/${product.companyId}`}>View company</a>
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
              <p className="ppg-text">{product.description || product.summary}</p>

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

              {gallery.length ? (
                <>
                  <h4 className="ppg-sub">Gallery</h4>
                  <div className="ppg-gallery">
                    {gallery.map((g, i) => (
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

            {/* RIGHT: Business Profile (NEW) */}
            
          </div>
          <aside className="ppg-card bp my-2">
              <div className="bp-head">
                <img className="bp-logo" src={bp.logo} alt={bp.orgName} />
                <div className="bp-meta">
                  <h3 className="bp-name">{bp.orgName}</h3>
                  <p className="bp-tagline">{bp.tagline}</p>
                </div>
              </div>

              <div className="bp-badges">
                {bp.badges?.map((b) => (
                  <span key={b} className="chip chip-soft">{b}</span>
                ))}
              </div>

              <div className="bp-overview">
                <p>{bp.overview}</p>
              </div>

              <div className="bp-offerings">
                <h4 className="bp-sub">Offerings</h4>
                <ul className="bp-list">
                  {bp.offerings?.map((o) => (
                    <li key={o}><I.check /> {o}</li>
                  ))}
                </ul>
              </div>

              <div className="bp-info">
                <div className="bp-row">
                  <I.map /><span>{bp.city}, {bp.country}</span>
                </div>
                <a className="bp-row" href={bp.website} target="_blank" rel="noreferrer">
                  <I.globe /><span>{bp.website.replace(/^https?:\/\//, "")}</span>
                </a>
                <a className="bp-row" href={`mailto:${bp.email}`}>
                  <I.mail /><span>{bp.email}</span>
                </a>
              </div>

              <div className="bp-actions">
                <a className="ppg-btn" href={`/BusinessProfile/${product.companyId}`}>Open Business Profile</a>
                <a className="ppg-btn ppg-btn-ghost" href="/messages">
                  Contact Supplier
                </a>
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
