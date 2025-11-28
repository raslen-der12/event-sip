// src/pages/eventManager/EventManagerDashboardPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  FiCalendar,
  FiClock,
  FiMapPin,
  FiUsers,
  FiImage,
  FiPlayCircle,
  FiArrowRight,
  FiChevronLeft,
  FiChevronRight,
  FiList,
  FiTag,
  FiUploadCloud,
  FiCheckCircle,
  FiLayers,
  FiMoreHorizontal,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import "./event-manager-dashboard.css";
import {
  useCreateEventFromWizardMutation,
  useAdminListEventManagerApplicationsQuery,
} from "../../features/eventManager/eventManagerApiSlice";
import EventStatsPage from "./EventStatsPage";

/* ────────────────────────── Step config ─────────────────────────── */

const WIZARD_STEPS = [
  {
    id: "basics",
    label: "Event basics",
    caption: "Name, dates, location & target",
    icon: FiLayers,
  },
  {
    id: "schedule",
    label: "Schedule",
    caption: "Sessions, rooms & times",
    icon: FiCalendar,
  },
  {
    id: "tickets",
    label: "Tickets",
    caption: "Ticket types & capacity",
    icon: FiTag,
  },
  {
    id: "organizers",
    label: "Organizers & gallery",
    caption: "Partners and visual assets",
    icon: FiImage,
  },
];

/* ────────────────────────── Helpers ─────────────────────────────── */

const formatDateLabel = (value) => {
  if (!value) return "";
  try {
    const isYmd = /^\d{4}-\d{2}-\d{2}$/.test(value);
    const d = isYmd ? new Date(`${value}T00:00:00Z`) : new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return value;
  }
};

const scrollWizardTop = () => {
  const el = document.querySelector(".emw-root");
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  } else {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
};

/* ────────────────────────── Defaults / mock ────────────────────── */

