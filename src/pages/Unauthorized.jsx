import React from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { FiLock, FiChevronLeft, FiHome, FiLogIn } from "react-icons/fi";
import "./unauthorized.css";

export default function Unauthorized() {
  const navigate = useNavigate();
  const { state } = useLocation();

  return (
    <main className="unauth">
      <section className="unauth-card">
        <div className="unauth-icon"><FiLock /></div>
        <h1 className="unauth-title">Access denied</h1>
        <p className="unauth-text">
          You don’t have permission to view this page.
          {state?.from?.pathname ? (
            <> <br/>Requested: <code>{state.from.pathname}</code></>
          ) : null}
        </p>

        <div className="unauth-actions">
          <button className="btn -ghost" onClick={() => navigate(-1)}>
            <FiChevronLeft /> Go Back
          </button>
          <Link className="btn" to="/"><FiHome /> Home</Link>
          <Link className="btn -ok" to="/login"><FiLogIn /> Log in</Link>
        </div>
      </section>
    </main>
  );
}
