// src/pages/products/ProductPage.jsx
import React, { useMemo } from "react";
import { useParams } from "react-router-dom";
import PropTypes from "prop-types";
import HeaderShell from "../../components/layout/HeaderShell";
import Footer from "../../components/footer/Footer";
import { topbar, nav, cta, footerData } from "../main.mock";
import { useGetMarketItemQuery } from "../../features/bp/BPApiSlice";
import imageLink from "../../utils/imageLink";

const cap = (s = "") => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const fmtPrice = (v, cur, unit, note) => {
  const num = typeof v === "number" ? v : v ? Number(v) : null;
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
      <main className="bg-slate-50 min-h-[60vh]">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="bg-white rounded-lg shadow p-8 text-center text-slate-700">Item not found.</div>
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
        <main className="bg-slate-50">
          <div className="max-w-6xl mx-auto px-4 py-12">
            <div className="animate-pulse">
              <div className="h-44 rounded-lg bg-slate-200 mb-6" />
              <div className="space-y-4">
                <div className="h-6 bg-slate-200 rounded w-3/4" />
                <div className="h-4 bg-slate-200 rounded w-1/3" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <div className="h-40 bg-slate-200 rounded" />
                  <div className="h-40 bg-slate-200 rounded md:col-span-2" />
                </div>
              </div>
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
  if (!view) return notFoundUI;

  const { cover, title, kind, sector, subsector, summary, details, gallery, tags, priceStr, bp } = view;
  const bpHref = bp.slug || bp.id ? `/BusinessProfile/${bp.id}` : null;

  return (
    <>
      <HeaderShell top={topbar} nav={nav} cta={cta} />

      <main className="bg-slate-50">
        {/* header */}
        <section className="relative">
          <div
            className={`w-full h-56 md:h-72 bg-slate-100 ${cover ? "" : "bg-gradient-to-r from-slate-100 to-white"}`}
            style={cover ? { backgroundImage: `url(${cover})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
            aria-hidden
          />
          <div className="max-w-6xl mx-auto px-4 -mt-16 md:-mt-20">
            <div className="bg-white rounded-lg shadow p-6 md:p-8">
              <div className="md:flex md:items-start md:gap-6">
                <div className="flex-shrink-0 w-full md:w-48">
                  {cover ? (
                    <div className="w-full h-32 md:h-40 rounded-md overflow-hidden bg-slate-50 border">
                      <img src={cover} alt={title} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-full h-32 md:h-40 rounded-md bg-slate-100 border flex items-center justify-center text-slate-400">
                      No image
                    </div>
                  )}
                </div>

                <div className="mt-4 md:mt-0 flex-1">
                  <h1 className="text-2xl md:text-3xl font-semibold text-slate-800">{title}</h1>

                  <div className="mt-3 flex flex-wrap gap-2 items-center">
                    {kind && <span className="text-xs md:text-sm px-2 py-1 bg-slate-100 rounded-full text-slate-700">{kind}</span>}
                    {sector && <span className="text-xs md:text-sm px-2 py-1 bg-slate-100 rounded-full text-slate-700">{sector}</span>}
                    {subsector && <span className="text-xs md:text-sm px-2 py-1 bg-slate-100 rounded-full text-slate-700">{subsector}</span>}
                    {priceStr && <span className="text-xs md:text-sm px-2 py-1 rounded-full bg-indigo-600 text-white font-medium">{priceStr}</span>}
                  </div>

                  {/* BP inline */}
                  {(bp.name || bp.logo) && (
                    <div className="mt-4 md:flex md:items-center md:gap-4">
                      <div className="flex items-center gap-3">
                        {bp.logo ? (
                          <img src={bp.logo} alt={bp.name} className="w-12 h-12 object-contain rounded-md border bg-white" />
                        ) : (
                          <div className="w-12 h-12 rounded-md bg-slate-100 border" />
                        )}
                        <div>
                          <div className="text-sm font-medium text-slate-800">{bp.name || "—"}</div>
                          <div className="flex gap-2 mt-1 flex-wrap">
                            {bp.industries?.slice(0, 3).map((t) => (
                              <span key={`ind-${t}`} className="text-xs px-2 py-1 bg-slate-100 rounded-full text-slate-700">{cap(t)}</span>
                            ))}
                            {bp.languages?.slice(0, 3).map((t) => (
                              <span key={`lng-${t}`} className="text-xs px-2 py-1 bg-slate-100 rounded-full text-slate-700">{cap(t)}</span>
                            ))}
                            {bp.countries?.slice(0, 2).map((t) => (
                              <span key={`cty-${t}`} className="text-xs px-2 py-1 bg-slate-100 rounded-full text-slate-700">{cap(t)}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap gap-3">
                    {bpHref ? (
                      <a href={bpHref} className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-md shadow-sm">View company</a>
                    ) : null}
                    <a href="/market" className="inline-block px-4 py-2 border rounded-md text-slate-700 bg-white">Back to market</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* body */}
        <section className="max-w-6xl mx-auto px-4 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* left */}
            <article className="lg:col-span-2 bg-white rounded-lg shadow p-6">
              {summary ? <p className="text-slate-700">{summary}</p> : null}
              {details ? <div className="mt-4 prose max-w-none text-slate-700" dangerouslySetInnerHTML={{ __html: details }} /> : null}

              {tags?.length ? (
                <>
                  <h3 className="mt-6 text-lg font-semibold text-slate-800">Highlights</h3>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-slate-700">
                    {tags.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                </>
              ) : null}

              {gallery?.length ? (
                <>
                  <h3 className="mt-6 text-lg font-semibold text-slate-800">Gallery</h3>
                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {gallery.map((src, i) => (
                      <a
                        key={`${src}-${i}`}
                        href={src}
                        target="_blank"
                        rel="noreferrer"
                        className="block w-full h-36 rounded-md bg-center bg-cover border"
                        style={{ backgroundImage: `url(${src})` }}
                        aria-label={`Gallery ${i + 1}`}
                      />
                    ))}
                  </div>
                </>
              ) : null}
            </article>

            {/* right */}
            {(bp.name || bp.logo) && (
              <aside className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center gap-4">
                  {bp.logo ? (
                    <img src={bp.logo} alt={bp.name} className="w-16 h-16 object-contain rounded-md border bg-white" />
                  ) : (
                    <div className="w-16 h-16 rounded-md bg-slate-100 border" />
                  )}
                  <div>
                    <div className="text-sm font-medium text-slate-800">{bp.name || "—"}</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {bp.industries?.slice(0, 4).map((t) => (
                        <span key={`i-${t}`} className="text-xs px-2 py-1 bg-slate-100 rounded-full text-slate-700">{cap(t)}</span>
                      ))}
                    </div>
                  </div>
                </div>

                {(bp.countries?.length || bp.languages?.length) ? (
                  <div className="mt-6 space-y-3 text-sm text-slate-700">
                    {bp.countries?.length ? (
                      <div className="flex items-start gap-3">
                        <div className="w-24 text-slate-500">Countries</div>
                        <div className="flex-1">{bp.countries.map(cap).join(", ")}</div>
                      </div>
                    ) : null}
                    {bp.languages?.length ? (
                      <div className="flex items-start gap-3">
                        <div className="w-24 text-slate-500">Languages</div>
                        <div className="flex-1">{bp.languages.map(cap).join(", ")}</div>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                <div className="mt-6 flex flex-col gap-3">
                  {bpHref ? <a className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-md text-center" href={bpHref}>Open Business Profile</a> : null}
                  <a className="inline-block px-4 py-2 border rounded-md text-center text-slate-700 bg-white" href="/messages">Contact Supplier</a>
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
