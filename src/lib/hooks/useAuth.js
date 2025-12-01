// src/lib/hooks/useAuth.js
import { useSelector } from "react-redux";
import { selectCurrentToken } from "../../features/auth/authSlice";
import { jwtDecode } from "jwt-decode";

/**
 * Central place to decode the access token into convenient flags.
 * Backward-compatible with old tokens AND works with v2 tokens.
 */
const useAuth = () => {
  const token = useSelector(selectCurrentToken);

  // role flags
  let isSuper = false;
  let isAdmin = false;
  let isSpeaker = false;
  let isExhibitor = false;
  let isAttendee = false;

  // human friendly status
  let status = "Guest";

  // base fields
  let email = "";
  let role = "";
  let ActorId = "";
  let virtualMeet = false;

  // extended metadata
  let userId = "";
  let subRole = [];
  let actorType = "";
  let actorHeadline = "";
  let rawUserInfo = null;

  if (token) {
    try {
      const decoded = jwtDecode(token);
      const info = decoded?.UserInfo || decoded || {};

      rawUserInfo = info;

      email = info.email || "";
      role = info.role ?? "";
      ActorId = info.ActorId || info.id || info._id || "";
      virtualMeet = Boolean(info.virtualMeet);

      userId =
        info.userId ||
        info.user_id ||
        info.id ||
        info._id ||
        ActorId;

      subRole = Array.isArray(info.subRole)
        ? info.subRole
        : info.subRole
        ? [info.subRole]
        : [];

      actorType = info.actorType || "";
      actorHeadline = info.actorHeadline || "";

      const roleLc = String(role || "").toLowerCase();
      const actorTypeLc = String(actorType || "").toLowerCase();
      const subRoleLc = subRole.map((r) => String(r || "").toLowerCase());

      // detect flags
      isSuper =
        roleLc.includes("super") ||
        subRoleLc.includes("super") ||
        subRoleLc.includes("superadmin");

      isAdmin =
        roleLc === "admin" ||
        roleLc.includes("admin") ||
        subRoleLc.includes("admin");

      isSpeaker =
        roleLc.includes("speaker") ||
        actorTypeLc === "speaker" ||
        actorTypeLc === "speakers" ||
        subRoleLc.includes("speaker");

      isExhibitor =
        roleLc.includes("exhibitor") ||
        actorTypeLc === "exhibitor" ||
        subRoleLc.includes("exhibitor");

      isAttendee =
        roleLc.includes("attendee") ||
        actorTypeLc === "attendee" ||
        subRoleLc.includes("attendee");

      // compute status with sane default for v2 ("user")
      if (isSuper) status = "Super";
      else if (isAdmin) status = "Admin";
      else if (isSpeaker) status = "Speaker";
      else if (isExhibitor) status = "Exhibitor";
      else if (isAttendee) status = "Attendee";
      else if (roleLc === "user" && email) status = "User";
      else if (email) status = "User";

      return {
        email,
        role,
        status,
        isSuper,
        isAdmin,
        isSpeaker,
        isExhibitor,
        isAttendee,
        virtualMeet,
        ActorId,
        token,
        user: {
          email,
          role,
          ActorId,
          userId,
          subRole,
          actorType,
          actorHeadline,
          virtualMeet,
          raw: rawUserInfo,
        },
      };
    } catch {
      // invalid / expired token -> fall through to guest
    }
  }

  // guest / no token
  return {
    email,
    role,
    isSuper,
    isAdmin,
    isSpeaker,
    isExhibitor,
    isAttendee,
    status,
    virtualMeet,
    ActorId,
    token: "",
    user: null,
  };
};

export default useAuth;
