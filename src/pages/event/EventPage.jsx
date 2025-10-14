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

const attendees = [
  {
    id: 1,
    name: "Amira Trabelsi",
    type: "Attendee",
    category: "Students",
    image: "https://randomuser.me/api/portraits/women/65.jpg",
  },
  {
    id: 2,
    name: "Youssef Mejri",
    type: "Attendee",
    category: "Professionals",
    image: "https://randomuser.me/api/portraits/men/22.jpg",
  },
  {
    id: 3,
    name: "Sana Kacem",
    type: "Attendee",
    category: "Entrepreneurs",
    image: "https://randomuser.me/api/portraits/women/44.jpg",
  },
  {
    id: 4,
    name: "Ahmed Bouaziz",
    type: "Attendee",
    category: "Developers",
    image: "https://randomuser.me/api/portraits/men/55.jpg",
  },
  {
    id: 5,
    name: "Leila Gharbi",
    type: "Attendee",
    category: "Researchers",
    image: "https://randomuser.me/api/portraits/women/32.jpg",
  },
];

const speakers = [
  {
    id: 1,
    name: "Dr. Karim Haddad",
    type: "Expert / Consultant",
    category: "Experts & Consultants",
    image: "https://randomuser.me/api/portraits/men/72.jpg",
  },
  {
    id: 2,
    name: "Henda Jlassi",
    type: "Coach / Trainer",
    category: "Coaches & Trainers",
    image: "https://randomuser.me/api/portraits/women/24.jpg",
  },
  {
    id: 3,
    name: "Moez Ben Youssef",
    type: "Entrepreneur",
    category: "Entrepreneurs & Startups",
    image: "https://randomuser.me/api/portraits/men/68.jpg",
  },
  {
    id: 4,
    name: "Nour Arfaoui",
    type: "Researcher",
    category: "Researchers",
    image: "https://randomuser.me/api/portraits/women/47.jpg",
  },
  {
    id: 5,
    name: "Tarek Sassi",
    type: "Engineer",
    category: "Developers & Engineers",
    image: "https://randomuser.me/api/portraits/men/39.jpg",
  },
];

const exhibitors = [
  {
    id: 1,
    name: "BioTech Solutions",
    type: "Business Owner",
    category: "Entrepreneurs & Startups",
    image: "https://randomuser.me/api/portraits/men/11.jpg",
  },
  {
    id: 2,
    name: "GreenWave Cosmetics",
    type: "Business Owner",
    category: "Marketing & Communication",
    image: "https://randomuser.me/api/portraits/women/56.jpg",
  },
  {
    id: 3,
    name: "Tunis AI Labs",
    type: "Company",
    category: "AI, IoT & Emerging Tech",
    image: "https://randomuser.me/api/portraits/men/61.jpg",
  },
  {
    id: 4,
    name: "LegalBridge Consulting",
    type: "Consultancy",
    category: "Legal & Lawyers",
    image: "https://randomuser.me/api/portraits/women/41.jpg",
  },
  {
    id: 5,
    name: "Creative Hub Studio",
    type: "Agency",
    category: "Audiovisual & Creative Industries",
    image: "https://randomuser.me/api/portraits/men/36.jpg",
  },
];



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
  { label: "Schedule", href: `/event/${eventId}/schedule` },
  { label: "Tickets", href: `/event/${eventId}/tickets` },
];
  const base = process.env.APP_API_URL
  return (
    <>
          <HeaderShell top={topbar} nav={nav} cta={cta} />
      <HeroEvent
        event={event?.event}
        heroImage={`${base}/uploads/images/admin/ipdays.jpg`}
      />
    <AboutIntro
      heading="À propos des IPDAYS X GITS 2025"
      contentHtml="<p>Cette édition, placée sous le thème “L’INTERNATIONAL”, a pour objectif d’ouvrir les portes aux Startups et aux PME innovantes, ainsi qu’à l’écosystème tunisien, vers le monde, en mettant en lumière les opportunités de collaboration, d’export, d’internationalisation et de partenariats internationaux.</p>"
      chips={[
        "Je m’inscris maintenant",
        "Voir le programme",
        "Ajouter au calendrier",
        "Places limitées",
      ]}
      ctaLabel="Je m’inscris"
      ctaHref="/register"
      imageSrc={`${base}/uploads/images/admin/logo-ipdays.png`}
    />


      <ImpactHighlights
        heading="Impact & Outcomes"
        subheading="Ce que l’événement a accompli pour les participants, exposants et partenaires :"
        impacts={data?.impacts}        // from useGetFullEventQuery(eventId)
        isLoading={isLoading}
      />

      {/* <PlatformPillarsSplit POINTS={[
    {
      id: "b2b",
      icon: <I.network />,
      title: "Pre-scheduled B2B meetings (onsite & virtual)",
      desc: "",
      img: {`${base}/uploads/images/admin/cover-ipdays.png",
    },
    {
      id: "profiles",
      icon: <I.idcard />,
      title: "Instant chat between SMEs, investors, and buyers",
      desc: "",
      img: {`${base}/uploads/images/admin/ipdays-02.png",
    },
    {
      id: "services",
      icon: <I.briefcase />,
      title: "AI-powered intelligent matchmaking",
      desc: "",
      img: {`${base}/uploads/images/admin/KH_03168.png",
    },
    {
      id: "services",
      icon: <I.network />,
      title: "Multilingual support (FR / EN / AR)",
      desc: "",
      img: {`${base}/uploads/images/admin/KH_02938.png",
    },
  ]} /> */}
      
      {/* // With API: */}
      {/* const { data: evt } = useGetFullEventQuery(eventId); */}
      {/* <GalleryMasonry heading="Moments from the event" subheading="Highlights captured by our team and community." items={evt?.gallery} /> */}

      {/* // Or render without props to preview fallback demo: */}
      <ProgramMatrix sessions={data?.schedule} isLoading={isLoading} />
      <GalleryMasonry />

            {/* <main className="col-span-12 lg:col-span-8 mx-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <CommunityRow
            title="speakers"
            seeAllHref="/community/students"
            members={data?.speakers ?? data?.attendees ?? speakers}
            wrapperClassName="max-w-7xl mx-auto"
          />
        </div>
      </main>


      <main className="col-span-12 lg:col-span-8 mx-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <CommunityRow
            title="Attendees"
            seeAllHref="/community/students"
            members={data?.attendees ?? data?.attendees ?? attendees}
            wrapperClassName="max-w-7xl mx-auto"
          />
        </div>
      </main>

      <main className="col-span-12 lg:col-span-8 mx-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <CommunityRow
            title="Exhibitors"
            seeAllHref="/community/students"
            members={data?.exhibitors ?? data?.attendees ?? exhibitors}
            wrapperClassName="max-w-7xl mx-auto"
          />
        </div>
      </main> */}



      const base = process.env.APP_API_URL
      <FeaturesShowcase features={data?.features} />
        <PartnershipBlock
          imageSrc={imageLink(`${base}/uploads/images/admin/gits-ipdays.png`)}
        />
<EventOrganizers
  heading="Event Partners"
  subheading="Event Partners Merci à tous nos soutiens :"
  items={data?.organizers || []}
  loading={isLoading}
  error={isError ? "error" : ""}
/>
      <ActionRibbon />
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
