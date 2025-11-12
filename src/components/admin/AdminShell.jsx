import React, { useEffect, useMemo, useState, useCallback } from "react";
import PropTypes from "prop-types";
import { Outlet } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";
import "./admin.css";

const isMobileNow = () => window.matchMedia("(max-width: 992px)").matches;

export default function AdminShell({ nav = [], user, children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // restore collapse for desktop
  useEffect(() => {
    const s = localStorage.getItem("adm_collapsed");
    if (s != null && !isMobileNow()) setCollapsed(s === "1");
  }, []);
  useEffect(() => {
    if (!isMobileNow()) localStorage.setItem("adm_collapsed", collapsed ? "1" : "0");
  }, [collapsed]);

  // auto-close drawer on resize up
  useEffect(() => {
    const onR = () => { if (!isMobileNow()) setMobileOpen(false); };
    window.addEventListener("resize", onR);
    return () => window.removeEventListener("resize", onR);
  }, []);

  const onToggleSidebar = useCallback(() => {
    if (isMobileNow()) setMobileOpen(v => !v);
    else setCollapsed(v => !v);
  }, []);

  const activeId = useMemo(() => nav[0]?.id ?? "dashboard", [nav]);

  return (
    <div className={`admin ${collapsed ? "is-collapsed" : ""} ${mobileOpen ? "sidebar-open" : ""}`}>
      <a href="#admin-main" className="skip-link">Skip to content</a>

      {/* Sidebar (component should emit markup with .side-head/.side-nav etc.
          If it doesn’t, wrap its content inside those containers in the component) */}
      <AdminSidebar
        items={nav}
        activeId={activeId}
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onToggleSidebar={onToggleSidebar}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* Main */}
      <div className="adm-main">
        <AdminTopbar user={user} onBurger={onToggleSidebar} />
        <main id="admin-main" className="adm-content" role="main" tabIndex={-1}>
          {children ?? <Outlet />}
        </main>
        <footer className="adm-foot">© {new Date().getFullYear()} Eventra Admin</footer>
      </div>

      {/* Mobile backdrop */}
      {mobileOpen && <button className="adm-backdrop" onClick={() => setMobileOpen(false)} aria-label="Close menu" />}
    </div>
  );
}

AdminShell.propTypes = {
  nav: PropTypes.array,
  user: PropTypes.object,
  children: PropTypes.node,
};
