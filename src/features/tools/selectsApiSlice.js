import { apiSlice } from "../../app/api/apiSlice"
export const toolsApiSlice = apiSlice.injectEndpoints({
    endpoints: builder => ({
        getSelects: builder.query({
            query: () => 'selects',
            transformResponse: (res) => res?.data ?? res,
            providesTags: (result, error, arg) =>
                result ? [...result.map(({ _id }) => ({ type: 'Select', id: _id })), { type: 'Select', id: 'LIST' }] : [{ type: 'Select', id: 'LIST' }]
        }),
        addSelect: builder.mutation({
            query: (data) => ({
                url: 'selects',
                method: 'POST',
                body: { ...data }
            }),
            transformResponse: (res) => res?.data ?? res,
            invalidatesTags: [{ type: 'Select', id: 'LIST' }],
        }),
        changeSelect: builder.mutation({
            query: ({ id, data }) => ({
                url: `selects/${id}`,
                method: 'PATCH',
                body: { ...data }
            }),
            transformResponse: (res) => res?.data ?? res,
            invalidatesTags: (res, err, arg) => [{ type: 'Select', id: arg?.id }],
        }),
        deleteSelect: builder.mutation({
            query: (id) => ({
                url: `selects/${id}`,
                method: 'DELETE',
            }),
            transformResponse: (res) => res?.data ?? res,
            invalidatesTags: (res, err, arg) => [{ type: 'Select', id: arg }],
        }),
        getSelectByName: builder.query({
            query: (name) => ({
                url: `selects/by-name/${name}`,
                method: 'GET',
            }),
            transformResponse: (res) => res?.data ?? res,
            providesTags: (result, error, arg) =>
                result ? [{ type: 'Select', id: result._id }] : []
        }),


    })
})

export const {
    useGetSelectsQuery,
    useAddSelectMutation,
    useChangeSelectMutation,
    useDeleteSelectMutation,
    useGetSelectByNameQuery
} = toolsApiSlice