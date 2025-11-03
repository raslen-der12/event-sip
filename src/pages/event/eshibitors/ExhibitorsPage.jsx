import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import HeaderShell from "../../../components/layout/HeaderShell";
import Footer from "../../../components/footer/Footer";
import { topbar, cta, footerData } from "../../main.mock";
import useAuth from "../../../lib/hooks/useAuth";
import EventExhibitorsGallery from "../../../components/event/exhibitors/EventExhibitorsGallery";
import { useGetExhibitorsByEventQuery } from "../../../features/events/actorsApiSlice";
import imageLink from "../../../utils/imageLink";

export default function ExhibitorsPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { ActorId } = useAuth();

  // open booking (accepts item or id)
  const onBook = (itOrId) => {
    const id =
      (itOrId && (itOrId._id || itOrId.id)) ||
      (typeof itOrId === "string" ? itOrId : "");
    if (!id) return;
    if (!ActorId) {
      navigate("/login");
      return;
    }
    navigate(`/meeting/${id}`);
  };

  // ----- server-driven controls -----
  const [q, setQ] = React.useState("");
  const [onlyOpen, setOnlyOpen] = React.useState(false);
  const [industry, setIndustry] = React.useState("All");
  const [limit, setLimit] = React.useState(24);

  // debounce q
  const [debouncedQ, setDebouncedQ] = React.useState(q);
  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 350);
    return () => clearTimeout(t);
  }, [q]);

  const { data, isLoading, isError, error } = useGetExhibitorsByEventQuery(
    {
      eventId,
      q: debouncedQ || undefined,
      limit: Number(limit) || undefined,
      industry: industry && industry !== "All" ? industry : undefined,
      open: onlyOpen ? 1 : undefined,
    },
    { skip: !eventId }
  );

  const items =
    (Array.isArray(data) && data) ||
    (Array.isArray(data?.items) && data.items) ||
    (Array.isArray(data?.exhibitors) && data.exhibitors) ||
    [];

  const nav = [
    { label: "Home", href: "/" },
    { label: "Event", href: `/event/${eventId}` },
    { label: "Speakers", href: `/event/${eventId}/speakers` },
    { label: "Attendees", href: `/event/${eventId}/attendees` },
    { label: "Exhibitors", href: `/event/${eventId}/exhibitors` },
    { label: "Schedule", href: `/event/${eventId}/schedule` },
    // { label: "Tickets", href: `/event/${eventId}/tickets` },
  ];

  return (
    <>
      <HeaderShell top={topbar} nav={nav} cta={cta} logo={eventId === "68e6764bb4f9b08db3ccec04" ? imageLink("/default/IPDAYXGITS.png") : null} />
      <EventExhibitorsGallery
        heading="Exhibitors"
        subheading="Teams showcasing products & services."
        serverMode
        items={items}
        isLoading={isLoading}
        errorText={isError ? (error?.data?.message || "Failed to load exhibitors") : ""}

        // controlled (server) toolbar state
        query={q}
        onQueryChange={setQ}
        onlyOpen={onlyOpen}
        onOnlyOpenChange={setOnlyOpen}
        industry={industry}
        onIndustryChange={setIndustry}
        limit={limit}
        onLimitChange={setLimit}

        isLoggedIn={!!ActorId}
        onBook={onBook}
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
