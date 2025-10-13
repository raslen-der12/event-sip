import React from "react";
import { useSearchParams } from "react-router-dom";
import "../../../components/admin/admin.css";
import "../../../components/admin/dashboard/admin.dashboard.css";
import "./admin.event-edit.css";

import {
  useGetEventsAdminQuery,
  useGetFullEventQuery,
  useCreateEventMutation,
  useUpdateEventMutation,
  useDeleteEventMutation,
} from "../../../features/events/eventsApiSlice";

// PURE children (no hooks inside)
import GalleryManager from "../../../components/admin/events/GalleryManager";
import CommentsManager from "../../../components/admin/events/CommentsManager";
import OrganizerManager from "../../../components/admin/events/OrganizerManager";
import ScheduleManager from "../../../components/admin/events/ScheduleManager";
import FeaturesManager from "../../../components/admin/events/FeaturesManager";
import ImpactManager from "../../../components/admin/events/ImpactManager";
import imageLink from "../../../utils/imageLink";

export default function AdminEventEditor() {
  const [sp, setSP] = useSearchParams();
const eventId = sp.get("id") || "68e6764bb4f9b08db3ccec04";
  // Top list (vertical on desktop, horizontal on mobile) — unchanged layout classes
  const { data: listResp = [], isLoading: loadingList } = useGetEventsAdminQuery({ limit: 200 });
  const list = Array.isArray(listResp) ? listResp : (listResp?.items || []);

  // Full bundle (event + grouped collections)
  const { data: bundle, isLoading: loadingOne, refetch } = useGetFullEventQuery(eventId, { skip: !eventId });

  // Normalize (some collections can be undefined/null from backend)
  const event       = bundle?.event ?? bundle ?? null;

  // collections by model
  const gallery     = (bundle?.gallery     ?? []) || [];    // [{ id,_id,file,type:'image|video|pdf', title }]
  const comments    = (bundle?.comments    ?? []) || [];    // [{ id,_id,text,verified,id_event,... }]
  const organizers  = (bundle?.organizers  ?? []) || [];    // [{ id,_id,logo,link,type }]
  const schedule    = (bundle?.schedule    ?? []) || [];    // [{ id,_id,sessionTitle,room,startTime,endTime,speaker }]
  const features    = (bundle?.features    ?? []) || [];    // [{ id,_id,title,subtitle,desc,image }]
  const impacts     = (bundle?.impacts ?? bundle?.impact ?? []) || []; // [{ id,_id,title,description }]

  const [createEvent] = useCreateEventMutation();
  const [updateEvent] = useUpdateEventMutation();
  const [deleteEvent] = useDeleteEventMutation();

  const setQuery = (key, val) => {
  const next = new URLSearchParams(sp.toString());
  if (val == null) next.delete(key);
  else next.set(key, val);
  setSP(next, { replace: true });
};

const goTo = (id) => {
  setQuery("id", id);
  window.scrollTo({ top: 0, behavior: "smooth" });
};

const back = () => {
  setQuery("id", null);
};
  // Cover & gallery mode
  const coverUrl = event?.cover || event?.coverUrl || event?.mainPhoto || null;
  const hasCover = !!coverUrl;
  const [coverMode, setCoverMode] = React.useState(false);
  React.useEffect(() => {
    // If no cover & no gallery => default to cover replacement
    const noGallery = !Array.isArray(gallery) || gallery.length === 0;
    setCoverMode(!hasCover && noGallery);
  }, [hasCover, gallery?.length]);

  /* ---------------- EVENT (root) actions ---------------- */
  const saveEvent = async (patch) => {
    if (!eventId) return;
    await updateEvent({ id: eventId, ...patch });
    await refetch();
  };
  const publishEvent = async (next) => saveEvent({ isPublished: !!next });
  const cancelEvent  = async (next) => saveEvent({ isCancelled: !!next });

  /* ---------------- COLLECTION actions ------------------ */
  // GALLERY
  const uploadCover   = async (file)                     => { await updateEvent({ id: eventId, cover: file }); await refetch(); };
  const uploadGallery = async (file, title = "", type)   => { await updateEvent({ id: eventId, gallery: { file, title, type } }); await refetch(); };
  const deleteGallery = async (gid)                      => { await deleteEvent({ id: eventId, gallery: { id: gid } }); await refetch(); };

  // COMMENTS (verified only, no "refused" in model)
  const approveComments = async (ids = [])               => { for (const id of ids) await updateEvent({ id: eventId, comment: { id, verified: true } }); await refetch(); };
  const unverifyComments= async (ids = [])               => { for (const id of ids) await updateEvent({ id: eventId, comment: { id, verified: false } }); await refetch(); };
  const deleteComments  = async (ids = [])               => { for (const id of ids) await deleteEvent({ id: eventId, comment: { id } }); await refetch(); };

  // ORGANIZERS (logo/link/type)
  const createOrg  = async (payload)                     => { await updateEvent({ id: eventId, organizer: { ...payload } }); await refetch(); };
  const updateOrg  = async (oid, patch)                  => { await updateEvent({ id: eventId, organizer: { id: oid, ...patch } }); await refetch(); };
  const deleteOrg  = async (oid)                         => { await deleteEvent({ id: eventId, organizer: { id: oid } }); await refetch(); };
  const reorderOrg = async (order = [])                  => { for (const row of order) await updateEvent({ id: eventId, organizers: { id: row.id, order: row.order } }); await refetch(); };
  const uploadLogo = async (oid, file)                   => { await updateEvent({ id: eventId, organizer: { id: oid, logo: file } }); await refetch(); };

  // SCHEDULE (sessionTitle, start/end as Date ISO, group by day client-side)
  const createSlot = async (payload)                     => { await updateEvent({ id: eventId, schedule: { ...payload } }); await refetch(); };
  const updateSlot = async (sid, patch)                  => { await updateEvent({ id: eventId, schedule: { id: sid, ...patch } }); await refetch(); };
  const deleteSlot = async (sid)                         => { await deleteEvent({ id: eventId, schedule: { id: sid } }); await refetch(); };
  const reorderDay = async (order = [], day = null)      => { for (const row of order) await updateEvent({ id: eventId, schedule: { id: row.id, order: row.order } }); await refetch(); };

  // FEATURES (title,subtitle,desc,image)
  const createFeat = async (payload)                     => { await updateEvent({ id: eventId, feature: { ...payload } }); await refetch(); };
  const updateFeat = async (fid, patch)                  => { await updateEvent({ id: eventId, feature: { id: fid, ...patch } }); await refetch(); };
  const deleteFeat = async (fid)                         => { await deleteEvent({ id: eventId, feature: { id: fid } }); await refetch(); };

  // IMPACTS (title, description)
  const createImpact = async (payload)                   => { await updateEvent({ id: eventId, impact: { ...payload } }); await refetch(); };
  const updateImpact = async (iid, patch)                => { await updateEvent({ id: eventId, impact: { id: iid, ...patch } }); await refetch(); };
  const deleteImpact = async (iid)                       => { await deleteEvent({ id: eventId, impact: { id: iid } }); await refetch(); };

  return (
    <div className="editor-page">
      {!eventId ? (
        <PickAndCreate
          loading={loadingList}
          items={list}
          onPick={(id) => goTo(id)}
          onCreate={async (payload) => {
            const res = await createEvent({ ...payload, isPublished: false, isCancelled: false });
            const newId = res?.data?.id || res?.data?._id || res?.id || res?._id;
            if (newId) goTo(newId);
          }}
        />
      ) : (
        <>
          <EditCore
            loading={loadingOne}
            event={event}
            onBack={back}
            onSave={saveEvent}
            onPublish={publishEvent}
            onCancel={cancelEvent}
          />

          {/* Media: cover + gallery */}
          <GalleryManager
            items={gallery}
            hasCover={!!hasCover}
            coverUrl={coverUrl || ""}
            coverMode={coverMode}
            onToggleCoverMode={() => setCoverMode((v) => !v)}
            onUploadCover={uploadCover}
            onUploadGallery={uploadGallery}
            onDeleteGallery={deleteGallery}
          />

          {/* Comments */}
          <CommentsManager
            items={comments}
            onApprove={approveComments}
            onUnverify={unverifyComments}
            onDelete={deleteComments}
          />

          {/* Organizers */}
          <OrganizerManager
            items={organizers}
            onCreate={createOrg}
            onUpdate={updateOrg}
            onDelete={deleteOrg}
            onReorder={reorderOrg}
            onUploadLogo={uploadLogo}
          />

          {/* Schedule */}
          <ScheduleManager
            items={schedule}
            onCreate={createSlot}
            onUpdate={updateSlot}
            onDelete={deleteSlot}
            onReorder={reorderDay}
            eventStart={event?.startDate}
            eventEnd={event?.endDate}
          />

          {/* Features */}
          <FeaturesManager
            items={features}
            onCreate={createFeat}
            onUpdate={updateFeat}
            onDelete={deleteFeat}
          />

          {/* Impacts */}
          <ImpactManager
            items={impacts}
            onCreate={createImpact}
            onUpdate={updateImpact}
            onDelete={deleteImpact}
          />
        </>
      )}
    </div>
  );
}

