// lightweight stats endpoints (frontend-only change)
// NOTE: adjust the import path to your shared apiSlice if different.
import { apiSlice } from "../../app/api/apiSlice";

export const statsApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAttendeeStats: builder.query({
      // if you have multi-event, pass { eventId }
      query: (args = {}) => {
      const p = new URLSearchParams();
      if (args.eventId) p.set("eventId", args.eventId);
      if (Array.isArray(args.countries) && args.countries.length) {
       // send as comma list: TN,FR,US
        p.set("countries", args.countries.join(","));
      }
      const qs = p.toString();
      return { url: `/admin/stats/attendees${qs ? `?${qs}` : ""}` ,method: 'GET'};
    },  
      // fallback shape so UI renders even without backend
      transformResponse: (res) => {
        const data = res?.data || res || {};
        return {
          total: data.total ?? 0,
          verified: data.verified ?? 0,
          orgsCount: data.orgsCount ?? 0,
          countriesCount: data.countriesCount ?? 0,
          languagesCount: data.languagesCount ?? 0,
          new7d: data.new7d ?? 0,
          new30d: data.new30d ?? 0,
          // timeseries: [{date:'YYYY-MM-DD', count:Number}]
          registrationsOverTime: Array.isArray(data.registrationsOverTime) ? data.registrationsOverTime : [],
          // languages: [{label:'en', value:Number}]
          languages: Array.isArray(data.languages) ? data.languages : [],
          // top lists (we’ll show later parts)
          topCountries: Array.isArray(data.topCountries) ? data.topCountries : [],
          topCities: Array.isArray(data.topCities) ? data.topCities : [],
          actorTypes: Array.isArray(data.actorTypes) ? data.actorTypes : [],
          jobTitles: Array.isArray(data.jobTitles) ? data.jobTitles : [],
          topOrgs: Array.isArray(data.topOrgs) ? data.topOrgs : [],
          verification: data.verification || { verified: 0, unverified: 0, adminVerified: 0, adminPending: 0 },
          engagement: data.engagement || { openToMeetingsPct: 0, objectives: [] },
          linksCoverage: data.linksCoverage || { linkedinPct: 0, websitePct: 0 },
          eventsOverview: data.eventsOverview || {
            attendeesPerEvent: [],        // [{ label:'Event A', value: 320 }]
            growthPerEventPct: [],        // [{ label:'Event A', value: 18 }] (last 30d)
            retentionPct: [],             // [{ label:'Event A', value: 42 }] (returning by email)
          },
          dataQuality: data.dataCompleteness || { withPhotoPct: 0, withLinksPct: 0, completeProfilePct: 0 }
        };
      },
    }),
  }),
});

export const { useGetAttendeeStatsQuery } = statsApiSlice;
