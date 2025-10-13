import React from "react";
import "./gallery.manager.css";
import imageLink from "../../../utils/imageLink";
/**
 * Matches gallery model:
 * - create:  { id, gallery: { file, title, type: 'image'|'video'|'pdf' } }
 * - delete:  { id, gallery: { id } }
 * Cover replacement is done via root { cover: file } in parent.
 */
export default function GalleryManager({
  items = [],
  hasCover = false,
  coverUrl = "",
  coverMode = false,
  onToggleCoverMode,
  onUploadCover,
  onUploadGallery,
  onDeleteGallery,
}) {
  const [dragOver, setDragOver] = React.useState(false);
  const [queue, setQueue] = React.useState([]);
  const [err, setErr] = React.useState("");
  const [title, setTitle] = React.useState(""); // caption/title for gallery items

  const deduceType = (f) => {
    const name = (f?.name || "").toLowerCase();
    if (name.endsWith(".pdf")) return "pdf";
    if (/\.(mp4|mov|webm|m4v|avi|mkv)$/.test(name)) return "video";
    return "image";
  };

  const handleFiles = async (files) => {
    const arr = Array.from(files || []);
    if (!arr.length) return;

    setQueue(arr.map((f) => ({ name: f.name, progress: 0 })));

    for (let i = 0; i < arr.length; i++) {
      let p = 0;
      const t = setInterval(() => { p = Math.min(p + 8, 92); setQueue((q) => q.map((x,ix)=>ix===i?{...x,progress:p}:x)); }, 100);

      try {
        if (coverMode) {
          await onUploadCover?.(arr[i]); // replace cover (only way to change cover)
        } else {
          const type = deduceType(arr[i]);
          await onUploadGallery?.(arr[i], title.trim(), type);
        }
      } catch {
        setErr(`Upload failed: ${arr[i].name}`);
      }

      clearInterval(t);
      setQueue((q) => q.map((x,ix)=>ix===i?{...x,progress:100}:x));
    }

    setTimeout(() => setQueue([]), 400);
    if (!coverMode) setTitle("");
  };

  return (
    <section className="card soft p-10 gm">
      <div className="gm-head">
        <div>
          <div className="gm-title">Media</div>
          <div className="muted">Cover can’t be deleted — only replaced. Gallery supports images, video, and PDF.</div>
        </div>
        <div className="gm-switch">
          <label className={`gm-cover-toggle ${coverMode ? "is-on" : ""}`} title="Toggle to replace event cover">
            <input type="checkbox" checked={coverMode} onChange={onToggleCoverMode} />
            <span className="gm-knob" />
            <span className="gm-lbl">{coverMode ? "Replace Cover" : "Upload to Gallery"}</span>
          </label>
        </div>
      </div>

      {/* Current cover */}
      <div className="gm-coverbar">
        <div className="gm-coverthumb" style={{ backgroundImage: hasCover ? `url(${ imageLink(coverUrl)})` : "none" }}>
          {!hasCover ? <span className="gm-coverempty">No cover yet</span> : null}
        </div>
        {!coverMode ? (
          <div className="gm-coverinfo">
            <div className="gm-caption">
              <input
                className="input"
                placeholder="Title/caption for next gallery uploads (optional)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
          </div>
        ) : <div className="gm-coverinfo"><div className="muted">Next uploads will replace the cover.</div></div>}
      </div>

      {/* Drop zone */}
      <div
        className={`gm-drop ${dragOver ? "is-over" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
      >
        <div className="gm-drop-inner">
          <div className="gm-drop-icon">⬆️</div>
          <div className="gm-drop-text">
            Drag & drop files or{" "}
            <label className="gm-link">
              <input type="file" hidden multiple accept="image/*,video/*,application/pdf" onChange={(e)=>handleFiles(e.target.files)} />
              browse
            </label>
          </div>
          <div className="gm-drop-hint">{coverMode ? "Will replace cover" : "Will be added to gallery"}</div>
        </div>
      </div>

      {/* Queue */}
      {queue.length ? (
        <div className="gm-queue">
          {queue.map((q,i)=>(
            <div key={i} className="gm-qrow">
              <div className="gm-qname line-1">{q.name}</div>
              <div className="gm-qbar"><div className="gm-qbar-fill" style={{ width: `${q.progress}%` }} /></div>
              <div className="gm-qpct">{q.progress}%</div>
            </div>
          ))}
        </div>
      ) : null}
      {err ? <div className="gm-error">{err}</div> : null}

      {/* Gallery grid */}
      <div className="gm-grid">
        {items.map((g) => {
          const id = g.id || g._id;
          const kind = g.type || "image";
          const isImg = kind === "image";
          return (
            <div key={id} className="gm-item">
              <div className={`gm-thumb ${isImg ? "" : "gm-file"}`} style={{ backgroundImage: isImg ? `url(${g.file})` : "none" }}>
                {!isImg ? <div className="gm-kind">{kind === "pdf" ? "PDF" : "VIDEO"}</div> : null}
              </div>
              {g.title ? <div className="gm-cap line-2" title={g.title}>{g.title}</div> : null}
              <div className="gm-actions">
                <button className="btn tiny danger" onClick={() => onDeleteGallery?.(id)}>Delete</button>
              </div>
            </div>
          );
        })}
        {!items.length && <div className="muted" style={{ padding: 8 }}>No gallery yet.</div>}
      </div>
    </section>
  );
}
