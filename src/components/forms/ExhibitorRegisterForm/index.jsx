import React,{useEffect} from "react";
import "./exhibitor-register.css";
import { useExhibitorRegisterMutation } from "../../../features/auth/authApiSlice";
import { useGetAttendeeFormQuery } from "../../../features/Actor/toolsApiSlice";
import { useNavigate } from "react-router-dom";
const URL_RX = /^https?:\/\/[\w.-]+/i;
const EMAIL_RX = /^[\w.-]+@[\w.-]+\.\w{2,}$/i;

/** Server-provided lists (if present), else fallback */
const FALLBACKS = {
  industries: ["Technology","Agritech","Health","Education","Manufacturing","Energy","Other"],
  businessModels: ["B2B","B2C","Both"],                         // model enum
  boothSizes: ["Small","Medium","Large"],                        // model enum
  techLevels: ["Low-tech","High-tech","Deep-tech"],             // model enum
  productTags: ["Software","Hardware","Cloud","AI/ML","IoT","Security","FinTech","HealthTech","AgriTech"],
  partnerTypes: ["Resellers","Distributors","System Integrators","Investors","Media","Recruiters"],
  targetSectors: ["Public Sector","Finance","Healthcare","Education","Agriculture","Energy","Retail","Manufacturing"],
  exportMarkets: ["MENA","EU","NA","SSA","APAC","LATAM"],
  regions: ["MENA","EU","NA","SSA","APAC"],                      // for regionInterest
  languages: ["en","fr","ar"],
};

function Field({ id, label, required, hint, error, children, full }) {
  return (
    <div className={`xr-field ${full ? "xr-span2" : ""} ${error ? "has-error" : ""}`}>
      {label && (
        <label className="xr-label" htmlFor={id}>
          {label} {required && <span className="req">*</span>}
        </label>
      )}
      {children}
      {hint && !error && <div className="xr-hint">{hint}</div>}
      {error && <div className="xr-error">{error}</div>}
    </div>
  );
}

