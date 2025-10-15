// src/pages/bp/BusinessProfilePage.jsx
import React from "react";
import PropTypes from "prop-types";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import "./business-profile.css";

import BusinessOverview from "../../components/BusinessProfile/BusinessOverview";
import BusinessTeam from "../../components/BusinessProfile/BusinessTeam";
import BusinessContact from "../../components/BusinessProfile/BusinessContact";
import BusinessEngagements from "../../components/BusinessProfile/BusinessEngagements";
import BusinessSectors from "../../components/BusinessProfile/BusinessSectors";

import HeaderShell from "../../components/layout/HeaderShell";
import Footer from "../../components/footer/Footer";
import { cta, footerData, nav, topbar } from "../main.mock";
import imageLink from "../../utils/imageLink";

import {
  useGetMyBPQuery,
  useGetProfileBySlugQuery,
  useGetProfileByIdQuery,
  useListProfileItemsQuery,
  useGetProfileOverviewQuery,
  useGetPublicTeamQuery,
} from "../../features/bp/BPApiSlice";

/* tiny inline icons */
const I = {
  pin: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11Z" stroke="currentColor" />
      <circle cx="12" cy="10" r="2" stroke="currentColor" />
    </svg>
  ),
  link: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M10 14a5 5 0 0 1 0-7l1-1a5 5 0 0 1 7 7l-1 1M14 10a5 5 0 0 1 0 7l-1 1a5 5 0 0 1-7-7l1-1" stroke="currentColor" />
    </svg>
  ),
  shield: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M12 3 4 6v6c0 5 8 9 8 9s8-4 8-9V6l-8-3Z" stroke="currentColor" />
    </svg>
  ),
};

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "sectors", label: "Sectors" },
  { key: "team", label: "Team" },
  { key: "contact", label: "Contact" },
  { key: "engagements", label: "Engagements" },
];

const isObj = (v) => v && typeof v === "object" && !Array.isArray(v);
const safeArray = (v) => (Array.isArray(v) ? v : []);
const safeObj = (v) => (isObj(v) ? v : {});
const lower = (s) => String(s || "").toLowerCase();

