import React, { useRef, useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import "./login.css";
import { useDispatch } from "react-redux";
import "../../styles/tokens.css";
import usePersist from "../../lib/hooks/usePersist";
import "../../styles/global.css";
import { setCredentials } from "../../features/auth/authSlice";
import {
  useLoginMutation,
  useGoogleExchangeMutation,
  useLazyResendVerificationForVisitorQuery,
} from "../../features/auth/authApiSlice";

import HeaderShell from "../../components/layout/HeaderShell";
import { topbar, nav, cta } from "../main.mock";
import Footer from "../../components/footer/Footer";
import { footerData } from "../main.mock";

// ---- Google Identity helper -----------------------------------------

const GOOGLE_CLIENT_ID =
  process.env.REACT_APP_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || "";
let gsiScriptPromise = null;

function ensureGoogleScript() {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return Promise.reject(
      new Error("Google auth is only available in the browser.")
    );
  }

  if (window.google && window.google.accounts && window.google.accounts.id) {
    return Promise.resolve(window.google);
  }

  if (gsiScriptPromise) return gsiScriptPromise;

  gsiScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector("script[data-google-identity]");
    if (existing) {
      existing.addEventListener("load", () => resolve(window.google));
      existing.addEventListener("error", () =>
        reject(new Error("Failed to load Google script"))
      );
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.dataset.googleIdentity = "1";
    script.onload = () => resolve(window.google);
    script.onerror = () => reject(new Error("Failed to load Google script"));
    document.head.appendChild(script);
  });

  return gsiScriptPromise;
}

