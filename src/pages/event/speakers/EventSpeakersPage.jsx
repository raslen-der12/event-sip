import React from "react";
import { useParams } from "react-router-dom";
import HeaderShell from "../../../components/layout/HeaderShell";
import Footer from "../../../components/footer/Footer";
import { topbar, cta, footerData } from "../../main.mock";
import EventSpeakersBrowser from "../../../components/event/speakers/EventSpeakersBrowser";
import { useGetSpeakersByEventQuery } from "../../../features/events/actorsApiSlice";
import useAuth from "../../../lib/hooks/useAuth";

export default function EventSpeakersPage() {
  const { eventId } = useParams();
  const { status } = useAuth(); // "Guest" or logged in
  const isLoggedIn = status !== "Guest";

  // ---- server-driven controls (search / filters / limit) ----
  const [q, setQ] = React.useState("");
  const [onlyOpen, setOnlyOpen] = React.useState(false);
  const [country, setCountry] = React.useState("");
  const [limit, setLimit] = React.useState(24);

  // Debounce q so we don't spam the API
  const [debouncedQ, setDebouncedQ] = React.useState(q);
  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 350);
    return () => clearTimeout(t);
  }, [q]);

  // Call hook with an object so the API layer can build querystring
  const { data, isLoading, isError, error } = useGetSpeakersByEventQuery(
    {
      eventId,
      q: debouncedQ || undefined,
      limit: Number(limit) || undefined,
      // optional filters your backend can ignore if not supported:
      country: country || undefined,
      open: onlyOpen ? 1 : undefined,
    },
    { skip: !eventId }
  );
  console.log(data);
  const items =
    (Array.isArray(data?.items) && data.items) ||
    (Array.isArray(data?.speakers) && data.speakers) ||
    (Array.isArray(data) && data) ||
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

      <EventSpeakersBrowser
        heading="Speakers"
        subheading="Search, filter, preview, and explore the lineup."
        // server mode = show exactly what the hook returns (no client paging)
        serverMode
        items={items}
        isLoading={isLoading}
        errorText={isError ? (error?.data?.message || "Failed to load speakers") : ""}

        // controlled search/filters/limit passed down to the toolbar
        query={q}
        onQueryChange={setQ}
        onlyOpen={onlyOpen}
        onOnlyOpenChange={setOnlyOpen}
        country={country}
        onCountryChange={setCountry}
        limit={limit}
        onLimitChange={setLimit}

        isLoggedIn={isLoggedIn}
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
