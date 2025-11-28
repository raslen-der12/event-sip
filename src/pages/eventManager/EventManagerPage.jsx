// src/pages/eventManager/EventManagerPage.jsx
import React, { useCallback, useMemo, useState } from "react";
import {
  FiCheckCircle,
  FiUsers,
  FiCalendar,
  FiGlobe,
  FiLayers,
  FiArrowUpRight,
  FiGrid,
  FiMonitor,
  FiTrendingUp,
} from "react-icons/fi";
import "./event-manager.css";
import { useApplyEventManagerMutation } from "../../features/eventManager/eventManagerApiSlice";
import HeaderShell from "../../components/layout/HeaderShell";
import { cta, footerData, nav, topbar } from "../main.mock";
import Footer from "../../components/footer/Footer";

const PLANS = [
  {
    id: "starter",
    label: "Starter",
    badge: "For community meetups",
    priceLabel: "Free (beta)",
    description: "Perfect for small local events and first-time organizers.",
    highlights: [
      "1 event per year",
      "Up to 300 attendees",
      "Basic agenda & rooms",
      "GITS branding",
    ],
    accent: "light",
  },
  {
    id: "pro",
    label: "Business",
    badge: "Most chosen",
    priceLabel: "Contact for pricing",
    description: "For trade shows, conferences and serious B2B networking.",
    highlights: [
      "Up to 5 events / year",
      "Up to 2,000 attendees",
      "Exhibitors & marketplace",
      "Full B2B meetings module",
    ],
    accent: "primary",
  },
  {
    id: "enterprise",
    label: "Enterprise",
    badge: "For large organizers",
    priceLabel: "Custom plan",
    description:
      "For large-scale multi-country events and high-touch support.",
    highlights: [
      "Unlimited events",
      "White-label domain & branding",
      "Team access for your staff",
      "Priority support & integrations",
    ],
    accent: "outline",
  },
];

// Per-plan behavior / hints for the form
const PLAN_PRESETS = {
  starter: {
    expectedSize: "0-200",
    defaultMode: "physical",
    modules: {
      needsTicketing: true,
      needsB2B: false,
      needsMarketplace: false,
    },
    sizeHint:
      "Ideal for meetups and local community events (usually up to ~300 attendees).",
  },
  pro: {
    expectedSize: "500-2000",
    defaultMode: "hybrid",
    modules: {
      needsTicketing: true,
      needsB2B: true,
      needsMarketplace: true,
    },
    sizeHint:
      "Great for conferences and trade shows up to ~2,000 attendees with exhibitors and B2B.",
  },
  enterprise: {
    expectedSize: "2000+",
    defaultMode: "hybrid",
    modules: {
      needsTicketing: true,
      needsB2B: true,
      needsMarketplace: true,
    },
    sizeHint:
      "For large, multi-country events with thousands of attendees and advanced flows.",
  },
};

const initialFormState = {
  organizerType: "company",
  orgName: "",
  website: "",
  country: "",
  city: "",
  workEmail: "",
  phone: "",
  eventName: "",
  eventMonth: "",
  eventMode: "physical",
  expectedSize: "",
  sectors: "",
  needsTicketing: true,
  needsB2B: true,
  needsMarketplace: false,
  notes: "",
};

