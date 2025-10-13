import React from "react";
import PropTypes from "prop-types";
import "./profile-panels.css";

/* Icons */
import { FiUser, FiShield ,FiBriefcase, FiTarget, FiCalendar } from "react-icons/fi";

/* Panels */
import IdentityPanel from "./IdentityPanel";
import BusinessPanel from "./BusinessPanel";
import MatchingPanel from "./MatchingPanel";
import EventPanel from "./EventPanel";
import SecurityPanel from "./SecurityPanel";
/** Tab registry (per role). Each entry has a `icon` and a component. */
const TAB_REGISTRY = {
  base: [
    { key: "identity", label: "Identity", icon: FiUser,      component: IdentityPanel },
    { key: "matching", label: "Matching", icon: FiTarget,    component: MatchingPanel },
    { key: "event",    label: "Event",    icon: FiCalendar,  component: EventPanel },
    { key: "security", label: "Security", icon: FiShield,    component: SecurityPanel }, // 👈 NEW
  ],
  attendee()  { return [...this.base]; },
  attendee()  { return [...this.base]; }, // alias
  exhibitor() { return [...this.base]; },
  speaker()   { return [...this.base]; },
};

function getTabs(role) {
  const r = (role || "").toLowerCase();
  if (typeof TAB_REGISTRY[r] === "function") return TAB_REGISTRY[r]();
  return TAB_REGISTRY.base;
}

function findTab(tabs, key) {
  return tabs.find(t => t.key === key) || tabs[0] || null;
}

/** Imperative renderer used by ProfileShell */
function Render({ tabs, activeKey, role, actor, event, loading, onPatch }) {
  const t = findTab(tabs, activeKey);
  if (!t) return null;
  const Comp = t.component;
  return (
    <Comp
      role={role}
      actor={actor}
      event={event}
      loading={loading}
      onPatch={onPatch}
    />
  );
}

Render.propTypes = {
  tabs: PropTypes.array.isRequired,
  activeKey: PropTypes.string.isRequired,
  role: PropTypes.string.isRequired,
  actor: PropTypes.object,
  event: PropTypes.object,
  loading: PropTypes.bool,
  onPatch: PropTypes.func,
};

export default { getTabs, Render };
