// src/features/bp/BPApiSlice.js
import { apiSlice } from "../../app/api/apiSlice";

export const BPApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({

    /* ===================== Owner Profile ===================== */
    getMyBP: builder.query({
      query: () => ({ url: "/biz/bp/me/summary", method: "GET", credentials: "include" }),
      providesTags: ["BP"],
    }),
    createOrGetBP: builder.mutation({
      query: (body) => ({ url: "/biz/bp/me/create-or-get", method: "POST", body, credentials: "include" }),
      invalidatesTags: ["BP"],
    }),
    patchBPContacts: builder.mutation({
      query: (body) => ({ url: "/biz/bp/me", method: "PATCH", body, credentials: "include" }),
      invalidatesTags: ["BP"],
    }),
    uploadFile: builder.mutation({
      query: (formData) => ({ url: "/biz/uploads/single", method: "POST", body: formData, credentials: "include" }),
    }),
    setBPLogo: builder.mutation({
      query: ({ path }) => ({ url: "/biz/bp/me/logo", method: "POST", body: { path }, credentials: "include" }),
      invalidatesTags: ["BP"],
    }),
    setBPBanner: builder.mutation({
      query: ({ path }) => ({ url: "/biz/bp/me/banner", method: "POST", body: { path }, credentials: "include" }),
      invalidatesTags: ["BP"],
    }),
    setBPLegalDoc: builder.mutation({
      query: ({ path }) => ({ url: "/biz/bp/me/legal", method: "POST", body: { path }, credentials: "include" }),
      invalidatesTags: ["BP"],
    }),

    /* ============================ Taxonomy (public) ============================ */
    getBPTaxonomy: builder.query({
      query: () => ({ url: "/biz/bp/taxonomy", method: "GET" }),
      providesTags: ["BPTaxonomy"],
    }),

    /* ============================ Owner: role ============================ */
    changeMyBPRole: builder.mutation({
      query: (body) => ({ url: "/biz/bp/me/role", method: "PATCH", body, credentials: "include" }),
      invalidatesTags: ["BP"],
    }),

    /* ============================ Owner: items ============================ */
    createBPItem: builder.mutation({
      query: (body) => ({ url: "/biz/bp/me/items", method: "POST", body, credentials: "include" }),
      invalidatesTags: ["BPItems"],
    }),
    listMyBPItems: builder.query({
      query: () => ({ url: "/biz/bp/me/items", method: "GET", credentials: "include" }),
      providesTags: ["BPItems"],
    }),
    updateBPItem: builder.mutation({
      query: ({ itemId, ...body }) => ({
        url: `/biz/bp/me/items/${itemId}`,
        method: "PATCH",
        body,
        credentials: "include",
      }),
      invalidatesTags: ["BPItems"],
    }),
    deleteBPItem: builder.mutation({
      query: (itemId) => ({ url: `/biz/bp/me/items/${itemId}`, method: "DELETE", credentials: "include" }),
      invalidatesTags: ["BPItems"],
    }),
    setBPItemThumbnail: builder.mutation({
      query: ({ itemId, uploadId, uploadPath }) => ({
        url: `/biz/bp/me/items/${itemId}/thumbnail`,
        method: "POST",
        body: { uploadId, uploadPath },
        credentials: "include",
      }),
      invalidatesTags: ["BPItems"],
    }),
    addBPItemImages: builder.mutation({
      query: ({ itemId, uploadIds, uploadPaths }) => ({
        url: `/biz/bp/me/items/${itemId}/images/add`,
        method: "POST",
        body: { uploadIds, uploadPaths },
        credentials: "include",
      }),
      invalidatesTags: ["BPItems"],
    }),
    removeBPItemImage: builder.mutation({
      query: ({ itemId, uploadId }) => ({
        url: `/biz/bp/me/items/${itemId}/images/remove`,
        method: "POST",
        body: { uploadId },
        credentials: "include",
      }),
      invalidatesTags: ["BPItems"],
    }),

    /* ============================ Public: items on a profile ============================ */
    listProfileItems: builder.query({
      query: (profileId) => ({ url: `/biz/bp/${profileId}/items`, method: "GET" }),
    }),

    /* ============================ Search & Facets ============================ */
    searchProfiles: builder.query({
      query: (params) => ({ url: "/biz/bp/search", method: "GET", params }),
      providesTags: ["BPSearch"],
    }),
    searchItems: builder.query({
      query: (params) => ({ url: "/biz/bp/items/search", method: "GET", params }),
      providesTags: ["BPSearch"],
    }),
    getFacets: builder.query({
      query: () => ({ url: "/biz/bp/facets", method: "GET" }),
      providesTags: ["BPSearch"],
    }),
    getFacetsSelects: builder.query({
      query: () => ({ url: "biz/bp/facets/selects", method: "GET" }),
      providesTags: ["BPSearchSelects"],
    }),

    /* ============================ Public: profile + reactions ============================ */
    getProfileBySlug: builder.query({
      query: (slug) => ({ url: `/biz/bp/by-slug/${slug}`, method: "GET" }),
      providesTags: ["BP"],
    }),
    getProfileById: builder.query({
      query: (id) => ({ url: `/biz/bp/by-id/${id}`, method: "GET" }),
      providesTags: ["BP"],
    }),
    likeProfile: builder.mutation({
      query: (id) => ({ url: `/biz/bp/${id}/like`, method: "POST", credentials: "include" }),
      invalidatesTags: ["BP"],
    }),

    /* ============================ Owner: gallery media ============================ */
    addToGallery: builder.mutation({
      query: ({ uploadIds, uploadPaths }) => ({
        url: "/biz/bp/me/gallery/add",
        method: "POST",
        body: { uploadIds, uploadPaths },
        credentials: "include",
      }),
      invalidatesTags: ["BP"],
    }),
    removeFromGallery: builder.mutation({
      query: ({ imageId }) => ({
        url: "/biz/bp/me/gallery/remove",
        method: "POST",
        body: { imageId },
        credentials: "include",
      }),
      invalidatesTags: ["BP"],
    }),

    /* ============================ Admin (KEPT ONLY THESE 3) ============================ */
    adminQueue: builder.query({
      query: () => ({ url: "/biz/admin/bp/queue", method: "GET", credentials: "include" }),
      providesTags: ["BPAdmin"],
    }),
    adminSetProfilePublished: builder.mutation({
      query: ({ id, body }) => ({ url: `/biz/admin/bp/${id}/publish`, method: "PATCH", body, credentials: "include" }),
      invalidatesTags: ["BPAdmin", "BP"],
    }),
    adminHideItem: builder.mutation({
      query: ({ itemId, body }) => ({ url: `/biz/admin/bp/items/${itemId}/hide`, method: "PATCH", body, credentials: "include" }),
      invalidatesTags: ["BPAdmin", "BPItems"],
    }),

    /* ============================ Misc ============================ */
    uploadMulti: builder.mutation({
      query: (formData) => ({ url: "/biz/uploads/multi", method: "POST", body: formData, credentials: "include" }),
    }),
    getProfileOverview: builder.query({
      query: (profileId) => ({ url: `/biz/bp/${profileId}/overview`, method: "GET" }),
      providesTags: (r, e, id) => [{ type: "BPOverview", id }],
      transformResponse: (resp) => resp?.data || resp,
    }),
    getProfileRating: builder.query({
      query: (profileId) => ({ url: `biz/bp/${profileId}/rating`, method: "GET" }),
      transformResponse: (r) => r?.rating || r,
    }),
    rateProfile: builder.mutation({
      query: ({ profileId, value }) => ({
        url: `biz/bp/${profileId}/rating`,
        method: "POST",
        body: { value },
        credentials: "include",
      }),
      invalidatesTags: (r, e, { profileId }) => [{ type: "BPOverview", id: profileId }],
    }),
    setProfileInnovation: builder.mutation({
      query: ({ profileId, patents, rdSpendPct, techStack }) => ({
        url: `biz/bp/${profileId}/innovation`,
        method: "POST",
        credentials: "include",
        body: { patents, rdSpendPct, techStack }
      }),
    }),
    setProfilePresence: builder.mutation({
      query: ({ profileId, locations, certifications }) => ({
        url: `biz/bp/${profileId}/presence`,
        method: "POST",
        credentials: "include",
        body: { locations, certifications }
      }),
    }),

    /* ============================ Team ============================ */
    searchPeople: builder.query({
      query: ({ q, page = 1, limit = 10 }) => ({
        url: `/biz/bp/team/search?q=${encodeURIComponent(q || "")}&page=${page}&limit=${limit}`,
        method: "GET",
      }),
    }),
    getMyTeam: builder.query({
      query: () => ({ url: "/biz/bp/me/team", method: "GET" }),
      providesTags: ["Team"],
    }),
    addTeamMember: builder.mutation({
      query: (body) => ({ url: "/biz/bp/me/team", method: "POST", body }),
      invalidatesTags: ["Team"],
    }),
    removeTeamMember: builder.mutation({
      query: ({ entityType, entityId }) => ({ url: `/biz/bp/me/team/${entityType}/${entityId}`, method: "DELETE" }),
      invalidatesTags: ["Team"],
    }),
    getPublicTeam: builder.query({
      query: (profileId) => ({ url: `/biz/bp/${profileId}/team`, method: "GET" }),
      transformResponse: (r) => r?.data || [],
      providesTags: (r, e, id) => [{ type: "BPOverview", id }],
    }),
    getPublicContact: builder.query({
      query: (profileId) => ({ url: `/biz/bp/${profileId}/contact`, method: "GET" }),
      transformResponse: (r) =>
        r?.data || { people: [], social: [], locations: [], company: [], collateral: [], topics: [] },
      providesTags: (r, e, id) => [{ type: "BPOverview", id }],
    }),

    /* ============================ Market ============================ */
    getMarketFacets: builder.query({
      query: () => ({ url: "biz/market/facets" }),
      transformResponse: (res) => res || {},
      providesTags: ["MarketFacets"],
      keepUnusedDataFor: 300,
    }),
    getMarketItems: builder.query({
      query: (params) => ({
        url: "biz/market/items",
        method: "GET",
        params,
      }),
      transformResponse: (res) => res || { items: [], total: 0 },
      providesTags: (result, err, args) => [{ type: "MarketItems", id: JSON.stringify(args || {}) }],
    }),
    getMarketItem: builder.query({
      query: (id) => ({ url: `biz/market/item/${id}` }),
      transformResponse: (res) => res?.data || res,
    }),
    getPublicEngagements: builder.query({
    query: (profileId) => `/biz/bp/${profileId}/engagements`,
    transformResponse: (res) => {
      // backend returns { success, data: [...] }
      if (Array.isArray(res?.data)) return res.data;
      if (Array.isArray(res)) return res; // tolerate raw array
      return [];
    }
  }),

  }),
  overrideExisting: true,
});