const defaultBasics = {
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

const defaultSchedule = [
  {
    id: "s1",
    sessionTitle: "Opening & Registration",
    startTime: "09:00",
    endTime: "09:45",
    room: "Main Hall",
    track: "General",
  },
];

const defaultTickets = [
  {
    id: "t1",
    name: "Standard",
    price: "49",
    currency: "EUR",
    capacity: "200",
  },
];

const defaultOrganizers = [
  {
    id: "o1",
    name: "Main organizer",
    type: "Organizer",
    link: "",
  },
];

const defaultGallery = [
  {
    id: "g1",
    title: "Hero cover",
    type: "image",
    file: "",
  },
];

/* ────────────────────────── Main Page ──────────────────────────── */

const EventManagerDashboardPage = () => {
  const navigate = useNavigate();

  const [createEventFromWizard, { isLoading: isCreating }] =
    useCreateEventFromWizardMutation();

  // Check if this manager already has events (then we show EventStatsPage)
  const {
    data: eventsData,
    isLoading: isEventsLoading,
    isError: isEventsError,
  } = useAdminListEventManagerApplicationsQuery();

  const events = eventsData?.events || [];
  const hasExistingEvents = !isEventsError && events.length > 0;

  // Wizard state
  const [activeWizardStepIndex, setActiveWizardStepIndex] = useState(0);

  const [basics, setBasics] = useState(defaultBasics);
  const [schedule, setSchedule] = useState(defaultSchedule);
  const [tickets, setTickets] = useState(defaultTickets);
  const [organizers, setOrganizers] = useState(defaultOrganizers);
  const [gallery, setGallery] = useState(defaultGallery);

  const stepsCount = WIZARD_STEPS.length;
  const canGoBack = activeWizardStepIndex > 0;
  const isLastStep = activeWizardStepIndex === stepsCount - 1;

  const handleNext = () => {
    if (isLastStep) {
      handleFinishOnboarding();
    } else {
      setActiveWizardStepIndex((i) => {
        const next = Math.min(i + 1, stepsCount - 1);
        scrollWizardTop();
        return next;
      });
    }
  };

  const handlePrev = () => {
    if (!canGoBack) return;
    setActiveWizardStepIndex((i) => {
      const prev = Math.max(i - 1, 0);
      scrollWizardTop();
      return prev;
    });
  };

  const handleJumpToStep = (index) => {
    if (index < 0 || index > stepsCount - 1) return;
    setActiveWizardStepIndex(index);
    scrollWizardTop();
  };

  const handleFinishOnboarding = async () => {
    try {
      // Ensure we have a cover:
      // - use basics.cover if filled
      // - otherwise fallback to first image in gallery
      let finalBasics = { ...basics };

      if (!finalBasics.cover && Array.isArray(gallery)) {
        const hero = gallery.find(
          (g) => g && g.type === "image" && g.file
        );
        if (hero) {
          finalBasics.cover = hero.file;
        }
      }

      if (!finalBasics.cover) {
        // Event schema requires cover; don't hit backend without it
        alert(
          "Please add a cover image. You can set it in the Basics step or add an image in Gallery & media."
        );
        return;
      }

      const payload = {
        basics: finalBasics,
        schedule,
        tickets,
        organizers,
        gallery,
      };

      const res = await createEventFromWizard(payload).unwrap();

      const eventId =
        res?.event?.id || res?.event?._id || res?.event?._id?.toString?.();

      if (!eventId) {
        console.error(
          "[EventManagerDashboard] Missing event id in response",
          res
        );
        alert(
          "Event was created but we couldn't detect its ID. Please refresh the page."
        );
        return;
      }

      // Redirect to the new event dashboard route
      navigate(`/event-manager/dashboard/${eventId}`, { replace: true });
    } catch (err) {
      console.error(
        "[EventManagerDashboard] Failed to create event from wizard",
        err
      );
      alert(
        "Something went wrong while creating your event. Please check required fields and try again."
      );
    }
  };

  /* ─────────────── Render branches ─────────────── */

  // While we don't know yet if events exist, show a light loader
  if (isEventsLoading) {
    return (
      <div className="emw-root">
        <div className="emw-inner container">
          <p className="emw-loading">Loading your Event Manager space…</p>
        </div>
      </div>
    );
  }

  // If the actor already has created events → full stats page
  if (hasExistingEvents) {
    return <EventStatsPage events={events} />;
  }

  // No events yet → first time: show forced tutorial (wizard)
  return (
    <WizardLayout
      activeIndex={activeWizardStepIndex}
      onPrev={handlePrev}
      onNext={handleNext}
      onJumpToStep={handleJumpToStep}
      basics={basics}
      setBasics={setBasics}
      schedule={schedule}
      setSchedule={setSchedule}
      tickets={tickets}
      setTickets={setTickets}
      organizers={organizers}
      setOrganizers={setOrganizers}
      gallery={gallery}
      setGallery={setGallery}
      isLastStep={isLastStep}
      canGoBack={canGoBack}
      isSaving={isCreating}
    />
  );
};

/* ────────────────────────── Wizard Layout ─────────────────────── */

const WizardLayout = ({
  activeIndex,
  onPrev,
  onNext,
  onJumpToStep,
  basics,
  setBasics,
  schedule,
  setSchedule,
  tickets,
  setTickets,
  organizers,
  setOrganizers,
  gallery,
  setGallery,
  isLastStep,
  canGoBack,
  isSaving,
}) => {
  const activeStep = WIZARD_STEPS[activeIndex];

  return (
    <div className="emw-root">
      <div className="emw-inner container">
        {/* Top hero / meta */}
        <header className="emw-header">
          <div className="emw-header-main">
            <div className="emw-chip">New · Event Manager space</div>
            <h1 className="emw-title">Let’s set up your first event.</h1>
            <p className="emw-sub">
              A guided flow to create your event, schedule, tickets and
              organizers. We’ll place everything in your Event Manager
              dashboard when you’re done.
            </p>
          </div>
          <div className="emw-header-side">
            <div className="emw-progress-ring">
              <div className="emw-progress-ring-inner">
                <FiCheckCircle />
              </div>
              <span className="emw-progress-label">
                Step {activeIndex + 1} / {WIZARD_STEPS.length}
              </span>
            </div>
            <p className="emw-header-note">
              You can edit all of this later in the dashboard.
            </p>
          </div>
        </header>

        {/* Stepper */}
        <nav className="emw-stepper" aria-label="Create event steps">
          {WIZARD_STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isActive = idx === activeIndex;
            const isDone = idx < activeIndex;
            return (
              <button
                key={step.id}
                type="button"
                className={[
                  "emw-stepper-item",
                  isActive ? "emw-stepper-item--active" : "",
                  isDone ? "emw-stepper-item--done" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => onJumpToStep(idx)}
              >
                <span className="emw-stepper-icon">
                  {isDone ? <FiCheckCircle /> : <Icon />}
                </span>
                <span className="emw-stepper-text">
                  <span className="emw-stepper-label">{step.label}</span>
                  <span className="emw-stepper-caption">{step.caption}</span>
                </span>
              </button>
            );
          })}
        </nav>

        {/* Main card */}
        <section
          className="emw-card"
          data-step-id={activeStep.id}
          key={activeStep.id}
        >
          <div className="emw-card-header">
            <h2 className="emw-card-title">{activeStep.label}</h2>
            <p className="emw-card-caption">{activeStep.caption}</p>
          </div>
          <div className="emw-card-body">
            {activeStep.id === "basics" && (
              <WizardStepBasics basics={basics} setBasics={setBasics} />
            )}
            {activeStep.id === "schedule" && (
              <WizardStepSchedule
                schedule={schedule}
                setSchedule={setSchedule}
              />
            )}
            {activeStep.id === "tickets" && (
              <WizardStepTickets tickets={tickets} setTickets={setTickets} />
            )}
            {activeStep.id === "organizers" && (
              <WizardStepOrganizersGallery
                organizers={organizers}
                setOrganizers={setOrganizers}
                gallery={gallery}
                setGallery={setGallery}
              />
            )}
          </div>

          <footer className="emw-footer">
            <div className="emw-footer-left">
              {canGoBack ? (
                <button
                  type="button"
                  className="emw-btn emw-btn-ghost"
                  onClick={onPrev}
                >
                  <FiChevronLeft />
                  Back
                </button>
              ) : (
                <span className="emw-footer-hint">
                  Draft is local only for now. No emails or public listing.
                </span>
              )}
            </div>
            <div className="emw-footer-right">
              <button
                type="button"
                className="emw-btn emw-btn-primary"
                onClick={onNext}
                disabled={isSaving}
              >
                {isLastStep ? (
                  <>
                    {isSaving
                      ? "Creating event..."
                      : "Finish setup & go to dashboard"}
                    {!isSaving && <FiArrowRight />}
                  </>
                ) : (
                  <>
                    Save & continue
                    <FiChevronRight />
                  </>
                )}
              </button>
            </div>
          </footer>
        </section>
      </div>
    </div>
  );
};

