import React, { useState, useCallback } from "react";
import PropTypes from "prop-types";
import SpeakerCard from "./SpeakerCard";
import SpeakerModal from "./SpeakerModal";
import "./speakers.css";

export default function SpeakersSection({ heading, subheading, speakers = [] }) {
  const [active, setActive] = useState(null); // speaker object

  const open = useCallback((sp) => setActive(sp), []);
  const close = useCallback(() => setActive(null), []);

  return (
    <section className="speakers">
      <div className="container">
        <header className="spk-head">
          <h2 className="spk-title">{heading}</h2>
          {subheading ? <p className="spk-sub">{subheading}</p> : null}
        </header>

        <div className="spk-grid">
          {speakers.map((s) => (
            <SpeakerCard key={s.id} {...s} onQuick={() => open(s)} />
          ))}
        </div>
      </div>

      {active && (
        <SpeakerModal
          speaker={active}
          onClose={close}
        />
      )}
    </section>
  );
}

SpeakersSection.propTypes = {
  heading: PropTypes.string.isRequired,
  subheading: PropTypes.string,
  speakers: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    title: PropTypes.string,
    org: PropTypes.string,
    photo: PropTypes.string,       // image url
    href: PropTypes.string,        // profile link
    tags: PropTypes.arrayOf(PropTypes.string),
    variant: PropTypes.oneOf(["purple","blue","teal","amber","pink"]),
    verified: PropTypes.bool,
    sessions: PropTypes.number,    // how many talks/workshops
    bio: PropTypes.string,         // used in modal
    socials: PropTypes.arrayOf(PropTypes.shape({
      type: PropTypes.oneOf(["x","in","web"]),
      url: PropTypes.string
    }))
  })).isRequired,
};
