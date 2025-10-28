// src/pages/share/ShareLinkPage.jsx
import React, { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useResolveShareLinkQuery } from "../../features/Actor/toolsApiSlice";

export default function ShareLinkPage() {
  const navigate = useNavigate();
  const { actorId = "", eventId = "" } = useParams();
  const skip = !actorId || !eventId;

  const { data, isFetching, isLoading, isError, error } = useResolveShareLinkQuery(
    { actorId, eventId },
    { skip }
  );

  useEffect(() => {
    if (skip) return;
    if (data?.eventId) {
      // Canonical redirect to event page with source markers
      navigate(`/event/${data.eventId}?from=share&a=${actorId}`, { replace: true });
    }
  }, [skip, data, actorId, navigate]);

  if (isLoading || isFetching) {
    return (
      <main className="clean-page container" style={{ padding: "40px 16px" }}>
        <div className="card" style={{ padding: 16 }}>
          Resolving link…
        </div>
      </main>
    );
  }

  if (isError) {
    const msg = error?.data?.message || error?.error || "Invalid or expired link.";
    return (
      <main className="clean-page container" style={{ padding: "40px 16px" }}>
        <div className="card" style={{ padding: 16, border: "1px solid #fee2e2", background: "#fef2f2" }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Share link error</div>
          <div style={{ color: "#7f1d1d" }}>{msg}</div>
        </div>
      </main>
    );
  }

  // Brief placeholder in case navigate happens on the next tick
  return (
    <main className="clean-page container" style={{ padding: "40px 16px" }}>
      <div className="card" style={{ padding: 16 }}>Redirecting…</div>
    </main>
  );
}
