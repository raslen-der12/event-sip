// src/features/Actor/scheduleApiSlice.mock.js
// Stable mock hooks for Schedule page (no infinite re-render).
// Uses a version-based snapshot so React only re-renders when state changes.

import * as React from "react";
import {
  demoEventId,
  demoRooms,
  demoSessions,
  demoCounts,
  demoMyMap,
  filterSessions,
  countsFor,
} from "./scheduleDemoData";

/* ---------------------------
   Minimal store w/ versioning
   --------------------------- */

// Mutable state buckets (we mutate but bump version)
const state = {
  rooms: demoRooms,
  sessions: demoSessions,
  counts: { ...demoCounts }, // { [sid]: { registered, waitlisted } }
  my: new Map(demoMyMap),    // Map<sid, "registered" | "waitlisted">
};

// Version + subscription
let version = 0;
const listeners = new Set();
function subscribe(cb) { listeners.add(cb); return () => listeners.delete(cb); }
function emit() { version++; listeners.forEach((fn) => { try { fn(); } catch {} }); }

// Snapshot returns ONLY a primitive version (stable for React compare)
function useVersion() {
  return React.useSyncExternalStore(
    subscribe,
    () => version, // client snapshot
    () => version  // server snapshot
  );
}

/* --------------------------------
   Hooks: same names as your real API
   -------------------------------- */

// 2) List rooms for an event
export function useGetEventRoomsQuery({ eventId }) {
  useVersion(); // subscribe to changes
  const data = {
    success: true,
    data: state.rooms.filter((r) => r.id_event === eventId),
  };
  return { data, isFetching: false, isError: false };
}

// 6) List sessions (filter by event/day/room/track)
export function useGetEventSessionsQuery({ eventId, day, roomId, track, includeCounts }, _opts) {
  useVersion(); // subscribe to changes

  const list = filterSessions({ eventId, day, roomId, track });
  const payload = { success: true, data: list };
  if (includeCounts) payload.counts = countsFor(list.map((s) => s._id));

  // keep a stable refetch that doesn't spuriously emit
  const refetch = async () => payload;

  return { data: payload, isFetching: false, isError: false, refetch };
}

// 9) List my sessions (registered/waitlisted) – only for status + "View" btn
export function useGetMySessionsQuery({ eventId }) {
  useVersion(); // subscribe to changes

  const mine = Array.from(state.my.entries())
    .map(([sid, status]) => {
      const s = state.sessions.find((x) => x._id === sid && x.id_event === eventId);
      return s ? { status, session: s } : null;
    })
    .filter(Boolean);

  const data = { success: true, data: mine };
  const refetch = async () => data;

  return { data, isFetching: false, isError: false, refetch };
}

// 7) Signup for a session (self)
export function useSignUpToSessionMutation() {
  const mutate = async ({ sessionId, waitlistOk = true }) => {
    const s = state.sessions.find((x) => x._id === sessionId);
    if (!s) return Promise.reject({ status: 400, message: "bad id" });

    const cnt = state.counts[sessionId] || { registered: 0, waitlisted: 0 };
    const cap = typeof s.capacity === "number" ? s.capacity : null;

    // already signed
    const existing = state.my.get(sessionId);
    if (existing) return { success: true, data: { status: existing } };

    let status = "registered";
    if (cap != null && cnt.registered >= cap) {
      if (!waitlistOk) return Promise.reject({ status: 409, message: "full and waitlist not allowed" });
      status = "waitlisted";
      cnt.waitlisted = (cnt.waitlisted || 0) + 1;
    } else {
      cnt.registered = (cnt.registered || 0) + 1;
    }

    state.counts[sessionId] = { ...cnt };
    state.my.set(sessionId, status);
    emit();

    return { success: true, data: { status } };
  };

  return [mutate, { isLoading: false, isError: false }];
}

// 8) Cancel my signup
export function useCanselSignUpMutation() {
  const mutate = async ({ sessionId }) => {
    const s = state.sessions.find((x) => x._id === sessionId);
    if (!s) return Promise.reject({ status: 400, message: "bad id" });

    const prev = state.my.get(sessionId);
    if (!prev) return Promise.reject({ status: 404, message: "no active signup" });

    const cnt = state.counts[sessionId] || { registered: 0, waitlisted: 0 };

    if (prev === "registered") {
      cnt.registered = Math.max(0, (cnt.registered || 0) - 1);
      // naive promotion
      if ((cnt.waitlisted || 0) > 0) {
        cnt.waitlisted = Math.max(0, cnt.waitlisted - 1);
        cnt.registered += 1;
      }
    } else if (prev === "waitlisted") {
      cnt.waitlisted = Math.max(0, (cnt.waitlisted || 0) - 1);
    }

    state.counts[sessionId] = { ...cnt };
    state.my.delete(sessionId);
    emit();

    return { success: true, promoted: true };
  };

  return [mutate, { isLoading: false, isError: false }];
}

/* Dev helper to reset */
export function __resetScheduleMock() {
  Object.keys(state.counts).forEach((k) => delete state.counts[k]);
  Object.assign(state.counts, demoCounts);
  state.my = new Map(demoMyMap);
  emit();
}

// Also export a demo event id for convenience
export { demoEventId } from "./scheduleDemoData";