/* ────────────────────────── Wizard Steps ───────────────────────── */

const WizardStepBasics = ({ basics, setBasics }) => {
  const onChange = (field) => (e) => {
    const value = e.target.value;
    setBasics((prev) => ({ ...prev, [field]: value }));
  };

  const todayStr = useMemo(
    () => new Date().toISOString().slice(0, 10),
    []
  );

  const handleStartDateChange = (e) => {
    const value = e.target.value;
    setBasics((prev) => {
      let endDate = prev.endDate;
      if (endDate && value && endDate < value) {
        endDate = value;
      }
      return { ...prev, startDate: value, endDate };
    });
  };

  const handleEndDateChange = (e) => {
    const value = e.target.value;
    setBasics((prev) => {
      let endDate = value || "";
      if (prev.startDate && endDate && endDate < prev.startDate) {
        endDate = prev.startDate;
      }
      return { ...prev, endDate };
    });
  };

  const startDateForInput = basics.startDate || "";
  const endDateForInput = basics.endDate || "";
  const endMin = basics.startDate || todayStr;

  const startLabel = basics.startDate
    ? formatDateLabel(basics.startDate)
    : "Start date";
  const endLabel = basics.endDate
    ? formatDateLabel(basics.endDate)
    : "End date";

  return (
    <div className="emw-grid">
      <div className="emw-column">
        <div className="emw-group">
          <p className="emw-group-title">Core information</p>
          <p className="emw-group-caption">
            This appears on your public event page and across the platform.
          </p>

          <label className="emw-field">
            <span className="emw-label">
              Event name <span>*</span>
            </span>
            <input
              type="text"
              className="emw-input"
              placeholder="Example: Africa Trade & Innovation Summit"
              value={basics.title}
              onChange={onChange("title")}
            />
          </label>

          <label className="emw-field">
            <span className="emw-label">
              Short description <span>*</span>
            </span>
            <textarea
              rows={4}
              className="emw-input emw-textarea"
              placeholder="Describe what happens in this event, who it is for and the main value for attendees."
              value={basics.description}
              onChange={onChange("description")}
            />
          </label>

          <label className="emw-field">
            <span className="emw-label">
              Main audience / target <span>*</span>
            </span>
            <input
              type="text"
              className="emw-input"
              placeholder="Example: SMEs in agrifood, logistics startups, NGOs…"
              value={basics.target}
              onChange={onChange("target")}
            />
          </label>
        </div>
      </div>

      <div className="emw-column">
        <div className="emw-group">
          <p className="emw-group-title">Dates & location</p>
          <p className="emw-group-caption">
            You can refine rooms and detailed schedule in the next step.
          </p>

          <div className="emw-field-inline">
            <label className="emw-field">
              <span className="emw-label">
                Start date <span>*</span>
              </span>
              <input
                type="date"
                className="emw-input"
                min={todayStr}
                value={startDateForInput}
                onChange={handleStartDateChange}
              />
            </label>
            <label className="emw-field">
              <span className="emw-label">
                End date <span>*</span>
              </span>
              <input
                type="date"
                className="emw-input"
                min={endMin}
                value={endDateForInput}
                onChange={handleEndDateChange}
              />
            </label>
          </div>

          <div className="emw-field-inline">
            <label className="emw-field">
              <span className="emw-label">City</span>
              <input
                type="text"
                className="emw-input"
                placeholder="City"
                value={basics.city}
                onChange={onChange("city")}
              />
            </label>
            <label className="emw-field">
              <span className="emw-label">Country</span>
              <input
                type="text"
                className="emw-input"
                placeholder="Country"
                value={basics.country}
                onChange={onChange("country")}
              />
            </label>
          </div>

          <label className="emw-field">
            <span className="emw-label">Venue name</span>
            <input
              type="text"
              className="emw-input"
              placeholder="Example: City Convention Center"
              value={basics.venueName}
              onChange={onChange("venueName")}
            />
          </label>

          <div className="emw-field-inline">
            <label className="emw-field">
              <span className="emw-label">Maximum attendees</span>
              <input
                type="number"
                min={1}
                className="emw-input"
                placeholder="Optional"
                value={basics.capacity}
                onChange={onChange("capacity")}
              />
            </label>

            <label className="emw-field">
              <span className="emw-label">Cover image URL</span>
              <input
                type="url"
                className="emw-input"
                placeholder="https://..."
                value={basics.cover}
                onChange={onChange("cover")}
              />
            </label>
          </div>

          <div className="emw-preview-card">
            <div className="emw-preview-media">
              {basics.cover ? (
                <img src={basics.cover} alt="" />
              ) : (
                <div className="emw-preview-placeholder">
                  <FiImage />
                </div>
              )}
            </div>
            <div className="emw-preview-body">
              <p className="emw-preview-title">
                {basics.title || "Your event name"}
              </p>
              <p className="emw-preview-meta">
                <FiCalendar />
                {startLabel} – {endLabel}
              </p>
              <p className="emw-preview-meta">
                <FiMapPin />
                {basics.city || "City"},{" "}
                {basics.country || "Country"}
              </p>
              <p className="emw-preview-desc">
                {basics.description ||
                  "Short description preview of your event page."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const WizardStepSchedule = ({ schedule, setSchedule }) => {
  const [draft, setDraft] = useState({
    sessionTitle: "",
    startTime: "",
    endTime: "",
    room: "",
    track: "",
  });

  const onChangeDraft = (field) => (e) => {
    setDraft((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const addSession = () => {
    if (!draft.sessionTitle || !draft.startTime || !draft.endTime) return;
    setSchedule((prev) => [...prev, { id: `s-${Date.now()}`, ...draft }]);
    setDraft({
      sessionTitle: "",
      startTime: "",
      endTime: "",
      room: "",
      track: "",
    });
  };

  const removeSession = (id) => {
    setSchedule((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <div className="emw-grid">
      <div className="emw-column">
        <div className="emw-group">
          <p className="emw-group-title">Build a simple day schedule</p>
          <p className="emw-group-caption">
            You can refine rooms, speakers and advanced controls later. For now
            we just need a first structure.
          </p>

          <label className="emw-field">
            <span className="emw-label">
              Session title <span>*</span>
            </span>
            <input
              type="text"
              className="emw-input"
              placeholder="Example: Opening keynote"
              value={draft.sessionTitle}
              onChange={onChangeDraft("sessionTitle")}
            />
          </label>

          <div className="emw-field-inline">
            <label className="emw-field">
              <span className="emw-label">
                Start time <span>*</span>
              </span>
              <input
                type="time"
                className="emw-input"
                value={draft.startTime}
                onChange={onChangeDraft("startTime")}
              />
            </label>
            <label className="emw-field">
              <span className="emw-label">
                End time <span>*</span>
              </span>
              <input
                type="time"
                className="emw-input"
                value={draft.endTime}
                onChange={onChangeDraft("endTime")}
              />
            </label>
          </div>

          <div className="emw-field-inline">
            <label className="emw-field">
              <span className="emw-label">Room</span>
              <input
                type="text"
                className="emw-input"
                placeholder="Main hall, Room A..."
                value={draft.room}
                onChange={onChangeDraft("room")}
              />
            </label>
            <label className="emw-field">
              <span className="emw-label">Track</span>
              <input
                type="text"
                className="emw-input"
                placeholder="General, B2B, Workshops..."
                value={draft.track}
                onChange={onChangeDraft("track")}
              />
            </label>
          </div>

          <button
            type="button"
            className="emw-btn emw-btn-outline"
            onClick={addSession}
          >
            Add session
          </button>
        </div>
      </div>

      <div className="emw-column">
        <div className="emw-group">
          <p className="emw-group-title">Schedule preview</p>
          <p className="emw-group-caption">
            This is how your attendees will see the basic agenda.
          </p>

          <div className="emw-timeline">
            {schedule.length === 0 && (
              <div className="emw-empty">
                No sessions yet. Add your first session on the left.
              </div>
            )}
            {schedule.map((s) => (
              <div key={s.id} className="emw-timeline-item">
                <div className="emw-timeline-bullet" />
                <div className="emw-timeline-content">
                  <div className="emw-timeline-time">
                    <FiClock />
                    {s.startTime} – {s.endTime}
                  </div>
                  <div className="emw-timeline-main">
                    <p className="emw-timeline-title">{s.sessionTitle}</p>
                    <p className="emw-timeline-meta">
                      {s.room && (
                        <>
                          <FiMapPin />
                          {s.room}
                        </>
                      )}
                      {s.track && (
                        <>
                          <FiTag />
                          {s.track}
                        </>
                      )}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="emw-timeline-remove"
                    onClick={() => removeSession(s.id)}
                  >
                    <FiMoreHorizontal />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const WizardStepTickets = ({ tickets, setTickets }) => {
  const [draft, setDraft] = useState({
    name: "Standard",
    price: "",
    currency: "EUR",
    capacity: "",
  });

  const onChangeDraft = (field) => (e) => {
    setDraft((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const addTicket = () => {
    if (!draft.name) return;
    setTickets((prev) => [...prev, { id: `t-${Date.now()}`, ...draft }]);
    setDraft({ name: "", price: "", currency: "EUR", capacity: "" });
  };

  const removeTicket = (id) => {
    setTickets((prev) => prev.filter((t) => t.id !== id));
  };

  const totalCapacity = useMemo(() => {
    return tickets.reduce((sum, t) => {
      const n = Number(t.capacity || 0);
      return sum + (Number.isNaN(n) ? 0 : n);
    }, 0);
  }, [tickets]);

  return (
    <div className="emw-grid">
      <div className="emw-column">
        <div className="emw-group">
          <p className="emw-group-title">Define tickets</p>
          <p className="emw-group-caption">
            Keep it simple for now: a few ticket types with price and capacity.
          </p>

          <label className="emw-field">
            <span className="emw-label">
              Ticket name <span>*</span>
            </span>
            <input
              type="text"
              className="emw-input"
              placeholder="Standard, VIP, Student..."
              value={draft.name}
              onChange={onChangeDraft("name")}
            />
          </label>

          <div className="emw-field-inline">
            <label className="emw-field">
              <span className="emw-label">Price</span>
              <input
                type="number"
                min={0}
                className="emw-input"
                placeholder="0"
                value={draft.price}
                onChange={onChangeDraft("price")}
              />
            </label>
            <label className="emw-field">
              <span className="emw-label">Currency</span>
              <input
                type="text"
                className="emw-input"
                placeholder="EUR, USD..."
                value={draft.currency}
                onChange={onChangeDraft("currency")}
              />
            </label>
            <label className="emw-field">
              <span className="emw-label">Capacity</span>
              <input
                type="number"
                min={0}
                className="emw-input"
                placeholder="Optional"
                value={draft.capacity}
                onChange={onChangeDraft("capacity")}
              />
            </label>
          </div>

          <button
            type="button"
            className="emw-btn emw-btn-outline"
            onClick={addTicket}
          >
            Add ticket type
          </button>
        </div>
      </div>

      <div className="emw-column">
        <div className="emw-group">
          <p className="emw-group-title">Ticket overview</p>
          <p className="emw-group-caption">
            This is a simplified view of how checkout options can look.
          </p>

          <div className="emw-ticket-grid">
            {tickets.length === 0 && (
              <div className="emw-empty">
                No ticket types yet. Add one on the left.
              </div>
            )}
            {tickets.map((t) => (
              <div key={t.id} className="emw-ticket-card">
                <div className="emw-ticket-head">
                  <span className="emw-ticket-name">{t.name}</span>
                  <button
                    type="button"
                    className="emw-ticket-remove"
                    onClick={() => removeTicket(t.id)}
                  >
                    <FiMoreHorizontal />
                  </button>
                </div>
                <p className="emw-ticket-price">
                  {t.price ? `${t.price} ${t.currency || ""}` : "Free"}
                </p>
                <p className="emw-ticket-meta">
                  {t.capacity
                    ? `${t.capacity} seats available`
                    : "No explicit capacity"}
                </p>
              </div>
            ))}
          </div>

          <div className="emw-ticket-summary">
            <span>Total capacity from tickets</span>
            <span>{totalCapacity || "—"}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const WizardStepOrganizersGallery = ({
  organizers,
  setOrganizers,
  gallery,
  setGallery,
}) => {
  const [orgDraft, setOrgDraft] = useState({
    name: "",
    type: "Organizer",
    link: "",
  });
  const [galleryDraft, setGalleryDraft] = useState({
    title: "",
    type: "image",
    file: "",
  });

  const onChangeOrgDraft = (field) => (e) => {
    setOrgDraft((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const onChangeGalleryDraft = (field) => (e) => {
    setGalleryDraft((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const addOrganizer = () => {
    if (!orgDraft.name) return;
    setOrganizers((prev) => [...prev, { id: `o-${Date.now()}`, ...orgDraft }]);
    setOrgDraft({ name: "", type: "Organizer", link: "" });
  };

  const removeOrganizer = (id) => {
    setOrganizers((prev) => prev.filter((o) => o.id !== id));
  };

  const addMedia = () => {
    if (!galleryDraft.file) return;
    setGallery((prev) => [...prev, { id: `g-${Date.now()}`, ...galleryDraft }]);
    setGalleryDraft({ title: "", type: "image", file: "" });
  };

  const removeMedia = (id) => {
    setGallery((prev) => prev.filter((g) => g.id !== id));
  };

  return (
    <div className="emw-grid">
      <div className="emw-column">
        <div className="emw-group">
          <p className="emw-group-title">Organizers & partners</p>
          <p className="emw-group-caption">
            Who is behind this event? Main organizer, co-organizers, sponsors…
          </p>

          <label className="emw-field">
            <span className="emw-label">Name</span>
            <input
              type="text"
              className="emw-input"
              placeholder="Organization or partner name"
              value={orgDraft.name}
              onChange={onChangeOrgDraft("name")}
            />
          </label>

          <div className="emw-field-inline">
            <label className="emw-field">
              <span className="emw-label">Role</span>
              <input
                type="text"
                className="emw-input"
                placeholder="Organizer, Sponsor, Partner..."
                value={orgDraft.type}
                onChange={onChangeOrgDraft("type")}
              />
            </label>
            <label className="emw-field">
              <span className="emw-label">Website / link</span>
              <input
                type="url"
                className="emw-input"
                placeholder="https://..."
                value={orgDraft.link}
                onChange={onChangeOrgDraft("link")}
              />
            </label>
          </div>

          <button
            type="button"
            className="emw-btn emw-btn-outline"
            onClick={addOrganizer}
          >
            Add organizer
          </button>

          <div className="emw-org-list">
            {organizers.length === 0 && (
              <div className="emw-empty">
                No organizers yet. Add at least one main organizer.
              </div>
            )}
            {organizers.map((o) => (
              <div key={o.id} className="emw-org-item">
                <div className="emw-org-avatar">
                  {o.name ? o.name.slice(0, 2).toUpperCase() : "OG"}
                </div>
                <div className="emw-org-body">
                  <p className="emw-org-name">{o.name}</p>
                  <p className="emw-org-meta">
                    {o.type}
                    {o.link && <span> · {o.link}</span>}
                  </p>
                </div>
                <button
                  type="button"
                  className="emw-org-remove"
                  onClick={() => removeOrganizer(o.id)}
                >
                  <FiMoreHorizontal />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="emw-column">
        <div className="emw-group">
          <p className="emw-group-title">Gallery & media</p>
          <p className="emw-group-caption">
            Visual assets you plan to use: hero images, teaser video, brochure…
          </p>

          <label className="emw-field">
            <span className="emw-label">Media URL</span>
            <input
              type="url"
              className="emw-input"
              placeholder="https://..."
              value={galleryDraft.file}
              onChange={onChangeGalleryDraft("file")}
            />
          </label>

          <div className="emw-field-inline">
            <label className="emw-field">
              <span className="emw-label">Title</span>
              <input
                type="text"
                className="emw-input"
                placeholder="Cover, teaser, brochure..."
                value={galleryDraft.title}
                onChange={onChangeGalleryDraft("title")}
              />
            </label>
            <label className="emw-field">
              <span className="emw-label">Type</span>
              <select
                className="emw-input"
                value={galleryDraft.type}
                onChange={onChangeGalleryDraft("type")}
              >
                <option value="image">Image</option>
                <option value="video">Video</option>
                <option value="pdf">PDF</option>
              </select>
            </label>
          </div>

          <button
            type="button"
            className="emw-btn emw-btn-outline"
            onClick={addMedia}
          >
            <FiUploadCloud />
            Add media
          </button>

          <div className="emw-gallery-grid">
            {gallery.length === 0 && (
              <div className="emw-empty">
                No media yet. Add at least a main visual for your event.
              </div>
            )}
            {gallery.map((g) => (
              <div key={g.id} className="emw-gallery-item">
                <div className="emw-gallery-media">
                  {g.type === "image" && g.file ? (
                    <img src={g.file} alt={g.title || ""} />
                  ) : g.type === "video" ? (
                    <div className="emw-gallery-placeholder">
                      <FiPlayCircle />
                    </div>
                  ) : (
                    <div className="emw-gallery-placeholder">
                      <FiImage />
                    </div>
                  )}
                </div>
                <div className="emw-gallery-body">
                  <p className="emw-gallery-title">
                    {g.title || "Untitled"}
                  </p>
                  <p className="emw-gallery-meta">
                    {g.type.toUpperCase()}
                  </p>
                </div>
                <button
                  type="button"
                  className="emw-gallery-remove"
                  onClick={() => removeMedia(g.id)}
                >
                  <FiMoreHorizontal />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventManagerDashboardPage;
