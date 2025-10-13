import React from "react";
import { Link } from "react-router-dom";
import Lottie from "lottie-react";
import sailingShip from "../../assets/lottie/sailing-ship.json"; // adjust path if needed
import HeaderShell from "../../components/layout/HeaderShell";
import { cta, footerData, nav, topbar } from "../main.mock";
import Footer from "../../components/footer/Footer";

export default function ExportConsultancy() {
  return (
            <>
      <HeaderShell top={topbar} nav={nav} cta={cta} />
    <div className="font-poppins bg-[#F9FAFB] text-gray-800">
      {/* HERO SECTION */}
      <section className="flex flex-col lg:flex-row justify-center items-center text-center lg:text-left py-20 px-5 bg-gradient-to-r from-[#1C3664] to-[#F39337] text-white min-h-[500px] gap-10">
        {/* Animation */}
        <div className="w-full lg:w-1/2 flex justify-center">
          <Lottie animationData={sailingShip} loop={true} className="w-72 lg:w-96" />
        </div>

        {/* Text Content */}
        <div className="w-full lg:w-1/2">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Export Consultancy
          </h1>
          <p className="text-lg md:text-xl mb-6 text-gray-100 max-w-xl mx-auto lg:mx-0">
            Expand your business globally with expert guidance. Our platform provides
            tailored consultancy, AI insights, and seamless planning for your export journey.
          </p>
          <Link
            to="/register"
            className="px-8 py-3 bg-white text-[#1C3664] font-semibold rounded-lg shadow hover:bg-[#f0f0f0] transition-all duration-300 hover:-translate-y-1"
          >
            Get Started
          </Link>
        </div>
      </section>

      {/* OUR SERVICES */}
      <div className="container max-w-6xl mx-auto px-5">
        <h2 className="text-center text-3xl font-semibold mt-16 mb-10 text-[#1C3664]">
          Our Services
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              title: "Market Research",
              desc: "Identify the best international markets for your products with data-driven insights.",
              img: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80",
            },
            {
              title: "Compliance & Documentation",
              desc: "Get expert support on regulations, certifications, and documentation for smooth export.",
              img: "https://images.unsplash.com/photo-1593642532973-d31b6557fa68?auto=format&fit=crop&w=800&q=80",
            },
            {
              title: "Partner Matching",
              desc: "Connect automatically with distributors, buyers, and business partners using AI matchmaking.",
              img: "https://seketak-eg.com/wp-content/uploads/2025/03/image-1.png?auto=format&fit=crop&w=800&q=80",
            },
            {
              title: "Trade Missions",
              desc: "Participate in targeted trade missions and exhibitions to expand your business globally.",
              img: "https://seketak-eg.com/wp-content/uploads/2025/03/sans-titre-201.png?auto=format&fit=crop&w=800&q=80",
            },
            {
              title: "Logistics & Operations",
              desc: "Get full support for shipping, customs, and operational planning to ensure smooth exports.",
              img: "https://images.unsplash.com/photo-1571933739778-467fa9284321?auto=format&fit=crop&w=800&q=80",
            },
          ].map(({ title, desc, img }, idx) => (
            <div
              key={idx}
              className="bg-white rounded-xl shadow-md hover:shadow-lg hover:-translate-y-2 transition-all duration-300 overflow-hidden border-t-4 border-[#F39337]"
            >
              <img src={img} alt={title} className="w-full h-48 object-cover" />
              <div className="p-5 text-center">
                <h3 className="text-lg font-semibold text-[#1C3664] mb-2">
                  {title}
                </h3>
                <p className="text-sm text-gray-600">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* WHY CHOOSE US */}
        <h2 className="text-center text-3xl font-semibold mt-20 mb-10 text-[#1C3664]">
          Why Choose GITS Export Consultancy
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { title: "Global Expansion", desc: "Access international markets with confidence." },
            { title: "AI-Powered Insights", desc: "Receive recommendations for partners and markets automatically." },
            { title: "Expert Guidance", desc: "Navigate regulations, documentation, and trade compliance with ease." },
            { title: "Streamlined Operations", desc: "End-to-end support for logistics and trade missions." },
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
            { label: "Trade Missions", to: "/services/trade-missions" },
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
        <h3 className="text-3xl font-semibold mb-5">Ready to Expand Globally?</h3>
        <Link
          to="/register"
          className="px-8 py-3 bg-[#F39337] text-white font-semibold rounded-lg shadow hover:bg-[#ff9f49] transition-all duration-300 hover:-translate-y-1"
        >
          Start Your Export Journey
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
