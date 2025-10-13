import React,{useMemo,useState}from"react";
import{useParams,useNavigate,useSearchParams}from"react-router-dom";
import{FiChevronLeft,FiShield,FiCreditCard,FiCheck,FiAlertCircle,FiCalendar,FiTag,FiMapPin}from"react-icons/fi";
import{useGetTicketsQuery,useBuyTicketMutation,useGetEventQuery}from"../../features/events/eventsApiSlice";
import"./ticket-purchase.css";
import Footer from "../../components/footer/Footer";
import { cta, footerData, nav, topbar } from "../main.mock";
import HeaderShell from "../../components/layout/HeaderShell";

const demoTickets=[{id:"t_silver",type:"silver-delegate",name:"Silver Delegate",price:99,currency:"USD",description:"Access to all keynotes__Expo floor access__Community lounge__Email support"},{id:"t_vip",type:"vip-business",name:"VIP Business",price:299,currency:"USD",description:"Priority seating__VIP lounge__Speaker meet & greet__Concierge support"},{id:"t_exh",type:"exhibitor",name:"Exhibitor",price:899,currency:"USD",description:"3x3m booth__2 exhibitor passes__Lead scanner__Listing in catalogue"}];
const demoEvent={title:"Global Innovation Tech Summit",startDate:new Date().toISOString(),endDate:new Date(Date.now()+86400000).toISOString(),venueName:"Expo Center",city:"Casablanca",country:"Morocco"};

