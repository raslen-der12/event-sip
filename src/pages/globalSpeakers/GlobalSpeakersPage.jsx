// src/pages/global-speakers/GlobalSpeakersPage.jsx
import React from "react";
import PropTypes from "prop-types";
import "flag-icons/css/flag-icons.min.css"; // safe to keep here; remove if you import globally
import {
  FiSearch, FiX, FiFilter, FiChevronDown, FiChevronUp, FiRefreshCw,
} from "react-icons/fi";
import "./global-speakers.css";
import EventSpeakersGrid from "../../components/event/speakers/EventSpeakersGrid";
import EventSpeakersCompareDrawer from "../../components/event/speakers/EventSpeakersCompareDrawer";
import EventMetaBar from "./GlobalSpeakers_EventMetaBar";
// If you have RTK hooks, import them; otherwise they’re unused while demo runs.
import { useGetAllSpeakersQuery } from "../../features/Actor/toolsApiSlice";
import Footer from "../../components/footer/Footer";
import { cta, footerData, nav, topbar } from "../main.mock";
import HeaderShell from "../../components/layout/HeaderShell";

/* ----------------------------- DEMO DATA ----------------------------- */
const DEMO_EVENTS = {
  "evt-tech2025": {
    _id:"evt-tech2025",
    title:"Global Tech & AI Summit",
    startDate:"2025-11-12T09:00:00Z",
    endDate:"2025-11-14T17:00:00Z",
    venueName:"Expo Grand Hall",
    city:"Berlin",
    country:"Germany",
  },
  "evt-health2025": {
    _id:"evt-health2025",
    title:"Future of Health Congress",
    startDate:"2025-09-03T09:00:00Z",
    endDate:"2025-09-05T17:30:00Z",
    venueName:"Medica Center",
    city:"Barcelona",
    country:"Spain",
  },
  "evt-green2025": {
    _id:"evt-green2025",
    title:"Green Energy Forum",
    startDate:"2025-10-06T09:00:00Z",
    endDate:"2025-10-07T16:30:00Z",
    venueName:"Harbor Convention",
    city:"Oslo",
    country:"Norway",
  }
};

const DEMO_SPEAKERS = [
  {_id:"sp1", id_event:"evt-tech2025", fullName:"Amira Haddad", orgName:"QuantumWorks", jobTitle:"CTO", BusinessRole:"Tech Leader", profilePic:"https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=600", openMeetings:true},
  {_id:"sp2", id_event:"evt-tech2025", fullName:"Daniel Kim", orgName:"Helios Robotics", jobTitle:"Head of R&D", BusinessRole:"Buyer", profilePic:"https://images.unsplash.com/photo-1556157382-97eda2d62296?q=80&w=600", openMeetings:false},
  {_id:"sp3", id_event:"evt-tech2025", fullName:"Sara Nilsson", orgName:"Nordic Cloud", jobTitle:"VP Product", BusinessRole:"Partner", profilePic:"https://images.unsplash.com/photo-1529665253569-6d01c0eaf7b6?q=80&w=600", openMeetings:true},
  {_id:"sp5", id_event:"evt-health2025", fullName:"Dr. Aisha Khan", orgName:"Vitalytics", jobTitle:"Chief Medical Officer", BusinessRole:"Clinical", profilePic:"https://images.unsplash.com/photo-1550525811-e5869dd03032?q=80&w=600", openMeetings:true},
  {_id:"sp6", id_event:"evt-health2025", fullName:"Marco Rossi", orgName:"BioSense", jobTitle:"Regulatory Lead", BusinessRole:"Compliance", profilePic:"https://images.unsplash.com/photo-1549060279-7e168fcee0c2?q=80&w=600", openMeetings:false},
  {_id:"sp7", id_event:"evt-health2025", fullName:"Emily Clark", orgName:"CareLink", jobTitle:"Head of Partnerships", BusinessRole:"Partnerships", profilePic:"https://images.unsplash.com/photo-1559723947-050a04fc63f3?q=80&w=600", openMeetings:true},
  {_id:"sp9", id_event:"evt-green2025", fullName:"Anna Berg", orgName:"PolarWind", jobTitle:"Project Director", BusinessRole:"Infrastructure", profilePic:"https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?q=80&w=600", openMeetings:true},
  {_id:"sp10", id_event:"evt-green2025", fullName:"Yusuf Demir", orgName:"SunGrid", jobTitle:"COO", BusinessRole:"Operations", profilePic:"https://images.unsplash.com/photo-1544006659-f0b21884ce1d?q=80&w=600", openMeetings:false},
  {_id:"sp11", id_event:"evt-green2025", fullName:"Maya Patel", orgName:"EcoVolt", jobTitle:"Investment Manager", BusinessRole:"Investor", profilePic:"https://images.unsplash.com/photo-1549060279-7e168fcee0c2?q=80&w=600", openMeetings:true},
];

