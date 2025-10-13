// src/pages/profile/ProfileLoader.jsx
import React from "react";
import useAuth from "../../lib/hooks/useAuth";

// you said these hooks exist already
import { useGetActorQuery } from "../../features/actors/actorApiSlice";
import { useGetEventQuery } from "../../features/events/eventApiSlice";

import ProfileShell from "../../components/profile/ProfileShell";
import ProfilePanels from "../../components/profile/Panels";
import { adaptActor } from "../../components/profile/adapters/actorAdapter";
import { getFieldMap } from "../../components/profile/adapters/fieldMaps";
import { OverviewSkeleton } from "../../components/profile/Skeletons";

export default function ProfileLoader(){
  const { role, ActorId } = useAuth();

  const { data: actorRes, isLoading: aLoad, isError: aErr, refetch: refetchActor } =
    useGetActorQuery({ id: ActorId, role }, { skip: !ActorId || !role });

  const actor = actorRes?.data || actorRes || {};
  const eventId = actor?.id_event || actor?.eventId || "68e6764bb4f9b08db3ccec04";

  const { data: eventRes, isLoading: eLoad } =
    useGetEventQuery(eventId, { skip: !eventId });

  const event = eventRes?.data || eventRes || null;

  if (aLoad) return <OverviewSkeleton />;

  if (aErr) {
    return (
      <div className="pp-card">
        <div className="pp-head"><h3 className="pp-title">Profile</h3></div>
        <div className="pp-body">
          <p className="pp-note">Couldn’t load your profile.</p>
          <button className="pp-btn" onClick={() => refetchActor()}>Retry</button>
        </div>
      </div>
    );
  }

  const normalized = adaptActor(role, actor);
  const fieldMap = getFieldMap(role);

  return (
    <ProfileShell actor={normalized} event={event}>
      <ProfilePanels
        role={role}
        profile={actor}          // raw actor (so editors can write correct paths)
        normalized={normalized}  // pretty view data (names, chips, etc.)
        fields={fieldMap}        // tells panels what to render/edit/lock
        activeTab="overview"
        //event={event}
      />
    </ProfileShell>
  );
}
