// src/mocks/scheduleDemoData.js

/** Generate a Mongo-like 24-hex id */
export function makeObjectId(seed = "") {
  const base = (seed + Math.random().toString(16).slice(2) + Date.now().toString(16)).padEnd(24, "a");
  return base.slice(0, 24);
}

/** YYYY-MM-DD helpers (two demo days) */
const today = new Date();
const day1 = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
const day2 = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2);
function ymd(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}
function at(d, h, m = 0) {
  const dt = new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, m, 0);
  return dt.toISOString();
}

export const demoEventId = makeObjectId("event");

/* ---------- ROOMS ---------- */
export const demoRooms = [
  { _id: makeObjectId("roomA"), id_event: demoEventId, name: "Auditorium",   location: "Level 1", capacity: 600 },
  { _id: makeObjectId("roomB"), id_event: demoEventId, name: "Room A",       location: "Level 2", capacity: 120 },
  { _id: makeObjectId("roomC"), id_event: demoEventId, name: "Room B",       location: "Level 2", capacity: 100 },
  { _id: makeObjectId("roomD"), id_event: demoEventId, name: "Workshop Lab", location: "Level 3", capacity: 40  },
];

/* Small speaker photos can be added via your imageLink util later */
const sp = (name, title = "") => ({ name, title });

/* ---------- SESSIONS ---------- */
const [aud, rA, rB, lab] = demoRooms;

export const demoSessions = [
  // Day 1
  {
    _id: makeObjectId("s1"),
    id_event: demoEventId,
    title: "Opening Keynote: The State of Tech",
    desc: "A fast tour of what's next across AI, web, and infra.",
    start: at(day1, 9, 0),
    end:   at(day1, 10, 0),
    roomId: aud._id,
    track: "Keynote",
    tags: ["keynote", "vision"],
    capacity: null,               // open capacity
    rolesAllowed: null,           // all roles
    speakers: [sp("Samir Haddad", "CTO, NovaTech")],
    cover: null,
  },
  {
    _id: makeObjectId("s2"),
    id_event: demoEventId,
    title: "Intro to AI Agents",
    desc: "Patterns for building useful autonomous agents with tools.",
    start: at(day1, 10, 15),
    end:   at(day1, 11, 0),
    roomId: rA._id,
    track: "AI",
    tags: ["ai", "agents"],
    capacity: 120,
    rolesAllowed: ["attendee", "speaker", "exhibitor"],
    speakers: [sp("Amel Trabelsi", "ML Engineer")],
  },
  {
    _id: makeObjectId("s3"),
    id_event: demoEventId,
    title: "React 19 in the Real World",
    desc: "Streaming SSR, Actions, and practical migration advice.",
    start: at(day1, 10, 15),
    end:   at(day1, 11, 15),
    roomId: rB._id,
    track: "Web",
    tags: ["react", "frontend"],
    capacity: 100,
    rolesAllowed: null,
    speakers: [sp("Yassine S.", "Staff FE")],
  },
  {
    _id: makeObjectId("s4"),
    id_event: demoEventId,
    title: "Kubernetes Workshop (hands-on)",
    desc: "Deploy, scale, and debug a microservice. Bring your laptop.",
    start: at(day1, 11, 30),
    end:   at(day1, 13, 0),
    roomId: lab._id,
    track: "DevOps",
    tags: ["k8s", "workshop"],
    capacity: 40,
    rolesAllowed: ["attendee", "speaker"],
    speakers: [sp("Aziz Karoui", "SRE"), sp("Meriem K.", "Platform Eng.")],
  },
  {
    _id: makeObjectId("s5"),
    id_event: demoEventId,
    title: "B2B Networking",
    desc: "Meet founders and solution providers. Speed-networking format.",
    start: at(day1, 14, 0),
    end:   at(day1, 15, 0),
    roomId: rA._id,
    track: "Networking",
    tags: ["b2b", "people"],
    capacity: 120,
    rolesAllowed: null,
    speakers: [],
  },

  // Day 2
  {
    _id: makeObjectId("s6"),
    id_event: demoEventId,
    title: "Edge Functions: Patterns & Pitfalls",
    desc: "Latency budgets, cold starts, and caching at the edge.",
    start: at(day2, 9, 30),
    end:   at(day2, 10, 20),
    roomId: rB._id,
    track: "Web",
    tags: ["edge", "serverless"],
    capacity: 100,
    rolesAllowed: null,
    speakers: [sp("Sami B.", "Architect")],
  },
  {
    _id: makeObjectId("s7"),
    id_event: demoEventId,
    title: "RAG Systems That Don’t Suck",
    desc: "Indexing, reranking, evals—and when to fine-tune.",
    start: at(day2, 10, 30),
    end:   at(day2, 11, 20),
    roomId: rA._id,
    track: "AI",
    tags: ["rag", "nlp"],
    capacity: 120,
    rolesAllowed: ["attendee", "speaker"],
    speakers: [sp("Aicha L.", "AI Research")],
  },
  {
    _id: makeObjectId("s8"),
    id_event: demoEventId,
    title: "Observability Deep Dive",
    desc: "OpenTelemetry, traces, and golden signals that actually help.",
    start: at(day2, 11, 30),
    end:   at(day2, 12, 20),
    roomId: rB._id,
    track: "DevOps",
    tags: ["otel", "metrics"],
    capacity: 100,
    rolesAllowed: null,
    speakers: [sp("Hamza G.", "Observability Lead")],
  },
  {
    _id: makeObjectId("s9"),
    id_event: demoEventId,
    title: "Design Systems for Velocity",
    desc: "How to ship faster without breaking UX.",
    start: at(day2, 14, 0),
    end:   at(day2, 14, 45),
    roomId: aud._id,
    track: "Design",
    tags: ["design", "systems"],
    capacity: null,
    rolesAllowed: null,
    speakers: [sp("Melek B.", "Head of Design")],
  },
];

