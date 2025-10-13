import React from "react";
import PropTypes from "prop-types";
import "./sdg.css";

function FallbackLogo({ num }) {
  return (
    <div className="sdg-fallback" aria-hidden="true">
      <span>{num}</span>
    </div>
  );
}

export default function SdgScroller({ heading, subheading, goals = [] }) {
  // duplicate for seamless loop
  const row = [
    {
      id: 1,
      href: "https://www.un.org/sustainabledevelopment/infrastructure-industrialization/",
      img: "https://www.un.org/sustainabledevelopment/wp-content/uploads/2019/08/E-Goal-09-1024x1024.png",
    },
    { id: 2, href: "https://www.un.org/sustainabledevelopment/inequality/", img: "https://www.un.org/sustainabledevelopment/wp-content/uploads/2019/08/E-Goal-10-1024x1024.png" },
    { id: 3, href: "https://www.un.org/sustainabledevelopment/sustainable-consumption-production/", img: "https://www.un.org/sustainabledevelopment/wp-content/uploads/2019/08/E-Goal-12-1024x1024.png" },
    { id: 4, href: "https://www.un.org/sustainabledevelopment/climate-change/", img: "https://www.un.org/sustainabledevelopment/wp-content/uploads/2019/08/E-Goal-13-1024x1024.png" },
    { id: 5, href: "https://www.un.org/sustainabledevelopment/globalpartnerships/", img: "https://www.un.org/sustainabledevelopment/wp-content/uploads/2019/08/E-Goal-17-1024x1024.png" },
    { id: 6, href: "https://www.un.org/sustainabledevelopment/gender-equality/", img: "	https://www.un.org/sustainabledevelopment/wp-content/uploads/2019/08/E-Goal-05-1024x1024.png" },
    { id: 7, href: "https://www.un.org/sustainabledevelopment/economic-growth/", img: "https://www.un.org/sustainabledevelopment/wp-content/uploads/2019/08/E-Goal-08-1024x1024.png" },
  ];

  return (
    <section className="sdg">
      <div className="container">
        <header className="sdg-head">
          <h2 className="sdg-title">{heading}</h2>
          {subheading ? <p className="sdg-sub">{subheading}</p> : null}
        </header>

        <div
          className="sdg-marquee"
          role="region"
          aria-label="Sustainable Development Goals"
        >
          <div className="sdg-track">
            {row.map((g, i) => (
              <div key={`${g.id}-${i}`} className="sdg-logo">
                {g.href ? (
                  <a
                    href={g.href}
                    className="sdg-link"
                    aria-label={`SDG ${g.num}`}
                  >
                    {g.img ? (
                      <img src={g.img} alt="" />
                    ) : (
                      <FallbackLogo num={g.num} />
                    )}
                  </a>
                ) : g.img ? (
                  <img src={g.img} alt="" />
                ) : (
                  <FallbackLogo num={g.num} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

SdgScroller.propTypes = {
  heading: PropTypes.string.isRequired,
  subheading: PropTypes.string,
  goals: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      num: PropTypes.number.isRequired, // 1..17
      img: PropTypes.string, // official SDG icon URL (square)
      href: PropTypes.string, // optional link
    })
  ).isRequired,
};
