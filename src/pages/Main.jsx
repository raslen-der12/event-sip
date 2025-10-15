// src/pages/Main.jsx
import React, { useRef, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import "bootstrap/dist/css/bootstrap.min.css";
import "../styles/tokens.css";
import "../styles/global.css";
import "./main.css";

import { useGetProfileQuery } from "../features/Actor/toolsApiSlice";
import { useGetEventsQuery } from "../features/events/eventsApiSlice";

import HeaderShell from "../components/layout/HeaderShell";
import HeroB2B from "../components/hero/HeroV2";
import B2BStatsShowcase from "../components/MainStats/B2BStatsShowcase";
import ExhibitorsShowcase from "../components/showcase/ExhibitorsShowcase";
import PlatformPillars from "../components/showcase/PlatformPillars";
import EventsListSection from "../components/events/EventsListSection";
import SdgScroller from "../components/sdg/SdgScroller";
import ContactUs from "../components/ContactUs";
import Footer from "../components/footer/Footer";
import Modal from "../components/Modal/Modal";

import {
  topbar,
  nav,
  cta,
  heroV2,
  eventsList,
  sdgCarousel,
  footerData,
} from "./main.mock";

import useAuth from "../lib/hooks/useAuth";

export default function Main() {
  const { role, status, ActorId } = useAuth();
  useGetProfileQuery({ id: ActorId, role }, { skip: !ActorId || status === "Guest" });
  const { data: events } = useGetEventsQuery();

  const { search } = useLocation();
  const navigate = useNavigate();

  // verification popup
  const query = new URLSearchParams(search);
  const verification = query.get("verification");
  const [open, setOpen] = useState(Boolean(verification));
  const handleClose = () => setOpen(false);

  const base = process.env.REACT_APP_API_URL || "https://api.eventra.cloud";

  /** ─────────────────────────────────────────────────────────────
   *  Search → resolve → navigate (no loops, no heavy effects)
   *  - Tries backend /api/search/resolve?q=... (GET)
   *  - Fallback: quick client-side guesses
   *  - Guards against re-entrancy & duplicate navigations
   *  ────────────────────────────────────────────────────────────*/
  const inflightRef = useRef(false);
  const lastHrefRef = useRef("");
  const [searchBusy, setSearchBusy] = useState(false);

  const clientSideFallback = (qRaw) => {
    const q = String(qRaw || "").trim().toLowerCase();

    // direct, known destinations
    if (q === "buyers") return "/buyers";
    if (q === "suppliers" || q === "exhibitors") return "/exhibitors";
    if (q === "meetings" || q === "b2b") return "/meetings";
    if (q === "events" || q === "conference" || q === "agenda") return "/events";

    // tag-like guesses (keep this tiny & safe)
    const TAG_MAP = {
      ai: "/tags/ai",
      fintech: "/tags/fintech",
      logistics: "/tags/logistics",
      cleantech: "/tags/cleantech",
    };
    if (TAG_MAP[q]) return TAG_MAP[q];

    // last resort: a global search route you already have
    return `/search?q=${encodeURIComponent(qRaw || "")}`;
  };

  const safeNavigate = useCallback(
    (href) => {
      if (!href) return;
      const current = window.location.pathname + window.location.search;
      if (href === current || href === lastHrefRef.current) return;
      lastHrefRef.current = href;
      navigate(href);
    },
    [navigate]
  );

  const resolveAndGo = useCallback(
    async (q) => {
      const query = String(q || "").trim();
      if (!query || inflightRef.current) return;

      inflightRef.current = true;
      setSearchBusy(true);
      try {
        // try backend resolver if available
        const api = process.env.REACT_APP_API_URL || "";
        const url = `${api}/api/search/resolve?q=${encodeURIComponent(query)}`;
        let href = "";

        try {
          const resp = await fetch(url, { credentials: "include" });
          if (resp.ok) {
            const data = await resp.json().catch(() => ({}));
            href = data?.href || "";
          }
        } catch {
          // network error → just fall back
        }

        if (!href) href = clientSideFallback(query);
        safeNavigate(href);
      } finally {
        setSearchBusy(false);
        inflightRef.current = false;
      }
    },
    [safeNavigate]
  );

  const onSearch = useCallback((q) => resolveAndGo(q), [resolveAndGo]);
  const onTagClick = useCallback((t) => { if (t) resolveAndGo(t); }, [resolveAndGo]);

  return (
    <>
      {/* verification popup */}
      {verification === "true" && (
        <Modal
          open={open}
          title="Email Verification"
          text="Your email has been successfully verified."
          onClose={handleClose}
          size="sm"
        />
      )}
      {verification === "false" && (
        <Modal
          open={open}
          title="Your registration is almost complete"
          text="Verify your email address to continue."
          onClose={handleClose}
          size="sm"
        />
      )}

      <HeaderShell top={topbar} nav={nav} cta={cta} />

      {/* HeroB2B: keep your existing props, add handlers that resolve & navigate */}
      <HeroB2B
        {...heroV2}
        onSearch={onSearch}
        onTagClick={onTagClick}
        /* You can also pass a short list of 4 live tags via heroV2 if you want to control them:
           tags={['AI','FinTech','Logistics','CleanTech']}
        */
      />

      <B2BStatsShowcase />
      <ExhibitorsShowcase />
      <PlatformPillars />

      <EventsListSection
        heading={eventsList.heading}
        subheading={eventsList.subheading}
        events={events}
      />

      <SdgScroller
        heading={sdgCarousel.heading}
        subheading={sdgCarousel.subheading}
        goals={sdgCarousel.goals}
      />

      <ContactUs
        image={`${base}/uploads/images/admin/contactFrame.png`}
        title="Feature Your Brand at GITS 2025"
        text="Maximize your visibility with our premium ad space. Perfect for industry leaders looking to make a bold impact."
        ctaText="Contact Us"
        ctaHref="/contact"
      />

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