export default function TicketCheckout(){
  const Navigate=useNavigate();
  const{eventId="",typeId=""}=useParams();
  useSearchParams(); // reserved for later (?created etc.)

  // Event mini (title + time + place)
  const{data:evMini}=useGetEventQuery?.(eventId,{skip:!eventId})??{data:null};
  const ev=useMemo(()=>{
    const e=evMini||{};
    if(!e?.title)return demoEvent;
    return e;
  },[evMini]);

  // Tickets
  const{data:tkData}=useGetTicketsQuery?.(eventId,{skip:!eventId})??{data:null};
  const tickets=useMemo(()=>{
    if(tkData?.tickets?.length)return tkData.tickets;
    return demoTickets;
  },[tkData]);

  const sel=useMemo(()=>{
    const f=tickets.find(t=>(t._id||t.id)===typeId);
    return f||tickets[0];
  },[tickets,typeId]);

  const [buy,{isLoading:buying}]=useBuyTicketMutation?.()??[async()=>({error:{message:"demo"}}),{isLoading:false}];

  // form state
  const[f,setF]=useState({name:"",card:"",exp:"",cvc:"",country:"US",email:"",agree:false,message:""});
  const[err,setErr]=useState("");const[ok,setOk]=useState(false);

  const v={name:f.name.trim().length>=3,card:/^\d{12,19}$/.test(f.card.replace(/\s+/g,"")),exp:/^(0[1-9]|1[0-2])\/\d{2}$/.test(f.exp),cvc:/^\d{3,4}$/.test(f.cvc),email:/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email),agree:f.agree===true};
  const canPay=v.name&&v.card&&v.exp&&v.cvc&&v.email&&v.agree&&!buying;

  const onChange=k=>e=>{
    const val=e?.target?.type==="checkbox"?e.target.checked:e?.target?.value??e;
    setF(s=>({...s,[k]:val}));
  };

  const fmtDate=(s,e)=>{
    try{
      const S=s?new Date(s):null;const E=e?new Date(e):null;
      if(!S&&!E)return"";
      const md=d=>new Intl.DateTimeFormat(undefined,{month:"short",day:"numeric"}).format(d);
      const withY=d=>new Intl.DateTimeFormat(undefined,{month:"short",day:"numeric",year:"numeric"}).format(d);
      if(S&&E){
        const sameY=S.getFullYear()===E.getFullYear();
        const sameM=sameY&&S.getMonth()===E.getMonth();
        return sameM?`${md(S)} – ${new Intl.DateTimeFormat(undefined,{day:"numeric"}).format(E)}, ${S.getFullYear()}`:`${withY(S)} – ${withY(E)}`;
      }
      return withY(S||E);
    }catch{return""}
  };

  const onPay=async e=>{
    e.preventDefault();setErr("");setOk(false);
    if(!canPay){setErr("Please complete the required fields and accept the terms.");return;}
    try{
      const payload={eventId,ticketTypeId:sel._id||sel.id,amount:sel.price,currency:sel.currency||"USD",card:{holder:f.name,number:f.card.replace(/\s+/g,""),exp:f.exp,cvc:f.cvc,country:f.country},contact:{email:f.email,note:f.message||""}};
      const res=await buy(payload);
      if(res?.error){setErr(res.error?.data?.message||res.error?.message||"Payment failed. Please try again.");return;}
      setOk(true);setTimeout(()=>Navigate(-1,{state:{created:true}}),1200);
    }catch(ex){setErr(ex?.message||"Payment failed. Please try again.");}
  };

  const points=useMemo(()=>{
    const raw=sel?.description||"";
    const parts=raw.split(/__|\r?\n|_/g).map(s=>s.trim()).filter(Boolean);
    return parts.length?parts:[raw||"—"];
  },[sel]);

  const where=[ev?.venueName,ev?.city,ev?.country].filter(Boolean).join(" · ");
  const when=fmtDate(ev?.startDate,ev?.endDate);

  return(
    <>
      <HeaderShell top={topbar} nav={nav} cta={cta} />

    <main className="tp">
      <div className="container">
        <div className="tp-grid">
          {/* Event summary (TOP) */}
          <section className="tp-event tp-card">
            <div className="tp-event-left">
              <h2 className="tp-event-title">{ev?.title||"—"}</h2>
              <div className="tp-event-meta">
                {when?(<span className="tp-chip"><FiCalendar/>{when}</span>):null}
                {where?(<span className="tp-chip"><FiMapPin/>{where}</span>):null}
              </div>
            </div>
            <div className="tp-event-right">
              <span className="tp-price-big">{fmt(sel?.price,sel?.currency||"USD")}</span>
            </div>
          </section>

          {/* Utility bar (Back + Secure) */}
          <section className="tp-util tp-card">
            <button type="button" className="tp-back" onClick={()=>Navigate(-1)}><FiChevronLeft/> Back</button>
            <div className="tp-secure"><FiShield/> Payments are processed over a secure connection</div>
          </section>

          {/* LEFT: FORM */}
          <form className="tp-form" onSubmit={onPay} noValidate>
            <section className="tp-card">
              <h3 className="tp-sec-title"><FiCreditCard/> Card details</h3>

              <div className="tp-row">
                <div className={`tp-field ${!f.name||v.name?"":"-bad"}`}>
                  <label className="tp-lab">Cardholder name</label>
                  <input value={f.name} onChange={onChange("name")} placeholder="e.g. Alex Johnson" autoComplete="cc-name"/>
                </div>
                <div className={`tp-field ${!f.email||v.email?"":"-bad"}`}>
                  <label className="tp-lab">Receipt email</label>
                  <input value={f.email} onChange={onChange("email")} placeholder="you@example.com" type="email" autoComplete="email"/>
                </div>
              </div>

              <div className="tp-row">
                <div className={`tp-field ${!f.card||v.card?"":"-bad"}`}>
                  <label className="tp-lab">Card number</label>
                  <input value={f.card} onChange={onChange("card")} inputMode="numeric" placeholder="1234 5678 9012 3456" autoComplete="cc-number"/>
                </div>
                <div className="tp-row">
                  <div className={`tp-field ${!f.exp||v.exp?"":"-bad"}`}>
                    <label className="tp-lab">Expiry (MM/YY)</label>
                    <input value={f.exp} onChange={onChange("exp")} placeholder="MM/YY" autoComplete="cc-exp"/>
                  </div>
                  <div className={`tp-field ${!f.cvc||v.cvc?"":"-bad"}`}>
                    <label className="tp-lab">CVC</label>
                    <input value={f.cvc} onChange={onChange("cvc")} inputMode="numeric" placeholder="CVC" autoComplete="cc-csc"/>
                  </div>
                </div>
              </div>

              <div className="tp-row">
                <div className="tp-field">
                  <label className="tp-lab">Billing country</label>
                  <div className="tp-selectwrap">
                    <select value={f.country} onChange={onChange("country")} className="tp-select">
                      <option value="US">United States</option>
                      <option value="GB">United Kingdom</option>
                      <option value="FR">France</option>
                      <option value="DE">Germany</option>
                      <option value="MA">Morocco</option>
                      <option value="AE">UAE</option>
                      <option value="SA">Saudi Arabia</option>
                      <option value="EG">Egypt</option>
                      <option value="TR">Türkiye</option>
                      <option value="IN">India</option>
                      <option value="CN">China</option>
                      <option value="JP">Japan</option>
                    </select>
                  </div>
                </div>
               
              </div>

              {err?(<div className="tp-error"><FiAlertCircle/>{err}</div>):null}
              {ok?(
                <div className="tp-success">
                  <div className="tp-success-badge"><FiCheck/></div>
                  <div><strong>Payment successful.</strong><br/>Your ticket is being issued…</div>
                </div>
              ):null}
            </section>

            {/* Bottom row inside form: checkbox + pay */}
            <div className="tp-checks">
              <label className="tp-check"><input type="checkbox" checked={f.agree} onChange={onChange("agree")}/>I agree to the Terms & Refund Policy.</label>
            </div>
            <div className="tp-actions">
              <button className="tp-btn tp-primary" type="submit" disabled={!canPay}>{buying?"Processing…":`Pay ${fmt(sel.price,sel.currency)}`}</button>
            </div>
          </form>

          {/* RIGHT: SUMMARY */}
          <aside className="tp-summary">
            <div className="tp-card">
              <div className="tp-s-row">
                <span className="tp-tag"><FiCalendar/> Event</span>
                <span className="tp-price">{fmt(sel.price,sel.currency)}</span>
              </div>
              <h4 className="tp-name">{sel?.name||"—"}</h4>
              <div className="tp-s-row" style={{marginBottom:10}}>
                <span className="tp-tag little-text"><FiTag/> {sel?.type||"ticket"}</span>
                <span className="tp-small">{ev?.title?ev.title:"Demo event"}</span>
              </div>
              <ul className="tp-points">{points.map((p,i)=>(<li key={i}><FiCheck/>{p}</li>))}</ul>
              <p className="tp-small">You’ll receive an email receipt and a link to manage your ticket.</p>
            </div>
          </aside>
        </div>
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

function fmt(n,c="USD"){
  try{return new Intl.NumberFormat(undefined,{style:"currency",currency:c}).format(Number(n||0));}
  catch{return`${n} ${c}`;}
}
