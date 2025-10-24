// src/hooks/useAuth.js
import { useSelector } from 'react-redux';
import { selectCurrentToken } from "../../features/auth/authSlice";
import { jwtDecode } from 'jwt-decode';

const useAuth = () => {
  const token = useSelector(selectCurrentToken);

  // keep old flags & status defaults
  let isSuper = false;
  let isAdmin = false;
  let isSpeaker = false;
  let isExhibitor = false;
  let isAttendee = false;
  let status = "Guest";

  // old return keys (default/guest)
  let email = '';
  let role = '';
  let ActorId = '';
  let virtualMeet = false;
  // new-but-non-breaking extras (safe defaults)
  let userId = '';
  let subRole = [];
  let actorType = '';
  let actorHeadline = '';

  if (token) {
    try {
      const decoded = jwtDecode(token);
      const info = decoded?.UserInfo || {};

      email = info.email || '';
      role = info.role ?? '';
      ActorId = info.ActorId || '';
      virtualMeet = info.virtualMeet;
      // optional extras if you added them to the token
      userId = info.userId || info.id || info._id || '';
      subRole = Array.isArray(info.subRole) ? info.subRole : (info.subRole ? [info.subRole] : []);
      actorType = info.actorType || '';
      actorHeadline = info.actorHeadline || '';

      // preserve original role logic (no behavior change)
      isSuper = role?.includes?.('super') || false;
      isAdmin = role?.includes?.('admin') || false;
      isSpeaker = role?.includes?.('speaker') || false;
      isExhibitor = role?.includes?.('exhibitor') || false;
      isAttendee = role?.includes?.('attendee') || false;

      if (isSuper) status = "Super";
      if (isAdmin) status = "Admin";
      if (isSpeaker) status = "Speaker";
      if (isExhibitor) status = "Exhibitor";
      if (isAttendee) status = "Attendee";

      // old shape + added token + user bundle
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
        token, // <-- NEW: convenient access for Authorization headers
        user: { // <-- NEW: grouped decoded info (non-breaking addition)
          email,
          role,
          ActorId,
          userId,
          subRole,
          actorType,
          actorHeadline,
          virtualMeet,
          // include raw for future needs without extra decodes
          raw: info
        }
      };
    } catch (_e) {
      // invalid/expired token -> fall through to guest shape below
    }
  }

  // guest / no token fallthrough (unchanged keys, plus token & user)
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
    token: '',   // NEW but harmless
    user: null,  // NEW but harmless
  };
};

export default useAuth;
