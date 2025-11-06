// src/pages/sessions/MySessions.jsx
import React, { useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  FiChevronLeft,
  FiCalendar,
  FiClock,
  FiMapPin,
  FiTag,
  FiX,
  FiXCircle,
} from "react-icons/fi";
import { useTranslation } from "react-i18next";

import {
  useGetMySessionsQuery,
  useCanselSignUpMutation,
} from "../../features/events/scheduleApiSlice";
import { useGetEventsQuery } from "../../features/events/eventsApiSlice";

import HeaderShell from "../../components/layout/HeaderShell";
import { cta, footerData, nav, topbar } from "../main.mock";
import Footer from "../../components/footer/Footer";

/* ---------------- utils ---------------- */
const idOf = (o) => o?._id || o?.id || null;
const clampWords = (t = "", max = 12) => {
  const parts = String(t).trim().split(/\s+/);
  return parts.length > max ? parts.slice(0, max).join(" ") + "…" : t;
};
const fmtDate = (iso) => {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "—";
  }
};
const fmtTime = (iso) => {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "—";
  }
};
const isPast = (iso) => {
  try { return new Date(iso).getTime() < Date.now(); } catch { return false; }
};
const isFuture = (iso) => {
  try { return new Date(iso).getTime() > Date.now(); } catch { return false; }
};

/* ------------- normalizers ------------- */
const normSession = (row) => {
  const s = row?.session || row || {};
  const sessionId =
    idOf(s) ||
    row?.sessionId ||
    (row?.session && idOf(row.session)) ||
    null;

  const start = s.startTime || s.start || row?.startTime || null;
  const end   = s.endTime   || s.end   || row?.endTime   || null;

  const room =
    s.room || s.roomName || row?.room || row?.roomName || "";

  const eventId =
    idOf(s.id_event) ||
    s.id_event ||
    row?.eventId ||
    idOf(row?.id_event) ||
    null;

  return {
    id: sessionId,
    title: s.sessionTitle || s.title || row?.title || "Untitled session",
    start,
    end,
    room,
    roomId: s.roomId || row?.roomId || null,
    track: s.track || row?.track || "",
    tags: Array.isArray(s.tags) ? s.tags : (Array.isArray(row?.tags) ? row.tags : []),
    eventId,
  };
};

