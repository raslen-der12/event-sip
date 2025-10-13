// components/EventHeader.jsx
import React from "react";
import "./register-choice.css";
import imageLink from "../utils/imageLink";
import ReactCountryFlag from "react-country-flag";

const fmt = (iso) => {
  try { return new Date(iso).toLocaleDateString(); } catch { return ""; }
};

export default function EventHeader({ event }) {
  if (!event) return null;
  return (
    <div className="reg-event-head">
      <div className="reg-event-cover">
        <img src={imageLink(event.cover) || imageLink("/default/cover.png") } alt={event.title} />
      </div>
      <div className="reg-event-meta">
        <div className="reg-event-title">{event.title}</div>
        <div className="reg-event-sub">
          <span>{event.city}</span>
          <span>•</span>
          <span>
            <ReactCountryFlag svg countryCode={event.country} style={{ fontSize: '1.2em' }} />

          </span>
        </div>
        <div className="reg-event-dates">
          {fmt(event.startDate)} — {fmt(event.endDate)}
        </div>
        <div className="reg-event-tags">
          {(String(event.target || "").split(",").filter(Boolean)).map(t => (
            <span key={t} className="reg-badge">{t.trim()}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
