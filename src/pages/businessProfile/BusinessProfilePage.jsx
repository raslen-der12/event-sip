// src/pages/bp/BusinessProfilePage.jsx
import React, { useMemo } from "react";
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
import { useTranslation } from "react-i18next";
import {
  useGetMyBPQuery,
  useGetProfileByIdQuery,
  useListProfileItemsQuery,
  useGetProfileOverviewQuery,
  useGetPublicTeamQuery,
  useGetPublicContactQuery,
  useGetPublicEngagementsQuery,
} from "../../features/bp/BPApiSlice";

/* ===== tiny inline icons ===== */
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

/* ===== hash-tab helper ===== */
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

/* ===== group flat items to sectors/subsectors (now carries price fields) ===== */
function groupItemsToSectors(items) {
  const map = new Map();
  for (const it of (Array.isArray(items) ? items : [])) {
    const sec = String(it.sector || "other").toLowerCase();
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
      images: it.images || [],
      thumbnailUpload: it.thumbnailUpload,
      pricingNote: it.pricingNote || "",
      priceValue: (typeof it.priceValue !== "undefined" ? it.priceValue : (it.price && it.price.value)),
      priceCurrency: (it.priceCurrency || (it.price && it.price.currency) || ""),
      priceUnit: (it.priceUnit || (it.price && it.price.unit) || "")
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

const toStr = (v) => (v == null ? "" : String(v));

/** Replace old calcOverviewCompleteness with this */
function computeLowData(p, apiProfileRaw, overviewData = {}, products = [], services = [], gallery = [], teamResp = []) {
  if (!p) return { coreSignals: 0, auxSignals: 0, totalSignals: 0, tooLow: true };

  const coreSignals = [
    (p.offering || []).length,
    (p.seeking || []).length,
    (p.industries || []).length,
    products.length,
    services.length,
  ].filter((n) => Number(n) > 0).length;

  const contacts = safeObj(apiProfileRaw?.contacts);
  const hasSocial = ["linkedin","facebook","twitter","x","instagram","youtube","tiktok"]
    .some((k) => toStr(contacts[k]).trim().length > 0);

  const aboutLen = toStr(apiProfileRaw?.about).trim().length;

  const auxSignals =
    (gallery.length > 0 ? 1 : 0) +
    ((overviewData.locations || []).length > 0 ? 1 : 0) +
    ((overviewData.certifications || []).length > 0 ? 1 : 0) +
    (
      Array.isArray(overviewData?.innovation?.highlights)
        ? (overviewData.innovation.highlights.length > 0 ? 1 : 0)
        : (Object.keys(overviewData?.innovation || {}).length > 0 ? 1 : 0)
    ) +
    (p.website ? 1 : 0) +
    (hasSocial ? 1 : 0) +
    ((teamResp || []).length > 0 ? 1 : 0) +
    (aboutLen >= 40 ? 1 : 0);

  const totalSignals = coreSignals + auxSignals;
  const tooLow = (coreSignals < 2) || (totalSignals < 4);

  return { coreSignals, auxSignals, totalSignals, tooLow };
}

function LowDataNotice({ isOwnerView, onEdit }) {
  return (
    <div className="reg-empty my-5" style={{ borderStyle: "solid", textAlign: "center", padding: 24 }}>
      <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
        {isOwnerView ? "Your business profile has very little information" : "This business profile has very little information"}
      </div>
      <div style={{ color: "#60708a", marginBottom: isOwnerView ? 14 : 0 }}>
        {isOwnerView
          ? "We can’t show the Overview because it isn’t informative yet. Add more details to make your profile useful to others."
          : "We can’t show the Overview because the owner hasn’t added enough information yet."}
      </div>
      {isOwnerView && (
        <button type="button" className="btn" onClick={onEdit} style={{ marginTop: 4 }}>
          Edit your business profile
        </button>
      )}
    </div>
  );
}

/* ===== MAIN PAGE ===== */
export default function BusinessProfilePage({ profile: propProfile, onMessage, onRequestMeet }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const params = useParams();
  const { search } = useLocation();
  const qs = new URLSearchParams(search);

  const idParam = params?.BPI || qs.get("id") || "";

  // Fetch my profile if no id
  const {
    data: mySummary,
    isFetching: myFetching,
    isSuccess: myOk,
  } = useGetMyBPQuery(undefined, { skip: !!idParam });

  // Fetch public profile by id
  const {
    data: byIdData,
    isFetching: idFetching,
    isError: idErr,
  } = useGetProfileByIdQuery(idParam, { skip: !idParam });

  // Normalize responses
  const ownerProf = mySummary?.data || mySummary?.profile || null;
  const idProf = byIdData?.data || byIdData?.profile || (isObj(byIdData) ? byIdData : null);
  const apiProfileRaw = idParam ? (idProf || null) : (ownerProf || null);
  const profileId = apiProfileRaw?._id || apiProfileRaw?.id || null;

  // Redirect if no profile
  const BP_FORM_PATH = "/businessprofile/form";
  React.useEffect(() => {
    if (!idParam && !myFetching && !ownerProf) {
      navigate(BP_FORM_PATH, { replace: true });
    }
  }, [idParam, myFetching, ownerProf, navigate]);

  // Fetch related data
  const { data: itemsResp, isFetching: itemsFetching } = useListProfileItemsQuery(profileId, { skip: !profileId });
  const { data: overviewDataRaw } = useGetProfileOverviewQuery(profileId, { skip: !profileId });
  const { data: teamResp = [], isFetching: teamFetching } = useGetPublicTeamQuery(profileId, { skip: !profileId });
  const { data: contactData = {}, isFetching: contactLoading } = useGetPublicContactQuery(profileId, { skip: !profileId });
  const { data: engageData = [], isFetching: engageLoading } = useGetPublicEngagementsQuery(profileId, { skip: !profileId });

  const flatItems = itemsResp?.data || (Array.isArray(itemsResp) ? itemsResp : []) || [];
  const overviewData = overviewDataRaw || {};

  // === CORRECT: useMemo INSIDE component ===
  const profile = useMemo(() => {
    return apiProfileRaw?.profile || apiProfileRaw?.data || apiProfileRaw || null;
  }, [apiProfileRaw]);

  const bpContacts = useMemo(() => {
    return Array.isArray(profile?.contacts) ? profile.contacts : [];
  }, [profile]);

  // Loading & not-found
  const loading = (!!idParam ? idFetching : myFetching) || itemsFetching;
  const notFoundExplicit = !!idParam && !loading && !apiProfileRaw && !teamFetching && (idErr || !idProf);

  // Presentable fields
  const p = apiProfileRaw
    ? {
        id: profileId,
        name: apiProfileRaw?.name || apiProfileRaw?.displayName || "",
        tagline: apiProfileRaw?.tagline || "",
        website: apiProfileRaw?.website || apiProfileRaw?.contacts?.website || "",
        location: apiProfileRaw?.location || [apiProfileRaw?.city, apiProfileRaw?.country].filter(Boolean).join(", ") || "",
        verified: !!(apiProfileRaw?.published || apiProfileRaw?.verified),
        logo: imageLink(apiProfileRaw?.logoUpload) || "",
        banner: imageLink(apiProfileRaw?.bannerUpload) || "",
        industries: safeArray(apiProfileRaw?.industries),
        offering: safeArray(apiProfileRaw?.offering),
        seeking: safeArray(apiProfileRaw?.seeking),
        innovation: safeArray(apiProfileRaw?.innovation),
        contacts: { ...safeObj(apiProfileRaw?.contacts) },
        rating: apiProfileRaw?.rating,
      }
    : null;

  const products = flatItems.filter(x => x.kind === "product").map(x => ({
    id: x._id || x.id,
    name: x.title,
    summary: x.summary,
    thumbnailUpload: x.thumbnailUpload,
    images: x.images,
    type: "product",
  }));

  const services = flatItems.filter(x => x.kind === "service").map(x => ({
    id: x._id || x.id,
    name: x.title,
    summary: x.summary,
    thumbnailUpload: x.thumbnailUpload,
    images: x.images,
    type: "service",
  }));

  const sectors = flatItems.length ? groupItemsToSectors(flatItems) : [];
  const gallery = Array.isArray(apiProfileRaw?.gallery) ? apiProfileRaw.gallery : [];

  const [tab] = useHashTab("overview");

  const fallbackLogo = (name = "BP") =>
    `https://api.dicebear.com/7.x/initials/svg?fontFamily=Montserrat&seed=${encodeURIComponent(String(name || "BP").slice(0, 24))}`;

  const heroBg = (bannerUrl) =>
    bannerUrl
      ? { backgroundImage: `linear-gradient(180deg, rgba(14,26,56,.60), rgba(14,26,56,.86)), url(${bannerUrl})` }
      : { backgroundImage: "linear-gradient(135deg, #13284c 0%, #244c9a 55%, #13284c 100%)" };

  const peerId = apiProfileRaw?.owner?.actor || apiProfileRaw?.ownerId || p?.id;

  const onMsg = () => {
    if (peerId) navigate(`/messages?member=${peerId}`);
    else alert("Owner not found yet.");
  };

  const onMeet = () => {
    const el = document.querySelector(".bp-body");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    if (peerId) navigate(`/team?prefill=${peerId}`);
  };
  const onMeetMain = () => {
    if (peerId) navigate(`/meeting/${peerId}`);
  };

  return (
    <>
      <HeaderShell top={topbar} nav={nav} cta={cta} />
      <main className="bp">
        {notFoundExplicit && (
          <div className="container" style={{ padding: "56px 0" }}>
            <div className="reg-empty" style={{ borderStyle: "solid", textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
                {t("Profile Not Found")}
              </div>
              <div style={{ color: "#60708a" }}>The requested profile could not be found.</div>
            </div>
          </div>
        )}

        {loading && !notFoundExplicit && (
          <div className="container" style={{ padding: "48px 0" }}>
            <div className="reg-skel" />
          </div>
        )}

        {!loading && !notFoundExplicit && p && (
          <>
            <header className="bp-hero mb-5">
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
                    <h1 className="bpp-name align-items-start">{p.name}</h1>
                    {p.tagline && <p className="bp-tag">{p.tagline}</p>}
                    {apiProfileRaw?.about && (
                      <AboutBlock text={String(apiProfileRaw.about || '')} />
                    )}
                    <div className="bp-meta">
                      {p.location && (
                        <span className="chip">
                          <I.pin />{p.location}
                        </span>
                      )}
                      {p.website && (
                        <a className="chip link" href={p.website} target="_blank" rel="noreferrer">
                          <I.link />{t("Website")}
                        </a>
                      )}
                      {p.verified && (
                        <span className="chip ok">
                          <I.shield />Verified
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bp-cta">
                  <button type="button" className="btn" onClick={onMsg}>
                    Message company
                  </button>
                  <button type="button" className="btn bg-dark" onClick={onMeetMain}>
                    Book meet
                  </button>

                </div>
              </div>

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

            <section className="container bp-body">
              <TabContent
                p={p}
                apiProfileRaw={apiProfileRaw}
                overviewData={overviewData}
                products={products}
                services={services}
                sectors={sectors}
                gallery={gallery}
                teamResp={teamResp}
                contactData={contactData}
                engageData={engageData}
                navigate={navigate}
                isOwnerView={!idParam}
                profile={profile}
                bpContacts={bpContacts}
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

/* ===== content by tab ===== */
function TabContent({
  p,
  apiProfileRaw,
  overviewData,
  products,
  services,
  sectors,
  gallery,
  teamResp,
  contactData,
  engageData,
  navigate,
  isOwnerView,
  profile,
  bpContacts,
}) {
  const [tab] = useHashTab("overview");

  const teamMembers = useMemo(() => {
    return (teamResp || []).map((m) => {
      const fullName = m.fullName || [m.firstName, m.lastName].filter(Boolean).join(" ") || "—";
      const avatar = imageLink(m.avatar) ||
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

  const dataScore = useMemo(
    () => computeLowData(p, apiProfileRaw, overviewData, products, services, gallery, teamResp),
    [p, apiProfileRaw, overviewData, products, services, gallery, teamResp]
  );
  const tooLow = dataScore.tooLow;

  return (
    <>
      {tab === "overview" && (
        tooLow ? (
          <LowDataNotice
            isOwnerView={isOwnerView}
            onEdit={() => navigate("/BusinessProfile/dashboard")}
          />
        ) : (
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
        )
      )}

      {tab === "sectors" && <BusinessSectors sectors={sectors} profileHasAnySector={Array.isArray(p?.industries) && p.industries.length > 0} />}

      {tab === "team" && (
        <BusinessTeam
          members={teamMembers}
          onMessage={(m) => navigate(`/messages?member=${m.entityId}`)}
          onMeet={(m) => navigate(`/team?prefill=${m.entityId}`)}
          onProfile={(m) => navigate(`/profile/${m.entityId}`)}
        />
      )}

      {tab === "contact" && (
        <BusinessContact
          companyName={profile?.name || ""}
          bpContacts={bpContacts}
          social={profile?.socials || []}
          locations={profile?.locations || []}
          collateral={profile?.collateral || []}
          topics={profile?.topics || []}
          onMessage={({ label, value }) => {
            const peerId = apiProfileRaw?.owner?.actor || apiProfileRaw?.ownerId || apiProfileRaw?.id;
            if (peerId) {
              window.location.href = `/messages?member=${peerId}&contact=${encodeURIComponent(value)}`;
            }
          }}
          onMeet={() => {
            window.location.href = "/team";
          }}
        />
      )}

      {tab === "engagements" && <BusinessEngagements items={engageData || []} />}
    </>
  );
}
function AboutBlock({ text }) {
  const [open, setOpen] = React.useState(false);
  const long = (text || '').length > 260; // show toggle only if long
  const clampStyle = open ? {} : {
    display: '-webkit-box',
    WebkitLineClamp: 5,           // lines when collapsed
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden'
  };
  return (
    <div className="bp-about-wrap" style={{ position:'relative', maxWidth:780 }}>
      <p
        id="bp-about"
        className="bp-about"
        style={{
          marginTop:8,
         whiteSpace:'pre-line',
          wordBreak:'break-word',
          color:'#e6eefc',
          ...clampStyle
        }}
      >
        {text}
      </p>
      
      {long && (
        <button
          type="button"
          className="bp-about-toggle"
          aria-controls="bp-about"
          aria-expanded={open ? 'true' : 'false'}
          onClick={() => setOpen(v => !v)}
          style={{
            marginTop:6, fontSize:13, fontWeight:600,
            textDecoration:'underline', background:'none',
            border:0, color:'#fff', cursor:'pointer'
          }}
        >
          {open ? 'Show less' : 'Read more'}
        </button>
      )}
    </div>
  );
}
AboutBlock.displayName = 'AboutBlock';
AboutBlock.defaultProps = { text: '' };

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