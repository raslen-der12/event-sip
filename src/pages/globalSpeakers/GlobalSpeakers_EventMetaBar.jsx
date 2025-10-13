// src/pages/global-speakers/GlobalSpeakers_EventMetaBar.jsx
import React from "react";
import PropTypes from "prop-types";
import { FiMapPin, FiCalendar, FiUsers } from "react-icons/fi";
import { useGetEventQuery } from "../../features/events/eventsApiSlice";

// minimal country name -> ISO2 map (extend if needed)
const NAME2ISO = {
  "germany":"DE","spain":"ES","norway":"NO","france":"FR","italy":"IT","portugal":"PT",
  "united kingdom":"GB","uk":"GB","united states":"US","usa":"US","canada":"CA",
  "japan":"JP","china":"CN","india":"IN","brazil":"BR","mexico":"MX","sweden":"SE","poland":"PL",
};

function toISO2(country){
  if(!country) return null;
  const v = String(country).trim();
  if(/^[A-Z]{2}$/i.test(v)) return v.toUpperCase();
  return NAME2ISO[v.toLowerCase()] || null;
}

export default function EventMetaBar({ eventId, meta, count=0 }){
  const skip = !!meta;
  const { data, isLoading } = useGetEventQuery?.(eventId, { skip }) || { data:null, isLoading:false };
  const e = meta || data || {};

  const title = e.title || e.name || `Event ${String(eventId).slice(-6)}`;
  const city = e.city || e.location?.city || "";
  const country = e.country || e.location?.country || "";
  const venue = e.venueName || e.location?.venue || "";

  const iso = toISO2(country);

  const dateFmt = React.useMemo(()=>{
    try{
      const s = e.startDate ? new Date(e.startDate) : null;
      const ed = e.endDate ? new Date(e.endDate) : null;
      if(!s && !ed) return "";
      const fmt=(d,o)=>new Intl.DateTimeFormat(undefined,o).format(d);
      if(s && ed){
        const sameY = s.getFullYear()===ed.getFullYear();
        const sameM = sameY && s.getMonth()===ed.getMonth();
        if(sameM) return `${fmt(s,{month:"short",day:"numeric"})} – ${fmt(ed,{day:"numeric",year:"numeric"})}`;
        return `${fmt(s,{month:"short",day:"numeric",year:"numeric"})} – ${fmt(ed,{month:"short",day:"numeric",year:"numeric"})}`;
      }
      return fmt(s||ed,{month:"short",day:"numeric",year:"numeric"});
    }catch{return "";}
  },[e.startDate,e.endDate]);

  return (
    <header className="gsp-eventbar">
      <div className="gsp-event-title">{isLoading ? "Loading…" : title}</div>
      <div className="gsp-event-meta">
        {dateFmt ? (<span className="gsp-eb-pill"><FiCalendar />{dateFmt}</span>) : null}
        {(city || country || venue) ? (
          <span className="gsp-eb-pill">
            <FiMapPin />
            {iso ? <span className={`fi fi-${iso.toLowerCase()}`} aria-hidden="true" style={{marginRight:6}} /> : null}
            {[venue, city, country].filter(Boolean).join(" · ")}
          </span>
        ) : null}
        <span className="gsp-eb-pill"><FiUsers />{count} speakers</span>
      </div>
      <div className="gsp-event-actions">
        <a className="gsp-eb-btn" href={`/event/${eventId}`}>View event</a>
      </div>
    </header>
  );
}

EventMetaBar.propTypes = {
  eventId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  meta: PropTypes.object,
  count: PropTypes.number,
};
