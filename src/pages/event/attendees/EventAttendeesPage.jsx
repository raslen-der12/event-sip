import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import HeaderShell from "../../../components/layout/HeaderShell";
import Footer from "../../../components/footer/Footer";
import { topbar, cta, footerData } from "../../main.mock";
import useAuth from "../../../lib/hooks/useAuth";
import EventAttendeesBrowser from "../../../components/event/attendees/EventAttendeesBrowser";
import { useGetAttendeesByEventQuery } from "../../../features/events/actorsApiSlice";

export default function EventAttendeesPage() {
    console.log("test render");

  const { eventId } = useParams();
  const navigate = useNavigate();
  const { ActorId, status } = useAuth();
  const isLoggedIn = status !== "Guest";

  // booking
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
  const [limit, setLimit] = React.useState(24);

  // debounce search
  const [debouncedQ, setDebouncedQ] = React.useState(q);
  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 350);
    return () => clearTimeout(t);
  }, [q]);

  // fetch attendees with params
  const { data, isLoading, isError, error } = useGetAttendeesByEventQuery(
    {
      eventId,
      q: debouncedQ || undefined,
      limit: Number(limit) || undefined,
      open: onlyOpen ? 1 : undefined,
    },
    { skip: !eventId }
  );

  const items =
    (Array.isArray(data) && data) ||
    (Array.isArray(data?.items) && data.items) ||
    (Array.isArray(data?.attendees) && data.attendees) ||
    [];

  const nav = [
    { label: "Home", href: "/" },
    { label: "Event", href: `/event/${eventId}` },
    { label: "Speakers", href: `/event/${eventId}/speakers` },
    { label: "Attendees", href: `/event/${eventId}/attendees` },
    { label: "Exhibitors", href: `/event/${eventId}/exhibitors` },
    { label: "Schedule", href: `/event/${eventId}/schedule` },
    { label: "Tickets", href: `/event/${eventId}/tickets` },
  ];

  return (
    <>
      <HeaderShell top={topbar} nav={nav} cta={cta} />
      <EventAttendeesBrowser
        heading="Attendees"
        subheading="Search, filter, preview, and explore the lineup."

        serverMode
        items={items}
        isLoading={isLoading}
        errorText={isError ? (error?.data?.message || "Failed to load attendees") : ""}

        // controlled (server) toolbar state
        query={q}
        onQueryChange={setQ}
        onlyOpen={onlyOpen}
        onOnlyOpenChange={setOnlyOpen}
        limit={limit}
        onLimitChange={setLimit}

        isLoggedIn={isLoggedIn}
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
