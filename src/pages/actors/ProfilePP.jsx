import React, { useMemo } from "react";
import { useParams, useLocation } from "react-router-dom";
import "./profile-pp.css";

import { useGetActorPPQuery } from "../../features/Actor/toolsApiSlice";
import { useGetEventQuery } from "../../features/events/eventsApiSlice";

import HeaderShell from "../../components/layout/HeaderShell";
import { topbar, cta, footerData } from "../main.mock";
import Footer from "../../components/footer/Footer";

import PPHeader from "../../components/pp/PPHeader";
import PPPrimaryPanel from "../../components/pp/PPPrimaryPanel";
import PPEventContactPanel from "../../components/pp/PPEventContactPanel";
import PPBadgesPanel from "../../components/pp/PPBadgesPanel";
import PPDeepDivePanel from "../../components/pp/PPDeepDivePanel";
import PPActivityPanel from "../../components/pp/PPActivityPanel";
import TalkPanel from "../../components/pp/PPTalk";
import PPEventSummary from "../../components/pp/PPEventSummary";
import PPBoothBadge from "../../components/pp/PPBoothBadge";
import PPBrochurePreview from "../../components/pp/PPBrochurePreview";

const fallbackNav = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Events", href: "/events" },
];

function resolveDisplayRole(actor, apiRole, hintRole) {
  const r1 = (hintRole || "").toLowerCase();
  if (["attendee","exhibitor","speaker"].includes(r1)) return r1;

  const r2 = (apiRole || actor?.__role || actor?.legacyRole || "").toLowerCase();
  if (["attendee","exhibitor","speaker"].includes(r2)) return r2;

  const hasExh = !!actor?.identity && (!!actor?.identity?.orgName || !!actor?.identity?.exhibitorName);
  const hasSpk = !!actor?.talk || !!actor?.enrichments?.slidesFile;
  if (hasExh) return "exhibitor";
  if (hasSpk) return "speaker";
  return "attendee";
}

function pickDesc(actor, role) {
  const a = actor || {};
  const r = (role || "").toLowerCase();

  if (r === "speaker") {
    return a?.enrichments?.bio || a?.personal?.bio || a?.talk?.abstract || "";
  }
  if (r === "exhibitor") {
    return a?.identity?.about || a?.business?.about || a?.commercial?.lookingFor || "";
  }
  // attendee default
  return a?.personal?.bio || a?.matchingIntent?.offering || a?.matchingIntent?.needs || "";
}

function makeTop(actor, role) {
  const r = (role || "").toLowerCase();
  const a = actor || {};

  if (r === "speaker") {
    return {
      photo: a?.personal?.profilePic || a?.enrichments?.profilePic || "",
      name: a?.personal?.fullName || "—",
      org: a?.organization?.orgName || "",
      title: a?.organization?.jobTitle || "",
      city: a?.personal?.city || "",
      country: a?.personal?.country || "",
      open: !!a?.b2bIntent?.openMeetings,
    };
  }
  if (r === "exhibitor") {
    return {
      photo: a?.identity?.logo || "",
      name: a?.identity?.exhibitorName || a?.identity?.orgName || "—",
      org: a?.identity?.orgName || "",
      title: a?.business?.industry || "",
      city: a?.identity?.city || "",
      country: a?.identity?.country || "",
      open: !!a?.commercial?.availableMeetings,
    };
  }
  return {
    photo: a?.personal?.profilePic || "",
    name: a?.personal?.fullName || "—",
    org: a?.organization?.orgName || "",
    title: a?.organization?.businessRole || "",
    city: a?.personal?.city || "",
    country: a?.personal?.country || "",
    open: !!a?.matchingIntent?.openToMeetings,
  };
}

export default function ProfilePP() {
  const params = useParams();
  const { search } = useLocation();
  const qs = new URLSearchParams(search);

  const routeId = params.id || qs.get("id") || "";
  const hintRole = (qs.get("role") || "").toLowerCase();

  const { data: actorRes, isLoading, isFetching, isError, error } =
    useGetActorPPQuery(routeId, { skip: !routeId });
    const actor = actorRes?.data || actorRes || null;
    console.log("actorRes");
  const apiRole = actorRes?.role || actor?.__role || actor?.legacyRole;
  const bp = actorRes?.bp || actorRes?.primary;
  const role = useMemo(
    () => resolveDisplayRole(actor, apiRole, hintRole),
    [actor, apiRole, hintRole]
  );

  const eventId =
    actor?.id_event ||
    actor?.eventId ||
    actor?.idEvent ||
    actor?.event?._id ||
    "68e6764bb4f9b08db3ccec04";

  const { data: evRes } = useGetEventQuery(eventId, { skip: !eventId });
  const eventMini = evRes?.data || evRes || null;

  const nav = useMemo(() => {
    if (!eventMini?._id && !eventMini?.id) return fallbackNav;
    const eid = eventMini?.id || eventMini?._id;
    return [
      ...fallbackNav,
      { label: "Speakers", href: `/event/${eid}/speakers` },
      { label: "Attendees", href: `/event/${eid}/attendees` },
      { label: "Exhibitors", href: `/event/${eid}/exhibitors` },
      { label: "Tickets", href: `/event/${eid}/tickets` },
    ];
  }, [eventMini?._id, eventMini?.id]);

  const top = useMemo(() => makeTop(actor, role), [actor, role]);
  const description = useMemo(() => pickDesc(actor, role), [actor, role]);
  const busy = isLoading || isFetching;

  const bpLink = bp?.exists && bp?.slug ? `/bp/${bp.slug}` : "";

  return (
    <>
      <HeaderShell top={topbar} nav={nav} cta={cta} />

      <div className="ppp-shell">
        <div className="container">
          <PPHeader
            loading={busy}
            errorText={isError ? (error?.data?.message || "Failed to load profile.") : ""}
            role={role}
            actorId={routeId}
            actor={actor}
            eventTitle={eventMini?.title}
            eventCity={eventMini?.city}
            eventCountry={eventMini?.country}
            description={description}
            businessProfileHref={bpLink || null}
            isLoggedIn={false}
            onBook={() => alert("Book meeting: TODO")}
            onMessage={() => alert("Message: TODO")}
          />

          <PPPrimaryPanel
            role={role}
            actor={actor}
            isLoading={busy}
            eventMini={eventMini}
          />

          {eventMini ? (
            <PPEventSummary
              event={eventMini}
              viewHref={`/event/${eventMini?.id || eventMini?._id}`}
            />
          ) : null}

          <PPEventContactPanel
            role={role}
            actor={actor}
            eventMini={eventMini}
            isLoading={busy}
            // NEW: tell the contact panel to hide placeholders
            hideEmpty
          />

          {role === "speaker" && <TalkPanel actor={actor} />}

          {role === "exhibitor" && (
            <>
              <PPBoothBadge booth={actor?.booth} identity={actor?.identity} />
              <PPBrochurePreview valueAdds={actor?.valueAdds} identity={actor?.identity} />
            </>
          )}

          <PPBadgesPanel role={role} actor={actor} isLoading={busy} />

          {/* REMOVE Business Profile content from deep dive: panel should not render BP block now */}
          <PPDeepDivePanel
            role={role}
            actorId={routeId}
            actor={actor}
            isLoading={busy}
            canEdit={false}
            hideBusinessProfile
          />

          <PPActivityPanel role={role} actor={actor} eventMini={eventMini} canEdit={false} />
        </div>
      </div>

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
