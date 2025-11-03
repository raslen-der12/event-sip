import React, { useMemo, useRef, useState, useEffect } from "react";
import PropTypes from "prop-types";
import { FiChevronLeft, FiChevronRight, FiZap } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import imageLink from "../../../utils/imageLink";

const base = process.env.REACT_APP_API_URL || "https://api.eventra.cloud";

export default function FeaturesShowcase({ heading, subheading, features }) {
  const { t } = useTranslation();

  // Load fallback features from translation JSON if no features passed
  const fallbackFeatures = t("featuresFallback", { returnObjects: true }) || [
    {
      _id: "fx1",
      title: t("featuresFallback.0.title"),
      subtitle: t("featuresFallback.0.subtitle"),
      desc: t("featuresFallback.0.desc"),
      image: `${base}/uploads/images/admin/sans titre-50.png?q=80&w=1200`,
    },
    {
      _id: "fx2",
      title: t("featuresFallback.1.title"),
      subtitle: t("featuresFallback.1.subtitle"),
      desc: t("featuresFallback.1.desc"),
      image: `${base}/uploads/images/admin/sans titre-139.png?q=80&w=1600&auto=format&fit=crop`,
    },
    {
      _id: "fx3",
      title: t("featuresFallback.2.title"),
      subtitle: t("featuresFallback.2.subtitle"),
      desc: t("featuresFallback.2.desc"),
      image: `${base}/uploads/images/admin/sans titre-260.png?q=80&w=1600&auto=format&fit=crop`,
    },
  ];

  const items = useMemo(() => (features && features.length ? features : fallbackFeatures), [features, fallbackFeatures]);

  const trackRef = useRef(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const updateArrows = () => {
    const el = trackRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanLeft(scrollLeft > 4);
    setCanRight(scrollLeft + clientWidth < scrollWidth - 4);
  };

  useEffect(() => {
    updateArrows();
    const el = trackRef.current;
    if (!el) return;
    const onScroll = () => updateArrows();
    el.addEventListener("scroll", onScroll, { passive: true });
    const ro = new ResizeObserver(onScroll);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", onScroll);
      ro.disconnect();
    };
  }, []);

  const nudge = (dir) => {
    const el = trackRef.current;
    if (!el) return;
    const delta = Math.round(el.clientWidth * 0.9) * dir;
    el.scrollBy({ left: delta, behavior: "smooth" });
  };

  return (
    <section className="py-20 bg-[#F9FAFB] font-poppins relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-10">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-[#1C3664] flex items-center gap-2">
              <span className="text-[#EB5434]">
                <FiZap />
              </span>
              {heading || t("featuresHeading")}
            </h2>
            {(subheading || t("featuresSubheading")) && (
              <p className="text-gray-600 mt-2 text-base md:text-lg max-w-xl">
                {subheading || t("featuresSubheading")}
              </p>
            )}
          </div>

          {/* Arrows */}
          <div className="flex gap-3 mt-6 md:mt-0">
            <button
              onClick={() => nudge(-1)}
              disabled={!canLeft}
              className={`p-3 rounded-full border transition ${
                canLeft
                  ? "bg-white border-gray-300 hover:bg-[#EB5434] hover:text-white"
                  : "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              <FiChevronLeft size={20} />
            </button>
            <button
              onClick={() => nudge(1)}
              disabled={!canRight}
              className={`p-3 rounded-full border transition ${
                canRight
                  ? "bg-white border-gray-300 hover:bg-[#EB5434] hover:text-white"
                  : "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              <FiChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Cards Track */}
        <div
          ref={trackRef}
          className="flex overflow-x-auto gap-6 snap-x snap-mandatory pb-4 no-scrollbar md:grid md:grid-cols-3 md:gap-8 md:overflow-visible"
        >
          {items.map((f, i) => {
            const key = f._id || `${f.title}-${i}`;
            const bg = f.image;
            return (
              <article
                key={key}
                className="min-w-[85%] md:min-w-0 snap-start bg-white rounded-2xl shadow-sm overflow-hidden transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="relative h-48 md:h-56 overflow-hidden">
                  <img
                    src={imageLink(bg)}
                    alt={f.title}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                </div>

                <div className="p-6">
                  <h3 className="text-xl font-semibold text-[#1C3664] mb-1">{f.title}</h3>
                  {f.subtitle && <div className="text-[#EB5434] text-sm font-medium mb-2">{f.subtitle}</div>}
                  <p className="text-gray-600 text-sm leading-relaxed">{f.desc}</p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

FeaturesShowcase.propTypes = {
  heading: PropTypes.string,
  subheading: PropTypes.string,
  features: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string,
      title: PropTypes.string.isRequired,
      subtitle: PropTypes.string,
      desc: PropTypes.string.isRequired,
      image: PropTypes.string,
    })
  ),
};
