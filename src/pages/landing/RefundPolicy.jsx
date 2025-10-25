import React from "react";
import Footer from "../../components/footer/Footer";
import { footerData, nav, topbar, cta } from "../main.mock";
import HeaderShell from "../../components/layout/HeaderShell";

export default function RefundPolicy() {
  const sections = [
    {
      title: "1. Scope",
      content: [
        "This policy applies to all payments processed through the Eventra platform, including:",
        "• Event registration fees",
        "• Exhibitor and sponsorship packages",
        "• Booth reservations",
        "• Other paid services provided by event organizers through Eventra",
        "Please note: Eventra acts as a technology platform, not as the direct organizer of most events.",
        "Each event is managed by an independent organizer who defines their own refund conditions.",
      ],
    },
    {
      title: "2. Organizer Refund Policies",
      content: [
        "Each event hosted on Eventra may have its own refund or cancellation terms, visible on the event registration page.",
        "When you register for an event, you agree to the specific refund policy set by that event’s organizer.",
        "Organizers are solely responsible for approving, processing, and issuing refunds related to their events.",
      ],
    },
    {
      title: "3. Platform Fees",
      content: [
        "Service or transaction fees charged by Eventra (for payment processing, platform usage, etc.) are non-refundable, except in cases of proven technical error or duplicate payment.",
        "Refunds related to organizer policies do not include Eventra service fees, unless otherwise specified.",
      ],
    },
    {
      title: "4. Refund Eligibility",
      content: [
        "Refunds may be granted in the following cases:",
        "• The event is cancelled or postponed indefinitely by the organizer.",
        "• You were charged multiple times for the same transaction.",
        "• There was a verified technical issue preventing successful registration or participation.",
        "Refunds will not be granted for:",
        "• Change of personal plans or schedule conflicts",
        "• Dissatisfaction with the event experience",
        "• Partial attendance or no-show",
      ],
    },
    {
      title: "5. How to Request a Refund",
      content: [
        "If you wish to request a refund:",
        "• Review the refund policy of the event you registered for.",
        "• Contact the event organizer directly through the contact details on the event page.",
        "If your issue involves a technical or payment error, contact Eventra Support at:",
        "📧 eventora@seketak-eg.com",
        "Include the following details in your message:",
        "• Full name",
        "• Event name",
        "• Transaction reference or invoice number",
        "• Reason for the refund request",
      ],
    },
    {
      title: "6. Processing Time",
      content: [
        "Approved refunds are generally processed within 7–14 business days.",
        "Processing times may vary depending on the payment provider or bank policies.",
      ],
    },
    {
      title: "7. Non-Transferable Tickets",
      content: [
        "Tickets or registrations purchased on Eventra are non-transferable, unless explicitly stated by the organizer.",
        "Transferring or reselling entries may result in cancellation without refund.",
      ],
    },
    {
      title: "8. Force Majeure",
      content: [
        "In cases of unforeseen circumstances (such as natural disasters, strikes, political instability, or public health emergencies) that cause event cancellations or changes, refund decisions will be made by the event organizer in accordance with their own policies and applicable laws.",
      ],
    },
    {
      title: "9. Eventra’s Role",
      content: [
        "Eventra serves as a facilitator between event organizers and participants.",
        "We are not directly responsible for event delivery or refund decisions unless the event is organized by Eventra itself.",
      ],
    },
    {
      title: "10. Contact Us",
      content: [
        "If you have questions about this Refund Policy or need assistance with a transaction, please contact our support team at:",
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
            Refund <span className="text-blue-600">Policy</span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-gray-600">
            Last updated: October 2025
          </p>
          <p className="max-w-3xl mx-auto mt-4 text-gray-700 leading-relaxed">
            At Eventra, we strive to provide a transparent and reliable experience for all users — event organizers, exhibitors, and participants. This Refund Policy outlines how refunds are handled for payments made through our platform.
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
