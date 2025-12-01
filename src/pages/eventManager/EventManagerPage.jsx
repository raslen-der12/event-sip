import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./event-manager.css";
import useAuth from "../../lib/hooks/useAuth";

const EventManagerPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {user} = useAuth()
  useEffect(() => {
    const redirectTo = "/event-manager/dashboard";
    if (!user?.userId) {
      // Not logged in: go to login, then back here
      const next = encodeURIComponent(redirectTo);
      navigate(`/login?next=${next}`, { replace: true });
    } else {
      navigate(redirectTo, { replace: true });
    }
  }, [user, navigate]);

  // Small fallback UI while redirecting
  return (
    <div className="em-redirect-screen">
      <div className="em-redirect-card">
        <div className="em-redirect-spinner" />
        <div className="em-redirect-text">
          Preparing your Event Manager dashboard…
        </div>
      </div>
    </div>
  );
};

export default EventManagerPage;