export const {
  // owner profile
  useGetMyBPQuery,
  useCreateOrGetBPMutation,
  usePatchBPContactsMutation,
  useUploadFileMutation,
  useSetBPLogoMutation,
  useSetBPBannerMutation,
  useSetBPLegalDocMutation,

  // taxonomy (public)
  useGetBPTaxonomyQuery,

  // role
  useChangeMyBPRoleMutation,

  // items
  useCreateBPItemMutation,
  useListMyBPItemsQuery,
  useUpdateBPItemMutation,
  useDeleteBPItemMutation,
  useSetBPItemThumbnailMutation,
  useAddBPItemImagesMutation,
  useRemoveBPItemImageMutation,

  // public items/search
  useListProfileItemsQuery,
  useSearchProfilesQuery,
  useSearchItemsQuery,
  useGetFacetsQuery,
  useGetFacetsSelectsQuery,

  // public profile + reactions
  useGetProfileBySlugQuery,
  useGetProfileByIdQuery,
  useLikeProfileMutation,

  // gallery
  useAddToGalleryMutation,
  useRemoveFromGalleryMutation,

  // *** admin kept ***
  useAdminQueueQuery,
  useAdminSetProfilePublishedMutation,
  useAdminHideItemMutation,

  // misc
  useUploadMultiMutation,
  useGetProfileOverviewQuery,
  useGetProfileRatingQuery,
  useRateProfileMutation,
  useSetProfileInnovationMutation,
  useSetProfilePresenceMutation,

  // team
  useSearchPeopleQuery,
  useLazySearchPeopleQuery,
  useGetMyTeamQuery,
  useAddTeamMemberMutation,
  useRemoveTeamMemberMutation,
  useGetPublicTeamQuery,
  useGetPublicContactQuery,

  // market
  useGetMarketFacetsQuery,
  useGetMarketItemsQuery,
  useLazyGetMarketItemsQuery,
  useGetMarketItemQuery,
  useGetPublicEngagementsQuery,
} = BPApiSlice;
