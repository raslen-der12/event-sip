import React from "react";
import Footer from "../../components/footer/Footer";
import { cta, footerData, nav, topbar } from "../main.mock";
import HeaderShell from "../../components/layout/HeaderShell";

export default function AboutUs() {
  const founders = [
    {
      name: "Douja Gharbi",
      title: "co-founder Of SunUp Tunisia",
      image: "https://seketak-eg.com/wp-content/uploads/2025/02/douja-gharbi.png",
    },
    {
      name: "Assem Kamel",
      title: "Co-founder & CEO OF SunUp Tunisia Co-founder & President of The LEE Experience Lebanon",
      image: "https://seketak-eg.com/wp-content/uploads/2025/04/Group-40185.png",
    },
    {
      name: "Manal Hassoun",
      title: "Co-founder & CEO of  The LEE Experience Lebanon",
      image: "https://seketak-eg.com/wp-content/uploads/2025/03/Manal-Hassoun-2.png",
    },
  ];

  return (
    <>
      <HeaderShell top={topbar} nav={nav} cta={cta} />

      <section className="bg-white text-gray-800 font-inter">
        {/* HERO */}
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 text-center py-20 px-6">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            About <span className="text-blue-600">Eventra</span>
          </h1>
          <p className="max-w-3xl mx-auto text-lg text-gray-600">
            Eventra is a global B2B platform co-owned by SunUP Tunisia, specializing in Program Management, Monitoring & Evaluation, and The LEE Experience – Incubation and Acceleration (Lebanon).
          <br></br><br />
          
The platform was developed in close collaboration with key ecosystem partners, including Seketak Incubator & Accelerator (Egypt) and RedStart Tunisia.

Headquartered in Lebanon and operating across the MENA region, Africa, and beyond, Eventra facilitates high-impact business connections worldwide through its integrated suite of services—bridging regional strengths in entrepreneurship, innovation, and ecosystem development.
          </p>
        </div>

        {/* ABOUT EVENTRA */}
        <div className="max-w-6xl mx-auto px-6 py-16 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Who We Are</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              <strong>Eventra</strong> is a global B2B platform owned by{" "}
              <strong>Seketak for Entrepreneurship Solutions</strong>, a multinational company
              operating in partnership with{" "}
              <strong>Falak Startups Venture Capital Fund</strong> — backed by Egypt’s Ministry of
              International Cooperation and Ministry of Investment.
            </p>
            <p className="text-gray-600 leading-relaxed">
              While headquartered in Egypt, Eventra serves clients and facilitates business
              connections across the Middle East, Africa, and international markets through
              integrated services including:
            </p>
            <ul className="list-disc list-inside text-gray-600 mt-3 space-y-1 text-sm">
              <li>AI-powered B2B matchmaking</li>
              <li>Market intelligence communities</li>
              <li>End-to-end event & exhibition management</li>
              <li>Export consultancy & trade missions</li>
              <li>Private business delegations</li>
              <li>Logistics and trade enablement solutions</li>
            </ul>
          </div>
          <img
            src="https://gits.seketak-eg.com/wp-content/uploads/2025/05/DSC_5316-1.png"
            alt="About Eventra"
            className="rounded-2xl shadow-md"
          />
        </div>

        {/* MISSION & VISION */}
        <div className="bg-blue-50 py-16 px-6">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10 items-start">
            <div>
              <h2 className="text-2xl font-bold mb-4 text-gray-900">Our Mission</h2>
              <p className="text-gray-600 leading-relaxed">
                To empower global businesses with intelligent matchmaking, end-to-end event
                solutions, and strategic trade enablement — accelerating cross-border collaboration,
                innovation, and sustainable growth across the Middle East, Africa, and beyond.
              </p>
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-4 text-gray-900">Our Vision</h2>
              <p className="text-gray-600 leading-relaxed">
                To be the world’s most trusted B2B growth platform — where AI-driven connections,
                curated market communities, and seamless logistics converge to unlock
                entrepreneurial potential and transform regional economies.
              </p>
            </div>
          </div>
          <div className="text-center mt-12">
            <h3 className="text-xl font-semibold text-purple-600 italic">
              “Connect. Grow. Globalize.”
            </h3>
          </div>
        </div>

        {/* OUR IMPACT */}
        <div className="max-w-6xl mx-auto px-6 py-12 grid md:grid-cols-2 gap-10 items-center">
          <img
            src="https://gits.seketak-eg.com/wp-content/uploads/2025/10/d6b7dc86-0885-4c9a-8a4a-222cf7974fe4-1.png"
            alt="Impact"
            className="rounded-2xl shadow-md order-2 md:order-1"
          />
          <div className="order-1 md:order-2">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Our Impact</h2>
            <p className="text-gray-600 leading-relaxed">
              Our work is rooted in innovation, inclusivity, and collaboration. We design and manage
              programs that transform ideas into scalable ventures. With extensive experience in
              supporting NGO and government sectors, we empower organizations through training,
              strategy, and technical expertise to strengthen frameworks and foster sustainable
              development.
            </p>
          </div>
        </div>

        {/* FOUNDERS */}
        <div className="max-w-6xl mx-auto py-16 px-6 text-center">
          <h2 className="text-3xl font-semibold mb-8 text-gray-900">Our Founders</h2>
          <div className="grid sm:grid-cols-3 gap-10">
            {founders.map((f, i) => (
              <div key={i} className="flex flex-col items-center">
                <img
                  src={f.image}
                  alt={f.name}
                  className="w-40 h-40 object-cover rounded-full shadow-lg mb-4"
                />
                <h3 className="text-lg font-semibold">{f.name}</h3>
                <p className="text-gray-500 text-sm">{f.title}</p>
              </div>
            ))}
          </div>
        </div>

        {/* OUR VALUES */}
        <div className="max-w-6xl mx-auto px-6 py-12 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Our Values</h2>
            <p className="text-gray-600 leading-relaxed">
              We champion diversity and inclusion with over <strong>50% female representation</strong>
              on our board of directors. We believe entrepreneurship is a powerful tool for change —
              unlocking opportunities, fostering innovation, and building a future where everyone
              can succeed.
            </p>
          </div>
          <img
            src="https://gits.seketak-eg.com/wp-content/uploads/2025/10/Rectangle-802.png"
            alt="Values"
            className="rounded-2xl shadow-md"
          />
        </div>

        {/* TWO PILLARS */}
        <div className="bg-blue-50 py-16 px-6 text-center">
          <h2 className="text-3xl font-semibold mb-6 text-gray-900">Our Two Pillars</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div className="bg-white p-8 rounded-2xl shadow-md hover:shadow-lg transition">
              <h3 className="text-xl font-semibold mb-2 text-blue-600">
                Entrepreneurship & Innovation
              </h3>
              <p className="text-gray-600">
                We empower startups, SMEs, and innovators with resources, mentorship, and networks
                to build sustainable ventures.
              </p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-md hover:shadow-lg transition">
              <h3 className="text-xl font-semibold mb-2 text-purple-600">
                Capacity Building & Development
              </h3>
              <p className="text-gray-600">
                Through training and partnerships, we enable NGOs and government entities to design
                and deliver impactful programs that drive inclusive growth.
              </p>
            </div>
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
