import React from "react";
import PropTypes from "prop-types";
import "./business-overview.css";
import imageLink from "../../utils/imageLink";

/* tiny inline icons – no deps */
const I = {
  star: (p = 1) => (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill={p ? "currentColor" : "none"}
        stroke="currentColor"
        d="m12 3 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 18.8 6.2 21l1.1-6.5L2.6 9.8l6.5-.9L12 3z"
      />
    </svg>
  ),
  check: () => (
    <svg width="14" height="14" viewBox="0 0 24 24">
      <path fill="currentColor" d="m9 16.2-3.5-3.5L4 14.2 9 19l12-12-1.5-1.5L9 16.2Z" />
    </svg>
  ),
  box: () => (
    <svg width="14" height="14" viewBox="0 0 24 24">
      <path fill="currentColor" d="m12 2 9 5v10l-9 5-9-5V7l9-5Zm0 2.2L6.2 7 12 9.8 17.8 7 12 4.2ZM5 8.3v7.8L11 20v-7.7L5 8.3Zm8 3V20l6-3.9V8.3L13 11.3Z" />
    </svg>
  ),
  users: () => (
    <svg width="14" height="14" viewBox="0 0 24 24">
      <path
        fill="currentColor"
        d="M16 11a4 4 0 1 0-4-4 4 4 0 0 0 4 4ZM8 11a3 3 0 1 0-3-3 3 3 0 0 0 3 3Zm8 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4Zm-8 1c-.29 0-.62.02-.97.06C6.27 14.41 5 15.2 5 16v3h5v-2c0-.7.18-1.34.49-1.93A12.42 12.42 0 0 0 8 14Z"
      />
    </svg>
  ),
};

