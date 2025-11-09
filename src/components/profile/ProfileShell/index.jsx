// src/components/profile/shell/ProfileShell.jsx
import React, { useRef, useState } from "react";
import PropTypes from "prop-types";
import "./profile-shell.css";
import Panels from "../Panels";
import { FiCamera, FiExternalLink, FiShare2, FiX, FiEdit } from "react-icons/fi";
import { useChangePPMutation } from "../../../features/Actor/toolsApiSlice";
import imageLink from "../../../utils/imageLink";
import { useLazyResendVerificationQuery } from "../../../features/auth/authApiSlice";
import { useTranslation } from "react-i18next";
import Cropper from "react-cropper";
import 'react-cropper/node_modules/cropperjs/dist/cropper.css';

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
  } catch {
    return "";
  }
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
  const { t } = useTranslation();
  const r = (role || "").toLowerCase();
  const isAtt = r === "attendee";
  const isExh = r === "exhibitor";
  const isSpk = r === "speaker";

  // Resolve header fields (null-safe)
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
  const roleLikeRaw = actor?.actorType || actor?.roleLike || "";
  const roleLike = humanize(roleLikeRaw);
  const subRoles =
    (Array.isArray(actor?.subRole) && actor?.subRole) ||
    (Array.isArray(actor?.subRoles) && actor?.subRoles) ||
    (Array.isArray(actor?.businessProfile?.subRoles) && actor?.businessProfile?.subRoles) ||
    [];
  const firstSubRole = humanize(subRoles[0] || "");
  const metaChip3 =
    roleLikeRaw === "BusinessOwner"
      ? (roleLike || "Business Owner")
      : (firstSubRole || roleLike || "—");

  // Avatar / logo
  const avatarUrlServer =
    (isAtt && actor?.personal?.profilePic) ||
    (isSpk && actor?.personal?.profilePic) ||
    (isExh && actor?.identity?.logo) ||
    "";
  const [avatar, setAvatar] = useState(imageLink(avatarUrlServer));
  React.useEffect(() => {
    setAvatar(imageLink(avatarUrlServer));
  }, [avatarUrlServer]);

  const joinedAt = safeDate(actor?.createdAt);
  const verified = !!actor?.verified;
  const adminVerified = actor?.adminVerified;
  const eventTitle = event?.title || "";
  const eventDates =
    event?.startDate && event?.endDate
      ? `${safeDate(event.startDate)} – ${safeDate(event.endDate)}`
      : "";

  // Tabs
  const tabs = React.useMemo(() => Panels.getTabs(r), [r]);
  const defaultKey = initialTabKey || (tabs[0]?.key || "identity");
  const [tabKey, setTabKey] = useState(defaultKey);
  React.useEffect(() => {
    if (!tabs.find((t) => t.key === tabKey)) {
      setTabKey(tabs[0]?.key || "identity");
    }
  }, [r, tabs, tabKey]);

  // Avatar change (upload) with cropping
  const [localPreview, setLocalPreview] = useState("");
  const [showCropper, setShowCropper] = useState(false);
  const [cropImage, setCropImage] = useState("");
  const [changingError, setChangingError] = useState(null);
  const [changePP, { isLoading: isUploading }] = useChangePPMutation() || [
    {},
    { isLoading: false },
  ];
  const fileRef = useRef(null);
  const cropperRef = useRef(null);
  const actorId = actor?._id || actor?.id || null;
  const actorEmail = (actor?.personal?.email) || (actor?.identity?.email) || "";
  const [triggerResend] = useLazyResendVerificationQuery();

  // Popup action bus: resend-verification
  React.useEffect(() => {
    function onPopupAction(e) {
      const a = e?.detail || {};
      if (a.action === "resend-verification" && actorId) {
        triggerResend(actorId)
          .unwrap()
          .then(() => {
            const ok = {
              type: "success",
              title: t("profileShell.popups.verifySentTitle", "Verification e-mail sent"),
              body: t("profileShell.popups.verifySentBody", {
                email: actorEmail || t("profileShell.defaults.yourEmail", "your email"),
                defaultValue: "We sent a new verification link to {{email}}.",
              }),
              ts: Date.now(),
              showOnce: true,
            };
            const list = JSON.parse(localStorage.getItem("popups") || "[]");
            list.unshift(ok);
            localStorage.setItem("popups", JSON.stringify(list));
            window.dispatchEvent(new CustomEvent("app:popup:ready"));
          })
          .catch(() => {
            const err = {
              type: "danger",
              title: t("profileShell.popups.verifyFailTitle", "Could not send verification"),
              body: t("profileShell.popups.verifyFailBody", "Please try again in a moment."),
              ts: Date.now(),
              showOnce: true,
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
  }, [actorId, actorEmail, triggerResend, t]);

  // Persistent verify popup
  React.useEffect(() => {
    if (!actorId || verified) return;
    const id = `verify:${actorId}`;
    const list = JSON.parse(localStorage.getItem("popups") || "[]");
    const already = Array.isArray(list) && list.some((p) => p && p.__id === id);
    if (!already) {
      const item = {
        __id: id,
        type: "info",
        title: t("profileShell.verifyPopup.title", "Verify your e-mail"),
        body: t("profileShell.verifyPopup.body", {
          defaultValue:
            "Your account is not verified yet.\n\n" +
            "Click the button below to receive a new verification e-mail.\n" +
            "It includes your PDF with sessions, QR code, and the verification token.",
        }),
        ts: Date.now(),
        showOnce: true,
        link: {
          label: t("profileShell.verifyPopup.linkLabel", "Send verification"),
          href: "#",
          action: "resend-verification",
          closeOnClick: true,
        },
      };
      list.unshift(item);
      localStorage.setItem("popups", JSON.stringify(list));
    }
    window.dispatchEvent(new CustomEvent("app:popup:ready"));
  }, [actorId, verified, t]);

  // Image handling
  const onOpenPicker = () => {
    if (fileRef.current && !loading && !isUploading) fileRef.current.click();
  };

  const onKeyOpenPicker = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onOpenPicker();
    }
  };

  const onEditProfilePicture = () => {
    if (avatar && !loading && !isUploading) {
      setCropImage(avatar);
      setShowCropper(true);
    } else {
      onOpenPicker();
    }
  };

  const onPickFile = (e) => {
    try {
      setChangingError(null);
      const f = e.target.files && e.target.files[0];
      if (!f) return;
      // Validate file type and size
      if (!f.type.startsWith("image/")) {
        setChangingError(t("profileShell.errors.invalidImage", "Please select a valid image file"));
        return;
      }
      if (f.size > 5 * 1024 * 1024) {
        setChangingError(t("profileShell.errors.imageTooLarge", "Image size must be less than 5MB"));
        return;
      }
      const url = URL.createObjectURL(f);
      setCropImage(url);
      setShowCropper(true);
    } catch (err) {
      setChangingError(t("profileShell.errors.ppFailed", "Failed to process image."));
      setLocalPreview("");
    }
  };

  const handleCrop = async () => {
    const cropper = cropperRef.current?.cropper;
    if (cropper) {
      try {
        setChangingError(null);
        const croppedCanvas = cropper.getCroppedCanvas({
          width: 300,
          height: 300,
          fillColor: "#fff",
          imageSmoothingEnabled: true,
          imageSmoothingQuality: "high",
        });
        // Convert canvas to File object for changePP
        const blob = await new Promise((resolve) =>
          croppedCanvas.toBlob(resolve, "image/jpeg", 0.8)
        );
        const file = new File([blob], "profile-picture.jpg", { type: "image/jpeg" });
        setLocalPreview(URL.createObjectURL(file));
        const res = await changePP({ actorId, file }).unwrap?.();
        setAvatar(imageLink(res?.url || ""));
        setTimeout(() => URL.revokeObjectURL(cropImage), 5000);
        setCropImage("");
        setShowCropper(false);
      } catch (err) {
        setChangingError(t("profileShell.errors.ppFailed", "Failed to update profile picture."));
        setLocalPreview("");
      } finally {
        if (fileRef.current) fileRef.current.value = "";
      }
    }
  };

  const handleCancelCrop = () => {
    if (cropImage) {
      URL.revokeObjectURL(cropImage);
    }
    setCropImage("");
    setShowCropper(false);
    setLocalPreview("");
    if (fileRef.current) fileRef.current.value = "";
  };

  // Business Profile intent
  const haveBpp = actor?.bp;
  const businessUrl = haveBpp ? "/BusinessProfile/dashboard" : "/BusinessProfile/form";
  const businessText = haveBpp
    ? t("profileShell.buttons.businessProfile", "Business profile")
    : t("profileShell.buttons.createBusinessProfile", "Create business profile");

  // Public profile URL + QR
  const baseUrl = React.useMemo(() => {
    if (typeof window === "undefined") return "";
    try {
      const { origin, pathname } = window.location;
      return `${origin}${pathname}`.replace(/\/+$/, "");
    } catch {
      return "";
    }
  }, []);
  const publicUrl = React.useMemo(() => {
    if (!baseUrl) return "";
    return actorId ? `${baseUrl}/${actorId}` : baseUrl;
  }, [baseUrl, actorId]);
  const [qrOpen, setQrOpen] = useState(false);
  const qrSrc = React.useMemo(() => {
    const u = publicUrl || "";
    const size = 320;
    const margin = 10;
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=${margin}&data=${encodeURIComponent(u)}`;
  }, [publicUrl]);

  // Labels & chips
  const roleChipLabel = r || "—";
  const summaryRoleLabel = roleLike || "—";
  const eventChipClass = `ps-badge ${adminVerified === "yes" ? "" : "-warn"}`;
  const verifyLabel =
    adminVerified === "yes"
      ? t("profileShell.status.validated", "Validated")
      : t("profileShell.status.notValidated", "Not Validated");

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
              aria-label={t("profileShell.aria.changeProfilePic", "Change profile picture")}
              onClick={onOpenPicker}
              onKeyDown={onKeyOpenPicker}
            >
              {!loading && (localPreview || avatar) ? (
                <img
                  src={localPreview || avatar}
                  alt={t("profileShell.alt.profile", "Profile")}
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
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
            {/* Meta + Actions */}
            <div className="ps-idmeta">
              <div className="ps-meta">
                <h1 className="ps-name">{loading ? "\u00A0" : fullName || orgName || "—"}</h1>
                <div className="ps-meta-row">
                  <span className="ps-rolechip">{roleChipLabel}</span>
                  {orgName ? (
                    <span className="ps-org">{orgName}</span>
                  ) : (
                    <span className="ps-org ps-muted">—</span>
                  )}
                  <span className="ps-email">{metaChip3}</span>
                  {joinedAt ? (
                    <span className="ps-joined">
                      {t("profileShell.joined", "Joined")} {joinedAt}
                    </span>
                  ) : null}
                </div>
                {changingError ? (
                  <div className="ps-pp-err" role="alert">
                    {changingError}
                  </div>
                ) : null}
              </div>
              {/* ACTIONS */}
              <div className="ps-actions">
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
                {actorId ? (
                  <a
                    className="ps-btn ps-primary"
                    href={publicUrl}
                    target="_blank"
                    rel="noreferrer"
                    title={publicUrl}
                  >
                    <FiExternalLink />
                    {t("profileShell.buttons.publicProfile", "Public profile")}
                  </a>
                ) : (
                  <button
                    className="ps-btn ps-primary"
                    disabled
                    title={t("profileShell.titles.missingId", "Missing id")}
                  >
                    <FiExternalLink />
                    {t("profileShell.buttons.publicProfile", "Public profile")}
                  </button>
                )}
                <button
                  type="button"
                  className="ps-btn ps-ghost"
                  onClick={() => setQrOpen(true)}
                  disabled={!publicUrl}
                  title={
                    publicUrl
                      ? t("profileShell.qr.showTitle", "Show QR code")
                      : t("profileShell.qr.missingUrl", "Missing URL")
                  }
                  aria-haspopup="dialog"
                  aria-controls="ps-qr-dialog"
                >
                  <FiShare2 />
                  {t("profileShell.buttons.qr", "QR code")}
                </button>
                {avatar && (
                  <button
                    type="button"
                    className="ps-btn ps-ghost"
                    onClick={onEditProfilePicture}
                    disabled={loading || isUploading}
                  >
                    <FiEdit />
                    {t("profileShell.buttons.editPicture", "Edit profile picture")}
                  </button>
                )}
              </div>
            </div>
          </div>
          {/* Summary strip */}
          <div className="ps-sumstrip">
            <div className="ps-sumitem">
              <div className="ps-sumlabel">{t("profileShell.summary.eventLabel", "Event")}</div>
              <div className="ps-sumvalue">
                {eventTitle ? (
                  <span className={eventChipClass}>{eventTitle}</span>
                ) : (
                  <span className="ps-muted">
                    {t("profileShell.summary.noEvent", "No event linked")}
                  </span>
                )}
              </div>
              {eventDates ? <div className="ps-subnote">{eventDates}</div> : null}
            </div>
            <div className="ps-sumitem">
              <div className="ps-sumlabel">{t("profileShell.summary.accountLabel", "Account")}</div>
              <div className="ps-sumvalue">
                <span className={`ps-badge ${adminVerified === "yes" ? "-ok" : "-warn"}`}>
                  {verifyLabel}
                </span>
              </div>
              <div className="ps-subnote">
                {adminVerified === "yes"
                  ? t("profileShell.summary.validatedBy", "Validated by Event's Admin ✓")
                  : adminVerified === "pending"
                  ? t("profileShell.summary.pending", "Please Wait Event's Admin Validation...")
                  : t("profileShell.summary.refused", "Refused by Event's Admin X")}
              </div>
            </div>
            <div className="ps-sumitem">
              <div className="ps-sumlabel">{t("profileShell.summary.roleLabel", "Role")}</div>
              <div className="ps-sumvalue">
                <span className="ps-badge -outline">{summaryRoleLabel}</span>
              </div>
              <div className="ps-subnote">
                {isExh
                  ? t("profileShell.summary.exhibitorProfile", "Exhibitor profile")
                  : isSpk
                  ? t("profileShell.summary.speakerProfile", "Speaker profile")
                  : t("profileShell.summary.attendeeProfile", "Attendee profile")}
              </div>
            </div>
          </div>
        </div>
        {loadError ? (
          <div className="ps-loaderr">
            {t(
              "profileShell.loadError",
              "We couldn’t load everything. You can still view & edit available sections."
            )}
          </div>
        ) : null}
      </header>
      {/* TABS */}
      <nav className="ps-tabs" role="tablist" aria-label={t("profileShell.tabs.aria", "Profile sections")}>
        {tabs.map((tItem) => (
          <button
            key={tItem.key}
            className={`ps-tab ${tabKey === tItem.key ? "is-active" : ""}`}
            role="tab"
            aria-selected={tabKey === tItem.key}
            aria-controls={`panel-${tItem.key}`}
            id={`tab-${tItem.key}`}
            type="button"
            onClick={() => setTabKey(tItem.key)}
          >
            {tItem.icon ? (
              <span className="ps-tabicon" aria-hidden="true">
                {tItem.icon}
              </span>
            ) : null}
            <span className="ps-tabtxt">{tItem.label}</span>
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
      {/* QR Modal */}
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
            aria-label={t("profileShell.qr.ariaLabel", "Public profile QR")}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="ps-qr-close"
              onClick={() => setQrOpen(false)}
              aria-label={t("profileShell.qr.close", "Close")}
            >
              <FiX />
            </button>
            <div className="ps-qr-title">{t("profileShell.qr.title", "Scan to open public profile")}</div>
            <div className="ps-qr-img">
              <img
                src={qrSrc}
                alt={t("profileShell.qr.alt", "QR code for public profile")}
              />
            </div>
            <a
              className="ps-qr-url"
              href={publicUrl}
              target="_blank"
              rel="noreferrer"
              title={publicUrl}
            >
              {publicUrl}
            </a>
          </div>
        </div>
      )}
      {/* Cropper Modal */}
      {showCropper && (
        <div className="ps-crop-backdrop" onClick={handleCancelCrop} role="presentation">
          <div
            className="ps-crop"
            role="dialog"
            aria-modal="true"
            aria-label={t("profileShell.crop.ariaLabel", "Crop profile picture")}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="ps-crop-close"
              onClick={handleCancelCrop}
              aria-label={t("profileShell.crop.close", "Close")}
            >
              <FiX />
            </button>
            <div className="ps-crop-title">{t("profileShell.crop.title", "Crop your profile picture")}</div>
            <div className="ps-crop-instructions">
              {t("profileShell.crop.instructions", "Zoom in and out with your mouse wheel or pinch gesture. Drag to adjust the crop area.")}
            </div>
            <Cropper
              src={cropImage}
              style={{ height: 400, width: "100%" }}
              aspectRatio={1}
              guides={true}
              viewMode={1}
              minCropBoxHeight={100}
              minCropBoxWidth={100}
              background={false}
              responsive={true}
              autoCropArea={0.8}
              checkOrientation={false}
              zoomable={true}
              zoomOnWheel={true}
              wheelZoomRatio={0.1}
              ref={cropperRef}
            />
            <div className="ps-crop-actions">
              <button
                className="ps-btn ps-primary"
                onClick={handleCrop}
                disabled={isUploading}
              >
                {t("profileShell.crop.crop", "Crop and Save")}
              </button>
              <button
                className="ps-btn ps-ghost"
                onClick={handleCancelCrop}
              >
                {t("profileShell.crop.cancel", "Cancel")}
              </button>
            </div>
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