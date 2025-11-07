// Example in your EventPage.jsx (after you load the event with useGetFullEventQuery)
import HeroEvent from "../../components/event/EventHeroProTW";
import { useParams } from "react-router-dom";
import { useGetFullEventQuery } from "../../features/events/eventsApiSlice";
import ProgramMatrix from "../../components/event/ProgramMatrix";
import HeaderShell from "../../components/layout/HeaderShell";
import { topbar, cta } from "../main.mock"
import Footer from "../../components/footer/Footer";
import { footerData } from "../main.mock";
import FeaturesShowcase from "../../components/event/FeaturesShowcase";
import GalleryMasonry from "../../components/event/GalleryMasonry";
import EventVoices from "../../components/event/event-comments/EventVoices";
import EventOrganizers from "../../components/event/organizers/EventOrganizers";
import ImpactHighlights from "../../components/event/impact/ImpactHighlights";
import AboutIntro from "../../components/event/FeaturesShowcase/AboutIntro";
import PartnershipBlock from "../../components/event/FeaturesShowcase/PartnershipBlock";
import imageLink from "../../utils/imageLink";
import PlatformPillarsSplit from "../../components/showcase/PlatformPillars";
import CommunityRow from "../../components/Cards/CommunityRow";
import ActionRibbon from "../../components/event/FeaturesShowcase/ActionRibbon";
import { useTranslation } from 'react-i18next';
import React from "react";


const I = {
  network: () => (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <circle cx="5" cy="12" r="3" fill="currentColor" />
      <circle cx="19" cy="7" r="3" fill="currentColor" />
      <circle cx="19" cy="17" r="3" fill="currentColor" />
      <path
        d="M8 12h7M8 11l8-3M8 13l8 3"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        opacity=".7"
      />
    </svg>
  ),
  idcard: () => (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <rect
        x="3"
        y="5"
        width="18"
        height="14"
        rx="3"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
      <circle cx="9" cy="12" r="2.2" fill="currentColor" />
      <path
        d="M6.5 16.5c.8-1.5 2.2-2.3 4-2.3s3.2.8 4 2.3"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
      <path
        d="M13.5 9.5h4M13.5 12.5h4M13.5 15.5h3"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  ),
  briefcase: () => (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        d="M8 7V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
      <rect
        x="3"
        y="7"
        width="18"
        height="12"
        rx="2"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
      <path d="M3 12h18" stroke="currentColor" strokeWidth="2" />
      <rect x="10.5" y="11" width="3" height="2" fill="currentColor" />
    </svg>
  ),
};
export default function EventPage() {
  const { eventId } = useParams() || "68e6764bb4f9b08db3ccec04";
  const { data, isLoading, isError } = useGetFullEventQuery(eventId);
  const event = data ?? {};
  const nav = [
  { label: "Home", href: "/" },
  { label: "Event", href: `/event/${eventId}` },
  { label: "Speakers", href: `/event/${eventId}/speakers` },
  { label: "Attendees", href: `/event/${eventId}/attendees` },
  { label: "Exhibitors", href: `/event/${eventId}/exhibitors` },
  { label: "Schedule", href: `/event/${eventId}/schedule` }
];
  const base = process.env.REACT_APP_API_URL || 'https://api.eventra.cloud'
    const { t } = useTranslation();  // <-- this is important
  // Map impacts to translated titles & descriptions based on id or fallback
  const impactsTranslated = React.useMemo(() => {
    if (!data?.impacts?.length) return [];

    return data.impacts.map((impact, idx) => {
      // Construct fallback keys f1, f2,... for translation
      const key = impact.id || `f${idx + 1}`;

      return {
        ...impact,
        title: t(`impact.${key}Title`, impact.title || ""),
        description: t(`impact.${key}Desc`, impact.description || ""),
      };
    });
  }, [data?.impacts, t]);

  

  return (
    <>
    <HeaderShell top={topbar} nav={nav} cta={cta} logo={imageLink("/default/IPDAYXGITS.png")} />
      <HeroEvent
        event={event?.event}
        heroImage={`${base}/uploads/images/admin/ipdays.jpg`}
      />
    <AboutIntro
      heading={t("aboutHeading")}
      contentHtml={t("aboutContent")}
      ctaLabel={t("ctaSignUp")}
      ctaHref="/register"
      imageSrc="https://gits.seketak-eg.com/wp-content/uploads/2025/10/IPDAYS-X-GITS.png"
      imageAlt={t("aboutImageAlt")}
    />


    <ImpactHighlights
      heading={t("impactHeading")}
      subheading={t("impactSubheading")}
      impacts={impactsTranslated}
      isLoading={isLoading}
    />
      
      <FeaturesShowcase features={data?.features} />
      <PartnershipBlock imageSrc={imageLink(`${base}/uploads/default/IPDAYXGITS.png`)} />

<EventOrganizers
  heading="Event Partners"
  subheading="Event Partners Merci à tous nos soutiens :"
  items={data?.organizers || []}
  loading={isLoading}
  error={isError ? "error" : ""}
/>
<br></br>
      {/*<ActionRibbon /> */}
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
