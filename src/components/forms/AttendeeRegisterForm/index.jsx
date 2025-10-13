import React ,{useEffect ,useState} from "react";
import { useNavigate } from "react-router-dom";
import "./attendee-register.css";
import { useAttendeeRegisterMutation } from "../../../features/auth/authApiSlice";
import { useGetAttendeeFormQuery } from "../../../features/Actor/toolsApiSlice";

// Local safe fallbacks (used if the API returns empty / errors)
const FALLBACKS = {
  industries: ["Technology","Agritech","Health","Education","Manufacturing","Energy","Other"],
  businessModels: ["B2B","B2C","B2G"],
  sizes: ["Startup","SME","Mid-market","Enterprise"],
  objectives: ["Find buyers","Find suppliers","Partnerships","Investors","Hiring","Media exposure"],
  tags: ["AI","SaaS","FinTech","HealthTech","AgriTech","GovTech"],
  prefs: ["C-level","Product","Engineering","BD","Marketing"],
  regions: ["MENA","EU","NA","SSA","APAC"],
  languages: ["en","fr","ar"],
};

const URL_RX = /^https?:\/\/[\w.-]+/i;
const LINKEDIN_RX = /^https?:\/\/(www\.)?linkedin\.com\/.+$/i;
const EMAIL_RX = /^[\w.-]+@[\w.-]+\.\w{2,}$/i;

function Field({ id, label, required, hint, error, children, full }) {
  return (
    <div className={`ar-field ${full ? "ar-field-span2" : ""} ${error ? "has-error" : ""}`}>
      {label && (
        <label className="ar-label" htmlFor={id}>
          {label} {required && <span className="req">*</span>}
        </label>
      )}
      {children}
      {hint && !error && <div className="ar-hint">{hint}</div>}
      {error && <div className="ar-error">{error}</div>}
    </div>
  );
}

