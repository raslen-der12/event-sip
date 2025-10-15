import React from "react";
import PropTypes from "prop-types";
import EventCard from "./EventCard";
import "./events.css";

export default function EventsListSection({ heading, subheading, events = [] }) {
  console.log(events);
  return (
    <section className="eventslist">
      <div className="container">
        <header className="ev-head">
          <h2 className="ev-title">{heading}</h2>
          {subheading ? <p className="ev-sub">{subheading}</p> : null}
        </header>

        <div className="ev-grid">
          {events?.map((e) => <EventCard key={e.id} {...e} />)}
        </div>

        {events.length === 0 && <div className="ev-empty">No events available.</div>}
      </div>
    </section>
  );
}

EventsListSection.propTypes = {
  heading: PropTypes.string.isRequired,
  subheading: PropTypes.string,
  events: PropTypes.arrayOf(PropTypes.object).isRequired,
};
