import React from "react";
import PropTypes from "prop-types";
import { FiMail, FiLock, FiInfo } from "react-icons/fi";
// ⬇️ Adjust the import path to where you place the slice below
import {
  useChangeEmailMutation,
  useSetPasswordMutation,
} from "../../../features/auth/authApiSlice";

/* Helpers */
const EMAIL_RX = /^[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}$/;

function normRole(role) {
  return String(role || "").toLowerCase();
}

/** account email lives at ROOT (actor.email) */
function getAccountEmail(actor) {
  return (actor?.email || "").trim();
}

/** original (registration) email is read-only, nested by role */
function getFirstEmail(actor, role) {
  const r = normRole(role);
  if (r === "exhibitor") return actor?.identity?.firstEmail || actor?.identity?.email || "";
  if (r === "speaker")   return actor?.personal?.firstEmail || actor?.personal?.email || "";
  // attendee default
  return actor?.personal?.firstEmail || actor?.personal?.email || "";
}

/* Section wrapper (keeps existing shell styles) */
function Section({ title, icon: Icon, children, note }) {
  return (
    <section className="pp-section">
      <header className="pp-head">
        <div className="pp-title-row">
          <span className="pp-ico"><Icon /></span>
          <h3 className="pp-title">{title}</h3>
        </div>
        {note ? <div className="sec-note"><FiInfo /> {note}</div> : null}
      </header>
      <div className="pp-card">{children}</div>
    </section>
  );
}

