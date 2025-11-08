import { apiSlice } from "../../app/api/apiSlice";

const unwrap = (res) => {
  if (!res) return res;
  if (res.data != null && (res.success === true || res.success === false))
    return res.data;
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

export const toolsApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAttendeeForm: builder.query({
      query: () => "/attendee/form",
    }),
    autoVerify: builder.mutation({
      query: (data) => ({
        url: "/auth/verify-email",
        method: "POST",
        body: { ...data },
      }),
    }),
    getProfile: builder.query({
      query: ({ id, role }) => ({
        url: `/actors/profile`,
        method: "POST",
        body: { id, role },
      }),
      transformResponse: (res) => {
        res.data.id = res?.data?._id;
        return res?.data ?? res;
      },
      providesTags: (result, error, arg) =>
        result ? [{ type: "Profile", id: arg?.id }] : [],
    }),
    updateProfile: builder.mutation({
      query: ({ id, role, data }) => ({
        url: "/actors/profile/update", // adjust if your backend uses another path
        method: "PATCH",
        body: { id, role, data }, // send partial updates
      }),
      transformResponse: (res) => res?.data ?? res,
      invalidatesTags: (_res, _err, arg) => [{ type: "Profile", id: arg?.id }],
    }),
    uploadAvatar: builder.mutation({
      query: (formData) => ({
        url: "/auth/profile/avatar",
        method: "POST",
        body: formData,
      }),
      transformResponse: (res) => res?.data ?? res,
      invalidatesTags: (res, _err, arg) => [{ type: "Profile", id: arg?.id }],
    }),
    uploadCover: builder.mutation({
      query: (formData) => ({
        url: "/auth/profile/cover",
        method: "POST",
        body: formData,
      }),
      transformResponse: (res) => res?.data ?? res,
      invalidatesTags: (res, _err, arg) => [{ type: "Profile", id: arg?.id }],
    }),
    getActorPP: builder.query({
      query: (id) => ({
        url: "actors/actor/profile",
        method: "POST",
        body: { id },
      }),
      transformResponse: (res) => {
        res.data.id = res?.data?._id;
        return res?.data ?? res;
      },
      providesTags: (result, error, arg) =>
        result ? [{ type: "actor", id: arg?.id }] : [],
    }),
    getMeetingExist: builder.query({
      query: ({ senderId, receiverId }) => ({
        url: "meets/exist",
        method: "POST",
        body: { senderId, receiverId },
      }),

      providesTags: (result, error, arg) =>
        result ? [{ type: "meetingExist", id: arg?.id }] : [],
    }),
    getPurpose: builder.query({
      query: () => ({
        url: "actors/actor/meeting/purpose",
        method: "GET",
      }),
      transformResponse: (res) => {
        return res?.data ?? res;
      },
      providesTags: (result, error, arg) =>
        result ? [{ type: "purpose", id: arg?.id }] : [],
    }),
    requestMeeting: builder.mutation({
      query: ({
        eventId,
        receiverId,
        receiverRole,
        dateTimeISO,
        subject,
        message = "",
      }) => ({
        url: `/meets`,
        method: "POST",
        body: {
          eventId,
          receiverId,
          receiverRole,
          dateTimeISO,
          subject,
          message,
        },
      }),
      transformResponse: unwrap,
    }),
    getAllSpeakers: builder.query({
      query: () => ({
        url: "actors/actor/speakers",
        method: "GET",
      }),
      transformResponse: (res) => {
        return res?.data ?? res;
      },
      providesTags: (result, error, arg) =>
        result ? [{ type: "speakers", id: arg?.id }] : [],
    }),
    changePP: builder.mutation({
      query: ({ actorId, file }) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("id", actorId);
        return {
          url: `actors/profile/picture`,
          method: "POST",
          body: formData,
        };
      },
      transformResponse: (res) => res?.data ?? res,
      invalidatesTags: (res, _err, arg) => [
        { type: "Profile", id: arg?.actorId },
      ],
    }),
    getActorsToChat: builder.query({
      query: (data) => ({
        url: `actors/suggestions`,
        method: "POST",
        body: { ...data },
      }),
      transformResponse: (res) => {
        return res?.data ?? res;
      },
      providesTags: (result, error, arg) =>
        result ? [{ type: "actorsToChat", id: arg?.id }] : [],
    }),
    getAvailableSlots: builder.query({
      query: ({ eventId, actorId, date ,ignoreWhitelist }) => ({
        url: `meets/events/${eventId}/available-slots${qs({ actorId, date , ignoreWhitelist : ignoreWhitelist ? 1 : undefined  })}`,
        method: "GET",
      }),
    }),
    listActorNotifications: builder.query({
      query: () => ({
        url: '/actors/me/notifications',
        method: 'GET'
      }),
      transformResponse: (resp) => resp?.data ?? [],
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ _id }) => ({ type: 'ActorNotification', id: _id })),
              { type: 'ActorNotification', id: 'LIST' },
            ]
          : [{ type: 'ActorNotification', id: 'LIST' }],
    }),
    ackActorNotification: builder.mutation({
      query: (arg) => {
        const id = typeof arg === 'string' ? arg : arg?.id;
        if (!id) throw new Error('ackActorNotification: id is required');
        return {
          url: `/actors/me/notifications/${encodeURIComponent(id)}/ack`,
          method: 'PATCH',
        };
      },
      invalidatesTags: (_res, _err, { id }) => [
        { type: 'ActorNotification', id },
        { type: 'ActorNotification', id: 'LIST' },
      ],
    }),
    getMeetingPrefs: builder.query({
      query: (actorId) => ({
        url: `/meets/meetings/prefs/${actorId}`,
        method: 'GET'
      }),
      providesTags: (res, err, id) => [{ type:'MeetingPrefs', id }]
    }),
    siteSearch: builder.query({
      query: ({ q = "", tags = [], limit = 20 } = {}) => {
        const qs = new URLSearchParams();
        if (q) qs.set("q", q);
        if (tags?.length) qs.set("tags", tags.join(","));
        if (limit) qs.set("limit", String(limit));
        return `/search?${qs.toString()}`;
      },
      transformResponse: (resp) => resp?.data ?? [],
      keepUnusedDataFor: 60,
    }),
    suggestTags: builder.query({
      query: () => `/search/suggest-tags`,
      transformResponse: (resp) => resp?.tags ?? [],
      keepUnusedDataFor: 300,
    }),
    resolveShareLink: builder.query({
      query: ({ actorId, eventId }) => ({
        url: `/share/${actorId}/${eventId}`,
        method: "GET",
      }),
      transformResponse: (res) => res?.data || res,
      providesTags: (_res, _err, args) => [{ type: "Share", id: `${args.actorId}_${args.eventId}` }],
    }),
    listSpeakerSessions: builder.query({
      query: ({ speakerId, eventId } = {}) => ({
        url: `/actors/speakers/${speakerId}/sessions`,
        method: "GET",
        params: eventId ? { eventId } : undefined,
      }),
      // normalize to always return an array in .data
      transformResponse: (res) => (Array.isArray(res?.data) ? res : { ...res, data: [] }),
      providesTags: (result, error, args) => [
        { type: "SpeakerSessions", id: args?.speakerId || "LIST" },
      ],
      keepUnusedDataFor: 60,
    }),
    getUnreadCounts: builder.query({
      query: () => ({ url: `/actors/chat/recent`, method: 'GET' }),
      transformResponse: unwrap,
      providesTags: (_res) => [{ type: 'UnreadCounts', id: 'MAP' }],
    }),
  }),
});

export const {
  useGetAttendeeFormQuery,
  useAutoVerifyMutation,
  useGetProfileQuery,
  useUpdateProfileMutation,
  useUploadAvatarMutation,
  useUploadCoverMutation,
  useGetActorPPQuery,
  useGetMeetingExistQuery,
  useGetPurposeQuery,
  useRequestMeetingMutation,
  useGetAllSpeakersQuery,
  useChangePPMutation,
  useGetActorsToChatQuery,
  useGetAvailableSlotsQuery,
  useListActorNotificationsQuery,
  useAckActorNotificationMutation,
  useGetMeetingPrefsQuery,
  useResolveShareLinkQuery,
  useListSpeakerSessionsQuery,
  useGetUnreadCountsQuery
} = toolsApiSlice;
