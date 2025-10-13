import React from "react";
import { Link } from "react-router-dom";
import "./register-choice.css";

/**
 * Props:
 *  - title, subtitle
 *  - options: [
 *      { key, heading, blurb, benefits:[], to, disabled }
 *    ]
 */
export default function RegisterChoice({
  title = "Choose your registration type",
  subtitle = "Select the role that fits you. Review the benefits before continuing.",
  options = [],
}) {
  return (
    <section className="rc-sec">
      <div className="rc-wrap">
        <header className="rc-head">
          <h1 className="rc-title">{title}</h1>
          {subtitle ? <p className="rc-sub">{subtitle}</p> : null}
        </header>

        <div className="rc-grid">
          {options.map((opt) => {
            const isDisabled = !!opt.disabled;
            const Body = (
              <>
                <div className="rc-card-head" aria-hidden="true" />
                <div className="rc-card-main">
                  <h3 className="rc-card-title">{opt.heading}</h3>
                  {opt.blurb ? <p className="rc-card-blurb">{opt.blurb}</p> : null}
                  {Array.isArray(opt.benefits) && opt.benefits.length > 0 && (
                    <ul className="rc-list">
                      {opt.benefits.map((b, i) => (
                        <li key={i} className="rc-li">{b}</li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="rc-card-foot">
                  {isDisabled ? (
                    <button className="rc-btn rc-btn-disabled" disabled>Coming soon</button>
                  ) : (
                    <span className="rc-btn">Register</span>
                  )}
                </div>
              </>
            );

            if (isDisabled) {
              return (
                <div
                  key={opt.key}
                  className="rc-card is-disabled"
                  aria-disabled="true"
                >
                  {Body}
                  <div className="rc-disabled-veil">
                    <span className="rc-disabled-text">Partner (disabled)</span>
                  </div>
                </div>
              );
            }

            return (
              <Link
                key={opt.key}
                to={opt.to}
                className="rc-card"
                aria-label={`Register as ${opt.heading}`}
              >
                {Body}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
