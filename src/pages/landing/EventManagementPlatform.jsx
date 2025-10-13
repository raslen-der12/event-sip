import React from "react";
import { Link } from "react-router-dom";
import Lottie from "lottie-react";
import dataManagement from "../../assets/lottie/data-management.json"; // 👈 your Lottie file
import HeaderShell from "../../components/layout/HeaderShell";
import { cta, footerData, nav, topbar } from "../main.mock";
import Footer from "../../components/footer/Footer";

export default function EventManagementPlatform() {
  return (
            <>
      <HeaderShell top={topbar} nav={nav} cta={cta} />
    <div className="font-poppins bg-[#F9FAFB] text-gray-800">
      {/* HERO SECTION */}
      <section className="flex flex-col justify-center items-center text-center py-20 px-5 bg-gradient-to-r from-[#1C3664] to-[#F39337] text-white min-h-[400px]">
        {/* Animation */}
        <div className="w-44 md:w-60 mb-6">
          <Lottie animationData={dataManagement} loop={true} autoplay={true} />
        </div>

        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Event Management Platform
        </h1>
        <p className="text-lg md:text-xl mb-6 max-w-2xl text-gray-100">
          Manage your events end-to-end with our AI-powered dashboard. Monitor
          performance, handle subscriptions, generate QR codes, and connect
          participants automatically for smarter B2B meetings.
        </p>
        <Link
          to="/register"
          className="px-8 py-3 bg-white text-[#1C3664] font-semibold rounded-lg shadow hover:bg-[#f0f0f0] transition-all duration-300 hover:-translate-y-1"
        >
          Start Managing Your Event
        </Link>
      </section>

      {/* FEATURES */}
      <div className="container max-w-6xl mx-auto px-5">
        <h2 className="text-center text-3xl font-semibold mt-16 mb-10 text-[#1C3664]">
          Platform Features
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: "bi-speedometer2",
              title: "Event Dashboard",
              desc: "Track your event performance before, during, and after execution in one unified dashboard.",
            },
            {
              icon: "bi-bar-chart-line",
              title: "AI Reporting",
              desc: "Receive automated insights and analytics to optimize engagement and ROI.",
            },
            {
              icon: "bi-card-checklist",
              title: "Subscription Management",
              desc: "Manage attendee registrations, tickets, and subscription tiers with ease.",
            },
            {
              icon: "bi-qr-code",
              title: "QR Codes & Access",
              desc: "Generate QR codes for smooth attendee check-ins and seamless event access.",
            },
            {
              icon: "bi-people",
              title: "AI B2B Matchmaking",
              desc: "Automatically connect participants with strategic partners and schedule meetings.",
            },
            {
              icon: "bi-chat-dots",
              title: "Messaging & Networking",
              desc: "Enable attendees to communicate, book meetings, and build lasting business relationships.",
            },
          ].map(({ icon, title, desc }, idx) => (
            <div
              key={idx}
              className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-2 transition-all duration-300 text-center border-t-4 border-[#F39337]"
            >
              <i className={`bi ${icon} text-4xl text-[#F39337] mb-4`}></i>
              <h3 className="text-lg font-semibold mb-2 text-[#1C3664]">
                {title}
              </h3>
              <p className="text-sm text-gray-600">{desc}</p>
            </div>
          ))}
        </div>

        {/* BENEFITS */}
        <h2 className="text-center text-3xl font-semibold mt-20 mb-10 text-[#1C3664]">
          Why Choose GITS Events
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            {
              title: "Full Event Control",
              desc: "Manage every aspect from planning to execution.",
            },
            {
              title: "AI Insights",
              desc: "Smart recommendations for attendee connections and event performance.",
            },
            {
              title: "Seamless Networking",
              desc: "Automatic matchmaking and messaging to boost B2B interactions.",
            },
            {
              title: "Time & Cost Efficiency",
              desc: "Reduce manual coordination and optimize your resources.",
            },
          ].map(({ title, desc }, idx) => (
            <div
              key={idx}
              className="bg-[#1C3664] text-white p-6 rounded-xl hover:bg-[#F39337] hover:-translate-y-1 transition-all duration-300 text-center"
            >
              <h4 className="font-semibold mb-2 text-[#FDD5B0]">{title}</h4>
              <p className="text-sm text-gray-100">{desc}</p>
            </div>
          ))}
        </div>

        {/* CONNECTED SERVICES */}
        <h2 className="text-center text-3xl font-semibold mt-20 mb-10 text-[#1C3664]">
          Connected Services
        </h2>
        <div className="flex flex-wrap gap-4 justify-center">
          {[
            { label: "B2B AI Matchmaking", to: "/services/ai-matchmaking" },
            { label: "Marketplace", to: "/marketplace" },
            { label: "Communities", to: "/communities" },
            { label: "Trade Missions", to: "/services/trade-missions" },
          ].map(({ label, to }, idx) => (
            <Link
              key={idx}
              to={to}
              className="bg-white border border-[#1C3664]/20 p-5 rounded-xl shadow hover:shadow-lg hover:-translate-y-1 transition-all duration-300 font-semibold text-[#1C3664] hover:text-[#F39337]"
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

      {/* CTA FOOTER */}
      <section className="bg-[#1C3664] text-white text-center py-16 mt-20 rounded-t-3xl">
        <h3 className="text-3xl font-semibold mb-5">Ready to Host Your Event?</h3>
        <Link
          to="/register"
          className="px-8 py-3 bg-[#F39337] text-white font-semibold rounded-lg shadow hover:bg-[#ff9f49] transition-all duration-300 hover:-translate-y-1"
        >
          Create Your Event
        </Link>
      </section>
    </div>
          <Footer
        brand={footerData.brand}
        columns={footerData.columns}
        socials={footerData.socials}
        actions={footerData.actions}
        bottomLinks={footerData.bottomLinks}
      />
    </>);
}
