import { apiSlice } from "../../app/api/apiSlice"



// Build FormData with bracketed keys from any payload
function toFormDataBracketed(payload) {
  const fd = new FormData();

  const isBlob = (v) => typeof Blob !== 'undefined' && v instanceof Blob;
  const isFile = (v) => typeof File !== 'undefined' && v instanceof File;

  const guessName = (v, fallback = 'upload') => {
    const map = {
      'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif',
      'video/mp4': 'mp4', 'application/pdf': 'pdf'
    };
    const t = (v?.type || '').toLowerCase();
    const ext = map[t] || ((v && v.name && String(v.name).split('.').pop()) || 'bin');
    const base = (v && v.name) ? String(v.name).split(/[\\/]/).pop() : `${fallback}.${ext}`;
    return base;
  };

  const appendFile = (key, v) => {
    // Always send a filename (third arg) so backends get proper originalname/ext
    if (isFile(v)) {
      fd.append(key, v, v.name || guessName(v));
    } else if (isBlob(v)) {
      // Wrap as File when possible; otherwise pass Blob with an explicit filename
      if (typeof File !== 'undefined') {
        try {
          const f = new File([v], guessName(v), { type: v.type || 'application/octet-stream' });
          fd.append(key, f, f.name);
          return;
        } catch (_) {}
      }
      fd.append(key, v, guessName(v));
    }
  };

  (function walk(obj, parentKey = '') {
    if (obj == null) return;
    Object.entries(obj).forEach(([key, val]) => {
      const full = parentKey ? `${parentKey}[${key}]` : key;
      if (val == null) return;

      if (isFile(val) || isBlob(val)) {
        appendFile(full, val);
        return;
      }

      if (Array.isArray(val)) {
        if (val.length && val.every((x) => isFile(x) || isBlob(x))) {
          // repeat same field name for each file
          val.forEach((x) => appendFile(full, x));
        } else if (val.every((v) => ['string','number','boolean'].includes(typeof v))) {
          // send repeated fields rather than CSV (safer for servers)
          val.forEach((v) => fd.append(`${full}[]`, String(v)));
        } else {
          fd.append(full, JSON.stringify(val));
        }
        return;
      }

      if (val instanceof Date) { fd.append(full, val.toISOString()); return; }
      if (typeof val === 'object') { walk(val, full); return; }
      if (typeof val === 'boolean') { fd.append(full, val ? 'true' : 'false'); return; }
      fd.append(full, String(val));
    });
  })(payload);

  return fd;
}


