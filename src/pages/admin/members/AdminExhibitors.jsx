// src/pages/admin/members/AdminExhibitors.jsx
import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import ReactCountryFlag from "react-country-flag";
import "./admin.attendees.css"; // reuse same styles (+ evt-picker css you added)

import {
  useGetActorsListAdminQuery,
  useGetAdminActorQuery,
  useCreateActorMutation,
} from "../../../features/Actor/adminApiSlice";
import { useGetEventsQuery } from "../../../features/events/eventsApiSlice"; // simple events list for picker
import imageLink from "../../../utils/imageLink";

/* ───────────────────────── i18n-iso-countries setup ───────────────────────── */
import countries from "i18n-iso-countries";
import enLocale from "i18n-iso-countries/langs/en.json";

// register English names (module-level, runs once)
countries.registerLocale(enLocale);

// build once and sort by display name
const ALL_COUNTRIES = Object.entries(countries.getNames("en", { select: "official" }))
  .map(([code, name]) => ({ code, name }))
  .sort((a, b) => a.name.localeCompare(b.name));

/* ───────────────────────── Helpers ───────────────────────── */

function normalizeToAlpha2(input) {
  if (!input) return "";
  const s = String(input).trim();
  if (s.length === 2) return s.toUpperCase();
  const mapped = countries.getAlpha2Code(s, "en");
  return mapped ? mapped.toUpperCase() : "";
}

function flagChip(codeOrName) {
  if (!codeOrName) return "—";
  const alpha2 = normalizeToAlpha2(codeOrName) || String(codeOrName).trim().slice(0, 2).toUpperCase();
  if (!alpha2 || alpha2.length !== 2) {
    return <span className="flag-chip" title={String(codeOrName)}>{String(codeOrName)}</span>;
  }
  return (
    <span className="flag-chip" title={alpha2}>
      <ReactCountryFlag svg countryCode={alpha2} style={{ fontSize: "1em" }} />
    </span>
  );
}

function countryLabel(codeOrName) {
  const alpha2 = normalizeToAlpha2(codeOrName);
  if (alpha2 && countries.getName(alpha2, "en")) return countries.getName(alpha2, "en");
  // maybe it's already a name
  return codeOrName || "—";
}

function LinkIf(url){ return !url ? "—" : <a className="link" href={url} target="_blank" rel="noreferrer">Open</a>; }
function getId(x){ return x?._id || x?.id || String(x?.email || "") + String(x?.createdAt || ""); }
function bool(v){ return v == null ? "—" : v ? "Yes" : "No"; }
function num(n){ return n == null ? "—" : String(n); }
function truncate(s, n){ if(!s) return ""; return s.length>n ? s.slice(0,n-1)+"…" : s; }

/* ───────────────────────── Page ───────────────────────── */

