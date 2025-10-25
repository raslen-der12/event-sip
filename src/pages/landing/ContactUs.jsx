import React from "react";
import Footer from "../../components/footer/Footer";
import { footerData, nav, topbar, cta } from "../main.mock";
import HeaderShell from "../../components/layout/HeaderShell";

export default function ContactUs() {
  const teamMembers = [
    {
      country: "Egypt 🇪🇬",
      members: [
        { name: "Assem Kamel", email: "assem@seketak-eg.com", phone: "+20 11 1848 8222" },
        { name: "Abeer Khattab", email: "abeer@falakstartups.com", phone: "+20 10 6238 2383" },
      ],
    },
    {
      country: "Tunisia 🇹🇳",
      members: [
        { name: "Douja Gharbi", email: "douja.gharbi@redstart.tn", phone: "+216 20 311 223" },
      ],
    },
    {
      country: "Lebanon 🇱🇧",
      members: [
        { name: "Manal Hassoun", email: "manal@theleeexperience.com", phone: "+961 70 925 607" },
      ],
    },
    {
      country: "Côte d'Ivoire 🇨🇮",
      members: [
        { name: "Maha Drira Kamoun", email: "mdk@keyabidjan.com", phone: "+225 07 786 718 16" },
      ],
    },
  ];

  const socials = [
    { name: "Facebook", url: "https://www.facebook.com/seketaksolutions/" },
    { name: "LinkedIn", url: "https://eg.linkedin.com/company/seketak-solutions" },
    { name: "Instagram", url: "https://www.instagram.com/seketak_solutions/" },
    { name: "Youtube", url: "https://www.youtube.com/@Seketak" },
  ];

  return (
    <>
      <HeaderShell top={topbar} nav={nav} cta={cta} />

      <section className="bg-white text-gray-800 font-inter">
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 text-center py-20 px-6">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Contact <span className="text-blue-600">Eventra</span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-gray-600">
            Connect with us to explore opportunities, ask questions, or join the Eventra journey. Our team is ready to assist you and make your experience seamless.
          </p>
        </div>

        <div className="max-w-6xl mx-auto py-16 px-6">
          <h2 className="text-3xl font-semibold mb-10 text-gray-900 text-center">Our Team</h2>

          {teamMembers.map((group, idx) => (
            <div key={idx} className="mb-12">
              <h3 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2">
                {group.country}
              </h3>
              <div className="flex flex-wrap gap-6">
                {group.members.map((member, i) => (
                  <div
                    key={i}
                    className="flex-1 min-w-[220px] bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition"
                  >
                    <h4 className="text-lg font-semibold mb-1">{member.name}</h4>
                    <p className="text-gray-600 text-sm">
                      📧 <a href={`mailto:${member.email}`} className="text-blue-600 hover:underline">{member.email}</a>
                      <br />
                      📞 {member.phone}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="max-w-6xl mx-auto px-6 py-12 text-center">
          <h2 className="text-2xl font-bold mb-4 text-gray-900">Visit Us</h2>
          <p className="text-gray-600 mb-6">
            Greek Campus 28 – Al Falaki Street, Downtown – Abdeen District, Cairo, Egypt
          </p>

          <h2 className="text-2xl font-bold mb-4 text-gray-900">Follow Us</h2>
          <div className="flex justify-center flex-wrap gap-6 mb-6">
            {socials.map((s, i) => (
              <a
                key={i}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 font-semibold hover:underline"
              >
                {s.name}
              </a>
            ))}
          </div>

          <h2 className="text-2xl font-bold mb-4 text-gray-900">Need Help?</h2>
          <p className="text-gray-600">
            If you have questions about events, registration, or the platform, our support team is just an email away:
            <br />
            📧 <a href="mailto:eventora@seketak-eg.com" className="text-blue-600 hover:underline">eventora@seketak-eg.com</a>
          </p>
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
