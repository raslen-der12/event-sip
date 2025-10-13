// src/store/chatApi.js
// Injects chat endpoints into your existing base apiSlice.
// Keeps all auth/headers/reauth from your current setup intact.

import { apiSlice } from "../../app/api/apiSlice"; // <-- your working base

export const chatApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // 1) GET /admin/chat
    getRooms: builder.query({
      query: () => ({ url: "/admin/chat", method: "GET" }),
    }),

    // 2) GET /admin/chat/:roomId?before=&limit=40
    getRoomMessages: builder.query({
      query: ({ roomId, before, limit = 40 }) => {
        const qs = new URLSearchParams();
        if (before) qs.set("before", String(before));
        if (limit != null) qs.set("limit", String(limit));
        return {
          url: `/admin/chat/${roomId}${qs.size ? `?${qs.toString()}` : ""}`,
          method: "GET",
        };
      },
    }),

    // 3) POST /admin/chat/:roomId
    sendMessage: builder.mutation({
      query: ({ roomId, text, files }) => ({
        url: `/admin/chat/${roomId}`,
        method: "POST",
        body: { text, ...(files?.length ? { files } : {}) },
      }),
    }),

    // 4) PATCH /admin/chat/:roomId/seen
    markSeen: builder.mutation({
      query: ({ roomId, msgIds }) => ({
        url: `/admin/chat/${roomId}/seen`,
        method: "PATCH",
        body: { msgIds },
      }),
    }),

    // 5) POST /admin/admins/list
    listActors: builder.mutation({
      query: ({ role, limit, search }) => ({
        url: `/admin/admins/list`,
        method: "POST",
        body: {
          role,                          // 'attendee' | 'exhibitor' | 'speaker'
          ...(limit ? { limit } : {}),   // optional
          ...(search ? { search } : {}), // optional
        },
      }),
    }),
  }),
  overrideExisting: false,
});

// EXACT hook names:
export const {
  useGetRoomsQuery,
  useGetRoomMessagesQuery,
  useSendMessageMutation,
  useMarkSeenMutation,
  useListActorsMutation,
} = chatApi;
