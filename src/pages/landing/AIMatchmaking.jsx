import React from "react";
import { Link } from "react-router-dom";
import Lottie from "lottie-react";
import aiAnimation from "../../assets/lottie/ai-animation.json"; // 👈 your animation file
import Footer from "../../components/footer/Footer";
import { cta, footerData, nav, topbar } from "../main.mock";
import HeaderShell from "../../components/layout/HeaderShell";

export default function AIMatchmaking() {
  return (
        <>
      <HeaderShell top={topbar} nav={nav} cta={cta} />
    <div className="font-poppins bg-[#F9FAFB] text-gray-800">
      {/* HERO SECTION */}
      <section className="flex flex-col justify-center items-center text-center py-20 px-5 bg-gradient-to-r from-[#1C3664] to-[#25447E] text-white min-h-[400px]">
        {/* Lottie Animation */}
        <div className="w-40 md:w-60 mb-6">
          <Lottie animationData={aiAnimation} loop={true} autoplay={true} />
        </div>

        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          B2B AI Matchmaking
        </h1>
        <p className="text-lg md:text-xl mb-6 max-w-2xl text-gray-100">
          Connect with the right partners, clients, and investors. Let AI analyze your profile
          and recommend strategic business connections across industries and markets.
        </p>
        <Link
          to="/register"
          className="px-8 py-3 bg-[#F39337] text-white font-semibold rounded-lg shadow hover:bg-[#ff9f49] transition-all duration-300 hover:-translate-y-1"
        >
          Get Started
        </Link>
      </section>

      {/* HOW IT WORKS */}
      <div className="container max-w-6xl mx-auto px-5">
        <h2 className="text-center text-3xl font-semibold mt-16 mb-10 text-[#1C3664]">
          How It Works
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              step: "1",
              title: "Profile Analysis",
              desc: "AI examines your business profile, goals, and sector to understand your needs and capabilities.",
            },
            {
              step: "2",
              title: "Smart Matching",
              desc: "Receive personalized partner suggestions based on industry, geography, and growth objectives.",
            },
            {
              step: "3",
              title: "Connect & Engage",
              desc: "Reach out through Eventra, join relevant communities, or engage via Marketplace and Trade Missions.",
            },
          ].map(({ step, title, desc }) => (
            <div
              key={step}
              className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-2 transition-all duration-300 text-center border-t-4 border-[#F39337]"
            >
              <div className="text-4xl font-extrabold text-[#1C3664] mb-4">
                {step}
              </div>
              <h3 className="text-lg font-semibold mb-2 text-[#1C3664]">
                {title}
              </h3>
              <p className="text-sm text-gray-600">{desc}</p>
            </div>
          ))}
        </div>

        {/* WHY CHOOSE US */}
        <h2 className="text-center text-3xl font-semibold mt-20 mb-10 text-[#1C3664]">
          Why Choose Eventra AI Matchmaking
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            "AI-Powered Connections",
            "Cross-Sector Visibility",
            "End-to-End Support",
            "Smart Recommendations",
          ].map((title, idx) => (
            <div
              key={idx}
              className="bg-[#1C3664] text-white p-6 rounded-xl hover:bg-[#25447E] hover:-translate-y-1 transition-all duration-300 text-center"
            >
              <h4 className="font-semibold mb-2 text-[#F39337]">{title}</h4>
              <p className="text-sm text-gray-100">
                {idx === 0
                  ? "No random matches, only relevant partners."
                  : idx === 1
                  ? "Expand your network beyond your industry."
                  : idx === 2
                  ? "From digital matching to real business meetings."
                  : "Save time and focus on real opportunities."}
              </p>
            </div>
          ))}
        </div>

        {/* CONNECTED SERVICES */}
        <h2 className="text-center text-3xl font-semibold mt-20 mb-10 text-[#1C3664]">
          Connected Services
        </h2>
        <div className="flex flex-wrap gap-4 justify-center">
          {[
            { label: "Marketplace", to: "/marketplace" },
            { label: "Communities", to: "/communities" },
            { label: "Trade Missions", to: "/services/trade-missions" },
            { label: "Logistics Solutions", to: "/services/logistics" },
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
        <h3 className="text-3xl font-semibold mb-5">Ready to Connect?</h3>
        <Link
          to="/register"
          className="px-8 py-3 bg-[#F39337] text-white font-semibold rounded-lg shadow hover:bg-[#ff9f49] transition-all duration-300 hover:-translate-y-1"
        >
          Create Your Profile
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
