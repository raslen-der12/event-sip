import React from "react";
import PropTypes from "prop-types";

const colorOf = (variant) =>
  variant === "blue"  ? "var(--accent-blue)"
: variant === "teal"  ? "var(--accent-teal)"
: variant === "amber" ? "var(--accent-amber)"
: variant === "pink"  ? "var(--accent-pink)"
: /* purple */          "var(--brand-600)";

function InitialMark({ name }) {
  const t = (name || "").trim();
  const letters = t ? t.split(" ").map(x => x[0]).join("").slice(0,3).toUpperCase() : "LOGO";
  return <span className="pt-logo-initials">{letters}</span>;
}

export default function PartnerGroup({
  label,
  logos = [],
  variant = "purple",
  onSelect,                 // NEW: parent passes this to open modal
  placeholderLogo,          // NEW: shared logo fallback
}) {
  const color = colorOf(variant);

  return (
    <section className="pt-group" style={{ "--group-color": color }}>
      <div className="pt-group-head">
        <span className="pt-chip" aria-hidden="true" />
        <h3 className="pt-group-title">{label}</h3>
      </div>

      <div className="pt-wall">
        {logos.map((l) => {
          const imgSrc = l.img || placeholderLogo || null;

          const cellInner = (
            <>
              {imgSrc
                ? <img src={imgSrc} alt={l.name} />
                : <InitialMark name={l.name} />}
            </>
          );

          // Click opens modal; keyboard accessible (Enter/Space)
          return (
            <div
              key={l.id}
              className="pt-logo"
              role="button"
              tabIndex={0}
              onClick={() => onSelect && onSelect(l)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect && onSelect(l);
                }
              }}
              aria-label={`Open details for ${l.name}`}
            >
              {cellInner}
            </div>
          );
        })}
      </div>
    </section>
  );
}

PartnerGroup.propTypes = {
  label: PropTypes.string.isRequired,
  variant: PropTypes.oneOf(["purple","blue","teal","amber","pink"]),
  logos: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      img: PropTypes.string,
      href: PropTypes.string,
    })
  ),
  onSelect: PropTypes.func,
  placeholderLogo: PropTypes.string,
};
