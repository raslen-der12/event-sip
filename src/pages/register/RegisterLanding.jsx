import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Lottie from "lottie-react";
import { Calendar, MapPin } from "lucide-react";
import {
  useGetEventQuery,
  useGetEventsQuery,
} from "../../features/events/eventsApiSlice";
import HeaderShell from "../../components/layout/HeaderShell";
import { cta, footerData, nav, topbar } from "../main.mock";
import Footer from "../../components/footer/Footer";

// 🟢 Lottie animations
import attendeeAnim from "../../assets/lottie/attendee.json";
import exhibitorAnim from "../../assets/lottie/exhibitor.json";
import imageLink from "../../utils/imageLink";

function StepDots({ current = 0 }) {
  return (
    <div className="flex justify-center mt-4 space-x-2">
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          className={`h-2 w-2 rounded-full ${
            current === i ? "bg-[#7BC2D5]" : "bg-gray-300"
          }`}
        />
      ))}
    </div>
  );
}

export default function RegisterLanding() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const urlEventId = params.get("eventId") || "68e6764bb4f9b08db3ccec04";
  const [selectedEvent, setSelectedEvent] = useState(null);

  const { data: eventById, isFetching: fetchingOne } = useGetEventQuery(urlEventId, {
    skip: !urlEventId,
  });
  const { data: eventsList = [], isFetching: fetchingList } = useGetEventsQuery(undefined, {
    skip: !!urlEventId,
  });

  useEffect(() => {
    if (!urlEventId && !fetchingList && Array.isArray(eventsList)) {
      if (eventsList.length === 1) {
        const e = eventsList[0];
        setSelectedEvent(e);
        const id = e._id || e.id;
        setParams((prev) => {
          const p = new URLSearchParams(prev);
          p.set("eventId", id);
          return p;
        });
      }
    }
  }, [urlEventId, fetchingList, eventsList, setParams]);

  useEffect(() => {
    if (urlEventId && eventById) setSelectedEvent(eventById);
  }, [urlEventId, eventById]);

  const headerEvent = selectedEvent || eventById || {};
  const currentStepIndex = 0;

  const chooseRole = (role) => {
    const id = (headerEvent?._id || headerEvent?.id || urlEventId || "").toString();
    if (!id) return;
    navigate(`/register/${role}?eventId=${id}`);
  };

  const Loader = (
    <div className="animate-pulse text-center py-10 text-gray-400">Loading...</div>
  );
  const base = process.env.REACT_APP_API_URL
  // 🧩 ROLE SELECTION SECTION
  const RoleChooser = (
    <div className="w-full bg-gray-50">
      {/* --- Hero Section (Image Left / Text Right) --- */}
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-10 items-center py-16 px-6">
        {/* Left: Event Image */}
        <div className="w-full rounded-2xl overflow-hidden shadow-md">
          <img
            src={
              imageLink(headerEvent.cover) ||
              `${base}/uploads/images/admin/cover-ipdays.jpg`
            }
            alt={headerEvent.title || "Event Cover"}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Right: Event Info */}
        <div className="text-left">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            {headerEvent.title || "L’international"}
          </h1>
          <p className="text-lg text-gray-700 mb-4">
            {headerEvent.subtitle || "Les InnoPreneurs Days – IPDAYS 2025."}
          </p>
          <p className="text-gray-600 mb-6 leading-relaxed">
            {headerEvent.description ||
              "Cette édition, placée sous le thème “L’INTERNATIONAL”, a pour objectif d’ouvrir les portes de l’écosystème tunisien vers le monde, en mettant en lumière les opportunités de collaboration, d’export, et de partenariats à l’échelle internationale."}
          </p>

          {/* Event Details */}
          <div className="flex flex-wrap gap-6 text-gray-700 mb-6">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#7BC2D5]" />
              <span>{headerEvent.date || "12–13 November 2025"}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#7BC2D5]" />
              <span>{headerEvent.venue || "Tunis – Hybrid Edition"}</span>
            </div>
          </div>

          <button
            onClick={() =>
              document
                .getElementById("role-section")
                ?.scrollIntoView({ behavior: "smooth" })
            }
            className="bg-[#7BC2D5] hover:bg-[#68a7bb] transition text-white font-medium px-6 py-3 rounded-full shadow-md"
          >
            View Participation Options ↓
          </button>
        </div>
      </div>

      {/* --- Role Cards Section --- */}
      <div id="role-section" className="max-w-6xl mx-auto py-16 px-6 text-center">
        <h2 className="text-2xl font-semibold mb-8">
          Choose your participation type
        </h2>

        <div className="grid sm:grid-cols-2 gap-8">
          {/* Attendee Card */}
          <div
            onClick={() => chooseRole("attendee")}
            className="cursor-pointer bg-white border border-gray-200 hover:border-[#7BC2D5] hover:shadow-lg transition rounded-2xl p-8 flex flex-col items-center"
          >
            <div className="h-28 w-full flex items-center justify-center mb-4">
              <Lottie animationData={attendeeAnim} loop={true} className="w-32 h-32" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-gray-800">
              Participate as Attendee
            </h3>
            <p className="text-gray-600 mb-4">
              Attend sessions, join B2B meetings, and network with innovators.
            </p>
            <button className="px-5 py-2 bg-[#7BC2D5] text-white rounded-full hover:bg-[#68a7bb]">
              Join as Attendee
            </button>
          </div>

          {/* Exhibitor Card */}
          <div
            onClick={() => chooseRole("exhibitor")}
            className="cursor-pointer bg-white border border-gray-200 hover:border-[#7BC2D5] hover:shadow-lg transition rounded-2xl p-8 flex flex-col items-center"
          >
            <div className="h-24 w-full flex items-center justify-center mb-4">
              <Lottie
                animationData={exhibitorAnim}
                loop={true}
                className="w-28 h-28 md:w-24 md:h-24"
              />
            </div>
            <h3 className="text-xl font-bold mb-2 text-gray-800">
              Become an Exhibitor
            </h3>
            <p className="text-gray-600 mb-4">
              Showcase your brand, display your innovations, and connect with partners.
            </p>
            <button className="px-5 py-2 bg-[#7BC2D5] text-white rounded-full hover:bg-[#68a7bb]">
              Exhibit Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <HeaderShell top={topbar} nav={nav} cta={cta} />
      <div className="min-h-screen bg-gray-50">
        <StepDots current={currentStepIndex} />
        {fetchingOne ? Loader : RoleChooser}
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
}