export default function SecurityPanel({ role, actor, loading }) {
  const r = normRole(role);
  const actorId = actor?._id || actor?.id || "";

  // RTK Query mutations (auth)
  const [changeEmail,   { isLoading: savingEmail,   isError: emailErrApi,   error: emailApiErr,   isSuccess: emailOk }] =
    useChangeEmailMutation();
  const [setPassword,   { isLoading: savingPwd,     isError: pwdErrApi,     error: pwdApiErr,     isSuccess: pwdOk }] =
    useSetPasswordMutation();

  // EMAIL STATE (from ROOT)
  const [email, setEmail] = React.useState(getAccountEmail(actor));
  const [email2, setEmail2] = React.useState(getAccountEmail(actor));
  const [emailTouched, setEmailTouched] = React.useState(false);

  // PWD STATE
  const [pwd, setPwd] = React.useState("");
  const [pwd2, setPwd2] = React.useState("");
  const [pwdTouched, setPwdTouched] = React.useState(false);

  // keep local email if actor prop changes
  React.useEffect(() => {
    if (!actor) return;
    const current = getAccountEmail(actor);
    setEmail((prev) => (prev ? prev : current));
    setEmail2((prev) => (prev ? prev : current));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actor?._id, actor?.email]);

  const emailErr =
    emailTouched &&
    (
      (!email || !EMAIL_RX.test(email)) ? "Enter a valid email." :
      (email !== email2) ? "Emails don’t match." : ""
    );

  const pwdErr =
    pwdTouched &&
    (
      (!pwd || pwd.length < 8) ? "Password must be at least 8 characters." :
      (pwd !== pwd2) ? "Passwords don’t match." : ""
    );

  const apiErrEmail = (emailErrApi && (emailApiErr?.data?.message || emailApiErr?.error)) || "";
  const apiErrPwd   = (pwdErrApi   && (pwdApiErr?.data?.message   || pwdApiErr?.error))   || "";

  const onSaveEmail = async () => {
    setEmailTouched(true);
    if (emailErr || !actorId) return;
    try {
      await changeEmail({ id: actorId, role: r, newEmail: email.trim() }).unwrap();
    } catch (_) { /* handled by RTK state */ }
  };

  const onSavePwd = async () => {
    setPwdTouched(true);
    if (pwdErr || !actorId) return;
    try {
      await setPassword({ id: actorId, role: r, pwd }).unwrap();
      setPwd(""); setPwd2(""); setPwdTouched(false);
    } catch (_) { /* handled by RTK state */ }
  };

  const verified = !!actor?.verified;
  const createdAt = actor?.createdAt ? new Date(actor.createdAt) : null;

  return (
    <div className="pp-wrap">
      {/* PRIVATE BADGE */}
      <div className="sec-visibility">
        <span className="sec-chip -private">Private</span>
        {verified ? <span className="sec-chip -ok">Verified</span> : <span className="sec-chip -warn">Not verified</span>}
        {createdAt ? <span className="sec-chip -muted">Joined {createdAt.toLocaleDateString()}</span> : null}
      </div>

      {/* EMAIL */}
      <Section
        title="Email"
        icon={FiMail}
        note="Changing your account email may require re-verification. Your first (registration) email is kept read-only."
      >
        {loading ? (
          <div className="sec-skel">
            <div className="is-skeleton sec-skel-line" />
            <div className="is-skeleton sec-skel-line" />
            <div className="is-skeleton sec-skel-btn" />
          </div>
        ) : (
          <div className="sec-grid">
            <div className="sec-field">
              <label className="sec-label">New email</label>
              <input
                className={`sec-input ${emailTouched && emailErr ? "has-error" : ""}`}
                type="email"
                value={email}
                onChange={(e)=>setEmail(e.target.value)}
                onBlur={()=>setEmailTouched(true)}
                placeholder="you@example.com"
                autoComplete="email"
              />
              {emailTouched && emailErr ? <div className="sec-error">{emailErr}</div> : null}
              <div className="sec-hint">Current account email: <b>{getAccountEmail(actor) || "—"}</b></div>
              <div className="sec-hint">First (registration) email: <b>{getFirstEmail(actor, r) || "—"}</b></div>
              {apiErrEmail && <div className="pp-alert -error mt-2">{apiErrEmail}</div>}
              {emailOk && !apiErrEmail && <div className="pp-alert -ok mt-2">Email saved. A notification was sent to your first email.</div>}
            </div>

            <div className="sec-field">
              <label className="sec-label">Confirm email</label>
              <input
                className={`sec-input ${emailTouched && emailErr ? "has-error" : ""}`}
                type="email"
                value={email2}
                onChange={(e)=>setEmail2(e.target.value)}
                onBlur={()=>setEmailTouched(true)}
                placeholder="Re-enter new email"
                autoComplete="email"
              />
            </div>

            <div className="sec-actions">
              <button
                type="button"
                className="sec-btn"
                disabled={savingEmail || !!emailErr || !email || !email2}
                onClick={onSaveEmail}
              >
                {savingEmail ? "Saving…" : "Save email"}
              </button>
            </div>
          </div>
        )}
      </Section>

      {/* PASSWORD */}
      <Section title="Password" icon={FiLock} note="Use at least 8 characters.">
        {loading ? (
          <div className="sec-skel">
            <div className="is-skeleton sec-skel-line" />
            <div className="is-skeleton sec-skel-line" />
            <div className="is-skeleton sec-skel-btn" />
          </div>
        ) : (
          <div className="sec-grid">
            <div className="sec-field">
              <label className="sec-label">New password</label>
              <input
                className={`sec-input ${pwdTouched && pwdErr ? "has-error" : ""}`}
                type="password"
                value={pwd}
                onChange={(e)=>setPwd(e.target.value)}
                onBlur={()=>setPwdTouched(true)}
                autoComplete="new-password"
                placeholder="Min 8 characters"
              />
            </div>

            <div className="sec-field">
              <label className="sec-label">Confirm password</label>
              <input
                className={`sec-input ${pwdTouched && pwdErr ? "has-error" : ""}`}
                type="password"
                value={pwd2}
                onChange={(e)=>setPwd2(e.target.value)}
                onBlur={()=>setPwdTouched(true)}
                autoComplete="new-password"
                placeholder="Re-enter password"
              />
              {pwdTouched && pwdErr ? <div className="sec-error">{pwdErr}</div> : null}
              {apiErrPwd && <div className="pp-alert -error mt-2">{apiErrPwd}</div>}
              {pwdOk && !apiErrPwd && <div className="pp-alert -ok mt-2">Password updated. We sent a safety reset link to your first email.</div>}
            </div>

            <div className="sec-actions">
              <button
                type="button"
                className="sec-btn"
                disabled={savingPwd || !!pwdErr || !pwd || !pwd2}
                onClick={onSavePwd}
              >
                {savingPwd ? "Saving…" : "Save password"}
              </button>
            </div>
          </div>
        )}
      </Section>

      {/* SESSIONS & DEVICES (placeholder) */}
      <Section title="Sessions & Devices" icon={FiInfo} note="You’re signed in on these devices.">
        <div className="sec-grid">
          <div className="sec-field">
            <label className="sec-label">This browser</label>
            <div
              className="sec-input"
              style={{ display:"flex", alignItems:"center", height:"auto", padding:"10px 12px" }}
            >
              <div>
                <div>
                  <b>
                    {navigator.userAgentData?.brands?.map(b=>b.brand).join(", ") || navigator.userAgent}
                  </b>
                </div>
                <div className="sec-hint">IP shows here when backend is wired</div>
              </div>
            </div>
          </div>

          <div className="sec-actions">
            <button type="button" className="sec-btn" disabled>
              Sign out from all devices
            </button>
          </div>
        </div>
      </Section>

      {/* PRIVACY (placeholder) */}
      <Section title="Privacy & Visibility" icon={FiInfo} note="Choose what is visible on your public profile.">
        <div className="sec-grid">
          <div className="sec-field">
            <label className="sec-label">Show organization on public profile</label>
            <label className="pp-switch">
              <input type="checkbox" disabled />
              <span />
            </label>
            <div className="sec-hint">Coming soon — actor.privacy.showOrg</div>
          </div>

          <div className="sec-field">
            <label className="sec-label">Show social links</label>
            <label className="pp-switch">
              <input type="checkbox" disabled />
              <span />
            </label>
            <div className="sec-hint">Coming soon — actor.privacy.showLinks</div>
          </div>
        </div>
      </Section>

      {/* DANGER ZONE (placeholder) */}
      <Section title="Danger Zone" icon={FiInfo} note="Irreversible actions.">
        <div className="sec-grid">
          <div className="sec-field">
            <label className="sec-label">Delete my account</label>
            <button
              type="button"
              className="sec-btn"
              style={{ background:"linear-gradient(135deg,#ef4444,#b91c1c)" }}
              disabled
            >
              Request deletion
            </button>
            <div className="sec-hint">We’ll enable this when the endpoint is ready.</div>
          </div>
        </div>
      </Section>
    </div>
  );
}

SecurityPanel.propTypes = {
  role: PropTypes.string.isRequired,
  actor: PropTypes.object,
  loading: PropTypes.bool,
};
