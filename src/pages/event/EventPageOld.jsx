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

export default function EventPage() {
  const { eventId } = useParams() || "689bbeefeda54da6d75535df";
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
        heroImage={`${base}/uploads/images/admin/DSC_2257.png`}
      />
      <FeaturesShowcase />

      
      {/* // With API: */}
      {/* const { data: evt } = useGetFullEventQuery(eventId); */}
      {/* <GalleryMasonry heading="Moments from the event" subheading="Highlights captured by our team and community." items={evt?.gallery} /> */}

      {/* // Or render without props to preview fallback demo: */}
      <GalleryMasonry />
      <ProgramMatrix sessions={data?.schedule} isLoading={isLoading} />

      <EventVoices
  title="Voices from the floor"
  subtitle="Highlights from verified participants"
  comments={data?.comments}
/>
<ImpactHighlights
  heading="Impact & Outcomes"
  subheading="What this event achieved for attendees, exhibitors, and partners."
  impacts={data?.impacts}        // from useGetFullEventQuery(eventId)
  isLoading={isLoading}
/>
<EventOrganizers
  heading="Event Partners"
  subheading="Thank you to our supporters."
  items={data?.organizers || []}
  loading={isLoading}
  error={isError ? "error" : ""}
/>
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
