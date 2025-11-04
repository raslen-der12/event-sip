import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import HeaderShell from "../../../components/layout/HeaderShell";
import Footer from "../../../components/footer/Footer";
import { topbar, cta, footerData } from "../../main.mock";
import useAuth from "../../../lib/hooks/useAuth";
import EventAttendeesBrowser from "../../../components/event/attendees/EventAttendeesBrowser";
import { useGetAttendeesByEventQuery } from "../../../features/events/actorsApiSlice";
import imageLink from "../../../utils/imageLink";

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

  // debounce search
  const [debouncedQ, setDebouncedQ] = React.useState(q);
  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 350);
    return () => clearTimeout(t);
  }, [q]);

  // Very large limit so the backend returns all (or a very large chunk).
  // If your backend refuses huge numbers, change this to a value that fits (e.g. 5000).
  const LIMIT = 100000;

  // fetch attendees (no paging)
  const { data, isLoading, isError, error } = useGetAttendeesByEventQuery(
    {
      eventId,
      q: debouncedQ || undefined,
      limit: Number(LIMIT) || undefined,
      open: onlyOpen ? 1 : undefined,
    },
    { skip: !eventId }
  );

  // Normalize returned shapes
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
  ];

  return (
    <>
      <HeaderShell
        top={topbar}
        nav={nav}
        cta={cta}
        logo={
          eventId === "68e6764bb4f9b08db3ccec04"
            ? imageLink("/default/IPDAYXGITS.png")
            : null
        }
      />

      <EventAttendeesBrowser
        heading="Attendees"
        subheading="Search, filter, preview, and explore the lineup."

        // server mode: we supply the full list and the component will render it
        serverMode

        items={items}
        isLoading={isLoading}
        errorText={isError ? (error?.data?.message || "Failed to load attendees") : ""}

        // controlled toolbar state
        query={q}
        onQueryChange={setQ}
        onlyOpen={onlyOpen}
        onOnlyOpenChange={setOnlyOpen}

        // hide the "per page" control and do NOT provide any load-more props
        showLimitControl={false}

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
