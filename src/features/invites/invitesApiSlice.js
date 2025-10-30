// src/features/invites/invitesApiSlice.js
import { apiSlice } from "../../app/api/apiSlice"

export const invitesApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    searchActors: builder.query({
      query: ({ q='', role='', eventId='', limit=12 }) =>
        `/invites/admin/search-actors?q=${encodeURIComponent(q)}&role=${role}&eventId=${eventId}&limit=${limit}`,
      providesTags: (_r,_e,_a)=>['InvitesSearch']
    }),
    generateInvite: builder.mutation({
      query: (payload) => ({
        url: '/invites/admin/generate',
        method: 'POST',
        body: payload
      }),
      invalidatesTags: ['InvitesList']
    }),
    listInviteCodes: builder.query({
      query: ({ search='', role='', eventId='', page=1, limit=20 }) =>
        `/invites/admin/list?search=${encodeURIComponent(search)}&role=${role}&eventId=${eventId}&page=${page}&limit=${limit}`,
      providesTags: (_r,_e,_a)=>['InvitesList']
    }),
  }),
});

export const {
  useSearchActorsQuery,
  useGenerateInviteMutation,
  useListInviteCodesQuery
} = invitesApiSlice;
