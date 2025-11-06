import { apiSlice } from "../../app/api/apiSlice";
export const adminApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAdminRegisterRequest: builder.query({
      query: (args) => ({
        url: "/actors/requests",
        method: "POST",
        body: args,
      }),
      transformResponse: (res) => {
        // Normalize the response data
        return res?.data?.data || res?.data;
      },
      providesTags: (result, error, arg) =>
        result ? [{ type: "AdminRegisterRequest", id: result.id }] : [],
    }),

    updateActor: builder.mutation({
      // we'll call this with { id, body }
      query: ({ id, body }) => ({
        url: `/actors/update/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result, error, arg) => [
        { type: "Actors", id: arg?.id ?? "LIST" },
        { type: "Actors", id: "LIST" },
      ],
    }),

    updateAdminRegisterRequest: builder.mutation({
      query: (data) => ({
        url: `/actors/requests`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, arg) =>
        result ? [{ type: "AdminRegisterRequest", id: result.id }] : [],
    }),
    getActorsListAdmin: builder.query({
      query: (args) => ({
        url: "/actors",
        method: "POST",
        body: args,
      }),
      transformResponse: (res) => {
        return res?.data?.data || res?.data;
      },
      providesTags: (result, error, arg) =>
        result ? [{ type: "ActorsListAdmin", id: result.id }] : [],
    }),
    getAdminActor: builder.query({
      query: (id) => ({
        url: `/actors/${id}`,
        method: "GET",
      }),

      providesTags: (result, error, arg) =>
        result ? [{ type: "AdminActor", id: result.id }] : [],
    }),

    createActor: builder.mutation({
      query: (data) => ({
        url: `/actors/create`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (result, error, arg) =>
        result ? [{ type: "ActorsListAdmin" }] : [],
    }),
    setWhitelist: builder.mutation({
      query: ({ eventId, slots, actorId }) => ({
        url: `/meets/whitelist`,
        method: "PUT",
        body: { eventId, slots, actorId },
      }),
    }),
    adminSetWhitelist: builder.mutation({
      query: ({ eventId, actorId, slots }) => ({
        url: `meets/admin/whitelist`,
        method: "PUT",
        body: { eventId, actorId, slots },
      }),
    }),
    // inside createApi(...) builder:
    uploadActorPhoto: builder.mutation({
      query: ({ id, file }) => {
        const fd = new FormData();
        fd.append("photo", file); // backend expects field named "photo"
        return {
          url: `/admin/actors/${id}/photo`, // <-- match your backend route
          method: "POST",
          body: fd,
        };
      },
      invalidatesTags: (result, error, { id }) => [
        { type: "Actor", id },
        { type: "Actors", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetAdminRegisterRequestQuery,
  useLazyGetAdminRegisterRequestQuery,
  useUpdateAdminRegisterRequestMutation,
  useGetActorsListAdminQuery,
  useGetAdminActorQuery,
  useCreateActorMutation,
  useSetWhitelistMutation,
  useAdminSetWhitelistMutation,
  useUploadActorPhotoMutation,
  useUpdateActorMutation,
} = adminApiSlice;
