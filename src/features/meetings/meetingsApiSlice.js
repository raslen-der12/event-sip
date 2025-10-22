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
                url: '/meets/suggested',
                method: 'GET',
            }),
            transformResponse: (res) => {
                return res?.data ?? res;
            },
            providesTags: (result) =>
                result ? [{ type: 'SuggestedMeetings', id: result.id }] : []
        }),
        makeMeetingAction: builder.mutation({
            query: ({ meetingId, action, actorId, proposedNewAt }) => ({
                url: "/meets/actions",
                method: "POST",
                body: { meetingId, action, actorId, proposedNewAt },
            }),
            invalidatesTags: ["Meetings"],
        }),
    })
})

export const {
    useGetMeetingsQuery,
    useGetSuggestedListQuery,
    useMakeMeetingActionMutation
} = toolsApiSlice