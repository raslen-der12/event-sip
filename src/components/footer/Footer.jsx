import React from "react";
import PropTypes from "prop-types";
import FooterActions from "./FooterActions";
import "./footer.css";
import imageLink from "../../utils/imageLink";

export default function Footer({
  brand,
  columns = [],
  socials = [],
  actions = [],
  bottomLinks = [],
  year = new Date().getFullYear(),
}) {
  return (
    <footer className="ft">
      <div className="container">
        {/* top: brand + socials + quick actions */}
        <div className="ft-top">
          <div className="ft-brand">
            {brand?.logoSrc ? (
                <a className="brand" href="/"><img width={130} src={ imageLink('default/LOGO GITS COLOR.png')} /></a>
            ) : (
              <div className="ft-logo ph" aria-hidden />
            )}
            <div className="ft-bcopy">
              <div className="ft-name">{brand?.name || "GITS"}</div>
              {brand?.tagline ? <p className="ft-tag">{brand.tagline}</p> : null}
              {socials?.length ? (
                <div className="ft-socials">
                  {socials.map((s) => (
                    <a key={s.type} href={s.url} className="ft-soc" aria-label={s.type} target="_blank" rel="noreferrer">
                      {iconFor(s.type)}
                    </a>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <FooterActions items={actions} />
        </div>

        {/* links columns */}
        <div className="ft-cols">
          {columns.map((col) => (
            <nav key={col.id} className="ft-col" aria-label={col.heading}>
              <h5 className="ft-hc">{col.heading}</h5>
              <ul className="ft-list">
                {col.items?.map((it) => (
                  <li key={it.label}><a href={it.href || "#"} className="ft-link">{it.label}</a></li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* bottom bar */}
        <div className="ft-bottom">
          <div className="ft-copy">© {year} {brand?.name || "GITS"}. All rights reserved.</div>
          {bottomLinks?.length ? (
            <div className="ft-bl">
              {bottomLinks.map((b) => (
                <a key={b.label} href={b.href || "#"} className="ft-blink">{b.label}</a>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </footer>
  );
}

const iconFor = (t) => {
  const common = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none" };
  switch (t) {
    case "x":   return (<svg {...common}><path d="M4 4l16 16M20 4L4 20" stroke="currentColor"/></svg>);
    case "in":  return (<svg {...common}><rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor"/><circle cx="8" cy="9" r="1.5" stroke="currentColor"/><path d="M7 17v-5h2v5H7zm5 0v-3c0-2 3-2 3 0v3h-2v-3" stroke="currentColor"/></svg>);
    case "yt":  return (<svg {...common}><path d="M22 12s0-4-1-5-5-1-9-1-8 0-9 1-1 5-1 5 0 4 1 5 5 1 9 1 8 0 9-1 1-5 1-5z" stroke="currentColor"/><path d="M10 9l6 3-6 3V9z" fill="currentColor"/></svg>);
    case "ig":  return (<svg {...common}><rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor"/><circle cx="12" cy="12" r="4" stroke="currentColor"/><circle cx="17" cy="7" r="1" fill="currentColor"/></svg>);
    default:    return (<svg {...common}><circle cx="12" cy="12" r="9" stroke="currentColor"/></svg>);
  }
};

Footer.propTypes = {
  brand: PropTypes.shape({ logoSrc: PropTypes.string, name: PropTypes.string, tagline: PropTypes.string }),
  columns: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    heading: PropTypes.string.isRequired,
    items: PropTypes.arrayOf(PropTypes.shape({ label: PropTypes.string, href: PropTypes.string }))
  })),
  socials: PropTypes.arrayOf(PropTypes.shape({ type: PropTypes.string, url: PropTypes.string })),
  actions: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.string, label: PropTypes.string, href: PropTypes.string, icon: PropTypes.string })),
  bottomLinks: PropTypes.arrayOf(PropTypes.shape({ label: PropTypes.string, href: PropTypes.string })),
  year: PropTypes.number,
};