/* tab via hash */
function useHashTab(defaultKey = "overview") {
  const [tab, setTab] = React.useState(() => {
    const h = (typeof window !== "undefined" && window.location.hash.replace("#", "")) || "";
    return TABS.some((t) => t.key === h) ? h : defaultKey;
  });
  React.useEffect(() => {
    const onHash = () => {
      const k = window.location.hash.replace("#", "");
      if (TABS.some((t) => t.key === k)) setTab(k);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  const go = (k) => {
    if (k === tab) return;
    setTab(k);
    if (typeof window !== "undefined") window.location.hash = k;
  };
  return [tab, go];
}

/* group items -> sectors for BusinessSectors */
function groupItemsToSectors(items) {
  const map = new Map();
  for (const it of safeArray(items)) {
    const sec = lower(it.sector || "other");
    const subName = it.subsectorName || "General";
    if (!map.has(sec)) map.set(sec, new Map());
    const sub = map.get(sec);
    if (!sub.has(subName)) sub.set(subName, []);
    sub.get(subName).push({
      id: it._id || it.id,
      kind: it.kind,
      title: it.title,
      summary: it.summary,
      tags: it.tags || [],
      pricingNote: it.pricingNote,
      images: it.images || [],
      thumbnailUpload: it.thumbnailUpload,
    });
  }
  const sectors = [];
  for (const [secKey, subMap] of map.entries()) {
    const subsectors = [];
    for (const [subName, arr] of subMap.entries()) {
      subsectors.push({ id: `${secKey}-${subName}`, title: subName, items: arr });
    }
    sectors.push({
      id: `sec-${secKey}`,
      title: secKey.replace(/\b\w/g, (m) => m.toUpperCase()),
      icon: "•",
      subsectors,
    });
  }
  return sectors;
}

export default function BusinessProfilePage({ profile, onMessage, onRequestMeet }) {
  const navigate = useNavigate();
  const params = useParams();
  const { search } = useLocation();
  const qs = new URLSearchParams(search);

  const slugParam = params?.slug || qs.get("slug") || "";
  const idParam = params?.id || qs.get("id") || "";

  /** KEY FIX:
   * If there is an explicit slug/id in URL, we DO NOT fall back to the owner's profile.
   * We show "not found / invalid" state when the backend doesn't return a profile.
   */
  const hasExplicitTarget = !!(slugParam || idParam);

  // 1) Owner summary (only when NO explicit target is requested)
  const { data: mySummary, isFetching: myFetching } = useGetMyBPQuery(undefined, {
    skip: hasExplicitTarget,
  });

  // 2) Public lookups (only when explicit)
  const {
    data: bySlugData,
    isFetching: slugFetching,
    isError: slugErr,
  } = useGetProfileBySlugQuery(slugParam, { skip: !slugParam });

  const {
    data: byIdData,
    isFetching: idFetching,
    isError: idErr,
  } = useGetProfileByIdQuery(idParam, { skip: !idParam });

  // Normalize responses
  const ownerProf = mySummary?.data || mySummary?.profile || null;
  const slugProf = bySlugData?.data || bySlugData?.profile || (isObj(bySlugData) ? bySlugData : null);
  const idProf   = byIdData?.data || byIdData?.profile || (isObj(byIdData) ? byIdData : null);

  // Decide which profile to present (NO owner fallback if explicit target exists)
  const apiProfileRaw = hasExplicitTarget
    ? (slugProf || idProf || null)
    : (ownerProf || null);

  const profileId = apiProfileRaw?._id || apiProfileRaw?.id || null;

  // 3) Items / Overview / Team are loaded only if we actually have a profile id
  const {
    data: itemsResp,
    isFetching: itemsFetching,
    isError: itemsErr,
  } = useListProfileItemsQuery(profileId, { skip: !profileId });

  const flatItems = itemsResp?.data || (Array.isArray(itemsResp) ? itemsResp : []) || [];

  const { data: overviewDataRaw } = useGetProfileOverviewQuery(profileId, { skip: !profileId });
  const overviewData = overviewDataRaw || {};

  const { data: teamResp = [], isFetching: teamFetching } = useGetPublicTeamQuery(profileId, {
    skip: !profileId,
  });

  // 4) Aggregate loading & error
  const loading =
    (hasExplicitTarget ? (slugFetching || idFetching) : myFetching) || itemsFetching;

  const notFound =
    hasExplicitTarget &&
    !loading &&
    !apiProfileRaw && // nothing came back
    !teamFetching &&
    // either error flags or simply no data:
    (slugErr || idErr || (!slugProf && !idProf));

  // 5) Presentable profile fields
  const baseRaw = isObj(profile) ? profile : {};
  const p = apiProfileRaw
    ? {
        id: profileId || baseRaw.id,
        name: apiProfileRaw?.name || apiProfileRaw?.displayName || baseRaw.name || "",
        tagline: apiProfileRaw?.tagline || baseRaw.tagline || "",
        website: apiProfileRaw?.website || apiProfileRaw?.contacts?.website || baseRaw.website || "",
        location:
          apiProfileRaw?.location ||
          [apiProfileRaw?.city, apiProfileRaw?.country].filter(Boolean).join(", ") ||
          baseRaw.location ||
          "",
        verified: !!(apiProfileRaw?.published || apiProfileRaw?.verified || baseRaw.verified),

        // media
        logo: imageLink(apiProfileRaw?.logoUpload) || baseRaw.logo || "",
        banner: imageLink(apiProfileRaw?.bannerUpload) || baseRaw.banner || "",

        industries: safeArray(apiProfileRaw?.industries),

        offering: safeArray(apiProfileRaw?.offering),
        seeking: safeArray(apiProfileRaw?.seeking),
        innovation: safeArray(apiProfileRaw?.innovation),
        contacts: { ...safeObj(baseRaw.contacts), ...safeObj(apiProfileRaw?.contacts) },

        rating: apiProfileRaw?.rating ?? baseRaw.rating,
      }
    : null;

  // derive product/service lists from items
  const products = flatItems
    .filter((x) => x.kind === "product")
    .map((x) => ({
      id: x._id || x.id,
      name: x.title,
      summary: x.summary,
      thumbnailUpload: x.thumbnailUpload,
      images: x.images,
      type: "product",
    }));

  const services = flatItems
    .filter((x) => x.kind === "service")
    .map((x) => ({
      id: x._id || x.id,
      name: x.title,
      summary: x.summary,
      thumbnailUpload: x.thumbnailUpload,
      images: x.images,
      type: "service",
    }));

  const sectors = flatItems.length ? groupItemsToSectors(flatItems) : [];

  const gallery =
    Array.isArray(apiProfileRaw?.gallery) ? apiProfileRaw.gallery
    : Array.isArray(ownerProf?.gallery) ? ownerProf.gallery
    : [];

  /* tabs */
  const [tab, setTab] = useHashTab("overview");

  const fallbackLogo = (name = "BP") =>
    `https://api.dicebear.com/7.x/initials/svg?fontFamily=Montserrat&seed=${encodeURIComponent(
      String(name || "BP").slice(0, 24)
    )}`;

  const heroBg = (bannerUrl) =>
    bannerUrl
      ? { backgroundImage: `linear-gradient(180deg, rgba(14,26,56,.60), rgba(14,26,56,.86)), url(${bannerUrl})` }
      : { backgroundImage: "linear-gradient(135deg, #13284c 0%, #244c9a 55%, #13284c 100%)" };

  const peerId =
    apiProfileRaw?.owner?.actor ||
    apiProfileRaw?.ownerId ||
    p?.id;

  const onMsg = () => {
    if (peerId) navigate(`/messages?member=${peerId}`);
    else alert("Owner not found yet.");
  };
  const onMeet = () => {
    setTab("team");
    const el = document.querySelector(".bp-body");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const teamMembers = React.useMemo(() => {
    return (teamResp || []).map((m) => {
      const fullName =
        m.name ||
        [m.firstName, m.lastName].filter(Boolean).join(" ") ||
        "—";
      const avatar =
        imageLink(m.avatarUpload) ||
        `https://api.dicebear.com/7.x/initials/svg?fontFamily=Montserrat&seed=${encodeURIComponent(fullName.slice(0, 24))}`;
      return {
        id: `${m.entityType}-${m.entityId}`,
        fullName,
        title: m.title || m.role || "",
        dept: m.dept || "",
        city: m.city || "",
        country: m.country || "",
        avatar,
        open: !!m.open,
        skills: Array.isArray(m.skills) ? m.skills : [],
        entityType: m.entityType,
        entityId: m.entityId,
      };
    });
  }, [teamResp]);

  return (
    <>
      <HeaderShell top={topbar} nav={nav} cta={cta} />

      <main className="bp">
        {/* ======= NOT FOUND (explicit target only) ======= */}
        {notFound && (
          <div className="container" style={{ padding: "48px 0" }}>
            <div className="reg-empty" style={{ borderStyle: "solid" }}>
              ❌ No or invalid Business Profile for this user.
              <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                <button className="btn" onClick={() => navigate("/exhibitors")}>Browse Exhibitors</button>
                <button className="btn btn-line" onClick={() => navigate("/")}>Back to Home</button>
              </div>
            </div>
          </div>
        )}

        {/* ======= LOADING SKELETON ======= */}
        {loading && !notFound && (
          <div className="container" style={{ padding: "48px 0" }}>
            <div className="reg-skel" />
          </div>
        )}

        {/* ======= MAIN VIEW (only when we have a profile) ======= */}
        {!loading && !notFound && p && (
          <>
            {/* HERO */}
            <header className="bp-hero">
              <div className="bp-banner" style={heroBg(p.banner)} aria-hidden="true" />
              <div className="container bp-hero-inner">
                <div className="bp-brand">
                  <div className="bp-logo-wrap mt-2" title={`${p.name} logo`}>
                    <img
                      className="bp-logo-img"
                      src={p.logo || fallbackLogo(p.name)}
                      alt={`${p.name} logo`}
                      onError={(e) => (e.currentTarget.src = fallbackLogo(p.name))}
                    />
                  </div>

                  <div className="bp-id">
                    <h1 className="bpp-name align-items-start">
                      {p.name}
                    </h1>
                    {p.tagline ? <p className="bp-tag">{p.tagline}</p> : null}
                    {apiProfileRaw?.about ? <p className="bp-about">{apiProfileRaw.about}</p> : null}
                    <div className="bp-meta">
                      {p.location ? (
                        <span className="chip">
                          <I.pin />
                          {p.location}
                        </span>
                      ) : null}
                      {p.website ? (
                        <a className="chip link" href={p.website} target="_blank" rel="noreferrer">
                          <I.link />
                          Website
                        </a>
                      ) : null}
                      {p.verified ? (
                        <span className="chip ok">
                          <I.shield />
                          Verified
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="bp-cta">
                  <button type="button" className="btn" onClick={onMsg}>
                    Message company
                  </button>
                  <button type="button" className="btn btn-outline" onClick={onMeet}>
                    Request meeting
                  </button>
                </div>
              </div>

              {/* TABS (sticky) */}
              <nav className="bp-tabs" aria-label="Profile sections">
                <div className="container bp-tabs-row">
                  {TABS.map((t) => (
                    <button
                      key={t.key}
                      className={`bp-tab ${window.location.hash.replace("#", "") === t.key ? "is-active" : ""}`}
                      onClick={() => (window.location.hash = t.key)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          window.location.hash = t.key;
                        }
                      }}
                      aria-current={window.location.hash.replace("#", "") === t.key ? "page" : undefined}
                    >
                      {t.label}
                    </button>
                  ))}
                  {teamFetching && <span className="bp-dot"> Loading team…</span>}
                </div>
              </nav>
            </header>

            {/* CONTENT */}
            <section className="container bp-body">
              {/* manage tabs via hook */}
              <TabContent
                p={p}
                apiProfileRaw={apiProfileRaw}
                overviewData={overviewData}
                products={products}
                services={services}
                sectors={sectors}
                gallery={gallery}
                teamMembers={teamMembers}
                navigate={navigate}
              />
            </section>
          </>
        )}
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

/* separate component so we can use the same tab state logic cleanly */
function TabContent({
  p,
  apiProfileRaw,
  overviewData,
  products,
  services,
  sectors,
  gallery,
  teamMembers,
  navigate,
}) {
  const [tab, setTab] = useHashTab("overview");

  React.useEffect(() => {
    // keep .is-active in sync for buttons above
    // handled by hash; nothing else needed
  }, [tab]);

  return (
    <>
      {tab === "overview" && (
        <BusinessOverview
          stats={overviewData || {}}
          products={products}
          services={services}
          clients={[]}
          industries={p.industries}
          rating={overviewData?.rating?.avg ?? p.rating}
          offerings={p.offering}
          lookingFor={p.seeking}
          capabilities={p.innovation}
          innovation={overviewData?.innovation || {}}
          locations={overviewData?.locations || []}
          certifications={overviewData?.certifications || []}
          gallery={gallery}
        />
      )}

      {tab === "sectors" && <BusinessSectors sectors={sectors} />}

      {tab === "team" && (
        <BusinessTeam
          members={teamMembers}
          onMessage={(m) => navigate(`/messages?member=${m.entityId}`)}
          onMeet={(m) => navigate(`/team?prefill=${m.entityId}`)}
          onProfile={(m) => navigate(`/member/${m.entityType}/${m.entityId}`)}
        />
      )}

      {tab === "contact" && (
        <BusinessContact
          companyName={p.name}
          contacts={apiProfileRaw?.contacts}
          locations={overviewData?.locations || []}
          collateral={[]}
          topics={["Sales Inquiry","Partnership","Support","Press","Other"]}
          onMessage={() => {
            const peerId =
              apiProfileRaw?.owner?.actor ||
              apiProfileRaw?.ownerId ||
              p.id;
            if (peerId) window.location.href = `/messages?member=${peerId}`;
          }}
          onMeet={() => {
            window.location.href = "/team";
          }}
        />
      )}

      {tab === "engagements" && <BusinessEngagements items={[]} />}
    </>
  );
}

BusinessProfilePage.propTypes = {
  profile: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    tagline: PropTypes.string,
    location: PropTypes.string,
    verified: PropTypes.bool,
    website: PropTypes.string,
    logo: PropTypes.string,
    banner: PropTypes.string,
    industries: PropTypes.arrayOf(PropTypes.string),
    rating: PropTypes.number,
    products: PropTypes.array,
    services: PropTypes.array,
    contacts: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  }),
  onMessage: PropTypes.func,
  onRequestMeet: PropTypes.func,
};
