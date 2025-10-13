import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import useAuth from "../../lib/hooks/useAuth";

/**
 * RequireAuth
 * - allowedRoles: array of strings (e.g., ['admin','super'])
 * - If user has one of the allowed roles -> render <Outlet/>
 * - If logged in but role not allowed -> /unauthorized
 * - If not logged in -> /login
 */
export default function RequireAuth({ allowedRoles = [] }) {
  const location = useLocation();
  const { role, status } = useAuth(); // role can be string/array; status is 'Admin', 'Speaker', etc.

  // Normalize user's roles into a comparable array
  const userRoles = Array.isArray(role)
    ? role
    : (typeof role === "string" && role.trim())
      ? [role]
      : [];

  // treat `status` as a role-alias (e.g., 'Admin' when role contains 'admin')
  if (status) userRoles.push(status.toLowerCase());

  // if no allowedRoles passed, allow any authenticated user
  const allowAnyAuthenticated = allowedRoles.length === 0;

  const hasAccess =
    allowAnyAuthenticated ||
    allowedRoles.some((r) =>
      userRoles.some((ur) => String(ur).toLowerCase().includes(String(r).toLowerCase()))
    );

  // unauthenticated → login
  if (!role) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // authenticated but not allowed → unauthorized
  if (!hasAccess) {
    return <Navigate to="/unauthorized" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
