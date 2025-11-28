import React from "react";
import "./contact-us.css";

export default function ContactUs({
  image = "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=1600",
  title = "Contact Us",
  text = "Have a question or partnership idea? Our team will get back to you shortly.",
  ctaText = "Contact Us",
  ctaHref,            // if provided, renders <a>; otherwise a <button>
  onClick,            // optional click handler when no href
  ariaLabel = "Open contact form",
}) {
  return (
    <section className="cu-sec mb-0 pb-0 cu-bg">
      <div className="cu-card">
        <figure className="cu-hero">
          <img src={image} alt="" loading="lazy" />
        </figure>

        <h2 className="cu-title">{title}</h2>
        <p className="cu-sub">{text}</p>

        {ctaHref ? (
          <a className="cu-btn" href={ctaHref} aria-label={ariaLabel}>
            {ctaText}
          </a>
        ) : (
          <button className="cu-btn" onClick={onClick} aria-label={ariaLabel}>
            {ctaText}
          </button>
        )}
      </div>
    </section>
  );
}
