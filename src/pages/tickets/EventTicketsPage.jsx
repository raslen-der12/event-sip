// src/pages/tickets/EventTicketsPage.jsx
import React, { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import {
  FiCalendar,
  FiMapPin,
  FiUsers,
  FiAlertTriangle,
  FiArrowRight,
  FiCheckCircle,
} from "react-icons/fi";
import "./event-tickets.css";
import {
  useGetEventQuery,
  useGetTicketsQuery,
} from "../../features/events/eventsApiSlice";
import Footer from "../../components/footer/Footer";
import { cta, footerData, topbar } from "../main.mock";
import HeaderShell from "../../components/layout/HeaderShell";


/* demo fallback when API returns nothing */
const demoTickets = [
  {
    id: "silver-delegate",
    type: "delegate",
    name: "Silver Delegate",
    price: 99,
    description:
      "Access to keynotes _ Expo hall _ Coffee breaks _ Mobile app access",
  },
  {
    id: "vip-business",
    type: "vip",
    name: "VIP Business",
    price: 299,
    description:
      "All Silver benefits _ VIP lounge access _ Front-row seating _ Speaker meet & greet _ Express registration",
  },
  {
    id: "exhibitor-standard",
    type: "exhibitor",
    name: "Exhibitor",
    price: 1200,
    description:
      "Standard 3x3m booth _ 2 exhibitor badges _ Power outlet _ Logo on website _ Listing in catalogue",
  },
];

const fmtDate = (d) => {
  try {
    const x = new Date(d);
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(x);
  } catch {
    return "";
  }
};
const fmtMoney = (n) =>
  typeof n === "number"
    ? new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(n)
    : String(n);
const parsePoints = (s) =>
  String(s || "")
    .split(/[_\n\r•\-]+/g)
    .map((t) => t.trim())
    .filter(Boolean);
const upper = (s) =>
  String(s || "").charAt(0).toUpperCase() + String(s || "").slice(1);






export default function EventTicketsPage() {
  const { eventId } = useParams();
const nav = [
  { label: "Home", href: "/" },
  { label: "Event page", href: `/event/${eventId}` },
  { label: "Speakers", href: `/event/${eventId}/speakers` },
  { label: "Attendees", href: `/event/${eventId}/attendees` },
  { label: "Exhibitors", href: `/event/${eventId}/exhibitors` },
  { label: "Schedule", href: `/event/${eventId}/schedule` },
  { label: "Tickets", href: `/event/${eventId}/tickets` },
];
  // call hooks normally (no optional chaining) to satisfy Rules of Hooks
  const {
    data: ev,
    isLoading: evL,
    isError: evE,
  } = useGetEventQuery(eventId);
  const {
    data: tix,
    isLoading: tL,
    isError: tE,
  } = useGetTicketsQuery(eventId);

  const list = useMemo(
    () => (Array.isArray(tix) && tix.length ? tix : demoTickets),
    [tix]
  );

  const evTitle = ev?.title || "Event";
  const evDates =
    ev?.startDate || ev?.endDate
      ? `${fmtDate(ev?.startDate)} – ${fmtDate(ev?.endDate)}`
      : "";
  const evWhere = [ev?.venueName, ev?.city, ev?.country]
    .filter(Boolean)
    .join(" · ");
  const evCap =
    typeof ev?.capacity === "number"
      ? `${Math.max(0, ev?.seatsTaken || 0)}/${ev.capacity} seats`
      : null;

  return (
    <>
      <HeaderShell top={topbar} nav={nav} cta={cta} />

    <section className="etx">
      <div className="container">
        <header className="etx-event">
          <div className="etx-event-left">
            <h1 className="etx-title">{evL ? "Loading…" : evTitle}</h1>
            <div className="etx-meta">
              {evDates ? (
                <span className="etx-pill">
                  <FiCalendar />
                  {evDates}
                </span>
              ) : null}
              {evWhere ? (
                <span className="etx-pill">
                  <FiMapPin />
                  {evWhere}
                </span>
              ) : null}
              {evCap ? (
                <span className="etx-pill">
                  <FiUsers />
                  {evCap}
                </span>
              ) : null}
            </div>
          </div>
          <div className="etx-event-right">
            <span className="etx-note">Choose your ticket</span>
          </div>
        </header>

        {tE ? (
          <div className="etx-alert">
            <FiAlertTriangle />
            Failed to load tickets. Showing demo options.
          </div>
        ) : null}

        <div className="etx-grid">
          {tL
            ? [...Array(6)].map((_, i) => (
                <div key={i} className="etx-card is-skel" />
              ))
            : list.map((t) => (
                <article key={t.id || t._id} className="etx-card">
                  <div className="etx-card-head">
                    <span className={`etx-type -${(t.type || "").toLowerCase()}`}>
                      {upper(t.type) || "Ticket"}
                    </span>
                    <div className="etx-price">
                      <strong className="etx-amount">
                        {typeof t.price === "number"
                          ? fmtMoney(t.price)
                          : t.price || "Free"}
                      </strong>
                      <span className="etx-amt-note">incl. access</span>
                    </div>
                  </div>

                  <div className="etx-body">
                    <h3 className="etx-name">{t.name || "—"}</h3>
                    <ul className="etx-points">
                      {parsePoints(t.description).map((p, i) => (
                        <li key={i}>
                          <FiCheckCircle />
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="etx-cta">
                    <Link
                      className="etx-btn etx-primary"
                      to={`/purchase?eventId=${encodeURIComponent(
                        eventId || ""
                      )}&ticketId=${encodeURIComponent(t.id || t._id || "")}`}
                    >
                      Select <FiArrowRight />
                    </Link>
                  </div>
                </article>
              ))}
        </div>
      </div>
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
