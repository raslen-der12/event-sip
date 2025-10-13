import React from "react";
import PropTypes from "prop-types";
import { FiExternalLink, FiMessageSquare, FiUserPlus, FiX } from "react-icons/fi";

export default function ExhibitorCard({ item, isLoggedIn, onReadMore, onBook, onMessage }) {
  const { id, orgName, industry, logo, offering, openToMeet = false, href } = item || {};
  const img = logo || "https://dummyimage.com/320x200/ffffff/000000&text=LOGO";

  return (
    <article className="exb-card" key={id}>
      <div className="exb-frame">
        <img className="exb-logo" src={img} alt={orgName || "Logo"} loading="lazy" />
        <div className={`exb-corner ${openToMeet ? "on" : "off"}`}>
          {openToMeet ? "Open" : <FiX aria-label="Not open to meet" />}
        </div>
        <div className="exb-plate" />
      </div>

      <div className="exb-body">
        <h3 className="exb-name">{orgName || "—"}</h3>
        <div className="exb-meta">
          {industry ? <span className="exb-pill">{industry}</span> : null}
        </div>
        {offering ? <p className="exb-desc">{offering}</p> : null}

        <div className="exb-actions">
          <button className="exb-btn exb-primary" onClick={onReadMore}>
            <FiExternalLink />
            Details
          </button>
          {isLoggedIn ? (
            <>
              <button className="exb-btn" onClick={onBook}>
                <FiUserPlus />
                Book meeting
              </button>
              <button className="exb-btn" onClick={onMessage}>
                <FiMessageSquare />
                Message
              </button>
            </>
          ) : null}
          {href ? (
            <a className="exb-btn" href={href} target="_blank" rel="noreferrer">
              Visit
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}

ExhibitorCard.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.string,
    orgName: PropTypes.string,
    industry: PropTypes.string,
    logo: PropTypes.string,
    offering: PropTypes.string,
    openToMeet: PropTypes.bool,
    href: PropTypes.string,
  }),
  isLoggedIn: PropTypes.bool,
  onReadMore: PropTypes.func,
  onBook: PropTypes.func,
  onMessage: PropTypes.func,
};
