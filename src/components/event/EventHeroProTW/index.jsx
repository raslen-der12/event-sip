// HeroEvent.jsx
import React, { useMemo } from "react";
import { motion } from "framer-motion";

/**
 * Props:
 *  - event: { _id, title, description, startDate, endDate, venueName, city, country, capacity, seatsTaken, target }
 *  - onRegisterHref?: string
 *  - backgroundImage?: string
 *  - highlights?: string[]
 */
export default function HeroEvent({
  event = {},
  onRegisterHref,
  backgroundImage = "/assets/ipdays-hero.jpg",
  highlights,
}) {
  const {
    _id: id,
    title = "L’international",
    description = "Les InnoPreneurs Days – IPDAYS 2025",
    startDate,
    endDate,
    venueName,
    city,
    country,
    capacity,
    seatsTaken,
    target,
  } = event || {};

  // Date formatting (FR locale)
  const dateFmt = useMemo(() => {
    try {
      const s = startDate ? new Date(startDate) : null;
      const e = endDate ? new Date(endDate) : null;
      if (!s && !e) return "";
      const fmt = (d, opts) => new Intl.DateTimeFormat("fr-FR", opts).format(d);
      if (s && e) {
        const sameYear = s.getFullYear() === e.getFullYear();
        const sameMonth = sameYear && s.getMonth() === e.getMonth();
        return sameMonth
          ? `${fmt(s, { day: "numeric", month: "short" })} – ${fmt(e, {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}`
          : `${fmt(s, {
              day: "numeric",
              month: "short",
              year: "numeric",
            })} – ${fmt(e, {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}`;
      }
      return fmt(s || e, { day: "numeric", month: "short", year: "numeric" });
    } catch {
      return "";
    }
  }, [startDate, endDate]);

  const where = [venueName, city, country].filter(Boolean).join(" · ");
  const regHref = onRegisterHref || (id ? `/register?eventId=${id}` : "/register");

  const filled =
    typeof capacity === "number" && typeof seatsTaken === "number"
      ? Math.min(100, Math.max(0, Math.round((seatsTaken / Math.max(1, capacity)) * 100)))
      : null;

  const marquee = highlights?.length
    ? highlights
    : ["Formation", "MasterClass", "EXPO", "Networking & B2B"];

  return (
    <section
      className="relative text-white backdropFilter"
      style={{
        backgroundImage: `url(http://api.eventra.cloud/uploads/images/admin/ipdayscover.png)`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
      aria-label="Event hero"
    >
      {/* dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/60" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-16 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* LEFT: text block */}
          <div className="lg:col-span-7 space-y-6">
            {/* tag row */}
            <div className="flex flex-wrap gap-3 items-center text-sm text-gray-200">
              {target && <span className="px-3 py-1 rounded-full bg-[#EB5434]/10 text-[#EB5434] font-medium">{target}</span>}
              {dateFmt ? <span className="px-3 py-1 rounded-full bg-white/6">{dateFmt}</span> : null}
            </div>

            {/* title + description */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight tracking-tight">
              {title}
            </h1>

            <p className="text-base sm:text-lg text-gray-200 max-w-2xl">
              {description}
            </p>

            {/* DATE + VENUE (explicit) */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-6 gap-3 mt-3 text-gray-200">
              {dateFmt && (
                <div className="flex items-center gap-2 text-sm sm:text-base">
                  <IconCalendar />
                  <span>{dateFmt}</span>
                </div>
              )}

              {where && (
                <div className="flex items-center gap-2 text-sm sm:text-base">
                  <IconMapPin />
                  <span className="truncate">{where}</span>
                </div>
              )}
            </div>

            {/* minimal CTA under description */}
            <div className="mt-4">
              <a
                href={regHref}
                className="inline-block bg-[#EB5434] hover:bg-[#cf4426] text-white font-semibold px-5 py-3 rounded-full shadow-md transition transform hover:-translate-y-0.5"
                aria-label="Register for event"
              >
                Je m’inscris
              </a>
            </div>

            {/* capacity & marquee */}
            {typeof filled === "number" && (
              <div className="mt-6 max-w-md">
                <div className="bg-white/10 rounded-full h-2 w-full overflow-hidden">
                  <div className="h-2 rounded-full bg-[#1C3664]" style={{ width: `${filled}%` }} />
                </div>
                <div className="flex justify-between text-sm text-gray-300 mt-1">
                  <span>Capacity</span>
                  <span>{seatsTaken ?? 0} / {capacity}</span>
                </div>
              </div>
            )}

            {marquee?.length && (
              <div className="mt-8">
                <div className="flex gap-3 overflow-x-auto no-scrollbar py-2">
                  {marquee.map((t, i) => (
                    <span key={i} className="inline-block px-3 py-1 rounded-full bg-white/6 text-xs text-gray-200">{t}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: animated CTA card — stacks BELOW on small screens */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            viewport={{ once: true }}
            className="lg:col-span-5"
          >
            <div className="w-full max-w-md mx-auto lg:mr-0 bg-white/6 backdrop-blur-sm border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl">
              <h3 className="text-xl font-semibold text-white mb-2 text-center">
                Rejoignez l’aventure IPDAYS × GITS
              </h3>
              <p className="text-sm text-gray-200 text-center mb-4">
                Réservez votre place pour vivre l’expérience entrepreneuriale la plus inspirante de 2025.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <motion.a
                  href={regHref}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 text-center px-5 py-3 rounded-full bg-[#EB5434] text-white font-semibold shadow-md"
                >
                  Je m’inscris maintenant
                </motion.a>

                <a
                  href={id ? `/event/${id}#schedule` : "#schedule"}
                  className="flex-1 text-center px-5 py-3 rounded-full bg-white/10 text-white border border-white/20"
                >
                  Voir le programme
                </a>
              </div>

              {/* small extras row */}
              <div className="mt-4 flex items-center justify-between text-xs text-gray-300">
                <button
                  type="button"
                  onClick={() => {
                    // download ICS: keep simple — you can reuse your previous function if needed
                    const a = document.createElement("a");
                    a.href = regHref;
                    a.click();
                  }}
                  className="px-2 py-1 rounded-md bg-white/5"
                >
                  Ajouter au calendrier
                </button>

                <div className="text-right">
                  {typeof filled === "number" ? <span>{filled}% réservés</span> : <span>Places limitées</span>}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ====== Simple icons (inline SVGs) ====== */
function IconMapPin({ className = "w-5 h-5 text-[#EB5434]" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5Z" />
    </svg>
  );
}

function IconCalendar({ className = "w-5 h-5 text-[#1C3664]" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2Zm0 16H5V9h14v11Zm0-13H5V6h14v1Z" />
    </svg>
  );
}
