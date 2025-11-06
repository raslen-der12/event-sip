import React, { useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import HeaderShell from "../../components/layout/HeaderShell";
import Footer from "../../components/footer/Footer";
import { topbar, nav, cta, footerData } from "../main.mock";
import imageLink from "../../utils/imageLink";
import {
  useGetCommunityFacetsQuery,
  useGetCommunityListQuery
} from "../../features/bp/BPApiSlice";
import "../marketplace/market.css"; // reuse mk-* cards/grid/chips

const cap = s => String(s||"")
  .toLowerCase()
  .replace(/\b\w/g,m=>m.toUpperCase());

const AVATAR_FALLBACK = "/uploads/default/photodef.png"; // same used elsewhere

function MemberCard({ m }) {
  const navigate = useNavigate();
  const avatar = m.avatar ? imageLink(m.avatar) : AVATAR_FALLBACK;
  return (
    <article className="mk-card" style={{paddingBottom:12}}>
      <div className="mk-card-body">
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:8}}>
          <img
            src={avatar}
            alt={m.fullName}
            style={{width:44,height:44,borderRadius:"50%",objectFit:"cover",flex:"0 0 44px",background:"#f3f4f6"}}
          />
          <div style={{minWidth:0}}>
            <div className="mk-title" style={{marginBottom:2,whiteSpace:"nowrap",textOverflow:"ellipsis",overflow:"hidden"}}>
              {m.fullName}
            </div>
            <div className="mk-muted" style={{fontSize:12}}>
              {m.orgName || "—"} {m.country ? `• ${m.country}` : ""}
            </div>
          </div>
          <span className="mk-chip" style={{marginLeft:"auto"}}>{cap(m.actorType || "Member")}</span>
        </div>

        <div className="mk-card-actions">
          <button className="mk-btn ghost" onClick={()=>navigate(`/community/member/${m.id}`)}>
            View Profile
          </button>
          <button className="mk-btn primary" onClick={()=>navigate(`/community/message/${m.id}`)}>
            Send Message
          </button>
        </div>
      </div>
    </article>
  );
}

export default function CommunityPage(){
  const [sp,setSp] = useSearchParams();

  const eventId   = sp.get("eventId") || "";       // optional context
  const q         = sp.get("q") || "";
  const actorType = sp.get("actorType") || "";
  const country   = sp.get("country") || "";
  const page      = Math.max(1, parseInt(sp.get("page")||"1",10));
  const limit     = 24;

  const setParam = (k,v)=>{
    const next = new URLSearchParams(sp);
    if (v===undefined || v===null || String(v).trim()==="") next.delete(k);
    else next.set(k,String(v));
    if (k!=="page") next.set("page","1");
    setSp(next,{replace:true});
  };

  const { data: facets } = useGetCommunityFacetsQuery({ eventId }, { skip: !eventId && false });
  const types    = facets?.types || [];
  const countries= facets?.countries || [];

  const { data, isFetching } = useGetCommunityListQuery({
    eventId, actorType, country, q, page, limit
  });
  const items = data?.items || [];
  const total = data?.total || 0;

  // Active type chip helper
  const isTypeActive = (t)=> (actorType||"").toLowerCase() === String(t||"").toLowerCase();

  return (
    <>
      <HeaderShell top={topbar} nav={nav} cta={cta} />

      <div className="mk container-lg">
        {/* header */}
        <div className="mk-header card">
          <div className="mk-h-title">Community</div>
          <div className="mk-h-sub">People grouped by role</div>
          <div className="mk-toprow">
            <input
              className="mk-input grow"
              placeholder="Search people or organizations…"
              value={q}
              onChange={e=>setParam("q", e.target.value)}
            />
            <select className="mk-select"
              value={country}
              onChange={e=>setParam("country", e.target.value)}>
              <option value="">All Countries</option>
              {countries.map(c=>(
                <option key={c.code} value={c.code}>{c.code} {c.count?`(${c.count})`:""}</option>
              ))}
            </select>
          </div>
        </div>

        {/* actorType chips row */}
        <div className="mk-chiprow" style={{marginTop:8}}>
          <button
            className={"mk-chip"+(actorType?"":" is-active")}
            onClick={()=>setParam("actorType","")}
          >All Types</button>
          {types.map(t=>(
            <button
              key={t.name||"unknown"}
              className={"mk-chip"+(isTypeActive(t.name)?" is-active":"")}
              onClick={()=>setParam("actorType", t.name)}
              title={t.count?`${t.count} members`:""}
            >
              {cap(t.name||"Unknown")}
            </button>
          ))}
        </div>

        {/* results header + pager select */}
        <div className="mk-controls">
          <div/>
          <div className="mk-right">
            <span className="mk-muted">{isFetching ? "Loading…" : `${total} members`}</span>
          </div>
        </div>

        {/* grid */}
        <div className="mk-grid">
          {isFetching && !items.length
            ? Array.from({length:12}).map((_,i)=><div key={i} className="mk-skel"/>)
            : items.map(m => <MemberCard key={`${m.kind}-${m.id}`} m={m} />)
          }
        </div>

        {/* load more */}
        <div className="mk-loadmore">
          <button
            className="mk-btn outline"
            disabled={items.length < limit}
            onClick={()=>setParam("page", String(page+1))}
          >
            Load More
          </button>
        </div>
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
