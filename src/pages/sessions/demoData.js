// src/pages/sessions/sessionsApiSlice.mock.js

/* Demo EVENTS list (used by useGetEventsQuery) */
export const demoEvents = [
  {
    _id: "e1",
    title: "Global Innovation Tech Summit",
    city: "Casablanca",
    country: "Morocco",
    startDate: "2025-09-02",
    endDate:   "2025-09-05",
  },
  {
    _id: "e2",
    title: "MENA CleanTech Expo",
    city: "Dubai",
    country: "UAE",
    startDate: "2025-09-10",
    endDate:   "2025-09-12",
  },
];

/* Demo “my sessions” list (used by useGetMySessionsQuery)
   — matches the shape your page expects: [{ status, attend, session: {...} }]
*/
export const demoMySessions = [
  {
    status: "registered",
    attend: true,
    session: {
      _id: "s1",
      sessionTitle: "Opening Keynote: The Next 10 Years",
      startTime: "2025-09-02T09:00:00Z",
      endTime:   "2025-09-02T10:00:00Z",
      id_event:  "e1",
      room: "Main Hall",
      roomId: null,
      track: "Keynote",
      tags: ["AI", "Strategy"],
      capacity: 800,
    },
  },
  {
    status: "registered",
    attend: false,
    session: {
      _id: "s2",
      sessionTitle: "Green Mobility Panel",
      startTime: "2025-09-03T13:30:00Z",
      endTime:   "2025-09-03T14:30:00Z",
      id_event:  "e1",
      room: "Room A",
      roomId: null,
      track: "Sustainability",
      tags: ["EV", "Policy"],
      capacity: 200,
    },
  },
  {
    status: "waitlisted",
    attend: false,
    session: {
      _id: "s3",
      sessionTitle: "Waste-to-Energy Case Studies",
      startTime: "2025-09-11T09:15:00Z",
      endTime:   "2025-09-11T10:00:00Z",
      id_event:  "e2",
      room: "Hall 2",
      roomId: null,
      track: "Energy",
      tags: ["Bio", "Infra"],
      capacity: 120,
    },
  },
  {
    status: "registered",
    attend: false,
    session: {
      _id: "s4",
      sessionTitle: "Solar Finance Workshop",
      startTime: "2025-09-11T11:15:00Z",
      endTime:   "2025-09-11T12:00:00Z",
      id_event:  "e2",
      room: "Workshop 1",
      roomId: null,
      track: "Finance",
      tags: ["Solar", "Banking"],
      capacity: 60,
    },
  },
  {
    status: "registered",
    attend: false,
    session: {
      _id: "s5",
      sessionTitle: "Expo Closing & Takeaways",
      startTime: "2025-09-12T16:00:00Z",
      endTime:   "2025-09-12T17:00:00Z",
      id_event:  "e2",
      room: "Main Stage",
      roomId: null,
      track: "General",
      tags: ["Summary", "Networking"],
      capacity: 1000,
    },
  },
];

/* Optional: return a different public list if actorId is provided */
const demoPublicSessions = [
  {
    status: "registered",
    attend: false,
    session: {
      _id: "ps1",
      sessionTitle: "AI in Manufacturing — Practical Wins",
      startTime: "2025-09-02T15:00:00Z",
      endTime:   "2025-09-02T15:45:00Z",
      id_event:  "e1",
      room: "Room B",
      roomId: null,
      track: "Industry",
      tags: ["AI", "Robotics"],
      capacity: 180,
    },
  },
];

/* Mock hooks — match RTK Query return shape */
export function useGetMySessionsQuery(args = {}, _opts = {}) {
  // If /sessions/:actorId is used, serve a trimmed public set
  const hasActor = args && typeof args === "object" && args.actorId;
  return {
    data: hasActor ? demoPublicSessions : demoMySessions,
    isLoading: false,
    isError: false,
  };
}

export function useGetEventsQuery(_args, _opts = {}) {
  return {
    data: demoEvents,
    isLoading: false,
    isError: false,
  };
}