/* ---------------- Pick + Create (vertical desktop / horizontal mobile) ---------------- */
function PickAndCreate({ loading, items = [], onPick, onCreate }) {
  return (
    <div className="card p-12 editor-wrap">
      <h3 className="card-title">Pick an event</h3>
      <div className="pick-rail vert">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="pick-card pick-card--vert skeleton">
                <div className="pick-thumb" />
                <div className="pick-text">
                  <div className="sk-line" />
                  <div className="sk-sub" />
                </div>
              </div>
            ))
          : items.length
          ? items.map((e) => {
              const id = e.id || e._id;
              const name = e.title || e.name || "Untitled";
              const cover = e.coverUrl || e.cover || e.image || "";
              return (
                <button key={id} className="pick-card pick-card--vert" onClick={() => onPick(id)} title={name}>
                  <div className="pick-thumb" style={{ backgroundImage: cover ? `url(${imageLink(cover)})` : "none" }} />
                  <div className="pick-text">
                    <div className="pick-name line-2">{name}</div>
                    <div className="pick-sub">{e.city || "—"}, {e.country || "—"}</div>
                  </div>
                </button>
              );
            })
          : <div className="pick-empty">No events yet.</div>}
      </div>

      <h3 className="card-title" style={{ marginTop: 16 }}>Create new event</h3>
      <CreateEventForm onSubmit={onCreate} />
    </div>
  );
}

