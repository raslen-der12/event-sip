import React from "react";
import PropTypes from "prop-types";
import { FiX, FiUserPlus, FiMessageSquare } from "react-icons/fi";
z
export default function ExhibitorModal({ open, item, onClose, isLoggedIn, onBook, onMessage }) {
  if (!open) return null;
  const { orgName, logo, offering, industry, openToMeet } = item || {};
  return (
    <div className="exb-modal" role="dialog" aria-modal="true" aria-label="Exhibitor details">
      <div className="exb-backdrop" onClick={onClose} />
      <div className="exb-dialog">
        <header className="exb-m-head">
          <h3 className="exb-m-title">{orgName || "Exhibitor"}</h3>
          <button className="exb-m-x" onClick={onClose} aria-label="Close">
            <FiX />
          </button>
        </header>
        <div className="exb-m-body">
          <div className="exb-m-media">
            <img src={logo || "https://dummyimage.com/480x240/ffffff/000000&text=LOGO"} alt={orgName || "Logo"} />
            <div className={`exb-m-corner ${openToMeet ? "on" : "off"}`}>
              {openToMeet ? "Open" : "Busy"}
            </div>
          </div>
          <div className="exb-m-copy">
            {industry ? <div className="exb-pill">{industry}</div> : null}
            {offering ? <p className="exb-m-desc">{offering}</p> : null}
          </div>
        </div>
        <footer className="exb-m-actions">
          {isLoggedIn ? (
            <>
              <button className="exb-btn exb-primary" onClick={onBook}>
                <FiUserPlus /> Book meeting
              </button>
              <button className="exb-btn" onClick={onMessage}>
                <FiMessageSquare /> Message
              </button>
            </>
          ) : (
            <span className="exb-m-hint">Sign in to book meetings or send messages.</span>
          )}
        </footer>
      </div>
    </div>
  );
}

ExhibitorModal.propTypes = {
  open: PropTypes.bool,
  item: PropTypes.object,
  onClose: PropTypes.func,
  isLoggedIn: PropTypes.bool,
  onBook: PropTypes.func,
  onMessage: PropTypes.func,
};
