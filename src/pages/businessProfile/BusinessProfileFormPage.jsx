// src/pages/business/BusinessProfileFormPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { selectCurrentToken } from "../../features/auth/authSlice";
import HeaderShell from "../../components/layout/HeaderShell";
import Footer from "../../components/footer/Footer";
import { cta, footerData, nav, topbar } from "../main.mock";
import "./business-profile-create.css";
import { useNavigate } from "react-router-dom";
import {
  useCreateOrGetBPMutation,
  usePatchBPContactsMutation,
  useUploadFileMutation,
  useSetBPLogoMutation,
  useSetBPBannerMutation,
  useSetBPLegalDocMutation,
} from "../../features/bp/BPApiSlice";
// top-of-file
import countries from "i18n-iso-countries";
import enLocale from "i18n-iso-countries/langs/en.json";
import { useTranslation } from "react-i18next";
// register EN locale once
countries.registerLocale(enLocale);
// Build simple options: [{ value: 'TN', label: 'Tunisia' }, ...]
const COUNTRY_OPTIONS = Object.entries(
  countries.getNames("en", { select: "official" }) || {}
)
  .map(([code, name]) => ({ value: code, label: name }))
  .sort((a, b) => a.label.localeCompare(b.label));
// export small helpers derived from COUNTRY_OPTIONS:
const COUNTRY_LABELS = COUNTRY_OPTIONS.map((o) => o.label); // pass this to MultiSelectCountries
const CODE_BY_LABEL = Object.fromEntries(
  COUNTRY_OPTIONS.map((o) => [o.label, o.value])
);
const LABEL_BY_CODE = Object.fromEntries(
  COUNTRY_OPTIONS.map((o) => [o.value, o.label])
);
const SIZES = ["1-10", "11-50", "51-200", "201-1000", "1000+"];
const INDUSTRY_OPTIONS = [
  "AI & IoT",
  "Fintech",
  "Cybersecurity",
  "Cloud & DevOps",
  "Software / SaaS",
  "Hardware & Electronics",
  "Enabler Organisations & Innovation Ecosystem",
  "Manufacturing",
  "Construction & Real Estate",
  "Energy & Cleantech",
  "Water & Waste Management",
  "Transport & Logistics",
  "Retail",
  "E-commerce",
  "Marketing & Advertising",
  "Media & Entertainment",
  "Tourism & Hospitality",
  "Government & Smart Cities",
  "Nonprofit & Social Impact",
  "Education & EdTech",
  "Healthcare & MedTech",
  "Finance & Banking",
  "Agriculture & AgriTech",
  "Blue Economy & Fisheries",
  "Climate & Sustainability",
  "Automotive & Mobility",
  "Textile & Fashion Industry",
  "Cultural & Creative Industries",
  "Food & Beverage Innovation",
  "Mining & Natural Resources",
  "Defense & Security Tech",
  "Green Hydrogen & Renewable Energy",
  "Space & Aerospace Technology",
  "Sports & Recreation Tech",
  "Circular Economy & Recycling",
  "Digital Infrastructure & Connectivity",
];

