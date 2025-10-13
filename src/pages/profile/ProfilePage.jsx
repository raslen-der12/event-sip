// src/pages/profile/ProfilePage.jsx
import React from "react";
import { useLocation } from "react-router-dom";
import HeaderShell from "../../components/layout/HeaderShell";
import Footer from "../../components/footer/Footer";
import ProfileShell from "../../components/profile/ProfileShell";
import { useGetProfileQuery, useUpdateProfileMutation } from "../../features/Actor/toolsApiSlice";
import { useGetEventQuery } from "../../features/events/eventsApiSlice";
import useAuth from "../../lib/hooks/useAuth";
import { topbar, nav, cta, footerData } from "../main.mock";

/** Normalize role values we support */
const normalizeRole = (r) => {
  const s = String(r || "").toLowerCase();
  if (["attendee", "exhibitor", "speaker", "consultant", "employee", "investor", "businessowner"].includes(s)) {
    return s;
  }
  return ""; // unknown -> skip
};

/**
 * Resolve role & id from URL (?role=...&id=...) first, then fall back to JWT.
 * Also compute a canEdit flag and default viewMode.
 */
function useActorLocator() {
  const { search } = useLocation();
  const qs = React.useMemo(() => new URLSearchParams(search), [search]);

  const urlRole = normalizeRole(qs.get("role"));
  const urlId = qs.get("id") || "";

  const auth = useAuth();
  const authRole = normalizeRole(auth?.role);
  const authId = auth?.ActorId || auth?.actorId || "";

  const role = urlRole || authRole;
  const id = urlId || authId;

  const canEdit = Boolean(authId && id && authId === id);
  const viewParam = (qs.get("view") || "").toLowerCase(); // "public" | "private"
  const viewMode = viewParam === "public" ? "public" : (canEdit ? "private" : "public");

  return { role, id, canEdit, viewMode };
}

export default function ProfilePage() {
  const { role, id, canEdit, viewMode } = useActorLocator();
  const skipActor = !role || !id;

  const {
    data: actorData,
    isLoading: loadingActor,
    isError: errActor,
    refetch: refetchActor,
  } = useGetProfileQuery(skipActor ? undefined : { role, id }, {
    skip: skipActor,
    // if you use RTKQ v1.9+, this ensures fresh data when args change
    refetchOnMountOrArgChange: true,
  });

  // API can return either { actor, eventId } or actor directly
  const actor = actorData?.actor || actorData || null;

  // Try multiple fields for event id
  const eventId =
    actor?.eventId ||
    actor?.id_event ||
    actor?.event?._id ||
    "68e6764bb4f9b08db3ccec04";

  const {
    data: eventData,
    isLoading: loadingEvent,
    isError: errEvent
  } = useGetEventQuery(eventId, { skip: !eventId });

  const [updateActor, { isLoading: saving }] = useUpdateProfileMutation();

  /** JSON patch helper (panels can pass nested keys or partial trees) */
  const onPatch = React.useCallback(async (partial) => {
    if (!role || !id || !partial) return;
    // BE contract: { role, id, data } where data can be JSON or FormData
    await updateActor({ role, id, data: partial }).unwrap();
    await refetchActor();
  }, [role, id, updateActor, refetchActor]);

  /** File upload helper (e.g., profile photo, gallery, docs) */
  const onUploadPhoto = React.useCallback(async (file) => {
    if (!role || !id || !file) return;
    const fd = new FormData();
    fd.append("photo", file);
    // server should detect multipart and update personal.profilePic (or identity.logo for exhibitors)
    await updateActor({ role, id, data: fd }).unwrap();
    await refetchActor();
  }, [role, id, updateActor, refetchActor]);

  const loading = loadingActor || loadingEvent;
  const loadError = errActor ? "Failed to load profile" : (errEvent ? "Failed to load event" : null);

  return (
    <>
      <HeaderShell top={topbar} nav={nav} cta={cta} />
      <div className="container">
        <ProfileShell
          role={role || "attendee"}
          actor={actor}
          event={eventData || null}
          canEdit={canEdit}
          viewMode={viewMode}          
          loading={!!loading || !!saving}
          loadError={loadError}
          onPatch={onPatch}            
          onUploadPhoto={onUploadPhoto}
          initialTabKey="identity"
        />
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
