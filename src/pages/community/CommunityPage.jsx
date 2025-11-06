import React, { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import HeaderShell from "../../components/layout/HeaderShell";
import Footer from "../../components/footer/Footer";
import { topbar, nav, cta, footerData } from "../main.mock";
import imageLink from "../../utils/imageLink";
import {
  useGetCommunityFacetsQuery,
  useGetCommunityListQuery,
} from "../../features/bp/BPApiSlice";
import "../marketplace/market.css"; // reuse mk-* cards/grid/chips

const cap = (s)=>String(s||"").replace(/\b\w/g,m=>m.toUpperCase());
const AVATAR_FALLBACK = "/uploads/default/photodef.png";

function MemberCard({ m }) {
  const navigate = useNavigate();
  const avatar = m.avatar ? imageLink(m.avatar) : AVATAR_FALLBACK;
  return (
    <article className="mk-card" style={{ paddingBottom: 12 }}>
      <div className="mk-card-body">
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:8 }}>
          <img src={avatar} alt={m.fullName}
               style={{ width:44, height:44, borderRadius:"50%", objectFit:"cover", background:"#f3f4f6" }}/>
          <div style={{ minWidth:0 }}>
            <div className="mk-title" style={{ marginBottom:2, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
              {m.fullName}
            </div>
            <div className="mk-muted" style={{ fontSize:12 }}>
              {m.orgName || "—"} {m.country ? `• ${m.country}` : ""}
            </div>
          </div>
        </div>
        <div className="mk-card-actions">
          <button className="mk-btn ghost" onClick={()=>navigate(`/community/member/${m.id}`)}>View Profile</button>
          <button className="mk-btn primary" onClick={()=>navigate(`/community/message/${m.id}`)}>Send Message</button>
        </div>
      </div>
    </article>
  );
}

function GroupBlock({ g }) {
  return (
    <section className="card" style={{ padding:16, marginBottom:16 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
        <div className="mk-h-sub" style={{ fontWeight:700 }}>{cap(g.name)} <span className="mk-muted">({g.count})</span></div>
      </div>
      <div className="mk-grid">
        {(g.items||[]).map(m => <MemberCard key={`g-${g.name}-${m.id}`} m={m} />)}
      </div>
    </section>
  );
}

export default function CommunityPage() {
  const [sp, setSp] = useSearchParams();

  const eventId  = sp.get("eventId") || "";
  const q        = sp.get("q") || "";
  const country  = sp.get("country") || "";
  const subRole  = sp.get("subRole") || "";      // filter key (NOT actorType)
  const page     = Math.max(1, parseInt(sp.get("page") || "1", 10));
  const limit    = 24;

  const setParam = (k,v)=>{
    const next = new URLSearchParams(sp);
    if (v===undefined || v===null || String(v).trim()==="") next.delete(k); else next.set(k,String(v));
    if (k!=="page") next.set("page","1");
    setSp(next,{replace:true});
  };

  // facets (also gives default event)
  const { data: facets } = useGetCommunityFacetsQuery({ eventId });
  const events    = facets?.events || [];
  const defaultId = facets?.defaultEventId || (events[0]?.id || "");

  // ensure a default event is set in URL
  useEffect(()=>{
    if (!eventId && defaultId) setParam("eventId", defaultId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, defaultId]);

  const subRoles = facets?.subRoles || [];
  const countries = facets?.countries || [];

  // data
  const listParams = { eventId: eventId || defaultId, subRole, country, q, page, limit };
  const { data, isFetching } = useGetCommunityListQuery(listParams);

  const groups = (!subRole ? (data?.groups || []) : []);
  const items  = (subRole ? (data?.items || []) : []);
  const total  = data?.total || 0;

  return (
    <>
      <HeaderShell top={topbar} nav={nav} cta={cta} />
      <div className="mk container-lg">

        <div className="mk-header card">
          <div className="mk-h-title">Community</div>
          <div className="mk-h-sub">Grouped by Sub-Role</div>
          <div className="mk-toprow">
            <input className="mk-input grow" placeholder="Search people or organizations…"
              value={q} onChange={(e)=>setParam("q", e.target.value)} />
            <select className="mk-select" value={eventId || defaultId} onChange={(e)=>setParam("eventId", e.target.value)}>
              {events.map(ev => <option key={ev.id} value={ev.id}>{ev.title || ev.id}</option>)}
            </select>
            <select className="mk-select" value={country} onChange={(e)=>setParam("country", e.target.value)}>
              <option value="">All Countries</option>
              {countries.map(c => <option key={c.code} value={c.code}>{c.code}{c.count?` (${c.count})`:""}</option>)}
            </select>
          </div>
        </div>

        {/* SubRole chips */}
        <div className="mk-chiprow">
          <button className={"mk-chip"+(subRole?"":" is-active")} onClick={()=>setParam("subRole","")}>All Sub-roles</button>
          {subRoles.map(r=>(
            <button key={r.name||"Unspecified"}
              className={"mk-chip"+(subRole===r.name?" is-active":"")}
              title={r.count?`${r.count} members`:""}
              onClick={()=>setParam("subRole", r.name)}>
              {cap(r.name||"Unspecified")}
            </button>
          ))}
        </div>

        {/* Summary + pager controls */}
        <div className="mk-controls">
          <div/>
          <div className="mk-right">
            <span className="mk-muted">{isFetching ? "Loading…" : `${total} members`}</span>
          </div>
        </div>

        {/* Content: grouped or flat */}
        {!subRole ? (
          <div>
            {isFetching && !groups.length
              ? Array.from({length:6}).map((_,i)=><div key={i} className="mk-skel" style={{height:120}}/>)
              : groups.map(g => <GroupBlock key={`grp-${g.name}`} g={g} />)}
          </div>
        ) : (
          <>
            <div className="mk-grid">
              {isFetching && !items.length
                ? Array.from({length:12}).map((_,i)=><div key={i} className="mk-skel"/>)
                : items.map(m => <MemberCard key={`m-${m.id}`} m={m} />)}
            </div>
            <div className="mk-loadmore">
              <button className="mk-btn outline"
                disabled={items.length < limit}
                onClick={()=>setParam("page", String(page+1))}>
                Load More
              </button>
            </div>
          </>
        )}
      </div>

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