const stars = (val = 0) => {
  if (typeof val !== "number" || Number.isNaN(val)) return null;
  const full = Math.floor(val);
  const half = val - full >= 0.5;
  return full > 0 ? (
    <div className="bpov-stars" aria-label={`Average rating ${val} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={`bpov-star ${i < full ? "on" : half && i === full ? "half" : ""}`}>
          {I.star(i < full || (half && i === full))}
        </span>
      ))}
      <div className="bpov-rating-num">{val.toFixed(1)} / 5</div>
    </div>
  ): null;
};

function KPI({ label, value, icon }) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div className="kpi">
      <div className="kpi-top">
        <span className="kpi-label">{label}</span>
        {icon ? <span className="kpi-ico">{icon}</span> : null}
      </div>
      <div className="kpi-val">{value}</div>
    </div>
  );
}

function Tile({ label, value }) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div className="bpov-tile">
      <div className="bpov-tv">{value}</div>
      <div className="bpov-tl">{label}</div>
    </div>
  );
}

const getItemThumb = (item) => {
  const t = item?.thumbnailUpload ? imageLink(item.thumbnailUpload) : "";
  const fromImgs =
    Array.isArray(item?.images) && item.images.length ? imageLink(item.images[0]) : "";
  return t || fromImgs || "";
};

export default function BusinessOverview({
  stats = {},
  products = [],
  services = [],
  clients = [],
  industries = [],
  rating,                 // number (optional)
  offerings = [],         // array of strings (optional)
  lookingFor = [],        // array of strings (optional)
  capabilities = [],      // array of strings (optional)
  innovation = {},        // { patents, rdSpendPct, techStack[] }
  locations = [],         // array of strings
  certifications = [],    // array of strings
  gallery = [],           // <-- NEW: array of uploadIds/paths (from mySummary.profile.gallery)
}) {
  // Merge product & service cards (limit for summary section)
  const cards = [
    ...products.map((p) => ({ ...p, type: "product" })),
    ...services.map((s) => ({ ...s, type: "service" })),
  ].slice(0, 8);

  // KPIs present -> shown; absent -> hidden
  const {
    products: kProducts,
    services: kServices,
    clients: kClients,
    meetings,
    deals,
    nps,
    responseTime,
  } = stats || {};

  const techStack = Array.isArray(innovation?.techStack) ? innovation.techStack : [];

  const hasAnyKPIs =
    kProducts != null ||
    kServices != null ||
    kClients != null ||
    meetings != null ||
    deals != null ||
    nps != null ||
    responseTime != null;

  const galleryList = Array.isArray(gallery) ? gallery.filter(Boolean) : [];
  const hasLen  = (v) => Array.isArray(v) && v.length > 0;
const hasNum  = (v) => v !== null && v !== undefined; // 0 is valid
const hasTech = hasLen(techStack);
const hasLoc  = hasLen(locations);
const hasCert = hasLen(certifications);

const hasInnovation = hasNum(innovation?.patents) || hasNum(innovation?.rdSpendPct) || hasTech;
const hasPresence   = (offerings?.length || lookingFor?.length || capabilities?.length);
const inno =(innovation?.patents != null ||
        innovation?.rdSpendPct != null ||
        techStack.length ||
        locations.length ||
        certifications.length);

const inno1 =(innovation?.patents != null || innovation?.rdSpendPct != null || techStack.length)
  return (
    <section className="bpov my-2">
      {/* Rating & Industries header row */}
      {(rating != null || (industries && industries.length)) && (
        <header className="bpov-head">
          <div className="bpov-id-meta">
            {industries?.length ? (
              <div className="bpov-cap">
                {industries.map((s, i) => (
                  <span key={`ind-${i}`} className="cap">
                    {s}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
          {rating != null ? <div className="bpov-rating">{stars(rating)}</div> : null}
        </header>
      )}

      {/* KPIs */}
      {hasAnyKPIs && (
        <div className="bpov-kpis">
          <KPI label="Products" value={kProducts} />
          <KPI label="Services" value={kServices} />
          <KPI label="Clients" value={kClients} />
          <KPI label="Meetings" value={meetings} icon={<I.users />} />
          <KPI label="Deals" value={deals} />
          <KPI label="NPS" value={nps} />
          <KPI label="Response" value={responseTime} />
        </div>
      )}

      {/* Offer / Looking for + capabilities */}
      {hasPresence && (
        <div className="bpov-rows my-2">
          {offerings?.length ? (
            <div className="bpov-card ">
              <div className="bpov-card-head">
                <h3>What we offer</h3>
              </div>
              <ul className="bpov-list">
                {offerings.map((x, i) => (
                  <li key={`off-${i}`}>
                    <span className="ok">{I.check()}</span>
                    {x}
                  </li>
                ))}
              </ul>
              {capabilities?.length ? (
                <div className="bpov-cap">
                  {capabilities.map((c, i) => (
                    <span key={`cap-${i}`} className="cap">
                      {c}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          {lookingFor?.length ? (
            <div className="bpov-card">
              <div className="bpov-card-head">
                <h3>What we’re seeking</h3>
              </div>
              <ul className="bpov-list">
                {lookingFor.map((x, i) => (
                  <li key={`lf-${i}`}>
                    <span className="ok">{I.check()}</span>
                    {x}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      )}

      {/* Products / Services (summary) */}
      {cards.length ? (
        <div className="bpov-card my-2">
          <div className="bpov-card-head between">
            <h3>Products & Services</h3>
            <a className="bpov-link" href="#sectors">
              See all
            </a>
          </div>
          <div className="bpov-grid">
            {cards.map((p) => {
              const thumb = getItemThumb(p);
              const summary = p.blurb || p.summary || "";
              return (
                <article key={p.id || p._id} className="bpov-item" title={p.name || p.title}>
                  <a className="bpov-item-link" href={`/products/${p.id || p._id}`}>
                    <div
                      className={`bpov-thumb ${thumb ? "has-img" : ""}`}
                      style={thumb ? { backgroundImage: `url(${thumb})` } : undefined}
                    >
                      {!thumb && <span className="bpov-thumb-ico">{p.type === "product" ? I.box() : I.users()}</span>}
                      <span className={`bpov-pill ${p.type}`}>{p.type}</span>
                    </div>
                    <div className="bpov-item-body">
                      <h4 className="bpov-item-title">{p.name || p.title || "Untitled"}</h4>
                      {summary ? <p className="bpov-item-blurb">{summary}</p> : null}
                    </div>
                  </a>
                </article>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Gallery (from mySummary.profile.gallery) */}
      {galleryList.length ? (
        <div className="bpov-card">
          <div className="bpov-card-head between">
            <h3>Gallery</h3>
            <span className="bpov-muted">{galleryList.length} images</span>
          </div>
          <div className="bpov-gallery">
            {galleryList.map((g, i) => {
              const src = imageLink(g);
              return (
                <a
                  key={`${String(g)}-${i}`}
                  className="bpov-gimg"
                  href={src}
                  target="_blank"
                  rel="noreferrer"
                  title={`Image ${i + 1}`}
                >
                  <img src={src} alt={`Gallery ${i + 1}`} loading="lazy" />
                </a>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Clients (logos) */}
      {Array.isArray(clients) && clients.length ? (
        <div className="bpov-card">
          <div className="bpov-card-head between">
            <h3>Trusted by</h3>
            <span className="bpov-muted">{clients.length} clients</span>
          </div>
          <div className="bpov-logos">
            {clients.map((c, i) => (
              <div
                key={c.id || i}
                className="bpov-logo"
                style={c.logo ? { backgroundImage: `url(${c.logo})` } : undefined}
                title={c.name || ""}
                aria-label={c.name || ""}
              />
            ))}
          </div>
        </div>
      ) : null}

      {/* Innovation & Presence */}
      {inno && (
        <div className="bpov-rows">
          {inno1 ? (
            <div className="bpov-card">
              <div className="bpov-card-head">
                <h3>Innovation</h3>
              </div>
              <div className="bpov-tiles">
                <Tile label="Patents" value={innovation?.patents} />
                <Tile label="R&D Spend" value={innovation?.rdSpendPct != null ? `${innovation.rdSpendPct}%` : null} />
              </div>
              {techStack.length ? (
                <div className="bpov-cap stack">
                  {techStack.map((t, i) => (
                    <span key={`tech-${i}`} className="cap soft">
                      {t}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          ): null}

          {(locations.length || certifications.length) && (
            <div className="bpov-card">
              <div className="bpov-card-head">
                <h3>Presence & Compliance</h3>
              </div>
              {locations.length ? (
                <div className="bpov-cap">
                  {locations.map((l, i) => (
                    <span key={`loc-${i}`} className="cap">
                      {l}
                    </span>
                  ))}
                </div>
              ) : null}
              {certifications.length ? (
                <div className="bpov-cap">
                  {certifications.map((c, i) => (
                    <span key={`cert-${i}`} className="cap soft">
                      {c}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

/* props */
BusinessOverview.propTypes = {
  stats: PropTypes.shape({
    products: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    services: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    clients: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    meetings: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    deals: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    responseTime: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    nps: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    rating: PropTypes.object,
    facts: PropTypes.object,
    innovation: PropTypes.object,
    locations: PropTypes.array,
    certifications: PropTypes.array,
  }),
  products: PropTypes.array,
  services: PropTypes.array,
  clients: PropTypes.array,
  industries: PropTypes.arrayOf(PropTypes.string),
  rating: PropTypes.number,
  offerings: PropTypes.arrayOf(PropTypes.string),
  lookingFor: PropTypes.arrayOf(PropTypes.string),
  capabilities: PropTypes.arrayOf(PropTypes.string),
  innovation: PropTypes.shape({
    patents: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    rdSpendPct: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    techStack: PropTypes.arrayOf(PropTypes.string),
  }),
  locations: PropTypes.arrayOf(PropTypes.string),
  certifications: PropTypes.arrayOf(PropTypes.string),
  gallery: PropTypes.arrayOf(PropTypes.any), // ids or paths
};

KPI.propTypes = {
  label: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  icon: PropTypes.node,
};
Tile.propTypes = {
  label: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};
