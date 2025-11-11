// src/features/Actor/actorsChatApiSlice.js
import { apiSlice } from '../../app/api/apiSlice';
const unwrap = (res) => {
  if (!res) return res;
  if (res.data != null && (res.success === true || res.success === false)) return res.data;
  return res;
};

const qs = (o = {}) => {
  const sp = new URLSearchParams();
  Object.entries(o).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return;
    sp.set(k, String(v));
  });
  const s = sp.toString();
  return s ? `?${s}` : ''; // ✅ fixed
};

export const actorsChatApi = apiSlice.injectEndpoints(
  {
  endpoints: (builder) => ({

    // Ensure/create DM (peerId required)
    ensureDM: builder.mutation({
      query: ({ peerId }) => ({
        url: `/actors/chat`,
        method: 'POST',
        body: { peerId }, // backend derives senderId from token
      }),
      transformResponse: unwrap,
    }),

    // List my rooms
    getMyRooms: builder.query({
      query: () => ({ url: `/actors/chat`, method: 'GET' }),
      transformResponse: unwrap,
      providesTags: (result) => {
        const items = Array.isArray(result?.data) ? result.data : (Array.isArray(result) ? result : []);
        return items?.length
          ? [...items.map((r) => ({ type: 'Room', id: String(r?._id || r?.id) })), { type: 'Room', id: 'LIST' }]
          : [{ type: 'Room', id: 'LIST' }];
      },
    }),

    // Room messages
    getRoomMessages: builder.query({
      query: ({ roomId, before, limit = 40 }) => ({
        url: `/actors/chat/${roomId}/messages${qs({ before, limit })}`,
        method: 'GET',
      }),
      transformResponse: unwrap,
      providesTags: (_res, _err, arg) => [{ type: 'RoomMessages', id: String(arg?.roomId) }],
    }),

    // Send message (REST fallback if socket not used)
    sendMessage: builder.mutation({
      query: ({ roomId, text = '', files = [] }) => ({
        url: `/actors/chat/${roomId}`,
        method: 'POST',
        body: { text, files }, // files as URL strings (see component)
      }),
      transformResponse: unwrap,
    }),

    // Mark seen
    markSeen: builder.mutation({
      query: ({ roomId, msgIds }) => ({
        url: `/actors/chat/${roomId}/seen`,
        method: 'PATCH',
        body: { msgIds },
      }),
      transformResponse: unwrap,
    }),

    // Upload files
    uploadFiles: builder.mutation({
      query: ({ roomId, files }) => {
        const fd = new FormData();
        Array.from(files || []).forEach((f) => fd.append('files', f));
        return { url: `/actors/chat/${roomId}/files`, method: 'POST', body: fd };
      },
      transformResponse: unwrap,
    }),

    // Delete message (2-min rule server-side)
    deleteMessageGlobal: builder.mutation({
      query: ({ msgId }) => ({
        url: `/actors/chat/msg/${msgId}`,
        method: 'DELETE',
      }),
      transformResponse: unwrap,
    }),

    // Search across my rooms
    searchChat: builder.query({
      query: ({ q, limit = 50 }) => ({
        url: `/actors/chat/search${qs({ q, limit })}`,
        method: 'GET',
      }),
      transformResponse: unwrap,
    }),
    getAttendeesForMeeting: builder.query({
  query: (args = {}) => {
    const p = new URLSearchParams();
    if (args.eventId) p.set("eventId", args.eventId);
    if (args.country) p.set("country", args.country);
    if (args.q)       p.set("q", args.q);
    if (args.meId)    p.set("meId", args.meId);

    // always explicit booleans (no empty values)
    p.set("onlyOpen", (args.onlyOpen === false) ? "false" : "true");
    if (typeof args.attendedOnly !== "undefined") {
      p.set("attendedOnly", args.attendedOnly ? "true" : "false");
    }

    if (args.limit) p.set("limit", String(args.limit));
    return { url: `/actors/attendees/for-meeting?${p.toString()}` };
  },
  transformResponse: (res) => {
    const rows = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
    return rows.map((a) => {
      const id = a?._id || a?.id;
      const A = a?.personal || {};
      const B = a?.organization || {};
      const M = a?.matchingIntent || {};
      return {
        _id: id,
        id_event: a?.id_event || a?.eventId || null,
        fullName: A.fullName || "",
        email: A.email || "",
        country: A.country || "",
        city: A.city || "",
        profilePic: A.profilePic || "",
        langs: Array.isArray(A.preferredLanguages) ? A.preferredLanguages : [],
        orgName: B.orgName || "",
        jobTitle: B.jobTitle || "",
        openMeetings: !!M.openToMeetings,
        objectives: Array.isArray(M.objectives) ? M.objectives : [],
        links: a?.links || {},
        verified: !!a?.verified,
        matchPct : typeof a?.matchPct === 'number' ? a.matchPct : 0,
      };
    });
  },
})
  }),
  overrideExisting: true,
});

export const {
  useEnsureDMMutation,
  useGetMyRoomsQuery,
  useGetRoomMessagesQuery,
  useSendMessageMutation,
  useMarkSeenMutation,
  useUploadFilesMutation,
  useDeleteMessageGlobalMutation,
  useSearchChatQuery,
  useGetAttendeesForMeetingQuery 
} = actorsChatApi;
