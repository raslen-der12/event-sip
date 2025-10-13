import { apiSlice } from "../../app/api/apiSlice"

const qs = (o = {}) => {
  const sp = new URLSearchParams();
  Object.entries(o).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return;
    sp.set(k, String(v));
  });
  const s = sp.toString();
  return s ? `?${s}` : ''; // ✅ fixed
};


export const toolsApiSlice = apiSlice.injectEndpoints({
    endpoints: builder => ({
        getSpeakersByEvent: builder.query({
            query: (data) => ({
                url: `actors/event/${data.eventId}/speakers${qs({ search: data.q, limit: data.limit, open: data.open, country: data.country })}`,
                method: 'GET',
                
            }),
            transformResponse: (res) => {
                return res?.data ?? res;
            },
            providesTags: (result, error, arg) =>
                result ? [{ type: 'Speakers', id: arg?.id }] : []
        }),
        getAttendeesByEvent: builder.query({
            query: (data) => ({
                url: `actors/event/${data.eventId}/attendees${qs({ search: data.q, limit: data.limit, open: data.open, country: data.country })}`,
                method: 'GET',
            }),
            transformResponse: (res) => {
                return res?.data ?? res;
            },
            providesTags: (result, error, arg) =>
                result ? [{ type: 'Attendees', id: arg?.id }] : []
        }),
        getExhibitorsByEvent: builder.query({
            query: (data) => ({
                url: `actors/event/${data.eventId}/exhibitors${qs({ search: data.q, limit: data.limit, open: data.open, country: data.country })}`,
                method: 'GET',
            }),
            transformResponse: (res) => {
                return res?.data ?? res;
            },
            providesTags: (result, error, arg) =>
                result ? [{ type: 'Exhibitors', id: arg?.id }] : []
        }),

    })
})

export const {
    useGetSpeakersByEventQuery,
    useGetAttendeesByEventQuery,
    useGetExhibitorsByEventQuery
} = toolsApiSlice