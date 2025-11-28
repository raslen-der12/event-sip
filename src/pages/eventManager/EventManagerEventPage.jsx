// src/pages/eventManager/EventManagerEventPage.jsx
import React, { useEffect, useState } from "react";
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
} from "react-icons/fi";
import "./event-manager-dashboard.css";

const TABS = [
  { id: "basics", label: "Event data" },
  { id: "schedule", label: "Schedule" },
  { id: "tickets", label: "Tickets" },
  { id: "organizers", label: "Organizers & gallery" },
];

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
    // if backend ever sends "HH:MM"
    return String(value).slice(0, 5);
  }
  return d.toISOString().slice(11, 16); // HH:MM
};

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

  const emptyBasics = {
    title: "",
    description: "",
    target: "",
    startDate: "",
    endDate: "",
    city: "",
    country: "",
    venueName: "",
    capacity: "",
    cover: "",
  };

  const [basics, setBasics] = useState(emptyBasics);
  const [schedule, setSchedule] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [organizers, setOrganizers] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [activeTab, setActiveTab] = useState("basics");
  const [dirty, setDirty] = useState(false);

  // Map API payload into local editable state
  useEffect(() => {
    if (!data?.event) return;

    const e = data.event;
    const basicsState = {
      title: e.title || "",
      description: e.description || "",
      target: e.target || "",
      startDate: toDateInput(e.startDate),
      endDate: toDateInput(e.endDate),
      city: e.city || "",
      country: e.country || "",
      venueName: e.venueName || "",
      capacity:
        e.capacity !== undefined && e.capacity !== null ? String(e.capacity) : "",
      cover: e.cover || "",
    };

    const schedState = (data.schedule || []).map((s) => ({
      id: s.id || s._id,
      sessionTitle: s.sessionTitle || "",
      room: s.room || "",
      track: s.track || "",
      startTime: toTimeInput(s.startTime),
      endTime: toTimeInput(s.endTime),
    }));

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
    }));

    const organizersState = (e.draftOrganizers || []).map((o, index) => ({
      id: o.id || o._id || index,
      name: o.name || "",
      role: o.role || "",
      link: o.link || "",
    }));

    const galleryState = (e.draftGallery || []).map((g, index) => ({
      id: g.id || g._id || index,
      title: g.title || "",
      type: g.type || "image",
      file: g.file || "",
    }));

    setBasics(basicsState);
    setSchedule(schedState);
    setTickets(ticketsState);
    setOrganizers(organizersState);
    setGallery(galleryState);
    setDirty(false);
  }, [data]);

  const markDirty = () => setDirty(true);

  const handleBasicsChange = (field) => (e) => {
    const value = e.target.value;
    setBasics((prev) => ({ ...prev, [field]: value }));
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

  const addScheduleRow = () => {
    setSchedule((prev) => [
      ...prev,
      {
        id: `new-${Date.now()}`,
        sessionTitle: "",
        room: "",
        track: "",
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
        currency: "EUR",
        capacity: "",
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

  const handleReset = () => {
    if (!data?.event) return;
    // Re-run mapping from last server payload
    const e = data.event;

    setBasics({
      title: e.title || "",
      description: e.description || "",
      target: e.target || "",
      startDate: toDateInput(e.startDate),
      endDate: toDateInput(e.endDate),
      city: e.city || "",
      country: e.country || "",
      venueName: e.venueName || "",
      capacity:
        e.capacity !== undefined && e.capacity !== null ? String(e.capacity) : "",
      cover: e.cover || "",
    });

    setSchedule(
      (data.schedule || []).map((s) => ({
        id: s.id || s._id,
        sessionTitle: s.sessionTitle || "",
        room: s.room || "",
        track: s.track || "",
        startTime: toTimeInput(s.startTime),
        endTime: toTimeInput(s.endTime),
      }))
    );

    setTickets(
      (e.ticketPlans || []).map((t, index) => ({
        id: t.id || t._id || index,
        name: t.name || "",
        price:
          t.price !== undefined && t.price !== null ? String(t.price) : "",
        currency: t.currency || "EUR",
        capacity:
          t.capacity !== undefined && t.capacity !== null
            ? String(t.capacity)
            : "",
      }))
    );

    setOrganizers(
      (e.draftOrganizers || []).map((o, index) => ({
        id: o.id || o._id || index,
        name: o.name || "",
        role: o.role || "",
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

    setDirty(false);
  };

  const handleSave = async () => {
    if (!eventId) return;

    const payload = {
      basics: {
        ...basics,
        capacity:
          basics.capacity !== "" && basics.capacity !== null
            ? Number(basics.capacity)
            : null,
      },
      schedule: schedule
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
        })),
      organizers: organizers
        .filter((o) => (o.name || "").trim() || (o.link || "").trim())
        .map((o) => ({
          name: o.name,
          role: o.role,
          link: o.link,
        })),
      gallery: gallery
        .filter((g) => (g.file || "").trim())
        .map((g) => ({
          title: g.title,
          type: g.type || "image",
          file: g.file,
        })),
    };

    try {
      await updateEvent({ eventId, body: payload }).unwrap();
      setDirty(false);
      refetch();
    } catch (err) {
      console.error("Failed to update event", err);
    }
  };

  if (isLoading) {
    return (
      <div className="emd-root">
        <div className="emd-inner">
          <p>Loading event...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="emd-root">
        <div className="emd-inner">
          <p>Failed to load event.</p>
          {error?.data?.message && (
            <p className="emd-error">{error.data.message}</p>
          )}
        </div>
      </div>
    );
  }

  const updateSchedule = updateArrayField(setSchedule);
  const updateTickets = updateArrayField(setTickets);
  const updateOrganizers = updateArrayField(setOrganizers);
  const updateGallery = updateArrayField(setGallery);

  const removeSchedule = removeArrayItem(setSchedule);
  const removeTicket = removeArrayItem(setTickets);
  const removeOrganizer = removeArrayItem(setOrganizers);
  const removeGalleryItem = removeArrayItem(setGallery);

  return (
    <div className="emd-root">
      <div className="emd-inner">
        {/* Top row: title + actions */}
        <div className="emd-main-header">
          <div className="emd-main-header-left">
            <span className="emd-main-icon">
              <FiCalendar />
            </span>
            <div>
              <p className="emd-main-title">
                {basics.title || "Untitled event"}
              </p>
              <p className="emd-main-caption">
                View and update the event created from your Event Manager
                onboarding.
              </p>
            </div>
          </div>
          <div className="emd-main-header-right">
            <button
              type="button"
              className="emd-btn-ghost"
              onClick={handleReset}
              disabled={!dirty || isSaving}
            >
              Reset
            </button>
            <button
              type="button"
              className="emd-btn-primary"
              onClick={handleSave}
              disabled={!dirty || isSaving}
            >
              {isSaving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </div>

        {/* Layout: sidebar + main tabs */}
        <div className="emd-layout">
          <aside className="emd-sidebar">
            <div className="emd-event-card">
              <div className="emd-event-cover">
                {basics.cover ? (
                  <img src={basics.cover} alt="" />
                ) : (
                  <div className="emd-event-cover-placeholder">
                    <FiImage />
                  </div>
                )}
              </div>
              <div className="emd-event-body">
                <p className="emd-event-title">
                  {basics.title || "New event"}
                </p>
                <p className="emd-event-target">
                  {basics.target || "Audience not specified yet"}
                </p>
                <p className="emd-event-meta">
                  <FiUsers />
                  Capacity:{" "}
                  {basics.capacity && basics.capacity !== "0"
                    ? basics.capacity
                    : "not set"}
                </p>
              </div>
            </div>

            <nav className="emd-nav">
              {TABS.map((tab) => {
                const isActive = tab.id === activeTab;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    className={[
                      "emd-nav-item",
                      isActive ? "emd-nav-item--active" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    {tab.id === "basics" && <FiCalendar />}
                    {tab.id === "schedule" && <FiCalendar />}
                    {tab.id === "tickets" && <FiTag />}
                    {tab.id === "organizers" && <FiImage />}
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </aside>

          <main className="emd-main">
            {/* BASICS TAB */}
            {activeTab === "basics" && (
              <section className="emd-main-body">
                <div className="emw-grid">
                  <div className="emw-col">
                    <div className="emw-field">
                      <label className="emw-label">Event name</label>
                      <input
                        className="emw-input"
                        type="text"
                        value={basics.title}
                        onChange={handleBasicsChange("title")}
                      />
                    </div>
                    <div className="emw-field">
                      <label className="emw-label">Target audience</label>
                      <input
                        className="emw-input"
                        type="text"
                        value={basics.target}
                        onChange={handleBasicsChange("target")}
                      />
                    </div>
                    <div className="emw-field">
                      <label className="emw-label">Description</label>
                      <textarea
                        className="emw-textarea"
                        rows={4}
                        value={basics.description}
                        onChange={handleBasicsChange("description")}
                      />
                    </div>
                  </div>
                  <div className="emw-col">
                    <div className="emw-field">
                      <label className="emw-label">Start date</label>
                      <input
                        className="emw-input"
                        type="date"
                        value={basics.startDate}
                        onChange={handleBasicsChange("startDate")}
                      />
                    </div>
                    <div className="emw-field">
                      <label className="emw-label">End date</label>
                      <input
                        className="emw-input"
                        type="date"
                        value={basics.endDate}
                        onChange={handleBasicsChange("endDate")}
                      />
                    </div>
                    <div className="emw-field">
                      <label className="emw-label">City</label>
                      <input
                        className="emw-input"
                        type="text"
                        value={basics.city}
                        onChange={handleBasicsChange("city")}
                      />
                    </div>
                    <div className="emw-field">
                      <label className="emw-label">Country</label>
                      <input
                        className="emw-input"
                        type="text"
                        value={basics.country}
                        onChange={handleBasicsChange("country")}
                      />
                    </div>
                    <div className="emw-field">
                      <label className="emw-label">Venue name</label>
                      <input
                        className="emw-input"
                        type="text"
                        value={basics.venueName}
                        onChange={handleBasicsChange("venueName")}
                      />
                    </div>
                    <div className="emw-field">
                      <label className="emw-label">Capacity</label>
                      <input
                        className="emw-input"
                        type="number"
                        min="0"
                        value={basics.capacity}
                        onChange={handleBasicsChange("capacity")}
                      />
                    </div>
                    <div className="emw-field">
                      <label className="emw-label">Cover image URL</label>
                      <input
                        className="emw-input"
                        type="text"
                        value={basics.cover}
                        onChange={handleBasicsChange("cover")}
                      />
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* SCHEDULE TAB */}
            {activeTab === "schedule" && (
              <section className="emd-main-body">
                <div className="emw-field">
                  <label className="emw-label">Sessions</label>
                  {schedule.length === 0 && (
                    <p className="emw-help">
                      No sessions yet. Add at least one session with times.
                    </p>
                  )}
                  {schedule.map((s, index) => (
                    <div
                      key={s.id || index}
                      className="emw-input-inline"
                      style={{ marginBottom: 6 }}
                    >
                      <input
                        className="emw-input"
                        type="text"
                        placeholder="Session title"
                        value={s.sessionTitle}
                        onChange={(e) =>
                          updateSchedule(index, "sessionTitle", e.target.value)
                        }
                      />
                      <input
                        className="emw-input emw-input--time"
                        type="time"
                        value={s.startTime}
                        onChange={(e) =>
                          updateSchedule(index, "startTime", e.target.value)
                        }
                      />
                      <input
                        className="emw-input emw-input--time"
                        type="time"
                        value={s.endTime}
                        onChange={(e) =>
                          updateSchedule(index, "endTime", e.target.value)
                        }
                      />
                      <input
                        className="emw-input"
                        type="text"
                        placeholder="Room"
                        value={s.room}
                        onChange={(e) =>
                          updateSchedule(index, "room", e.target.value)
                        }
                      />
                      <button
                        type="button"
                        className="emw-btn-icon"
                        onClick={() => removeSchedule(index)}
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="emw-btn-secondary"
                    onClick={addScheduleRow}
                  >
                    <FiPlus />
                    Add session
                  </button>
                </div>
              </section>
            )}

            {/* TICKETS TAB */}
            {activeTab === "tickets" && (
              <section className="emd-main-body">
                <div className="emw-field">
                  <label className="emw-label">Ticket plans</label>
                  {tickets.length === 0 && (
                    <p className="emw-help">
                      No ticket plans yet. Create at least one type (Standard,
                      VIP, etc.).
                    </p>
                  )}
                  {tickets.map((t, index) => (
                    <div
                      key={t.id || index}
                      className="emw-input-inline"
                      style={{ marginBottom: 6 }}
                    >
                      <input
                        className="emw-input"
                        type="text"
                        placeholder="Name"
                        value={t.name}
                        onChange={(e) =>
                          updateTickets(index, "name", e.target.value)
                        }
                      />
                      <input
                        className="emw-input"
                        type="number"
                        placeholder="Price"
                        value={t.price}
                        onChange={(e) =>
                          updateTickets(index, "price", e.target.value)
                        }
                      />
                      <input
                        className="emw-input"
                        type="text"
                        placeholder="Currency"
                        value={t.currency}
                        onChange={(e) =>
                          updateTickets(index, "currency", e.target.value)
                        }
                      />
                      <input
                        className="emw-input"
                        type="number"
                        placeholder="Capacity"
                        value={t.capacity}
                        onChange={(e) =>
                          updateTickets(index, "capacity", e.target.value)
                        }
                      />
                      <button
                        type="button"
                        className="emw-btn-icon"
                        onClick={() => removeTicket(index)}
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="emw-btn-secondary"
                    onClick={addTicketRow}
                  >
                    <FiPlus />
                    Add ticket plan
                  </button>
                </div>
              </section>
            )}

            {/* ORGANIZERS & GALLERY TAB */}
            {activeTab === "organizers" && (
              <section className="emd-main-body">
                <div className="emw-grid">
                  <div className="emw-col">
                    <div className="emw-field">
                      <label className="emw-label">Organizers</label>
                      {organizers.length === 0 && (
                        <p className="emw-help">
                          No organizers yet. Add your team members here.
                        </p>
                      )}
                      {organizers.map((o, index) => (
                        <div
                          key={o.id || index}
                          className="emw-input-inline"
                          style={{ marginBottom: 6 }}
                        >
                          <input
                            className="emw-input"
                            type="text"
                            placeholder="Name"
                            value={o.name}
                            onChange={(e) =>
                              updateOrganizers(
                                index,
                                "name",
                                e.target.value
                              )
                            }
                          />
                          <input
                            className="emw-input"
                            type="text"
                            placeholder="Role"
                            value={o.role}
                            onChange={(e) =>
                              updateOrganizers(
                                index,
                                "role",
                                e.target.value
                              )
                            }
                          />
                          <input
                            className="emw-input"
                            type="text"
                            placeholder="Link (LinkedIn, website...)"
                            value={o.link}
                            onChange={(e) =>
                              updateOrganizers(
                                index,
                                "link",
                                e.target.value
                              )
                            }
                          />
                          <button
                            type="button"
                            className="emw-btn-icon"
                            onClick={() => removeOrganizer(index)}
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        className="emw-btn-secondary"
                        onClick={addOrganizerRow}
                      >
                        <FiPlus />
                        Add organizer
                      </button>
                    </div>
                  </div>
                  <div className="emw-col">
                    <div className="emw-field">
                      <label className="emw-label">Gallery media</label>
                      {gallery.length === 0 && (
                        <p className="emw-help">
                          Add images or media URLs to showcase your event.
                        </p>
                      )}
                      {gallery.map((g, index) => (
                        <div
                          key={g.id || index}
                          className="emw-input-inline"
                          style={{ marginBottom: 6 }}
                        >
                          <input
                            className="emw-input"
                            type="text"
                            placeholder="Title"
                            value={g.title}
                            onChange={(e) =>
                              updateGallery(index, "title", e.target.value)
                            }
                          />
                          <input
                            className="emw-input"
                            type="text"
                            placeholder="File URL"
                            value={g.file}
                            onChange={(e) =>
                              updateGallery(index, "file", e.target.value)
                            }
                          />
                          <button
                            type="button"
                            className="emw-btn-icon"
                            onClick={() => removeGalleryItem(index)}
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        className="emw-btn-secondary"
                        onClick={addGalleryRow}
                      >
                        <FiPlus />
                        Add media
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default EventManagerEventPage;
