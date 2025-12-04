// src/features/eventManager/eventManagerApiSlice.js
import { apiSlice } from "../../app/api/apiSlice";

/**
 * Event Manager API slice
 * - applyEventManager: POST application payload
 * - getMyEventManagerApplication: GET current user's application (if any)
 * - adminListEventManagerApplications: list all (with optional status filter)
 * - adminUpdateEventManagerApplicationStatus: approve / reject
 */
export const eventManagerApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    /* USER SIDE */

    applyEventManager: builder.mutation({
      query: (body) => ({
        url: "/event-managers/apply",
        method: "POST",
        body,
      }),
      invalidatesTags: (result) =>
        result?.application
          ? [{ type: "EventManagerApplication", id: result.application.id }]
          : [],
    }),

    getMyEventManagerApplication: builder.query({
      query: () => "/event-managers/my-application",
      providesTags: (result) =>
        result?.application
          ? [{ type: "EventManagerApplication", id: result.application.id }]
          : [],
    }),

    /* ADMIN SIDE */

    adminListEventManagerApplications: builder.query({
      query: (status) => {
        const params = status && status !== "All" ? `?status=${status}` : "";
        return `/event-managers/admin/applications${params}`;
      },
      providesTags: (result) =>
        result?.applications
          ? [
              ...result.applications.map((a) => ({
                type: "EventManagerApplication",
                id: a.id,
              })),
              { type: "EventManagerApplication", id: "LIST" },
            ]
          : [{ type: "EventManagerApplication", id: "LIST" }],
    }),

    adminUpdateEventManagerApplicationStatus: builder.mutation({
      query: ({ id, status, reviewNotes }) => ({
        url: `/event-managers/admin/applications/${id}/status`,
        method: "PATCH",
        body: { status, reviewNotes },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "EventManagerApplication", id },
        { type: "EventManagerApplication", id: "LIST" },
      ],
    }),
    getManagerDashboardEvent: builder.query({
      query: (eventId) => `/event-manager/dashboard/events/${eventId}`,
    }),

    updateManagerDashboardEvent: builder.mutation({
      query: ({ eventId, body }) => ({
        url: `/event-manager/dashboard/events/${eventId}`,
        method: "PATCH",
        body,
      }),
    }),
    createEventFromWizard: builder.mutation({
      query: (payload) => ({
        url: "/event-manager/dashboard/events/wizard",
        method: "POST",
        body: payload,
      }),
    }),
    getClosestManagedEvent: builder.query({
      query: () => "/event-manager/dashboard/events/closest",
      providesTags: (result) =>
        result?.eventId
          ? [{ type: "EventManagerEvent", id: result.eventId }]
          : [{ type: "EventManagerEvent", id: "CLOSEST" }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useApplyEventManagerMutation,
  useGetMyEventManagerApplicationQuery,
  useAdminListEventManagerApplicationsQuery,
  useAdminUpdateEventManagerApplicationStatusMutation,
  useGetManagerDashboardEventQuery,
  useUpdateManagerDashboardEventMutation,
  useCreateEventFromWizardMutation,
  useGetClosestManagedEventQuery
} = eventManagerApiSlice;
