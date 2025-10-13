import React, { useMemo, useState } from "react";
import PropTypes from "prop-types";
import {
  FiMic,
  FiFileText,
  FiTag,
  FiUsers,
  FiGlobe,
  FiShield
} from "react-icons/fi";
import "./talk.css";

/**
 * Public Profile – Talk panel (READ-ONLY)
 * Role-aware: expects a Speaker actor, but won’t explode if used elsewhere.
 *
 * Props:
 *  - actor?: full actor object (speaker). If present, read from actor.talk / b2bIntent / enrichments
 *  - talk?:  override talk object ({ title, abstract, topicCategory, targetAudience, language, consentRecording })
 *  - enrich?: optional override for enrichments ({ slidesFile })
 *  - className?: extra class
 */
export default function TalkPanel({ actor = {}, talk, enrich, className = "" }) {
  const t = talk || actor?.talk || {};
  const e = enrich || actor?.enrichments || {};
  const b2b = actor?.b2bIntent || {};

  const info = useMemo(() => {
    return {
      title: t?.title || "",
      abstract: t?.abstract || "",
      topic: t?.topicCategory || "",
      audience: t?.targetAudience || "",
      language: t?.language || "",
      consent: typeof t?.consentRecording === "boolean" ? t.consentRecording : null,
      slides: e?.slidesFile || "",
      openToMeet: typeof b2b?.openMeetings === "boolean" ? b2b.openMeetings : null,
    };
  }, [t, e, b2b]);

  const [expanded, setExpanded] = useState(false);
  const hasAny =
    info.title || info.abstract || info.topic || info.audience || info.language || info.slides || info.consent !== null;

  if (!hasAny) {
    return (
      <section className={`ppt-card ${className}`}>
        <header className="ppt-head">
          <div className="ppt-title">
            <span className="ppt-ico"><FiMic /></span>
            <h3>Talk</h3>
          </div>
        </header>
        <div className="ppt-body">
          <div className="ppt-empty">No talk details provided.</div>
        </div>
      </section>
    );
  }

  return (
    <section className={`ppt-card ${className}`}>
      <header className="ppt-head">
        <div className="ppt-title">
          <span className="ppt-ico"><FiMic /></span>
          <h3>Talk</h3>
        </div>

        {/* Status chips (recording consent / open to meet if present) */}
        <div className="ppt-aside">
          {info.consent !== null ? (
            <span className={`ppt-badge ${info.consent ? "-on" : "-off"}`}>
              <FiShield />
              {info.consent ? "Recording consented" : "No recording consent"}
            </span>
          ) : null}

          {info.openToMeet !== null ? (
            <span className={`ppt-badge ${info.openToMeet ? "-on" : "-off"}`}>
              {info.openToMeet ? "Open to meetings" : "Not open"}
            </span>
          ) : null}
        </div>
      </header>

      <div className="ppt-body">
        {/* Title row */}
        {info.title ? (
          <div className="ppt-row -tight">
            <span className="ppt-k"><FiFileText /> Title</span>
            <span className="ppt-v">{info.title}</span>
          </div>
        ) : null}

        {/* Meta chips */}
        <div className="ppt-chipset">
          {info.topic ? (
            <span className="ppt-chip">
              <FiTag />
              {info.topic}
            </span>
          ) : null}
          {info.audience ? (
            <span className="ppt-chip">
              <FiUsers />
              {info.audience}
            </span>
          ) : null}
          {info.language ? (
            <span className="ppt-chip">
              <FiGlobe />
              {info.language}
            </span>
          ) : null}
        </div>

        {/* Abstract (collapsible, safe for long text) */}
        {info.abstract ? (
          <div className={`ppt-abstract ${expanded ? "is-open" : "is-closed"}`}>
            <div className="ppt-abstract-label">Abstract</div>
            <p className="ppt-abstract-text">{info.abstract}</p>
            {!expanded ? <span className="ppt-abstract-fade" aria-hidden="true" /> : null}
            <button
              type="button"
              className="ppt-abstract-toggle"
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
            >
              {expanded ? "Show less" : "Show more"}
            </button>
          </div>
        ) : null}

        {/* Resources */}
        {info.slides ? (
          <div className="ppt-links">
            <a className="ppt-link" href={info.slides} target="_blank" rel="noreferrer">
              <span className="ppt-ico small"><FiFileText /></span>
              <span className="ppt-link-txt">View slides</span>
            </a>
          </div>
        ) : null}
      </div>
    </section>
  );
}

TalkPanel.propTypes = {
  actor: PropTypes.object,
  talk: PropTypes.object,
  enrich: PropTypes.object,
  className: PropTypes.string,
};
