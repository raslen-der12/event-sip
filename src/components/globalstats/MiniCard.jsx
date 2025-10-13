import React from "react";
import PropTypes from "prop-types";
import "./globalstats.css";

export default function MiniCard({ img, value, label }) {
  return (
    <article className="gs-mini">
      <div className="gs-mini-media">
        <img src={img} alt="" />
      </div>
      <div className="gs-mini-body">
        <div className="gs-mini-value">{value}</div>
        <div className="gs-mini-label">{label}</div>
      </div>
    </article>
  );
}

MiniCard.propTypes = {
  img: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
};
