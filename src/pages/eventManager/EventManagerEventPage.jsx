// src/pages/eventManager/EventManagerEventPage.jsx
import React, { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import {
  useGetManagerDashboardEventQuery,
  useUpdateManagerDashboardEventMutation,
} from "../../features/eventManager/eventManagerApiSlice";
import {
  FiCalendar,
  FiTag,
  FiImage,
  FiUsers,
  FiPlus,
  FiTrash2,
  FiMapPin,
  FiClock,
  FiLayers,
} from "react-icons/fi";

// Tailwind-only design, old CSS not used
// import "./event-manager-event.css";

const toDateInput = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
};

const toTimeInput = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    return String(value).slice(0, 5);
  }
  return d.toISOString().slice(11, 16);
};

const TABS = [
  { id: "basics", label: "Basics" },
  { id: "schedule", label: "Schedule" },
  { id: "tickets", label: "Tickets" },
  { id: "organizers", label: "Organizers" },
  { id: "gallery", label: "Media" },
];

const EventManagerEventPage = () => {
  const { eventId } = useParams();

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetManagerDashboardEventQuery(eventId);

  const [updateEvent, { isLoading: isSaving }] =
    useUpdateManagerDashboardEventMutation();

  // --- STATE GROUPS ---------------------------------------------------------

  const [core, setCore] = useState({
    title: "",
    shortLabel: "",
    tagline: "",
    description: "",
    category: "",
    tags: "",
  });

  const [logistics, setLogistics] = useState({
    startDate: "",
    endDate: "",
    timezone: "",
    city: "",
    country: "",
    venueName: "",
    eventFormat: "onsite", // onsite | online | hybrid
    streamingUrl: "",
    mainLanguage: "",
    capacity: "",
    cover: "",
  });

  const [tickets, setTickets] = useState([]);
  const [defaultCurrency, setDefaultCurrency] = useState("EUR");

  const [agenda, setAgenda] = useState([]);
  const [organizers, setOrganizers] = useState([]);
  const [gallery, setGallery] = useState([]);

  const [settings, setSettings] = useState({
    visibility: "private", // private | unlisted | public
    matchmakingEnabled: true,
    allowMeetingRequests: true,
    showAttendeeCount: false,
    allowExport: true,
  });

  const [dirty, setDirty] = useState(false);
  const [activeTab, setActiveTab] = useState("basics");

  const markDirty = () => setDirty(true);

  // --- MAP BACKEND DATA -> LOCAL STATE -------------------------------------

  useEffect(() => {
    if (!data?.event) return;

    const e = data.event;

    setCore({
      title: e.title || "",
      shortLabel: e.shortLabel || "",
      tagline: e.tagline || "",
      description: e.description || "",
      category: e.category || "",
      tags: Array.isArray(e.tags) ? e.tags.join(", ") : e.tags || "",
    });

    setLogistics({
      startDate: toDateInput(e.startDate),
      endDate: toDateInput(e.endDate),
      timezone: e.timezone || "",
      city: e.city || "",
      country: e.country || "",
      venueName: e.venueName || "",
      eventFormat: e.eventFormat || "onsite",
      streamingUrl: e.streamingUrl || "",
      mainLanguage: e.mainLanguage || "",
      capacity:
        e.capacity !== undefined && e.capacity !== null
          ? String(e.capacity)
          : "",
      cover: e.cover || "",
    });

    const ticketsState = (e.ticketPlans || []).map((t, index) => ({
      id: t.id || t._id || index,
      name: t.name || "",
      price:
        t.price !== undefined && t.price !== null ? String(t.price) : "",
      currency: t.currency || "EUR",
      capacity:
        t.capacity !== undefined && t.capacity !== null
          ? String(t.capacity)
          : "",
      maxPerUser:
        t.maxPerUser !== undefined && t.maxPerUser !== null
          ? String(t.maxPerUser)
          : "",
      accessLevel: t.accessLevel || "standard",
    }));
    setTickets(ticketsState);

    if (ticketsState.length && ticketsState[0].currency) {
      setDefaultCurrency(ticketsState[0].currency);
    }

    const agendaState = (data.schedule || []).map((s) => ({
      id: s.id || s._id,
      sessionTitle: s.sessionTitle || "",
      track: s.track || "",
      room: s.room || "",
      startTime: toTimeInput(s.startTime),
      endTime: toTimeInput(s.endTime),
    }));
    setAgenda(agendaState);

    const organizersState = (e.draftOrganizers || []).map((o, index) => ({
      id: o.id || o._id || index,
      name: o.name || "",
      role: o.role || "",
      org: o.org || "",
      link: o.link || "",
    }));
    setOrganizers(organizersState);

    const galleryState = (e.draftGallery || []).map((g, index) => ({
      id: g.id || g._id || index,
      title: g.title || "",
      type: g.type || "image",
      file: g.file || "",
    }));
    setGallery(galleryState);

    setSettings({
      visibility: e.settings?.visibility || "private",
      matchmakingEnabled:
        typeof e.settings?.matchmakingEnabled === "boolean"
          ? e.settings.matchmakingEnabled
          : true,
      allowMeetingRequests:
        typeof e.settings?.allowMeetingRequests === "boolean"
          ? e.settings.allowMeetingRequests
          : true,
      showAttendeeCount:
        typeof e.settings?.showAttendeeCount === "boolean"
          ? e.settings.showAttendeeCount
          : false,
      allowExport:
        typeof e.settings?.allowExport === "boolean"
          ? e.settings.allowExport
          : true,
    });

    setDirty(false);
  }, [data]);

  // --- SMALL HELPERS --------------------------------------------------------

  const sessionsCount = agenda.length;
  const ticketsCount = tickets.length;
  const totalCapacity = useMemo(
    () =>
      tickets.reduce((sum, t) => {
        const v = parseInt(t.capacity || "0", 10);
        return sum + (Number.isNaN(v) ? 0 : v);
      }, 0),
    [tickets]
  );

  const dateRangeLabel = useMemo(() => {
    if (!logistics.startDate && !logistics.endDate) return "Dates not set";
    const start = logistics.startDate || "?";
    const end = logistics.endDate || start;
    return `${start} – ${end}`;
  }, [logistics.startDate, logistics.endDate]);

  const locationLabel = useMemo(() => {
    const parts = [logistics.city, logistics.country].filter(Boolean);
    return parts.length ? parts.join(", ") : "Location not set";
  }, [logistics.city, logistics.country]);

  const statusLabel =
    data?.event?.status ||
    (data?.event?.published ? "Published" : "Draft / Unpublished");

  const basics = {
    title: core.title,
    target: core.shortLabel,
    startDate: logistics.startDate,
    endDate: logistics.endDate,
    city: logistics.city,
    country: logistics.country,
    venueName: logistics.venueName,
    capacity: logistics.capacity,
    cover: logistics.cover,
    description: core.description,
  };

  const shortForPreview =
    core.shortLabel || core.tagline || "Describe your event in one line";

  const sectionStats = {
    basics: basics.title?.trim().length
      ? "Ready"
      : "Add title & audience",
    schedule:
      sessionsCount > 0
        ? `${sessionsCount} session${sessionsCount > 1 ? "s" : ""}`
        : "No sessions yet",
    tickets:
      ticketsCount > 0
        ? `${ticketsCount} plan${ticketsCount > 1 ? "s" : ""}`
        : "No tickets yet",
    organizers:
      organizers.length > 0
        ? `${organizers.length} contact${organizers.length > 1 ? "s" : ""}`
        : "Add your team",
    gallery:
      gallery.length > 0
        ? `${gallery.length} asset${gallery.length > 1 ? "s" : ""}`
        : "No media yet",
  };

  const titleForPreview = basics.title || "Untitled event";
  const subtitleForPreview =
    basics.target ||
    "Define who this event is for and what happens there.";

  // --- HANDLERS -------------------------------------------------------------

  const handleCoreChange = (field) => (e) => {
    const value = e.target.value;
    setCore((prev) => ({ ...prev, [field]: value }));
    markDirty();
  };

  const handleLogisticsChange = (field) => (e) => {
    const value = e.target.value;
    setLogistics((prev) => ({ ...prev, [field]: value }));
    markDirty();
  };

  const handleSettingsToggle = (field) => () => {
    setSettings((prev) => ({ ...prev, [field]: !prev[field] }));
    markDirty();
  };

  const handleSettingsSelect = (field) => (e) => {
    setSettings((prev) => ({ ...prev, [field]: e.target.value }));
    markDirty();
  };

  const updateArrayField = (setter) => (index, field, value) => {
    setter((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
    markDirty();
  };

  const removeArrayItem = (setter) => (index) => {
    setter((prev) => prev.filter((_, i) => i !== index));
    markDirty();
  };

  const addAgendaRow = () => {
    setAgenda((prev) => [
      ...prev,
      {
        id: `session-${Date.now()}`,
        sessionTitle: "",
        track: "",
        room: "",
        startTime: "",
        endTime: "",
      },
    ]);
    markDirty();
  };

  const addTicketRow = () => {
    setTickets((prev) => [
      ...prev,
      {
        id: `ticket-${Date.now()}`,
        name: "",
        price: "",
        currency: defaultCurrency || "EUR",
        capacity: "",
        maxPerUser: "",
        accessLevel: "standard",
      },
    ]);
    markDirty();
  };

  const addOrganizerRow = () => {
    setOrganizers((prev) => [
      ...prev,
      {
        id: `org-${Date.now()}`,
        name: "",
        role: "",
        org: "",
        link: "",
      },
    ]);
    markDirty();
  };

  const addGalleryRow = () => {
    setGallery((prev) => [
      ...prev,
      {
        id: `media-${Date.now()}`,
        title: "",
        type: "image",
        file: "",
      },
    ]);
    markDirty();
  };

  const updateAgenda = updateArrayField(setAgenda);
  const removeAgenda = removeArrayItem(setAgenda);

  const updateTickets = updateArrayField(setTickets);
  const removeTicket = removeArrayItem(setTickets);

  const updateOrganizers = updateArrayField(setOrganizers);
  const removeOrganizer = removeArrayItem(setOrganizers);

  const updateGallery = updateArrayField(setGallery);
  const removeGalleryItem = removeArrayItem(setGallery);

  const handleReset = () => {
    if (!data?.event) return;
    const e = data.event;

    setCore({
      title: e.title || "",
      shortLabel: e.shortLabel || "",
      tagline: e.tagline || "",
      description: e.description || "",
      category: e.category || "",
      tags: Array.isArray(e.tags) ? e.tags.join(", ") : e.tags || "",
    });

    setLogistics({
      startDate: toDateInput(e.startDate),
      endDate: toDateInput(e.endDate),
      timezone: e.timezone || "",
      city: e.city || "",
      country: e.country || "",
      venueName: e.venueName || "",
      eventFormat: e.eventFormat || "onsite",
      streamingUrl: e.streamingUrl || "",
      mainLanguage: e.mainLanguage || "",
      capacity:
        e.capacity !== undefined && e.capacity !== null
          ? String(e.capacity)
          : "",
      cover: e.cover || "",
    });

    const ticketsState = (e.ticketPlans || []).map((t, index) => ({
      id: t.id || t._id || index,
      name: t.name || "",
      price:
        t.price !== undefined && t.price !== null ? String(t.price) : "",
      currency: t.currency || "EUR",
      capacity:
        t.capacity !== undefined && t.capacity !== null
          ? String(t.capacity)
          : "",
      maxPerUser:
        t.maxPerUser !== undefined && t.maxPerUser !== null
          ? String(t.maxPerUser)
          : "",
      accessLevel: t.accessLevel || "standard",
    }));
    setTickets(ticketsState);

    setAgenda(
      (data.schedule || []).map((s) => ({
        id: s.id || s._id,
        sessionTitle: s.sessionTitle || "",
        track: s.track || "",
        room: s.room || "",
        startTime: toTimeInput(s.startTime),
        endTime: toTimeInput(s.endTime),
      }))
    );

    setOrganizers(
      (e.draftOrganizers || []).map((o, index) => ({
        id: o.id || o._id || index,
        name: o.name || "",
        role: o.role || "",
        org: o.org || "",
        link: o.link || "",
      }))
    );

    setGallery(
      (e.draftGallery || []).map((g, index) => ({
        id: g.id || g._id || index,
        title: g.title || "",
        type: g.type || "image",
        file: g.file || "",
      }))
    );

    setSettings({
      visibility: e.settings?.visibility || "private",
      matchmakingEnabled:
        typeof e.settings?.matchmakingEnabled === "boolean"
          ? e.settings.matchmakingEnabled
          : true,
      allowMeetingRequests:
        typeof e.settings?.allowMeetingRequests === "boolean"
          ? e.settings.allowMeetingRequests
          : true,
      showAttendeeCount:
        typeof e.settings?.showAttendeeCount === "boolean"
          ? e.settings.showAttendeeCount
          : false,
      allowExport:
        typeof e.settings?.allowExport === "boolean"
          ? e.settings.allowExport
          : true,
    });

    setDirty(false);
  };

  const handleSave = async () => {
    if (!eventId) return;

    const payload = {
      basics: {
        title: core.title,
        description: core.description,
        target: core.shortLabel,
        startDate: logistics.startDate,
        endDate: logistics.endDate,
        city: logistics.city,
        country: logistics.country,
        venueName: logistics.venueName,
        capacity:
          logistics.capacity !== "" && logistics.capacity !== null
            ? Number(logistics.capacity)
            : null,
        cover: logistics.cover || "",
        shortLabel: core.shortLabel,
        tagline: core.tagline,
        category: core.category,
        tags: core.tags,
        timezone: logistics.timezone,
        eventFormat: logistics.eventFormat,
        streamingUrl: logistics.streamingUrl,
        mainLanguage: logistics.mainLanguage,
      },
      schedule: agenda
        .filter(
          (s) =>
            (s.sessionTitle || "").trim() ||
            (s.startTime || "").trim() ||
            (s.endTime || "").trim()
        )
        .map((s) => ({
          sessionTitle: s.sessionTitle,
          room: s.room,
          track: s.track,
          startTime: s.startTime,
          endTime: s.endTime,
        })),
      tickets: tickets
        .filter((t) => (t.name || "").trim())
        .map((t) => ({
          name: t.name,
          price: t.price !== "" ? Number(t.price) : 0,
          currency: t.currency || "EUR",
          capacity:
            t.capacity !== "" && t.capacity !== null
              ? Number(t.capacity)
              : undefined,
          maxPerUser:
            t.maxPerUser !== "" && t.maxPerUser !== null
              ? Number(t.maxPerUser)
              : undefined,
          accessLevel: t.accessLevel || "standard",
        })),
      organizers: organizers
        .filter((o) => (o.name || "").trim() || (o.link || "").trim())
        .map((o) => ({
          name: o.name,
          role: o.role,
          org: o.org,
          link: o.link,
        })),
      gallery: gallery
        .filter((g) => (g.file || "").trim())
        .map((g) => ({
          title: g.title,
          type: g.type || "image",
          file: g.file,
        })),
      settings: { ...settings },
    };

    try {
      await updateEvent({ eventId, body: payload }).unwrap();
      setDirty(false);
      refetch();
    } catch (err) {
      console.error("Failed to update event", err);
    }
  };

  // --- RENDER ---------------------------------------------------------------

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-slate-50 flex items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <FiClock className="h-4 w-4 animate-spin" />
          <span>Loading event...</span>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-slate-50 flex items-center justify-center px-4">
        <div className="max-w-md rounded-2xl border border-red-200 bg-red-50 px-5 py-4 shadow-md">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-500">
              <FiCalendar className="h-4 w-4" />
            </div>
            <div className="space-y-1.5">
              <p className="text-sm font-semibold text-red-800">
                Failed to load event
              </p>
              {error?.data?.message && (
                <p className="text-xs text-red-700">{error.data.message}</p>
              )}
              {!error?.data?.message && (
                <p className="text-xs text-red-700">
                  Please refresh the page or contact support.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-7">
        {/* HEADER */}
        <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-indigo-100 bg-indigo-50 shadow-sm">
              <FiLayers className="h-5 w-5 text-indigo-500" />
            </div>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-semibold tracking-tight text-slate-900 md:text-2xl">
                  {titleForPreview}
                </h1>
                <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] text-slate-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_0_3px_rgba(74,222,128,0.3)]" />
                  {statusLabel}
                </span>
                {dirty && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] text-amber-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                    Unsaved changes
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 md:text-sm">
                One focused workspace to edit your event identity, dates,
                tickets, schedule and team without jumping across pages.
              </p>
              <div className="flex flex-wrap gap-2 text-[11px] text-slate-700 md:text-xs">
                <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1">
                  <FiCalendar className="h-3 w-3" />
                  {dateRangeLabel}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1">
                  <FiMapPin className="h-3 w-3" />
                  {locationLabel}
                </span>
                {basics.capacity && basics.capacity !== "0" && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1">
                    <FiUsers className="h-3 w-3" />
                    Capacity: {basics.capacity}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-row items-center gap-2 md:flex-col md:items-end">
            <button
              type="button"
              onClick={handleReset}
              disabled={!dirty || isSaving}
              className={
                "inline-flex items-center justify-center rounded-full border px-4 py-2 text-xs font-medium shadow-sm transition " +
                "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 " +
                ((!dirty || isSaving) ? "opacity-60 cursor-not-allowed" : "")
              }
            >
              Reset to saved
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!dirty || isSaving}
              className={
                "inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-xs font-medium text-white shadow-md transition " +
                (dirty
                  ? "bg-indigo-600 hover:bg-indigo-500"
                  : "bg-slate-400 cursor-not-allowed") +
                (isSaving ? " opacity-80" : "")
              }
            >
              {isSaving && (
                <FiClock className="h-3 w-3 animate-spin text-white" />
              )}
              {isSaving ? "Saving..." : "Save all changes"}
            </button>
          </div>
        </header>

        {/* KPI STRIP */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-800">
                <FiCalendar className="h-4 w-4 text-indigo-500" />
                Agenda sessions
              </div>
            </div>
            <div className="mt-2 text-2xl font-semibold text-slate-900">
              {sessionsCount}
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              Shown in the public program & meeting slots.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-800">
                <FiTag className="h-4 w-4 text-emerald-500" />
                Ticket plans
              </div>
            </div>
            <div className="mt-2 text-2xl font-semibold text-slate-900">
              {ticketsCount}
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              Total capacity: {totalCapacity || 0} people.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-800">
                <FiImage className="h-4 w-4 text-sky-500" />
                Media
              </div>
            </div>
            <div className="mt-2 text-2xl font-semibold text-slate-900">
              {gallery.length}
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              Use visuals to make the event page stand out.
            </p>
          </div>
        </div>

        {/* WORKSPACE: NAV + EDITOR + PREVIEW */}
        <div className="grid gap-6 lg:grid-cols-[230px,minmax(0,1.6fr),minmax(0,1.1fr)]">
          {/* Left: section navigation */}
          <aside className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
              <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Edit flow
              </p>
              <div className="flex flex-col gap-1.5">
                {TABS.map((tab, index) => {
                  const isActive = activeTab === tab.id;
                  const stat = sectionStats[tab.id] || "";
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={
                        "flex items-center justify-between rounded-xl px-3 py-2 text-left text-[11px] transition " +
                        (isActive
                          ? "bg-indigo-50 border border-indigo-200 text-indigo-700 shadow-sm"
                          : "bg-transparent border border-transparent text-slate-700 hover:border-slate-200 hover:bg-slate-50")
                      }
                    >
                      <div className="flex items-center gap-2">
                        {tab.id === "basics" && (
                          <FiLayers className="h-4 w-4" />
                        )}
                        {tab.id === "schedule" && (
                          <FiClock className="h-4 w-4" />
                        )}
                        {tab.id === "tickets" && (
                          <FiTag className="h-4 w-4" />
                        )}
                        {tab.id === "organizers" && (
                          <FiUsers className="h-4 w-4" />
                        )}
                        {tab.id === "gallery" && (
                          <FiImage className="h-4 w-4" />
                        )}
                        <div className="flex flex-col">
                          <span className="font-medium">{tab.label}</span>
                          <span className="text-[10px] text-slate-500">
                            {stat}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* Center: active editor section */}
          <main className="space-y-6">
            {/* BASICS */}
            {activeTab === "basics" && (
              <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="space-y-1.5">
                  <h2 className="text-sm font-semibold text-slate-900">
                    Event identity
                  </h2>
                  <p className="text-xs text-slate-500">
                    Title, audience and description used on the public event
                    page and marketplace cards.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-700">
                        Event name
                      </label>
                      <input
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                        type="text"
                        value={core.title}
                        onChange={handleCoreChange("title")}
                        placeholder="Africa Trade & Innovation Summit"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-700">
                        Target audience
                      </label>
                      <input
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                        type="text"
                        value={core.shortLabel}
                        onChange={handleCoreChange("shortLabel")}
                        placeholder="SMEs, buyers, NGOs, investors…"
                      />
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-700">
                          Start date
                        </label>
                        <input
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                          type="date"
                          value={logistics.startDate}
                          onChange={handleLogisticsChange("startDate")}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-700">
                          End date
                        </label>
                        <input
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                          type="date"
                          value={logistics.endDate}
                          onChange={handleLogisticsChange("endDate")}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-700">
                          City
                        </label>
                        <input
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                          type="text"
                          value={logistics.city}
                          onChange={handleLogisticsChange("city")}
                          placeholder="Tunis, Paris, Nairobi…"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-700">
                          Country
                        </label>
                        <input
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                          type="text"
                          value={logistics.country}
                          onChange={handleLogisticsChange("country")}
                          placeholder="Tunisia, France…"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-700">
                        Venue name
                      </label>
                      <input
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                        type="text"
                        value={logistics.venueName}
                        onChange={handleLogisticsChange("venueName")}
                        placeholder="Convention center, hotel, campus…"
                      />
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-700">
                          Capacity
                        </label>
                        <input
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                          type="number"
                          min="0"
                          value={logistics.capacity}
                          onChange={handleLogisticsChange("capacity")}
                          placeholder="Total seats"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-700">
                          Cover image URL
                        </label>
                        <input
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                          type="text"
                          value={logistics.cover}
                          onChange={handleLogisticsChange("cover")}
                          placeholder="https://…"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">
                    Detailed description
                  </label>
                  <textarea
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    rows={5}
                    value={core.description}
                    onChange={handleCoreChange("description")}
                    placeholder="Explain who this event is for, what happens each day and why people should join."
                  />
                  <p className="text-[10px] text-slate-500">
                    This appears on the event landing page, right under the hero section.
                  </p>
                </div>
              </section>
            )}

            {/* SCHEDULE */}
            {activeTab === "schedule" && (
              <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1.5">
                    <h2 className="text-sm font-semibold text-slate-900">
                      Schedule
                    </h2>
                    <p className="text-xs text-slate-500">
                      Define the key sessions that will appear in the public
                      agenda and power the meeting slots.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addAgendaRow}
                    className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-800 hover:bg-slate-50"
                  >
                    <FiPlus className="h-3 w-3" />
                    Add session
                  </button>
                </div>

                {agenda.length === 0 && (
                  <p className="text-[11px] text-slate-500">
                    No sessions yet. Start with your main plenary, then add
                    breakout tracks or workshops.
                  </p>
                )}

                <div className="space-y-3">
                  {agenda.map((s, index) => (
                    <div
                      key={s.id || index}
                      className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3"
                    >
                      <div className="flex flex-col gap-3 md:flex-row">
                        <div className="flex-1 space-y-2">
                          <input
                            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-100"
                            type="text"
                            placeholder="Session title"
                            value={s.sessionTitle}
                            onChange={(e) =>
                              updateAgenda(
                                index,
                                "sessionTitle",
                                e.target.value
                              )
                            }
                          />
                          <div className="flex gap-2">
                            <input
                              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-100"
                              type="time"
                              value={s.startTime}
                              onChange={(e) =>
                                updateAgenda(
                                  index,
                                  "startTime",
                                  e.target.value
                                )
                              }
                            />
                            <input
                              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-100"
                              type="time"
                              value={s.endTime}
                              onChange={(e) =>
                                updateAgenda(index, "endTime", e.target.value)
                              }
                            />
                          </div>
                        </div>
                        <div className="w-full space-y-2 md:w-56">
                          <input
                            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-100"
                            type="text"
                            placeholder="Track / theme"
                            value={s.track}
                            onChange={(e) =>
                              updateAgenda(index, "track", e.target.value)
                            }
                          />
                          <input
                            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-100"
                            type="text"
                            placeholder="Room"
                            value={s.room}
                            onChange={(e) =>
                              updateAgenda(index, "room", e.target.value)
                            }
                          />
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => removeAgenda(index)}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-red-50 text-red-500 hover:bg-red-100"
                        >
                          <FiTrash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* TICKETS */}
            {activeTab === "tickets" && (
              <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1.5">
                    <h2 className="text-sm font-semibold text-slate-900">
                      Tickets &amp; access
                    </h2>
                    <p className="text-xs text-slate-500">
                      Define ticket types, pricing and capacity. Later this will
                      connect with payments and check-in.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addTicketRow}
                    className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-800 hover:bg-slate-50"
                  >
                    <FiPlus className="h-3 w-3" />
                    Add ticket plan
                  </button>
                </div>

                {tickets.length === 0 && (
                  <p className="text-[11px] text-slate-500">
                    Create at least one ticket plan (Standard, VIP, NGO…).
                    You can limit seats per plan.
                  </p>
                )}

                <div className="space-y-3">
                  {tickets.map((t, index) => (
                    <div
                      key={t.id || index}
                      className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3"
                    >
                      <div className="flex flex-col gap-3 md:flex-row">
                        <div className="flex-1 space-y-2">
                          <input
                            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-100"
                            type="text"
                            placeholder="Name (Standard, VIP…)"
                            value={t.name}
                            onChange={(e) =>
                              updateTickets(index, "name", e.target.value)
                            }
                          />
                          <div className="flex gap-2">
                            <input
                              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-100"
                              type="number"
                              placeholder="Price"
                              value={t.price}
                              onChange={(e) =>
                                updateTickets(index, "price", e.target.value)
                              }
                            />
                            <input
                              className="w-24 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-100"
                              type="text"
                              placeholder="CUR"
                              value={t.currency}
                              onChange={(e) =>
                                updateTickets(index, "currency", e.target.value)
                              }
                            />
                          </div>
                        </div>
                        <div className="w-full space-y-2 md:w-60">
                          <input
                            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-100"
                            type="number"
                            placeholder="Capacity for this plan"
                            value={t.capacity}
                            onChange={(e) =>
                              updateTickets(index, "capacity", e.target.value)
                            }
                          />
                          <p className="text-[10px] text-slate-500">
                            Leave empty if this ticket is not limited separately
                            from global capacity.
                          </p>
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => removeTicket(index)}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-red-50 text-red-500 hover:bg-red-100"
                        >
                          <FiTrash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ORGANIZERS */}
            {activeTab === "organizers" && (
              <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1.5">
                    <h2 className="text-sm font-semibold text-slate-900">
                      Organizers &amp; partners
                    </h2>
                    <p className="text-xs text-slate-500">
                      Show who runs the event. These appear as organizer cards
                      on the event page.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addOrganizerRow}
                    className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-800 hover:bg-slate-50"
                  >
                    <FiPlus className="h-3 w-3" />
                    Add organizer
                  </button>
                </div>

                {organizers.length === 0 && (
                  <p className="text-[11px] text-slate-500">
                    Add at least one organizer or host. You can also add
                    partners or supporting organizations.
                  </p>
                )}

                <div className="space-y-3">
                  {organizers.map((o, index) => (
                    <div
                      key={o.id || index}
                      className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3"
                    >
                      <div className="grid gap-3 md:grid-cols-3">
                        <input
                          className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-100"
                          type="text"
                          placeholder="Name"
                          value={o.name}
                          onChange={(e) =>
                            updateOrganizers(index, "name", e.target.value)
                          }
                        />
                        <input
                          className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-100"
                          type="text"
                          placeholder="Role (Event director, Operations…)"
                          value={o.role}
                          onChange={(e) =>
                            updateOrganizers(index, "role", e.target.value)
                          }
                        />
                        <input
                          className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-100"
                          type="text"
                          placeholder="Profile or website link"
                          value={o.link}
                          onChange={(e) =>
                            updateOrganizers(index, "link", e.target.value)
                          }
                        />
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => removeOrganizer(index)}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-red-50 text-red-500 hover:bg-red-100"
                        >
                          <FiTrash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* GALLERY */}
            {activeTab === "gallery" && (
              <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1.5">
                    <h2 className="text-sm font-semibold text-slate-900">
                      Media &amp; gallery
                    </h2>
                    <p className="text-xs text-slate-500">
                      Upload visuals that will be used on the event page,
                      banners or highlights.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addGalleryRow}
                    className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-800 hover:bg-slate-50"
                  >
                    <FiPlus className="h-3 w-3" />
                    Add media
                  </button>
                </div>

                {gallery.length === 0 && (
                  <p className="text-[11px] text-slate-500">
                    Add at least one banner, venue picture or sponsor image to
                    make the page feel real.
                  </p>
                )}

                <div className="space-y-3">
                  {gallery.map((g, index) => (
                    <div
                      key={g.id || index}
                      className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3"
                    >
                      <div className="grid gap-3 md:grid-cols-[1.2fr,0.9fr]">
                        <div className="space-y-2">
                          <input
                            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-100"
                            type="text"
                            placeholder="Title (homepage hero, keynote, sponsor banner…)"
                            value={g.title}
                            onChange={(e) =>
                              updateGallery(index, "title", e.target.value)
                            }
                          />
                          <select
                            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-100"
                            value={g.type}
                            onChange={(e) =>
                              updateGallery(index, "type", e.target.value)
                            }
                          >
                            <option value="image">Image</option>
                            <option value="video">Video</option>
                            <option value="doc">Document</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <input
                            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-100"
                            type="text"
                            placeholder="File URL (or CDN link)"
                            value={g.file}
                            onChange={(e) =>
                              updateGallery(index, "file", e.target.value)
                            }
                          />
                          <p className="text-[10px] text-slate-500">
                            We recommend 16:9 or 4:3 images for best display.
                          </p>
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => removeGalleryItem(index)}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-red-50 text-red-500 hover:bg-red-100"
                        >
                          <FiTrash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </main>

          {/* Right: live preview / summary */}
          <aside className="space-y-4">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="h-28 bg-slate-100">
                {basics.cover ? (
                  <img
                    src={basics.cover}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-slate-400">
                    <FiImage className="h-7 w-7" />
                  </div>
                )}
              </div>
              <div className="space-y-1.5 p-4">
                <p className="line-clamp-2 text-sm font-medium text-slate-900">
                  {titleForPreview}
                </p>
                <p className="line-clamp-2 text-[11px] text-slate-500">
                  {subtitleForPreview}
                </p>
                <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
                  <FiCalendar className="h-3 w-3" />
                  {dateRangeLabel}
                </p>
                <p className="flex items-center gap-1 text-[11px] text-slate-500">
                  <FiMapPin className="h-3 w-3" />
                  {locationLabel}
                </p>
              </div>
            </div>

            <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Health of this event
              </p>
              <div className="space-y-2 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-slate-700">Basics</span>
                  <span className="text-slate-500">{sectionStats.basics}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-700">Schedule</span>
                  <span className="text-slate-500">
                    {sectionStats.schedule}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-700">Tickets</span>
                  <span className="text-slate-500">
                    {sectionStats.tickets}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-700">Organizers</span>
                  <span className="text-slate-500">
                    {sectionStats.organizers}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-700">Media</span>
                  <span className="text-slate-500">
                    {sectionStats.gallery}
                  </span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Sticky save bar */}
      {dirty && (
        <div className="pointer-events-none fixed inset-x-0 bottom-4 flex justify-center px-4">
          <div className="pointer-events-auto flex max-w-xl flex-1 items-center justify-between gap-3 rounded-full border border-slate-200 bg-white px-4 py-2 shadow-lg">
            <div className="flex items-center gap-2 text-[11px] text-slate-700">
              <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400 shadow-[0_0_0_3px_rgba(251,191,36,0.35)]" />
              <span>You have unsaved changes to this event.</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleReset}
                disabled={isSaving}
                className={
                  "rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50 " +
                  (isSaving ? "opacity-60 cursor-not-allowed" : "")
                }
              >
                Discard
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className={
                  "rounded-full bg-indigo-600 px-4 py-1.5 text-[11px] font-medium text-white shadow-md hover:bg-indigo-500 " +
                  (isSaving ? "opacity-80 cursor-wait" : "")
                }
              >
                {isSaving ? "Saving…" : "Save now"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventManagerEventPage;
