// src/pages/meetings/MeetingPage.jsx
import React, { useMemo, useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  FiArrowLeft, FiUser, FiMail, FiMapPin, FiCalendar, FiTag, FiLayers, FiSend,
  FiCheckCircle, FiClock, FiXCircle, FiExternalLink, FiAlertTriangle
} from "react-icons/fi";
import "./meeting-page.css";

/* API hooks (logic unchanged) */
import {
  useGetMeetingExistQuery,
  useGetActorPPQuery,
  useGetAvailableSlotsQuery,
  useRequestMeetingMutation,
  useGetMeetingPrefsQuery
} from "../../features/Actor/toolsApiSlice";
import { useGetSelectByNameQuery } from "../../features/tools/selectsApiSlice";
import { useGetEventQuery } from "../../features/events/eventsApiSlice";

import HeaderShell from "../../components/layout/HeaderShell";
import { topbar, cta, footerData, nav } from "../main.mock";
import Footer from "../../components/footer/Footer";
import imageLink from "../../utils/imageLink";
import useAuth from "../../lib/hooks/useAuth";

/* --------------------------------- tiny utils --------------------------------- */
const pad2 = (n) => String(n).padStart(2, "0");

// UTC-safe pretty for a YYYY-MM-DD
const fmtYMDLongUTC = (ymd) => {
  if (!ymd) return "";
  const [y, m, d] = String(ymd).split("-").map(Number);
  const dt = new Date(Date.UTC(y, (m || 1) - 1, d || 1, 0, 0, 0));
  return dt.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
};

const fmtISODateUTC = (iso) =>
  new Date(iso).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });

const fmtISOTimeUTC = (iso) =>
  new Date(iso).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  });

/* ---------------------- redesigned (scoped) status banner ---------------------- */
function StatusBanner({ variant, details, onBack, onGoMeetings }) {
  const t =
    {
      yes: {
        cls: "ok",
        icon: <FiCheckCircle />,
        title: "You already have a meeting with this member",
        desc: "We found an existing meeting thread. You can open it or propose a new time.",
        primary: "Open my meetings",
      },
      pending: {
        cls: "warn",
        icon: <FiClock />,
        title: "Your meeting request is pending",
        desc: "Your request is awaiting confirmation. We’ll notify you by email.",
        primary: "See my requests",
      },
      refused: {
        cls: "bad",
        icon: <FiXCircle />,
        title: "Previous request was declined",
        desc: "You can try again later or message first for context.",
        primary: "Back",
      },
    }[variant] || {
      cls: "",
      icon: <FiAlertTriangle />,
      title: "Status",
      desc: "",
      primary: "Back",
    };

  const dtISO =
    details?.meeting?.dateTimeISO ||
    details?.lastRequest?.dateTimeISO ||
    details?.dateTimeISO ||
    null;
  const subject =
    details?.meeting?.subject ||
    details?.lastRequest?.subject ||
    details?.subject ||
    null;

  return (
    <section className="mp-status2">
      {/* scoped styles; won't affect your main CSS */}
      <style>{`
        .mp-status2{--bd:#e2e8f0;--bg:#f8fafc;--ink:#0f172a;--muted:#64748b;--ok:#16a34a;--warn:#f59e0b;--bad:#ef4444;border:1px solid var(--bd);border-radius:16px;background:#fff;overflow:hidden;margin:16px 0;}
        .mp-status2 .top{display:flex;gap:12px;align-items:flex-start;padding:16px 16px 8px 16px;background:var(--bg);}
        .mp-status2 .ico{flex:0 0 auto;width:40px;height:40px;border-radius:999px;display:grid;place-items:center}
        .mp-status2.ok .ico{background:rgba(22,163,74,.10);color:var(--ok)}
        .mp-status2.warn .ico{background:rgba(245,158,11,.10);color:var(--warn)}
        .mp-status2.bad .ico{background:rgba(239,68,68,.10);color:var(--bad)}
        .mp-status2 .h{font-weight:700;margin:0;color:var(--ink)}
        .mp-status2 .p{margin:4px 0 0;color:var(--muted)}
        .mp-status2 .kv{display:flex;flex-wrap:wrap;gap:8px;padding:8px 16px 0 68px}
        .mp-status2 .chip{display:inline-flex;align-items:center;gap:8px;border:1px solid var(--bd);border-radius:999px;padding:6px 10px;background:#fff;color:var(--ink);font-size:.9rem}
        .mp-status2 .act{display:flex;flex-wrap:wrap;gap:8px;padding:12px 16px 16px 68px}
        .mp-status2 .btn{appearance:none;border:none;border-radius:10px;padding:10px 12px;font-weight:700;display:inline-flex;gap:8px;align-items:center;cursor:pointer}
        .mp-status2 .btn.-pri{background:var(--ink);color:#fff}
        .mp-status2.ok .btn.-pri{background:var(--ok)}
        .mp-status2.warn .btn.-pri{background:var(--warn)}
        .mp-status2.bad .btn.-pri{background:var(--bad)}
        .mp-status2 .btn.-gh{background:#fff;border:1px solid var(--bd);color:var(--ink)}
        @media (max-width:720px){.mp-status2 .kv,.mp-status2 .act{padding-left:16px}}
      `}</style>

      <div className={`top ${t.cls}`}>
        <div className="ico" aria-hidden>{t.icon}</div>
        <div className="body">
          <h3 className="h">{t.title}</h3>
          {t.desc ? <p className="p">{t.desc}</p> : null}
        </div>
      </div>

      {(dtISO || subject) ? (
        <div className="kv">
          {subject ? (
            <span className="chip"><FiTag/>{subject}</span>
          ) : null}
          {dtISO ? (
            <>
              <span className="chip"><FiCalendar/>{fmtISODateUTC(dtISO)}</span>
              <span className="chip"><FiClock/>{fmtISOTimeUTC(dtISO)}</span>
            </>
          ) : null}
        </div>
      ) : null}

      <div className="act">
        {variant === "refused" ? (
          <button className="btn -gh" onClick={onBack}><FiArrowLeft/> Back</button>
        ) : (
          <>
            <button className="btn -pri" onClick={typeof onGoMeetings === "function" ? onGoMeetings : onBack}>
              <FiExternalLink/>{t.primary}
            </button>
            <button className="btn -gh" onClick={onBack}><FiArrowLeft/> Back</button>
          </>
        )}
      </div>
    </section>
  );
}

