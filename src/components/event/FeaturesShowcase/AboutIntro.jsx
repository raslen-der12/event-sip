import React from "react";
import PropTypes from "prop-types";
import { FiZap } from "react-icons/fi";

export default function AboutIntro({
  heading,
  contentHtml,
  chips = [],
  ctaLabel,
  ctaHref,
  imageSrc = "/assets/images/about.jpg", // ✅ add default image path
  className = "",
}) {
  return (
    <section
      className={`w-full bg-[#f9f9f9] py-16 px-6 lg:px-16 font-['Poppins'] ${className}`}
    >
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-10 items-center">
        {/* LEFT SIDE - TEXT */}
        <div className="lg:col-span-2">
          <header className="flex items-center mb-6">
            <span className="text-[#EB5434] text-3xl mr-3">
              <FiZap />
            </span>
            <h2 className="text-2xl md:text-4xl font-semibold text-[#1C3664]">
              {heading}
            </h2>
          </header>

          {contentHtml && (
            <div
              className="text-gray-700 leading-relaxed mb-6 text-base md:text-lg"
              dangerouslySetInnerHTML={{ __html: contentHtml }}
            />
          )}

          {chips.length > 0 && (
            <ul className="space-y-2 mb-8">
              {chips.map((t, i) => (
                <li
                  key={i}
                  className="flex items-center text-gray-600 text-sm md:text-base"
                >
                  <span className="w-2 h-2 rounded-full bg-[#EB5434] mr-2"></span>
                  <span dangerouslySetInnerHTML={{ __html: t }} />
                </li>
              ))}
            </ul>
          )}

          {ctaHref && ctaLabel && (
            <div>
              <a
                href={ctaHref}
                className="inline-block px-8 py-3 text-lg font-semibold rounded-lg text-white 
                bg-gradient-to-r from-[#EB5434] to-[#FF7B5E] shadow-md transition-all duration-300 
                hover:shadow-lg hover:-translate-y-1 hover:brightness-110"
              >
                {ctaLabel}
              </a>
            </div>
          )}
        </div>

        {/* RIGHT SIDE - IMAGE */}
        <div className="lg:col-span-1">
          <div className="relative overflow-hidden rounded-2xl ">
            <img
              src={imageSrc}
              alt="About section illustration"
              className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
            />
            <div className="absolute inset-0  rounded-2xl"></div>
          </div>
        </div>
      </div>
    </section>
  );
}

AboutIntro.propTypes = {
  heading: PropTypes.string.isRequired,
  contentHtml: PropTypes.string,
  chips: PropTypes.arrayOf(PropTypes.string),
  ctaLabel: PropTypes.string,
  ctaHref: PropTypes.string,
  imageSrc: PropTypes.string,
  className: PropTypes.string,
};
