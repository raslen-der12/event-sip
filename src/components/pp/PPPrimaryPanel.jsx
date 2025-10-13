import React from "react";
import PropTypes from "prop-types";
import {
  FiUser,
  FiBriefcase,
  FiGlobe,
  FiMapPin,
  FiLayers,
  FiTag,
  FiAward,
  FiActivity,
} from "react-icons/fi";
import "./pp-primary.css";

/**
 * Public Profile – Overview quick facts (READ-ONLY)
 * Role aware: speaker / exhibitor / attendee
 * Props:
 *  - role: string
 *  - actor: object (entire actor doc)
 */
export default function PPOverviewPanel({ role = "", actor = {} }) {
  const r = (role || "").toLowerCase();
  if (r === "speaker") return <SpeakerOverview a={actor} />;
  if (r === "exhibitor") return <ExhibitorOverview a={actor} />;
  return <AttendeeOverview a={actor} />;
}

PPOverviewPanel.propTypes = {
  role: PropTypes.string,
  actor: PropTypes.object,
};

/* ---------------------------- helpers ---------------------------- */

function Cell({ icon, label, value }) {
  if (!value && value !== 0 && value !== false) return null;
  return (
    <div className="ppo-cell">
      <div className="ppo-ico">{icon}</div>
      <div className="ppo-meta">
        <div className="ppo-k">{label}</div>
        <div className="ppo-v">{format(value)}</div>
      </div>
    </div>
  );
}
function format(v) {
  if (Array.isArray(v)) return v.filter(Boolean).join(", ");
  if (typeof v === "boolean") return v ? "Yes" : "No";
  return String(v);
}

/* ---------------------------- roles ------------------------------ */

function SpeakerOverview({ a = {} }) {
  const p = a?.personal || {};
  const o = a?.organization || {};
  const t = a?.talk || {};
  return (
    <section className="ppo-card">
      <header className="ppo-head">
        <h3 className="ppo-title">Overview</h3>
      </header>
      <div className="ppo-grid">
        <Cell icon={<FiUser />} label="Full name" value={p.fullName} />
        <Cell icon={<FiBriefcase />} label="Job title" value={o.jobTitle} />
        <Cell icon={<FiAward />} label="Role" value={o.businessRole} />
        <Cell icon={<FiGlobe />} label="Organization" value={o.orgName} />
        <Cell icon={<FiLayers />} label="Topic" value={t.topicCategory} />
        <Cell icon={<FiTag />} label="Audience" value={t.targetAudience} />
        <Cell icon={<FiMapPin />} label="Country" value={p.country} />
        <Cell icon={<FiMapPin />} label="City" value={p.city} />
        <Cell icon={<FiActivity />} label="Language" value={t.language} />
      </div>
    </section>
  );
}

function ExhibitorOverview({ a = {} }) {
  const id = a?.identity || {};
  const b = a?.business || {};
  return (
    <section className="ppo-card">
      <header className="ppo-head">
        <h3 className="ppo-title">Overview</h3>
      </header>
      <div className="ppo-grid">
        <Cell icon={<FiGlobe />} label="Organization" value={id.orgName} />
        <Cell icon={<FiTag />} label="Exhibitor name" value={id.exhibitorName} />
        <Cell icon={<FiBriefcase />} label="Business model" value={b.businessModel} />
        <Cell icon={<FiLayers />} label="Industry" value={b.industry} />
        <Cell icon={<FiLayers />} label="Sub-industry" value={b.subIndustry} />
        <Cell icon={<FiActivity />} label="Tech level" value={b.techLevel} />
        <Cell icon={<FiMapPin />} label="Country" value={id.country} />
        <Cell icon={<FiMapPin />} label="City" value={id.city} />
        <Cell icon={<FiUser />} label="Contact" value={id.contactName} />
      </div>
    </section>
  );
}

function AttendeeOverview({ a = {} }) {
  const p = a?.personal || {};
  const o = a?.organization || {};
  const bp = a?.businessProfile || {};
  return (
    <section className="ppo-card">
      <header className="ppo-head">
        <h3 className="ppo-title">Overview</h3>
      </header>
      <div className="ppo-grid">
        <Cell icon={<FiUser />} label="Full name" value={p.fullName} />
        <Cell icon={<FiGlobe />} label="Organization" value={o.orgName} />
        <Cell icon={<FiBriefcase />} label="Role" value={o.businessRole} />
        <Cell icon={<FiLayers />} label="Primary industry" value={bp.primaryIndustry} />
        <Cell icon={<FiLayers />} label="Business model" value={bp.businessModel} />
        <Cell icon={<FiTag />} label="Company size" value={bp.companySize} />
        <Cell icon={<FiMapPin />} label="Country" value={p.country} />
        <Cell icon={<FiMapPin />} label="City" value={p.city} />
      </div>
    </section>
  );
}
