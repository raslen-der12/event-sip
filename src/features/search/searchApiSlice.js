// src/features/search/searchApiSlice.js
import { apiSlice } from "../../app/api/apiSlice";

/**
 * Endpoints we use in the hero:
 * - GET /api/search/quick?q=&limit=4
 *     -> [{ _id, type, title, tag, href, score }]
 * - POST /api/search/click { id, type }
 * - GET /api/search/tags
 *     -> { tags: ["AI","FinTech", ...] } OR ["AI","FinTech", ...]
 */
export const searchApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    quickSearch: builder.query({
      query: ({ q, limit = 4 }) => ({
        url: `/search/quick`,
        params: { q, limit },
      }),
      serializeQueryArgs: ({ endpointName }) => endpointName,
      merge: (currentCache, newItems) => {
        const list = Array.isArray(newItems?.data)
          ? newItems.data
          : Array.isArray(newItems)
          ? newItems
          : [];
        return list.slice(0, 4);
      },
      forceRefetch({ currentArg, previousArg }) {
        return (currentArg?.q || "") !== (previousArg?.q || "");
      },
      transformResponse: (resp) => {
        if (Array.isArray(resp)) return resp.slice(0, 4);
        if (Array.isArray(resp?.data)) return resp.data.slice(0, 4);
        return [];
      },
    }),

    registerSearchClick: builder.mutation({
      query: ({ id, type }) => ({
        url: `/search/click`,
        method: "POST",
        body: { id, type },
      }),
    }),

    // NEW: trending / dynamic tags
    trendingTags: builder.query({
      query: () => `/search/tags`,
      transformResponse: (resp) => {
        const arr = Array.isArray(resp) ? resp : Array.isArray(resp?.tags) ? resp.tags : [];
        // sanitize strings & dedupe
        const clean = [...new Set(arr.map((t) => String(t || "").trim()).filter(Boolean))];
        return clean.slice(0, 16); // keep more in cache; hero will show 4
      },
      // refresh every 5 minutes; also on focus/reconnect
      keepUnusedDataFor: 300, // seconds
      providesTags: (res) =>
        res
          ? [{ type: "TrendingTags", id: "LIST" }, ...res.map((t) => ({ type: "TrendingTags", id: t }))]
          : [{ type: "TrendingTags", id: "LIST" }],
    }),
  }),
});

export const {
  useQuickSearchQuery,
  useLazyQuickSearchQuery,
  useRegisterSearchClickMutation,
  useTrendingTagsQuery,        // <— export the new hook
} = searchApiSlice;
