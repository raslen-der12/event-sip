// src/components/eventManager/EventManagerCTA.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { FiCalendar, FiUsers, FiGlobe, FiChevronRight } from "react-icons/fi";
import "./event-manager-cta.css";

/**
 * CTA for organizers: "Host your event on the platform"
 * - Uses a conference photo on the right
 * - Left side: promise + bullets + button
 * - Button sends user to /event-manager (plans + form page)
 */
export default function EventManagerCTA({
  image = "https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=1400&auto=format&fit=crop",
  title = "Host your next event on our platform.",
  subtitle = "From registrations to B2B meetings and exhibitors showcase, we give you one dashboard to run your entire event.",
  primaryText = "Start as an Event Manager",
}) {
  const nav = useNavigate();

  const onClick = () => {
    nav("/event-manager");
  };

  return (
    <section className="em-cta-sec">
      <div className="container">
        <div className="em-cta-card">
          {/* Left: copy */}
          <div className="em-cta-left">
            <p className="em-cta-kicker">For organizers</p>
            <h2 className="em-cta-title">{title}</h2>
            <p className="em-cta-sub">{subtitle}</p>

            <div className="em-cta-badges">
              <span className="em-cta-badge">
                <FiCalendar />
                Agenda, rooms & sessions
              </span>
              <span className="em-cta-badge">
                <FiUsers />
                Attendees, exhibitors & speakers
              </span>
              <span className="em-cta-badge">
                <FiGlobe />
                Hybrid, virtual or in-person
              </span>
            </div>

            <div className="em-cta-actions">
              <button
                type="button"
                className="em-cta-btn"
                onClick={onClick}
                aria-label="Open the event manager plans page"
              >
                <span>{primaryText}</span>
                <FiChevronRight />
              </button>
              <p className="em-cta-note">
                No payment now. Fill a short form, then wait for admin
                confirmation to unlock your Event Manager dashboard.
              </p>
            </div>
          </div>

          {/* Right: image / visual */}
          <div className="em-cta-right">
            <div className="em-cta-img-wrap">
              <img src={image} alt="People attending a conference" />
              <div className="em-cta-overlay-card">
                <p className="em-cta-overlay-kicker">Live example</p>
                <p className="em-cta-overlay-title">B2B meetings running</p>
                <div className="em-cta-overlay-row">
                  <span className="em-cta-dot" />
                  <span>Attendees are booking meetings in real time.</span>
                </div>
                <div className="em-cta-overlay-row em-cta-overlay-row--meta">
                  <span>+120 meetings today</span>
                  <span>95% slots filled</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
