import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiChevronLeft, FiCalendar, FiClock, FiUser, FiMail, FiCornerUpRight,
  FiXCircle, FiCheckCircle, FiMessageSquare, FiRefreshCw, FiTrash2, FiMapPin, FiTag
} from "react-icons/fi";
import {
  useGetMeetingsQuery,
  useGetSuggestedListQuery,
} from "../../features/meetings/meetingsApiSlice";
import { useGetEventQuery } from "../../features/events/eventsApiSlice";
import "./meetings.css";
import Footer from "../../components/footer/Footer";
import { cta, footerData, nav, topbar } from "../main.mock";
import HeaderShell from "../../components/layout/HeaderShell";

/* ------------------------ DEMO FALLBACKS ------------------------ */
const DEMO_MY_ID = "u_me";
const DEMO_EVENTS = {
  e1:{id:"e1",title:"Global Innovation Tech Summit",city:"Casablanca",country:"Morocco"},
  e2:{id:"e2",title:"MENA CleanTech Expo",city:"Dubai",country:"UAE"},
  e3:{id:"e3",title:"AI for Industry Forum",city:"Paris",country:"France"},
};
const DEMO_ACTORS = {
  sp1:{id:"sp1",name:"Dr. Lina Haddad",photo:"https://images.unsplash.com/photo-1544006659-f0b21884ce1d?w=400&q=80"},
  ex1:{id:"ex1",name:"NeoGrid Systems",photo:""},
  at1:{id:"at1",name:"Omar B.",photo:"https://images.unsplash.com/photo-1531123414780-f74229cbb8f0?w=400&q=80"},
};
const DEMO_MEETINGS = [
  {id:"m1",eventId:"e1",senderId:"u_me",receiverId:"sp1",receiverRole:"speaker",receiverName:"",receiverPhoto:"",
   subject:"Partnership talk",purpose:"B2B partnership",requestedAt:"2025-08-12T09:18:00Z",acceptedAt:null,status:"pending",
   proposedNewAt:null,roomId:null,slotISO:"2025-09-03T14:30:00Z"},
  {id:"m2",eventId:"e2",senderId:"ex1",receiverId:"u_me",receiverRole:"attendee",receiverName:"",receiverPhoto:"",
   subject:"Demo & distribution",purpose:"B2B distribution",requestedAt:"2025-08-10T11:02:00Z",acceptedAt:null,status:"rescheduled",
   proposedNewAt:"2025-09-04T10:00:00Z",roomId:null,slotISO:"2025-09-03T16:00:00Z"},
  {id:"m3",eventId:"e3",senderId:"u_me",receiverId:"at1",receiverRole:"attendee",receiverName:"",receiverPhoto:"",
   subject:"Tech capabilities",purpose:"B2G opportunity",requestedAt:"2025-08-07T16:40:00Z",acceptedAt:"2025-08-08T13:20:00Z",status:"confirmed",
   proposedNewAt:null,roomId:"R-204",slotISO:"2025-09-12T09:15:00Z"},
  {id:"m4",eventId:"e1",senderId:"u_me",receiverId:"ex1",receiverRole:"exhibitor",receiverName:"",receiverPhoto:"",
   subject:"Pricing & samples",purpose:"B2C pilot",requestedAt:"2025-08-01T10:00:00Z",acceptedAt:null,status:"rejected",
   proposedNewAt:null,roomId:null,slotISO:"2025-09-05T13:00:00Z"},
  {id:"m5",eventId:"e2",senderId:"at1",receiverId:"u_me",receiverRole:"attendee",receiverName:"",receiverPhoto:"",
   subject:"Follow-up chat",purpose:"B2B intro",requestedAt:"2025-08-06T15:18:00Z",acceptedAt:null,status:"cancelled",
   proposedNewAt:null,roomId:null,slotISO:"2025-09-10T11:20:00Z"},
];

