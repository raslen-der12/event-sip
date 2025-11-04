import { apiSlice } from "../../app/api/apiSlice"
export const toolsApiSlice = apiSlice.injectEndpoints({
    endpoints: builder => ({
        getMeetings: builder.query({
            query: (ActorId) => ({
                url: '/meets',
                method: 'GET',
            }),
            transformResponse: (res) => {
                return res?.data ?? res;
            },
            providesTags: (result) =>
                result ? [{ type: 'Meetings', id: result.id }] : []
        }),
        getSuggestedList: builder.query({
            query: (ActorId) => ({
                url: '/meets/suggested',
                method: 'GET',
            }),
            transformResponse: (res) => {
                return res?.data ?? res;
            },
            providesTags: (result) =>
                result ? [{ type: 'SuggestedMeetings', id: result.id }] : []
        }),
        makeMeetingAction: builder.mutation({
            query: ({ meetingId, action, actorId, proposedNewAt }) => ({
                url: "/meets/actions",
                method: "POST",
                body: { meetingId, action, actorId, proposedNewAt },
            }),
            invalidatesTags: ["Meetings"],
        }),
        adminListMeets: builder.query({
      query: (params = {}) => {
        // GET /meets/admin/meets?eventId=&status=&q=&from=&to=
        const sp = new URLSearchParams();
        if (params.eventId) sp.set('eventId', params.eventId);
        if (params.status) sp.set('status', params.status);
        if (params.q)      sp.set('q', params.q);
        if (params.from)   sp.set('from', params.from);
        if (params.to)     sp.set('to', params.to);
        return `/meets/admin/meets?${sp.toString()}`;
      },
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map((m) => ({ type: 'Meet', id: m._id })),
              { type: 'Meet', id: 'LIST' },
            ]
          : [{ type: 'Meet', id: 'LIST' }],
    }),

    adminGetMeet: builder.query({
      // GET /admin/meets/:id
      query: (id) => `meets/admin/meets/${id}`,
      providesTags: (res, err, id) => [{ type: 'Meet', id }],
    }),

    adminCalendar: builder.query({
      // GET /meets/admin/meets/calendar?eventId=&from=&to=
      query: (params = {}) => {
        const sp = new URLSearchParams();
        if (params.eventId) sp.set('eventId', params.eventId);
        if (params.from)    sp.set('from', params.from);
        if (params.to)      sp.set('to', params.to);
        return `/meets/admin/meets/calendar?${sp.toString()}`;
      },
      providesTags: (_res, _err, params) => [{ type: 'MeetCalendar', id: params?.eventId || 'ALL' }],
    }),

    adminMeetStats: builder.query({
      // GET /meets/admin/meets/stats/:eventId
      query: (eventId) => `/meets/admin/meets/stats/${eventId}`,
      providesTags: (_res, _err, id) => [{ type: 'MeetStats', id }],
    }),
    // ───────────── Admin Mutations ─────────────
    adminCreateMeet: builder.mutation({
      // POST /admin/meets
      query: (body) => ({
        url: 'meets/admin/meets',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Meet', id: 'LIST' }],
    }),

    adminDeleteMeet: builder.mutation({
      // DELETE /meets/admin/meets/:id
      query: (id) => ({ url: `/meets/admin/meets/${id}`, method: 'DELETE' }),
      invalidatesTags: (_res, _err, id) => [
        { type: 'Meet', id },
        { type: 'Meet', id: 'LIST' },
      ],
    }),

    // Not used on this page, but requested:
    adminMarkAttendance: builder.mutation({
      // POST /meets/admin/meets/:id/attendance
      // body: { actorId, attended: true|false, mode: 'physical'|'virtual' }
      query: ({ id, ...body }) => ({
        url: `/meets/admin/meets/${id}/attendance`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_res, _err, { id }) => [
        { type: 'Meet', id },
        { type: 'Meet', id: 'LIST' },
        { type: 'MeetStats', id: 'ANY' },
      ],
    }),

    adminSetVirtualLink: builder.mutation({
      // POST /meets/admin/meets/:id/link
      // body: { link }
      query: ({ id, link }) => ({
        url: `/meets/admin/meets/${id}/link`,
        method: 'POST',
        body: { link },
      }),
      invalidatesTags: (_res, _err, { id }) => [
        { type: 'Meet', id },
        { type: 'Meet', id: 'LIST' },
      ],
    }),
    adminListSlots: builder.query({
    query: ({ eventId, from, to, tz }) => ({
      url: `/meets/admin/meets/slots`,
      params: { eventId, from, to, tz }
    })
  }),
  adminRescheduleMeet: builder.mutation({
    query: ({ id, slotISO }) => ({ url: `/meets/admin/meets/${id}/reschedule`, method:'PUT', body:{ slotISO } })
  }),
  adminSetTable: builder.mutation({
    query: ({ id, tableId }) => ({ url: `/meets/admin/meets/${id}/table`, method:'PUT', body:{ tableId } })
  }),
  getMyWhitelist: builder.query({
      query: ({ eventId, date, actorId }) =>
        `/meets/${eventId}/my?date=${encodeURIComponent(date)}&actorId=${encodeURIComponent(actorId)}`,
      providesTags: (r) => (r?.data ? [{ type: "Whitelist", id: "MY" }] : []),
    }),
    upsertMyWhitelist: builder.mutation({
      query: ({ eventId, date, slots , actorId }) => { console.log(actorId); return (
        {
        url: `/meets/${eventId}/my`,
        method: "POST",
        body: { date, slots , actorId },
      })},
      invalidatesTags: [{ type: "Whitelist", id: "MY" }],
    }),
    adminScanActorAttend: builder.mutation({
      query: (body) => ({ url: `/meets/admin/scan/actor-attend`, method: 'POST', body }),
    }),
    adminScanSession: builder.mutation({
      query: (body) => ({
        url: "/meets/admin/scan/session",
        method: "POST",
        body,
      }),
    }),
    adminScanMeet: builder.mutation({
      query: (body) => ({
        url: "/meets/admin/scan/meet",
        method: "POST",
        body,
      }),
    }),


    // ───────────── Export ─────────────
    exportConfirmedMeets: builder.query({
      // returns a URL we can navigate to (download)
      query: ({ eventId }) => `/admin/meets/export/confirmed?eventId=${encodeURIComponent(eventId)}`,
    }),
    listEventSessionsMini: builder.query({
      // takes eventId string
      query: (eventId) => ({
        url: `meets/admin/events/${eventId}/sessions-mini`,
        method: "GET",
      }),
    }),
    })
})

export const {
    useGetMeetingsQuery,
    useGetSuggestedListQuery,
    useMakeMeetingActionMutation,
    useAdminListMeetsQuery,
    useAdminGetMeetQuery,
    useAdminCalendarQuery,
    useAdminMeetStatsQuery,
    useAdminCreateMeetMutation,
    useAdminDeleteMeetMutation,
    useAdminMarkAttendanceMutation, // exported for other admin pages
    useAdminSetVirtualLinkMutation, // exported for other admin pages
    useListMeetingRemindersQuery,
    useAdminListSlotsQuery,
    useAdminRescheduleMeetMutation,
    useAdminSetTableMutation,
    useGetMyWhitelistQuery,
    useUpsertMyWhitelistMutation,
    useAdminScanActorAttendMutation,
    useAdminScanSessionMutation,
    useAdminScanMeetMutation,
    useExportConfirmedMeetsQuery, 
    useListEventSessionsMiniQuery
} = toolsApiSlice