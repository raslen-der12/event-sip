// src/pages/exhibitors/ExhibitorsPage.jsx
import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import HeaderShell from "../../../components/layout/HeaderShell";
import Footer from "../../../components/footer/Footer";
import { topbar, cta, footerData } from "../../main.mock";
import useAuth from "../../../lib/hooks/useAuth";
import EventExhibitorsGallery from "../../../components/event/exhibitors/EventExhibitorsGallery";
import { useGetPublicExhibitorsQuery } from "../../../features/bp/BPApiSlice";
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

  // server-driven params we actually have (q + limit). Industry/Open are client-only.
  const [q, setQ] = React.useState("");
  const [limit, setLimit] = React.useState(24);

  // debounce q to avoid spamming
  const [debouncedQ, setDebouncedQ] = React.useState(q);
  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 350);
    return () => clearTimeout(t);
  }, [q]);

  const { data, isLoading, isError, error } = useGetPublicExhibitorsQuery(
    { eventId, q: debouncedQ || undefined, limit: Number(limit) || undefined },
    { skip: !eventId }
  );
  console.log("data",data);

  // Map backend public shape -> gallery card shape
  const items = React.useMemo(() => {
    const rows = Array.isArray(data?.data) ? data.data : [];
    return rows.map((r) => ({
      id: r.ownerId, // IMPORTANT: links & meeting use OWNER actor id
      orgName: r.name || "—",
      industry: (Array.isArray(r.industries) && r.industries[0]) || "",
      logo: r.logoUpload ? imageLink(r.logoUpload) : null,
      offering: r.tagline || "", // small text under name
      openToMeet: false, // unknown in public endpoint (client filter will ignore if false)
    }));
  }, [data]);

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

      <EventExhibitorsGallery
        heading="Exhibitors"
        subheading="Teams showcasing products & services."
        // Use client filtering (since public endpoint doesn't support industry/open):
        serverMode={false}
        items={items}
        isLoading={isLoading}
        errorText={isError ? (error?.data?.message || "Failed to load exhibitors") : ""}

        // Client toolbar controls (gallery manages these locally in client mode,
        // but we pass initial values so UX stays consistent)
        query={q}
        onQueryChange={setQ}
        onlyOpen={false}
        onOnlyOpenChange={() => {}}
        industry={"All"}
        onIndustryChange={() => {}}
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