/* ---------- COUNTS (registered / waitlisted) ---------- */
export const demoCounts = (() => {
  const map = {};
  const byId = Object.fromEntries(demoSessions?.map(s => [s._id, s]));
  const set = (sid, registered = 0, waitlisted = 0) => { map[sid] = { registered, waitlisted }; };

  // Day 1
  set(demoSessions[0]._id, 420, 0); // keynote open capacity – just a number
  set(demoSessions[1]._id, 85, 0);  // AI Intro (cap 120)
  set(demoSessions[2]._id, 100, 2); // React (cap 100) FULL + waitlist
  set(demoSessions[3]._id, 40, 6);  // K8s workshop (cap 40) FULL + waitlist
  set(demoSessions[4]._id, 60, 0);

  // Day 2
  set(demoSessions[5]._id, 66, 0);
  set(demoSessions[6]._id, 119, 4); // almost full
  set(demoSessions[7]._id, 54, 0);
  set(demoSessions[8]._id, 300, 0);

  // Ensure keys for all sessions
  demoSessions.forEach(s => { if (!map[s._id]) map[s._id] = { registered: 0, waitlisted: 0 }; });
  return map;
})();

/* ---------- MY SESSIONS (this user) ---------- */
export const demoMyMap = new Map([
  [demoSessions[1]._id, "registered"], // AI Intro
  [demoSessions[2]._id, "waitlisted"], // React
  // feel free to add more preselected
]);

/* ---------- Helpers used by the mock hooks ---------- */
export function filterSessions({ eventId, day, roomId, track }) {
  let list = demoSessions.filter(s => s.id_event === eventId);
  if (day)  list = list.filter(s => new Date(s.start).toISOString().slice(0,10) === day);
  if (roomId) list = list.filter(s => String(s.roomId) === String(roomId));
  if (track)  list = list.filter(s => s.track === track);
  // sort by startTime
  list.sort((a,b) => new Date(a.start) - new Date(b.start));
  return list;
}

export function countsFor(sessionIds) {
  const o = {};
  sessionIds.forEach(id => { o[id] = demoCounts[id] || { registered: 0, waitlisted: 0 }; });
  return o;
}
