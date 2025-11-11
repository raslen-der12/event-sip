// src/features/feedback/feedbackApiSlice.js
import { apiSlice } from "../../app/api/apiSlice"

export const feedbackApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getPendingFeedback: builder.query({
      query: () => ({ url: "/meets/feedback/pending", method: "GET" }),
      // refresh every minute so the popup appears ~exactly at +60m if user is online
      pollingInterval: 60_000,
    }),
    markFeedbackShown: builder.mutation({
      query: (promptId) => ({
        url: "/meets/feedback/mark-shown",
        method: "POST",
        body: { promptId },
      }),
    }),
    submitFeedback: builder.mutation({
      query: ({ promptId, stars, comment }) => ({
        url: "/meets/feedback/submit",
        method: "POST",
        body: { promptId, stars, comment },
      }),
    }),
  }),
});

export const {
  useGetPendingFeedbackQuery,
  useMarkFeedbackShownMutation,
  useSubmitFeedbackMutation,
} = feedbackApiSlice;