function Chips({ value = [], options = [], onToggle, loading }) {
  
  if (loading) {
    return <div className="ar-skeleton-chips" />;
  }
  return (
    <div className="ar-chips">
      {options.map((o) => {
        const on = value.includes(o);
        return (
          <button
            key={o}
            type="button"
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

export default function AttendeeRegisterForm({ eventId, onSuccess }) {
  // Load selectable options
  const { data: formData, isLoading: isLoadingForm } = useGetAttendeeFormQuery();
  const opts = {
    industries: formData?.industries?.length ? formData.industries : FALLBACKS.industries,
    businessModels: formData?.businessModels?.length ? formData.businessModels : FALLBACKS.businessModels,
    sizes: formData?.companySizes?.length ? formData.companySizes : FALLBACKS.sizes,
    objectives: formData?.objectives?.length ? formData.objectives : FALLBACKS.objectives,
    tags: formData?.tags?.length ? formData.tags : FALLBACKS.tags,
    prefs: formData?.matchPrefs?.length ? formData.matchPrefs : FALLBACKS.prefs,
    regions: formData?.regions?.length ? formData.regions : FALLBACKS.regions,
    languages: formData?.languages?.length ? formData.languages : FALLBACKS.languages,
  };

  const [registerAttendee, { isLoading, isSuccess, error }] =
    useAttendeeRegisterMutation();
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

  const [form, setForm] = useState({
    // A
     fullName: "", email: "", phone: "", country: "", city: "", linkedIn: "",
    // B
    orgName: "", orgWebsite: "", businessRole: "", department: "", decisionMaker: false,
    // C
    primaryIndustry: "", subIndustry: "", businessModel: "", companySize: "", exportReady: false,
    // D
    objectives: [], offering: "", needs: "", openToMeetings: true, availableDays: [""],
    // E
    tags: [], matchPrefs: [], regions: [], language: opts.languages?.[0] || "en", allowContact: true,
    // credentials
    pwd: "", id_event: eventId || "",
    // ui
    agree: false,
  });
  useEffect(() => {
    // if we just got languages from server and form has none, set default
    if (isLoadingForm) return;
    setForm((s) => s.language ? s : { ...s, language: opts.languages?.[0] || "en" });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoadingForm]);

  const [touched, setTouched] = useState({});
  const setVal = (k, v) => setForm(s => ({ ...s, [k]: v }));
  const touch = (k) => setTouched(t => ({ ...t, [k]: true }));
  const toggleInArray = (key, item) =>
    setForm(s => {
      const set = new Set(s[key]);
      set.has(item) ? set.delete(item) : set.add(item);
      return { ...s, [key]: Array.from(set) };
    });

  const serverErr = (error && (error.data?.message || error.error || "Registration failed")) || "";

  const validate = () => {
    const e = {};
    if (!form.fullName.trim() || form.fullName.trim().length < 2) e.fullName = "Please enter your full name.";
    if (!EMAIL_RX.test(form.email)) e.email = "Please enter a valid email address.";
    if (!form.country.trim()) e.country = "Country is required.";
    if (form.linkedIn && !LINKEDIN_RX.test(form.linkedIn)) e.linkedIn = "Must be a valid LinkedIn profile URL.";

    if (!form.orgName.trim()) e.orgName = "Organization name is required.";
    if (!form.businessRole.trim()) e.businessRole = "Business role is required.";
    if (form.orgWebsite && !URL_RX.test(form.orgWebsite)) e.orgWebsite = "Must be a valid URL (http/https).";

    if (!form.primaryIndustry) e.primaryIndustry = "Primary industry is required.";
    if (!opts.businessModels.includes(form.businessModel)) e.businessModel = "Choose a business model.";

    if (!form.objectives.length) e.objectives = "Select at least one objective.";
    if (typeof form.openToMeetings !== "boolean") e.openToMeetings = "Please choose if you’re open to meetings.";

    if (!form.pwd || form.pwd.length < 8) e.pwd = "Password must be at least 8 characters.";
    if (!(form.id_event || eventId)) e.id_event = "Event ID is required.";
    if (!form.agree) e.agree = "You must accept the terms.";
    return e;
  };
  const v = validate();

  const normalizeDates = () => {
    return (form.availableDays || [])
      .map(d => (d || "").trim())
      .filter(Boolean)
      .map(d => new Date(d))
      .filter(d => !isNaN(d.getTime()));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setTouched(prev => ({
      ...prev,
      fullName: true, email: true, country: true,
      orgName: true, businessRole: true,
      primaryIndustry: true, businessModel: true,
      objectives: true, openToMeetings: true,
      pwd: true, id_event: true, agree: true,
    }));
    if (Object.keys(v).length) return;

    const payload = {
      
        fullName: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone || undefined,
        country: form.country.trim(),
        city: form.city || undefined,
        linkedIn: form.linkedIn || undefined,
      organization: {
        orgName: form.orgName.trim(),
        orgWebsite: form.orgWebsite || undefined,
        businessRole: form.businessRole.trim(),
        department: form.department || undefined,
        decisionMaker: !!form.decisionMaker,
      },
      businessProfile: {
        primaryIndustry: form.primaryIndustry,
        subIndustry: form.subIndustry || undefined,
        businessModel: form.businessModel,
        companySize: form.companySize || undefined,
        exportReady: !!form.exportReady,
      },
      matchingIntent: {
        objectives: form.objectives,
        offering: form.offering || undefined,
        needs: form.needs || undefined,
        openToMeetings: !!form.openToMeetings,
        availableDays: normalizeDates(),
      },
      matchingAids: {
        tags: form.tags,
        matchPrefs: form.matchPrefs,
        regions: form.regions,
        language: form.language || "en",
        allowContact: !!form.allowContact,
      },
      pwd: form.pwd,
      eventId: eventId || form.id_event,
      type: "attendee",
    };

    try {
      const res = await registerAttendee(payload).unwrap();

      // Fire confirmation email (placeholder content)
      

      onSuccess?.(res);
    } catch (_) {
      // handled by serverErr
    }
  };

  const addDay = () => setForm(s => ({ ...s, availableDays: [...(s.availableDays || []), ""] }));
  const setDay = (i, v) => setForm(s => { const arr = [...s.availableDays]; arr[i] = v; return { ...s, availableDays: arr }; });
  const delDay = (i) => setForm(s => { const arr = [...s.availableDays]; arr.splice(i,1); return { ...s, availableDays: arr.length ? arr : [""] }; });

  return (
    <form className="ar-card ar-elevated" onSubmit={onSubmit} noValidate>
      <header className="ar-head">
        <h1 className="ar-title">Register as Attendee</h1>
        <p className="ar-sub">Fill in your details to unlock sessions, expo, and matchmaking.</p>
      </header>

      <h2 className="ar-section fs-5">A. Personal</h2>
      <div className="ar-grid">
        <Field id="fullName" className="fw-light" label="Full name" required error={touched.fullName && v.fullName}>
          <input id="fullName" className="ar-input" value={form.fullName} onChange={e=>setVal("fullName", e.target.value)} onBlur={()=>touch("fullName")} />
        </Field>
        <Field id="email" className="fw-light" label="Email" required error={touched.email && v.email}>
          <input id="email" className="ar-input" type="email" value={form.email} onChange={e=>setVal("email", e.target.value)} onBlur={()=>touch("email")} autoComplete="email" />
        </Field>
        <Field id="country" className="fw-light" label="Country" required error={touched.country && v.country}>
          <input id="country" className="ar-input" value={form.country} onChange={e=>setVal("country", e.target.value)} onBlur={()=>touch("country")} />
        </Field>
        <Field id="city" label="City">
          <input id="city" className="ar-input" value={form.city} onChange={e=>setVal("city", e.target.value)} />
        </Field>
        <Field id="phone" label="Phone">
          <input id="phone" className="ar-input" type="tel" value={form.phone} onChange={e=>setVal("phone", e.target.value)} />
        </Field>
        <Field id="linkedIn" label="LinkedIn" hint="https://linkedin.com/..." error={touched.linkedIn && v.linkedIn}>
          <input id="linkedIn" className="ar-input" value={form.linkedIn} onChange={e=>setVal("linkedIn", e.target.value)} onBlur={()=>touch("linkedIn")} />
        </Field>
      </div>

      <h2 className="ar-section fs-5">B. Organization & Role</h2>
      <div className="ar-grid">
        <Field id="orgName" label="Organization name" required error={touched.orgName && v.orgName}>
          <input id="orgName" className="ar-input" value={form.orgName} onChange={e=>setVal("orgName", e.target.value)} onBlur={()=>touch("orgName")} />
        </Field>
        <Field id="businessRole" label="Business role" required error={touched.businessRole && v.businessRole}>
          <input id="businessRole" className="ar-input" value={form.businessRole} onChange={e=>setVal("businessRole", e.target.value)} onBlur={()=>touch("businessRole")} placeholder="CEO, Buyer, etc." />
        </Field>
        <Field id="orgWebsite" label="Website" hint="http/https" error={touched.orgWebsite && v.orgWebsite}>
          <input id="orgWebsite" className="ar-input" value={form.orgWebsite} onChange={e=>setVal("orgWebsite", e.target.value)} onBlur={()=>touch("orgWebsite")} />
        </Field>
        <Field id="department" label="Department">
          <input id="department" className="ar-input" value={form.department} onChange={e=>setVal("department", e.target.value)} />
        </Field>
        <div className="ar-field">
          <label className="ar-label">Decision maker</label>
          <label className="switch">
            <input type="checkbox" checked={form.decisionMaker} onChange={e=>setVal("decisionMaker", e.target.checked)} />
            <span>Yes</span>
          </label>
        </div>
      </div>

      <h2 className="ar-section fs-5">C. Business Profile</h2>
      <div className="ar-grid">
        <Field id="primaryIndustry" label="Primary industry" required error={touched.primaryIndustry && v.primaryIndustry}>
          <select id="primaryIndustry" className="ar-input" value={form.primaryIndustry} onChange={e=>setVal("primaryIndustry", e.target.value)} onBlur={()=>touch("primaryIndustry")}>
            <option value="">Select…</option>
            {opts.industries.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
        </Field>
        <Field id="subIndustry" label="Sub-industry">
          <input id="subIndustry" className="ar-input" value={form.subIndustry} onChange={e=>setVal("subIndustry", e.target.value)} />
        </Field>
        <Field id="businessModel" label="Business model" required error={touched.businessModel && v.businessModel}>
          <select id="businessModel" className="ar-input" value={form.businessModel} onChange={e=>setVal("businessModel", e.target.value)} onBlur={()=>touch("businessModel")}>
            <option value="">Select…</option>
            {opts.businessModels.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </Field>
        <Field id="companySize" label="Company size">
          <select id="companySize" className="ar-input" value={form.companySize} onChange={e=>setVal("companySize", e.target.value)}>
            <option value="">Select…</option>
            {opts.sizes.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
        <div className="ar-field">
          <label className="ar-label">Export-ready</label>
          <label className="switch">
            <input type="checkbox" checked={form.exportReady} onChange={e=>setVal("exportReady", e.target.checked)} />
            <span>Yes</span>
          </label>
        </div>
      </div>

      <h2 className="ar-section fs-5">D. Matching Intent</h2>
      <div className="ar-grid">
        <div className={`ar-field ar-field-span2 ${touched.objectives && v.objectives ? "has-error" : ""}`}>
          <div className="ar-label">Objectives <span className="req">*</span></div>
          <Chips value={form.objectives} options={opts.objectives} onToggle={(o)=>toggleInArray("objectives", o)} loading={isLoadingForm} />
          {touched.objectives && v.objectives && <div className="ar-error">{v.objectives}</div>}
        </div>

        <Field id="offering" label="What are you offering?">
          <textarea id="offering" className="ar-textarea" rows={3} value={form.offering} onChange={e=>setVal("offering", e.target.value)} />
        </Field>

        <Field id="needs" label="What do you need?">
          <textarea id="needs" className="ar-textarea" rows={3} value={form.needs} onChange={e=>setVal("needs", e.target.value)} />
        </Field>

        <div className={`ar-field ${touched.openToMeetings && v.openToMeetings ? "has-error" : ""}`}>
          <div className="ar-label">Open to meetings? <span className="req">*</span></div>
          <div className="ar-inline">
            <label className="radio">
              <input type="radio" name="open" checked={!!form.openToMeetings} onChange={()=>setVal("openToMeetings", true)} />
              <span>Yes</span>
            </label>
            <label className="radio">
              <input type="radio" name="open" checked={!form.openToMeetings} onChange={()=>setVal("openToMeetings", false)} />
              <span>No</span>
            </label>
          </div>
          {touched.openToMeetings && v.openToMeetings && <div className="ar-error">{v.openToMeetings}</div>}
        </div>

        <div className="ar-field ar-field-span2">
          <div className="ar-label">Available days</div>
          <div className="dates-grid">
            {form.availableDays.map((d, i) => (
              <div className="date-row" key={i}>
                <input type="date" className="ar-input" value={d} onChange={e=>setDay(i, e.target.value)} />
                <button type="button" className="mini-btn" onClick={() => delDay(i)}>Remove</button>
              </div>
            ))}
          </div>
          <button type="button" className="mini-btn add" onClick={addDay}>+ Add date</button>
        </div>
      </div>

      <h2 className="ar-section fs-5">E. Matching Aids</h2>
      <div className="ar-grid">
        
        <Field id="language" label="Preferred language">
          <select id="language" className="ar-input" value={form.language} onChange={e=>setVal("language", e.target.value)}>
            {opts.languages.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </Field>
        <div className="ar-field">
          <label className="ar-label">Allow contact</label>
          <label className="switch">
            <input type="checkbox" checked={form.allowContact} onChange={e=>setVal("allowContact", e.target.checked)} />
            <span>Yes</span>
          </label>
        </div>
      </div>

      <h2 className="ar-section ">Credentials & Event</h2>
      <div className="ar-grid">
        <Field id="pwd" label="Password" required hint="Min 8 characters" error={touched.pwd && v.pwd}>
          <input id="pwd" className="ar-input" type="password" value={form.pwd} onChange={e=>setVal("pwd", e.target.value)} onBlur={()=>touch("pwd")} autoComplete="new-password" />
        </Field>
        
      </div>

      <div className={`ar-consent ${touched.agree && v.agree ? "has-error" : ""}`}>
        <label className="check">
          <input type="checkbox" checked={form.agree} onChange={(e)=>setVal("agree", e.target.checked)} onBlur={()=>touch("agree")} />
          <span>I agree to the Terms & Privacy Policy</span>
        </label>
        {touched.agree && v.agree && <div className="ar-error">{v.agree}</div>}
      </div>

      {serverErr && !isSuccess && <div className="ar-alert ar-alert-error">{serverErr}</div>}
      {isSuccess && <div className="ar-alert ar-alert-success">Account created. A confirmation email was sent.</div>}

      <div className="ar-actions">
        <button className="ar-btn" type="submit" disabled={isLoading || isLoadingForm}>
          {isLoading || isLoadingForm ? "Please wait…" : "Create account"}
        </button>
      </div>
    </form>
  );
}
