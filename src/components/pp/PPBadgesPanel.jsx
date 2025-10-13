import React, { useMemo } from "react";
import PropTypes from "prop-types";
import {
  FiCheckCircle,
  FiShield,
  FiSlash,
  FiTag,
  FiGlobe,
  FiUserCheck,
} from "react-icons/fi";
import "./pp-badges.css";

/**
 * Public Profile – Highlights & Badges (READ-ONLY)
 * - Modernized card design to match other new components
 * - Stronger shadows, gradient frame accents
 * - Long text safe (wraps inside pills)
 * - Role-aware + safe fallbacks
 */
export default function PPBadgesPanel({ role, actor, isLoading }) {
  const a = actor || {};
  const r = (role || "").toLowerCase();

  /* --- security flags --- */
  const security = useMemo(() => {
    const verified = !!a?.verified;
    const hasAdminVerified = typeof a?.adminVerified === "boolean";
    const adminVerified = !!a?.adminVerified;

    const open =
      r === "speaker"
        ? !!a?.b2bIntent?.openMeetings
        : r === "exhibitor"
        ? !!a?.commercial?.availableMeetings
        : r === "attendee" || r === "attendee"
        ? !!a?.matchingIntent?.openToMeetings
        : false;

    return { verified, hasAdminVerified, adminVerified, open };
  }, [a, r]);

  /* --- role tags --- */
  const tags = useMemo(() => {
    const uniq = (arr) =>
      Array.from(
        new Set(
          (arr || [])
            .map((x) => (x == null ? "" : String(x)).trim())
            .filter(Boolean)
        )
      );

    const splitGuess = (s) =>
      uniq(
        (s ? String(s) : "")
          .split(/[,|/·؛;]+/g)
          .map((t) => t.trim())
          .filter(Boolean)
      ).slice(0, 12);

    if (r === "speaker") {
      const topic = a?.talk?.topicCategory ? [a.talk.topicCategory] : [];
      const lang = a?.talk?.language ? [a.talk.language] : [];
      const sector = a?.b2bIntent?.businessSector
        ? [a.b2bIntent.businessSector]
        : [];
      const look = splitGuess(a?.b2bIntent?.lookingFor);
      const regions = uniq(a?.b2bIntent?.regionsInterest || []);
      const aiTags = uniq(a?.matchMeta?.aiTags || []);
      return uniq([...topic, ...lang, ...sector, ...look, ...regions, ...aiTags]).slice(0, 24);
    }

    if (r === "exhibitor") {
      const industry = [
        a?.business?.industry,
        a?.business?.subIndustry,
      ].filter(Boolean);
      const model = a?.business?.businessModel ? [a.business.businessModel] : [];
      const tech = a?.business?.techLevel ? [a.business.techLevel] : [];
      const products = a?.business?.productTags || [];
      const exports = a?.business?.exportMarkets || [];
      const partners = a?.commercial?.partnerTypes || [];
      const targets = a?.commercial?.targetSectors || [];
      const langs = a?.commercial?.preferredLanguages || [];
      const regions = a?.commercial?.regionInterest || [];
      return uniq([
        ...industry,
        ...model,
        ...tech,
        ...products,
        ...exports,
        ...partners,
        ...targets,
        ...langs,
        ...regions,
      ]).slice(0, 28);
    }

    if (r === "attendee" || r === "attendee") {
      const ind = [
        a?.businessProfile?.primaryIndustry,
        a?.businessProfile?.subIndustry,
      ].filter(Boolean);
      const model = a?.businessProfile?.businessModel
        ? [a.businessProfile.businessModel]
        : [];
      const tagz = a?.matchingAids?.tags || [];
      const prefs = a?.matchingAids?.matchPrefs || [];
      const regions = a?.matchingAids?.regions || [];
      const lang = a?.matchingAids?.language ? [a.matchingAids.language] : [];
      const goals = a?.matchingIntent?.objectives || [];
      return uniq([...ind, ...model, ...tagz, ...prefs, ...regions, ...lang, ...goals]).slice(0, 28);
    }

    return [];
  }, [a, r]);

  return (
    <section className="ppb">
      <div className="ppb-head">
        <h2 className="ppb-title">Highlights &amp; Badges</h2>
        <span className="ppb-underline" />
      </div>

      {isLoading ? (
        <div className="ppb-grid">
          <div className="ppb-card is-skel" />
          <div className="ppb-card is-skel" />
        </div>
      ) : (
        <div className="ppb-grid">
          {/* Security / status */}
          <article className="ppb-card -status">
            <div className="ppb-card-head">
              <div className="ppb-dot" />
              <h3 className="ppb-card-title">
                <FiShield />
                <span>Security &amp; Status</span>
              </h3>
            </div>

            <div className="ppb-badges">
              {security.verified ? (
                <span className="ppb-badge -ok" title="Verified">
                  <FiCheckCircle />
                  <span className="ppb-badge-txt">Verified</span>
                </span>
              ) : (
                <span className="ppb-badge -muted" title="Not verified">
                  <FiSlash />
                  <span className="ppb-badge-txt">Not verified</span>
                </span>
              )}

              {security.hasAdminVerified ? (
                security.adminVerified ? (
                  <span className="ppb-badge -ok" title="Admin verified">
                    <FiShield />
                    <span className="ppb-badge-txt">Admin verified</span>
                  </span>
                ) : (
                  <span className="ppb-badge -muted" title="Admin pending">
                    <FiShield />
                    <span className="ppb-badge-txt">Admin pending</span>
                  </span>
                )
              ) : null}

              {(a?.b2bIntent || a?.commercial || a?.matchingIntent) ? (
                security.open ? (
                  <span className="ppb-badge -open" title="Open to meetings">
                    <FiUserCheck />
                    <span className="ppb-badge-txt">Open to meetings</span>
                  </span>
                ) : (
                  <span className="ppb-badge -closed" title="Not open to meetings">
                    <FiSlash />
                    <span className="ppb-badge-txt">Not open to meetings</span>
                  </span>
                )
              ) : null}
            </div>
          </article>

          {/* Tags */}
          <article className="ppb-card -tags">
            <div className="ppb-card-head">
              <div className="ppb-dot" />
              <h3 className="ppb-card-title">
                <FiTag />
                <span>Tags &amp; Interests</span>
              </h3>
            </div>

            {tags.length ? (
              <ul className="ppb-tags">
                {tags.map((t, i) => (
                  <li key={`${t}-${i}`} className="ppb-tag" title={t}>
                    <FiGlobe />
                    <span className="ppb-tag-txt">{t}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="ppb-empty">No tags yet.</div>
            )}
          </article>
        </div>
      )}
    </section>
  );
}

PPBadgesPanel.propTypes = {
  role: PropTypes.string,
  actor: PropTypes.object,
  isLoading: PropTypes.bool,
};