/* --------------------------------- page --------------------------------- */
export default function MeetingPage() {
  const { ActorId } = useAuth();
  const navigate = useNavigate();
  const { actorId } = useParams();
  const { search } = useLocation();
  const id = actorId || "";

  /* target profile */
  const { data: actor, isFetching: actorLoading, isError: actorErr } =
    useGetActorPPQuery(id, { skip: !id });

  /* event for date range */
  const eventId =
    actor?.id_event || actor?.eventId || actor?.idEvent || "68e6764bb4f9b08db3ccec04";
  const { data: event } = useGetEventQuery(eventId, { skip: !eventId });

  /* meeting existence */
  const { data: existData, isFetching: existLoading } = useGetMeetingExistQuery(
    { receiverId: id, senderId: ActorId },
    { skip: !id || !ActorId }
  );

  /* purposes */
  const { data: purposeData, isFetching: purposeLoading } =
    useGetSelectByNameQuery("meeting-purpose");

  /* mutation */
  const [requestMeeting, { isLoading: isSending, isError: sendErr, error: sendError }] =
    useRequestMeetingMutation();

  /* derive role */
  const role = useMemo(() => {
    const a = actor || {};
    if (a?.talk || a?.b2bIntent) return "speaker";
    if (a?.identity || a?.commercial) return "exhibitor";
    return "attendee";
  }, [actor]);

  /* header */
  const navItems = nav; // keep your global nav

  /* summary card content */
  const summary = useMemo(() => {
    const a = actor || {};
    if (role === "speaker") {
      const p = a.personal || {};
      const o = a.organization || {};
      return {
        name: p.fullName || "—",
        email: p.email || "—",
        photo: a?.enrichments?.profilePic || "",
        org: o.orgName || "",
        loc: [p.city, p.country].filter(Boolean).join(", ") || "—",
      };
    }
    if (role === "exhibitor") {
      const idt = a.identity || {};
      return {
        name: idt.exhibitorName || idt.orgName || "—",
        email: idt.email || "—",
        photo: "",
        org: idt.orgName || "",
        loc: [idt.city, idt.country].filter(Boolean).join(", ") || "—",
      };
    }
    const p = a.personal || {};
    const o = a.organization || {};
    return {
      name: p.fullName || "—",
      email: p.email || "—",
      photo: p.profilePic || "",
      org: o.orgName || "",
      loc: [p.city, p.country].filter(Boolean).join(", ") || "—",
    };
  }, [actor, role]);

  /* preferences (expanded fallbacks) */
const { data: prefsResp } = useGetMeetingPrefsQuery(id, { skip: !id });
console.log(prefsResp);
  const prefs = useMemo(() => {
    const s = prefsResp?.data || {};
    // Fill the card even if something is missing
    const fallback = pickPreferences(role, actor) || {};
    return {
      language:   s.language   || fallback.language   || "",
      sector:     s.sector     || fallback.sector     || "",
      offering:   s.offering   || fallback.offering   || "",
      lookingFor: s.lookingFor || fallback.lookingFor || "",
    };
  }, [prefsResp, role, actor]);
  /* purpose options normalize (unchanged) */
  const purposes = useMemo(() => {
    const [d] = purposeData ?? [];
    if (!d) return [];
    const arr = Array.isArray(d?.options) ? d.options : Array.isArray(d) ? d : [];
    return arr
      .map((x) => {
        if (x && typeof x === "object") {
          return { id: String(x?.value), label: String(x?.key) };
        }
        return null;
      })
      .filter(Boolean);
  }, [purposeData]);

  /* --------- event days: only last day is shown & used --------- */
  const eventDays = useMemo(() => {
    const sISO = event?.startDate;
    const eISO = event?.endDate;
    if (!sISO || !eISO) return [];
    // Build inclusive list in UTC days
    const s = new Date(sISO);
    const e = new Date(eISO);
    const startUTC = Date.UTC(s.getUTCFullYear(), s.getUTCMonth(), s.getUTCDate());
    const endUTC   = Date.UTC(e.getUTCFullYear(), e.getUTCMonth(), e.getUTCDate());
    if (Number.isNaN(startUTC) || Number.isNaN(endUTC) || startUTC > endUTC) return [];
    const days = [];
    for (let t = startUTC; t <= endUTC; t += 86400000) {
      const d = new Date(t);
      const y = d.getUTCFullYear();
      const m = String(d.getUTCMonth() + 1).padStart(2, "0");
      const dd = String(d.getUTCDate()).padStart(2, "0");
      days.push(`${y}-${m}-${dd}`);
    }
    return days;
  }, [event?.startDate, event?.endDate]);

  const lastDay = eventDays.length ? eventDays[eventDays.length - 1] : "";
  const [dateStr, setDateStr] = useState(lastDay);

  useEffect(() => {
    // Always force to last day if event changes
    if (eventDays.length) setDateStr(eventDays[eventDays.length - 1]);
  }, [eventDays]);

  /* --------- slots (filter to ≥ 09:00 local) --------- */
  const { data: slotsRaw, isFetching: slotsLoading } =
    useGetAvailableSlotsQuery(
      { eventId, actorId: id, date: dateStr },
      { skip: !eventId || !id || !dateStr }
    );

  const slots = useMemo(() => {
    const arr =
      (Array.isArray(slotsRaw?.data) && slotsRaw.data) ||
      (Array.isArray(slotsRaw) && slotsRaw) ||
      [];

    // pick iso string from various shapes
    const isoList = arr
      .map((item) =>
        typeof item === "string"
          ? item
          : item?.iso || item?.slotISO || item?.startISO || item?.start || ""
      )
      .filter(Boolean);

    // enforce >= 09:00 (local time)
    const filtered = isoList.filter((iso) => {
      const d = new Date(iso);
      const h = d.getHours();
      const m = d.getMinutes();
      return h > 9 || (h === 9 && m >= 0);
    });

    return filtered.map((iso) => ({
      key: iso,
      label: `${fmtISODateUTC(iso)} • ${fmtISOTimeUTC(iso)}`,
    }));
  }, [slotsRaw]);

  /* existence */
  const exist = (existData?.exist || "").toLowerCase(); // yes | pending | refused | no | ""

  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate("/");
  };

  /* ----------------------- form state ----------------------- */
  const [form, setForm] = useState({
    slotKey: "",
    purposeId: "",
    model: "",
    message: "",
  });

  const [touched, setTouched] = useState({});
  const errors = useMemo(() => {
    const e = {};
    if (!form.slotKey) e.slotKey = "Please select a meeting slot";
    if (!form.purposeId) e.purposeId = "Please choose a meeting purpose";
    if (!form.model) e.model = "Please choose a business model";
    return e;
  }, [form]);

  const canSubmit = !isSending && Object.keys(errors).length === 0;
  const onChange = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e?.target?.value || "" }));
  const onBlur = (key) => () => setTouched((t) => ({ ...t, [key]: true }));
  const fieldErr = (k) => (touched[k] && errors[k]) || "";

  const returnTo = useMemo(() => {
    try {
      const sp = new URLSearchParams(search);
      const r = sp.get("returnTo");
      return r && decodeURIComponent(r);
    } catch {
      return null;
    }
  }, [search]);

  const redirectBackWithCreated = () => {
    if (returnTo) {
      try {
        const u = new URL(returnTo, window.location.origin);
        u.searchParams.set("created", "true");
        window.location.assign(u.toString());
        return;
      } catch {}
    }
    if (document.referrer) {
      try {
        const u = new URL(document.referrer);
        if (u.origin === window.location.origin) {
          u.searchParams.set("created", "true");
          window.location.assign(
            u.pathname + "?" + u.searchParams.toString() + u.hash
          );
          return;
        }
      } catch {}
    }
    navigate("/?created=true", { replace: true });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setTouched({ slotKey: true, purposeId: true, model: true });
    if (!canSubmit) return;

    const purposeLabel =
      purposes.find((p) => String(p.id) === String(form.purposeId))?.label ||
      "Meeting";
    const subject = `${purposeLabel} (${form.model})`;

    const payload = {
      eventId,
      receiverId: id,
      receiverRole: role,
      dateTimeISO: form.slotKey,
      subject,
      message: form.message?.trim() || "",
    };

    try {
      await requestMeeting(payload).unwrap();
      redirectBackWithCreated();
    } catch (err) {
      console.error("requestMeeting error:", err);
    }
  };

  /* ----------------------- loading / error / exist ----------------------- */
  if (actorLoading || existLoading) {
    return (
      <section className="mp-wrap container">
        <header className="mp-head">
          <button className="mp-back" onClick={goBack}>
            <FiArrowLeft /> Back
          </button>
          <h1 className="mp-title">Request a Meeting</h1>
        </header>
        <div className="mp-grid">
          <div className="mp-card is-skel" />
          <div className="mp-card is-skel" />
        </div>
      </section>
    );
  }

  if (actorErr) {
    return (
      <section className="mp-wrap container">
        <header className="mp-head">
          <button className="mp-back" onClick={goBack}>
            <FiArrowLeft /> Back
          </button>
          <h1 className="mp-title">Request a Meeting</h1>
        </header>
        <div className="mp-msg mp-err">
          Couldn’t load the profile. Please try again.
          <div className="mp-actions">
            <button className="mp-btn" onClick={goBack}>
              Return
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (["yes", "pending", "refused"].includes(exist)) {
    return (
      <section className="mp-wrap container">
        <header className="mp-head">
          <button className="mp-back" onClick={goBack}>
            <FiArrowLeft /> Back
          </button>
          <h1 className="mp-title">Request a Meeting</h1>
        </header>

        <ActorCard summary={summary} role={role} />

        <StatusBanner
          variant={exist}
          details={existData || {}}
          onBack={goBack}
          onGoMeetings={() => {
            try {
              window.location.href = "/meetings";
            } catch {
              goBack();
            }
          }}
        />
      </section>
    );
  }

  /* ----------------------- normal flow ----------------------- */
  return (
    <>
      <HeaderShell top={topbar} nav={navItems} cta={cta} />
      <section className="mp-wrap container">
        <header className="mp-head">
          <button className="mp-back" onClick={goBack}>
            <FiArrowLeft /> Back
          </button>
          <h1 className="mp-title">Request a Meeting</h1>
        </header>

        <div className="mp-grid">
          {/* LEFT — keep as-is */}
          <div className="mp-col">
            <ActorCard summary={summary} role={role} />

            {/* Preferences (fixed mapping & arrays) */}
            <section className="mp-card">
              <div className="mp-card-head">
                <h3 className="mp-card-title">Preferences</h3>
              </div>
              <div className="mp-kv">
                <span className="mp-k">Preferred language</span>
                <span className="mp-v">{prefs.language || "—"}</span>
              </div>

              <div className="mp-kv">
                <span className="mp-k">Business sector</span>
                <span className="mp-v">{prefs.sector || "—"}</span>
              </div>
              <div className="mp-par">
                <div className="mp-par-label">Offering</div>
                <p>{prefs.offering || "—"}</p>
              </div>
              <div className="mp-par">
                <div className="mp-par-label">Looking for</div>
                <p>{prefs.lookingFor || "—"}</p>
              </div>
              {"investmentSeeking" in prefs ? (
                <div className="mp-kv">
                  <span className="mp-k">Investment seeking</span>
                  <span className="mp-v">{fmtBool(prefs.investmentSeeking)}</span>
                </div>
              ) : null}
              {prefs.investmentRange ? (
                <div className="mp-kv">
                  <span className="mp-k">Investment range</span>
                  <span className="mp-v">{prefs.investmentRange}</span>
                </div>
              ) : null}
            </section>
          </div>

          {/* RIGHT — form (same, with last-day & >=09:00 slot rules) */}
          <div className="mp-col">
            <form className="mp-card mp-form" onSubmit={onSubmit} noValidate>
              <div className="mp-card-head">
                <h3 className="mp-card-title">Schedule</h3>
              </div>

              {/* Date — always the last day only */}
              <label className="mp-field">
                <span className="mp-label">
                  <FiCalendar /> Date
                </span>
                <select
                  className="mp-select"
                  value={dateStr || ""}
                  onChange={(e) => setDateStr(e.target.value)}
                  disabled={!lastDay || isSending}
                >
                  {!lastDay ? (
                    <option value="">No event dates</option>
                  ) : (
                    <option value={lastDay}>{fmtYMDLongUTC(lastDay)}</option>
                  )}
                </select>
                {!lastDay ? (
                  <div className="mp-help">Event dates were not provided.</div>
                ) : null}
              </label>

              {/* Slot selector — filtered to ≥ 09:00 */}
              <label className="mp-field">
                <span className="mp-label">
                  <FiCalendar /> Available time
                </span>
                <select
                  className={`mp-select ${fieldErr("slotKey") ? "is-invalid" : ""}`}
                  value={form.slotKey}
                  onChange={onChange("slotKey")}
                  onBlur={onBlur("slotKey")}
                  required
                  disabled={isSending || slotsLoading || !eventId || !id || !dateStr}
                >
                  <option value="">{slotsLoading ? "Loading…" : "Select a slot…"}</option>
                  {slots.map((s) => (
                    <option key={s.key} value={s.key}>{s.label}</option>
                  ))}
                </select>
                {fieldErr("slotKey") ? <div className="mp-error">{fieldErr("slotKey")}</div> : null}
                {!slotsLoading && !slots.length ? (
                  <div className="mp-help">No free slots (≥ 09:00) for this date.</div>
                ) : null}
              </label>

              {/* Purpose */}
              <label className="mp-field">
                <span className="mp-label"><FiTag /> Meeting purpose</span>
                <select
                  className={`mp-select ${fieldErr("purposeId") ? "is-invalid" : ""}`}
                  value={form.purposeId}
                  onChange={onChange("purposeId")}
                  onBlur={onBlur("purposeId")}
                  required
                  disabled={(purposeLoading && !purposes.length) || isSending}
                >
                  <option value="">
                    {purposeLoading && !purposes.length ? "Loading…" : "Choose purpose…"}
                  </option>
                  {purposes.map((p) => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </select>
                {fieldErr("purposeId") ? <div className="mp-error">{fieldErr("purposeId")}</div> : null}
                {!purposes.length && !purposeLoading ? (
                  <div className="mp-help">No purposes provided. Add in admin.</div>
                ) : null}
              </label>

              {/* Business model */}
              <label className="mp-field">
                <span className="mp-label"><FiLayers /> Business model</span>
                <select
                  className={`mp-select ${fieldErr("model") ? "is-invalid" : ""}`}
                  value={form.model}
                  onChange={onChange("model")}
                  onBlur={onBlur("model")}
                  required
                  disabled={isSending}
                >
                  <option value="">Select model…</option>
                  {["B2B", "B2C", "B2G"].map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                {fieldErr("model") ? <div className="mp-error">{fieldErr("model")}</div> : null}
              </label>

              {/* Message */}
              <label className="mp-field">
                <span className="mp-label"><FiSend /> Message (optional)</span>
                <textarea
                  rows={5}
                  className="mp-textarea"
                  placeholder="Context, agenda, or anything helpful…"
                  value={form.message}
                  onChange={onChange("message")}
                  disabled={isSending}
                />
                <div className="mp-help">Keep it concise (max ~1,000 chars).</div>
              </label>

              {sendErr ? (
                <div className="mp-inline-err">
                  <FiAlertTriangle />
                  {extractErr(sendError) || "Couldn’t send the request. Please try again."}
                </div>
              ) : null}

              <div className="mp-actions">
                <button
                  type="submit"
                  className={`mp-btn mp-primary ${!canSubmit ? "is-disabled" : ""}`}
                  disabled={!canSubmit}
                  title={!canSubmit ? "Complete required fields" : "Send request"}
                >
                  <FiSend />
                  {isSending ? "Sending…" : "Send request"}
                </button>
                <button type="button" className="mp-btn" onClick={goBack} disabled={isSending}>
                  <FiArrowLeft /> Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

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

/* --------------------------------- helpers --------------------------------- */
function extractErr(err) {
  if (!err) return "";
  const d = err.data || err.error || err;
  if (typeof d === "string") return d;
  if (typeof d?.message === "string") return d.message;
  if (typeof d?.error === "string") return d.error;
  try { return JSON.stringify(d); } catch { return "Unknown error"; }
}

function fmtBool(v) {
  if (v === true) return "Yes";
  if (v === false) return "No";
  return "—";
}

/* More tolerant mapper so prefs actually show up */
function pickPreferences(role, a = {}) {
  const j = (v) => (Array.isArray(v) ? v.filter(Boolean).join(", ") : v || "");
  const r = (role || "").toLowerCase();

  if (r === "speaker") {
    const talk = a.talk || {};
    const intent = a.b2bIntent || {};
    const pref = a.preferences || {};
    return {
      language: j(
        talk.language ||
          intent.language ||
          intent.preferredLanguages ||
          pref.language ||
          pref.languages
      ),
      model: intent.businessModel || intent.model || pref.model || "",
      sector:
        j(intent.sectors || intent.businessSectors) ||
        intent.businessSector ||
        "",
      offering: intent.offering || pref.offering || "",
      lookingFor: j(intent.lookingFor || intent.objectives || pref.lookingFor),
      investmentSeeking:
        typeof intent.investmentSeeking === "boolean"
          ? intent.investmentSeeking
          : undefined,
      investmentRange: intent.investmentRange || "",
    };
  }

  if (r === "exhibitor") {
    const biz = a.business || {};
    const com = a.commercial || {};
    const val = a.valueAdds || {};
    const pref = a.preferences || {};
    return {
      language: j(com.preferredLanguages || com.language || pref.languages),
      model: biz.businessModel || pref.model || "",
      sector:
        j([biz.industry, biz.subIndustry].filter(Boolean)) ||
        j(biz.sectors) ||
        "",
      offering: com.offering || pref.offering || "",
      lookingFor: j(com.lookingFor || pref.lookingFor),
      investmentSeeking:
        typeof val.investmentSeeking === "boolean"
          ? val.investmentSeeking
          : undefined,
      investmentRange: val.investmentRange || "",
    };
  }

  // attendee / default
  const bp = a.businessProfile || {};
  const mi = a.matchingIntent || {};
  const aids = a.matchingAids || {};
  const pref = a.preferences || {};
  const looking =
    j(mi.objectives) || mi.needs || j(pref.lookingFor) || "";

  return {
    language: j(aids.language || pref.languages || pref.language),
    model: bp.businessModel || pref.model || "",
    sector:
      j([bp.primaryIndustry, bp.subIndustry].filter(Boolean)) ||
      j(bp.sectors) ||
      "",
    offering: mi.offering || pref.offering || "",
    lookingFor: looking,
    // most attendees won’t have these:
    // undefined = don’t render the row at all
  };
}

function ActorCard({ summary, role }) {
  const { name, email, photo, org, loc } = summary || {};
  const initials = (str = "") =>
    String(str)
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((x) => x[0]?.toUpperCase?.() || "")
      .join("") || "—";
  return (
    <section className="mp-card">
      <div className="mp-actor">
        <div className="mp-avatar" aria-hidden="true">
          {photo ? <img src={imageLink(photo)} alt="" /> : <span>{initials(name || org)}</span>}
        </div>
        <div className="mp-ameta">
          <h3 className="mp-aname">{name || "—"}</h3>
          <div className="mp-row">
            <span className="mp-chip -role">{role || "—"}</span>
            {org ? <span className="mp-chip">{org}</span> : <span className="mp-chip -muted">—</span>}
            {loc ? (
              <span className="mp-chip">
                <FiMapPin />
                {loc}
              </span>
            ) : (
              <span className="mp-chip -muted">—</span>
            )}
          </div>
          <div className="mp-row">
            <span className="mp-chip">
              <FiUser />
              {name || "—"}
            </span>
            <span className="mp-chip">
              <FiMail />
              {email || "—"}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
