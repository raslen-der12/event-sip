import React from "react";
import PropTypes from "prop-types";
import PartnerGroup from "./PartnerGroup";
import "./partners.css";

const PLACEHOLDER_LOGO =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
<svg xmlns='http://www.w3.org/2000/svg' width='220' height='90' viewBox='0 0 220 90'>
  <defs>
    <linearGradient id='g' x1='0' x2='1' y1='0' y2='1'>
      <stop offset='0' stop-color='#6f42c1'/>
      <stop offset='1' stop-color='#3b82f6'/>
    </linearGradient>
  </defs>
  <rect width='100%' height='100%' rx='12' fill='white' />
  <rect x='6' y='6' width='208' height='78' rx='10' fill='url(#g)' opacity='0.12'/>
  <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle'
        font-family='Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial'
        font-weight='800' font-size='24' fill='#3b2a7a'>LOGO</text>
</svg>`);

export default function PartnersSimple({ heading, subheading, groups = [] }) {
  const [open, setOpen] = React.useState(false);
  const [selected, setSelected] = React.useState(null);

  // Lock body scroll when modal open
  React.useEffect(() => {
    const prev = document.body.style.overflow;
    if (open) document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  const handleSelect = (logo) => {
    setSelected(logo);
    setOpen(true);
  };

  const close = () => {
    setOpen(false);
    setSelected(null);
  };

  return (
    <section className="partners">
      <div className="container">
        <header className="pt-head">
          <h2 className="pt-title">{heading}</h2>
          {subheading ? <p className="pt-sub">{subheading}</p> : null}
        </header>

        <div className="pt-groups">
          {groups.map((g) => (
            <PartnerGroup
              key={g.id}
              {...g}
              onSelect={handleSelect}
              placeholderLogo={PLACEHOLDER_LOGO}
            />
          ))}
        </div>
      </div>

      {/* Modal */}
      {open && (
        <div className="pt-modal-overlay" role="dialog" aria-modal="true" onClick={close}>
          <div
            className="pt-modal"
            onClick={(e) => e.stopPropagation()}
            role="document"
          >
            <button className="pt-modal-close" onClick={close} aria-label="Close">×</button>
            <div className="pt-modal-body">
              <div className="pt-modal-logo">
                <img src={selected?.img || PLACEHOLDER_LOGO} alt="" />
              </div>
              <h4 className="pt-modal-title">{selected?.name || "Partner"}</h4>
              <p className="pt-modal-text">
                Thanks for partnering with us. This is a short info popup (just a little text).
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

PartnersSimple.propTypes = {
  heading: PropTypes.string.isRequired,
  subheading: PropTypes.string,
  groups: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
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
    })
  ).isRequired,
};
