import React from "react";
import PropTypes from "prop-types";
import LaneColumn from "./LaneColumn";
import "./lanes.css";

export default function ProgramLanes({ heading, subheading, lanes = [] }) {
  return (
    <section className="lanes">
      <div className="container">
        <header className="ln-head">
          <h2 className="ln-title">{heading}</h2>
          {subheading ? <p className="ln-sub">{subheading}</p> : null}
        </header>

        <div className="ln-grid">
          {lanes.map((lane) => (
            <LaneColumn key={lane.id} {...lane} />
          ))}
        </div>
      </div>
    </section>
  );
}

ProgramLanes.propTypes = {
  heading: PropTypes.string.isRequired,
  subheading: PropTypes.string,
  lanes: PropTypes.arrayOf(PropTypes.object).isRequired,
};
