import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useRegisterUserMutation } from "../../features/auth/authApiSlice";
import { useGetOtherActorTypeLabelsQuery } from "../../features/Actor/toolsApiSlice";
import "./register.css";
import "../../styles/global.css";
import "../../styles/tokens.css";

import HeaderShell from "../../components/layout/HeaderShell";
import Footer from "../../components/footer/Footer";
import { topbar, nav, cta, footerData } from "../main.mock";

const ACTOR_TYPES = [
  { id: "BusinessOwner", label: "Business owner", desc: "Build, grow and showcase your company." },
  { id: "Investor",      label: "Investor",       desc: "Discover opportunities and founders." },
  { id: "Consultant",    label: "Consultant",     desc: "Support teams with your expertise." },
  { id: "Expert",        label: "Expert",         desc: "Share knowledge, speak and mentor." },
  { id: "Employee",      label: "Employee",       desc: "Represent your company at events." },
  { id: "Student",       label: "Student",        desc: "Learn, network and find opportunities." },
  { id: "Other",         label: "Other",          desc: "I don’t fit in the boxes above." },
];

const SUBROLE_OPTIONS = [
  "Researchers",
  "Students",
  "Coaches & Trainers",
  "Experts & Consultants",
  "Employees & Professionals",
  "Entrepreneurs & Startups",
  "Developers & Engineers",
  "Marketing & Communication",
  "Audit, Accounting & Finance",
  "Investment & Banking",
  "Insurance & Microfinance",
  "Legal & Lawyers",
  "AI, IoT & Emerging Tech",
  "Audiovisual & Creative Industries",
  "Media & Journalists",
  "Universities & Academies",
  "NGOs & Civil Society",
  "Public Sector & Government",
  "Other",
];

function calcPasswordStrength(pwd) {
  if (!pwd) return 0;
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[A-Z]/.test(pwd) || /[^a-zA-Z0-9]/.test(pwd)) score++;
  if (pwd.length >= 12) score++;
  if (score <= 1) return 1;
  if (score === 2) return 2;
  return 3;
}