export default function AdminExhibitors() {
  const navigate = useNavigate();

  // ── Filters / query args (only one of limit or search must be sent)
  const ROLE = "exhibitor";
  const [limit, setLimit] = React.useState(20);
  const [search, setSearch] = React.useState("");
  const queryArgs = React.useMemo(() => {
    const s = search.trim();
    if (s) return { role: ROLE, search: s }; // search only
    return { role: ROLE, limit: Number(limit) || 20 }; // limit only
  }, [limit, search]);
  const { data: list = [], isLoading, isFetching, refetch } = useGetActorsListAdminQuery(queryArgs);

  // ── Modal (full actor)
  const [activeId, setActiveId] = React.useState(null);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  React.useEffect(() => {
    const qid = searchParams.get("id");
    if (qid && qid !== activeId) { setActiveId(qid); setModalOpen(true); }
  }, [searchParams, activeId]);
  const { data: actor, isFetching: fetchingActor } = useGetAdminActorQuery(activeId ? activeId : null, { skip: !activeId });
  const openModal = (id) => {
    setActiveId(id); setModalOpen(true);
    const sp = new URLSearchParams(searchParams); sp.set("id", id); setSearchParams(sp, { replace: false });
  };
  const closeModal = () => {
    setModalOpen(false);
    const sp = new URLSearchParams(searchParams); sp.delete("id"); setSearchParams(sp, { replace: true });
  };

  // ── Create exhibitor (with event picker)
  const [creating, setCreating] = React.useState(false);
  const [createDraft, setCreateDraft] = React.useState({
    exhibitorName: "", contactName: "", email: "", country: "", logo: "", eventId: ""
  });
  const [selectedEvent, setSelectedEvent] = React.useState(null); // {id,name,cover,capMax,capUsed}
  const [eventPickerOpen, setEventPickerOpen] = React.useState(false);
  const [createActor, { isLoading: creatingReq }] = useCreateActorMutation();
  const canCreate = createDraft.exhibitorName.trim() && createDraft.email.trim() && createDraft.country.trim();

  const submitCreate = async (e) => {
    e.preventDefault(); if (!canCreate) return;
    const payload = {
      role: ROLE,
      adminVerified: "yes",
      identity: {
        exhibitorName: createDraft.exhibitorName.trim(),
        email: createDraft.email.trim(),
        // send ISO alpha-2 for consistency:
        country: createDraft.country.trim().toUpperCase(),
      },
      eventId: createDraft.eventId || undefined,
    };
    try {
      await createActor(payload).unwrap();
      setCreateDraft({ exhibitorName: "", email: "", country: "", eventId: "" });
      setSelectedEvent(null); setCreating(false); refetch();
    } catch (err) { console.error("Create exhibitor failed", err); }
  };

  // ── Handlers
  const seeMore = () => { if (search.trim()) return; setLimit((n) => (Number(n) || 20) + 5); };
  const onCustomLimit = (n) => { if (search.trim()) return; const v = Math.max(5, Number(n) || 20); setLimit(v); };
  const clearSearch = () => setSearch("");

  return (
    <div className="att-page">
      {/* Top bar */}
      <div className="att-top card p-10">
        <div className="att-controls">
          <div className="att-ctrl">
            <label className="att-lbl">Search (company, contact or email)</label>
            <div className="att-search-row">
              <input className="input" placeholder="e.g. contact@brand.com" value={search} onChange={(e) => setSearch(e.target.value)} />
              {search ? <button className="btn tiny" onClick={clearSearch}>Clear</button> : null}
            </div>
            <div className="att-hint muted">When searching, “Results per page” is disabled.</div>
          </div>
          <div className="att-ctrl">
            <label className="att-lbl">Results per page</label>
            <div className="att-limit-row">
              <input className="input" type="number" min="5" step="5" value={limit} onChange={(e) => onCustomLimit(e.target.value)} disabled={!!search.trim()} title={search ? "Disabled while searching" : "Custom limit"} />
              <button className="btn tiny" onClick={seeMore} disabled={!!search.trim()}>See more (+5)</button>
            </div>
          </div>
          <div className="att-actions">
            <button className="btn" onClick={() => refetch()} disabled={isFetching}>{isFetching ? "Loading…" : "Refresh"}</button>
            <button className="btn brand ml-4" onClick={() => setCreating((v) => !v)}>{creating ? "Close form" : "Create exhibitor"}</button>
          </div>
        </div>

        {/* Inline create form */}
        {creating && (
          <form className="att-create card soft p-10" onSubmit={submitCreate}>
            <div className="att-create-grid">
              <label className="att-field">
                <div className="att-lbl">Exhibitor name *</div>
                <input className="input" value={createDraft.exhibitorName} onChange={(e)=>setCreateDraft({...createDraft, exhibitorName:e.target.value})} />
              </label>

              <label className="att-field">
                <div className="att-lbl">Email *</div>
                <input className="input" value={createDraft.email} onChange={(e)=>setCreateDraft({...createDraft, email:e.target.value})} />
              </label>

              {/* Country select (now dynamic ISO list) */}
              <label className="att-field">
                <div className="att-lbl">Country *</div>
                <div className="flag-select">
                  <select
                    className="input"
                    value={createDraft.country}
                    onChange={(e)=>setCreateDraft({...createDraft, country:e.target.value})}
                  >
                    <option value="">— Select country —</option>
                    {ALL_COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                  <div className="flag-preview">{flagChip(createDraft.country)}</div>
                </div>
              </label>

              {/* Event selector row */}
              <div className="att-field">
                <div className="att-lbl">Event (optional)</div>
                <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                  <button type="button" className="btn tiny" onClick={()=>setEventPickerOpen(true)}>Select event</button>
                  {selectedEvent ? (
                    <button type="button" className="pill-status yes" onClick={()=>{ setSelectedEvent(null); setCreateDraft({...createDraft, eventId:""}); }} title="Clear selected event">
                      {truncate(selectedEvent.name, 40)}
                    </button>
                  ) : <span className="muted">No event selected</span>}
                </div>
              </div>

              <div className="att-create-actions">
                <button className="btn brand" disabled={!canCreate || creatingReq}>{creatingReq ? "Creating…" : "Create"}</button>
              </div>
            </div>
            <div className="att-hint muted">Actor will be created with <b>role: exhibitor</b> and <b>adminVerified: yes</b>.</div>
          </form>
        )}
      </div>

      {/* List */}
      <section className="att-list card p-10">
        <div className="att-list-head">
          <h3 className="att-title">Exhibitors</h3>
          <div className="muted">{search ? "Search results" : `Showing up to ${limit}`}</div>
        </div>
        <div className="att-grid">
          {isLoading && !list.length ? skeletons(12)
            : list.length ? list.map((it) => (<ExhibitorRow key={getId(it)} item={it} onOpen={() => openModal(getId(it))} />))
            : <div className="muted">No exhibitors.</div>}
        </div>
      </section>

      {/* Exhibitor Modal */}
      {modalOpen && (
        <Modal onClose={closeModal}>
          {!actor || fetchingActor ? <div className="muted">Loading actor…</div> : <ExhibitorDetails actor={actor} />}
        </Modal>
      )}

      {/* Event Picker Modal */}
      {eventPickerOpen && (
        <Modal onClose={()=>setEventPickerOpen(false)}>
          <EventPicker
            onPick={(evt) => {
              setSelectedEvent(evt);
              setCreateDraft({...createDraft, eventId: evt.id});
              setEventPickerOpen(false);
            }}
          />
        </Modal>
      )}
    </div>
  );
}

/* ───────────────────────── Components ───────────────────────── */

function ExhibitorRow({ item, onOpen }) {
  const I = item.identity || {};
  const name = I.exhibitorName || I.contactName || item.name || "—";
  const email = I.email || item.email || "—";
  const countryRaw = I.country || item.country || "";
  const countryText = countryLabel(countryRaw);
  const logo = I.logo || item.logo;
  const verified = !!(item?.verified ?? item?.verifiedEmail);
  return (
    <button className="att-row" onClick={onOpen} title="Open">
      <div className="att-avatar">{logo ? <img className="att-img" src={imageLink(logo)} alt={name} /> : <span className="att-fallback">{(name || email || "?").slice(0, 1).toUpperCase()}</span>}</div>
      <div className="att-meta">
        <div className="att-name line-1">{name}</div>
        <div className="att-sub line-1">{email}</div>
        <div className="att-sub tiny">{flagChip(countryRaw)} <span className="ml-6">{countryText}</span></div>
      </div>
      <div className="att-right"><span className={`pill-verify ${verified ? "ok" : "no"}`}>{verified ? "Email verified" : "Unverified"}</span></div>
    </button>
  );
}

function Modal({ children, onClose }) {
  React.useEffect(() => { const onKey = (e) => { if (e.key === "Escape") onClose(); }; window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey); }, [onClose]);
  return (<div className="att-modal" onClick={onClose}><div className="att-dialog" onClick={(e) => e.stopPropagation()}><button className="att-close" onClick={onClose} aria-label="Close">×</button>{children}</div></div>);
}