export const toolsApiSlice = apiSlice.injectEndpoints({
    endpoints: builder => ({
        getEvent: builder.query({
            query: (id) => ({
                url: '/events/event/mini',
                method: 'POST',
                body: { eventId: id }
            }),
            transformResponse: (res) => {
                res.data.id = res?.data?._id;
                return res?.data ?? res;
            },
            providesTags: (result, error, arg) =>
                result ? [{ type: 'Event', id: arg?.id }] : []
        }),
        getFullEvent: builder.query({
            // Guarded query: never hit network if id is missing/invalid
            async queryFn(arg, _qApi, _extra, baseQuery) {
                const id =
                    typeof arg === "string" ? arg :
                        (arg && typeof arg === "object" ? arg.eventId : undefined);

                if (!id) return { data: null }; // <-- prevents the "undefined" request

                const res = await baseQuery({
                    url: "/events/event/full",
                    method: "POST",
                    body: { eventId: id },
                });

                if (res.error) return { error: res.error };

                const raw = res.data?.data ?? res.data ?? {};
                const data = { ...raw, id: raw._id || raw.id }; // normalize
                return { data };
            },
            providesTags: (result) =>
                result?.id ? [{ type: "EventFull", id: result.id }] : [],
            keepUnusedDataFor: 300,
        }),
        getTickets: builder.query({
            query: (eventId) => ({
                url: `/events/event/${eventId}/tickets`,
                method: "GET",
            }),
            transformResponse: (res) => {
                return res?.data ?? res;
            },
            providesTags: (result, error, arg) =>
                result ? [{ type: 'EventTickets', id: arg?.id }] : []
        }),
        buyTicket: builder.mutation({
            query: (payload) => ({
                url: `/events/event/${payload.eventId}/tickets/buy`,
                method: "POST",
                body: payload
            }),
            invalidatesTags: (result, error, arg) =>
                [{ type: 'EventTickets', id: arg?.eventId }]
        }),
        getEvents: builder.query({
            query: () => ({
                url: '/events',
                method: 'GET'
            }),
            transformResponse: (res) => {
                return res?.data ?? res;
            },
            providesTags: (result, error, arg) =>
                result ? [{ type: 'Events', id: arg?.id }] : []
        }),
        getEventsAdmin: builder.query({
            query: () => ({
                url: 'events/',
                method: 'GET'
            }),
            transformResponse: (res) => {
                return res?.data ?? res;
            },
            providesTags: (result, error, arg) =>
                result ? [{ type: 'EventsAdmin', id: arg?.id }] : []
        }),
        getEventsStats: builder.query({
            query: () => ({
                url: 'admin/events/stats',
                method: 'GET'
            }),
            transformResponse: (res) => {
                return res?.data ?? res;
            },
            providesTags: (result, error, arg) =>
                result ? [{ type: 'EventsStats', id: arg?.id }] : []
        }),
        publishEvent: builder.mutation({
            query: (payload) => ({
                url: `/events/event/${payload.id}/publish`,
                method: "POST",
                body: payload
            }),
            invalidatesTags: (result, error, arg) =>
                [{ type: 'EventsAdmin', id: arg?.id }]
        }),
        updateEvent: builder.mutation({
           // form multipart for files and data
           query: (payload) => {
               const formData = toFormDataBracketed(payload);
               return {
                   url: `/events/event/admin`,
                   method: "PATCH",
                   body: formData
               };
           },
           invalidatesTags: (result, error, arg) =>
               [{ type: 'EventsAdmin', id: arg?.id }]
        }),
        getEventGallery: builder.query({
            query: (eventId) => ({
                url: `/events/event/${eventId}/gallery`,
                method: "GET"
            }),
            transformResponse: (res) => {
                return res?.data ?? res;
            },
            providesTags: (result, error, arg) =>
                result ? [{ type: 'EventGallery', id: arg?.id }] : []
        }),
        setEventCover: builder.mutation({
            query: (payload) => ({
                url: `/events/event/${payload.eventId}/gallery/${payload.galleryItemId}/cover`,
                method: "POST"
            }),
            invalidatesTags: (result, error, arg) =>
                [{ type: 'EventGallery', id: arg?.eventId }]
        }),
        getEventById: builder.query({
            query: (eventId) => ({
                url: `/events/event/${eventId}`,
                method: "GET"
            }),
            transformResponse: (res) => {
                return res?.data ?? res;
            },
            providesTags: (result, error, arg) =>
                result ? [{ type: 'Event', id: arg?.eventId }] : []
        }),
        createEvent: builder.mutation({
            query: (payload) => ({
                url: `/events/event/admin`,
                method: "POST",
                body: payload
            }),
            invalidatesTags: (result, error, arg) =>
                [{ type: 'EventsAdmin', id: arg?.id }]
        }),
        deleteEvent: builder.mutation({
            query: (payload) => ({
                url: `/events/event/admin`,
                method: "DELETE",
                body: {payload}
            }),
            invalidatesTags: (result, error, arg) =>
                [{ type: 'EventsAdmin', id: arg?.id }]
        }),
    })
})

export const {
    useGetEventQuery,
    useGetFullEventQuery,
    useGetTicketsQuery,
    useBuyTicketMutation,
    useGetEventsQuery,
    useGetEventsAdminQuery,
    useGetEventsStatsQuery,
    usePublishEventMutation,
    useUpdateEventMutation,
    useGetEventGalleryQuery,
    useSetEventCoverMutation,
    useGetEventByIdQuery,         
    useCreateEventMutation,    
    useDeleteEventMutation,

} = toolsApiSlice