function generateRandomPassword() {
  const chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let out = "";
  for (let i = 0; i < 16; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

/**
 * STEPS:
 * 0 → Account (Google OR email+password)
 * 1 → Profile (actorType + Other label)
 * 2 → Details (fullName, phone, subRole)
 * 3 → Organization (organization, jobTitle + submit)
 */
const STEPS = [
  { id: 0, label: "Account",      desc: "Google or email & password" },
  { id: 1, label: "Profile",      desc: "Main profile on Eventra" },
  { id: 2, label: "Details",      desc: "Name, phone & sub-role" },
  { id: 3, label: "Organization", desc: "Company & job title" },
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const [registerUser, { isLoading }] = useRegisterUserMutation();

  const [step, setStep] = useState(0);
  const [usedGoogle, setUsedGoogle] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [actorType, setActorType] = useState("BusinessOwner");

  const [subRole, setSubRole] = useState("");
  const [otherRoleLabel, setOtherRoleLabel] = useState("");

  const [phone, setPhone] = useState("");
  const [organization, setOrganization] = useState("");
  const [jobTitle, setJobTitle] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pwdLevel, setPwdLevel] = useState(0);

  const googleBtnRef = useRef(null);

  const { data: otherLabels = [] } = useGetOtherActorTypeLabelsQuery(
    undefined,
    { skip: actorType !== "Other" }
  );

  useEffect(() => {
    setError("");
  }, [
    step,
    fullName,
    email,
    pwd,
    pwd2,
    actorType,
    subRole,
    otherRoleLabel,
    phone,
    organization,
    jobTitle,
  ]);

  useEffect(() => {
    setPwdLevel(calcPasswordStrength(pwd));
  }, [pwd]);

  // Google Sign-In (GSI)
  useEffect(() => {
    const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    const handleGoogleResponse = (response) => {
      try {
        const token = response.credential;
        const parts = token.split(".");
        if (parts.length !== 3) throw new Error("Invalid token");
        const payload = JSON.parse(atob(parts[1]));
        const emailFromGoogle = payload.email || "";
        const nameFromGoogle =
          payload.name ||
          `${payload.given_name || ""} ${payload.family_name || ""}`.trim();

        if (!emailFromGoogle) {
          setError("Google sign-in failed: no email returned.");
          return;
        }

        const randomPwd = generateRandomPassword();
        setEmail(emailFromGoogle);
        setFullName(nameFromGoogle);
        setPwd(randomPwd);
        setPwd2(randomPwd);
        setUsedGoogle(true);
        setStep(1);
      } catch (e) {
        console.error("Google decode error", e);
        setError("Google sign-in failed. Please try again or use email.");
      }
    };

    const initGoogle = () => {
      if (!window.google || !googleBtnRef.current) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleResponse,
      });
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        type: "standard",
        theme: "outline",
        text: "continue_with",
        shape: "pill",
        width: "260",
      });
    };

    if (window.google && window.google.accounts) {
      initGoogle();
    } else {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = initGoogle;
      document.body.appendChild(script);
      return () => {
        document.body.removeChild(script);
      };
    }
  }, []);

  const canGoToStep = (target) => target <= step;
  const goToStep = (target) => {
    if (canGoToStep(target)) setStep(target);
  };

  const handleNext = () => {
    if (step === 0) {
      if (!usedGoogle) {
        if (!email.trim()) {
          setError("Email is required");
          return;
        }
        if (!pwd) {
          setError("Password is required");
          return;
        }
        if (pwd.length < 8) {
          setError("Password must be at least 8 characters");
          return;
        }
        if (pwd2 && pwd2 !== pwd) {
          setError("Passwords do not match");
          return;
        }
      }
    } else if (step === 1) {
      if (!actorType) {
        setError("Please choose your main profile.");
        return;
      }
      if (actorType === "Other" && !otherRoleLabel.trim()) {
        setError("Please describe your role.");
        return;
      }
    } else if (step === 2) {
      if (!fullName.trim()) {
        setError("Full name is required");
        return;
      }
      if (!phone.trim()) {
        setError("Phone number is required");
        return;
      }
      if (!subRole) {
        setError("Please select your sub-role.");
        return;
      }
    }

    setStep((prev) => Math.min(prev + 1, STEPS.length - 1));
  };

  const handleBack = () => {
    setStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    setError("");
    setSuccess("");

    if (!fullName.trim()) {
      setError("Full name is required");
      setStep(2);
      return;
    }
    if (!phone.trim()) {
      setError("Phone number is required");
      setStep(2);
      return;
    }
    if (!subRole) {
      setError("Please select your sub-role.");
      setStep(2);
      return;
    }
    if (!email.trim()) {
      setError("Email is required");
      setStep(0);
      return;
    }
    if (!pwd) {
      setError("Password is required");
      setStep(0);
      return;
    }
    if (pwd.length < 8) {
      setError("Password must be at least 8 characters");
      setStep(0);
      return;
    }
    if (pwd2 && pwd2 !== pwd) {
      setError("Passwords do not match");
      setStep(0);
      return;
    }

    const subRolesArray = subRole ? [subRole] : [];

    const body = {
      fullName,
      email,
      phone,
      organization,
      jobTitle,
      actorType,
      role: actorType,
      pwd,
      pwd2,
      subRole: subRole || "",
      subRoles: subRolesArray,
      otherRoleLabel:
        actorType === "Other" ? (otherRoleLabel || "").trim() : "",
    };

    try {
      const resp = await registerUser(body).unwrap();
      if (resp?.success || resp?.message?.includes("verify your email")) {
        setSuccess(
          "Account created. Check your email to verify your account."
        );
        setTimeout(() => navigate("/login"), 3000);
      } else {
        setError(resp?.message || "Unexpected response from server.");
      }
    } catch (err) {
      const msg =
        err?.data?.message ||
        err?.error ||
        err?.message ||
        "Registration failed.";
      setError(msg);
    }
  };

  return (
    <>
      <HeaderShell top={topbar} nav={nav} cta={cta} />

      <main className="evreg-shell">
        <section className="evreg-card">
          <header className="evreg-head">
            <div className="evreg-head-main">
              <h1 className="evreg-title">Create your Eventra profile</h1>
              <p className="evreg-sub">
                One platform account for events, meetings and marketplace. We’ll
                guide you through a few short steps.
              </p>
            </div>
            <div className="evreg-badge">
              <span className="evreg-badge-dot" />
              Visitor account · Free
            </div>
          </header>

          {/* DESKTOP TABS */}
          <div className="evreg-tabs">
            {STEPS.map((s, index) => {
              const active = step === index;
              const done = step > index;
              return (
                <button
                  key={s.id}
                  type="button"
                  className={
                    "evreg-tab" +
                    (active ? " evreg-tab--active" : "") +
                    (done ? " evreg-tab--done" : "")
                  }
                  onClick={() => goToStep(index)}
                >
                  <span className="evreg-tab-index">
                    {done ? "✓" : index + 1}
                  </span>
                  <span className="evreg-tab-text">
                    <span className="evreg-tab-label">{s.label}</span>
                    <span className="evreg-tab-desc">{s.desc}</span>
                  </span>
                </button>
              );
            })}
          </div>

          {/* MOBILE DOT NAV */}
          <div className="evreg-steps-dots">
            {STEPS.map((s, index) => {
              const active = step === index;
              const done = step > index;
              return (
                <button
                  key={s.id}
                  type="button"
                  className={
                    "evreg-dot" +
                    (active ? " evreg-dot--active" : "") +
                    (done ? " evreg-dot--done" : "")
                  }
                  onClick={() => goToStep(index)}
                >
                  <span className="evreg-dot-circle">{index + 1}</span>
                  <span className="evreg-dot-label">{s.label}</span>
                </button>
              );
            })}
          </div>

          {/* WIZARD */}
          <div className="evreg-wizard">
            {error && (
              <div className="evreg-alert evreg-alert--error">{error}</div>
            )}
            {success && (
              <div className="evreg-alert evreg-alert--success">
                {success}
              </div>
            )}

            <div className="evreg-step-wrapper">
              <div
                className="evreg-step-track"
                style={{ transform: `translateX(-${step * 100}%)` }}
              >
                {/* STEP 0 – ACCOUNT */}
                <section className="evreg-step">
                  <div className="evreg-step-body">
                    <p className="evreg-step-title">Start with your account</p>
                    <p className="evreg-step-sub">
                      Sign up with Google in one click or create an account
                      using your email and password.
                    </p>

                    <div className="evreg-auth-block">
                      <div className="evreg-auth-google-box">
                        <div
                          ref={googleBtnRef}
                          className="evreg-auth-google-container"
                        />
                        <p className="evreg-hint evreg-hint-center">
                          We only use your name and email from Google.
                        </p>
                      </div>

                      <div className="evreg-auth-divider-row">
                        <span className="evreg-auth-divider-line" />
                        <span className="evreg-auth-divider-text">
                          or create with email
                        </span>
                        <span className="evreg-auth-divider-line" />
                      </div>

                      <div className="evreg-auth-email-box">
                        <div className="evreg-field">
                          <label
                            className="evreg-label"
                            htmlFor="evreg-email"
                          >
                            Email
                          </label>
                          <input
                            id="evreg-email"
                            type="email"
                            className="evreg-input"
                            value={email}
                            onChange={(e) => {
                              setEmail(e.target.value);
                              setUsedGoogle(false);
                            }}
                            placeholder="you@example.com"
                          />
                        </div>

                        <div className="evreg-field">
                          <label
                            className="evreg-label"
                            htmlFor="evreg-pwd"
                          >
                            Password
                          </label>
                          <input
                            id="evreg-pwd"
                            type="password"
                            className="evreg-input"
                            value={pwd}
                            onChange={(e) => setPwd(e.target.value)}
                            placeholder="Minimum 8 characters"
                          />
                        </div>

                        <div className="evreg-field">
                          <label
                            className="evreg-label"
                            htmlFor="evreg-pwd2"
                          >
                            Confirm password
                          </label>
                          <input
                            id="evreg-pwd2"
                            type="password"
                            className="evreg-input"
                            value={pwd2}
                            onChange={(e) => setPwd2(e.target.value)}
                            placeholder="Repeat your password"
                          />
                        </div>

                        <div className="evreg-pwd-meter-row">
                          <div className="evreg-pwd-meter">
                            <div
                              className="evreg-pwd-meter-bar"
                              data-evreg-level={pwdLevel}
                            />
                          </div>
                          <span className="evreg-pwd-meter-label">
                            {pwdLevel === 0
                              ? "Type a password"
                              : pwdLevel === 1
                              ? "Weak"
                              : pwdLevel === 2
                              ? "Good"
                              : "Strong"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* STEP 1 – MAIN PROFILE */}
                <section className="evreg-step">
                  <div className="evreg-step-body">
                    <p className="evreg-step-title">
                      Choose your main profile
                    </p>
                    <p className="evreg-step-sub">
                      This helps us personalize events, meetings and
                      recommendations.
                    </p>

                    <p className="evreg-side-label">Main profile</p>
                    <div className="evreg-actor-grid">
                      {ACTOR_TYPES.map((type) => {
                        const active = actorType === type.id;
                        return (
                          <button
                            key={type.id}
                            type="button"
                            className={
                              "evreg-actor-card" +
                              (active ? " evreg-actor-card--active" : "")
                            }
                            onClick={() => setActorType(type.id)}
                          >
                            <div className="evreg-actor-card-header">
                              <span className="evreg-actor-label">
                                {type.label}
                              </span>
                            </div>
                            <p className="evreg-actor-desc">{type.desc}</p>
                          </button>
                        );
                      })}
                    </div>

                    {actorType === "Other" && (
                      <div className="evreg-field" style={{ marginTop: 10 }}>
                        <label
                          className="evreg-label"
                          htmlFor="evreg-otherRoleLabel"
                        >
                          How would you describe your role?
                        </label>
                        <input
                          id="evreg-otherRoleLabel"
                          type="text"
                          className="evreg-input"
                          value={otherRoleLabel}
                          onChange={(e) =>
                            setOtherRoleLabel(e.target.value)
                          }
                          placeholder="Type your role or pick a suggestion"
                          list="evreg-other-labels"
                        />
                        <datalist id="evreg-other-labels">
                          {(otherLabels || []).map((opt) => {
                            const val =
                              typeof opt === "string" ? opt : opt?.value;
                            if (!val) return null;
                            return <option key={val} value={val} />;
                          })}
                        </datalist>
                        <p className="evreg-hint">
                          For example: &quot;Freelance video editor&quot;,
                          &quot;Community organizer&quot;, etc.
                        </p>
                      </div>
                    )}

                    <p className="evreg-side-hint" style={{ marginTop: 12 }}>
                      You can later add more roles from your profile (ex:{" "}
                      <strong>Founder &amp; Investor</strong>,{" "}
                      <strong>Student &amp; Volunteer</strong>).
                    </p>
                  </div>
                </section>

                {/* STEP 2 – PERSONAL DETAILS */}
                <section className="evreg-step">
                  <div className="evreg-step-body">
                    <p className="evreg-step-title">
                      Tell us a bit about you
                    </p>
                    <p className="evreg-step-sub">
                      We use this to build your public profile and make it
                      easier to connect at events.
                    </p>

                    <div className="evreg-field">
                      <label
                        className="evreg-label"
                        htmlFor="evreg-fullName"
                      >
                        Full name
                      </label>
                      <input
                        id="evreg-fullName"
                        type="text"
                        className="evreg-input"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Your full name"
                      />
                    </div>

                    <div className="evreg-field">
                      <label className="evreg-label" htmlFor="evreg-phone">
                        Phone
                      </label>
                      <input
                        id="evreg-phone"
                        type="tel"
                        className="evreg-input"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+216 12 345 678"
                      />
                    </div>

                    <div className="evreg-field">
                      <label className="evreg-label" htmlFor="evreg-subRole">
                        Sub-role
                      </label>
                      <select
                        id="evreg-subRole"
                        className="evreg-input"
                        value={subRole}
                        onChange={(e) => setSubRole(e.target.value)}
                      >
                        <option value="">Select a group</option>
                        {SUBROLE_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                      <p className="evreg-hint">
                        This helps us group profiles: research, finance,
                        creative, public sector, etc.
                      </p>
                    </div>
                  </div>
                </section>

                {/* STEP 3 – ORGANIZATION & JOB TITLE */}
                <section className="evreg-step">
                  <div className="evreg-step-body">
                    <p className="evreg-step-title">
                      Your organization and role
                    </p>
                    <p className="evreg-step-sub">
                      This appears on event badges, meetings and business
                      profile suggestions.
                    </p>

                    <div className="evreg-field">
                      <label
                        className="evreg-label"
                        htmlFor="evreg-organization"
                      >
                        Organization
                      </label>
                      <input
                        id="evreg-organization"
                        type="text"
                        className="evreg-input"
                        value={organization}
                        onChange={(e) =>
                          setOrganization(e.target.value)
                        }
                        placeholder="Company / NGO / school"
                      />
                    </div>

                    <div className="evreg-field">
                      <label
                        className="evreg-label"
                        htmlFor="evreg-jobTitle"
                      >
                        Job title
                      </label>
                      <input
                        id="evreg-jobTitle"
                        type="text"
                        className="evreg-input"
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                        placeholder="e.g. Founder, Project manager…"
                      />
                    </div>

                    <p className="evreg-footnote" style={{ marginTop: 12 }}>
                      We’ll send you a verification email. You can manage your
                      privacy and notifications from your account later.
                    </p>
                  </div>
                </section>
              </div>
            </div>

            {/* FOOTER BUTTONS */}
            <div className="evreg-wizard-footer">
              {step > 0 ? (
                <button
                  type="button"
                  className="evreg-wizard-btn evreg-wizard-btn--ghost"
                  onClick={handleBack}
                  disabled={isLoading}
                >
                  Back
                </button>
              ) : (
                <span />
              )}

              {step < STEPS.length - 1 ? (
                <button
                  type="button"
                  className="evreg-wizard-btn evreg-wizard-btn--primary"
                  onClick={handleNext}
                  disabled={isLoading}
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  className="evreg-wizard-btn evreg-wizard-btn--primary"
                  onClick={handleSubmit}
                  disabled={isLoading}
                >
                  {isLoading ? "Creating your account…" : "Create account"}
                </button>
              )}
            </div>

            <footer className="evreg-footer evreg-footer--wizard">
              Already have an account?{" "}
              <Link to="/login" className="evreg-link-strong">
                Sign in
              </Link>
            </footer>
          </div>
        </section>
      </main>

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
