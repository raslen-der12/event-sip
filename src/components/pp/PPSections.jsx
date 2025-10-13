import React, { useMemo } from "react";
import PPKeyValue from "./PPKeyValue";
import PPTalk from "./PPTalk";

export default function PPSections({ role = "", actor = null, talk = null, eventMeta = null }) {
  const a = actor || {};

  const blocks = useMemo(() => {
    if (role === "exhibitor") return exhibitorBlocks(a);
    if (role === "speaker")   return speakerBlocks(a, talk);
    return attendeeBlocks(a); // default
  }, [role, a, talk]);

  return (
    <div className="ppp-sections">
      {blocks.map((b, i) => (
        <section key={i} className="ppp-section">
          <header className="ppp-sec-head">
            <h3 className="ppp-sec-title">{b.title}</h3>
            {b.sub ? <p className="ppp-sec-sub">{b.sub}</p> : null}
          </header>

          <div className="ppp-sec-body">
            {b.type === "kv"    ? <PPKeyValue items={b.items} /> : null}
            {b.type === "text"  ? <p className="ppp-text">{b.text}</p> : null}
            {b.type === "talk"  ? <PPTalk talk={b.talk} /> : null}
            {b.type === "list"  ? <ul className="ppp-list">{(b.items||[]).map((x,ix)=>(<li key={ix}>{x}</li>))}</ul> : null}
          </div>
        </section>
      ))}
    </div>
  );
}

/* ---------- role blocks ---------- */

function exhibitorBlocks(a){
  const about = {
    title: "About",
    type : "kv",
    items: [
      { label: "Organization", value: a?.identity?.orgName },
      { label: "Website",      value: a?.identity?.orgWebsite },
      { label: "Country",      value: a?.identity?.country },
      { label: "City",         value: a?.identity?.city },
    ]
  };

  const business = {
    title: "Business & Market",
    type : "kv",
    items: [
      { label: "Industry",       value: a?.business?.industry },
      { label: "Sub-industry",   value: a?.business?.subIndustry },
      { label: "Business Model", value: a?.business?.businessModel },
      { label: "Tech Level",     value: a?.business?.techLevel },
      { label: "Export Markets", value: a?.business?.exportMarkets },
      { label: "Product Tags",   value: a?.business?.productTags },
    ]
  };

  const commercial = {
    title: "Commercial & Matchmaking",
    type : "kv",
    items: [
      { label: "Offering",          value: a?.commercial?.offering },
      { label: "Looking for",       value: a?.commercial?.lookingFor },
      { label: "Open to partners",  value: a?.commercial?.lookingPartners },
      { label: "Partner types",     value: a?.commercial?.partnerTypes },
      { label: "Target sectors",    value: a?.commercial?.targetSectors },
      { label: "Regions",           value: a?.commercial?.regionInterest },
      { label: "Available meetings",value: a?.commercial?.availableMeetings },
      { label: "Languages",         value: a?.commercial?.preferredLanguages },
    ]
  };

  const booth = {
    title: "Booth & Logistics",
    type : "kv",
    items: [
      { label: "Booth number",   value: a?.booth?.boothNumber },
      { label: "Booth size",     value: a?.booth?.boothSize },
      { label: "Needs equipment",value: a?.booth?.needsEquipment },
      { label: "Live demo",      value: a?.booth?.liveDemo },
    ]
  };

  const links = {
    title: "Links",
    type : "kv",
    items: [
      { label: "Website",    value: a?.identity?.orgWebsite },
      { label: "Brochure",   value: a?.valueAdds?.productBrochure },
    ]
  };

  return [about, business, commercial, booth, links];
}

function speakerBlocks(a, talk){
  const about = {
    title: "About",
    type : "kv",
    items: [
      { label: "Full name",  value: a?.personal?.fullName },
      { label: "Email",      value: a?.personal?.email },
      { label: "Country",    value: a?.personal?.country },
      { label: "City",       value: a?.personal?.city },
      { label: "Organization", value: a?.organization?.orgName },
      { label: "Website",      value: a?.organization?.orgWebsite },
      { label: "Job title",    value: a?.organization?.jobTitle },
      { label: "Role",         value: a?.organization?.businessRole },
    ]
  };

  const talkCard = { title: "Session", type: "talk", talk };

  const b2b = {
    title: "B2B Intent",
    type : "kv",
    items: [
      { label: "Open to meetings", value: a?.b2bIntent?.openMeetings },
      { label: "Representing biz", value: a?.b2bIntent?.representingBiz },
      { label: "Sector",           value: a?.b2bIntent?.businessSector },
      { label: "Offering",         value: a?.b2bIntent?.offering },
      { label: "Looking for",      value: a?.b2bIntent?.lookingFor },
      { label: "Regions",          value: a?.b2bIntent?.regionsInterest },
      { label: "Seeking investment", value: a?.b2bIntent?.investmentSeeking },
      { label: "Investment range",   value: a?.b2bIntent?.investmentRange },
    ]
  };

  const links = {
    title: "Links",
    type : "kv",
    items: [
      { label: "Slides",    value: a?.enrichments?.slidesFile },
      { label: "Profile pic", value: a?.enrichments?.profilePic },
      { label: "Social",    value: a?.enrichments?.socialLinks },
    ]
  };

  return [about, talkCard, b2b, links];
}

function attendeeBlocks(a){
  const personal = {
    title: "Personal",
    type : "kv",
    items: [
      { label: "Full name", value: a?.personal?.fullName },
      { label: "Email",     value: a?.personal?.email },
      { label: "Country",   value: a?.personal?.country },
      { label: "City",      value: a?.personal?.city },
      { label: "LinkedIn",  value: a?.personal?.linkedIn },
    ]
  };

  const org = {
    title: "Organization & Role",
    type : "kv",
    items: [
      { label: "Organization", value: a?.organization?.orgName },
      { label: "Website",      value: a?.organization?.orgWebsite },
      { label: "Role",         value: a?.organization?.businessRole },
      { label: "Department",   value: a?.organization?.department },
      { label: "Decision maker", value: a?.organization?.decisionMaker },
    ]
  };

  const biz = {
    title: "Business Profile",
    type : "kv",
    items: [
      { label: "Primary industry", value: a?.businessProfile?.primaryIndustry },
      { label: "Sub-industry",     value: a?.businessProfile?.subIndustry },
      { label: "Business model",   value: a?.businessProfile?.businessModel },
      { label: "Company size",     value: a?.businessProfile?.companySize },
      { label: "Export-ready",     value: a?.businessProfile?.exportReady },
    ]
  };

  const match = {
    title: "Matchmaking Intent",
    type : "kv",
    items: [
      { label: "Objectives", value: a?.matchingIntent?.objectives },
      { label: "Offering",   value: a?.matchingIntent?.offering },
      { label: "Needs",      value: a?.matchingIntent?.needs },
      { label: "Open to meetings", value: a?.matchingIntent?.openToMeetings },
      { label: "Available days",   value: a?.matchingIntent?.availableDays?.map(d=> new Date(d).toDateString()) },
    ]
  };

  const aids = {
    title: "Preferences",
    type : "kv",
    items: [
      { label: "Tags",        value: a?.matchingAids?.tags },
      { label: "Preferences", value: a?.matchingAids?.matchPrefs },
      { label: "Regions",     value: a?.matchingAids?.regions },
      { label: "Language",    value: a?.matchingAids?.language },
      { label: "Allow contact", value: a?.matchingAids?.allowContact },
    ]
  };

  return [personal, org, biz, match, aids];
}