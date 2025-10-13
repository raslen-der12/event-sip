import React, { useMemo } from "react";
import PropTypes from "prop-types";
import {
  FiFileText,
  FiTarget,
  FiGlobe,
  FiUsers,
  FiLayers,
  FiTrendingUp,
  FiCheckCircle,
  FiUser,
  FiBriefcase,
  FiMapPin,
  FiLink,
} from "react-icons/fi";
import ReactCountryFlag from "react-country-flag";
import "./pp-deepdive.css";

/**
 * Public Profile – Deep Dive (READ-ONLY)
 * - Role aware (speaker / exhibitor / attendee)
 * - Softer typography
 * - Country shows real flag (react-country-flag) when we can infer alpha-2
 * - Attendee: NO "Business Profile" and NO "Matching Aids"
 * - Organization block hidden if actor.actorType ∈ {student, expert}
 * - Layout: 2×2 (non-student/expert), 1×3 (student/expert)
 */

export default function PPDeepDivePanel({ role = "", actor = {} }) {
  const r = (role || "").toLowerCase();
  if (r === "speaker") return <SpeakerBlocks a={actor} />;
  if (r === "exhibitor") return <ExhibitorBlocks a={actor} />;
  return <AttendeeBlocks a={actor} />;
}

PPDeepDivePanel.propTypes = {
  role: PropTypes.string,
  actor: PropTypes.object,
};

/* -------------------------------- primitives -------------------------------- */

function Section({ title, icon, children, aside }) {
  return (
    <section className="ppd-card">
      <header className="ppd-head">
        <div className="ppd-title">
          <span className="ppd-ico">{icon}</span>
          <h3>{title}</h3>
        </div>
        {aside ? <div className="ppd-aside">{aside}</div> : null}
      </header>
      <div className="ppd-body">{children}</div>
    </section>
  );
}

function KV({ k, v }) {
  if (v === undefined || v === null || v === "") return null;
  return (
    <div className="ppd-kv">
      <span className="ppd-k">{k}</span>
      <span className="ppd-v">{renderValue(v)}</span>
    </div>
  );
}

function Chips({ label, items }) {
  const arr = Array.isArray(items) ? items.filter(Boolean) : [];
  if (!arr.length) return null;
  return (
    <div className="ppd-chips">
      {label ? <span className="ppd-chips-label">{label}</span> : null}
      <div className="ppd-chip-row">
        {arr.map((x, i) => (
          <span key={`${x}-${i}`} className="ppd-chip">
            {x}
          </span>
        ))}
      </div>
    </div>
  );
}

function Paragraph({ label, text }) {
  if (!text) return null;
  return (
    <div className="ppd-par">
      {label ? <div className="ppd-par-label">{label}</div> : null}
      <p className="ppd-par-text">{text}</p>
    </div>
  );
}

function BoolBadge({ on, labelOn = "Yes", labelOff = "No" }) {
  return (
    <span className={`ppd-badge ${on ? "-on" : "-off"}`}>
      <FiCheckCircle />
      {on ? labelOn : labelOff}
    </span>
  );
}

/* value renderer: linkify if looks like URL */
function renderValue(v) {
  if (Array.isArray(v)) return v.filter(Boolean).join(", ");
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (typeof v === "string" && looksLikeUrl(v)) {
    const href = normalizeUrl(v);
    return (
      <a className="ppd-link" href={href} target="_blank" rel="noreferrer" title={v}>
        <FiLink />
        <span>{prettyUrl(v)}</span>
      </a>
    );
  }
  return String(v);
}