function ExhibitorDetails({ actor }) {
  const navigate = useNavigate();
  const id = getId(actor);
  const I = actor.identity || {};
  const B = actor.booth || {};
  const C = actor.business || {};
  const D = actor.commercial || {};
  const V = actor.valueAdds || {};

  const goProfile = () => navigate(`/admin/members/exhibitor/${id}`);
  const goMessage = () => navigate(`/admin/messages?actor=${id}&role=exhibitor`);

  return (
    <div className="att-detail">
      <div className="att-d-head">
        <button className="att-d-avatar" onClick={goProfile} title="Open full profile">
          {I.logo ? <img className="att-d-img" src={imageLink(I.logo)} alt={I.exhibitorName || I.contactName} /> : <span className="att-fallback">{(I.exhibitorName || I.contactName || I.email || "?").slice(0,1).toUpperCase()}</span>}
        </button>
        <div className="att-d-meta">
          <div className="att-d-top">
            <button className="att-d-name linklike" onClick={goProfile} title={I.exhibitorName || I.contactName}>{I.exhibitorName || I.contactName || "—"}</button>
            <span className={`pill-verify big ${actor.verified ? "ok" : "no"}`}>{actor.verified ? "Email verified" : "Unverified"}</span>
            <span className={`pill-status big ${actor.adminVerified || "pending"}`}>{actor.adminVerified || "pending"}</span>
          </div>
          <div className="att-d-sub">
            <span className="muted">{I.email || "—"}</span>
            <span className="muted">{flagChip(I.country)} {I.city ? `, ${I.city}` : ""}</span>
          </div>
        </div>
      </div>

      <div className="att-sections">
        <AttSection title="Identity & Contact">
          <KV k="Exhibitor" v={I.exhibitorName} />
          <KV k="Organization" v={I.orgName} />
          <KV k="Website" v={I.orgWebsite} />
          <KV k="Contact person" v={I.contactName} />
          <KV k="Email" v={I.email} />
          <KV k="Phone" v={I.phone} />
          <KV k="Country" v={countryLabel(I.country)} />
          <KV k="City" v={I.city} />
          <KV k="Description" v={I.desc} />
        </AttSection>

        <AttSection title="Booth & Logistics">
          <KV k="Booth number" v={B.boothNumber} />
          <KV k="Booth size" v={B.boothSize} />
          <KV k="Needs equipment" v={bool(B.needsEquipment)} />
          <KV k="Live demo" v={bool(B.liveDemo)} />
        </AttSection>

        <AttSection title="Business & Market">
          <KV k="Industry" v={C.industry} />
          <KV k="Sub-industry" v={C.subIndustry} />
          <KV k="Business model" v={C.businessModel} />
          <KV k="Product tags" v={(C.productTags || []).join(", ")} />
          <KV k="Tech level" v={C.techLevel} />
          <KV k="Export markets" v={(C.exportMarkets || []).join(", ")} />
        </AttSection>

        <AttSection title="Commercial & Match">
          <KV k="Offering" v={D.offering} />
          <KV k="Looking for" v={D.lookingFor} />
          <KV k="Looking partners" v={bool(D.lookingPartners)} />
          <KV k="Partner types" v={(D.partnerTypes || []).join(", ")} />
          <KV k="Target sectors" v={(D.targetSectors || []).join(", ")} />
          <KV k="Regions of interest" v={(D.regionInterest || []).join(", ")} />
          <KV k="Available meetings" v={bool(D.availableMeetings)} />
          <KV k="Languages" v={(D.preferredLanguages || []).join(", ")} />
        </AttSection>

        <AttSection title="Value Adds">
          <KV k="Innovation focus" v={V.innovationFocus} />
          <KV k="Sustainability focus" v={V.sustainabilityFocus} />
          <KV k="Seeking investment" v={bool(V.investmentSeeking)} />
          <KV k="Investment range" v={num(V.investmentRange)} />
          <KV k="Product brochure" v={LinkIf(V.productBrochure)} />
          <KV k="Accept demo requests" v={bool(V.acceptDemoRequests)} />
        </AttSection>
      </div>

      <div className="att-d-actions">
        <button className="btn" onClick={goMessage}>Message</button>
      </div>
    </div>
  );
}

