import React from "react";
import PropTypes from "prop-types";
import "./admin.css";

export default function AdminTopbar({ user, onBurger }) {
  return (
    <div className="adm-top">
      <button className="adm-burger" onClick={onBurger} aria-label="Open menu">
        <span />
      </button>

      <div className="adm-search">
        <input type="text" placeholder="Search…" aria-label="Search" />
      </div>

      <div className="adm-quick">
        <button className="qbtn" aria-label="Notifications">🔔</button>
        <button className="qbtn" aria-label="Help">❓</button>
        <div className="adm-user">
          {user?.avatar ? <img src={user.avatar} alt="" /> : <div className="ph" aria-hidden="true" />}
          <div className="u-meta">
            <div className="u-name">{user?.name || "Admin"}</div>
            <div className="u-role">{user?.role || "Super Admin"}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

AdminTopbar.propTypes = {
  user: PropTypes.object,
  onBurger: PropTypes.func,
};
