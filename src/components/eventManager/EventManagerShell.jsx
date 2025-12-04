import React from "react";
import { Outlet, NavLink, Link, useLocation } from "react-router-dom";
import {
  FiCalendar,
  FiLayers,
  FiUser,
  FiSettings,
  FiHome,
} from "react-icons/fi";
import useAuth from "../../lib/hooks/useAuth";
import "./event-manager-shell.css";

const navItems = [
  {
    id: "dashboard",
    to: "/event-manager/dashboard",
    label: "Event dashboard",
    icon: FiCalendar,
  },
  {
    id: "plans",
    to: "/event-manager",
    label: "Plans & application",
    icon: FiLayers,
  },
];

const EventManagerShell = () => {
  const auth = useAuth();
  const location = useLocation();

  const isInDashboardPage =
    location.pathname.startsWith("/event-manager/dashboard");

  // --- User display info, safe against undefined auth.user ---
  const raw = auth?.user?.raw || {};
  const displayName =
    raw.name ||
    raw.fullName ||
    raw.actorName ||
    raw.companyName ||
    auth?.email ||
    "Event manager";

  const displayRole =
    raw.actorHeadline ||
    auth?.actorHeadline ||
    (auth?.status
      ? `${auth.status}${auth.actorType ? " · " + auth.actorType : ""}`
      : "Attendee");

  const initials =
    displayName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase())
      .join("") || "EM";

  const actorProfileLink = auth?.ActorId
    ? `/profile/${auth.ActorId}`
    : "/profile";

  return (
    <div className="ems-root">
      {/* Top header */}
      <header className="ems-header">
        <div className="ems-header-left">
          <Link to="/" className="ems-brand">
            <span className="ems-brand-mark">E</span>
            <span className="ems-brand-text">
              <span className="ems-brand-title">Event Manager</span>
              <span className="ems-brand-sub">GITS · Organizer space</span>
            </span>
          </Link>
        </div>

        <div className="ems-header-right">
          <div className="ems-breadcrumb">
            <span className="ems-breadcrumb-main">
              {isInDashboardPage ? "Event dashboard" : "Plans & application"}
            </span>
            <span className="ems-breadcrumb-sub">
              {isInDashboardPage
                ? "Edit your events and schedule"
                : "Choose a plan, apply and unlock your space"}
            </span>
          </div>

          <div className="ems-user">
            <div className="ems-user-avatar">
              <span>{initials}</span>
            </div>
            <div className="ems-user-meta">
              <span className="ems-user-name">{displayName}</span>
              <span className="ems-user-role">{displayRole}</span>
            </div>
            <Link to={actorProfileLink} className="ems-user-link">
              <FiUser />
              <span>View profile</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Body: aside + main content */}
      <div className="ems-body">
        <aside className="ems-aside">
          <div className="ems-aside-inner">
            <div className="ems-aside-section-label">Navigation</div>
            <nav className="ems-nav">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.id}
                    to={item.to}
                    end={item.to === "/event-manager"}
                    className={({ isActive }) =>
                      "ems-nav-item" + (isActive ? " ems-nav-item--active" : "")
                    }
                  >
                    <Icon />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>

            <div className="ems-aside-section-label">Quick actions</div>
            <div className="ems-quick">
              <Link to="/event-manager/dashboard" className="ems-quick-item">
                <FiHome />
                <span>Go to current event</span>
              </Link>
              <Link
                to="/settings"
                className="ems-quick-item ems-quick-item--muted"
              >
                <FiSettings />
                <span>Account settings (later)</span>
              </Link>
            </div>
          </div>
        </aside>

        <main className="ems-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default EventManagerShell;
