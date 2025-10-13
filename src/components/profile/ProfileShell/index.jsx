// src/components/profile/shell/ProfileShell.jsx
import React from "react";
import PropTypes from "prop-types";
import "./profile-shell.css";
import Panels from "../Panels";
import { FiCamera, FiExternalLink, FiShare2, FiX } from "react-icons/fi";
import { useChangePPMutation } from "../../../features/Actor/toolsApiSlice";
import imageLink from "../../../utils/imageLink";
import { useLazyResendVerificationQuery } from "../../../features/auth/authApiSlice";

function initialsOf(name = "") {
  const t = String(name).trim();
  if (!t) return "ME";
  const parts = t.split(/\s+/);
  const a = (parts[0]?.[0] || "").toUpperCase();
  const b = (parts[1]?.[0] || "").toUpperCase();
  return (a + b) || "ME";
}

function safeDate(d) {
  try {
    const dt = d ? new Date(d) : null;
    return dt && !Number.isNaN(dt.getTime()) ? dt.toLocaleDateString() : "";
  } catch { return ""; }
}

const humanize = (s) =>
  (s || "")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());

export default function ProfileShell({
  role,
  actor,
  event,
  loading = false,
  loadError = null,
  onPatch,
  initialTabKey,
}) {
  const r = (role || "").toLowerCase();
  const isAtt = r === "attendee";
  const isExh = r === "exhibitor";
  const isSpk = r === "speaker";

  // ----- Resolve header fields (null-safe)
  const fullName =
    (isAtt && actor?.personal?.fullName) ||
    (isSpk && actor?.personal?.fullName) ||
    (isExh && actor?.identity?.exhibitorName) ||
    "";

  const orgName =
    (isAtt && actor?.organization?.orgName) ||
    (isSpk && actor?.organization?.orgName) ||
    (isExh && actor?.identity?.orgName) ||
    "";

  // role-like (actorType)
  const roleLikeRaw = actor?.actorType || actor?.roleLike || "";
  const roleLike = humanize(roleLikeRaw);

  // sub-roles (first one)
  const subRoles =
    (Array.isArray(actor?.subRole) && actor?.subRole) ||
    (Array.isArray(actor?.subRoles) && actor?.subRoles) ||
    (Array.isArray(actor?.businessProfile?.subRoles) && actor?.businessProfile?.subRoles) ||
    [];
  const firstSubRole = humanize(subRoles[0] || "");

  // chip that used to be email -> now sub-role or, if BusinessOwner, the role-like
  const metaChip3 =
    roleLikeRaw === "BusinessOwner"
      ? (roleLike || "Business Owner")
      : (firstSubRole || roleLike || "—");

  // avatar / logo
  const avatarUrlServer =
    (isAtt && actor?.personal?.profilePic) ||
    (isSpk && actor?.personal?.profilePic) ||
    (isExh && actor?.identity?.logo) ||
    "";

  const [avatar, setAvatar] = React.useState(imageLink(avatarUrlServer));
  React.useEffect(() => { setAvatar(imageLink(avatarUrlServer)); }, [avatarUrlServer]);

  const joinedAt = safeDate(actor?.createdAt);
  const verified = !!actor?.verified; // boolean
  const adminVerified = actor?.adminVerified;
  const eventTitle = event?.title || "";
  const eventDates =
    event?.startDate && event?.endDate
      ? `${safeDate(event.startDate)} – ${safeDate(event.endDate)}`
      : "";

  // ----- Tabs (role-aware via Panels registry)
  const tabs = React.useMemo(() => Panels.getTabs(r), [r]);
  const defaultKey = initialTabKey || (tabs[0]?.key || "identity");
  const [tabKey, setTabKey] = React.useState(defaultKey);

  React.useEffect(() => {
    if (!tabs.find(t => t.key === tabKey)) {
      setTabKey(tabs[0]?.key || "identity");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [r, JSON.stringify(tabs.map(t => t.key))]);

  // ----- Avatar change (upload) -----
  const [localPreview, setLocalPreview] = React.useState("");
  const [changingError, setChangingError] = React.useState(null);
  const [changePP, { isLoading: isUploading }] =
    useChangePPMutation() || [{}, { isLoading:false }];

  const fileRef = React.useRef(null);
  const actorId = actor?._id || actor?.id || null;
  const actorEmail =
    (actor?.personal?.email) ||
    (actor?.identity?.email) ||  '';

  const [triggerResend] = useLazyResendVerificationQuery();

  // === Popup action bus: listen for resend-verification
  React.useEffect(() => {
    function onPopupAction(e) {
      const a = e?.detail || {};
      if (a.action === "resend-verification" && actorId) {
        triggerResend(actorId)
          .unwrap()
          .then(() => {
            const ok = {
              type: "success",
              title: "Verification e-mail sent",
              body: `We sent a new verification link to ${actorEmail || "your email"}.`,
              ts: Date.now(),
              showOnce: true
            };
            const list = JSON.parse(localStorage.getItem("popups") || "[]");
            list.unshift(ok);
            localStorage.setItem("popups", JSON.stringify(list));
            window.dispatchEvent(new CustomEvent("app:popup:ready"));
          })
          .catch(() => {
            const err = {
              type: "danger",
              title: "Could not send verification",
              body: "Please try again in a moment.",
              ts: Date.now(),
              showOnce: true
            };
            const list = JSON.parse(localStorage.getItem("popups") || "[]");
            list.unshift(err);
            localStorage.setItem("popups", JSON.stringify(list));
            window.dispatchEvent(new CustomEvent("app:popup:ready"));
          });
      }
    }
    window.addEventListener("app:popup:action", onPopupAction);
    return () => window.removeEventListener("app:popup:action", onPopupAction);
  }, [actorId, actorEmail, triggerResend]);

  // === Persistent verify popup: enqueue on every mount when NOT verified
  // Idempotent: only push if there isn't already a “verify:<actorId>” popup in LS
  React.useEffect(() => {
    if (!actorId) return;
    if (verified) return;

    const id = `verify:${actorId}`;
    const list = JSON.parse(localStorage.getItem("popups") || "[]");
    const already = Array.isArray(list) && list.some(p => p && p.__id === id);

    if (!already) {
      const item = {
        __id: id,               // unique marker to avoid duplicates in the same session
        type: "info",           // uses brand color in your PopupHost (bright style)
        title: "Verify your e-mail",
        body:
          "Your account is not verified yet.\n\n" +
          "Click the button below to receive a new verification e-mail.\n" +
          "It includes your PDF with sessions, QR code, and the verification token.",
        ts: Date.now(),
        showOnce: false,        // allow re-appearance on each visit while unverified
        link: {
          label: "Send verification",
          href: "#",            // stay on the same page
          action: "resend-verification",
          closeOnClick: true
        }
      };
      // put it first so it shows now
      list.unshift(item);
      localStorage.setItem("popups", JSON.stringify(list));
    }
    // Always ping the popup host (even if it already exists), so it will show again on every visit.
    window.dispatchEvent(new CustomEvent("app:popup:ready"));
  }, [actorId, verified]);

  const onOpenPicker = () => {
    if (fileRef.current && !loading) fileRef.current.click();
  };
  const onKeyOpenPicker = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onOpenPicker();
    }
  };
  const onPickFile = async (e) => {
    try {
      setChangingError(null);
      const f = e.target.files && e.target.files[0];
      if (!f) return;
      const url = URL.createObjectURL(f);
      setLocalPreview(url);
      const res = await changePP({ actorId, file: f }).unwrap?.();
      setAvatar(imageLink(res?.url || ""));
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (err) {
      setChangingError("Failed to update profile picture.");
      setLocalPreview("");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  // Business Profile intent
  const haveBpp = actor?.bp;
  const businessUrl = haveBpp ? "/BusinessProfile/dashboard" : "/BusinessProfile/form";
  const businessText = haveBpp ? "Business profile" : "Create business profile";

  // Public profile URL + QR
  const baseUrl = React.useMemo(() => {
    if (typeof window === "undefined") return "";
    try {
      const { origin, pathname } = window.location;
      return `${origin}${pathname}`.replace(/\/+$/, "");
    } catch { return ""; }
  }, []);
  const publicUrl = React.useMemo(() => {
    if (!baseUrl) return "";
    return actorId ? `${baseUrl}/${actorId}` : baseUrl;
  }, [baseUrl, actorId]);

  const [qrOpen, setQrOpen] = React.useState(false);
  const qrSrc = React.useMemo(() => {
    const u = publicUrl || "";
    const size = 320;
    const margin = 10;
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=${margin}&data=${encodeURIComponent(u)}`;
  }, [publicUrl]);

  // labels & chips
  const roleChipLabel = r || "—";                // keep ps-rolechip as original role
  const summaryRoleLabel = roleLike || "—";      // change summary "Role" to role-like
  const eventChipClass = `ps-badge ${adminVerified === "yes" ? "" : "-warn"}`;
  const verifyLabel = adminVerified === "yes" ? "Verified" : "Not verified";

  return (
    <section className="ps-shell">
      {/* HEADER */}
      <header className="ps-header">
        <div className="ps-hgrid">
          {/* Avatar & identity */}
          <div className="ps-idblock">
            {/* AVATAR */}
            <div
              className={`ps-avatar -xl has-change ${loading ? "is-skeleton" : ""} ${isUploading ? "is-uploading" : ""}`}
              role="button"
              tabIndex={0}
              aria-label="Change profile picture"
              onClick={onOpenPicker}
              onKeyDown={onKeyOpenPicker}
            >
              {!loading && (localPreview || avatar) ? (
                <img
                  src={localPreview || avatar}
                  alt="Profile"
                  onError={e => { e.currentTarget.style.display = "none"; }}
                />
              ) : null}
              {!loading && !(localPreview || avatar) ? initialsOf(fullName || orgName) : null}

              <span className="ps-change" aria-hidden="true">
                <FiCamera />
              </span>

              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="ps-file-input"
                onChange={onPickFile}
                aria-hidden="true"
                tabIndex={-1}
              />
              {isUploading ? <span className="ps-uploading-veil" /> : null}
            </div>

            {/* Meta + Actions stacked nicely */}
            <div className="ps-idmeta">
              <div className="ps-meta">
                <h1 className="ps-name">
                  {loading ? "\u00A0" : (fullName || orgName || "—")}
                </h1>

                <div className="ps-meta-row">
                  <span className="ps-rolechip">{roleChipLabel}</span>
                  {orgName ? <span className="ps-org">{orgName}</span> : <span className="ps-org ps-muted">—</span>}
                  <span className="ps-email">{metaChip3}</span>
                  {joinedAt ? <span className="ps-joined">Joined {joinedAt}</span> : null}
                </div>

                {changingError ? (
                  <div className="ps-pp-err" role="alert">{changingError}</div>
                ) : null}
              </div>

              {/* ACTIONS */}
              <div className="ps-actions">
                {/* Business profile -> black button */}
                <a
                  className="ps-btn ps-dark"
                  href={businessUrl}
                  target="_blank"
                  rel="noreferrer"
                  title={businessUrl}
                >
                  <FiExternalLink />
                  {businessText}
                </a>

                {/* Public profile -> brand gradient */}
                {actorId ? (
                  <a
                    className="ps-btn ps-primary"
                    href={publicUrl}
                    target="_blank"
                    rel="noreferrer"
                    title={publicUrl}
                  >
                    <FiExternalLink />
                    Public profile
                  </a>
                ) : (
                  <button className="ps-btn ps-primary" disabled title="Missing id">
                    <FiExternalLink />
                    Public profile
                  </button>
                )}

                {/* QR (unchanged style) */}
                <button
                  type="button"
                  className="ps-btn ps-ghost"
                  onClick={() => setQrOpen(true)}
                  disabled={!publicUrl}
                  title={publicUrl ? "Show QR code" : "Missing URL"}
                  aria-haspopup="dialog"
                  aria-controls="ps-qr-dialog"
                >
                  <FiShare2 />
                  QR code
                </button>
              </div>
            </div>
          </div>

          {/* Summary strip: event + statuses */}
          <div className="ps-sumstrip">
            <div className="ps-sumitem">
              <div className="ps-sumlabel">Event</div>
              <div className="ps-sumvalue">
                {eventTitle ? (
                  <span className={eventChipClass}>{eventTitle}</span>
                ) : (
                  <span className="ps-muted">No event linked</span>
                )}
              </div>
              {eventDates ? <div className="ps-subnote">{eventDates}</div> : null}
            </div>

            <div className="ps-sumitem">
              <div className="ps-sumlabel">Account</div>
              <div className="ps-sumvalue">
                <span className={`ps-badge ${adminVerified === "yes" ? "-ok" : "-warn"}`}>{verifyLabel}</span>
              </div>
              <div className="ps-subnote">
                {adminVerified === "yes"
                  ? "Admin-approved"
                  : adminVerified === "pending"
                  ? "Awaiting admin review"
                  : "refused by the admin"}
              </div>
            </div>

            <div className="ps-sumitem">
              <div className="ps-sumlabel">Role</div>
              <div className="ps-sumvalue">
                <span className="ps-badge -outline">{summaryRoleLabel}</span>
              </div>
              <div className="ps-subnote">
                {isExh ? "Exhibitor profile" : isSpk ? "Speaker profile" : "Attendee profile"}
              </div>
            </div>
          </div>
        </div>

        {loadError ? (
          <div className="ps-loaderr">
            We couldn’t load everything. You can still view & edit available sections.
          </div>
        ) : null}
      </header>

      {/* TABS */}
      <nav className="ps-tabs" role="tablist" aria-label="Profile sections">
        {tabs.map(t => (
          <button
            key={t.key}
            className={`ps-tab ${tabKey === t.key ? "is-active" : ""}`}
            role="tab"
            aria-selected={tabKey === t.key}
            aria-controls={`panel-${t.key}`}
            id={`tab-${t.key}`}
            type="button"
            onClick={() => setTabKey(t.key)}
          >
            {t.icon ? <span className="ps-tabicon" aria-hidden="true">{t.icon}</span> : null}
            <span className="ps-tabtxt">{t.label}</span>
          </button>
        ))}
      </nav>

      {/* ACTIVE PANEL */}
      <div className="ps-body">
         <div id={`panel-${tabKey}`} role="tabpanel" aria-labelledby={`tab-${tabKey}`}>
          <Panels.Render
            tabs={tabs}
            activeKey={tabKey}
            role={r}
            actor={actor || {}}
            event={event || {}}
            loading={!!loading}
            onPatch={onPatch}
          />
        </div>
      </div>

      {/* ===== QR Modal ===== */}
      {qrOpen && (
        <div
          className="ps-qr-backdrop"
          onClick={() => setQrOpen(false)}
          role="presentation"
        >
          <div
            className="ps-qr"
            id="ps-qr-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="Public profile QR"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="ps-qr-close" onClick={() => setQrOpen(false)} aria-label="Close">
              <FiX />
            </button>

            <div className="ps-qr-title">Scan to open public profile</div>
            <div className="ps-qr-img">
              <img src={qrSrc} alt="QR code for public profile" />
            </div>
            <a className="ps-qr-url" href={publicUrl} target="_blank" rel="noreferrer" title={publicUrl}>
              {publicUrl}
            </a>
          </div>
        </div>
      )}
    </section>
  );
}

ProfileShell.propTypes = {
  role: PropTypes.string.isRequired,
  actor: PropTypes.object,
  event: PropTypes.object,
  loading: PropTypes.bool,
  loadError: PropTypes.any,
  onPatch: PropTypes.func,
  initialTabKey: PropTypes.string,
};
