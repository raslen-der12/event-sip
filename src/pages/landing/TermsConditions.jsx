import React from "react";
import Footer from "../../components/footer/Footer";
import { footerData, nav, topbar, cta } from "../main.mock";
import HeaderShell from "../../components/layout/HeaderShell";

export default function TermsConditions() {
  const sections = [
    {
      title: "1. Definitions",
      content: [
        "Platform: Refers to the Eventra website, applications, and services used for event management, registration, networking, and B2B connections.",
        "User: Any individual or organization using Eventra, including attendees, exhibitors, organizers, partners, and visitors.",
        "Organizer: A company or individual creating, managing, or hosting events through Eventra.",
        "Content: Any text, images, videos, data, or materials uploaded or shared on the Platform.",
      ],
    },
    {
      title: "2. Use of the Platform",
      content: [
        "You must be at least 18 years old to use Eventra.",
        "You agree to use the Platform only for lawful purposes and in accordance with these Terms.",
        "You are responsible for maintaining the confidentiality of your account and password and for all activities under your account.",
        "Eventra reserves the right to suspend or terminate accounts that violate our policies or applicable laws.",
      ],
    },
    {
      title: "3. User Accounts",
      content: [
        "To access certain features, you may need to create an account with accurate, up-to-date information.",
        "You agree not to impersonate others or create false identities.",
        "You may request deletion of your account at any time by contacting our support team.",
      ],
    },
    {
      title: "4. Event Registration and Participation",
      content: [
        "Eventra provides tools for users to register for, organize, or participate in events.",
        "Each event’s conditions, fees, and cancellation policies are determined by the respective Organizer.",
        "Eventra acts as a facilitator and is not responsible for the accuracy, safety, or content of individual events hosted by third parties.",
      ],
    },
    {
      title: "5. Payments and Refunds",
      content: [
        "Payments for event participation or exhibitor packages are processed securely through our payment partners.",
        "Refunds are handled according to each event’s refund policy as defined by its Organizer, or according to Eventra’s general Refund Policy available on our website.",
        "Eventra does not store your payment information.",
      ],
    },
    {
      title: "6. Content Ownership",
      content: [
        "Users retain ownership of the content they share on the Platform.",
        "By uploading content, you grant Eventra a non-exclusive, worldwide, royalty-free license to display, distribute, and promote that content within the Platform and its events.",
        "You must ensure you have all rights and permissions to share any content you upload.",
      ],
    },
    {
      title: "7. Intellectual Property",
      content: [
        "All Eventra trademarks, designs, logos, software, and platform content are the property of Eventra or its licensors.",
        "You may not copy, reproduce, or use our intellectual property without written consent.",
      ],
    },
    {
      title: "8. Third-Party Links and Services",
      content: [
        "Eventra may contain links to third-party websites or services.",
        "We are not responsible for the content, privacy practices, or reliability of these external sites.",
      ],
    },
    {
      title: "9. Limitation of Liability",
      content: [
        "Eventra provides the Platform “as is” without warranties of any kind.",
        "We are not liable for indirect, incidental, or consequential damages arising from your use of the Platform or participation in events.",
        "While we strive to ensure reliability, we do not guarantee uninterrupted or error-free operation.",
      ],
    },
    {
      title: "10. Data Protection and Privacy",
      content: [
        "Your privacy matters to us.",
        "Please review our Privacy Policy to understand how we collect, use, and protect your personal data in compliance with applicable regulations.",
      ],
    },
    {
      title: "11. Termination",
      content: [
        "Eventra may suspend or terminate your account at any time if you violate these Terms or misuse the Platform.",
        "You may also discontinue your use of the Platform at any time.",
      ],
    },
    {
      title: "12. Changes to These Terms",
      content: [
        "Eventra may update these Terms periodically.",
        "The latest version will always be available on our website, and continued use of the Platform means you accept any updated terms.",
      ],
    },
    {
      title: "13. Governing Law",
      content: [
        "These Terms are governed by and interpreted in accordance with the laws of the Republic of Tunisia, without regard to its conflict of law principles.",
      ],
    },
    {
      title: "14. Contact Us",
      content: [
        "If you have any questions or concerns about these Terms and Conditions, please contact us at:",
        "📧 eventora@seketak-eg.com",
        "🌐 www.eventra.cloud",
      ],
    },
  ];

  return (
    <>
      <HeaderShell top={topbar} nav={nav} cta={cta} />

      <section className="bg-white text-gray-800 font-inter">
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 text-center py-20 px-6">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Terms & <span className="text-blue-600">Conditions</span>
          </h1>
          <p className="max-w-3xl mx-auto mt-4 text-gray-700 leading-relaxed">
            Last updated: October 2025 <br />
            Welcome to Eventra — the smart event and B2B management platform. By accessing or using Eventra (“the Platform”), you agree to comply with and be bound by these Terms and Conditions. If you do not agree with these terms, please do not use our services.
          </p>
        </div>

        <div className="max-w-5xl mx-auto px-6 py-16 space-y-12">
          {sections.map((section, idx) => (
            <div key={idx}>
              <h2 className="text-2xl font-bold mb-4 text-gray-900">{section.title}</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700 leading-relaxed">
                {section.content.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            </div>
          ))}
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
