// src/features/messages/chatSlice.js
// Admin chat RTK Query endpoints (inject into your existing apiSlice)

import { apiSlice } from "../../app/api/apiSlice";

/* Helpers */
const unwrap = (res) => {
  if (!res) return res;
  // many controllers return { success, data }
  if (Object.prototype.hasOwnProperty.call(res, "data")) return res.data;
  return res;
};

const qs = (o = {}) => {
  const sp = new URLSearchParams();
  Object.entries(o).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    sp.set(k, String(v));
  });
  const s = sp.toString();
  return s ? `?${s}` : "";
};

export const chatApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({

    /* ----------------------------- ROOMS ----------------------------- */

    // GET /admin/chat/rooms?member=&limit=&before=
    getRooms: builder.query({
      query: ({ member, limit, before } = {}) => ({
        url: `/admin/chat/rooms${qs({ member, limit, before })}`,
        method: "GET",
      }),
      transformResponse: unwrap,
      providesTags: (result) => {
        const items = Array.isArray(result?.items)
          ? result.items
          : (Array.isArray(result) ? result : []);
        return items?.length
          ? [
              ...items.map((r) => ({ type: "Room", id: String(r?._id || r?.id) })),
              { type: "Room", id: "LIST" },
            ]
          : [{ type: "Room", id: "LIST" }];
      },
    }),

    // GET /admin/chat/rooms/:roomId
    getRoomInfo: builder.query({
      query: ({ roomId }) => ({
        url: `/admin/chat/rooms/${roomId}`,
        method: "GET",
      }),
      transformResponse: unwrap,
      providesTags: (_res, _err, arg) => [{ type: "Room", id: String(arg?.roomId) }],
    }),

    // POST /admin/chat/room  body:{ aId, bId }
    // (kept here because AdminMessages.jsx calls it; your server must expose this route)
    createRoom: builder.mutation({
      query: ({ aId, bId }) => ({
        url: `/admin/chat/room`,
        method: "POST",
        body: { aId, bId },
      }),
      transformResponse: unwrap,
      invalidatesTags: [{ type: "Room", id: "LIST" }],
    }),

    /* --------------------------- MESSAGES ---------------------------- */

    // GET /admin/chat/rooms/:roomId/messages?before=&limit=
    getRoomMessages: builder.query({
      query: ({ roomId, before, limit = 50 }) => ({
        url: `/admin/chat/rooms/${roomId}/messages${qs({ before, limit })}`,
        method: "GET",
      }),
      transformResponse: unwrap,
      providesTags: (_res, _err, arg) => [{ type: "RoomMessages", id: String(arg?.roomId) }],
    }),

    // POST /admin/chat/rooms/:roomId/system  body:{ text, files?[] }
    sendSystem: builder.mutation({
      query: ({ roomId, text, files }) => ({
        url: `/admin/chat/rooms/${roomId}/system`,
        method: "POST",
        body: files ? { text, files } : { text },
      }),
      transformResponse: unwrap,
      // no invalidation; UI updates via socket 'chat:new' / 'chat:system'
    }),

    // DELETE /admin/chat/messages/:msgId  body:{ reason? }
    deleteMessage: builder.mutation({
      query: ({ msgId, reason }) => ({
        url: `/admin/chat/messages/${msgId}`,
        method: "DELETE",
        body: reason ? { reason } : undefined,
      }),
      transformResponse: unwrap,
    }),

    // POST /admin/chat/rooms/:roomId/files  (FormData: files[])
    uploadFiles: builder.mutation({
      query: ({ roomId, files }) => {
        const fd = new FormData();
        (Array.from(files || [])).forEach((f) => fd.append("files", f));
        return {
          url: `/admin/chat/rooms/${roomId}/files`,
          method: "POST",
          body: fd,
        };
      },
      transformResponse: unwrap,
    }),

    /* ----------------------- BROADCAST / SEARCH ---------------------- */

    // POST /admin/chat/broadcast  body: { title, body, roles? | actorIds?, eventId? }
    broadcast: builder.mutation({
      query: ({ title, body, roles, actorIds, eventId }) => ({
        url: `/admin/chat/broadcast`,
        method: "POST",
        body: {
          title: title ?? "Notice",
          body: body ?? "",
          ...(Array.isArray(actorIds) && actorIds.length ? { actorIds } : {}),
          ...(Array.isArray(roles) && roles.length ? { roles } : {}),
          ...(eventId ? { eventId } : {}),
        },
      }),
      transformResponse: unwrap,
    }),

    // GET /admin/chat/search?q=&limit=
    searchMessages: builder.query({
      query: ({ q, limit = 50 }) => ({
        url: `/admin/chat/search${qs({ q, limit })}`,
        method: "GET",
      }),
      transformResponse: unwrap,
    }),

    // GET /admin/chat/rooms/:roomId/transcript?format=txt|json
    exportTranscript: builder.query({
      query: ({ roomId, format = "txt" }) => ({
        url: `/admin/chat/rooms/${roomId}/transcript${qs({ format })}`,
        method: "GET",
        responseHandler: (response) =>
          format === "json" ? response.json() : response.text(),
      }),
    }),
  }),
  overrideExisting: true,
});

// Hook exports used in AdminMessages.jsx
export const {
  useGetRoomsQuery,
  useGetRoomInfoQuery,
  useGetRoomMessagesQuery,
  useCreateRoomMutation,
  useSendSystemMutation,
  useUploadFilesMutation,
  useBroadcastMutation,
  useSearchMessagesQuery,
  useExportTranscriptQuery,
} = chatApi;
