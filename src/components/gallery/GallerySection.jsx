import React, { useState, useCallback } from "react";
import PropTypes from "prop-types";
import GalleryQuilt from "./GalleryQuilt";
import Lightbox from "./Lightbox";
import "./gallery.css";

export default function GallerySection({ heading, subheading, photos = [], cta }) {
  const [active, setActive] = useState(null); // index

  const open = useCallback((idx) => setActive(idx), []);
  const close = useCallback(() => setActive(null), []);
  const next  = useCallback(() => setActive(i => (i === null ? null : (i + 1) % photos.length)), [photos.length]);
  const prev  = useCallback(() => setActive(i => (i === null ? null : (i - 1 + photos.length) % photos.length)), [photos.length]);

  return (
    <section className="gallery">
      <div className="container">
        <header className="gal-head">
          <h2 className="gal-title">{heading}</h2>
          {subheading ? <p className="gal-sub">{subheading}</p> : null}
        </header>

        <GalleryQuilt photos={photos} onOpen={open} />

        {cta?.href ? (
          <div className="gal-cta">
            <a className="btn-brand rounded-pill px-4" href={cta.href}>{cta.label || "See full album"}</a>
          </div>
        ) : null}
      </div>

      {active !== null && photos[active] && (
        <Lightbox
          photo={photos[active]}
          onClose={close}
          onNext={next}
          onPrev={prev}
          count={photos.length}
          index={active}
        />
      )}
    </section>
  );
}

GallerySection.propTypes = {
  heading: PropTypes.string.isRequired,
  subheading: PropTypes.string,
  photos: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      src: PropTypes.string.isRequired,   // thumbnail/regular
      full: PropTypes.string,             // optional full-size
      alt: PropTypes.string,
      size: PropTypes.oneOf(["sm","md","lg"]), // layout hint
    })
  ).isRequired,
  cta: PropTypes.shape({ href: PropTypes.string, label: PropTypes.string }),
};
