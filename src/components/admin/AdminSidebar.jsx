import React, { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { NavLink, useLocation } from "react-router-dom";
import {
  FiGrid, FiCalendar, FiTag, FiUsers, FiBarChart2, FiSettings,
  FiChevronRight, FiChevronDown, FiFolder
} from "react-icons/fi";
import "./admin.css";

const iconMap = {
  dashboard: FiGrid,
  events: FiCalendar,
  tickets: FiTag,
  actors: FiUsers,
  finance: FiBarChart2,
  settings: FiSettings,
  group: FiFolder,
};

export default function AdminSidebar({
  items = [], collapsed, mobileOpen, onToggleSidebar, onCloseMobile
}) {
  const { pathname } = useLocation();

  // auto-open any group that contains the current path
  const initialGroups = useMemo(() => {
    const map = {};
    items.forEach(it => {
      if (it.children?.length) {
        map[it.id] = it.children.some(ch => pathname.startsWith(ch.href || ch.to || "")); // open if matches
      }
    });
    return map;
  }, [items, pathname]);

  const [openGroups, setOpenGroups] = useState(initialGroups);
  useEffect(() => setOpenGroups(initialGroups), [initialGroups]);

  const toggleGroup = (id) => setOpenGroups(s => ({ ...s, [id]: !s[id] }));
  const isCollapsed = collapsed;

  const renderItem = (it) => {
    const Icon = iconMap[it.icon] || FiGrid;
    const to = it.href || it.to || "#";
    return (
      <NavLink
        key={it.id}
        to={to}
        className={({ isActive }) => `side-link ${isActive ? "active" : ""}`}
        title={isCollapsed ? it.label : undefined}
        onClick={onCloseMobile}
        end
      >
        <span className="ic"><Icon size={18} aria-hidden="true" /></span>
        <span className="tx">{it.label}</span>
      </NavLink>
    );
  };

  const renderGroup = (g) => {
    const GIcon = iconMap[g.icon] || FiFolder;
    const open = !!openGroups[g.id];
    const Chevron = open ? FiChevronDown : FiChevronRight;

    return (
      <div key={g.id} className={`side-group ${open ? "open" : ""}`}>
        <button
          type="button"
          className="side-link sg-head"
          title={isCollapsed ? g.label : undefined}
          onClick={() => toggleGroup(g.id)}
          aria-expanded={open}
          aria-controls={`sg-${g.id}`}
        >
          <span className="ic"><GIcon size={18} aria-hidden="true" /></span>
          <span className="tx">{g.label}</span>
          <span className="chev" aria-hidden="true"><Chevron size={16} /></span>
        </button>

        <div id={`sg-${g.id}`} className="sg-children" hidden={!open || isCollapsed}>
          {g.children.map(ch => (
            <NavLink
              key={ch.id}
              to={ch.href || ch.to || "#"}
              className={({ isActive }) => `side-sublink ${isActive ? "active" : ""}`}
              onClick={onCloseMobile}
              end
            >
              <span className="tx">{ch.label}</span>
            </NavLink>
          ))}
        </div>
      </div>
    );
  };

  return (
    <aside
      className={`adm-side ${isCollapsed ? "collapsed" : ""} ${mobileOpen ? "open" : ""}`}
      aria-label="Admin navigation"
    >
      <div className="side-head">
        {/* brand fully hides in collapsed mode via CSS */}
        <a className="side-brand" href="/admin" aria-label="GITS Admin">
          <span className="side-logo" aria-hidden="true">G</span>
          <span className="side-word">GITS<span className="accent">Admin</span></span>
        </a>

        {/* One button handles both: collapse (desktop) or close (mobile) */}
        <button
          className="side-toggle"
          onClick={onToggleSidebar}
          aria-label={mobileOpen ? "Close menu" : (isCollapsed ? "Expand sidebar" : "Collapse sidebar")}
          aria-expanded={!isCollapsed}
        />
      </div>

      <nav className="side-nav">
        {items.map(it => (it.children?.length ? renderGroup(it) : renderItem(it)))}
      </nav>
    </aside>
  );
}

AdminSidebar.propTypes = {
  items: PropTypes.array,
  collapsed: PropTypes.bool,
  mobileOpen: PropTypes.bool,
  onToggleSidebar: PropTypes.func,
  onCloseMobile: PropTypes.func,
};
