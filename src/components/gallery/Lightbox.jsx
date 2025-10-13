import React, { useEffect } from "react";
import PropTypes from "prop-types";
import "./gallery.css";

export default function Lightbox({ photo, onClose, onNext, onPrev, index, count }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
      if (e.key === "ArrowRight") onNext?.();
      if (e.key === "ArrowLeft") onPrev?.();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [onClose, onNext, onPrev]);

  const src = photo.full || photo.src;

  return (
    <div className="gal-lightbox" role="dialog" aria-modal="true" aria-label="Image viewer" onClick={onClose}>
      <div className="gal-lightbox-inner" onClick={(e) => e.stopPropagation()}>
        <img src={src} alt={photo.alt || ""} />
        <div className="gal-lb-ui">
          <button className="gal-lb-btn" onClick={onPrev} aria-label="Previous">◀</button>
          <span className="gal-lb-count">{index + 1} / {count}</span>
          <button className="gal-lb-btn" onClick={onNext} aria-label="Next">▶</button>
        </div>
        <button className="gal-lb-close" onClick={onClose} aria-label="Close">✕</button>
      </div>
    </div>
  );
}

Lightbox.propTypes = {
  photo: PropTypes.shape({
    src: PropTypes.string.isRequired,
    full: PropTypes.string,
    alt: PropTypes.string,
  }).isRequired,
  onClose: PropTypes.func,
  onNext: PropTypes.func,
  onPrev: PropTypes.func,
  index: PropTypes.number.isRequired,
  count: PropTypes.number.isRequired,
};
