import React , {useState} from "react";
import { useLocation,useNavigate } from "react-router-dom";

import "bootstrap/dist/css/bootstrap.min.css";
import "../styles/tokens.css";
import "../styles/global.css";
import "./main.css";
import {useGetProfileQuery} from "../features/Actor/toolsApiSlice";
import { useGetEventsQuery } from "../features/events/eventsApiSlice";
import HeaderShell from "../components/layout/HeaderShell";
import HeroV2 from "../components/hero/HeroV2";
import Overview from "../components/overview/Overview";
import { topbar, nav, cta } from "./main.mock";
import { heroV2, overview } from "./main.mock";

import ProgramLanes from "../components/lanes/ProgramLanes";
import { programLanes } from "./main.mock";

import PartnersSimple from "../components/partners/PartnersSimple";
import { partners } from "./main.mock";

import EventsListSection from "../components/events/EventsListSection";
import { eventsList } from "./main.mock";

import SdgScroller from "../components/sdg/SdgScroller";
import { sdgCarousel } from "./main.mock";

import GallerySection from "../components/gallery/GallerySection";
import { lastEventGallery } from "./main.mock";

import B2BStatsShowcase from "../components/MainStats/B2BStatsShowcase";

import SpeakersSection from "../components/speakers/SpeakersSection";
import { speakers } from "./main.mock";

import Footer from "../components/footer/Footer";
import { footerData } from "./main.mock";

import { audienceTags } from "./main.mock";
import TargetAudience from "../components/TargetAudience/";

import ContactUs from "../components/ContactUs";

import RegisterCta from "../components/RegisterCta";

import Modal from "../components/Modal/Modal";

import useAuth from "../lib/hooks/useAuth";
import ExhibitorsShowcase from "../components/showcase/ExhibitorsShowcase";
import PlatformPillars from "../components/showcase/PlatformPillars";
import B2BOutcomesShowcase from "../components/showcase/B2BOutcomesShowcase";
import MarketplaceComp from "./marketplace/MarketplaceComp";

export default function Main() {
  const { role, status, ActorId } = useAuth();
  const { data: profileData } = useGetProfileQuery({ id: ActorId, role });
  const { data: events } = useGetEventsQuery();
  const { search } = useLocation();
  const [open, setOpen] = useState(true);
  const handleClose = () => {
    setOpen(false);
    // redirect to main page on success
  };

  const query = new URLSearchParams(search);
  const verification = query.get("verification");
  let popup = null;
  if (verification === "true") {


         popup = ( <Modal
        open={open}
        title="Email Verification"
        text="Your email has been successfully verified."
        onClose={handleClose}
        size="sm"
      />)
    
  }else if (verification === "false") {
    popup = ( <Modal
        open={open}
        title="your registration is almost complete"
        text="Verify your email address to continue."
        onClose={handleClose}
        size="sm"
      />)

  }

  return (
    <>
      {popup}
      <HeaderShell top={topbar} nav={nav} cta={cta} />
      <HeroV2 {...heroV2} />
      {/* <Overview {...overview} /> */}
      <B2BStatsShowcase />
      <ExhibitorsShowcase />
      <PlatformPillars/>
      {/* <B2BOutcomesShowcase/> */}
      <EventsListSection
        heading={eventsList.heading}
        subheading={eventsList.subheading}
        events={events}
      />


      {/* <MarketplaceComp/> */}


      <SdgScroller
        heading={sdgCarousel.heading}
        subheading={sdgCarousel.subheading}
        goals={sdgCarousel.goals}
      />

    <ContactUs
        image="http://localhost:3500/uploads/images/admin/contactFrame.png"
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