function CreateEventForm({ onSubmit }) {
  const [f, setF] = React.useState({
    title: "", description: "",
    city: "", state: "", address: "",
    venueName: "", slug: "", mapLink: "", target: "Public",
    country: "TN",
    startDate: "", endDate: "", registrationDeadline: "",
    capacity: 0,
  });
  const change = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const okDates = f.startDate && f.endDate && new Date(f.endDate) > new Date(f.startDate);
  const ok = f.title.trim() && okDates;
  return (
    <form className="form-grid" onSubmit={(e)=>{ e.preventDefault(); if (ok) onSubmit({ ...f, capacity: Number(f.capacity)||0 }); }}>
      <label className="field"><div className="field-label">Title *</div><div className="field-ctrl"><input className="input" value={f.title} onChange={(e)=>change("title", e.target.value)} /></div></label>
      <label className="field full"><div className="field-label">Description</div><div className="field-ctrl"><textarea className="input" rows={3} value={f.description} onChange={(e)=>change("description", e.target.value)} /></div></label>

      <label className="field"><div className="field-label">City</div><div className="field-ctrl"><input className="input" value={f.city} onChange={(e)=>change("city", e.target.value)} /></div></label>
      <label className="field"><div className="field-label">State</div><div className="field-ctrl"><input className="input" value={f.state} onChange={(e)=>change("state", e.target.value)} /></div></label>
      <label className="field full"><div className="field-label">Address</div><div className="field-ctrl"><input className="input" value={f.address} onChange={(e)=>change("address", e.target.value)} /></div></label>

      <label className="field"><div className="field-label">Venue name</div><div className="field-ctrl"><input className="input" value={f.venueName} onChange={(e)=>change("venueName", e.target.value)} /></div></label>
      <label className="field"><div className="field-label">Slug</div><div className="field-ctrl"><input className="input" value={f.slug} onChange={(e)=>change("slug", e.target.value)} /></div></label>
      <label className="field full"><div className="field-label">Map link</div><div className="field-ctrl"><input className="input" value={f.mapLink} onChange={(e)=>change("mapLink", e.target.value)} /></div></label>

      <label className="field"><div className="field-label">Country</div><div className="field-ctrl"><select className="input select" value={f.country} onChange={(e)=>change("country", e.target.value)}>{["TN","FR","DE","US","MA","AE","GB","IT","ES"].map(c=><option key={c}>{c}</option>)}</select></div></label>
      <label className="field"><div className="field-label">Target</div><div className="field-ctrl"><select className="input select" value={f.target} onChange={(e)=>change("target", e.target.value)}><option>Public</option><option>B2B</option><option>B2C</option></select></div></label>
      <label className="field"><div className="field-label">Start *</div><div className="field-ctrl"><input type="date" className="input" value={f.startDate} onChange={(e)=>change("startDate", e.target.value)} /></div></label>
      <label className="field"><div className="field-label">End *</div><div className="field-ctrl"><input type="date" className="input" value={f.endDate} onChange={(e)=>change("endDate", e.target.value)} /></div></label>
      <label className="field"><div className="field-label">Reg. deadline</div><div className="field-ctrl"><input type="date" className="input" value={f.registrationDeadline} onChange={(e)=>change("registrationDeadline", e.target.value)} /></div></label>
      <label className="field"><div className="field-label">Capacity</div><div className="field-ctrl"><input type="number" min="0" className="input" value={f.capacity} onChange={(e)=>change("capacity", e.target.value)} /></div></label>

      <div className="form-actions"><button className="btn brand" disabled={!ok}>Create</button></div>
      {!ok && <small className="muted">Title and valid start/end dates are required.</small>}
    </form>
  );
}

