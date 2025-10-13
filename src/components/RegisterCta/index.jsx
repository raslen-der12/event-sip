import React from "react";
import "./register-cta.css";

export default function RegisterCta({
  image = "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=1200",
  eventName = "the event",
  text = "Secure your spot and get your badge in minutes. Limited seats available.",
  ctaText = "Register",
  ctaHref,             // if provided, renders <a>; else <button>
  onClick,             // optional handler when no href
  ariaLabel = "Register for event",
}) {
  return (
    <section className="rc-sec">
      <div className="rc-card">
        <div className="rc-grid">
          {/* Square photo */}
          <figure className="rc-media">
            <img src={image} alt={`${eventName} poster`} loading="lazy" />
          </figure>

          {/* Copy */}
          <div className="rc-copy">
            <h3 className="rc-title">Register for {eventName} now</h3>
            <p className="rc-sub">{text}</p>

            {ctaHref ? (
              <a className="rc-btn" href={ctaHref} aria-label={ariaLabel}>
                {ctaText}
              </a>
            ) : (
              <button className="rc-btn" onClick={onClick} aria-label={ariaLabel}>
                {ctaText}
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
