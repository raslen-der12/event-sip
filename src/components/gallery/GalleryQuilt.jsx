import React from "react";
import PropTypes from "prop-types";
import "./gallery.css";

export default function GalleryQuilt({ photos = [], onOpen }) {
  return (
    <div className="gal-grid">
      {photos.map((p, i) => (
        <figure
          key={p.id}
          className={`gal-tile ${p.size || "sm"}`}
          onClick={() => onOpen?.(i)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onOpen?.(i)}
          aria-label="Open image"
        >
          <img
            loading="lazy"
            src={p.src}
            alt={p.alt || ""}
          />
          <div className="gal-hover" />
        </figure>
      ))}
    </div>
  );
}

GalleryQuilt.propTypes = {
  photos: PropTypes.array.isRequired,
  onOpen: PropTypes.func,
};
