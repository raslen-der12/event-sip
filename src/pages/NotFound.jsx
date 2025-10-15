import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FiAlertTriangle, FiChevronLeft, FiHome, FiSearch } from "react-icons/fi";
import "./notfound.css";

export default function NotFound() {
  const nav = useNavigate();
  const { pathname, search } = useLocation();
  return (
    <main className="nf">
      <section className="nf-card">
        <div className="nf-ico"><FiAlertTriangle /></div>
        <h1 className="nf-title">404 — Page not found</h1>
        <p className="nf-text">
          We couldn’t find this URL:
          <br />
          <code>{pathname}{search}</code>
        </p>
        <div className="nf-actions">
          <button className="btn -ghost text-bg-dark" onClick={() => nav(-1)}>
            <FiChevronLeft /> Go Back
          </button>
          <Link className="btn" to="/"><FiHome /> Home</Link>
          <Link className="btn -ok" to="/search"><FiSearch /> Search</Link>
        </div>
      </section>
    </main>
  );
}
