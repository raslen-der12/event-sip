// src/pages/eventManager/EventManagerDashboardPage.jsx
import React, { useMemo, useState } from "react";
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
  FiTag,
  FiUploadCloud,
  FiCheckCircle,
  FiMoreHorizontal,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import "./event-manager-dashboard.css";
import {
  useCreateEventFromWizardMutation,
  useApplyEventManagerMutation,
  useGetMyEventManagerApplicationQuery,
} from "../../features/eventManager/eventManagerApiSlice";

/* ────────────────────────── Step config ─────────────────────────── */

const WIZARD_STEPS = [
  {
    id: "basics",
    label: "Event basics",
    caption: "Type, dates, location, sector & contact",
  },
  {
    id: "schedule",
    label: "Sessions",
    caption: "Agenda, descriptions & learning outcomes",
  },
  {
    id: "tickets",
    label: "Tickets & services",
    caption: "Ticket types and included tools",
  },
  {
    id: "organizers",
    label: "Organizers & media",
    caption: "Partners and event visuals",
  },
  {
    id: "manager",
    label: "Application",
    caption: "Free trial & Event Manager request",
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

const normalizeEventFormat = (eventType) => {
  const t = String(eventType || "").toLowerCase();
  if (!t) return "";
  if (t === "conference") return "Hybrid";
  if (t === "webinar") return "Virtual";
  if (t === "training" || t === "workshop") return "Physical";
  if (t === "gathering") return "Physical";
  return "";
};

const FREE_PLAN_ID = "free-trial";
const FREE_PLAN_LABEL = "Free trial";

/* Services config: free-trial vs paid (Pro) */
const SERVICE_CONFIG = [
  { id: "ticketing", label: "Ticketing", tier: "free" },
  { id: "hybrid", label: "Hybrid", tier: "free" },
  { id: "scanQr", label: "Scan QR Code (attendees)", tier: "free" },
  {
    id: "scanQrSession",
    label: "Dedicated Scan QR per session",
    tier: "pro",
  },
  { id: "aiMatchmaking", label: "AI B2B Matchmaking", tier: "pro" },
  { id: "addSpeakers", label: "Add Speakers", tier: "free" },
  { id: "addExhibitors", label: "Add Exhibitors", tier: "free" },
  { id: "customDomain", label: "Custom domain name", tier: "pro" },
  { id: "supportTeam", label: "Support team", tier: "pro" },
  { id: "pollsQuizzes", label: "Poll & quizzes tools", tier: "pro" },
  { id: "promotion", label: "Event promotion tools", tier: "pro" },
  { id: "advancedReporting", label: "Advanced reporting", tier: "pro" },
];

/* ────────────────────────── Defaults ────────────────────────────── */

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
  coverFile: null,
  eventType: "Conference",
  theme: "",
  format: "Hybrid",
  sector: "",
  contactName: "",
  contactEmail: "",
  contactPhone: "",
};

const defaultSchedule = [
  {
    id: "s1",
    sessionTitle: "Opening & registration",
    startTime: "09:00",
    endTime: "09:45",
    room: "Main Hall",
    track: "General",
    description: "",
    targetAudience: "",
    topics: "",
    learningObjectives: "",
    expectedOutcomes: "",
  },
];

const defaultTickets = [
  {
    id: "t1",
    name: "Standard",
    price: "0",
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

const defaultGallery = [];

/* Manager / application local state (front only) */
const defaultManager = {
  organizerType: "",
  companyName: "",
  website: "",
  country: "",
  city: "",
  workEmail: "",
  phone: "",
  notes: "",
};

/* ────────────────────────── Manager tab ────────────────────────── */

function ManagerAccountStep({
  manager,
  setManager,
  isFirstTime,
  applicationStatus,
}) {
  const onChange = (field) => (e) => {
    const value = e.target.value;
    setManager((prev) => ({ ...prev, [field]: value }));
  };

  const statusLabel =
    applicationStatus === "Pending"
      ? "Your Event Manager request is pending. You can still edit this event while we review it."
      : applicationStatus === "Approved"
      ? "You are already approved as Event Manager. This event will follow your existing plan."
      : applicationStatus === "Rejected"
      ? "Your previous Event Manager request was rejected. You can still send a new one with updated information."
      : "Your first event will use a free trial plan and stay unpublished. Creating it will make your account act as Event Manager. If we reject the request later, we will revert it back to a normal user.";


  return (
    <div className="emw-step emw-step-manager">
      <div className="emw-manager-layout">
        <div className="emw-manager-main">
          <h2 className="emw-step-title">
            {isFirstTime
              ? "Apply as Event Manager (free trial)"
              : "Event Manager application"}
          </h2>
          <p className="emw-step-desc">{statusLabel}</p>

          <div className="emw-manager-banner">
            <div className="emw-manager-banner-main">
              <span className="emw-chip emw-chip-free">Free trial</span>
              <p className="emw-manager-banner-title">
                Create your first event with core tools unlocked.
              </p>
              <p className="emw-manager-banner-text">
                Ticketing, hybrid mode, attendees QR and basic speakers /
                exhibitors are included. Advanced automation is kept for paid
                plans.
              </p>
            </div>
            <div className="emw-manager-banner-meta">
              <p className="emw-manager-banner-line">
                <span>Event status</span>
                <strong>Draft · Unpublished</strong>
              </p>
              <p className="emw-manager-banner-line">
                <span>Account impact</span>
                <strong>
                  Your account will act as Event Manager for this event.
                </strong>
              </p>
            </div>
          </div>

          <div className="emw-grid-2">
            <label className="emw-field">
              <span className="emw-label">
                Organizer / company name <span>*</span>
              </span>
              <input
                type="text"
                className="emw-input"
                placeholder="Organization behind this event"
                value={manager.companyName}
                onChange={onChange("companyName")}
              />
            </label>

            <label className="emw-field">
              <span className="emw-label">Partnership type</span>
              <select
                className="emw-input"
                value={manager.organizerType}
                onChange={onChange("organizerType")}
              >
                <option value="">Select…</option>
                <option value="association">Association / NGO</option>
                <option value="company">Private company</option>
                <option value="public">Public institution</option>
                <option value="agency">Event / communication agency</option>
                <option value="other">Other</option>
              </select>
            </label>
          </div>

          <div className="emw-grid-2">
            <label className="emw-field">
              <span className="emw-label">Website</span>
              <input
                type="url"
                className="emw-input"
                placeholder="https://..."
                value={manager.website}
                onChange={onChange("website")}
              />
            </label>

            <label className="emw-field">
              <span className="emw-label">Work email <span>*</span></span>
              <input
                type="email"
                className="emw-input"
                placeholder="name@organization.com"
                value={manager.workEmail}
                onChange={onChange("workEmail")}
              />
            </label>
          </div>

          <div className="emw-grid-2">
            <label className="emw-field">
              <span className="emw-label">Country</span>
              <input
                type="text"
                className="emw-input"
                placeholder="Country"
                value={manager.country}
                onChange={onChange("country")}
              />
            </label>
            <label className="emw-field">
              <span className="emw-label">City</span>
              <input
                type="text"
                className="emw-input"
                placeholder="City"
                value={manager.city}
                onChange={onChange("city")}
              />
            </label>
          </div>

          <div className="emw-grid-2">
            <label className="emw-field">
              <span className="emw-label">Contact person full name</span>
              <input
                type="text"
                className="emw-input"
                placeholder="Person in charge of this event"
                value={manager.contactName}
                onChange={onChange("contactName")}
              />
            </label>
            <label className="emw-field">
              <span className="emw-label">Contact phone</span>
              <input
                type="tel"
                className="emw-input"
                placeholder="+216..."
                value={manager.phone}
                onChange={onChange("phone")}
              />
            </label>
          </div>

          <label className="emw-field">
            <span className="emw-label">Notes to the Eventra team</span>
            <textarea
              rows={3}
              className="emw-input emw-textarea"
              placeholder="Share context about your event, goals, and what you expect from the platform."
              value={manager.notes}
              onChange={onChange("notes")}
            />
          </label>
        </div>

        <div className="emw-manager-side">
          <p className="emw-group-title">Services for this event</p>
          <p className="emw-group-caption">
            Free trial options are auto-enabled. Pro services are visible but
            locked. Upgrading your plan will unlock them.
          </p>

          <div className="emw-services-list">
            {SERVICE_CONFIG.map((s) => {
              const isFree = s.tier === "free";
              const isChecked = isFree;
              const isDisabled = true; // all switches read-only (plan driven)
              return (
                <div
                  key={s.id}
                  className={`emw-service-item emw-service-item--${s.tier}`}
                >
                  <label className="emw-service-main">
                    <span className={`emw-check ${isChecked ? "emw-check--on" : "emw-check--off"} ${s.tier === "pro" ? "emw-check--pro" : ""}`}></span>
                    <span className="emw-service-label">{s.label}</span>
                  </label>
                  <span
                    className={`emw-badge ${
                      isFree ? "emw-badge-free" : "emw-badge-pro"
                    }`}
                  >
                    {isFree ? "Included" : "Pro"}
                  </span>
                </div>
              );
            })}
          </div>

          <p className="emw-manager-side-note">
            Trying to use a Pro feature in the dashboard (AI matchmaking, per
            session QR, custom domain, advanced reporting…) will redirect to the
            plans page so you can upgrade later.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────── Main Page ──────────────────────────── */

const EventManagerDashboardPage = () => {
  const navigate = useNavigate();

  const [createEventFromWizard, { isLoading: isCreating }] =
    useCreateEventFromWizardMutation();
  const [applyEventManager, { isLoading: isApplying }] =
    useApplyEventManagerMutation();

  const { data: appData } = useGetMyEventManagerApplicationQuery();
  const application = appData?.application || null;
  const applicationStatus = application?.status || null;
  const isFirstTimeManager = !application;

  const [activeWizardStepIndex, setActiveWizardStepIndex] = useState(0);

  const [basics, setBasics] = useState(() => {
    const format = normalizeEventFormat("Conference");
    return { ...defaultBasics, eventType: "Conference", format };
  });
  const [schedule, setSchedule] = useState(defaultSchedule);
  const [tickets, setTickets] = useState(defaultTickets);
  const [organizers, setOrganizers] = useState(defaultOrganizers);
  const [gallery, setGallery] = useState(defaultGallery);
  const [manager, setManager] = useState(defaultManager);

  const stepsCount = WIZARD_STEPS.length;
  const canGoBack = activeWizardStepIndex > 0;
  const isLastStep = activeWizardStepIndex === stepsCount - 1;
  const isSaving = isCreating || isApplying;

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
      let finalBasics = { ...basics };

      // Derive final format based on type if missing
      if (!finalBasics.format) {
        finalBasics.format = normalizeEventFormat(finalBasics.eventType);
      }

      // Require minimal fields
      if (
        !finalBasics.title ||
        !finalBasics.startDate ||
        !finalBasics.endDate ||
        !finalBasics.eventType
      ) {
        alert(
          "Please complete the event basics: name, type, dates and main info."
        );
        setActiveWizardStepIndex(0);
        scrollWizardTop();
        return;
      }

      // Ensure we have a cover: for now we just require basics.cover (URLs will be replaced later by uploads)
      const hasCoverFile = !!basics.coverFile;
      if (!hasCoverFile) {
        alert("Please add a cover image for your event.");
        setActiveWizardStepIndex(0);
        scrollWizardTop();
        return;
      }

      // we don't need to send a URL cover anymore; backend will use the uploaded file
      finalBasics.cover = "";

      // Minimal manager fields if it's the first application
      if (isFirstTimeManager) {
        if (!manager.companyName || !manager.workEmail) {
          alert(
            "Please fill at least the organizer/company name and work email before sending your Event Manager request."
          );
          setActiveWizardStepIndex(WIZARD_STEPS.length - 1);
          scrollWizardTop();
          return;
        }
      }

      // Strip local-only fields
      const basicsForServer = { ...finalBasics };
      delete basicsForServer.coverFile;

      // remove fileFile from gallery meta
      const galleryMeta = (gallery || []).map((g) => {
        // keep only serializable fields
        const { fileFile, ...rest } = g;
        return rest;
      });

      const formData = new FormData();
      formData.append("basics", JSON.stringify(basicsForServer));
      formData.append("schedule", JSON.stringify(schedule || []));
      formData.append("tickets", JSON.stringify(tickets || []));
      formData.append("organizers", JSON.stringify(organizers || []));
      formData.append("gallery", JSON.stringify(galleryMeta));

      // real cover file
      if (basics.coverFile) {
        formData.append("cover", basics.coverFile);
      }

      // gallery files (same field name, multiple files)
      (gallery || []).forEach((g) => {
        if (g.fileFile) {
          formData.append("gallery", g.fileFile);
        }
      });

      const res = await createEventFromWizard(formData).unwrap();

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

      // Optional: derive eventMonth from startDate for application
      let eventMonth = null;
      if (finalBasics.startDate) {
        const d = new Date(finalBasics.startDate);
        if (!Number.isNaN(d.getTime())) {
          const y = d.getUTCFullYear();
          const m = String(d.getUTCMonth() + 1).padStart(2, "0");
          eventMonth = `${y}-${m}`;
        }
      }

      // First-time: send Event Manager application with free trial
      if (isFirstTimeManager) {
        try {
          await applyEventManager({
            planId: FREE_PLAN_ID,
            planLabel: FREE_PLAN_LABEL,
            organizerType: manager.organizerType || "company",
            orgName: manager.companyName,
            website: manager.website || "",
            country: manager.country || finalBasics.country || "",
            city: manager.city || finalBasics.city || "",
            workEmail: manager.workEmail,
            phone: manager.phone || finalBasics.contactPhone || "",
            eventName: finalBasics.title,
            eventMonth,
            eventMode: finalBasics.format || "",
            expectedSize: finalBasics.capacity || "",
            sectors: finalBasics.sector ? [finalBasics.sector] : [],
            needsTicketing: true,
            needsB2B: false,
            needsMarketplace: false,
            notes: manager.notes || "",
          }).unwrap();
        } catch (err) {
          console.error(
            "[EventManagerDashboard] applyEventManager failed",
            err
          );
          // Not blocking the event creation – just notify.
          alert(
            "Your event was created, but we could not submit the Event Manager application. You can retry later from the dashboard."
          );
        }
      }

      navigate(`/event-manager/dashboard/event/${eventId}`, { replace: true });
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
      manager={manager}
      setManager={setManager}
      isLastStep={isLastStep}
      canGoBack={canGoBack}
      isSaving={isSaving}
      isFirstTimeManager={isFirstTimeManager}
      applicationStatus={applicationStatus}
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
  manager,
  setManager,
  isLastStep,
  canGoBack,
  isSaving,
  isFirstTimeManager,
  applicationStatus,
}) => {
  const activeStep = WIZARD_STEPS[activeIndex];

  return (
    <div className="emw-root">
      <div className="emw-inner container">
        <header className="emw-header">
          <div className="emw-header-main">
            <div className="emw-chip">New · Event Manager space</div>
            <h1 className="emw-title">Create your event & free trial.</h1>
            <p className="emw-sub">
              Start directly with event creation. Your first event uses a free
              trial plan, stays unpublished, and will turn your account into an
              Event Manager. If we later reject the request, your account will
              go back to a normal user.
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
              You can still cancel the request later if the event is not
              published.
            </p>
          </div>
        </header>

        <nav className="emw-stepper" aria-label="Create event steps">
          {WIZARD_STEPS.map((step, idx) => {
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
                <span className="emw-stepper-index">{idx + 1}</span>
                <span className="emw-stepper-text">
                  <span className="emw-stepper-label">{step.label}</span>
                  <span className="emw-stepper-caption">{step.caption}</span>
                </span>
              </button>
            );
          })}
        </nav>

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
              <WizardStepTickets
                tickets={tickets}
                setTickets={setTickets}
              />
            )}
            {activeStep.id === "organizers" && (
              <WizardStepOrganizersGallery
                organizers={organizers}
                setOrganizers={setOrganizers}
                gallery={gallery}
                setGallery={setGallery}
              />
            )}
            {activeStep.id === "manager" && (
              <ManagerAccountStep
                manager={manager}
                setManager={setManager}
                isFirstTime={isFirstTimeManager}
                applicationStatus={applicationStatus}
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
                  disabled={isSaving}
                >
                  <FiChevronLeft />
                  Back
                </button>
              ) : (
                <span className="emw-footer-hint">
                  Draft is local only until you finish. No emails or public
                  listing yet.
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
                      : "Finish & open dashboard"}
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
    setBasics((prev) => {
      if (field === "eventType") {
        const format = normalizeEventFormat(value);
        return { ...prev, eventType: value, format };
      }
      return { ...prev, [field]: value };
    });
  };

  const todayStr = useMemo(
    () => new Date().toISOString().slice(0, 10),
    []
  );
  const handleCoverFileChange = (e) => {
  const file = e.target.files && e.target.files[0];
  if (!file) return;

  const previewUrl = URL.createObjectURL(file);
  setBasics((prev) => ({
    ...prev,
    cover: previewUrl,  // used for preview
    coverFile: file,    // real file sent to backend
  }));
};
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

  const onContactChange = (field) => (e) => {
    const value = e.target.value;
    setBasics((prev) => ({ ...prev, [field]: value }));
  };

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

          <div className="emw-field-inline">
            <label className="emw-field">
              <span className="emw-label">
                Event type <span>*</span>
              </span>
              <select
                className="emw-input"
                value={basics.eventType}
                onChange={onChange("eventType")}
              >
                <option value="Conference">Conference</option>
                <option value="Webinar">Webinar</option>
                <option value="Training">Training</option>
                <option value="Workshop">Workshop</option>
                <option value="Gathering">Gathering</option>
              </select>
            </label>

            <label className="emw-field">
              <span className="emw-label">Theme</span>
              <input
                type="text"
                className="emw-input"
                placeholder="Example: Innovation, Sustainability, Fintech..."
                value={basics.theme}
                onChange={onChange("theme")}
              />
            </label>
          </div>

          <label className="emw-field">
            <span className="emw-label">Event format (auto)</span>
            <input
              type="text"
              className="emw-input emw-input-readonly"
              value={normalizeEventFormat(basics.eventType) || basics.format}
              readOnly
            />
          </label>

          <label className="emw-field">
            <span className="emw-label">Main sector</span>
            <input
              type="text"
              className="emw-input"
              placeholder="Choose a sector aligned with your business profile"
              value={basics.sector}
              onChange={onChange("sector")}
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

            <div className="emw-field">
                      <label className="emw-label">
                        Cover image file (temporary)
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        className="emw-input"
                        onChange={handleCoverFileChange}
                      />
                      {basics.cover && (
                        <p className="emw-help">
                          Preview generated from selected file (not uploaded yet).
                        </p>
                      )}
                    </div>
          </div>
        </div>

        <div className="emw-group">
          <p className="emw-group-title">Contact person</p>
          <p className="emw-group-caption">
            These details are used by the Eventra team and optionally on the
            event page.
          </p>

          <label className="emw-field">
            <span className="emw-label">Name</span>
            <input
              type="text"
              className="emw-input"
              placeholder="Contact person for the event"
              value={basics.contactName}
              onChange={onContactChange("contactName")}
            />
          </label>

          <div className="emw-field-inline">
            <label className="emw-field">
              <span className="emw-label">Email</span>
              <input
                type="email"
                className="emw-input"
                placeholder="contact@event.com"
                value={basics.contactEmail}
                onChange={onContactChange("contactEmail")}
              />
            </label>
            <label className="emw-field">
              <span className="emw-label">Phone</span>
              <input
                type="tel"
                className="emw-input"
                placeholder="+216..."
                value={basics.contactPhone}
                onChange={onContactChange("contactPhone")}
              />
            </label>
          </div>
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
  );
};

const WizardStepSchedule = ({ schedule, setSchedule }) => {
  const [draft, setDraft] = useState({
    sessionTitle: "",
    startTime: "",
    endTime: "",
    room: "",
    track: "",
    description: "",
    targetAudience: "",
    topics: "",
    learningObjectives: "",
    expectedOutcomes: "",
  });

  const onChangeDraft = (field) => (e) => {
    setDraft((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const addSession = () => {
    if (!draft.sessionTitle || !draft.startTime || !draft.endTime) return;
    setSchedule((prev) => [
      ...prev,
      { id: `s-${Date.now()}`, ...draft },
    ]);
    setDraft({
      sessionTitle: "",
      startTime: "",
      endTime: "",
      room: "",
      track: "",
      description: "",
      targetAudience: "",
      topics: "",
      learningObjectives: "",
      expectedOutcomes: "",
    });
  };

  const removeSession = (id) => {
    setSchedule((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <div className="emw-grid">
      <div className="emw-column">
        <div className="emw-group">
          <p className="emw-group-title">Build the sessions</p>
          <p className="emw-group-caption">
            Add sessions with descriptions, target audience and learning
            outcomes. You can refine speakers later.
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

          <label className="emw-field">
            <span className="emw-label">Session description</span>
            <textarea
              rows={2}
              className="emw-input emw-textarea"
              placeholder="Short description of what happens in this session."
              value={draft.description}
              onChange={onChangeDraft("description")}
            />
          </label>

          <label className="emw-field">
            <span className="emw-label">Target audience</span>
            <input
              type="text"
              className="emw-input"
              placeholder="Startups, SMEs, students, investors..."
              value={draft.targetAudience}
              onChange={onChangeDraft("targetAudience")}
            />
          </label>

          <label className="emw-field">
            <span className="emw-label">Topics</span>
            <input
              type="text"
              className="emw-input"
              placeholder="Comma-separated: innovation, logistics, AI..."
              value={draft.topics}
              onChange={onChangeDraft("topics")}
            />
          </label>

          <label className="emw-field">
            <span className="emw-label">Learning objectives</span>
            <textarea
              rows={2}
              className="emw-input emw-textarea"
              placeholder="What should attendees learn or understand?"
              value={draft.learningObjectives}
              onChange={onChangeDraft("learningObjectives")}
            />
          </label>

          <label className="emw-field">
            <span className="emw-label">Expected outcomes</span>
            <textarea
              rows={2}
              className="emw-input emw-textarea"
              placeholder="What will attendees gain after this session?"
              value={draft.expectedOutcomes}
              onChange={onChangeDraft("expectedOutcomes")}
            />
          </label>

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
            This is how your attendees can see the basic agenda with extra
            context.
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
                    {s.description && (
                      <p className="emw-timeline-desc">{s.description}</p>
                    )}
                    <div className="emw-timeline-extra">
                      {s.targetAudience && (
                        <p>
                          <strong>Audience:</strong> {s.targetAudience}
                        </p>
                      )}
                      {s.topics && (
                        <p>
                          <strong>Topics:</strong> {s.topics}
                        </p>
                      )}
                      {s.learningObjectives && (
                        <p>
                          <strong>Objectives:</strong> {s.learningObjectives}
                        </p>
                      )}
                      {s.expectedOutcomes && (
                        <p>
                          <strong>Outcomes:</strong> {s.expectedOutcomes}
                        </p>
                      )}
                    </div>
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
    price: "0",
    currency: "EUR",
    capacity: "",
  });

  const onChangeDraft = (field) => (e) => {
    setDraft((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const addTicket = () => {
    if (!draft.name) return;
    setTickets((prev) => [...prev, { id: `t-${Date.now()}`, ...draft }]);
    setDraft({ name: "", price: "0", currency: "EUR", capacity: "" });
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
          <p className="emw-group-title">Tickets</p>
          <p className="emw-group-caption">
            Free trial lets you set basic tickets. Advanced payment flows are
            reserved for paid plans.
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
          <p className="emw-group-title">Tickets & services overview</p>
          <p className="emw-group-caption">
            Free trial services are auto-enabled. Pro ones will show as locked.
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
                  {t.price && t.price !== "0"
                    ? `${t.price} ${t.currency || ""}`
                    : "Free"}
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

          <div className="emw-services-inline">
            {SERVICE_CONFIG.map((s) => {
              const isFree = s.tier === "free";
              return (
                <span
                  key={s.id}
                  className={`emw-service-chip emw-service-chip--${s.tier}`}
                >
                  {s.label} · {isFree ? "Free trial" : "Pro"}
                </span>
              );
            })}
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
  fileFile: null, // real File
});

  const onChangeOrgDraft = (field) => (e) => {
    setOrgDraft((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const onChangeGalleryDraft = (field) => (e) => {
    setGalleryDraft((prev) => ({ ...prev, [field]: e.target.value }));
  };
const handleGalleryFileChange = (e) => {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  const previewUrl = URL.createObjectURL(file);
  setGalleryDraft((prev) => ({
    ...prev,
    file: previewUrl, // preview src
    fileFile: file,   // real file
  }));
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
  setGallery((prev) => [
    ...prev,
    {
      id: `g-${Date.now()}`,
      title: galleryDraft.title,
      type: galleryDraft.type,
      file: galleryDraft.file,       // preview
      fileFile: galleryDraft.fileFile, // real File
    },
  ]);
  setGalleryDraft({
    title: "",
    type: "image",
    file: "",
    fileFile: null,
  });
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
              <span className="emw-label">Partnership type</span>
              <input
                type="text"
                className="emw-input"
                placeholder="Organizer, Sponsor, Media partner..."
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
            For now we use temporary URLs. Later this will be replaced with
            uploads & cropping only (no URLs).
          </p>

          <label className="emw-field">
            <span className="emw-label">Media file (temporary)</span>
            <input
              type="file"
              accept="image/*,video/*,application/pdf"
              className="emw-input"
              onChange={handleGalleryFileChange}
            />
            {galleryDraft.file && (
              <p className="emw-help">
                Preview generated from selected file (not uploaded yet).
              </p>
            )}
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