function looksLikeUrl(s = "") {
  return /^(https?:\/\/|www\.)/i.test(String(s).trim());
}
function normalizeUrl(u = "") {
  const t = String(u || "").trim();
  if (!t) return "";
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t}`;
}
function prettyUrl(u = "") {
  try {
    const x = new URL(normalizeUrl(u));
    return `${x.hostname}${x.pathname.replace(/\/$/, "")}`;
  } catch {
    return u;
  }
}

/* country helpers */
function pickCountryCode(codeOrName = "") {
  const t = String(codeOrName || "").trim();
  if (!t) return "";
  if (/^[A-Za-z]{2}$/.test(t)) return t.toUpperCase();
  const byName = {
    tunisia: "TN",
    france: "FR",
    unitedstates: "US",
    usa: "US",
    uk: "GB",
    unitedkingdom: "GB",
    germany: "DE",
    italy: "IT",
    spain: "ES",
    canada: "CA",
    morocco: "MA",
    algeria: "DZ",
    egypt: "EG",
    "saudi arabia": "SA",
    uae: "AE",
    "united arab emirates": "AE",
  };
  const key = t.toLowerCase().replace(/\s+/g, " ");
  return byName[key] || "";
}

/* ------------------------------- SPEAKER --------------------------------- */

function SpeakerBlocks({ a = {} }) {
  const talk = a?.talk || {};
  const org = a?.organization || {};
  const intent = a?.b2bIntent || {};
  const enrich = a?.enrichments || {};
  const pers = a?.personal || {};
  const countryName = pers.country || "";
  const countryCode = pickCountryCode(pers.countryCode || countryName);
  const city = pers.city || "";

  // grid: speakers keep 2x2
  return (
    <div className="ppd-grid ppd-grid-two">
      <Section title="Talk" icon={<FiFileText />}>
        <KV k="Title" v={talk.title} />
        <KV k="Topic" v={talk.topicCategory} />
        <KV k="Target audience" v={talk.targetAudience} />
        <KV k="Language" v={talk.language} />
        <KV k="Consent to recording" v={talk.consentRecording} />
        <Paragraph label="Abstract" text={talk.abstract} />
      </Section>

      <Section title="About" icon={<FiUser />}>
        <KV k="Full name" v={pers.fullName} />
        <KV k="Organization" v={org.orgName} />
        <KV k="Job title" v={org.jobTitle || org.businessRole} />
        <KV k="Website" v={org.orgWebsite} />
        {(city || countryName) ? (
          <div className="ppd-kv">
            <span className="ppd-k">Location</span>
            <span className="ppd-v ">
              <span className="ppd-inline">
                <FiMapPin />
                <span>{[city].filter(Boolean).join(", ")} </span>
              </span>
              {countryCode ? (
                <span className="ppd-flag">
                  <ReactCountryFlag
                    svg
                    countryCode={countryCode}
                    aria-label={countryName || countryCode}
                  />
                </span>
              ) : null}
            </span>
          </div>
        ) : null}
      </Section>

      <Section
        title="B2B & Meetings"
        icon={<FiUsers />}
        aside={<BoolBadge on={!!intent.openMeetings} labelOn="Open to meetings" labelOff="Not open" />}
      >
        <KV k="Representing a company" v={intent.representingBiz} />
        <KV k="Business sector" v={intent.businessSector} />
        <Paragraph label="Offering" text={intent.offering} />
        <Paragraph label="Looking for" text={intent.lookingFor} />
        <Chips label="Regions" items={intent.regionsInterest} />
        <KV k="Seeking investment" v={intent.investmentSeeking} />
        {intent.investmentSeeking ? <KV k="Investment range" v={intent.investmentRange} /> : null}
      </Section>

      <Section title="Resources & Links" icon={<FiLayers />}>
        <KV k="Slides" v={enrich.slidesFile} />
        <Chips label="Social links" items={enrich.socialLinks} />
      </Section>
    </div>
  );
}

/* ------------------------------ EXHIBITOR -------------------------------- */

function ExhibitorBlocks({ a = {} }) {
  const biz = a?.business || {};
  const com = a?.commercial || {};
  const val = a?.valueAdds || {};
  const idt = a?.identity || {};
  const countryName = idt.country || "";
  const countryCode = pickCountryCode(idt.countryCode || countryName);
  const city = idt.city || "";

  // exhibitors stay 2x2
  return (
    <div className="ppd-grid ppd-grid-two">
      <Section title="Company" icon={<FiGlobe />}>
        <KV k="Organization" v={idt.orgName} />
        <KV k="Exhibitor name" v={idt.exhibitorName} />
        <KV k="Website" v={idt.orgWebsite} />
        {(city || countryName) ? (
          <div className="ppd-kv">
            <span className="ppd-k">Location</span>
            <span className="ppd-v ppd-inline">
              <span className="ppd-inline">
                <FiMapPin />
                <span>{[city].filter(Boolean).join(", ")} </span>
              </span>
              {countryCode ? (
                <span className="ppd-flag">
                  <ReactCountryFlag
                    svg
                    countryCode={countryCode}
                    aria-label={countryName || countryCode}
                  />
                </span>
              ) : null}
            </span>
          </div>
        ) : null}
      </Section>

      <Section title="Business & Market" icon={<FiTrendingUp />}>
        <KV k="Industry" v={biz.industry} />
        <KV k="Sub-industry" v={biz.subIndustry} />
        <KV k="Business model" v={biz.businessModel} />
        <KV k="Tech level" v={biz.techLevel} />
        <Chips label="Product tags" items={biz.productTags} />
        <Chips label="Export markets" items={biz.exportMarkets} />
      </Section>

      <Section
        title="Commercial & Match"
        icon={<FiTarget />}
        aside={<BoolBadge on={!!com.availableMeetings} labelOn="Open to meetings" labelOff="Not open" />}
      >
        <Paragraph label="Offering" text={com.offering} />
        <Paragraph label="Looking for" text={com.lookingFor} />
        <KV k="Looking for partners" v={com.lookingPartners} />
        <Chips label="Partner types" items={com.partnerTypes} />
        <Chips label="Target sectors" items={com.targetSectors} />
        <Chips label="Region interest" items={com.regionInterest} />
        <Chips label="Preferred languages" items={com.preferredLanguages} />
      </Section>

      <Section title="Value Adds" icon={<FiLayers />}>
        <KV k="Innovation focus" v={val.innovationFocus} />
        <KV k="Sustainability focus" v={val.sustainabilityFocus} />
        <KV k="Seeking investment" v={val.investmentSeeking} />
        {val.investmentSeeking ? <KV k="Investment range" v={val.investmentRange} /> : null}
        <KV k="Brochure" v={val.productBrochure} />
        <KV k="Accept demo requests" v={val.acceptDemoRequests} />
      </Section>
    </div>
  );
}

/* ------------------------------- ATTENDEE -------------------------------- */

function AttendeeBlocks({ a = {} }) {
  const org = a?.organization || {};
  const mi = a?.matchingIntent || {};
  const pers = a?.personal || {};
  const actorType = (a?.actorType || "").toLowerCase();
  const hideOrg = actorType === "student" || actorType === "expert";
  const gridMode = hideOrg ? "one" : "two";

  const countryName = pers.country || "";
  const countryCode = pickCountryCode(pers.countryCode || countryName);
  const city = pers.city || "";

  return (
    <div className={`ppd-grid ppd-grid-${gridMode}`}>
      {/* About */}
      <Section title="About" icon={<FiUser />}>
        <KV k="Full name" v={pers.fullName} />
        <KV k="Email" v={pers.email} />
        {pers.linkedIn ? <KV k="LinkedIn" v={pers.linkedIn} /> : null}

        {(city || countryName) ? (
          <div className="ppd-kv">
            <span className="ppd-k">Location</span>
            <span className="ppd-v ppd-inline">
              <span className="ppd-inline">
                <FiMapPin />
                <span>{[city].filter(Boolean).join(", ")} </span> 
              </span>
              {countryCode ? (
                <span className="ppd-flag mb-1 ml-1">
                  <ReactCountryFlag
                    svg
                    countryCode={countryCode}
                    aria-label={countryName || countryCode}
                  />
                </span>
              ) : null}
            </span>
          </div>
        ) : null}
      </Section>

      {/* Organization (hidden for student / expert) */}
      {!hideOrg && (
        <Section title="Organization" icon={<FiBriefcase />}>
          <KV k="Organization" v={org.orgName} />
          <KV k="Business role" v={org.businessRole} />
          <KV k="Website" v={org.orgWebsite} />
          {/* richer but still read-only */}
        </Section>
      )}

      {/* Matchmaking Intent (kept; NO Business Profile, NO Matching Aids) */}
      <Section
        title="Matchmaking Intent"
        icon={<FiTarget />}
        aside={<BoolBadge on={!!mi.openToMeetings} labelOn="Open to meetings" labelOff="Not open" />}
      >
        <Chips label="Objectives" items={mi.objectives} />
        <Paragraph label="Offering" text={mi.offering} />
        <Paragraph label="Needs" text={mi.needs} />
        {Array.isArray(mi.availableDays) && mi.availableDays.length ? (
          <Chips
            label="Available days"
            items={mi.availableDays.map((d) => {
              try { return new Date(d).toLocaleDateString(); } catch { return String(d); }
            })}
          />
        ) : null}
      </Section>
    </div>
  );
}