export default function LoginPage() {
  const userRef = useRef(null);

  const navigate = useNavigate();
  const { search } = useLocation();
  const dispatch = useDispatch();

  const [login, { isLoading }] = useLoginMutation();
  const [googleExchange] = useGoogleExchangeMutation();
  const [triggerResend, { isFetching: isResending }] =
    useLazyResendVerificationForVisitorQuery();

  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [error, setError] = useState("");
  const [errorCode, setErrorCode] = useState("");
  const [errorActorId, setErrorActorId] = useState(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const [persist, setPersist] = usePersist();

  useEffect(() => {
    userRef.current?.focus();
  }, []);

  useEffect(() => {
    setError("");
    setErrorCode("");
    setErrorActorId(null);
  }, [email, pwd]);

  const from = new URLSearchParams(search).get("from") || "/";

  const extractActorIdFromPayload = (payload) => {
    if (!payload || typeof payload !== "object") return null;
    return (
      payload.actorId ||
      payload.ActorId ||
      payload.userId ||
      payload.id ||
      payload?.user?._id ||
      payload?.user?.id ||
      null
    );
  };

  // ---- Email / password login ---------------------------------------

   const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setErrorCode("");
    setErrorActorId(null);

    // Enforce "stay logged in"
    if (!persist) {
      setError("You must keep this device signed in to continue.");
      return;
    }

    try {
      const resp = await login({ email, pwd }).unwrap();
      console.log("[login resp]", resp);

      // support both shapes:
      //  - new: { success, message, data: { accessToken, user... } }
      //  - old: { accessToken, ActorId, role }
      const httpStatus = resp?._httpStatus ?? 200;
      const envelope = resp || {};
      const payload = envelope.data || envelope;

      const accessToken =
        payload.accessToken || envelope.accessToken || null;

      const actorId = extractActorIdFromPayload(payload);

      if (!accessToken) {
        // treat as business error
        const code =
          envelope.code ||
          payload.code ||
          (httpStatus >= 400 ? "HTTP_ERROR" : "");
        const msg =
          envelope.message ||
          payload.message ||
          (httpStatus === 401 || httpStatus === 403
            ? "Login failed. Please check your email & password."
            : "Login failed. Please try again.");

        setErrorCode(code || "");
        setErrorActorId(actorId);
        setError(msg);
        return;
      }

      // Success path
      if (persist) {
        setPersist(true);
      }

      dispatch(
        setCredentials({
          accessToken,
          ActorId: actorId,
        })
      );

      setEmail("");
      setPwd("");

      navigate(from, { replace: true });
    } catch (err) {
      // HTTP errors (403, EMAIL_NOT_VERIFIED, etc.) or network
      console.log("[login catch]", err);

      const errData = err?.data || {};
      const code = errData.code || "";
      const msg =
        errData.message ||
        errData.msg ||
        err?.error ||
        err?.message ||
        "Unable to contact the server. Please try again.";
      const actorFromErr = extractActorIdFromPayload(errData);

      setErrorCode(code);
      setErrorActorId(actorFromErr);
      setError(msg);
    }
  };


  // ---- Google login (unchanged, still using backend errors) ---------

  const handleGoogleLogin = async () => {
    setError("");
    setErrorCode("");
    setErrorActorId(null);
    setIsGoogleLoading(true);

    try {
      if (!GOOGLE_CLIENT_ID) {
        throw new Error("Google login is not configured yet.");
      }

      const google = await ensureGoogleScript();
      if (!google?.accounts?.id) {
        throw new Error("Google auth is not available in this browser.");
      }

      google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        auto_select: false,
        cancel_on_tap_outside: true,
        callback: async (response) => {
          if (!response?.credential) {
            setError("Google login was cancelled. Try again.");
            setIsGoogleLoading(false);
            return;
          }

          try {
            const resp = await googleExchange({
              idToken: response.credential,
            }).unwrap();

            const payload = resp?.data || resp || {};
            const accessToken = payload.accessToken;
            const actorId = extractActorIdFromPayload(payload);

            if (!accessToken) {
              throw new Error("No access token returned from server");
            }

            // For Google, we force persist so refresh works smoothly.
            setPersist(true);

            dispatch(
              setCredentials({
                accessToken,
                ActorId: actorId,
              })
            );

            setIsGoogleLoading(false);
            navigate(from, { replace: true });
          } catch (err) {
            const errData = err?.data || {};
            const code = errData.code || "";
            const actorFromErr = extractActorIdFromPayload(errData);
            const msg =
              errData.message ||
              errData.msg ||
              err?.error ||
              err?.message ||
              "Google login failed.";

            setErrorCode(code);
            setErrorActorId(actorFromErr);
            setError(msg);
            setIsGoogleLoading(false);
          }
        },
      });

      google.accounts.id.prompt();
    } catch (err) {
      setError(
        err?.message || "Google login is not available. Please try again later."
      );
      setErrorCode("");
      setErrorActorId(null);
      setIsGoogleLoading(false);
    }
  };

    const handleResendVerification = async () => {
    setError("");
    try {
      if (errorActorId) {
        // old path: attendee / speaker / exhibitor, use actorId
        await triggerResend({ actorId: errorActorId }).unwrap();
      } else if (email) {
        // new path: platform user, use email only
        await triggerResend({ email }).unwrap();
      } else {
        setError("We need your email to resend the verification link.");
        return;
      }

      setErrorCode("");
      setErrorActorId(null);
      setError("Verification email sent. Please check your inbox.");
    } catch (err) {
      const msg =
        err?.data?.message ||
        err?.error ||
        err?.message ||
        "Could not resend verification email.";
      setError(msg);
    }
  };


  const canSubmit = !!email && !!pwd && !!persist && !isLoading;

  return (
    <>
      <HeaderShell top={topbar} nav={nav} cta={cta} />

      <div className="auth-wrap">
        <div className="auth-card">
          <header className="auth-head">
            <h1 className="auth-title">Welcome back</h1>
            <p className="auth-sub">
              Sign in to continue to Eventra and manage your events in one
              place.
            </p>
          </header>

          {error ? <div className="auth-alert">{error}</div> : null}

          {/* Google */}
          <button
            type="button"
            className={
              "btn-google" + (isGoogleLoading ? " btn-google-loading" : "")
            }
            onClick={handleGoogleLogin}
            disabled={isGoogleLoading}
          >
            <GoogleIcon />
            <span>
              {isGoogleLoading ? "Connecting to Google…" : "Continue with Google"}
            </span>
          </button>

          <div className="auth-sep">
            <span>or continue with email</span>
          </div>

          {/* Email / password */}
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
                placeholder="you@example.com"
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
                placeholder="••••••••"
              />
            </div>

            {/* Remember / toggle */}
            <div className="auth-remember-row">
              <label className="remember-toggle">
                <input
                  type="checkbox"
                  checked={persist}
                  onChange={(e) => setPersist(e.target.checked)}
                />
                <span className="remember-toggle-track">
                  <span className="remember-toggle-thumb" />
                </span>
                <span className="remember-toggle-label">
                  Keep me signed in on this device
                </span>
              </label>
            </div>

            <div className="auth-actions">
              <button className="auth-btn" type="submit" disabled={!canSubmit}>
                {isLoading ? "Signing in…" : "Sign in"}
              </button>

              <div className="auth-links-column">
                <Link className="link-muted" to="/forgot-password">
                  Forgot password?
                </Link>

                {errorCode === "EMAIL_NOT_VERIFIED" && (
                  <button
                    type="button"
                    className="link-muted link-as-button"
                    onClick={handleResendVerification}
                    disabled={isResending || (!errorActorId && !email)}
                  >
                    {isResending
                      ? "Sending verification…"
                      : "Resend verification email"}
                  </button>
                )}
              </div>
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
