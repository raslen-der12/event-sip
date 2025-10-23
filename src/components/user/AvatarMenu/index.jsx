import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../../../lib/hooks/useAuth";
import { useGetProfileQuery } from "../../../features/Actor/toolsApiSlice";
import "./avatar-menu.css";
import { useSendLogoutMutation } from "../../../features/auth/authApiSlice";
import imageLink from "../../../utils/imageLink";

export default function AvatarMenu() {
     const [sendLogout, {
      isLoading : logoutLoading,
      isSuccess,
  }] = useSendLogoutMutation()
  const nav = useNavigate();
  const { role, ActorId, status } = useAuth();
  const isAuthed = status !== "Guest" && !!ActorId;

  // Fetch light profile data (will be cached for /profile page)
  const { data: profile, isLoading } = useGetProfileQuery(
    { id: ActorId, role },
    { skip: !isAuthed }
  );

   let pic =
    profile?.personal?.profilePic ||
    profile?.identity?.orgLogo ||
    profile?.identity?.logo ||
    null;

  const displayName =
    profile?.personal?.fullName ||
    profile?.identity?.exhibitorName ||
    profile?.identity?.contactName ||
    "User";

  const initials = displayName
    .split(/\s+/)
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  if (!isAuthed) return null;

  return (
    <div className={`avatar-menu ${open ? "open" : ""}`} ref={ref}>
      <button
        className="avatar-btn"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {isLoading ? (
          <span className="avatar-skel" />
        ) : pic ? (
          <img src={imageLink(pic)} alt={displayName} />
        ) : (
          <span className="avatar-initials">{initials}</span>
        )}
      </button>

      <div className="avatar-dd" role="menu">
        <div className="avatar-info">
          <div className="avatar-name">{displayName}</div>
          <div className="avatar-role">{role}</div>
        </div>

        <button
          className="avatar-item"
          onClick={() => {
            setOpen(false);
            nav("/profile");
          }}
        >
          View profile
        </button>

        <button
          className="avatar-item"
          onClick={() => {
            setOpen(false);
            nav("/meetings");
          }}
        >
          View meetings
        </button>
        <button
          className="avatar-item"
          onClick={() => {
            setOpen(false);
            nav("/sessions");
          }}
        >
          View sessions
        </button>
        <button
          className="avatar-item"
          onClick={() => {
            setOpen(false);
            nav("/messages");
          }}
        >
          View messages
        </button>
        <button
          className="avatar-item"
          onClick={() => {
            setOpen(false);
            nav("/BusinessProfile/dashboard");
          }}
        >
          Edit business profile
        </button>

        <button
          className="avatar-item danger"
          onClick={() => {
            setOpen(false);
            sendLogout();
            localStorage.clear();
            window.location.reload();
            if (isSuccess) {
                console.log("Logout successful");
            }
          }}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
