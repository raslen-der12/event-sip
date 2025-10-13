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
        url: `/actors/chat/${roomId}${qs({ before, limit })}`,
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
} = actorsChatApi;
