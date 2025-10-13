import { apiSlice } from "../../app/api/apiSlice"
export const toolsApiSlice = apiSlice.injectEndpoints({
    endpoints: builder => ({
        getMeetings: builder.query({
            query: (ActorId) => ({
                url: '/meets',
                method: 'GET',
            }),
            transformResponse: (res) => {
                return res?.data ?? res;
            },
            providesTags: (result) =>
                result ? [{ type: 'Meetings', id: result.id }] : []
        }),
        getSuggestedList: builder.query({
            query: (ActorId) => ({
                url: 'actors/meetings/suggest',
                method: 'GET',
            }),
            transformResponse: (res) => {
                return res?.data ?? res;
            },
            providesTags: (result) =>
                result ? [{ type: 'SuggestedMeetings', id: result.id }] : []
        }),
    })
})

export const {
    useGetMeetingsQuery,
    useGetSuggestedListQuery,
} = toolsApiSlice