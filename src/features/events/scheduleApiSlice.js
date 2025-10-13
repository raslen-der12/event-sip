// src/features/program/programApiSlice.js
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
  return s ? `?${s}` : '';
};

export const programApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    /* ================= ROOMS ================= */

    // GET /program/events/:eventId/rooms
    getEventRooms: builder.query({
      query: ({ eventId }) => ({
        url: `/program/events/${eventId}/rooms`,
        method: 'GET',
      }),
      transformResponse: unwrap,
      providesTags: (_res, _err, arg) => [{ type: 'ProgramRoomList', id: `event:${arg?.eventId}` }],
    }),

    /* =============== SESSIONS (lists) =============== */

    // GET /program/events/:eventId/sessions?day=&roomId=&speakerId=
    getEventSessions: builder.query({
      query: ({ eventId, day, roomId, speakerId } = {}) => ({
        url: `/program/events/${eventId}/sessions${qs({ day, roomId, speakerId })}`,
        method: 'GET',
      }),
      transformResponse: unwrap,
      providesTags: (result, _err, arg) => {
        const rows = Array.isArray(result)
          ? result
          : Array.isArray(result?.data)
          ? result.data
          : [];
        const sessionTags = rows.map((s) => ({ type: 'ProgramSession', id: String(s?._id || s?.id) }));
        return [...sessionTags, { type: 'ProgramSessionList', id: `event:${arg?.eventId}` }];
      },
    }),

    // GET /program/sessions/:sessionId
    getSessionById: builder.query({
      query: ({ sessionId }) => ({
        url: `/program/sessions/${sessionId}`,
        method: 'GET',
      }),
      transformResponse: unwrap,
      providesTags: (_res, _err, arg) => [{ type: 'ProgramSession', id: String(arg?.sessionId) }],
    }),

    // (Optional) GET /program/events/:eventId/days
    getEventDays: builder.query({
      query: ({ eventId }) => ({
        url: `/program/events/${eventId}/days`,
        method: 'GET',
      }),
      transformResponse: unwrap,
      providesTags: (_res, _err, arg) => [{ type: 'ProgramSessionList', id: `event:${arg?.eventId}` }],
    }),

    /* =============== SIGN-UP / CANCEL =============== */

    // POST /program/sessions/:sessionId/signup
    signUpToSession: builder.mutation({
      query: ({ sessionId }) => ({
        url: `/program/sessions/${sessionId}/signup`,
        method: 'POST',
        // body not required; actor inferred from JWT
      }),
      transformResponse: unwrap,
      invalidatesTags: (_res, _err, arg) => [
        { type: 'ProgramSession', id: String(arg?.sessionId) },
        { type: 'MySessions', id: 'LIST' },
        { type: 'ProgramSessionList', id: 'event:ALL' }, // broad nudge for lists
      ],
    }),

    // DELETE /program/sessions/:sessionId/signup
    // (exported with your requested name: useCanselSignUpMutation)
    canselSignUp: builder.mutation({
      query: ({ sessionId }) => ({
        url: `/program/sessions/${sessionId}/signup`,
        method: 'DELETE',
      }),
      transformResponse: unwrap,
      invalidatesTags: (_res, _err, arg) => [
        { type: 'ProgramSession', id: String(arg?.sessionId) },
        { type: 'MySessions', id: 'LIST' },
        { type: 'ProgramSessionList', id: 'event:ALL' },
      ],
    }),

    /* =============== MY SESSIONS =============== */

    // GET /program/my/sessions?eventId=&from=&to=
    getMySessions: builder.query({
      query: ({eventId}) => ({
        url: `/program/mine?eventId=${eventId}`,
        method: 'GET',
      }),
      transformResponse: unwrap,
      providesTags: () => [{ type: 'MySessions', id: 'LIST' }],
    }),

    /* =============== ADMIN (optional) =============== */

    // POST /program/sessions
    createSession: builder.mutation({
      query: (body) => ({
        url: `/program/sessions`,
        method: 'POST',
        body,
      }),
      transformResponse: unwrap,
      invalidatesTags: (res) => {
        const ev = res?.id_event || res?.eventId || res?.data?.id_event;
        return [
          { type: 'ProgramSessionList', id: ev ? `event:${ev}` : 'event:ALL' },
        ];
      },
    }),

    // PATCH /program/sessions/:sessionId
    updateSession: builder.mutation({
      query: ({ sessionId, patch }) => ({
        url: `/program/sessions/${sessionId}`,
        method: 'PATCH',
        body: patch,
      }),
      transformResponse: unwrap,
      invalidatesTags: (_res, _err, arg) => [
        { type: 'ProgramSession', id: String(arg?.sessionId) },
        { type: 'ProgramSessionList', id: 'event:ALL' },
      ],
    }),

    // DELETE /program/sessions/:sessionId
    deleteSession: builder.mutation({
      query: ({ sessionId }) => ({
        url: `/program/sessions/${sessionId}`,
        method: 'DELETE',
      }),
      transformResponse: unwrap,
      invalidatesTags: (_res, _err, arg) => [
        { type: 'ProgramSession', id: String(arg?.sessionId) },
        { type: 'ProgramSessionList', id: 'event:ALL' },
      ],
    }),
  }),
  overrideExisting: true,
});

export const {
  // REQUIRED FIVE
  useGetEventRoomsQuery,
  useGetEventSessionsQuery,
  useSignUpToSessionMutation,
  useCanselSignUpMutation,         // (intentional name to match your request)
  useGetMySessionsQuery,

  // Extras
  useGetSessionByIdQuery,
  useGetEventDaysQuery,
  useCreateSessionMutation,
  useUpdateSessionMutation,
  useDeleteSessionMutation,
} = programApi;
