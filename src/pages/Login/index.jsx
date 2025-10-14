import React, { useRef, useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import "./login.css";
import { useDispatch } from "react-redux";
import "../../styles/tokens.css";
import usePersist from "../../lib/hooks/usePersist";
import "../../styles/global.css";
import { setCredentials } from "../../features/auth/authSlice";
import { useLoginMutation } from "../../features/auth/authApiSlice";

import HeaderShell from "../../components/layout/HeaderShell";
import { topbar, nav, cta } from "../main.mock";
import Footer from "../../components/footer/Footer";
import { footerData } from "../main.mock";
export default function LoginPage() {
  const userRef = useRef(null);

  const navigate = useNavigate();
  const { search } = useLocation();
  const [login, { isLoading }] = useLoginMutation();

  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [error, setError] = useState("");

  const [persist, setPersist] = usePersist();

  // ✅ run once: avoid infinite renders

  const dispatch = useDispatch();

  // focus the email field once
  useEffect(() => {
    userRef.current?.focus();
  }, []);

  // clear error when user edits fields
  useEffect(() => {
    setError("");
  }, [email, pwd]);

  const from = new URLSearchParams(search).get("from") || "/";

  const API_URL = process.env.APP_FRONTEND_URL || "https://api.eventra.cloud";

  const onGoogleLogin = () => {
    const redirect_uri = `${window.location.origin}/oauth/callback`;
    const url = `${API_URL}/auth/google?redirect_uri=${encodeURIComponent(
      redirect_uri
    )}`;
    window.location.assign(url);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const {data} = await login({
        loginInput: email,
        pwd,
      }).unwrap();
      // persist ONLY after a successful login
      setPersist(true);
      dispatch(setCredentials({ accessToken : data.accessToken, ActorId : data.actorId }));
      setEmail("");
      setPwd("");
      navigate(from, { replace: true });
    } catch (err) {
      const msg =
        err?.data?.message ||
        err?.error ||
        "Login failed. Check your email & password.";
      setError(msg);
    }
  };

  return (
    <>
      <HeaderShell top={topbar} nav={nav} cta={cta} />

      <div className="auth-wrap">
        <div className="auth-card">
          <header className="auth-head">
            <h1 className="auth-title">Welcome back</h1>
            <p className="auth-sub">Sign in to continue to GITS</p>
          </header>

          {error ? <div className="auth-alert">{error}</div> : null}

          <button
            className="btn-google"
            onClick={onGoogleLogin}
            disabled={isLoading}
          >
            <GoogleIcon />
            Continue with Google
          </button>

          <div className="auth-sep" role="separator" aria-label="or">
            <span>or</span>
          </div>

          <form onSubmit={onSubmit} noValidate>
            <div className="auth-field">
              <label htmlFor="email" className="auth-label">
                Email
              </label>
              <input
                id="email"
                ref={userRef}
                type="email"
                className="auth-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <div className="auth-field">
              <label htmlFor="pwd" className="auth-label">
                Password
              </label>
              <input
                id="pwd"
                type="password"
                className="auth-input"
                value={pwd}
                onChange={(e) => setPwd(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
            <div className="auth-field">
              <label
                className="check"
                style={{
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                  marginTop: 8,
                }}
              >
                <input
                  type="checkbox"
                  checked={persist}
                  onChange={(e) => setPersist(e.target.checked)}
                />
                <span>Trust this device</span>
              </label>
            </div>

            <div className="auth-actions">
              <button className="auth-btn" type="submit" disabled={isLoading || !email || !pwd || !persist}>
                {isLoading ? "Signing in…" : "Sign in"}
              </button>
              <Link className="link-muted" to="/forgot-password">
                Forgot password?
              </Link>
            </div>
          </form>

          <footer className="auth-foot">
            Don’t have an account?{" "}
            <Link to="/register" className="link-strong">
              Register
            </Link>
          </footer>
        </div>
      </div>

      <Footer
        brand={footerData.brand}
        columns={footerData.columns}
        socials={footerData.socials}
        actions={footerData.actions}
        bottomLinks={footerData.bottomLinks}
      />
    </>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.6 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12S17.4 12 24 12c3 0 5.7 1.1 7.8 3l5.7-5.7C34.5 6.1 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 19.7-8.9 19.7-20c0-1.3-.1-2.5-.3-3.5z"
      ></path>
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.8 16.2 19 12 24 12c3 0 5.7 1.1 7.8 3l5.7-5.7C34.5 6.1 29.5 4 24 4 16.1 4 9.3 8.5 6.3 14.7z"
      ></path>
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.2C29.2 35.3 26.8 36 24 36c-5.2 0-9.5-3.5-11-8.2l-6.6 5.1C9.3 39.5 16.1 44 24 44z"
      ></path>
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.2-4.1 5.5-7.3 5.5-5.2 0-9.5-4.2-9.5-9.5S18.8 14.5 24 14.5c2.6 0 4.9.9 6.7 2.6l5.8-5.8C33.3 7.6 28.9 6 24 6 14.6 6 7 13.6 7 23s7.6 17 17 17 17-7.6 17-17c0-1.1-.1-2.1-.4-3.1z"
      ></path>
    </svg>
  );
}
