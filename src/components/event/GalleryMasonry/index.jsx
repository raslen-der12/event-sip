import React, { useMemo, useMemo as _m, useState, useRef, useEffect } from "react";
import PropTypes from "prop-types";
import "./gallery-masonry.css";
import {
  FiGrid,
  FiImage,
  FiVideo,
  FiFileText,
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiExternalLink,
} from "react-icons/fi";

/**
 * Event Gallery — Masonry + Lightbox
 * Works with model: eventGallery { file, title, type: 'image'|'video'|'pdf' }
 *
 * Props:
 *  - heading?: string
 *  - subheading?: string
 *  - items?: Array<{ _id?, file, title?, type? }>
 *
 * UX:
 *  - Mobile: 2-column masonry; Desktop: 3-4 columns via CSS columns
 *  - Filter chips: All | Images | Videos | PDFs
 *  - Click opens lightbox overlay (keyboard arrows + ESC)
 *  - If props missing, shows safe fallback demos
 */
    const base = process.env.REACT_APP_API_URL || 'https://api.eventra.cloud'

const FALLBACK = [
  {
    _id: "g1",
    file:
      `https://gits.seketak-eg.com/wp-content/uploads/2025/10/kh_occ_D1_478.png`,
    title: "Keynote crowd",
    type: "image",
  },
  {
    _id: "g2",
    file:
      `https://gits.seketak-eg.com/wp-content/uploads/2025/10/kh_occ_D1_772.png`,
    title: "Live demo",
    type: "image",
  },
  {
    _id: "g3",
    file:
      `https://gits.seketak-eg.com/wp-content/uploads/2025/10/kh_occ_D2_551.png`,
    title: "Panel talk",
    type: "image",
  },
  {
    _id: "g4",
    file:
      `https://gits.seketak-eg.com/wp-content/uploads/2025/10/kh_occ_D2_598.png`,
    title: "Expo floor",
    type: "image",
  },
    {
    _id: "g7",
    file:
      `https://gits.seketak-eg.com/wp-content/uploads/2025/10/sans-titre-22.png`,
    title: "Expo floor",
    type: "image",
  },
    {
    _id: "g8",
    file:
      `https://gits.seketak-eg.com/wp-content/uploads/2025/10/sans-titre-132.png`,
    title: "Expo floor",
    type: "image",
  },
  {
    _id: "g5",
    file:
      `${base}/uploads/images/admin/teaserIPDAYS.mp4`,
    title: "Teaser clip",
    type: "video",
  }

];

const FILTERS = [
  { id: "all", label: "All", icon: <FiGrid /> },
  { id: "image", label: "Images", icon: <FiImage /> },
  { id: "video", label: "Videos", icon: <FiVideo /> },
  { id: "pdf", label: "PDFs", icon: <FiFileText /> },
];

export default function GalleryMasonry({
  heading = "Event Gallery",
  subheading = "Photos, videos, and files from this edition.",
  items,
}) {
  const data = useMemo(() => (items && items.length ? items : FALLBACK), [items]);
  const [filter, setFilter] = useState("all");
  const filtered = useMemo(
    () =>
      filter === "all" ? data : data.filter((x) => (x.type || "image") === filter),
    [data, filter]
  );

  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);
  const lightboxRef = useRef(null);

  const openAt = (i) => {
    setIdx(i);
    setOpen(true);
  };
  const close = () => setOpen(false);
  const prev = () => setIdx((i) => (i - 1 + filtered.length) % filtered.length);
  const next = () => setIdx((i) => (i + 1) % filtered.length);

  // keyboard controls
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, filtered.length]);

  // prevent background scroll when open
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  return (
    <section className="gx-wrap">
      <div className="container">
        <header className="gx-head">
          <div className="gx-titles">
            <h2 className="gx-title">{heading}</h2>
            {subheading ? <p className="gx-sub">{subheading}</p> : null}
          </div>
          <div className="gx-filters" role="tablist" aria-label="Media filter">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                className={`gx-chip ${filter === f.id ? "is-active" : ""}`}
                onClick={() => setFilter(f.id)}
                role="tab"
                aria-selected={filter === f.id}
                type="button"
              >
                <span className="gx-ico">{f.icon}</span>
                {f.label}
              </button>
            ))}
          </div>
        </header>

        {/* Masonry — CSS columns for simple, fast layout */}
        {filtered.length ? (
          <div className="gx-masonry">
            {filtered.map((m, i) => {
              const t = (m.type || "image").toLowerCase();
              const key = m._id || `${t}-${i}`;
              const isImg = t === "image";
              const isVid = t === "video";
              const isPdf = t === "pdf";

              return (
                <figure
                  key={key}
                  className={`gx-item ${t}`}
                  onClick={() => openAt(i)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => (e.key === "Enter" ? openAt(i) : null)}
                >
                  <div className="gx-frame">
                    {isImg ? (
                      <img
                        src={m.file}
                        alt={m.title || "Gallery image"}
                        loading="lazy"
                        onLoad={(e) => e.currentTarget.classList.add("is-loaded")}
                      />
                    ) : isVid ? (
                      <div className="gx-video-thumb">
                        <video src={m.file} muted preload="metadata" />
                        <div className="gx-badge">Video</div>
                      </div>
                    ) : (
                      <div className="gx-pdf-thumb">
                        <FiFileText className="gx-pdf-ico" />
                        <div className="gx-badge">PDF</div>
                      </div>
                    )}
                    <div className="gx-hover">
                      <div className="gx-hover-grad" />
                      <div className="gx-caption">
                        <div className="gx-cap-title">{m.title || "Untitled"}</div>
                        <div className="gx-cap-type">{t.toUpperCase()}</div>
                      </div>
                    </div>
                  </div>
                </figure>
              );
            })}
          </div>
        ) : (
          <div className="gx-empty">No media yet.</div>
        )}
      </div>

      {/* Lightbox */}
      {open && filtered[idx] ? (
        <div className="gx-lightbox" ref={lightboxRef} onClick={close}>
          <div className="gx-lightbox-backdrop" />
          <div
            className="gx-lightbox-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <button className="gx-close" onClick={close} title="Close" type="button">
              <FiX />
            </button>
            <button className="gx-nav gx-prev" onClick={prev} title="Previous" type="button">
              <FiChevronLeft />
            </button>
            <button className="gx-nav gx-next" onClick={next} title="Next" type="button">
              <FiChevronRight />
            </button>

            {(() => {
              const cur = filtered[idx];
              const t = (cur.type || "image").toLowerCase();
              if (t === "image")
                return <img className="gx-view" src={cur.file} alt={cur.title || ""} />;
              if (t === "video")
                return (
                  <video className="gx-view" src={cur.file} controls autoPlay />
                );
              return (
                <div className="gx-pdf-view">
                  <iframe title={cur.title || "PDF"} src={cur.file} />
                  <a className="gx-open" href={cur.file} target="_blank" rel="noreferrer">
                    <FiExternalLink />
                    Open PDF
                  </a>
                </div>
              );
            })()}

            {filtered[idx]?.title ? (
              <div className="gx-lb-caption">{filtered[idx].title}</div>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}

GalleryMasonry.propTypes = {
  heading: PropTypes.string,
  subheading: PropTypes.string,
  items: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string,
      file: PropTypes.string.isRequired,
      title: PropTypes.string,
      type: PropTypes.oneOf(["image", "video", "pdf"]),
    })
  ),
};
