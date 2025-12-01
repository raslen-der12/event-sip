// src/features/auth/RequireAuth.jsx
import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import useAuth from "../../lib/hooks/useAuth";

/**
 * Route guard:
 *   <RequireAuth allowedRoles={['admin']} />
 *
 * allowedRoles is matched (case-insensitive) against:
 *   - auth.role        (e.g. "admin", "user")
 *   - auth.status      (e.g. "Admin", "Attendee")
 *   - auth.actorType   (e.g. "attendee", "speaker")
 *   - auth.subRole[]   (e.g. "eventManager")
 */
const RequireAuth = ({ allowedRoles = [] }) => {
  const location = useLocation();
  const auth = useAuth();

  const {
    token,
    ActorId,
    role,
    status,
    actorType,
    user,
    isAdmin,
    isSuper,
    isSpeaker,
    isExhibitor,
    isAttendee,
  } = auth || {};

  // not authenticated -> login
  if (!token || !ActorId) {
    return (
      <Navigate
        to="/login"
        state={{ from: location }}
        replace
      />
    );
  }

  const allowedLc = (allowedRoles || []).map((r) =>
    String(r || "").toLowerCase()
  );

  const userRoles = new Set();
  const addRole = (r) => {
    if (!r) return;
    userRoles.add(String(r).toLowerCase());
  };

  addRole(role);
  addRole(status);
  addRole(actorType);

  if (isAdmin) {
    addRole("admin");
    addRole("staff");
  }
  if (isSuper) {
    addRole("super");
    addRole("superadmin");
  }
  if (isSpeaker) addRole("speaker");
  if (isExhibitor) addRole("exhibitor");
  if (isAttendee) addRole("attendee");

  const subRole = user?.subRole || [];
  if (Array.isArray(subRole)) {
    subRole.forEach((r) => addRole(r));
  }

  const hasAccess =
    !allowedLc.length ||
    allowedLc.some((r) => userRoles.has(r));

  if (!hasAccess) {
    return (
      <Navigate
        to="/unauthorized"
        state={{ from: location }}
        replace
      />
    );
  }

  return <Outlet />;
};

export default RequireAuth;
