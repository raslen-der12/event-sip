import { apiSlice } from "../../app/api/apiSlice"
export const adminApiSlice = apiSlice.injectEndpoints({
    endpoints: builder => ({
        getAdminRegisterRequest: builder.query({
            query: (args) => ({
                url: '/actors/requests',
                method: 'POST',
                body: args
            }),
            transformResponse: (res) => {
                // Normalize the response data
                return res?.data?.data || res?.data
            },
            providesTags: (result, error, arg) =>
                result ? [{ type: 'AdminRegisterRequest', id: result.id }] : []

        }),
        updateAdminRegisterRequest: builder.mutation({
            query: (data) => ({
                url: `/actors/requests`,
                method: 'PATCH',
                body: data
            }),
            invalidatesTags: (result, error, arg) =>
                result ? [{ type: 'AdminRegisterRequest', id: result.id }] : []
        }),
        getActorsListAdmin: builder.query({
            query: (args) => ({
                url: '/actors',
                method: 'POST',
                body: args
            }),
            transformResponse: (res) => {
                return res?.data?.data || res?.data
            },
            providesTags: (result, error, arg) =>
                result ? [{ type: 'ActorsListAdmin', id: result.id }] : []
        }),
        getAdminActor: builder.query({
            query: (id) => ({
                url: `/actors/${id}`,
                method: 'GET'
            }),

            providesTags: (result, error, arg) =>
                result ? [{ type: 'AdminActor', id: result.id }] : []
        }),
        createActor: builder.mutation({
            query: (data) => ({
                url: `/actors/create`,
                method: 'POST',
                body: data
            }),
            invalidatesTags: (result, error, arg) =>
                result ? [{ type: 'ActorsListAdmin' }] : []
        }),

    })
})

export const {
useGetAdminRegisterRequestQuery,
useUpdateAdminRegisterRequestMutation,
useGetActorsListAdminQuery,
  useGetAdminActorQuery,
  useCreateActorMutation,
} = adminApiSlice