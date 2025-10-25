import React from "react";
import Footer from "../../components/footer/Footer";
import { cta, footerData, nav, topbar } from "../main.mock";
import HeaderShell from "../../components/layout/HeaderShell";

export default function AboutUs() {
  const founders = [
    {
      name: "Douja Gharbi",
      title: "Cofounder & CPO",
      image: "https://seketak-eg.com/wp-content/uploads/2025/02/douja-gharbi.png",
    },
    {
      name: "Assem Kamel",
      title: "Cofounder & CEO Seketak",
      image: "https://seketak-eg.com/wp-content/uploads/2025/04/Group-40185.png",
    },
    {
      name: "Manal Hassoun",
      title: "Cofounder & CFRO",
      image: "https://seketak-eg.com/wp-content/uploads/2025/03/Manal-Hassoun-2.png",
    },
  ];

  return (
    <>
      <HeaderShell top={topbar} nav={nav} cta={cta} />

      <section className="bg-white text-gray-800 font-inter">
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 text-center py-20 px-6">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            About <span className="text-blue-600">Eventra</span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-gray-600">
            Empowering entrepreneurs, fostering innovation, and shaping sustainable futures
            across the Middle East, Africa, and beyond.
          </p>
        </div>

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

        <div className="max-w-6xl mx-auto px-6 py-12 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Who We Are</h2>
            <p className="text-gray-600 leading-relaxed">
              Seketak for Entrepreneurship Solutions is a trailblazing multinational company
              under <strong>Falak Startups Venture Capital Fund</strong>, the investment arm of 
              Egypt’s Ministry of International Cooperation and Ministry of Investment.
              <br /><br />
              With a legacy spanning over 20 years, we are at the forefront of empowering entrepreneurs,
              fostering sustainable development, and driving economic and social progress across the 
              Middle East, Africa, and beyond.
            </p>
          </div>
          <img src="https://seketak-eg.com/wp-content/uploads/2025/02/KH_03568.webp" alt="Mission" className="rounded-2xl shadow-md" />
        </div>

        <div className="max-w-6xl mx-auto px-6 py-12 grid md:grid-cols-2 gap-10 items-center">
          <img
            src="https://seketak-eg.com/wp-content/uploads/2025/03/image-613-1024x682.png"
            alt="Impact"
            className="rounded-2xl shadow-md order-2 md:order-1"
          />
          <div className="order-1 md:order-2">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Our Impact</h2>
            <p className="text-gray-600 leading-relaxed">
              Our work is rooted in innovation, inclusivity, and collaboration. We design and manage 
              programs that transform ideas into scalable ventures.
              <br /><br />
              With extensive experience supporting NGO and government sectors, we empower organizations
              through tailored training, strategic guidance, and technical expertise to strengthen 
              frameworks and foster sustainable development.
            </p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-12 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Our Values</h2>
            <p className="text-gray-600 leading-relaxed">
              We champion diversity and inclusion with over <strong>50% female representation</strong>
              on our board of directors. We believe entrepreneurship is a powerful tool for change — 
              unlocking opportunities, fostering innovation, and building a future where everyone can succeed.
            </p>
          </div>
          <img src="https://gits.seketak-eg.com/wp-content/uploads/2025/05/DSC_5316-1.png" alt="Diversity" className="rounded-2xl shadow-md" />
        </div>

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
