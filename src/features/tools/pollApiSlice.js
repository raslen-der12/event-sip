// RTK Query slice for polls
import { apiSlice } from "../../app/api/apiSlice";

export const pollApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    /* ADMIN */
    adminCreatePoll: builder.mutation({
      // body: { title, options[], manualStop:boolean, durationSec:number }
      query: (body) => ({
        url: "/polls/admin",
        method: "POST",
        body,
      }),
      invalidatesTags: (_res, _err) => [{ type: "Polls", id: "LIST" }],
    }),

    adminListPolls: builder.query({
      // args?: { q?, status? ('running'|'upcoming'|'finished') }
      query: (args = {}) => {
        const p = new URLSearchParams();
        if (args.q) p.set("q", args.q);
        if (args.status) p.set("status", args.status);
        return { url: `/polls/admin?${p.toString()}` };
      },
      providesTags: (_res) => [{ type: "Polls", id: "LIST" }],
      transformResponse: (res) =>
        res?.ok ? res : { ok: false, upcoming: [], running: [], finished: [], counts: {} },
    }),

    adminStartPoll: builder.mutation({
      query: (pollId) => ({
        url: `/polls/admin/${pollId}/start`,
        method: "POST",
      }),
      invalidatesTags: (_res, _err, id) => [
        { type: "Polls", id: "LIST" },
        { type: "Poll", id },
      ],
    }),

    adminStopPoll: builder.mutation({
      query: (pollId) => ({
        url: `/polls/admin/${pollId}/stop`,
        method: "POST",
      }),
      invalidatesTags: (_res, _err, id) => [
        { type: "Polls", id: "LIST" },
        { type: "Poll", id },
      ],
    }),

    adminPollResults: builder.query({
      // args: { id, source? ('recount' to force recount) }
      query: ({ id, source } = {}) => {
        const s = source ? `?source=${encodeURIComponent(source)}` : "";
        return { url: `/polls/admin/${id}/results${s}` };
      },
      providesTags: (_res, _err, { id }) => [{ type: "Poll", id }],
    }),

    /* PUBLIC (read-only for admin overlay health/countdown) */
    getPublicPoll: builder.query({
      query: (pollId) => ({ url: `/polls/${pollId}` }),
      providesTags: (_res, _err, id) => [{ type: "Poll", id }],
    }),
    listPublicPolls: builder.query({
      // args?: { status?: 'upcoming'|'running'|'finished' }
      query: (args = {}) => {
        const p = new URLSearchParams();
        if (args.status) p.set("status", args.status);
        return { url: `/polls?${p.toString()}` };
      },
    }),


    submitVote: builder.mutation({
      // body: { optionId, voterId }
      query: ({ id, optionId, voterId }) => ({
        url: `/polls/${id}/vote`,
        method: "POST",
        body: { optionId, voterId },
      }),
      // invalidate this poll so the tally/status refetches
      invalidatesTags: (_res, _err, { id }) => [{ type: "Poll", id }],
    }),
  }),
});

export const {
  useAdminCreatePollMutation,
  useAdminListPollsQuery,
  useAdminStartPollMutation,
  useAdminStopPollMutation,
  useAdminPollResultsQuery,
  useGetPublicPollQuery,
  useListPublicPollsQuery,
  useSubmitVoteMutation,
} = pollApiSlice;
