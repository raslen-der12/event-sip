import React from "react";
import { Link } from "react-router-dom";
import Lottie from "lottie-react";
import globalBusiness from "../../assets/lottie/global-business.json";
import HeaderShell from "../../components/layout/HeaderShell";
import { cta, footerData, nav, topbar } from "../main.mock";
import Footer from "../../components/footer/Footer";

export default function TradeMissions() {
  return (
            <>
      <HeaderShell top={topbar} nav={nav} cta={cta} />
    <div className="font-poppins bg-[#F9FAFB] text-gray-800">
      {/* HERO SECTION */}
      <section className="flex flex-col lg:flex-row justify-center items-center text-center lg:text-left py-20 px-5 bg-gradient-to-r from-[#1C3664] to-[#F39337] text-white min-h-[500px] gap-10">
        {/* Lottie Animation */}
        <div className="w-full lg:w-1/2 flex justify-center">
          <Lottie animationData={globalBusiness} loop={true} className="w-72 lg:w-96" />
        </div>

        {/* Hero Text */}
        <div className="w-full lg:w-1/2">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Trade Missions
          </h1>
          <p className="text-lg md:text-xl mb-6 text-gray-100 max-w-xl mx-auto lg:mx-0">
            Expand your business internationally with Eventra Trade Missions. 
            Connect with partners, explore markets, and leverage AI-powered matchmaking 
            for real B2B opportunities.
          </p>
          <Link
            to="/register"
            className="px-8 py-3 bg-white text-[#1C3664] font-semibold rounded-lg shadow hover:bg-[#f0f0f0] transition-all duration-300 hover:-translate-y-1"
          >
            Join a Trade Mission
          </Link>
        </div>
      </section>

      {/* WHY PARTICIPATE */}
      <div className="container max-w-6xl mx-auto px-5">
        <h2 className="text-center text-3xl font-semibold mt-16 mb-10 text-[#1C3664]">
          Why Participate in Trade Missions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: "bi-globe2",
              title: "International Market Access",
              desc: "Discover new regions and expand your business footprint globally.",
            },
            {
              icon: "bi-people",
              title: "B2B Networking",
              desc: "Meet potential partners, clients, and investors in curated sessions.",
            },
            {
              icon: "bi-bar-chart-line",
              title: "Market Insights",
              desc: "Receive AI-driven analytics to make informed business decisions.",
            },
            {
              icon: "bi-handshake",
              title: "Partnership Opportunities",
              desc: "Engage in strategic collaborations with local and international businesses.",
            },
          ].map(({ icon, title, desc }, idx) => (
            <div
              key={idx}
              className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-2 transition-all duration-300 text-center border-t-4 border-[#F39337]"
            >
              <i className={`bi ${icon} text-4xl text-[#F39337] mb-4`}></i>
              <h3 className="text-lg font-semibold mb-2 text-[#1C3664]">{title}</h3>
              <p className="text-sm text-gray-600">{desc}</p>
            </div>
          ))}
        </div>

        {/* RECENT MISSIONS */}
        <h2 className="text-center text-3xl font-semibold mt-20 mb-10 text-[#1C3664]">
          Recent Trade Missions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-8">
          {[
            {
              title: "Cairo, Egypt",
              date: "12 & 13 May 2025",
              highlights:
                "B2B matchmaking, market research, networking with local distributors.",
              img: "https://gits.seketak-eg.com/wp-content/uploads/2025/10/Rectangle-805.png?auto=format&fit=crop&w=800&q=80",
            },
            {
              title: "Abidjan, Côte d'Ivoire",
              date: "12 & 13 June 2025",
              highlights:
                "AI matchmaking, local market visits, networking with investors and partners.",
              img: "https://gits.seketak-eg.com/wp-content/uploads/2025/10/dza.png?auto=format&fit=crop&w=800&q=80",
            },
          ].map(({ title, date, highlights, img }, idx) => (
            <div
              key={idx}
              className="bg-white rounded-xl shadow-md hover:shadow-lg hover:-translate-y-2 transition-all duration-300 overflow-hidden"
            >
              <img src={img} alt={title} className="w-full h-56 object-cover" />
              <div className="p-5 text-center">
                <h3 className="text-xl font-semibold text-[#1C3664] mb-2">
                  {title}
                </h3>
                <p className="text-sm text-gray-600 mb-1">
                  <span className="font-semibold text-[#F39337]">Date:</span> {date}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-semibold text-[#F39337]">Highlights:</span> {highlights}
                </p>
              </div>
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
            { label: "Export Consultancy", to: "/services/export-consultancy" },
            { label: "Marketplace", to: "/marketplace" },
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
        <h3 className="text-3xl font-semibold mb-5">
          Join Our Next Trade Mission
        </h3>
        <Link
          to="/register"
          className="px-8 py-3 bg-[#F39337] text-white font-semibold rounded-lg shadow hover:bg-[#ff9f49] transition-all duration-300 hover:-translate-y-1"
        >
          Participate Now
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