/* ---------------- component ---------------- */
export default function MySessions() {
  const { t } = useTranslation("common", { keyPrefix: "sessions" });
  const navigate = useNavigate();
  const { actorId: publicActorId } = useParams();
  const isPublic = !!publicActorId;

  const { data, isLoading, isError, refetch } = useGetMySessionsQuery(
    isPublic ? { actorId: publicActorId } : {},
    { refetchOnMountOrArgChange: true }
  );

  const { data: eventsRes } = useGetEventsQuery();
  const eventsList = Array.isArray(eventsRes?.data)
    ? eventsRes.data
    : (Array.isArray(eventsRes) ? eventsRes : []);
  const eventsMap = useMemo(() => {
    const m = new Map();
    eventsList.forEach((e) => m.set(String(idOf(e)), e));
    return m;
  }, [eventsList]);

  const items = useMemo(() => {
    const arr = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);
    return arr
      .map((r) => {
        const s = normSession(r);
        return {
          id: s.id,
          session: s,
          status: String(r?.status || "registered").toLowerCase(),
          attend: !!r?.attend,
        };
      })
      .filter((x) => x.session.id && x.session.start && x.session.end && x.session.eventId);
  }, [data]);

  const groups = useMemo(() => {
    const map = new Map();
    items.forEach((it) => {
      const k = String(it.session.eventId);
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(it);
    });
    for (const [k, arr] of map.entries()) {
      arr.sort((a, b) => new Date(a.session.start) - new Date(b.session.start));
      map.set(k, arr);
    }
    return Array.from(map.entries());
  }, [items]);

  const [cancelSignup, { isLoading: canceling }] = useCanselSignUpMutation();
  const [active, setActive] = useState(null);
  const close = () => setActive(null);

  const onCancel = async () => {
    if (!active || isPublic) return;
    const id = active.session.id;
    try {
      await cancelSignup({ sessionId: id }).unwrap?.();
    } catch {
      try { await cancelSignup(id).unwrap?.(); } catch {}
    } finally {
      close();
      refetch();
    }
  };

  return (
    <>
      <HeaderShell top={topbar} nav={nav} cta={cta} />

      <section className="max-w-6xl mx-auto p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
          >
            <FiChevronLeft /> {t("back")}
          </button>
          <h1 className="text-2xl sm:text-3xl font-semibold flex-1">
            {isPublic ? t("publicSessions") : t("mySessions")}
          </h1>
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-36 bg-gray-200 rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : isError ? (
          <p className="text-center text-gray-600 py-12">{t("errorLoadingSessions")}</p>
        ) : !groups.length ? (
          <p className="text-center text-gray-600 py-12">
            {isPublic ? t("noPublicSessions") : t("noSessionsRegistered")}
          </p>
        ) : (
          groups.map(([evId, rows]) => {
            const ev = eventsMap.get(String(evId)) || {};
            const evTitle = clampWords(ev?.title || "Event", 14);
            const evWhere = [ev?.city, ev?.country].filter(Boolean).join(", ");
            const dateRange =
              ev?.startDate && ev?.endDate
                ? `${fmtDate(ev.startDate)} – ${fmtDate(ev.endDate)}`
                : "";

            return (
              <section key={evId} className="mb-10">
                <div className="mb-4">
                  <Link
                    to={`/event/${evId}`}
                    className="text-xl sm:text-2xl font-semibold text-gray-900 hover:underline"
                  >
                    {evTitle}
                  </Link>
                  <div className="flex flex-col sm:flex-row gap-3 mt-2 text-sm text-gray-600">
                    {evWhere && (
                      <span className="flex items-center gap-1">
                        <FiMapPin className="w-4 h-4" /> {evWhere}
                      </span>
                    )}
                    {dateRange && (
                      <span className="flex items-center gap-1">
                        <FiCalendar className="w-4 h-4" /> {dateRange}
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {rows.map((row) => {
                    const s = row.session;
                    const upcoming = isFuture(s.start);
                    const attStatus = row.attend
                      ? "attended"
                      : upcoming
                      ? "upcoming"
                      : "missed";
                    const attColor = row.attend
                      ? "bg-green-100 text-green-700"
                      : upcoming
                      ? "bg-amber-100 text-amber-700"
                      : "bg-red-100 text-red-700";
                    const regColor =
                      row.status === "registered"
                        ? "bg-blue-100 text-blue-700"
                        : row.status === "waitlisted"
                        ? "bg-orange-100 text-orange-700"
                        : "bg-red-100 text-red-700";
                    const canCancel = !isPublic && !isPast(s.start);

                    return (
                      <div
                        key={row.id}
                        onClick={() => setActive(row)}
                        className="bg-white border border-gray-200 rounded-xl p-4 cursor-pointer hover:border-gray-400 hover:shadow-md transition-all"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="text-base font-semibold text-gray-900 line-clamp-2">
                            {clampWords(s.title, 7)}
                          </h4>
                          <div className="flex flex-wrap gap-2 text-xs">
                            <span className={`px-2 py-1 rounded-full font-medium ${regColor}`}>
                              {t(row.status)}
                            </span>
                            <span className={`px-2 py-1 rounded-full font-medium text-xs ${attColor}`}>
                              {t(attStatus)}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <FiCalendar className="w-4 h-4" />
                            {fmtDate(s.start)}
                          </div>
                          <div className="flex items-center gap-2">
                            <FiClock className="w-4 h-4" />
                            {fmtTime(s.start)} – {fmtTime(s.end)}
                          </div>
                          {s.room && (
                            <div className="flex items-center gap-2">
                              <FiMapPin className="w-4 h-4" />
                              {s.room}
                            </div>
                          )}
                          {s.track && (
                            <div className="flex items-center gap-2">
                              <FiTag className="w-4 h-4" />
                              {s.track}
                            </div>
                          )}
                        </div>

                        {canCancel && (
                          <div className="mt-3 flex justify-end">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActive(row);
                              }}
                              disabled={canceling}
                              className="flex items-center gap-1 text-xs text-red-600 border border-red-600 px-3 py-1 rounded-lg hover:bg-red-50 disabled:opacity-60"
                            >
                              <FiXCircle className="w-3.5 h-3.5" />
                              {t("cancel")}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })
        )}

        {/* Modal */}
        {active && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={close}
          >
            <div
              className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto relative shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={close}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                aria-label={t("close")}
              >
                <FiX className="w-6 h-6" />
              </button>

              <div className="p-6 pt-12">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  {clampWords(active.session.title, 15)}
                </h3>

                <div className="space-y-3 text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-2">
                    <FiCalendar className="w-4 h-4" />
                    {fmtDate(active.session.start)}
                  </div>
                  <div className="flex items-center gap-2">
                    <FiClock className="w-4 h-4" />
                    {fmtTime(active.session.start)} – {fmtTime(active.session.end)}
                  </div>
                  {active.session.room && (
                    <div className="flex items-center gap-2">
                      <FiMapPin className="w-4 h-4" />
                      {active.session.room}
                    </div>
                  )}
                  {active.session.track && (
                    <div className="flex items-center gap-2">
                      <FiTag className="w-4 h-4" />
                      {active.session.track}
                    </div>
                  )}
                </div>

                {active.session.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-5">
                    {active.session.tags.map((t, i) => (
                      <span
                        key={i}
                        className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <div className="text-sm text-gray-500">{t("registration")}</div>
                    <div className={`font-medium capitalize ${
                      active.status === "registered"
                        ? "text-blue-700"
                        : active.status === "waitlisted"
                        ? "text-orange-700"
                        : "text-red-700"
                    }`}>
                      {t(active.status)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">{t("attendance")}</div>
                    <div className={`font-medium capitalize ${
                      active.attend
                        ? "text-green-700"
                        : isFuture(active.session.start)
                        ? "text-amber-700"
                        : "text-red-700"
                    }`}>
                      {active.attend
                        ? t("attended")
                        : isFuture(active.session.start)
                        ? t("eventHasntHappened")
                        : t("notAttended")}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 justify-end border-t pt-4">
                  {!isPublic && !isPast(active.session.start) && (
                    <button
                      onClick={onCancel}
                      disabled={canceling}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 border border-red-600 rounded-lg hover:bg-red-50 disabled:opacity-60"
                    >
                      <FiXCircle className="w-4 h-4" />
                      {canceling ? t("cancelling") : t("cancel")}
                    </button>
                  )}
                  <button
                    onClick={close}
                    className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    {t("close")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      <Footer
        brand={footerData.brand}
        columns={footerData.columns}
        socials={footerData.socials}
        actions={footerData.actions}
        bottomLinks={footerData.bottomLinks}
      />
    </>
  );
}