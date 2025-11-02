// src/features/bp/BPAdminApiSlice.js
import { apiSlice } from "../../app/api/apiSlice";
const BASE = "/biz/admin/bp";
export const BPAdminApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // ===== OVERVIEW / QUEUE =====
    adminOverview: builder.query({
      query: () => ({
        url: `${BASE}/overview`,
        method: "GET",
        credentials: "include",
      }),
      providesTags: [{ type: "BPAdmin", id: "OVERVIEW" }],
    }),

   adminQueue: builder.query({
  // params: { q?, page?, limit? }
    query: (params = {}) => ({
        url: "/biz/admin/bp/queue",
        method: "GET",
        params: {
        q: params.q ?? "",
        page: params.page ?? 1,
        limit: params.limit ?? 12,
        },
        credentials: "include",
    }),
    providesTags: [{ type: "BPAdmin", id: "QUEUE" }],
    }),

    // ===== PROFILES (list/search/get) =====
    adminListProfiles: builder.query({
      query: (params = {}) => ({
        url: `${BASE}`, // <- FIX: was `${BASE}/profiles`
        method: "GET",
        params: {
          q: params.q ?? "",
          published: params.published ?? "all",
          page: params.page ?? 1,
          limit: params.limit ?? 20,
          ...(params.eventId ? { eventId: params.eventId } : {}),
        },
        credentials: "include",
      }),
      providesTags: (res) =>
        res?.data?.length
          ? [
              ...res.data.map((p) => ({ type: "BPAdmin", id: p.id })),
              { type: "BPAdmin", id: "LIST" },
            ]
          : [{ type: "BPAdmin", id: "LIST" }],
    }),

    adminGetProfile: builder.query({
        query: (profileId) => ({
            url: `/biz/admin/bp/profile/${profileId}`,
            method: 'GET',
            credentials: 'include',
        }),
        providesTags: (_res, _err, id) => [{ type: 'BPAdminProfile', id: String(id) }],
    }),

    // ===== PROFILE MODERATION =====
    adminPublishProfile: builder.mutation({
      query: ({ profileId, published }) => ({
        url: `/biz/admin/bp/${profileId}/publish`,
        method: "PATCH",
        body: { published: !!published },
        credentials: "include",
      }),
      invalidatesTags: ["BPAdmin", "BPProfiles"],
    }),

    adminBulkPublish: builder.mutation({
      // body: { ids: string[], published: boolean }
      query: (body) => ({
        url: "/biz/admin/bp/publish",
        method: "PATCH",
        body,
        credentials: "include",
      }),
      invalidatesTags: ["BPAdmin", "BPProfiles"],
    }),

    adminFeatureProfile: builder.mutation({
      query: ({ profileId, featured }) => ({
        url: `/biz/admin/bp/${profileId}/feature`,
        method: "PATCH",
        body: { featured: !!featured },
        credentials: "include",
      }),
      invalidatesTags: ["BPAdmin", "BPProfiles"],
    }),

    adminDeleteProfile: builder.mutation({
      query: (profileId) => ({
        url: `/biz/admin/bp/${profileId}`,
        method: "DELETE",
        credentials: "include",
      }),
      invalidatesTags: ["BPAdmin", "BPProfiles", "BPItems"],
    }),

    // ===== ITEMS =====
    adminListItems: builder.query({
  // args: { profileId, kind?, q?, page?, limit? }
        query: ({ profileId, kind, q, page = 1, limit = 6 }) => ({
            url: "/biz/admin/bp/items",
            method: "GET",
            params: {
            profileId,           // <-- required by backend
            kind: kind ?? undefined,
            q: q ?? undefined,
            page,
            limit,
            },
            credentials: "include",
        }),
        // cache per profile
        providesTags: (_res, _err, args) => [{ type: "BPAdminItems", id: String(args?.profileId || "none") }],
        }),
        adminDeleteItem: builder.mutation({
            query: (arg) => {
                const itemId = typeof arg === "string" ? arg : arg?.itemId;
                return {
                url: `/biz/admin/bp/items/${itemId}`,
                method: "DELETE",
                credentials: "include",
                };
            },
            invalidatesTags: (res, err, arg) => {
                const profileId = typeof arg === "object" ? arg?.profileId : null;
                return [
                { type: "BPAdmin", id: "LIST" },
                { type: "BPAdmin", id: "OVERVIEW" },
                // keep item-list cache in sync for that profile (if provided)
                { type: "BPAdminItems", id: String(profileId || "none") },
                ];
            },
            }),
    adminHideItem: builder.mutation({
      query: ({ itemId, hidden }) => ({
        url: `${BASE}/items/${itemId}/hide`,
        method: "PATCH",
        body: { hidden: !!hidden },
        credentials: "include",
      }),
      invalidatesTags: [{ type: "BPAdmin", id: "LIST" }, { type: "BPAdmin", id: "OVERVIEW" }],
    }),

    // ===== TAXONOMY =====
    adminTaxonomyList: builder.query({
      query: () => ({
        url: "/biz/admin/bp/taxonomy",
        method: "GET",
        credentials: "include",
      }),
      providesTags: ["BPTaxonomy", "BPAdmin"],
    }),

    adminTaxonomyAddSector: builder.mutation({
      // body: { sector: string }
      query: (body) => ({
        url: "/biz/admin/bp/taxonomy/sector",
        method: "POST",
        body,
        credentials: "include",
      }),
      invalidatesTags: ["BPTaxonomy", "BPAdmin"],
    }),

    adminTaxonomyAddSubsectors: builder.mutation({
      // args: { sector: string, list: [{name, allowProducts, allowServices}] }
      query: ({ sector, list }) => ({
        url: `/biz/admin/bp/taxonomy/${encodeURIComponent(sector)}/subsectors`,
        method: "POST",
        body: { list },
        credentials: "include",
      }),
      invalidatesTags: ["BPTaxonomy", "BPAdmin"],
    }),

    adminTaxonomyDeleteSector: builder.mutation({
      query: (sector) => ({
        url: `/biz/admin/bp/taxonomy/${encodeURIComponent(sector)}`,
        method: "DELETE",
        credentials: "include",
      }),
      invalidatesTags: ["BPTaxonomy", "BPAdmin"],
    }),

    adminTaxonomyDeleteSubsector: builder.mutation({
      query: ({ sector, subId }) => ({
        url: `/biz/admin/bp/taxonomy/${encodeURIComponent(sector)}/subsectors/${subId}`,
        method: "DELETE",
        credentials: "include",
      }),
      invalidatesTags: ["BPTaxonomy", "BPAdmin"],
    }),
    

    // --- KEEP: set profile published ---
    adminSetProfilePublished: builder.mutation({
      query: ({ profileId, published }) => ({
        url: `${BASE}/${profileId}/publish`,
        method: "PATCH",
        body: { published: !!published },
        credentials: "include",
      }),
      invalidatesTags: (r, e, a) => [
        { type: "BPAdmin", id: a.profileId },
        { type: "BPAdmin", id: "LIST" },
        { type: "BPAdmin", id: "OVERVIEW" },
      ],
    }),
    
    
    
  }),
  overrideExisting: true,
});

export const {
  useAdminOverviewQuery,
  useAdminQueueQuery,
  useAdminListProfilesQuery,
  useAdminGetProfileQuery,
  useAdminPublishProfileMutation,
  useAdminBulkPublishMutation,
  useAdminFeatureProfileMutation,
  useAdminDeleteProfileMutation,
  useAdminListItemsQuery,
  useAdminDeleteItemMutation,
  useAdminHideItemMutation,
  useAdminTaxonomyListQuery,
  useAdminTaxonomyAddSectorMutation,
  useAdminTaxonomyAddSubsectorsMutation,
  useAdminTaxonomyDeleteSectorMutation,
  useAdminTaxonomyDeleteSubsectorMutation,
    useAdminSetProfilePublishedMutation,
} = BPAdminApiSlice;