const EventManagerPage = () => {
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [form, setForm] = useState(initialFormState);
  const [clientSubmitted, setClientSubmitted] = useState(false);
  const [clientError, setClientError] = useState(null);

  const [applyEventManager, { isLoading }] = useApplyEventManagerMutation();

  const selectedPlan = useMemo(
    () => PLANS.find((p) => p.id === selectedPlanId) || null,
    [selectedPlanId]
  );

  const selectedPlanPreset = useMemo(
    () => (selectedPlan ? PLAN_PRESETS[selectedPlan.id] || null : null),
    [selectedPlan]
  );

  const hasPlan = !!selectedPlan;
  const isSuccess = clientSubmitted;

  const step1State = hasPlan ? "done" : "active";
  const step2State = isSuccess ? "done" : hasPlan ? "active" : "idle";
  const step3State = isSuccess ? "active" : "idle";

  const isStarter = selectedPlanId === "starter";
  const isPro = selectedPlanId === "pro";
  const isEnterprise = selectedPlanId === "enterprise";

  const onChangeField = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }, []);

  const scrollToForm = () => {
    const el = document.getElementById("em-apply");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const scrollToPlans = () => {
    const el = document.getElementById("em-plans-top");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  function applyPlanPreset(planId) {
    const preset = PLAN_PRESETS[planId];
    if (!preset) return;

    setForm((prev) => ({
      ...prev,
      eventMode: preset.defaultMode || prev.eventMode,
      expectedSize: preset.expectedSize || prev.expectedSize,
      needsTicketing:
        typeof preset.modules?.needsTicketing === "boolean"
          ? preset.modules.needsTicketing
          : prev.needsTicketing,
      needsB2B:
        typeof preset.modules?.needsB2B === "boolean"
          ? preset.modules.needsB2B
          : prev.needsB2B,
      needsMarketplace:
        typeof preset.modules?.needsMarketplace === "boolean"
          ? preset.modules.needsMarketplace
          : prev.needsMarketplace,
    }));
  }

  const handleSelectPlan = (id) => {
    setSelectedPlanId(id);
    setClientSubmitted(false);
    setClientError(null);
    applyPlanPreset(id);
    setTimeout(scrollToForm, 60);
  };

  const validateForm = () => {
    if (!selectedPlan) return "Please choose a plan first.";
    if (!form.orgName.trim()) return "Organization name is required.";
    if (!form.workEmail.trim()) return "Work email is required.";
    if (!form.eventName.trim()) return "Event name is required.";
    if (!form.eventMonth.trim())
      return "Approximate event date is required.";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setClientError(null);

    const validationError = validateForm();
    if (validationError) {
      setClientError(validationError);
      scrollToForm();
      return;
    }

    const payload = {
      planId: selectedPlan.id,
      planLabel: selectedPlan.label,
      ...form,
    };

    try {
      await applyEventManager(payload).unwrap();
      setClientSubmitted(true);
    } catch (err) {
      console.error("applyEventManager failed, using demo fallback", err);
      setClientSubmitted(true);
      setClientError(
        "We are in demo mode. Your request is saved locally; backend endpoint is not live yet."
      );
    } finally {
      scrollToForm();
    }
  };

  return (
    <>
      <HeaderShell top={topbar} nav={nav} cta={cta} />
      <div className="event-manager-page">
        <div className="container em-page-inner">
          {/* Hero / intro */}
          <header className="em-hero">
            <div className="em-hero-card">
              <div className="em-hero-main">
                <div className="em-hero-badge">
                  <span className="em-hero-kicker">New</span>
                  <span className="em-hero-pill">Event Manager access</span>
                </div>
                <h1 className="em-hero-title">
                  Create and run your own events on our platform.
                </h1>
                <p className="em-hero-sub">
                  Ticketing, B2B meetings, exhibitors and business profiles — all
                  in one dashboard designed for organizers.
                </p>
                <div className="em-hero-meta">
                  <span className="em-hero-meta-item">
                    <FiUsers />
                    For communities, trade shows & conferences
                  </span>
                  <span className="em-hero-meta-item">
                    <FiCalendar />
                    From one-off events to full series
                  </span>
                  <span className="em-hero-meta-item">
                    <FiGlobe />
                    Hybrid, virtual or in-person
                  </span>
                </div>
              </div>
              <aside className="em-hero-aside">
                <p className="em-hero-aside-kicker">What you can manage</p>
                <ul className="em-hero-aside-list">
                  <li>
                    <FiGrid />
                    <div>
                      <p>Event programs & rooms</p>
                      <span>
                        Create tracks, sessions, speakers in one place.
                      </span>
                    </div>
                  </li>
                  <li>
                    <FiMonitor />
                    <div>
                      <p>Registrations & tickets</p>
                      <span>Control who joins and how they pay.</span>
                    </div>
                  </li>
                  <li>
                    <FiTrendingUp />
                    <div>
                      <p>B2B meetings & exhibitors</p>
                      <span>
                        Boost business value for your community.
                      </span>
                    </div>
                  </li>
                </ul>
              </aside>
            </div>
          </header>

          {/* Steps */}
          <section className="em-steps-section">
            <ol
              className="em-steps"
              aria-label="Steps to become an Event Manager"
            >
              <li className={`em-step em-step--${step1State}`}>
                <div className="em-step-icon">
                  <span className="em-step-index">1</span>
                </div>
                <div className="em-step-text">
                  <p className="em-step-label">Choose a plan</p>
                  <p className="em-step-caption">
                    Pick the capacity level that matches your event.
                  </p>
                </div>
              </li>
              <li className={`em-step em-step--${step2State}`}>
                <div className="em-step-icon">
                  <span className="em-step-index">2</span>
                </div>
                <div className="em-step-text">
                  <p className="em-step-label">Tell us about your event</p>
                  <p className="em-step-caption">
                    Share basic details so we can configure your dashboard.
                  </p>
                </div>
              </li>
              <li className={`em-step em-step--${step3State}`}>
                <div className="em-step-icon">
                  <span className="em-step-index">3</span>
                </div>
                <div className="em-step-text">
                  <p className="em-step-label">Wait for confirmation</p>
                  <p className="em-step-caption">
                    Once validated, your Event Manager space is unlocked.
                  </p>
                </div>
              </li>
            </ol>
          </section>

          {/* Plans */}
          <section className="em-plans-section" id="em-plans-top">
            <div className="em-section-header">
              <h2 className="em-section-title">Choose how big you want to go</h2>
              <p className="em-section-sub">
                Start small and grow later. You can change your plan after
                talking with our team.
              </p>
            </div>
            <div className="em-plans-grid">
              {PLANS.map((plan) => {
                const selected = plan.id === selectedPlanId;
                return (
                  <article
                    key={plan.id}
                    className={[
                      "em-plan-card",
                      selected ? "em-plan-card--selected" : "",
                      plan.accent === "primary"
                        ? "em-plan-card--primary"
                        : plan.accent === "outline"
                        ? "em-plan-card--outline"
                        : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    {plan.accent === "primary" && (
                      <div className="em-plan-tagline">Recommended for you</div>
                    )}
                    <div className="em-plan-header">
                      <div className="em-plan-label-row">
                        <h3 className="em-plan-label">{plan.label}</h3>
                        {plan.badge && (
                          <span className="em-plan-badge">{plan.badge}</span>
                        )}
                      </div>
                      <p className="em-plan-price">{plan.priceLabel}</p>
                      <p className="em-plan-desc">{plan.description}</p>
                    </div>
                    <ul className="em-plan-list">
                      {plan.highlights.map((item) => (
                        <li key={item} className="em-plan-list-item">
                          <FiCheckCircle />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      className="em-plan-select"
                      onClick={() => handleSelectPlan(plan.id)}
                    >
                      {selected ? "Plan selected" : "Select this plan"}
                    </button>
                  </article>
                );
              })}
            </div>
          </section>

          {/* Form / apply section */}
          <section id="em-apply" className="em-form-section">
            <div className="em-section-header">
              <h2 className="em-section-title">
                {selectedPlan
                  ? "Tell us about your event"
                  : "Tell us about your event idea"}
              </h2>
              <p className="em-section-sub">
                This is not a long contract — just enough information so we can
                understand your needs and configure your organizer profile.
              </p>
            </div>

            {isSuccess ? (
              <div className="em-success-card">
                <div className="em-success-icon-wrap">
                  <FiCheckCircle className="em-success-icon" />
                </div>
                <h3 className="em-success-title">
                  Your Event Manager request has been sent.
                </h3>
                <p className="em-success-text">
                  Our team will review your application. Once approved, you will
                  see a new <strong>Event Manager dashboard</strong> in your
                  account with tools to manage your events, attendees, exhibitors
                  and meetings.
                </p>
                <ul className="em-success-list">
                  <li>We’ll contact you on your work email.</li>
                  <li>You can continue using the platform normally.</li>
                  <li>
                    As soon as you’re approved, you’ll be able to create your
                    first event.
                  </li>
                </ul>
                {clientError && (
                  <p className="em-success-note">{clientError}</p>
                )}
              </div>
            ) : !hasPlan ? (
              <div className="em-form-locked">
                <div className="em-form-locked-main">
                  <div className="em-form-locked-icon">
                    <FiLayers />
                  </div>
                  <div>
                    <h3 className="em-form-locked-title">
                      Start by choosing a plan.
                    </h3>
                    <p className="em-form-locked-text">
                      Select the plan that matches your event size. We’ll then
                      unlock a short form where you share your event details.
                    </p>
                  </div>
                </div>
                <div className="em-form-locked-footer">
                  <button
                    type="button"
                    className="em-form-locked-btn"
                    onClick={scrollToPlans}
                  >
                    Browse plans
                    <FiArrowUpRight />
                  </button>
                  <p className="em-form-locked-note">
                    You can adjust your plan later with our team.
                  </p>
                </div>
              </div>
            ) : (
              <form className="em-form-card" onSubmit={handleSubmit}>
                {selectedPlan && (
                  <div className="em-form-selected">
                    <div className="em-form-selected-main">
                      <p className="em-form-selected-label">Selected plan</p>
                      <h3 className="em-form-selected-title">
                        {selectedPlan.label}
                      </h3>
                      <p className="em-form-selected-price">
                        {selectedPlan.priceLabel}
                      </p>
                      {selectedPlanPreset?.sizeHint && (
                        <p className="em-form-selected-meta">
                          {selectedPlanPreset.sizeHint}
                        </p>
                      )}
                    </div>
                    <ul className="em-form-selected-highlights">
                      {selectedPlan.highlights.slice(0, 2).map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      className="em-form-change-plan"
                      onClick={scrollToPlans}
                    >
                      Change plan
                    </button>
                  </div>
                )}

                {clientError && (
                  <div className="em-form-error">{clientError}</div>
                )}

                <div className="em-form-layout">
                  <div className="em-form-main">
                    <div className="em-form-grid">
                      {/* ORGANIZER COLUMN */}
                      <div className="em-form-column">
                        <div className="em-form-group-header">
                          <p className="em-form-group-title">
                            Organizer details
                          </p>
                          <p className="em-form-group-caption">
                            Tell us who is behind the event. Use a work contact
                            so we can reach you easily.
                          </p>
                        </div>

                        <div className="em-field">
                          <label className="em-label">Organizer type</label>
                          <select
                            name="organizerType"
                            value={form.organizerType}
                            onChange={onChangeField}
                            className="em-input"
                          >
                            <option value="company">Company</option>
                            <option value="ngo">Cooperative / NGO</option>
                            <option value="university">
                              University / School
                            </option>
                            <option value="individual">Individual</option>
                          </select>
                        </div>

                        <div className="em-field">
                          <label className="em-label">
                            Organization / project name<span>*</span>
                          </label>
                          <input
                            type="text"
                            name="orgName"
                            value={form.orgName}
                            onChange={onChangeField}
                            className="em-input"
                            placeholder="Example: Africa Trade Summit"
                          />
                        </div>

                        <div className="em-field">
                          <label className="em-label">
                            Website or main link
                          </label>
                          <input
                            type="url"
                            name="website"
                            value={form.website}
                            onChange={onChangeField}
                            className="em-input"
                            placeholder="https://..."
                          />
                        </div>

                        <div className="em-field em-field-inline">
                          <div>
                            <label className="em-label">Country</label>
                            <input
                              type="text"
                              name="country"
                              value={form.country}
                              onChange={onChangeField}
                              className="em-input"
                              placeholder="Country"
                            />
                          </div>
                          <div>
                            <label className="em-label">City</label>
                            <input
                              type="text"
                              name="city"
                              value={form.city}
                              onChange={onChangeField}
                              className="em-input"
                              placeholder="City"
                            />
                          </div>
                        </div>

                        <div className="em-field em-field-inline">
                          <div>
                            <label className="em-label">
                              Work email<span>*</span>
                            </label>
                            <input
                              type="email"
                              name="workEmail"
                              value={form.workEmail}
                              onChange={onChangeField}
                              className="em-input"
                              placeholder="you@company.com"
                            />
                          </div>
                          <div>
                            <label className="em-label">
                              Phone / WhatsApp
                            </label>
                            <input
                              type="tel"
                              name="phone"
                              value={form.phone}
                              onChange={onChangeField}
                              className="em-input"
                              placeholder="+216 ..."
                            />
                          </div>
                        </div>
                      </div>

                      {/* EVENT COLUMN */}
                      <div className="em-form-column">
                        <div className="em-form-group-header">
                          <p className="em-form-group-title">Event details</p>
                          <p className="em-form-group-caption">
                            We only need an approximate date and a rough idea of
                            the size and sectors. You can refine everything once
                            your dashboard is unlocked.
                          </p>
                        </div>

                        <div className="em-field">
                          <label className="em-label">
                            Event name<span>*</span>
                          </label>
                          <input
                            type="text"
                            name="eventName"
                            value={form.eventName}
                            onChange={onChangeField}
                            className="em-input"
                            placeholder="Name of your next event"
                          />
                        </div>

                        <div className="em-field em-field-inline">
                          <div>
                            <label className="em-label">
                              Approximate event date<span>*</span>
                            </label>
                            <input
                              type="date"
                              name="eventMonth"
                              value={form.eventMonth}
                              onChange={onChangeField}
                              className="em-input"
                            />
                            <p className="em-field-hint">
                              If you don&apos;t know the exact day, just choose
                              something close. You can adjust it later.
                            </p>
                          </div>
                          <div>
                            <label className="em-label">Mode</label>
                            <select
                              name="eventMode"
                              value={form.eventMode}
                              onChange={onChangeField}
                              className="em-input"
                            >
                              <option value="physical">Physical</option>
                              <option value="virtual">Virtual</option>
                              <option value="hybrid">Hybrid</option>
                            </select>
                            {selectedPlanPreset && (
                              <p className="em-field-hint">
                                {selectedPlanPreset.defaultMode === "hybrid"
                                  ? "This plan is optimized for hybrid events (onsite + online)."
                                  : "This plan is optimized for physical events."}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="em-field">
                          <label className="em-label">
                            Expected size (attendees)
                          </label>
                          <select
                            name="expectedSize"
                            value={form.expectedSize}
                            onChange={onChangeField}
                            className="em-input"
                          >
                            <option value="">Select a range</option>
                            <option value="0-200">0 – 200</option>
                            <option value="200-500">200 – 500</option>
                            <option value="500-2000">500 – 2,000</option>
                            <option value="2000+">More than 2,000</option>
                          </select>
                          {selectedPlanPreset?.sizeHint && (
                            <p className="em-field-hint">
                              {selectedPlanPreset.sizeHint}
                            </p>
                          )}
                        </div>

                        <div className="em-field">
                          <label className="em-label">
                            Main sectors / industries
                          </label>
                          <input
                            type="text"
                            name="sectors"
                            value={form.sectors}
                            onChange={onChangeField}
                            className="em-input"
                            placeholder="Example: Agrifood, fintech, logistics..."
                          />
                        </div>

                        <div className="em-form-group-header em-form-group-header--compact">
                          <p className="em-form-group-title">
                            Modules you are interested in
                          </p>
                          <p className="em-form-group-caption">
                            {selectedPlan
                              ? `We adapted the modules to the ${selectedPlan.label} plan. You can upgrade later if you need more.`
                              : "You can update this later with our team."}
                          </p>
                        </div>

                        <div className="em-field em-field-checkboxes">
                          <label className="em-label">What do you need?</label>

                          {/* Ticketing: always available */}
                          <label className="em-checkbox">
                            <input
                              type="checkbox"
                              name="needsTicketing"
                              checked={form.needsTicketing}
                              onChange={onChangeField}
                            />
                            <span>Ticketing / registrations</span>
                          </label>

                          {/* B2B meetings: locked for Starter, enabled for others */}
                          <label
                            className={
                              "em-checkbox" +
                              (isStarter ? " em-checkbox--locked" : "")
                            }
                          >
                            <input
                              type="checkbox"
                              name="needsB2B"
                              checked={form.needsB2B}
                              onChange={onChangeField}
                              disabled={isStarter}
                            />
                            <span>B2B meetings & matchmaking</span>
                            {isStarter && (
                              <span className="em-checkbox-tag">
                                Business & Enterprise
                              </span>
                            )}
                          </label>

                          {/* Marketplace: locked for Starter, optional for Pro/Enterprise */}
                          <label
                            className={
                              "em-checkbox" +
                              (isStarter ? " em-checkbox--locked" : "")
                            }
                          >
                            <input
                              type="checkbox"
                              name="needsMarketplace"
                              checked={form.needsMarketplace}
                              onChange={onChangeField}
                              disabled={isStarter}
                            />
                            <span>Exhibitors showcase & marketplace</span>
                            {isStarter && (
                              <span className="em-checkbox-tag">
                                Business & Enterprise
                              </span>
                            )}
                          </label>

                          {(isPro || isEnterprise) && (
                            <p className="em-field-hint">
                              On {isPro ? "Business" : "Enterprise"} we can
                              activate advanced exhibitor and B2B flows for your
                              event.
                            </p>
                          )}
                        </div>

                        <div className="em-field">
                          <label className="em-label">
                            Anything else we should know?
                          </label>
                          <textarea
                            name="notes"
                            value={form.notes}
                            onChange={onChangeField}
                            className="em-input em-textarea"
                            rows={4}
                            placeholder={
                              isEnterprise
                                ? "Share strategic goals, multiple countries, complex flows, or integrations you need."
                                : isPro
                                ? "Share context about exhibitors, B2B focus or sectors."
                                : "Share context, goals or constraints for your event."
                            }
                          />
                        </div>
                      </div>
                    </div>

                    <div className="em-form-footer">
                      <div className="em-form-footer-left">
                        {selectedPlan ? (
                          <div className="em-form-plan-pill">
                            Step 2 of 3 —{" "}
                            <strong>{selectedPlan.label} plan selected</strong>
                          </div>
                        ) : (
                          <div className="em-form-plan-pill em-form-plan-pill--muted">
                            Step 2 of 3 — select a plan above.
                          </div>
                        )}
                        <p className="em-form-privacy">
                          We only use this information to contact you about your
                          organizer access. No public listing is created before
                          you approve it.
                        </p>
                      </div>
                      <button
                        type="submit"
                        className="em-submit"
                        disabled={isLoading || !selectedPlan}
                      >
                        {isLoading
                          ? "Sending your request..."
                          : "Send request & wait confirmation"}
                      </button>
                    </div>
                  </div>

                  <aside className="em-form-aside">
                    <p className="em-aside-kicker">What you will unlock</p>
                    <ul className="em-aside-list">
                      <li>
                        <FiGrid />
                        <div>
                          <p>Organizer dashboard</p>
                          <span>
                            Centralize tickets, agenda, business profiles and
                            meetings.
                          </span>
                        </div>
                      </li>
                      <li>
                        <FiMonitor />
                        <div>
                          <p>Event builder & tickets</p>
                          <span>
                            Configure your event once, we handle the
                            registrations.
                          </span>
                        </div>
                      </li>
                      <li>
                        <FiTrendingUp />
                        <div>
                          <p>B2B & exhibitors flows</p>
                          <span>
                            Allow attendees and exhibitors to create real
                            business value.
                          </span>
                        </div>
                      </li>
                    </ul>
                    <p className="em-aside-note">
                      No automatic billing here. After this request, our team
                      reviews your use case, then you both agree on the final
                      setup.
                    </p>
                  </aside>
                </div>
              </form>
            )}
          </section>
        </div>
      </div>
      <Footer
        brand={footerData.brand}
        columns={footerData.columns}
        socials={footerData.socials}
        actions={footerData.actions}
        bottomLinks={footerData.bottomLinks}
      />
    </>
  );
};

export default EventManagerPage;
