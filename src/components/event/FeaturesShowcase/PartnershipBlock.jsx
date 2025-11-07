// src/components/PartnershipBlock.jsx
import React from "react";
import PropTypes from "prop-types";
import { motion } from "framer-motion";
import { FiZap } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import "./features-showcase.css"; // reuses .fsx-title / .fsx-icon styles

/**
 * PartnershipBlock
 *
 * Uses i18next (defaultNS: "common") to load partnership copy.
 * Passing props (heading, strap, paragraphs, ...) will override translations.
 *
 * Usage:
 *  <PartnershipBlock imageSrc={imageLink(`${base}/uploads/default/IPDAYXGITS.png`)} />
 */
export default function PartnershipBlock({
  heading, // optional override
  strap,
  paragraphs,
  ctaLabel,
  ctaHref,
  imageSrc,
  imageAlt,
  imageCaption,
  reverse = false,
}) {
  const { t } = useTranslation(); // defaultNS = "common" in your i18n config

  // Prefer prop when provided, otherwise fall back to translations.
  const headingText =
    heading ?? t("partnership.heading", "Partenariat Stratégique IPDAYS × GITS 2025");
  const strapText =
    strap ?? t("partnership.strap", "Quand l’impact local rencontre la portée mondiale");
  const paragraphsData =
    paragraphs ??
    t("partnership.paragraphs", {
      returnObjects: true,
      defaultValue: [
        "L’édition 2025 marque une alliance inédite entre IPDAYS et GITS 2025 (Global Investment & Trading Summit).",
        "Ensemble, nous créons un pont unique entre l’innovation régionale et les opportunités internationales.",
      ],
    });
  const ctaLabelText = ctaLabel ?? t("partnership.ctaLabel", "Je m’inscris");
  const ctaHrefText = ctaHref ?? t("partnership.ctaHref", "/register");
  const imageAltText = imageAlt ?? t("partnership.imageAlt", "A Simplified Event Management Experience");
  const imageCaptionText = imageCaption ?? t("partnership.imageCaption", "A Simplified Event Management Experience");

return (
  <section className="py-20 bg-[#F9FAFB] text-gray-800 overflow-hidden">
    <div className="container mx-auto px-4 md:px-8">
      <div
        className={`flex flex-col md:flex-row items-center gap-14 ${
          reverse ? "md:flex-row-reverse" : ""
        }`}
      >
        {/* LEFT: Text Section */}
        <motion.div
          initial={{ opacity: 0, x: reverse ? 80 : -80 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          viewport={{ once: true }}
          className="flex-1"
        >
          {/* Title */}
          <div className="mb-6">
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#0f172a] leading-tight tracking-tight">
              <span className="block text-[#0077b6]">
                Partenariat Stratégique
              </span>
              <span className="block text-[#1e293b] mt-2 whitespace-nowrap">
                IPDAYS <span className="text-[#0077b6]">×</span> GITS 2025
              </span>
            </h2>
          </div>

          {/* Strapline */}
          {strapText && (
            <p className="text-lg md:text-xl text-[#374151] mb-6 font-medium">
              {strapText}
            </p>
          )}

          {/* Body paragraphs */}
          <div className="space-y-3 text-gray-600 leading-relaxed">
            {Array.isArray(paragraphsData)
              ? paragraphsData.map((p, i) => <p key={i}>{p}</p>)
              : <p>{paragraphsData}</p>
            }
          </div>

          {/* CTA */}
          {ctaHrefText && ctaLabelText && (
            <div className="mt-8">
              <a
                href={ctaHrefText}
                className="inline-block bg-[#0077b6] hover:bg-[#005f8a] text-white font-semibold py-3 px-8 rounded-2xl shadow-lg transition-transform hover:-translate-y-1"
              >
                {ctaLabelText}
              </a>
            </div>
          )}
        </motion.div>

        {/* RIGHT: Image Section */}
        <motion.div
          initial={{ opacity: 0, x: reverse ? -80 : 80 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          viewport={{ once: true }}
          className="flex-1 relative"
        >
          <div className="rounded-2xl overflow-hidden shadow-xl">
            <img
              src={imageSrc}
              alt={imageAltText}
              loading="lazy"
              className="w-full h-auto object-cover"
            />
          </div>
          {imageCaptionText && (
            <p className="text-sm text-gray-500 mt-3 italic text-center">
              {imageCaptionText}
            </p>
          )}
        </motion.div>
      </div>
    </div>
  </section>
);

}

PartnershipBlock.propTypes = {
  heading: PropTypes.string,
  strap: PropTypes.string,
  paragraphs: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.string),
    PropTypes.string
  ]),
  ctaLabel: PropTypes.string,
  ctaHref: PropTypes.string,
  imageSrc: PropTypes.string.isRequired,
  imageAlt: PropTypes.string,
  imageCaption: PropTypes.string,
  reverse: PropTypes.bool,
};
