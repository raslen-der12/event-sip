import React from "react";
import PropTypes from "prop-types";
import "./action-ribbon.css";

export default function ActionRibbon({
  heading = "Take part in IPDAYS X GITS 2025",
  subheading = "Join the movement of innovators and entrepreneurs building a Tunisia open to the world.",
  actions = [
    { label: "Register now", color: "orange", href: "/register" },
    { label: "Become a partner", color: "teal", href: "/partner" },
    { label: "Become an exhibitor", color: "blue", href: "/exhibitor" },
  ],
}) {
  return (
    <section className="ar-wrap">
      <div className="container">
        <header className="ar-head">
          <h2 className="ar-title">{heading}</h2>
          {subheading ? <p className="ar-sub">{subheading}</p> : null}
        </header>

        <div className="ar-btns">
          {actions.map((a, i) => (
            <a
              key={i}
              href={a.href}
              className={`ar-btn ar-${a.color}`}
            >
              {a.label}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

ActionRibbon.propTypes = {
  heading: PropTypes.string,
  subheading: PropTypes.string,
  actions: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      color: PropTypes.oneOf(["orange", "teal", "blue"]).isRequired,
      href: PropTypes.string.isRequired,
    })
  ),
};