/* ---------------- Editor (fixed hooks, all event fields) ---------------- */
function EditCore({ loading, event, onBack, onSave, onPublish, onCancel }) {
  const initial = React.useMemo(
    () => ({
      title: event?.title || "",
      description: event?.description || "",
      city: event?.city || "",
      state: event?.state || "",
      address: event?.address || "",
      venueName: event?.venueName || "",
      slug: event?.slug || "",
      mapLink: event?.mapLink || "",
      country: event?.country || "TN",
      target: event?.target || "Public",
      startDate: toInput(event?.startDate),
      endDate: toInput(event?.endDate),
      registrationDeadline: toInput(event?.registrationDeadline),
      capacity: event?.capacity ?? 0,
      isPublished: !!event?.isPublished,
      isCancelled: !!event?.isCancelled,
    }),
    [event]
  );
  const [f, setF] = React.useState(initial);
  React.useEffect(() => setF(initial), [initial]);

  const ok = f.title.trim() && f.startDate && f.endDate && new Date(f.endDate) > new Date(f.startDate);
  const showSkeleton = loading && !event;
  const showNotFound = !loading && !event;

  return (
    <div className="card p-12 editor-wrap">
      {showSkeleton && (<><div className="editor-head"><div className="sk-title" /><div className="sk-actions" /></div><div className="sk-block" /><div className="sk-block" /></>)}
      {showNotFound && (
        <div className="editor-head">
          <h3 className="card-title">Event not found</h3>
          <div><button className="btn" onClick={onBack}>Back</button></div>
        </div>
      )}

      {!showSkeleton && !showNotFound && (
        <>
          <div className="editor-head">
            <div className="editor-title">
              <h3 className="h3 line-2" title={f.title}>{f.title}</h3>
              <div className="muted">{f.city || "—"}, {f.country || "—"}</div>
            </div>
            <div className="d-row" style={{ gap: 8 }}>
              <label className="switch">
                <input type="checkbox" checked={!!f.isPublished} disabled={!!f.isCancelled}
                  onChange={(e)=>{ const v=e.target.checked; setF(s=>({ ...s, isPublished:v })); onPublish(v); }} />
                <span>Published</span>
              </label>
              <label className="switch">
                <input type="checkbox" checked={!!f.isCancelled}
                  onChange={(e)=>{ const v=e.target.checked; setF(s=>({ ...s, isCancelled:v })); onCancel(v); }} />
                <span>Cancelled</span>
              </label>
              <button className="btn" onClick={onBack}>Back</button>
            </div>
          </div>

          <form
            className="form-grid"
            onSubmit={(e) => {
              e.preventDefault();
              if (!ok) return;
              onSave({
                title: f.title.trim(),
                description: f.description.trim(),
                city: f.city.trim(),
                state: f.state.trim(),
                address: f.address.trim(),
                venueName: f.venueName.trim(),
                slug: f.slug.trim(),
                mapLink: f.mapLink.trim(),
                country: f.country,
                target: f.target,
                startDate: f.startDate,
                endDate: f.endDate,
                registrationDeadline: f.registrationDeadline || null,
                capacity: Number(f.capacity) || 0,
              });
            }}
          >
            <label className="field full"><div className="field-label">Title *</div><div className="field-ctrl"><input className="input" value={f.title} onChange={(e)=>setF({...f, title:e.target.value})} /></div></label>
            <label className="field full"><div className="field-label">Description</div><div className="field-ctrl"><textarea rows={4} className="input" value={f.description} onChange={(e)=>setF({...f, description:e.target.value})} /></div></label>

            <label className="field"><div className="field-label">City</div><div className="field-ctrl"><input className="input" value={f.city} onChange={(e)=>setF({...f, city:e.target.value})} /></div></label>
            <label className="field"><div className="field-label">State</div><div className="field-ctrl"><input className="input" value={f.state} onChange={(e)=>setF({...f, state:e.target.value})} /></div></label>
            <label className="field full"><div className="field-label">Address</div><div className="field-ctrl"><input className="input" value={f.address} onChange={(e)=>setF({...f, address:e.target.value})} /></div></label>
            <label className="field"><div className="field-label">Venue name</div><div className="field-ctrl"><input className="input" value={f.venueName} onChange={(e)=>setF({...f, venueName:e.target.value})} /></div></label>

            <label className="field"><div className="field-label">Slug</div><div className="field-ctrl"><input className="input" value={f.slug} onChange={(e)=>setF({...f, slug:e.target.value})} /></div></label>
            <label className="field full"><div className="field-label">Map link</div><div className="field-ctrl"><input className="input" value={f.mapLink} onChange={(e)=>setF({...f, mapLink:e.target.value})} /></div></label>

            <label className="field"><div className="field-label">Country</div><div className="field-ctrl"><select className="input select" value={f.country} onChange={(e)=>setF({...f, country:e.target.value})}>{["TN","FR","DE","US","MA","AE","GB","IT","ES"].map(c=><option key={c}>{c}</option>)}</select></div></label>
            <label className="field"><div className="field-label">Target</div><div className="field-ctrl"><select className="input select" value={f.target} onChange={(e)=>setF({...f, target:e.target.value})}><option>Public</option><option>B2B</option><option>B2C</option></select></div></label>

            <label className="field"><div className="field-label">Start *</div><div className="field-ctrl"><input type="date" className="input" value={f.startDate} onChange={(e)=>setF({...f, startDate:e.target.value})} /></div></label>
            <label className="field"><div className="field-label">End *</div><div className="field-ctrl"><input type="date" className="input" value={f.endDate} onChange={(e)=>setF({...f, endDate:e.target.value})} /></div></label>
            <label className="field"><div className="field-label">Reg. deadline</div><div className="field-ctrl"><input type="date" className="input" value={f.registrationDeadline} onChange={(e)=>setF({...f, registrationDeadline:e.target.value})} /></div></label>

            <label className="field"><div className="field-label">Capacity</div><div className="field-ctrl"><input type="number" min="0" className="input" value={f.capacity} onChange={(e)=>setF({...f, capacity:Number(e.target.value)||0})} /></div></label>

            <div className="form-actions"><button className="btn brand" disabled={!ok}>Save changes</button></div>
          </form>
        </>
      )}
    </div>
  );
}

function toInput(d){ if(!d) return ""; const t=new Date(d); const y=t.getFullYear(); const m=String(t.getMonth()+1).padStart(2,"0"); const da=String(t.getDate()).padStart(2,"0"); return `${y}-${m}-${da}`; }