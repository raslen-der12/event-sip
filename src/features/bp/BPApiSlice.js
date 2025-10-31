// src/features/bp/BPApiSlice.js
import { apiSlice } from "../../app/api/apiSlice";

export const BPApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({

    /* ===================== Owner Profile (keep names) ===================== */
    getMyBP: builder.query({
      query: () => ({ url: "/biz/bp/me/summary", method: "GET", credentials: "include" }),
      providesTags: ["BP"],
    }),
    createOrGetBP: builder.mutation({
      query: (body) => ({ url: "/biz/bp/me/create-or-get", method: "POST", body, credentials: "include" }),
      invalidatesTags: ["BP"],
    }),
    patchBPContacts: builder.mutation({
      // NOTE: we keep the name but this PATCH is generic (any section)
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
  query: ({ path }) => ({
    url: '/biz/bp/me/legal',
    method: 'POST',
    body: { path },
  }),
  invalidatesTags: ['BP_ME'],
}),
    /* ============================ Taxonomy ============================ */
    getBPTaxonomy: builder.query({
      query: () => ({ url: "/biz/bp/taxonomy", method: "GET" }),
      providesTags: ["BPTaxonomy"],
    }),
    adminUpsertSector: builder.mutation({
      query: (body) => ({ url: "/biz/admin/bp/taxonomy/sector", method: "POST", body, credentials: "include" }),
      invalidatesTags: ["BPTaxonomy"],
    }),
    adminUpsertSubsector: builder.mutation({
      query: (body) => ({ url: "/biz/admin/bp/taxonomy/subsector", method: "POST", body, credentials: "include" }),
      invalidatesTags: ["BPTaxonomy"],
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
      // pass both; backend will use whichever is valid
      query: ({ itemId, uploadId, uploadPath }) => ({
        url: `/biz/bp/me/items/${itemId}/thumbnail`,
        method: "POST",
        body: { uploadId, uploadPath },
        credentials: "include",
      }),
      invalidatesTags: ["BPItems"],
    }),
    addBPItemImages: builder.mutation({
      // accept either uploadIds or uploadPaths (or both)
      query: ({ itemId, uploadIds, uploadPaths }) => ({
        url: `/biz/bp/me/items/${itemId}/images/add`,
        method: "POST",
        body: { uploadIds, uploadPaths },
        credentials: "include",
      }),
      invalidatesTags: ["BPItems"],
    }),
    removeBPItemImage: builder.mutation({
      query: ({ itemId, uploadId  }) => ({
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

    /* ============================ Public: profile fetch & reactions ============================ */
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
      // accept either uploadIds or uploadPaths (or both)
      query: ({ uploadIds, uploadPaths }) => ({
        url: "/biz/bp/me/gallery/add",
        method: "POST",
        body: { uploadIds, uploadPaths },
        credentials: "include",
      }),
      invalidatesTags: ["BP"],
    }),
    removeFromGallery: builder.mutation({
      query: ({ imageId }) => ({ url: "/biz/bp/me/gallery/remove", method: "POST", body: { imageId }, credentials: "include" }),
      invalidatesTags: ["BP"],
    }),

    /* ============================ Admin moderation ============================ */
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
    adminSearchProfiles: builder.query({
      query: () => ({ url: "/biz/admin/bp/profiles", method: "GET", credentials: "include" }),
      providesTags: ["BPAdmin"],
    }),
    adminGetProfile: builder.query({
      query: (id) => ({ url: `/biz/admin/bp/profile/${id}`, method: "GET", credentials: "include" }),
      providesTags: ["BPAdmin"],
    }),
    adminModerateProfile: builder.mutation({
      query: ({ id, body }) => ({ url: `/biz/admin/bp/profile/${id}/moderate`, method: "PATCH", body, credentials: "include" }),
      invalidatesTags: ["BPAdmin", "BP"],
    }),
    adminChangeOwnerRole: builder.mutation({
      query: ({ id, body }) => ({ url: `/biz/admin/bp/profile/${id}/owner-role`, method: "PATCH", body, credentials: "include" }),
      invalidatesTags: ["BPAdmin", "BP"],
    }),
    adminModerateItem: builder.mutation({
      query: ({ itemId, body }) => ({ url: `/biz/admin/bp/items/${itemId}/moderate`, method: "PATCH", body, credentials: "include" }),
      invalidatesTags: ["BPAdmin", "BPItems"],
    }),
    adminBulkProfiles: builder.mutation({
      query: (body) => ({ url: "/biz/admin/bp/profiles/bulk", method: "POST", body, credentials: "include" }),
      invalidatesTags: ["BPAdmin"],
    }),
    adminAuditLogs: builder.query({
      query: () => ({ url: "/biz/admin/bp/audit", method: "GET", credentials: "include" }),
      providesTags: ["BPAdmin"],
    }),

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
    method: 'POST',
    credentials: 'include',
    body: { patents, rdSpendPct, techStack }
  }),
  invalidatesTags: () => [], // optional
}),
setProfilePresence: builder.mutation({
  query: ({ profileId, locations, certifications }) => ({
    url: `biz/bp/${profileId}/presence`,
    method: 'POST',
    credentials: 'include',
    body: { locations, certifications }
  }),
  invalidatesTags: () => [], // optional
}),
searchPeople: builder.query({
      query: ({ q, page=1, limit=10 }) => ({
        url: `/biz/bp/team/search?q=${encodeURIComponent(q||'')}&page=${page}&limit=${limit}`,
        method: 'GET',
      }),
    }),

    getMyTeam: builder.query({
      query: () => ({ url: '/biz/bp/me/team', method: 'GET' }),
      providesTags: ['Team'],
    }),

    addTeamMember: builder.mutation({
      query: (body /* {entityType, entityId, role?} */) => ({
        url: '/biz/bp/me/team',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Team'],
    }),

    removeTeamMember: builder.mutation({
      query: ({ entityType, entityId }) => ({
        url: `/biz/bp/me/team/${entityType}/${entityId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Team'],
    }),
    getPublicTeam: builder.query({
  /**
   * GET /api/bp/:profileId/team
   * Backend should return: { success:true, data:[ { entityType, entityId, role, name, title, avatarUpload, city, country, dept, skills, open } ] }
   */
  query: (profileId) => ({
    url: `/biz/bp/${profileId}/team`,
    method: 'GET',
  }),
  transformResponse: (resp) => resp?.data || [],
}),
  }),
  overrideExisting: true,
});

/* ===== Export hooks (keep your original names + add the rest) ===== */
export const {
  // KEEP THESE EXACT NAMES
  useGetMyBPQuery,
  useCreateOrGetBPMutation,
  usePatchBPContactsMutation,
  useUploadFileMutation,
  useSetBPLogoMutation,
  useSetBPBannerMutation,
  useSetBPLegalDocMutation,
  // taxonomy
  useGetBPTaxonomyQuery,
  useAdminUpsertSectorMutation,
  useAdminUpsertSubsectorMutation,

  // owner role / profile
  useChangeMyBPRoleMutation,

  // owner items
  useCreateBPItemMutation,
  useListMyBPItemsQuery,
  useUpdateBPItemMutation,
  useDeleteBPItemMutation,
  useSetBPItemThumbnailMutation,
  useAddBPItemImagesMutation,
  useRemoveBPItemImageMutation,

  // public items / search
  useListProfileItemsQuery,
  useSearchProfilesQuery,
  useSearchItemsQuery,
  useGetFacetsQuery,
  useGetFacetsSelectsQuery,

  // public profile + reactions
  useGetProfileBySlugQuery,
  useGetProfileByIdQuery,
  useLikeProfileMutation,

  // owner gallery
  useAddToGalleryMutation,
  useRemoveFromGalleryMutation,

  // admin
  useAdminQueueQuery,
  useAdminSetProfilePublishedMutation,
  useAdminHideItemMutation,
  useAdminSearchProfilesQuery,
  useAdminGetProfileQuery,
  useAdminModerateProfileMutation,
  useAdminChangeOwnerRoleMutation,
  useAdminModerateItemMutation,
  useAdminBulkProfilesMutation,
  useAdminAuditLogsQuery,

  // uploads
  useUploadMultiMutation,
  useGetProfileOverviewQuery,
  useGetProfileRatingQuery,
  useRateProfileMutation,
  useSetProfileInnovationMutation,
  useSetProfilePresenceMutation,
    useSearchPeopleQuery,
  useLazySearchPeopleQuery,
  useGetMyTeamQuery,
  useAddTeamMemberMutation,
  useRemoveTeamMemberMutation,
  useGetPublicTeamQuery,
} = BPApiSlice;
