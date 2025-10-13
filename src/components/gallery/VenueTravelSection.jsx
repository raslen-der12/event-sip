import React from "react";
import PropTypes from "prop-types";
import VenueCard from "./Lightbox";
import TravelModes from "./GalleryQuilt";
import HotelCard from "./GallerySection";
import "./venue.css";

export default function VenueTravelSection({ heading, subheading, venue, travel = [], hotels = [] }) {
  return (
    <section className="venue">
      <div className="container">
        <header className="vn-head">
          <h2 className="vn-title">{heading}</h2>
          {subheading ? <p className="vn-sub">{subheading}</p> : null}
        </header>

        <VenueCard {...venue} />

        {travel?.length ? <TravelModes items={travel} /> : null}

        {hotels?.length ? (
          <div className="vn-hotels">
            {hotels.map(h => <HotelCard key={h.id} {...h} />)}
          </div>
        ) : null}
      </div>
    </section>
  );
}

VenueTravelSection.propTypes = {
  heading: PropTypes.string.isRequired,
  subheading: PropTypes.string,
  venue: PropTypes.shape({
    name: PropTypes.string.isRequired,
    address: PropTypes.string.isRequired,
    city: PropTypes.string,
    date: PropTypes.string,
    time: PropTypes.string,
    mapImg: PropTypes.string,  // optional static map/thumb
    href: PropTypes.string,    // optional "Open map" link
  }).isRequired,
  travel: PropTypes.arrayOf(PropTypes.object),
  hotels: PropTypes.arrayOf(PropTypes.object),
};
