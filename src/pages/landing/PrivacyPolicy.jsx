import React from "react";
import Footer from "../../components/footer/Footer";
import { footerData, nav, topbar, cta } from "../main.mock";
import HeaderShell from "../../components/layout/HeaderShell";

export default function PrivacyPolicy() {
  const sections = [
    {
      title: "1. Information We Collect",
      content: [
        "We collect information to provide, improve, and personalize your experience on Eventra.",
        "1.1. Information You Provide",
        "When you use the Platform, you may provide:",
        "• Account information: name, email address, phone number, company name, and job title.",
        "• Profile details: photo, biography, professional links, and social media accounts.",
        "• Payment data: billing information when you pay for events, booths, or services (handled securely by third-party providers).",
        "• Event data: registration details, preferences, and networking interests.",
        "• Communications: messages, inquiries, and feedback you send to us or to event organizers.",
        "1.2. Information Collected Automatically",
        "When you access Eventra, we may collect:",
        "• Usage data: pages visited, actions taken, session duration, and device identifiers.",
        "• Technical data: IP address, browser type, operating system, and access timestamps.",
        "• Cookies and analytics: to improve user experience and platform performance.",
      ],
    },
    {
      title: "2. How We Use Your Information",
      content: [
        "We use your data to:",
        "• Provide and manage our event and networking services.",
        "• Process registrations, payments, and participation details.",
        "• Enable communication between attendees, exhibitors, and organizers.",
        "• Send updates, confirmations, and event notifications.",
        "• Personalize your experience and suggest relevant events or connections.",
        "• Ensure platform security and prevent fraud.",
        "• Comply with legal obligations.",
      ],
    },
    {
      title: "3. Data Sharing",
      content: [
        "We do not sell your personal information.",
        "We may share your data only with:",
        "• Event Organizers: when you register or participate in their events.",
        "• Service Providers: payment gateways, analytics tools, and hosting partners that help us operate the Platform.",
        "• Legal Authorities: when required by law, regulation, or court order.",
        "All partners are required to handle your data securely and use it only for the purpose of providing services through Eventra.",
      ],
    },
    {
      title: "4. Cookies and Tracking",
      content: [
        "Eventra uses cookies and similar technologies to:",
        "• Keep you signed in",
        "• Remember preferences",
        "• Analyze platform traffic and performance",
        "You can control or disable cookies through your browser settings, but some features may not work properly if cookies are disabled.",
      ],
    },
    {
      title: "5. Data Retention",
      content: [
        "We keep your personal information only as long as necessary to:",
        "• Provide our services",
        "• Comply with legal obligations",
        "• Resolve disputes or enforce our agreements",
        "After this period, data is securely deleted or anonymized.",
      ],
    },
    {
      title: "6. Data Security",
      content: [
        "We use industry-standard measures to protect your data, including:",
        "• Encrypted data transfer (SSL/TLS)",
        "• Secure servers and firewalls",
        "• Restricted employee access to personal data",
        "While we take every precaution, no system is 100% secure. You share information at your own risk.",
      ],
    },
    {
      title: "7. Your Rights",
      content: [
        "Depending on your location and applicable laws, you may have the right to:",
        "• Access the personal data we hold about you",
        "• Request correction or deletion of your information",
        "• Object to or restrict data processing",
        "• Withdraw consent (where applicable)",
        "• Request a copy of your data (data portability)",
        "To exercise these rights, contact us at privacy@eventra.co.",
      ],
    },
    {
      title: "8. Third-Party Services",
      content: [
        "Eventra may link to or integrate with third-party tools (e.g., payment gateways, video platforms, social media).",
        "We are not responsible for the privacy practices of these external services — please review their respective policies.",
      ],
    },
    {
      title: "9. International Data Transfers",
      content: [
        "If your data is transferred outside your country (e.g., to hosting or payment partners), we ensure adequate protection through standard contractual clauses or equivalent safeguards.",
      ],
    },
    {
      title: "10. Children’s Privacy",
      content: [
        "Eventra is not intended for children under 16.",
        "We do not knowingly collect data from minors. If you believe a child has provided us information, please contact us to delete it immediately.",
      ],
    },
    {
      title: "11. Updates to This Policy",
      content: [
        "We may update this Privacy Policy from time to time.",
        "The latest version will always be available on our website.",
        "Significant changes will be communicated via email or in-app notification.",
      ],
    },
    {
      title: "12. Contact Us",
      content: [
        "If you have any questions or requests regarding your personal data or this Privacy Policy, please contact us at:",
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
            Privacy <span className="text-blue-600">Policy</span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-gray-600">
            Last updated: October 2025
          </p>
        </div>

        <div className="max-w-5xl mx-auto px-6 py-16 space-y-12">
          <p className="text-gray-700 leading-relaxed">
            Welcome to Eventra (“we”, “our”, or “us”). Your privacy matters to us. This Privacy Policy explains how we collect, use, store, and protect your personal information when you use our website, applications, or services (collectively, the “Platform”). By using Eventra, you agree to this Policy. If you do not agree, please do not use our services.
          </p>

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
