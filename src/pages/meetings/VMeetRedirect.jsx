// src/pages/meetings/VMeetRedirect.jsx
import React from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useGetMeetJoinLinkQuery } from "../../features/meetings/meetingsApiSlice";
import { FiExternalLink } from "react-icons/fi";

export default function VMeetRedirect() {
  const params = useParams(); // { meetingId, actorId? }
  const [sp] = useSearchParams();

  const meetingId = String(params.meetingId || "").trim();
  // actorId can be in /vmeet/:meetingId/:actorId or query ?actorId= / ?aid=
  const actorId =
    String(params.actorId || sp.get("actorId") || sp.get("aid") || "").trim();

  const skip = !meetingId || !actorId;
  const { data, isFetching, isError, error } = useGetMeetJoinLinkQuery(
    { meetingId, actorId },
    { skip }
  );

  // redirect as soon as link is available
  React.useEffect(() => {
    const url = data?.link;
    if (url) {
      try {
        window.location.replace(url);
      } catch {
        // swallow – we'll keep the manual link visible
      }
    }
  }, [data]);

  if (skip) {
    return (
      <div className="min-h-[60vh] grid place-items-center px-6 text-center">
        <div>
          <h1 className="text-xl font-semibold">Missing info</h1>
          <p className="text-sm text-zinc-600 mt-2">
            The link requires both a meeting ID and an actor ID.
          </p>
        </div>
      </div>
    );
  }

  if (isFetching) {
    return (
      <div className="min-h-[60vh] grid place-items-center px-6 text-center">
        <div>
          <h1 className="text-xl font-semibold">Preparing your room…</h1>
          <p className="text-sm text-zinc-600 mt-2">
            Validating access and fetching the meeting link.
          </p>
        </div>
      </div>
    );
  }

  if (isError || !data?.ok) {
    return (
      <div className="min-h-[60vh] grid place-items-center px-6 text-center">
        <div>
          <h1 className="text-xl font-semibold">Unable to open room</h1>
          <p className="text-sm text-red-600 mt-2">
            {String(error?.data?.message || error?.error || "Access denied or link not ready.")}
          </p>
        </div>
      </div>
    );
  }

  // Success but window.replace failed (popup blockers, etc.)
  const meetUrl = data?.link || "";

  return (
    <div className="min-h-[60vh] grid place-items-center px-6 text-center">
      <div>
        <h1 className="text-xl font-semibold">Opening room…</h1>
        <p className="text-sm text-zinc-600 mt-2">
          If you are not redirected automatically, click the button below.
        </p>
        {meetUrl ? (
          <a
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-lg border hover:bg-zinc-50"
            href={meetUrl}
            target="_self"
            rel="noreferrer"
          >
            <FiExternalLink />
            Enter Google Meet
          </a>
        ) : null}
      </div>
    </div>
  );
}