/* DEMO 20 suggestions (fallback) */
const DEMO_SUGGESTED_20 = [
  { id:"sg1",  role:"speaker",   name:"Aya Benali",       photo:"https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=240&q=80",  tag:"B2B" },
  { id:"sg2",  role:"exhibitor", name:"GreenVolt Labs",   photo:"",                                                                             tag:"B2G" },
  { id:"sg3",  role:"attendee",  name:"Youssef M.",       photo:"https://images.unsplash.com/photo-1544723795-3fb6469f5b39?w=240&q=80",         tag:"B2B" },
  { id:"sg4",  role:"speaker",   name:"Sara O.",          photo:"https://images.unsplash.com/photo-1544005313-94ddf0286df9?w=240&q=80",         tag:"B2C" },
  { id:"sg5",  role:"attendee",  name:"Khalid R.",        photo:"",                                                                             tag:"B2B" },
  { id:"sg6",  role:"exhibitor", name:"NovaSense AI",     photo:"",                                                                             tag:"B2B" },
  { id:"sg7",  role:"speaker",   name:"Hajar F.",         photo:"https://images.unsplash.com/photo-1517841905240-472988babdf9?w=240&q=80",      tag:"B2G" },
  { id:"sg8",  role:"attendee",  name:"M. El Idrissi",    photo:"",                                                                             tag:"B2C" },
  { id:"sg9",  role:"exhibitor", name:"BlueSea Tech",     photo:"",                                                                             tag:"B2B" },
  { id:"sg10", role:"attendee",  name:"Rim Z.",           photo:"https://images.unsplash.com/photo-1544005313-ff4fe33abc2b?w=240&q=80",         tag:"B2B" },
  { id:"sg11", role:"speaker",   name:"Rayan T.",         photo:"https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=240&q=80",      tag:"B2C" },
  { id:"sg12", role:"exhibitor", name:"VoltEdge",         photo:"",                                                                             tag:"B2B" },
  { id:"sg13", role:"attendee",  name:"Ines A.",          photo:"https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?w=240&q=80",         tag:"B2G" },
  { id:"sg14", role:"speaker",   name:"Meriem L.",        photo:"https://images.unsplash.com/photo-1544005313-7e2b84e8d7d1?w=240&q=80",         tag:"B2B" },
  { id:"sg15", role:"exhibitor", name:"Orion Robotics",   photo:"",                                                                             tag:"B2C" },
  { id:"sg16", role:"attendee",  name:"Y. Amrani",        photo:"",                                                                             tag:"B2G" },
  { id:"sg17", role:"speaker",   name:"Hussein K.",       photo:"https://images.unsplash.com/photo-1502767089025-6572583495b0?w=240&q=80",      tag:"B2B" },
  { id:"sg18", role:"exhibitor", name:"EcoCharge",        photo:"",                                                                             tag:"B2G" },
  { id:"sg19", role:"attendee",  name:"Lamiae S.",        photo:"https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=240&q=80",      tag:"B2B" },
  { id:"sg20", role:"speaker",   name:"Z. Cherkaoui",     photo:"https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=240&q=80",      tag:"B2C" },
];

/* ------------------------ UTILITIES ------------------------ */
const fmtDay=(iso)=>{try{return new Date(iso).toLocaleDateString(undefined,{weekday:"short",month:"short",day:"numeric"})}catch{return"—"}};
const fmtTime=(iso)=>{try{return new Date(iso).toLocaleTimeString(undefined,{hour:"2-digit",minute:"2-digit"})}catch{return"—"}};
const whereStr=(ev)=>[ev?.city,ev?.country].filter(Boolean).join(", ");
const compactB2X=(s="")=>String(s).replace(/^(\s*B2[BCG])\b.*$/i,"$1");
const statusMeta=(s)=>{const k=String(s||"").toLowerCase();
  if(k==="pending")return{label:"Pending",className:"-pending"};
  if(k==="rescheduled")return{label:"Rescheduled",className:"-resched"};
  if(k==="confirmed")return{label:"Confirmed",className:"-ok"};
  if(k==="rejected")return{label:"Rejected",className:"-bad"};
  if(k==="cancelled"||k==="canceled")return{label:"Cancelled",className:"-muted"};
  return{label:"—",className:"-muted"};
};
function initials(name=""){const p=String(name).trim().split(/\s+/).slice(0,2);return p.map(x=>x[0]?.toUpperCase?.()||"").join("")||"—"}
const trimWords=(t="",limit=10)=>{const a=String(t).trim().split(/\s+/);return a.length>limit?a.slice(0,limit).join(" ")+"…":t};
const shufflePick = (arr, n) => {
  const a = arr.slice();
  for (let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}
  return a.slice(0, n);
};

/* ------------------------ CHILD: EventMini (safe hook) ------------------------ */
function EventMini({eventId,fallback,children}) {
  const { data } = useGetEventQuery(eventId, { skip: !eventId });
  const ev = data || fallback || {};
  return children(ev);
}