/* ───────────────────────── Event Picker ───────────────────────── */

function EventPicker({ onPick }) {
  const { data: events = [], isFetching } = useGetEventsQuery(); // simple list
  return (
    <div className="evt-picker">
      <div className="att-list-head" style={{marginBottom:8}}>
        <h3 className="att-title">Select an event</h3>
        <div className="muted">{isFetching ? "Loading…" : `${events.length || 0} events`}</div>
      </div>
      <div className="evt-grid">
        {(!events || !events.length) ? <div className="muted">No events.</div> : events?.map((e)=> {
          const card = toEventCard(e);
          return (
            <button key={card.id} className="evt-card" onClick={()=>onPick(card)} title={card.name}>
              <div className="evt-cover">{card.cover ? <img className="evt-img" src={imageLink(card.cover)} alt={card.name} /> : <div className="evt-cover-fallback">No cover</div>}</div>
              <div className="evt-meta"><div className="evt-name line-1">{card.name}</div><div className="evt-cap">{(card.capUsed ?? "—")} / {(card.capMax ?? "—")} capacity</div></div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ───────────────────────── helpers ───────────────────────── */

function toEventCard(e){
  const id = e?._id || e?.id || "";
  const name = e?.title || e?.name || e?.eventName || "Untitled event";
  const cover = e?.cover || e?.coverImage || e?.mainPhoto || e?.photo || (Array.isArray(e?.gallery) ? e.gallery[0]?.url : "");
  const capMax = (e?.capacity && (e.capacity.max ?? e.capacity)) ?? e?.tickets?.capacity ?? e?.stats?.capacity?.max ?? null;
  const capUsed = (e?.capacity && (e.capacity.occupied ?? e.occupied)) ?? e?.tickets?.sold ?? e?.stats?.attendees ?? null;
  return { id, name, cover, capMax, capUsed };
}

function AttSection({ title, children }) {
  return (<div className="att-sec"><div className="att-sec-title">{title}</div><div className="att-kv-grid">{children}</div></div>);
}
function KV({ k, v }) {
  return (<div className="att-kv"><div className="att-k">{k}</div><div className="att-v">{v == null || v === "" ? "—" : v}</div></div>);
}
function skeletons(n=8){
  return Array.from({length:n}).map((_,i)=>(
    <div key={i} className="att-row sk">
      <div className="sk-avatar" /><div className="sk-lines"><div className="sk-line" /><div className="sk-line short" /></div><div className="sk-tag" />
    </div>
  ));
}