/* -------------------------- PAGE COMPONENT -------------------------- */

export default function GlobalSpeakersPage({
  heading="Global Speakers",
  subheading="All confirmed speakers across events. Filter by event and country.",
  isLoggedIn=false
}) {
  // Pull all speakers (if API wired). If not, we’ll fallback to demo silently.
  const { data: apiData, isLoading: apiLoading, isError } = useGetAllSpeakersQuery?.() || { data:null, isLoading:false, isError:false };

  // Normalize incoming API list to expected shape (id_event field required)
  const incoming = Array.isArray(apiData) ? apiData : null;

  const itemsRaw = incoming && incoming.length ? incoming : DEMO_SPEAKERS;
  const eventsMeta = incoming && incoming.length
    ? {} // you can leave empty; EventMetaBar will fetch each event by id
    : DEMO_EVENTS;

  // Group by event id
  const groups = React.useMemo(() => {
    const by = new Map();
    itemsRaw.forEach((s) => {
      const ev = s?.id_event || s?.eventId;
      if (!ev) return;
      if (!by.has(ev)) by.set(ev, { eventId: ev, speakers: [], meta: eventsMeta[ev] || null });
      by.get(ev).speakers.push(s);
    });
    // sort groups by event start (desc newest first)
    const arr = Array.from(by.values());
    arr.sort((a,b) => {
      const da = Date.parse(a?.meta?.startDate || 0);
      const db = Date.parse(b?.meta?.startDate || 0);
      return db - da;
    });
    return arr;
  }, [itemsRaw, eventsMeta]);

  // Toolbar state
  const [q, setQ] = React.useState("");
  const [onlyOpen, setOnlyOpen] = React.useState(false);
  const [expanded, setExpanded] = React.useState(false);
  const [eventFilter, setEventFilter] = React.useState("all");
  const [countryFilter, setCountryFilter] = React.useState("all");
  const [sort, setSort] = React.useState("name");

  // Build filter options from data (events, countries come from event meta)
  const eventOpts = React.useMemo(() => {
    return groups.map(g => ({
      id: g.eventId,
      label: g?.meta?.title || `Event ${String(g.eventId).slice(-6)}`
    }));
  }, [groups]);

  const countryOpts = React.useMemo(() => {
    const set = new Set();
    groups.forEach(g => {
      const c = g?.meta?.country;
      if (c) set.add(c);
    });
    return Array.from(set).sort((a,b)=>a?.localeCompare(b));
  }, [groups]);

  // Apply filters per group
  const filteredGroups = React.useMemo(() => {
    const text = q.trim().toLowerCase();
    const eg = groups
      .filter(g => eventFilter === "all" ? true : g.eventId === eventFilter)
      .filter(g => countryFilter === "all" ? true : (g?.meta?.country || "").toLowerCase() === countryFilter.toLowerCase())
      .map(g => {
        let list = g.speakers.filter(s => {
          const fn = (s.fullName || "").toLowerCase();
          const org = (s.orgName || s.organization || "").toLowerCase();
          const jt = (s.jobTitle || "").toLowerCase();
          const br = (s.BusinessRole || s.businessRole || "").toLowerCase();
          const matchesText = !text || fn.includes(text) || org.includes(text) || jt.includes(text) || br.includes(text);
          const matchesOpen = !onlyOpen || !!s.openMeetings;
          return matchesText && matchesOpen;
        });
        list.sort((a,b)=>{
          const A = (sort==="org" ? a?.orgName : a?.fullName) || "";
          const B = (sort==="org" ? b?.orgName : b?.fullName) || "";
          return A?.localeCompare(B, undefined, { sensitivity:"base" });
        });
        return { ...g, speakers: list };
      })
      .filter(g => g.speakers.length > 0);
    return eg;
  }, [groups, q, onlyOpen, eventFilter, countryFilter, sort]);

  // Compare drawer
  const [selected, setSelected] = React.useState([]);
  const selectedIds = React.useMemo(() => new Set(selected.map(s => s?._id || s?.id)), [selected]);
  const onToggleSelect = (item) => {
    const id = item?._id || item?.id;
    if (!id) return;
    setSelected((cur) => {
      const has = cur.find(x => (x?._id || x?.id) === id);
      if (has) return cur.filter(x => (x?._id || x?.id) !== id);
      if (cur.length >= 3) return cur;
      return [...cur, item];
    });
  };

  const onReset = () => {
    setQ(""); setOnlyOpen(false); setExpanded(false);
    setEventFilter("all"); setCountryFilter("all"); setSort("name");
  };

  const pageLoading = (apiLoading && !incoming) && !DEMO_SPEAKERS.length;

  return (
    <>
        <HeaderShell top={topbar} nav={nav} cta={cta} />
    <section className="gsp">
      <div className="gsp-container">
        {/* Head */}
        <header className="gsp-head">
          <h2 className="gsp-title">{heading}</h2>
          {subheading ? <p className="gsp-sub">{subheading}</p> : null}
        </header>

        {/* Toolbar */}
        <div className={`gsp-toolbar ${expanded ? "is-open" : ""}`}>
          <div className="gsp-row">
            <div className="gsp-search">
              <FiSearch className="gsp-ico" />
              <input
                className="gsp-input"
                value={q}
                onChange={(e)=>setQ(e.target.value)}
                placeholder="Search by name, company, title, or role…"
                aria-label="Search speakers"
              />
              {q ? (
                <button type="button" className="gsp-clear" onClick={()=>setQ("")} aria-label="Clear search">
                  <FiX />
                </button>
              ) : null}
            </div>

            <button
              type="button"
              className="gsp-tgl"
              onClick={()=>setExpanded(v=>!v)}
              aria-expanded={expanded ? "true" : "false"}
              aria-controls="gsp-advanced"
            >
              <FiFilter />
              Filters
              {expanded ? <FiChevronUp /> : <FiChevronDown />}
            </button>
          </div>

          <div id="gsp-advanced" className="gsp-adv">
            <div className="gsp-tabs">
              <button
                type="button"
                className={`gsp-tab ${!onlyOpen ? "is-active" : ""}`}
                onClick={()=>setOnlyOpen(false)}
                aria-pressed={!onlyOpen}
              >All</button>
              <button
                type="button"
                className={`gsp-tab ${onlyOpen ? "is-active" : ""}`}
                onClick={()=>setOnlyOpen(true)}
                aria-pressed={onlyOpen}
              >Open to meetings</button>
            </div>

            <div className="gsp-end">
              {/* Event filter */}
              <label className="gsp-sortlab" htmlFor="gsp-event">Event</label>
              <select id="gsp-event" className="gsp-select" value={eventFilter} onChange={(e)=>setEventFilter(e.target.value)}>
                <option value="all">All events</option>
                {eventOpts.map(opt=>(
                  <option key={opt.id} value={opt.id}>{opt.label}</option>
                ))}
              </select>

              {/* Country filter (from event country) */}
              <label className="gsp-sortlab" htmlFor="gsp-country">Country</label>
              <select id="gsp-country" className="gsp-select" value={countryFilter} onChange={(e)=>setCountryFilter(e.target.value)}>
                <option value="all">All countries</option>
                {countryOpts.map(c=>(
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              {/* Sort */}
              <label className="gsp-sortlab" htmlFor="gsp-sort">Sort by</label>
              <select id="gsp-sort" className="gsp-select" value={sort} onChange={(e)=>setSort(e.target.value)}>
                <option value="name">Name</option>
                <option value="org">Organization</option>
              </select>

              <button type="button" className="gsp-reset" onClick={onReset} title="Reset filters">
                <FiRefreshCw />
              </button>
            </div>
          </div>
        </div>

        {/* Groups */}
        {pageLoading ? (
          <div className="gsp-empty">Loading…</div>
        ) : (filteredGroups.length ? filteredGroups.map(group => (
          <section key={group.eventId} className="gsp-group">
            <EventMetaBar eventId={group.eventId} meta={group.meta} count={group.speakers.length} />
            <EventSpeakersGrid
              heading=""
              subheading=""
              items={group.speakers}
              isLoading={false}
              errorText=""
              isLoggedIn={isLoggedIn}
              onPreview={(item)=>{ /* optional: wire quickview if you want */ }}
              getReadMoreHref={(s)=>`/speaker/${s?._id || s?.id || ""}`}
              anchorMap={{}} /* not used here */
              selectedIds={selectedIds}
              onToggleSelect={onToggleSelect}
              sentinelRef={undefined}
            />
          </section>
        )) : (
          <div className="gsp-empty">No speakers match your filters.</div>
        ))}

      </div>

      {/* Compare drawer */}
      <EventSpeakersCompareDrawer
        items={selected}
        onRemove={(item)=>setSelected(cur=>cur.filter(x=>(x?._id||x?.id)!==(item?._id||item?.id)))}
        onClear={()=>setSelected([])}
        open={selected.length>0}
        onClose={()=>setSelected([])}
      />
    </section>
  <Footer
      brand={footerData.brand}
      columns={footerData.columns}
      socials={footerData.socials}
      actions={footerData.actions}
      bottomLinks={footerData.bottomLinks}
    />
    </>);
}

GlobalSpeakersPage.propTypes = {
  heading: PropTypes.string,
  subheading: PropTypes.string,
  isLoggedIn: PropTypes.bool,
};