/* ------------------------ SUGGESTIONS STRIP (AI inside button) ------------------------ */
function normalizeSuggested(a = {}) {
  const p = a.profile || a;
  const role = (p.role || a.role || "").toLowerCase();
  const name = p.name || p.fullName || p.exhibitorName || p.orgName || "—";
  const photo = p.avatar || p.photo || p.profilePic || "";
  const tag = compactB2X(p.tag || a.tag || a.purpose || "");
  const id = p.id || p._id || a.id;
  return { id, role: role || "attendee", name, photo, tag: tag || "" };
}
function initialsName(str = "") {
  const p = String(str).trim().split(/\s+/).slice(0, 2);
  return p.map(s => s[0]?.toUpperCase?.() || "").join("") || "—";
}

function SuggestionsStrip({ myId, onOpen }) {
  const { data, refetch } =
    useGetSuggestedListQuery({ actorId: myId }, { skip: !myId }) || {};

  const normalize = (a = {}) => {
    const p = a.profile || a;
    const role = (p.role || a.role || "attendee").toLowerCase();
    const name = p.name || p.fullName || p.exhibitorName || p.orgName || "—";
    const photo = p.avatar || p.photo || p.profilePic || "";
    const tag = String(p.tag || a.tag || a.purpose || "").replace(/^(\s*B2[BCG])\b.*$/i,"$1");
    const id = p.id || p._id || a.id;
    return { id, role, name, photo, tag: tag || "" };
  };

  const fallback20 = [
    { id:"sg1",role:"speaker",name:"Aya Benali",photo:"https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=240&q=80",tag:"B2B" },
    { id:"sg2",role:"exhibitor",name:"GreenVolt Labs",photo:"",tag:"B2G" },
    { id:"sg3",role:"attendee",name:"Youssef M.",photo:"https://images.unsplash.com/photo-1544723795-3fb6469f5b39?w=240&q=80",tag:"B2B" },
    { id:"sg4",role:"speaker",name:"Sara O.",photo:"https://images.unsplash.com/photo-1544005313-94ddf0286df9?w=240&q=80",tag:"B2C" },
    { id:"sg5",role:"attendee",name:"Khalid R.",photo:"",tag:"B2B" },
    { id:"sg6",role:"exhibitor",name:"NovaSense AI",photo:"",tag:"B2B" },
    { id:"sg7",role:"speaker",name:"Hajar F.",photo:"https://images.unsplash.com/photo-1517841905240-472988babdf9?w=240&q=80",tag:"B2G" },
    { id:"sg8",role:"attendee",name:"M. El Idrissi",photo:"",tag:"B2C" },
    { id:"sg9",role:"exhibitor",name:"BlueSea Tech",photo:"",tag:"B2B" },
    { id:"sg10",role:"attendee",name:"Rim Z.",photo:"https://images.unsplash.com/photo-1544005313-ff4fe33abc2b?w=240&q=80",tag:"B2B" },
    { id:"sg11",role:"speaker",name:"Rayan T.",photo:"https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=240&q=80",tag:"B2C" },
    { id:"sg12",role:"exhibitor",name:"VoltEdge",photo:"",tag:"B2B" },
    { id:"sg13",role:"attendee",name:"Ines A.",photo:"https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?w=240&q=80",tag:"B2G" },
    { id:"sg14",role:"speaker",name:"Meriem L.",photo:"https://images.unsplash.com/photo-1544005313-7e2b84e8d7d1?w=240&q=80",tag:"B2B" },
    { id:"sg15",role:"exhibitor",name:"Orion Robotics",photo:"",tag:"B2C" },
    { id:"sg16",role:"attendee",name:"Y. Amrani",photo:"",tag:"B2G" },
    { id:"sg17",role:"speaker",name:"Hussein K.",photo:"https://images.unsplash.com/photo-1502767089025-6572583495b0?w=240&q=80",tag:"B2B" },
    { id:"sg18",role:"exhibitor",name:"EcoCharge",photo:"",tag:"B2G" },
    { id:"sg19",role:"attendee",name:"Lamiae S.",photo:"https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=240&q=80",tag:"B2B" },
    { id:"sg20",role:"speaker",name:"Z. Cherkaoui",photo:"https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=240&q=80",tag:"B2C" },
  ];

  const pool20 = React.useMemo(() => {
    const raw =
      (Array.isArray(data?.data) && data.data) ||
      (Array.isArray(data?.items) && data.items) ||
      (Array.isArray(data) && data) ||
      fallback20;
    return raw.map(normalize).filter(x => x.id).slice(0, 20);
  }, [data]);

  const shufflePick = (arr, n) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a.slice(0, n);
  };

  const [thinking, setThinking] = React.useState(false);
  const [shown, setShown] = React.useState(() => shufflePick(pool20, 5));
  React.useEffect(() => { if (!thinking && pool20.length) setShown(shufflePick(pool20, 5)); }, [pool20, thinking]);

  const onRefresh = async () => {
    setThinking(true);
    const p = refetch?.().catch(() => null);
    await new Promise(res => setTimeout(res, 5000)); // ✨ AI “thinking” window
    let newPool = pool20;
    try {
      const r = await p;
      const raw =
        (Array.isArray(r?.data?.data) && r.data.data) ||
        (Array.isArray(r?.data?.items) && r.data.items) ||
        (Array.isArray(r?.data) && r.data) ||
        pool20;
      newPool = raw.map(normalize).filter(x => x.id).slice(0, 20);
    } catch {}
    setShown(shufflePick(newPool, 5));
    setThinking(false);
  };

  const initials = (str = "") =>
    String(str).trim().split(/\s+/).slice(0, 2).map(s => s[0]?.toUpperCase?.() || "").join("") || "—";

  return (
    <section className="sugg">
      <div className="sugg-head">
        <h2 className="sugg-title">Suggested for you</h2>

        <button
          className={`sugg-refresh ${thinking ? "is-ai" : ""}`}
          type="button"
          onClick={onRefresh}
          disabled={thinking}
          aria-busy={thinking}
          aria-live="polite"
          title="Refresh suggestions"
        >
          {/* AI core loader */}
          {thinking ? (
            <span className="ai-core" aria-hidden="true">
              <svg className="ai-core-svg" viewBox="0 0 48 48">
                <defs>
                  <linearGradient id="aiGrad2" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="var(--ai1)"/>
                    <stop offset="100%" stopColor="var(--ai2)"/>
                  </linearGradient>
                  <filter id="aiGlow2" x="-40%" y="-40%" width="180%" height="180%">
                    <feGaussianBlur stdDeviation="2.2" result="b"/>
                    <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
                  </filter>
                </defs>

                <g stroke="url(#aiGrad2)" strokeWidth="1.4" fill="none" filter="url(#aiGlow2)">
                  <circle className="ring r1" cx="24" cy="24" r="19" strokeDasharray="4 6"/>
                  <circle className="ring r2" cx="24" cy="24" r="14" strokeDasharray="2 8"/>
                  <circle className="ring r3" cx="24" cy="24" r="9"  strokeDasharray="60" />
                </g>

                <circle className="core" cx="24" cy="24" r="2.6" fill="url(#aiGrad2)"/>

                <g className="orb orb1">
                  <circle className="dot" cx="24" cy="5"  r="1.9" fill="url(#aiGrad2)"/>
                </g>
                <g className="orb orb2">
                  <circle className="dot" cx="24" cy="10" r="1.6" fill="url(#aiGrad2)"/>
                </g>
              </svg>
            </span>
          ) : (
            <span className="ico"><FiRefreshCw/></span>
          )}
          <span className="txt">{thinking ? "Finding matches…" : "Refresh"}</span>
        </button>
      </div>

      <ul className={`sugg-list ${thinking ? "is-dim" : ""}`} role="list">
        {(thinking ? Array.from({ length: 5 }, (_, i) => ({ id:`sk-${i}`, skel:true })) : shown).map(it => (
          <li key={it.id} className={`sugg-li ${it.skel ? "is-skel" : ""}`}>
            <button
              className="sugg-card"
              type="button"
              onClick={() => !it.skel && onOpen?.(it.id)}
              aria-label={it.skel ? "Loading…" : `Open profile of ${it.name}`}
            >
              <span
                className="sugg-avatar"
                aria-hidden="true"
                style={it.photo ? { backgroundImage:`url(${it.photo})` } : {}}
              >
                {!it.photo && !it.skel ? <span className="inits">{initials(it.name)}</span> : null}
              </span>
              <span className="sugg-meta">
                <span className="nm" title={it.name || ""}>{it.name || "—"}</span>
                {!it.skel ? (
                  <>
                    <span className={`role ${it.role || "attendee"}`}>{it.role || "attendee"}</span>
                    {it.tag ? <span className="tag">{it.tag}</span> : null}
                  </>
                ) : (
                  <>
                    <span className="skl-ln" />
                    <span className="skl-ln" style={{width:"60%"}} />
                  </>
                )}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}



/* ------------------------ ROW ------------------------ */
function MeetingRow({
  m,myId,onReschedule,onReject,onConfirm,onCancel,onDelete,onMessage
}) {
  const iAmSender=(m?.senderId||"")===myId;
  const otherId=m?.receiverId||"";
  const st=statusMeta(m?.status);
  const showSlot=m?.status==="rescheduled"?m?.proposedNewAt:m?.slotISO;
  const day=fmtDay(showSlot||m?.slotISO||m?.requestedAt);
  const time=fmtTime(showSlot||m?.slotISO||m?.requestedAt);

  const otherName = m?.receiverName || DEMO_ACTORS[otherId]?.name || "—";
  const otherPhoto = m?.receiverPhoto || DEMO_ACTORS[otherId]?.photo || "";

  const Buttons=()=>{const s=String(m?.status||"").toLowerCase();
    if(s==="pending"){
      return(<>
        <button className="mtg-btn -ghost" onClick={()=>onReschedule(m)}><FiRefreshCw/> Reschedule</button>
        <button className="mtg-btn -danger" onClick={()=>onReject(m)}><FiXCircle/> Reject</button>
        <button className="mtg-btn -ghost" onClick={()=>onMessage(m)}><FiMessageSquare/> Message</button>
      </>);
    }
    if(s==="rescheduled"){
      return iAmSender?(
        <>
          <button className="mtg-btn -ghost" onClick={()=>onCancel(m)}><FiXCircle/> Cancel</button>
          <button className="mtg-btn -danger" onClick={()=>onReject(m)}><FiXCircle/> Reject</button>
          <button className="mtg-btn -ghost" onClick={()=>onMessage(m)}><FiMessageSquare/> Message</button>
        </>
      ):(
        <>
          <button className="mtg-btn -confirm" onClick={()=>onConfirm(m)}><FiCheckCircle/> Confirm</button>
          <button className="mtg-btn -danger" onClick={()=>onReject(m)}><FiXCircle/> Reject</button>
          <button className="mtg-btn -ghost" onClick={()=>onMessage(m)}><FiMessageSquare/> Message</button>
        </>
      );
    }
    if(s==="confirmed"){
      return(<>
        <button className="mtg-btn -ghost" onClick={()=>onReschedule(m)}><FiRefreshCw/> Reschedule</button>
        <button className="mtg-btn -danger" onClick={()=>onCancel(m)}><FiXCircle/> Cancel</button>
        <button className="mtg-btn -ghost" onClick={()=>onMessage(m)}><FiMessageSquare/> Message</button>
      </>);
    }
    if(s==="rejected"){
      return iAmSender?(
        <button className="mtg-btn -ghost" onClick={()=>onMessage(m)}><FiMessageSquare/> Message</button>
      ):(
        <>
          <button className="mtg-btn -ghost" onClick={()=>onMessage(m)}><FiMessageSquare/> Message</button>
          <button className="mtg-btn -warn" onClick={()=>onDelete(m)}><FiTrash2/> Delete</button>
        </>
      );
    }
    if(s==="cancelled"||s==="canceled"){
      return(<>
        <button className="mtg-btn -ghost" onClick={()=>onMessage(m)}><FiMessageSquare/> Message</button>
        {!iAmSender?<button className="mtg-btn -warn" onClick={()=>onDelete(m)}><FiTrash2/> Delete</button>:null}
      </>);
    }
    return <button className="mtg-btn -ghost" onClick={()=>onMessage(m)}><FiMessageSquare/> Message</button>;
  };

  return (
    <article className="mtg-item" tabIndex={0}>
      <div className="mtg-ctl">
        <Buttons/>
      </div>

      <div className="mtg-left">
        <div className="mtg-avatar" aria-hidden="true">
          {otherPhoto?<img src={otherPhoto} alt=""/>:<span className="mtg-initials">{initials(otherName)}</span>}
        </div>
      </div>

      <div className="mtg-mid">
        <div className="mtg-topline">
          <h3 className="mtg-name" title={otherName}>{otherName}</h3>
          <span className={`mtg-status ${st.className}`}>{st.label}</span>
        </div>

        <div className="mtg-row">
          <span className="mtg-chip"><FiUser/> Receiver ({m?.receiverRole||"—"})</span>
          <span className="mtg-chip"><FiTag/> {compactB2X(m?.purpose||m?.subject||"—")}</span>
        </div>

        <div className="mtg-row">
          <span className="mtg-chip"><FiCalendar/> {day}</span>
          <span className="mtg-chip"><FiClock/> {time}</span>
          <span className="mtg-chip"><FiCornerUpRight/> {(m?.senderId===myId)?"Sent by you":"Received by you"}</span>
        </div>

        <div className="mtg-row"><span className="mtg-chip -muted"><FiMail/> {m?.subject||"—"}</span></div>

        <EventMini eventId={m?.eventId} fallback={DEMO_EVENTS[m?.eventId]}>
          {(ev)=>{
            const titleTrim = trimWords(ev?.title||"—", 10);
            return (
              <div className="mtg-row">
                <a className="mtg-evt" href={`/event/${m?.eventId||ev?.id||""}`}>
                  <strong className="evt-title" title={ev?.title||"—"}>{titleTrim}</strong>
                  {whereStr(ev) ? <span className="mtg-evt-sub"><FiMapPin/> {whereStr(ev)}</span> : null}
                </a>
              </div>
            );
          }}
        </EventMini>
      </div>
    </article>
  );
}

/* ------------------------ MAIN PAGE ------------------------ */
export default function MeetingsPage({ currentUserId }) {
  const navigate= useNavigate();
  const { data, isLoading, isError } = useGetMeetingsQuery();

  const items = useMemo(()=>{
    const arr = Array.isArray(data?.items)? data.items : DEMO_MEETINGS;
    return arr.filter(Boolean);
  },[data]);

  const myId=currentUserId||DEMO_MY_ID;

  // Handlers (wire your real mutations here)
  const onReschedule=(m)=>{const when=m?.slotISO?`${fmtDay(m.slotISO)} ${fmtTime(m.slotISO)}`:"the original slot";alert(`Reschedule request\n\nWith: ${m?.receiverId}\nWas: ${when}\n\nTODO: open reschedule flow.`);};
  const onReject=(m)=>{const s=String(m?.status||"").toLowerCase();const msg=s==="rescheduled"?"You’re rejecting the proposed time. They’ll be notified by email.":"You’re rejecting this meeting. The other party will be notified by email.";alert(msg);};
  const onConfirm=(m)=>{alert("Confirming the proposed time. A confirmation email will be sent to both parties.")};
  const onCancel=(m)=>{alert("Cancelling the meeting. The other party will receive an email notification.")};
  const onDelete=(m)=>{alert("Delete this thread from your list?\n\nWarning: If you delete it, the sender can send a new request again.\nYou can still check email history.");};
  const onMessage=(m)=>{const st=String(m?.status||"").toLowerCase();
    const note=st==="pending"?"Request is pending — add context and check email for updates."
      :st==="rescheduled"?"A new time was proposed — confirm or suggest another time. Check email."
      :st==="confirmed"?"Meeting confirmed. Room/time are in your email."
      :st==="rejected"?"Request was rejected. You can message for clarification. Check email."
      :(st==="cancelled"||st==="canceled")?"Meeting cancelled. You may message to follow up. Check email."
      :"Message the other party. Check email for system notifications.";
    alert(note);
  };

  return (
    <>
      <HeaderShell top={topbar} nav={nav} cta={cta} />
      <main className="mtg">
        <div className="container">
          <div className="mtg-head">
            <button className="mtg-back" onClick={()=>navigate(-1)}><FiChevronLeft/> Return</button>
            <h1 className="mtg-title">Meetings</h1>
            <div className="mtg-spacer"/>
          </div>

          {/* AI Suggestions (open profile/:id) */}
          <SuggestionsStrip myId={myId} onOpen={(actorId)=>navigate(`/profile/${actorId}`)} />

          {isLoading?(
            <div className="mtg-list">
              {Array.from({length:4}).map((_,i)=><div key={i} className="mtg-item skel"/>)}
            </div>
          ):isError?(
            <div className="mtg-list">
              {DEMO_MEETINGS.map((m)=><MeetingRow key={m.id} m={m} myId={myId}
                onReschedule={onReschedule} onReject={onReject} onConfirm={onConfirm}
                onCancel={onCancel} onDelete={onDelete} onMessage={onMessage}/>)}
            </div>
          ):!items.length?(
            <div className="mtg-empty">No meetings yet.</div>
          ):(
            <div className="mtg-list">
              {items.map((m)=>(
                <MeetingRow key={m.id||m._id} m={m} myId={myId}
                  onReschedule={onReschedule} onReject={onReject} onConfirm={onConfirm}
                  onCancel={onCancel} onDelete={onDelete} onMessage={onMessage}/>
              ))}
            </div>
          )}
        </div>
      </main>
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