function Chips({ value = [], options = [], onToggle, loading }) {
  if (loading) return <div className="xr-skeleton-chips" />;
  return (
    <div className="xr-chips">
      {options.map((o) => {
        const on = value.includes(o);
        return (
          <button
            type="button"
            key={o}
            className={`chip ${on ? "on" : ""}`}
            onClick={() => onToggle(o)}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}

export default function ExhibitorRegisterForm({ eventId, onSuccess }) {
  // Reuse the attendee form options endpoint for shared vocabularies
  const { data: formData, isLoading: isLoadingForm } = useGetAttendeeFormQuery();
  const opts = {
    industries: formData?.industries?.length ? formData.industries : FALLBACKS.industries,
    businessModels: FALLBACKS.businessModels, // enum is fixed by model
    boothSizes: FALLBACKS.boothSizes,         // enum is fixed by model
    techLevels: FALLBACKS.techLevels,         // enum is fixed by model
    productTags: formData?.tags?.length ? formData.tags : FALLBACKS.productTags,
    partnerTypes: formData?.partnerTypes?.length ? formData.partnerTypes : FALLBACKS.partnerTypes,
    targetSectors: formData?.targetSectors?.length ? formData.targetSectors : FALLBACKS.targetSectors,
    exportMarkets: formData?.regions?.length ? formData.regions : FALLBACKS.exportMarkets,
    regions: formData?.regions?.length ? formData.regions : FALLBACKS.regions,
    languages: formData?.languages?.length ? formData.languages : FALLBACKS.languages,
  };

  const [registerExhibitor, { isLoading, isSuccess, error }] = useExhibitorRegisterMutation();
const navigate = useNavigate();
    useEffect(() => {
      if (isSuccess) {
        // Close the modal on success
        navigate({
          pathname: '/',
          search: '?verification=false',
        });
      }
    }, [isSuccess]);
  const [form, setForm] = React.useState({
    /* A. Identity & Contact */
    exhibitorName: "", orgName: "", orgWebsite: "",
    country: "", city: "", contactName: "", email: "", phone: "",
    /* B. Booth & Logistics */
    boothNumber: "", boothSize: "", needsEquipment: false, liveDemo: false,
    /* C. Business & Market */
    industry: "", subIndustry: "", businessModel: "", productTags: [],
    techLevel: "", exportMarkets: [],
    /* D. Commercial & Match */
    offering: "", lookingFor: "", lookingPartners: true, partnerTypes: [],
    targetSectors: [], regionInterest: [], availableMeetings: true, preferredLanguages: [],
    /* E. Value Adds */
    innovationFocus: "", sustainabilityFocus: "", investmentSeeking: false,
    investmentRange: "", productBrochure: "", acceptDemoRequests: true,
    /* Auth & event */
    pwd: "", id_event: eventId || "",
    /* UI */
    agree: false,
  });

  React.useEffect(() => {
    if (isLoadingForm) return;
    // set a default language if not set
    setForm((s) =>
      s.preferredLanguages?.length ? s : { ...s, preferredLanguages: [opts.languages[0]] }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoadingForm]);

  const [touched, setTouched] = React.useState({});
  const setVal = (k, v) => setForm((s) => ({ ...s, [k]: v }));
  const touch = (k) => setTouched((t) => ({ ...t, [k]: true }));
  const toggleInArray = (key, item) =>
    setForm((s) => {
      const set = new Set(s[key]);
      set.has(item) ? set.delete(item) : set.add(item);
      return { ...s, [key]: Array.from(set) };
    });

  const serverErr =
    (error && (error.data?.message || error.error || "Registration failed")) || "";

  // Validation exactly per schema
  const validate = () => {
    const e = {};
    // A
    if (!form.exhibitorName.trim()) e.exhibitorName = "Exhibitor/stand name is required.";
    if (!form.orgName.trim()) e.orgName = "Organization (legal business) is required.";
    if (!form.country.trim()) e.country = "Country is required.";
    if (!form.contactName.trim()) e.contactName = "Contact name is required.";
    if (!EMAIL_RX.test(form.email)) e.email = "Valid email is required.";
    if (form.orgWebsite && !URL_RX.test(form.orgWebsite)) e.orgWebsite = "Must be a valid URL.";
    // B
    if (!opts.boothSizes.includes(form.boothSize)) e.boothSize = "Select a booth size.";
    // C
    if (!form.industry) e.industry = "Industry is required.";
    if (!opts.businessModels.includes(form.businessModel)) e.businessModel = "Select a business model.";
    if (form.techLevel && !opts.techLevels.includes(form.techLevel)) e.techLevel = "Invalid tech level.";
    // D
    if (!form.offering.trim()) e.offering = "Offering is required.";
    if (!form.lookingFor.trim()) e.lookingFor = "Looking for is required.";
    if (typeof form.lookingPartners !== "boolean") e.lookingPartners = "Required.";
    if (!form.regionInterest.length) e.regionInterest = "Select at least one region.";
    if (typeof form.availableMeetings !== "boolean") e.availableMeetings = "Required.";
    // E
    if (form.investmentSeeking && (form.investmentRange === "" || Number(form.investmentRange) < 0))
      e.investmentRange = "Enter a valid non-negative number.";
    if (form.productBrochure && !URL_RX.test(form.productBrochure))
      e.productBrochure = "Must be a valid URL.";
    // Auth & event
    if (!form.pwd || form.pwd.length < 8) e.pwd = "Password must be at least 8 characters.";
    if (!(form.id_event || eventId)) e.id_event = "Event ID is required.";
    if (!form.agree) e.agree = "You must accept the terms.";
    return e;
  };
  const v = validate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setTouched((t) => ({
      ...t,
      exhibitorName: true, orgName: true, country: true, contactName: true, email: true,
      boothSize: true, industry: true, businessModel: true,
      offering: true, lookingFor: true, regionInterest: true, availableMeetings: true,
      pwd: true, id_event: true, agree: true,
    }));
    if (Object.keys(v).length) return;

    const payload = {
      
        exhibitorName: form.exhibitorName.trim(),
        orgName: form.orgName.trim(),
        orgWebsite: form.orgWebsite || undefined,
        country: form.country.trim(),
        city: form.city || undefined,
        contactName: form.contactName.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone || undefined,
      
      
        boothNumber: form.boothNumber || undefined,
        boothSize: form.boothSize,
        needsEquipment: !!form.needsEquipment,
        liveDemo: !!form.liveDemo,
      
      
        industry: form.industry,
        subIndustry: form.subIndustry || undefined,
        businessModel: form.businessModel,
        productTags: form.productTags,
        techLevel: form.techLevel || undefined,
        exportMarkets: form.exportMarkets,
      
     
        offering: form.offering.trim(),
        lookingFor: form.lookingFor.trim(),
        lookingPartners: !!form.lookingPartners,
        partnerTypes: form.partnerTypes,
        targetSectors: form.targetSectors,
        regionInterest: form.regionInterest,
        availableMeetings: !!form.availableMeetings,
        preferredLanguages: form.preferredLanguages?.length ? form.preferredLanguages : [opts.languages[0]],
      
      
        innovationFocus: form.innovationFocus || undefined,
        sustainabilityFocus: form.sustainabilityFocus || undefined,
        investmentSeeking: !!form.investmentSeeking,
        investmentRange:
          form.investmentSeeking && form.investmentRange !== "" ? Number(form.investmentRange) : undefined,
        productBrochure: form.productBrochure || undefined,
        acceptDemoRequests: !!form.acceptDemoRequests,
      
      pwd: form.pwd,
      eventId: eventId || form.id_event,
      type: "exhibitor",
    };

    try {
      const res = await registerExhibitor(payload).unwrap();

      // Confirmation email (placeholder)
      

      onSuccess?.(res);
    } catch (_) {
      /* handled by serverErr */
    }
  };

  return (
    <form className="xr-card xr-elevated" onSubmit={onSubmit} noValidate>
      <header className="xr-head">
        <h1 className="xr-title">Register as Exhibitor</h1>
        <p className="xr-sub">Tell us about your company and exhibit needs.</p>
      </header>

      {/* A. Identity & Contact */}
      <h2 className="xr-section">A. Identity & Contact</h2>
      <div className="xr-grid">
        <Field id="exhibitorName" label="Exhibitor / Stand name" required error={touched.exhibitorName && v.exhibitorName}>
          <input id="exhibitorName" className="xr-input" value={form.exhibitorName} onChange={e=>setVal("exhibitorName", e.target.value)} onBlur={()=>touch("exhibitorName")} />
        </Field>
        <Field id="orgName" label="Organization (legal)" required error={touched.orgName && v.orgName}>
          <input id="orgName" className="xr-input" value={form.orgName} onChange={e=>setVal("orgName", e.target.value)} onBlur={()=>touch("orgName")} />
        </Field>
        <Field id="orgWebsite" label="Website" hint="http/https" error={touched.orgWebsite && v.orgWebsite}>
          <input id="orgWebsite" className="xr-input" value={form.orgWebsite} onChange={e=>setVal("orgWebsite", e.target.value)} onBlur={()=>touch("orgWebsite")} />
        </Field>
        <Field id="country" label="Country" required error={touched.country && v.country}>
          <input id="country" className="xr-input" value={form.country} onChange={e=>setVal("country", e.target.value)} onBlur={()=>touch("country")} />
        </Field>
        <Field id="city" label="City">
          <input id="city" className="xr-input" value={form.city} onChange={e=>setVal("city", e.target.value)} />
        </Field>
        <Field id="contactName" label="Contact name" required error={touched.contactName && v.contactName}>
          <input id="contactName" className="xr-input" value={form.contactName} onChange={e=>setVal("contactName", e.target.value)} onBlur={()=>touch("contactName")} />
        </Field>
        <Field id="email" label="Email" required error={touched.email && v.email}>
          <input id="email" className="xr-input" type="email" value={form.email} onChange={e=>setVal("email", e.target.value)} onBlur={()=>touch("email")} />
        </Field>
        <Field id="phone" label="Phone">
          <input id="phone" className="xr-input" type="tel" value={form.phone} onChange={e=>setVal("phone", e.target.value)} />
        </Field>
      </div>

      {/* B. Booth & Logistics */}
      <h2 className="xr-section">B. Booth & Logistics</h2>
      <div className="xr-grid">
        <Field id="boothNumber" label="Booth number">
          <input id="boothNumber" className="xr-input" value={form.boothNumber} onChange={e=>setVal("boothNumber", e.target.value)} />
        </Field>
        <Field id="boothSize" label="Booth size" required error={touched.boothSize && v.boothSize}>
          <select id="boothSize" className="xr-input" value={form.boothSize} onChange={e=>setVal("boothSize", e.target.value)} onBlur={()=>touch("boothSize")}>
            <option value="">Select…</option>
            {opts.boothSizes.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
        <div className="xr-field">
          <label className="xr-label">Needs equipment</label>
          <label className="switch">
            <input type="checkbox" checked={form.needsEquipment} onChange={e=>setVal("needsEquipment", e.target.checked)} />
            <span>Yes</span>
          </label>
        </div>
        <div className="xr-field">
          <label className="xr-label">Live demo</label>
          <label className="switch">
            <input type="checkbox" checked={form.liveDemo} onChange={e=>setVal("liveDemo", e.target.checked)} />
            <span>Yes</span>
          </label>
        </div>
      </div>

      {/* C. Business & Market */}
      <h2 className="xr-section">C. Business & Market</h2>
      <div className="xr-grid">
        <Field id="industry" label="Industry" required error={touched.industry && v.industry}>
          <select id="industry" className="xr-input" value={form.industry} onChange={e=>setVal("industry", e.target.value)} onBlur={()=>touch("industry")}>
            <option value="">Select…</option>
            {opts.industries.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
        </Field>
        <Field id="subIndustry" label="Sub-industry">
          <input id="subIndustry" className="xr-input" value={form.subIndustry} onChange={e=>setVal("subIndustry", e.target.value)} />
        </Field>
        <Field id="businessModel" label="Business model" required error={touched.businessModel && v.businessModel}>
          <select id="businessModel" className="xr-input" value={form.businessModel} onChange={e=>setVal("businessModel", e.target.value)} onBlur={()=>touch("businessModel")}>
            <option value="">Select…</option>
            {opts.businessModels.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </Field>

        <Field label="Product tags" full>
          <Chips value={form.productTags} options={opts.productTags} onToggle={(o)=>toggleInArray("productTags", o)} loading={isLoadingForm} />
        </Field>

        <Field id="techLevel" label="Tech level">
          <select id="techLevel" className="xr-input" value={form.techLevel} onChange={e=>setVal("techLevel", e.target.value)}>
            <option value="">Select…</option>
            {opts.techLevels.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>

        <Field label="Export markets" full>
          <Chips value={form.exportMarkets} options={opts.exportMarkets} onToggle={(o)=>toggleInArray("exportMarkets", o)} loading={isLoadingForm} />
        </Field>
      </div>

      {/* D. Commercial & Match */}
      <h2 className="xr-section">D. Commercial & Match</h2>
      <div className="xr-grid">
        <Field id="offering" label="What are you offering?" required error={touched.offering && v.offering}>
          <textarea id="offering" className="xr-textarea" rows={3} value={form.offering} onChange={e=>setVal("offering", e.target.value)} onBlur={()=>touch("offering")} />
        </Field>
        <Field id="lookingFor" label="What are you looking for?" required error={touched.lookingFor && v.lookingFor}>
          <textarea id="lookingFor" className="xr-textarea" rows={3} value={form.lookingFor} onChange={e=>setVal("lookingFor", e.target.value)} onBlur={()=>touch("lookingFor")} />
        </Field>

        <div className={`xr-field ${touched.lookingPartners && v.lookingPartners ? "has-error" : ""}`}>
          <div className="xr-label">Looking for partners? <span className="req">*</span></div>
          <div className="xr-inline">
            <label className="radio">
              <input type="radio" name="partners" checked={!!form.lookingPartners} onChange={()=>setVal("lookingPartners", true)} />
              <span>Yes</span>
            </label>
            <label className="radio">
              <input type="radio" name="partners" checked={!form.lookingPartners} onChange={()=>setVal("lookingPartners", false)} />
              <span>No</span>
            </label>
          </div>
          {touched.lookingPartners && v.lookingPartners && <div className="xr-error">{v.lookingPartners}</div>}
        </div>

        <Field label="Partner types" full>
          <Chips value={form.partnerTypes} options={opts.partnerTypes} onToggle={(o)=>toggleInArray("partnerTypes", o)} loading={isLoadingForm} />
        </Field>

        <Field label="Target sectors" full>
          <Chips value={form.targetSectors} options={opts.targetSectors} onToggle={(o)=>toggleInArray("targetSectors", o)} loading={isLoadingForm} />
        </Field>

        <div className={`xr-field xr-span2 ${touched.regionInterest && v.regionInterest ? "has-error" : ""}`}>
          <div className="xr-label">Region interest <span className="req">*</span></div>
          <Chips value={form.regionInterest} options={opts.regions} onToggle={(o)=>toggleInArray("regionInterest", o)} loading={isLoadingForm} />
          {touched.regionInterest && v.regionInterest && <div className="xr-error">{v.regionInterest}</div>}
        </div>

        <div className={`xr-field ${touched.availableMeetings && v.availableMeetings ? "has-error" : ""}`}>
          <div className="xr-label">Available for meetings? <span className="req">*</span></div>
          <div className="xr-inline">
            <label className="radio">
              <input type="radio" name="meet" checked={!!form.availableMeetings} onChange={()=>setVal("availableMeetings", true)} />
              <span>Yes</span>
            </label>
            <label className="radio">
              <input type="radio" name="meet" checked={!form.availableMeetings} onChange={()=>setVal("availableMeetings", false)} />
              <span>No</span>
            </label>
          </div>
          {touched.availableMeetings && v.availableMeetings && <div className="xr-error">{v.availableMeetings}</div>}
        </div>

        <Field label="Preferred languages" full>
          <Chips value={form.preferredLanguages} options={opts.languages} onToggle={(o)=>toggleInArray("preferredLanguages", o)} loading={isLoadingForm} />
        </Field>
      </div>

      {/* E. Optional Value Adds */}
      <h2 className="xr-section">E. Optional Value Adds</h2>
      <div className="xr-grid">
        <Field id="innovationFocus" label="Innovation focus">
          <select id="innovationFocus" className="xr-input" value={form.innovationFocus} onChange={e=>setVal("innovationFocus", e.target.value)}>
            <option value="">Select…</option>
            {["Yes","No","Moderate"].map(x => <option key={x} value={x}>{x}</option>)}
          </select>
        </Field>
        <Field id="sustainabilityFocus" label="Sustainability focus">
          <select id="sustainabilityFocus" className="xr-input" value={form.sustainabilityFocus} onChange={e=>setVal("sustainabilityFocus", e.target.value)}>
            <option value="">Select…</option>
            {["Yes","No","Relevant"].map(x => <option key={x} value={x}>{x}</option>)}
          </select>
        </Field>
        <div className="xr-field">
          <label className="xr-label">Seeking investment</label>
          <label className="switch">
            <input type="checkbox" checked={form.investmentSeeking} onChange={e=>setVal("investmentSeeking", e.target.checked)} />
            <span>Yes</span>
          </label>
        </div>
        <Field
          id="investmentRange"
          label="Investment range (USD)"
          hint="Only if seeking investment"
          error={touched.investmentRange && v.investmentRange}
        >
          <input
            id="investmentRange"
            className="xr-input"
            type="number"
            min="0"
            step="1000"
            value={form.investmentRange}
            onChange={(e)=>setVal("investmentRange", e.target.value)}
            onBlur={()=>touch("investmentRange")}
            disabled={!form.investmentSeeking}
          />
        </Field>
        <Field id="productBrochure" label="Product brochure URL" hint="http/https" error={touched.productBrochure && v.productBrochure}>
          <input id="productBrochure" className="xr-input" value={form.productBrochure} onChange={e=>setVal("productBrochure", e.target.value)} onBlur={()=>touch("productBrochure")} />
        </Field>
        <div className="xr-field">
          <label className="xr-label">Accept demo requests</label>
          <label className="switch">
            <input type="checkbox" checked={form.acceptDemoRequests} onChange={e=>setVal("acceptDemoRequests", e.target.checked)} />
            <span>Yes</span>
          </label>
        </div>
      </div>

      {/* Credentials & Event */}
      <h2 className="xr-section">Credentials & Event</h2>
      <div className="xr-grid">
        <Field id="pwd" label="Password" required hint="Min 8 characters" error={touched.pwd && v.pwd}>
          <input id="pwd" className="xr-input" type="password" value={form.pwd} onChange={e=>setVal("pwd", e.target.value)} onBlur={()=>touch("pwd")} autoComplete="new-password" />
        </Field>
        {!eventId && (
          <Field id="id_event" label="Event ID" required error={touched.id_event && v.id_event}>
            <input id="id_event" className="xr-input" value={form.id_event} onChange={e=>setVal("id_event", e.target.value)} onBlur={()=>touch("id_event")} />
          </Field>
        )}
      </div>

      {/* Terms */}
      <div className={`xr-consent ${touched.agree && v.agree ? "has-error" : ""}`}>
        <label className="check">
          <input
            type="checkbox"
            checked={form.agree}
            onChange={(e)=>setVal("agree", e.target.checked)}
            onBlur={()=>touch("agree")}
          />
          <span>I agree to the Terms & Privacy Policy</span>
        </label>
        {touched.agree && v.agree && <div className="xr-error">{v.agree}</div>}
      </div>

      {/* Server states */}
      {serverErr && !isSuccess && <div className="xr-alert xr-alert-error">{serverErr}</div>}
      {isSuccess && <div className="xr-alert xr-alert-success">Exhibitor registration received. A confirmation email was sent.</div>}

      <div className="xr-actions">
        <button className="xr-btn" type="submit" disabled={isLoading || isLoadingForm}>
          {isLoading || isLoadingForm ? "Please wait…" : "Create exhibitor account"}
        </button>
      </div>
    </form>
  );
}
