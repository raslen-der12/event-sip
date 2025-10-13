import React from "react";
import PropTypes from "prop-types";
import { FiZap } from "react-icons/fi";
import { motion } from "framer-motion";
import "./features-showcase.css"; // reuse .fsx-title / .fsx-icon

export default function PartnershipBlock({
  heading = "Partenariat Stratégique IPDAYS × GITS",
  strap = "Quand l’impact local rencontre la portée mondiale",
  paragraphs = [
    "L’édition 2025 marque une alliance inédite entre IPDAYS et GITS (Global Investment & Trading Summit).",
    "Ensemble, nous créons un pont unique entre l’innovation régionale et les opportunités internationales."
  ],
  ctaLabel = "Je m’inscris",
  ctaHref = "/register",
  imageSrc,
  imageAlt = "A Simplified Event Management Experience",
  imageCaption = "A Simplified Event Management Experience",
  reverse = false,
}) {
  return (
    <section className="py-16 bg-[#F9FAFB] text-gray-800">
      <div className="container mx-auto px-4 md:px-8">
        <div
          className={`flex flex-col md:flex-row items-center gap-10 ${
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
            <h2 className="fsx-title text-2xl md:text-3xl font-semibold mb-4 flex items-center gap-2">
              {heading}
            </h2>
            {strap && (
              <p className="text-lg md:text-xl text-[#374151] mb-6 font-medium">
                {strap}
              </p>
            )}
            <div className="space-y-3 text-gray-600 leading-relaxed">
              {paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>

            {ctaHref && ctaLabel && (
              <div className="mt-8">
                <a
                  href={ctaHref}
                  className="inline-block bg-[#0077b6] hover:bg-[#005f8a] text-white font-semibold py-3 px-6 rounded-2xl shadow-md transition-all"
                >
                  {ctaLabel}
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
        <div className="rounded-2xl overflow-hidden">
          <img
            src={imageSrc}
            alt={imageAlt}
            loading="lazy"
            className="w-full h-auto object-cover"
          />
        </div>
  {imageCaption && (
    <p className="text-sm text-gray-500 mt-3 italic text-center">
      {imageCaption}
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
  paragraphs: PropTypes.arrayOf(PropTypes.string),
  ctaLabel: PropTypes.string,
  ctaHref: PropTypes.string,
  imageSrc: PropTypes.string.isRequired,
  imageAlt: PropTypes.string,
  imageCaption: PropTypes.string,
  reverse: PropTypes.bool,
};