/* ---------- primitives bound to your CSS (keep as-is) ---------- */
const Field = ({ label, hint, error, showError = true, children }) => (
  <div className="bpf-field">
    <div className="bpf-field-top">
      <div className="bpf-field-label">{label}</div>
      {hint ? <div className="bpf-field-hint">{hint}</div> : null}
    </div>
    {children}
    {showError && error ? <div className="bpf-field-error">{error}</div> : null}
  </div>
);
const PillsSingle = ({ value, onChange, options }) => (
  <div className="bpf-pills bpf-pills--single">
    {options.map((opt) => (
      <button
        key={opt}
        type="button"
        className={`bpf-pill ${value === opt ? "bpf-pill--active" : ""}`}
        onClick={() => onChange(opt)}
      >
        {opt}
      </button>
    ))}
  </div>
);
const PillsMulti = ({ values = [], onChange, options }) => {
  const toggle = (opt) => {
    const has = values.includes(opt);
    onChange(has ? values.filter((v) => v !== opt) : [...values, opt]);
  };
  return (
    <div className="bpf-pills">
      {options.map((opt) => {
        const active = values.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            className={`bpf-pill ${active ? "bpf-pill--active" : ""}`}
            onClick={() => toggle(opt)}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
};
const TagsInput = ({ value = [], onChange, placeholder = "Type & Enter" }) => {
  const [q, setQ] = useState("");
  const add = (t) => {
    const s = (t || "").trim();
    if (!s) return;
    const set = new Set(value);
    set.add(s);
    onChange(Array.from(set));
    setQ("");
  };
  const remove = (t) => onChange(value.filter((x) => x !== t));
  return (
    <div className="bpf-tagInput">
      <div className="bpf-tags">
        {value.map((t) => (
          <span className="bpf-tag" key={t}>
            {t}
            <button
              className="bpf-tag-x"
              type="button"
              onClick={() => remove(t)}
            >
              ×
            </button>
          </span>
        ))}
        <input
          className="bpf-tagInput-inp"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add(q);
            }
          }}
          placeholder={placeholder}
        />
      </div>
      <div className="bpf-tagInput-hint">Press Enter to add</div>
    </div>
  );
};

/* ----------------------- main ----------------------- */
export default function BusinessProfileFormPage() {
  const { t } = useTranslation(); // Option A: component uses translation
  const token = useSelector(selectCurrentToken);
  const navigate = useNavigate();
  // translations & arrays (returnObjects for arrays)
  const STEP_LABELS = t("partnership.steps", {
    returnObjects: true,
    defaultValue: [
      "Identity",
      "Positioning",
      "Contacts & Socials",
      "Media & Review",
    ],
  });
  const TIPS = t("partnership.tips", {
    returnObjects: true,
    defaultValue: [
      "Choose an industry and your main markets.",
      "Pick your main poster — it appears on marketplace cards.",
    ],
  });
  const SIZES_T = t("partnership.sizes", {
    returnObjects: true,
    defaultValue: SIZES,
  });
  const INDUSTRIES_T = t("partnership.industries", {
    returnObjects: true,
    defaultValue: INDUSTRY_OPTIONS,
  });

  // steps: 0 identity, 1 positioning, 2 contacts, 3 media & review
  const [step, setStep] = useState(0);
  const [attempted, setAttempted] = useState({
    0: false,
    1: false,
    2: false,
    3: false,
  });
  const [busy, setBusy] = useState(false);
  const [msgErr, setMsgErr] = useState("");
  const [msgOk, setMsgOk] = useState("");
  const [profile, setProfile] = useState(null);
  const [createOrGetBP] = useCreateOrGetBPMutation();
  const [patchBPContacts] = usePatchBPContactsMutation();
  const [uploadFile] = useUploadFileMutation();
  const [setBPLogo] = useSetBPLogoMutation();
  const [setBPBanner] = useSetBPBannerMutation();
  const [setBPLegalDoc] = useSetBPLegalDocMutation();
  const [form, setForm] = useState({
    // identity
    name: "",
    size: SIZES_T[0] || SIZES[0],
    about: "",
    legalDocFile: null,
    // positioning (industry single, countries multi)
    industry: "",
    countries: [],
    // contacts & socials
    contacts: {
      website: "",
      email: "",
      phone: "",
      allowEmail: true,
      allowPhone: false,
      allowDM: true,
    },
    socials: [],
    // media
    logoFile: null,
    bannerFile: null,
  });

  // validation per step (errors only shown after user tries to proceed)
  const vIdentity = useMemo(() => {
    const e = {};
    if (!form.name.trim()) e.name = t("partnership.errors.required", { defaultValue: "Required" });
    if (!form.size) e.size = t("partnership.errors.required", { defaultValue: "Required" });
    if (!form.about || form.about.trim().length < 20)
      e.about = t("partnership.errors.min_chars", { defaultValue: "Min 20 chars" });
    return e;
  }, [form.name, form.size, form.about, t]);

  const vPositioning = useMemo(() => {
    const e = {};
    if (!form.industry) e.industry = t("partnership.errors.select_industry", { defaultValue: "Select an industry" });
    return e;
  }, [form.industry, t]);

  const vContacts = useMemo(() => {
    const e = {};
    const { website, email, phone } = form.contacts || {};
    if (!website && !email && !phone) e.any = t("partnership.errors.add_contact", { defaultValue: "Add website or email or phone" });
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email))
      e.email = t("partnership.errors.invalid_email", { defaultValue: "Invalid email" });
    return e;
  }, [form.contacts, t]);

  const vMedia = useMemo(() => {
    const e = {};
    if (!form.bannerFile) e.banner = t("partnership.errors.banner_required", { defaultValue: "Main poster required" });
    return e;
  }, [form.bannerFile, t]);

  function tryNext(currentStep, fnIfValid) {
    setAttempted((p) => ({ ...p, [currentStep]: true }));
    const maps = [vIdentity, vPositioning, vContacts, vMedia];
    if (Object.keys(maps[currentStep]).length) return; // has errors, do not continue
    fnIfValid?.();
  }

  async function handleCreateOrGet() {
    setBusy(true);
    setMsgErr("");
    setMsgOk("");
    try {
      const payload = {
        name: form.name.trim(),
        size: form.size,
        about: form.about,
        industries: form.industry ? [form.industry] : [],
        countries: form.countries,
      };
      const res = await createOrGetBP(payload).unwrap();
      setProfile(res?.data || res);
      setStep(2);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setMsgErr(e?.data?.message || e?.message || t("partnership.errors.create_failed", { defaultValue: "Create failed" }));
    } finally {
      setBusy(false);
    }
  }

  async function handlePatchContacts() {
    setBusy(true);
    setMsgErr("");
    setMsgOk("");
    try {
      const res = await patchBPContacts({
        contacts: form.contacts,
        socials: (form.socials || []).filter((s) => (s?.url || "").trim()),
      }).unwrap();
      setProfile(res?.data || res);
      setStep(3);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setMsgErr(e?.data?.message || e?.message || t("partnership.errors.save_failed", { defaultValue: "Save failed" }));
    } finally {
      setBusy(false);
    }
  }

  async function handleFinish() {
    setBusy(true);
    setMsgErr("");
    setMsgOk("");
    try {
      if (form.logoFile) {
        const fd = new FormData();
        fd.append("file", form.logoFile);
        const up = await uploadFile(fd).unwrap();
        await setBPLogo({ path: up.path }).unwrap();
      }
      if (form.bannerFile) {
        const fd2 = new FormData();
        fd2.append("file", form.bannerFile);
        const up2 = await uploadFile(fd2).unwrap();
        await setBPBanner({ path: up2.path }).unwrap();
      }
      if (form.legalDocFile) {
        const fd3 = new FormData();
        fd3.append("file", form.legalDocFile);
        const up3 = await uploadFile(fd3).unwrap();
        await setBPLegalDoc({ path: up3.path }).unwrap();
      }
      setMsgOk(t("partnership.messages.profile_created", { defaultValue: "✅ Profile created." }));
      window.scrollTo({ top: 0, behavior: "smooth" });
      try {
        const profilePath = profile?.slug
          ? `/business/${profile.slug}`
          : profile?._id
          ? `/business/${profile._id}`
          : null;
        const popup = {
          type: "success",
          title: t("partnership.messages.popup_title", { defaultValue: "Business profile created 🎉" }),
          body: t("partnership.messages.popup_body", { defaultValue: "Your business profile was created successfully." }),
          ts: Date.now(),
          showOnce: true,
          link: profilePath
            ? { href: profilePath, label: t("partnership.actions.view_profile", { defaultValue: "View profile" }) }
            : null,
        };
        localStorage.setItem("popup", JSON.stringify(popup));
      } catch {}
      navigate("/BusinessProfile/dashboard");
    } catch (e) {
      setMsgErr(e?.data?.message || e?.message || t("partnership.errors.upload_failed", { defaultValue: "Upload failed" }));
    } finally {
      setBusy(false);
    }
  }

  // FancyMultiSelect (uses LABEL_BY_CODE)
  function FancyMultiSelect({
    value = [],
    onChange,
    options = [] /* array of labels */,
  }) {
    const [open, setOpen] = React.useState(false);
    const [q, setQ] = React.useState("");
    const wrapperRef = React.useRef(null);
    const selectedLabels = (value || []).map((code) => LABEL_BY_CODE[code] || code);
    const filtered = options
      .filter((lbl) => !selectedLabels.includes(lbl))
      .filter((lbl) => (q ? lbl.toLowerCase().includes(q.toLowerCase()) : true));
    React.useEffect(() => {
      function onDoc(e) {
        if (!wrapperRef.current) return;
        if (!wrapperRef.current.contains(e.target)) setOpen(false);
      }
      document.addEventListener("click", onDoc);
      return () => document.removeEventListener("click", onDoc);
    }, []);
    const addLabel = (label) => {
      const code = CODE_BY_LABEL[label] || label;
      const next = Array.from(new Set([...(value || []), code]));
      onChange(next);
      setQ("");
      setOpen(true);
    };
    const removeCode = (code) => {
      onChange((value || []).filter((c) => c !== code));
    };
    const onKeyDown = (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (filtered.length > 0) addLabel(filtered[0]);
      } else if (e.key === "Backspace" && !q) {
        const last = (value || [])[value.length - 1];
        if (last) removeCode(last);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    };
    return (
      <div ref={wrapperRef} className="fancy-multi-wrap relative" style={{ minWidth: 220 }}>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2 bpf-inp w-full justify-between"
          aria-expanded={open}
        >
          <div className="flex flex-wrap gap-2 items-center">
            {selectedLabels.length === 0 ? (
              <span className="text-slate-400">{t("partnership.placeholders.select_countries", { defaultValue: "Select countries…" })}</span>
            ) : (
              selectedLabels.map((lbl, idx) => {
                const code = CODE_BY_LABEL[lbl] || value[idx] || lbl;
                return (
                  <span key={lbl + idx} className="inline-flex items-center gap-2 px-2 py-0.5 rounded-full text-sm bg-slate-100">
                    <span>{lbl}</span>
                    <button
                      type="button"
                      aria-label={t("partnership.actions.remove", { defaultValue: "Remove" })}
                      onClick={(ev) => {
                        ev.stopPropagation();
                        removeCode(code);
                      }}
                      className="text-xs leading-none"
                    >
                      ×
                    </button>
                  </span>
                );
              })
            )}
          </div>
          <svg className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.939l3.71-3.71a.75.75 0 011.08 1.04l-4.25 4.25a.75.75 0 01-1.06 0L5.21 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd" />
          </svg>
        </button>
        {open && (
          <div className="absolute z-50 mt-2 w-full bg-white border rounded shadow-lg">
            <div className="p-2">
              <input
                className="w-full bpf-inp"
                placeholder={t("partnership.placeholders.search_countries", { defaultValue: "Search countries…" })}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={onKeyDown}
                autoFocus
              />
            </div>
            <ul role="listbox" className="max-h-64 overflow-auto">
              {filtered.length === 0 ? (
                <li className="p-2 text-sm text-slate-500">{t("partnership.placeholders.no_matches", { defaultValue: "No matches" })}</li>
              ) : (
                filtered.map((lbl) => (
                  <li key={lbl} role="option" onClick={() => addLabel(lbl)} className="cursor-pointer p-2 hover:bg-slate-50">
                    {lbl}
                  </li>
                ))
              )}
            </ul>
          </div>
        )}
      </div>
    );
  }

  // FancyIndustrySelect component (already inside main so can use t)
  function FancyIndustrySelect({ value, onChange, options = [] }) {
    const [open, setOpen] = React.useState(false);
    const [q, setQ] = React.useState("");
    const filtered = q ? options.filter((o) => o.toLowerCase().includes(q.toLowerCase())) : options;
    React.useEffect(() => {
      function onDoc(e) {
        if (!e.target.closest?.(".fancy-industry-wrap")) setOpen(false);
      }
      document.addEventListener("click", onDoc);
      return () => document.removeEventListener("click", onDoc);
    }, []);
    return (
      <div className="fancy-industry-wrap relative" style={{ minWidth: 220 }}>
        <button
          type="button"
          className="flex items-center gap-2 w-full bpf-inp justify-between"
          onClick={() => setOpen((o) => !o)}
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          <div className="flex items-center gap-2">
            {value ? (
              <span className="px-2 py-1 rounded-full text-sm bg-slate-100">{value}</span>
            ) : (
              <span className="text-slate-400">{t("partnership.placeholders.select_industry", { defaultValue: "Select industry…" })}</span>
            )}
          </div>
          <svg className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.939l3.71-3.71a.75.75 0 011.08 1.04l-4.25 4.25a.75.75 0 01-1.06 0L5.21 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd" />
          </svg>
        </button>
        {open && (
          <div className="absolute z-50 mt-2 w-full bg-white border rounded shadow-lg">
            <div className="p-2">
              <input autoFocus className="w-full bpf-inp" placeholder={t("partnership.placeholders.search_industries", { defaultValue: "Search industries…" })} value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <ul role="listbox" className="max-h-48 overflow-auto">
              {filtered.length === 0 ? (
                <li className="p-2 text-sm text-slate-500">{t("partnership.placeholders.no_matches", { defaultValue: "No matches" })}</li>
              ) : (
                filtered.map((opt) => (
                  <li
                    key={opt}
                    role="option"
                    onClick={() => {
                      onChange(opt);
                      setOpen(false);
                      setQ("");
                    }}
                    className={`cursor-pointer p-2 hover:bg-slate-50 ${opt === value ? "bg-slate-100 font-medium" : ""}`}
                  >
                    {opt}
                  </li>
                ))
              )}
            </ul>
          </div>
        )}
      </div>
    );
  }

  // SocialRow now accepts placeholder props (defaults are English)
  const SocialRow = ({ row, onChange, onRemove, labelPlaceholder = "Label (e.g., LinkedIn, X, Instagram)", urlPlaceholder = "https://…", removeLabel = "Remove" }) => (
    <div className="bpf-socRow">
      <input className="bpf-inp" value={row.label || ""} onChange={(e) => onChange({ ...row, label: e.target.value })} placeholder={labelPlaceholder} />
      <input className="bpf-inp" value={row.url || ""} onChange={(e) => onChange({ ...row, url: e.target.value })} placeholder={urlPlaceholder} />
      <button type="button" className="bpf-btn" onClick={onRemove}>
        {removeLabel}
      </button>
    </div>
  );

  return (
    <>
      <HeaderShell top={topbar} nav={nav} cta={cta} />
      <div className="bpf-container">
        <div className="bpf">
          {/* left */}
          <aside className="bpf-left">
            <h1 className="bpf-ttl">{t("partnership.title", { defaultValue: "Create your business profile" })}</h1>
            <p className="bpf-sub">{t("partnership.subtitle", { defaultValue: "Identity → Positioning → Contacts → Media. All steps required." })}</p>
            <ol className="bpf-steps" role="tablist">
              {STEP_LABELS.map((lb, i) => (
                <li key={lb} className={`bpf-step ${step === i ? "bpf-step--active" : step > i ? "bpf-step--done" : ""}`}>
                  <button
                    type="button"
                    className="bpf-step-btn"
                    onClick={() => {
                      if (i < step) setStep(i);
                    }}
                    aria-selected={step === i}
                    disabled={i > step}
                  >
                    <span className="bpf-step-dot">{step > i ? "✓" : i + 1}</span>
                    <span>{lb}</span>
                  </button>
                </li>
              ))}
            </ol>
            <div className="bpf-tips">
              <div className="bpf-tip">{TIPS[0]}</div>
              <div className="bpf-tip">{TIPS[1]}</div>
            </div>
          </aside>
          {/* main */}
          <main className="bpf-main">
            {msgErr ? <div className="bpf-msg bpf-msg--err">{msgErr}</div> : null}
            {msgOk ? <div className="bpf-msg bpf-msg--ok">{msgOk}</div> : null}
            {/* step 0: identity */}
            {step === 0 && (
              <section className="bpf-card">
                <h2 className="bpf-h2">{t("partnership.sections.identity.title", { defaultValue: "Identity" })}</h2>
                <div className="bpf-g2">
                  <Field label={t("partnership.labels.business_name", { defaultValue: "Business / Brand name *" })} error={vIdentity.name} showError={attempted[0]}>
                    <input
                      className="bpf-inp"
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder={t("partnership.placeholders.example_name", { defaultValue: "e.g., NeoTech Devices" })}
                      aria-invalid={attempted[0] && !!vIdentity.name}
                    />
                  </Field>
                  <Field label={t("partnership.labels.company_size", { defaultValue: "Company size *" })} error={vIdentity.size} showError={attempted[0]}>
                    <PillsSingle value={form.size} onChange={(v) => setForm((f) => ({ ...f, size: v }))} options={SIZES_T} />
                  </Field>
                </div>
                <Field label={t("partnership.labels.about", { defaultValue: "About *" })} hint={t("partnership.hints.min_chars", { defaultValue: "Minimum 20 charaters" })} error={vIdentity.about} showError={attempted[0]}>
                  <textarea className="bpf-ta" rows={6} value={form.about} onChange={(e) => setForm((f) => ({ ...f, about: e.target.value }))} />
                </Field>
                <Field label={t("partnership.labels.legal_doc", { defaultValue: "Legal document (optional)" })} hint={t("partnership.hints.legal_doc", { defaultValue: "legal statue and Company Registration Certificate" })}>
                  <div className={`bpf-filePrev-box ${!form.legalDocFile ? "bpf-filePrev-box--empty" : ""}`}>
                    {!form.legalDocFile ? (
                      <>
                        <div>{t("partnership.placeholders.drop_click", { defaultValue: "Drop or click to upload" })}</div>
                        <input
                          type="file"
                          accept="
            image/*,
            application/pdf,
            application/msword,
            application/vnd.openxmlformats-officedocument.wordprocessingml.document,
            application/vnd.oasis.opendocument.text,
            text/plain
          "
                          onChange={(e) => setForm((f) => ({ ...f, legalDocFile: e.target.files?.[0] || null }))}
                        />
                      </>
                    ) : (
                      <>
                        {/^image\//.test(form.legalDocFile.type) ? (
                          <div className="bpf-filePrev-img" style={{ backgroundImage: `url(${URL.createObjectURL(form.legalDocFile)})` }} />
                        ) : (
                          <div>
                            <b>{t("partnership.labels.selected", { defaultValue: "Selected:" })}</b> {form.legalDocFile.name}
                          </div>
                        )}
                        <div className="bpf-rowEnd">
                          <button type="button" className="bpf-btn" onClick={() => setForm((f) => ({ ...f, legalDocFile: null }))}>
                            {t("partnership.actions.remove", { defaultValue: "Remove" })}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </Field>
                <div className="bpf-rowEnd">
                  <button type="button" className="bpf-btn bpf-btn--brand" disabled={busy} onClick={() => tryNext(0, () => setStep(1))}>
                    {t("partnership.actions.continue", { defaultValue: "Continue" })}
                  </button>
                </div>
              </section>
            )}
            {/* step 1: positioning (industry single, countries multi) */}
            {step === 1 && (
              <section className="bpf-card">
                <h2 className="bpf-h2">{t("partnership.sections.positioning.title", { defaultValue: "Positioning" })}</h2>
                <div className="bpf-g2">
                  <Field label={t("partnership.labels.industry", { defaultValue: "Industry *" })} error={vPositioning.industry} showError={attempted[1]}>
                    <FancyIndustrySelect value={form.industry} onChange={(v) => setForm((f) => ({ ...f, industry: v }))} options={INDUSTRIES_T} />
                  </Field>
                  <Field label={t("partnership.labels.countries", { defaultValue: "Countries (markets)" })}>
                    <FancyMultiSelect value={form.countries || []} onChange={(codes) => setForm((f) => ({ ...f, countries: codes }))} options={COUNTRY_LABELS} />
                  </Field>
                </div>
                <div className="bpf-rowEnd">
                  <button type="button" className="bpf-btn" onClick={() => setStep(0)}>
                    {t("partnership.actions.back", { defaultValue: "Back" })}
                  </button>
                  <button type="button" className="bpf-btn bpf-btn--brand" disabled={busy} onClick={() => tryNext(1, handleCreateOrGet)}>
                    {t("partnership.actions.save_continue", { defaultValue: "Save & Continue" })}
                  </button>
                </div>
              </section>
            )}
            {/* step 2: contacts & socials */}
            {step === 2 && (
              <section className="bpf-card">
                <h2 className="bpf-h2">{t("partnership.sections.contacts.title", { defaultValue: "Contacts & Socials" })}</h2>
                <div className="bpf-g2">
                  <Field label={t("partnership.labels.website", { defaultValue: "Website" })}>
                    <input className="bpf-inp" value={form.contacts.website} onChange={(e) => setForm((f) => ({ ...f, contacts: { ...f.contacts, website: e.target.value } }))} placeholder={t("partnership.placeholders.website", { defaultValue: "https://…" })} />
                  </Field>
                  <Field label={t("partnership.labels.email", { defaultValue: "Email" })} error={vContacts.email} showError={attempted[2]}>
                    <input className="bpf-inp" value={form.contacts.email} onChange={(e) => setForm((f) => ({ ...f, contacts: { ...f.contacts, email: e.target.value } }))} placeholder={t("partnership.placeholders.email", { defaultValue: "name@company.com" })} />
                  </Field>
                </div>
                <Field label={t("partnership.labels.phone", { defaultValue: "Phone" })}>
                  <input className="bpf-inp" value={form.contacts.phone} onChange={(e) => setForm((f) => ({ ...f, contacts: { ...f.contacts, phone: e.target.value } }))} placeholder={t("partnership.placeholders.phone", { defaultValue: "+216 …" })} />
                </Field>
                <div className="bpf-switches">
                  <label className="bpf-sw">
                    <input type="checkbox" checked={!!form.contacts.allowEmail} onChange={(e) => setForm((f) => ({ ...f, contacts: { ...f.contacts, allowEmail: e.target.checked } }))} />
                    {t("partnership.switches.show_email", { defaultValue: "Show email" })}
                  </label>
                  <label className="bpf-sw">
                    <input type="checkbox" checked={!!form.contacts.allowPhone} onChange={(e) => setForm((f) => ({ ...f, contacts: { ...f.contacts, allowPhone: e.target.checked } }))} />
                    {t("partnership.switches.show_phone", { defaultValue: "Show phone" })}
                  </label>
                  <label className="bpf-sw">
                    <input type="checkbox" checked={!!form.contacts.allowDM} onChange={(e) => setForm((f) => ({ ...f, contacts: { ...f.contacts, allowDM: e.target.checked } }))} />
                    {t("partnership.switches.allow_dm", { defaultValue: "Allow DMs" })}
                  </label>
                </div>
                <div className="bpf-socHead">
                  <div className="bpf-field-label">{t("partnership.labels.social_links", { defaultValue: "Social links" })}</div>
                  <button
                    type="button"
                    className="bpf-btn"
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        socials: [...(f.socials || []), { label: "", url: "" }],
                      }))
                    }
                  >
                    {t("partnership.actions.add_social", { defaultValue: "+ Add social" })}
                  </button>
                </div>
                <div className="bpf-socGrid">
                  {(form.socials || []).map((s, i) => (
                    <SocialRow
                      key={i}
                      row={s}
                      onChange={(row) =>
                        setForm((f) => ({
                          ...f,
                          socials: f.socials.map((x, idx) => (idx === i ? row : x)),
                        }))
                      }
                      onRemove={() =>
                        setForm((f) => ({
                          ...f,
                          socials: f.socials.filter((_, idx) => idx !== i),
                        }))
                      }
                      labelPlaceholder={t("partnership.placeholders.social_label", { defaultValue: "Label (e.g., LinkedIn, X, Instagram)" })}
                      urlPlaceholder={t("partnership.placeholders.social_url", { defaultValue: "https://…" })}
                      removeLabel={t("partnership.actions.remove", { defaultValue: "Remove" })}
                    />
                  ))}
                </div>
                {attempted[2] && vContacts.any ? <div className="bpf-msg bpf-msg--err">{vContacts.any}</div> : null}
                <div className="bpf-rowEnd">
                  <button type="button" className="bpf-btn" onClick={() => setStep(1)}>
                    {t("partnership.actions.back", { defaultValue: "Back" })}
                  </button>
                  <button type="button" className="bpf-btn bpf-btn--brand" disabled={busy} onClick={() => tryNext(2, handlePatchContacts)}>
                    {t("partnership.actions.save_continue", { defaultValue: "Save & Continue" })}
                  </button>
                </div>
              </section>
            )}
            {/* step 3: media & review */}
            {step === 3 && (
              <section className="bpf-card">
                <h2 className="bpf-h2">{t("partnership.sections.media.title", { defaultValue: "Media & Review" })}</h2>
                <div className="bpf-g2">
                  <Field label={t("partnership.labels.logo_optional", { defaultValue: "Logo (optional)" })}>
                    <div className={`bpf-filePrev-box ${!form.logoFile ? "bpf-filePrev-box--empty" : ""}`}>
                      {!form.logoFile ? (
                        <>
                          <div>{t("partnership.placeholders.drop_click", { defaultValue: "Drop or click to upload" })}</div>
                          <input type="file" accept="image/*" onChange={(e) => setForm((f) => ({ ...f, logoFile: e.target.files?.[0] || null }))} />
                        </>
                      ) : (
                        <>
                          <div className="bpf-filePrev-img" style={{ backgroundImage: `url(${URL.createObjectURL(form.logoFile)})` }} />
                          <div className="bpf-rowEnd">
                            <button type="button" className="bpf-btn" onClick={() => setForm((f) => ({ ...f, logoFile: null }))}>
                              {t("partnership.actions.remove", { defaultValue: "Remove" })}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </Field>
                  <Field label={t("partnership.labels.main_poster", { defaultValue: "Main poster *" })} error={vMedia.banner} showError={attempted[3]}>
                    <div className={`bpf-filePrev-box ${!form.bannerFile ? "bpf-filePrev-box--empty" : ""}`}>
                      {!form.bannerFile ? (
                        <>
                          <div>{t("partnership.placeholders.drop_click", { defaultValue: "Drop or click to upload" })}</div>
                          <input type="file" accept="image/*" onChange={(e) => setForm((f) => ({ ...f, bannerFile: e.target.files?.[0] || null }))} />
                        </>
                      ) : (
                        <>
                          <div className="bpf-filePrev-img" style={{ backgroundImage: `url(${URL.createObjectURL(form.bannerFile)})` }} />
                          <div className="bpf-rowEnd">
                            <button type="button" className="bpf-btn" onClick={() => setForm((f) => ({ ...f, bannerFile: null }))}>
                              {t("partnership.actions.remove", { defaultValue: "Remove" })}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </Field>
                </div>
                <div className="bpf-reviewBox">
                  <div className="bpf-reviewCol">
                    <div className="bpf-rb">
                      <div className="bpf-rb-h">{t("partnership.sections.identity.title", { defaultValue: "Identity" })}</div>
                      <div>
                        <b>{t("partnership.labels.name_short", { defaultValue: "Name:" })}</b> {form.name || "—"}
                      </div>
                      <div>
                        <b>{t("partnership.labels.size_short", { defaultValue: "Size:" })}</b> {form.size}
                      </div>
                      <div>
                        <b>{t("partnership.labels.about_short", { defaultValue: "About:" })}</b> {form.about || "—"}
                      </div>
                    </div>
                  </div>
                  <div className="bpf-reviewCol"></div>
                  <div className="bpf-reviewCol">
                    <div className="bpf-rb">
                      <div className="bpf-rb-h">{t("partnership.sections.contacts.title", { defaultValue: "Contacts" })}</div>
                      <div>
                        <b>{t("partnership.labels.website_short", { defaultValue: "Website:" })}</b> {form.contacts.website || "—"}
                      </div>
                      <div>
                        <b>{t("partnership.labels.email_short", { defaultValue: "Email:" })}</b> {form.contacts.email || "—"}
                      </div>
                      <div>
                        <b>{t("partnership.labels.phone_short", { defaultValue: "Phone:" })}</b> {form.contacts.phone || "—"}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bpf-rowEnd">
                  <button type="button" className="bpf-btn" onClick={() => setStep(2)}>
                    {t("partnership.actions.back", { defaultValue: "Back" })}
                  </button>
                  <button type="button" className="bpf-btn bpf-btn--brand" disabled={busy} onClick={() => tryNext(3, handleFinish)}>
                    {t("partnership.actions.create_profile", { defaultValue: "Create profile" })}
                  </button>
                </div>
              </section>
            )}
          </main>
        </div>
      </div>
      <Footer brand={footerData.brand} columns={footerData.columns} socials={footerData.socials} actions={footerData.actions} bottomLinks={footerData.bottomLinks} />
    </>
  );
}
