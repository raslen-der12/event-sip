import React from "react";
let _open;
export function openCropper(file, cb){ _open?.(file, cb); }
export function CropPortal(){
  const [state, set] = React.useState(null);
  React.useEffect(()=>{ _open = (file, cb)=>{ const r=new FileReader(); r.onload=()=>set({ src:r.result, cb }); r.readAsDataURL(file); }; },[]);
  if (!state) return null;
  return <CropModal src={state.src} onClose={()=>set(null)} onDone={(blob)=>{ state.cb?.(blob); set(null); }} />;
}
function CropModal({ src, onClose, onDone }){
  const img=React.useRef(null); const [z,setZ]=React.useState(1), [x,setX]=React.useState(0), [y,setY]=React.useState(0);
  const crop=()=>{ const size=512, c=document.createElement("canvas"); c.width=size; c.height=size; const ctx=c.getContext("2d");
    const i=img.current, iw=i.naturalWidth, ih=i.naturalHeight, s=Math.max(size/iw,size/ih)*z, dx=(size-iw*s)/2+x, dy=(size-ih*s)/2+y;
    ctx.fillStyle="#fff"; ctx.fillRect(0,0,size,size); ctx.drawImage(i,0,0,iw,ih,dx,dy,iw*s,ih*s);
    c.toBlob(b=>b&&onDone(b),"image/jpeg",0.9);
  };
  return (<div className="org-crop-backdrop"><div className="org-crop-modal card p-10">
    <div className="org-crop-area"><img ref={img} src={src} alt="" className="org-crop-img" style={{ transform:`translate(${x}px,${y}px) scale(${z})` }} /><div className="org-crop-frame"/></div>
    <div className="org-crop-controls">
      <label>Zoom <input type="range" min="1" max="3" step="0.01" value={z} onChange={(e)=>setZ(+e.target.value)}/></label>
      <label>Offset X <input type="range" min="-200" max="200" step="1" value={x} onChange={(e)=>setX(+e.target.value)}/></label>
      <label>Offset Y <input type="range" min="-200" max="200" step="1" value={y} onChange={(e)=>setY(+e.target.value)}/></label>
    </div>
    <div className="org-crop-actions"><button className="btn" onClick={onClose}>Cancel</button><button className="btn brand" onClick={crop}>Save crop</button></div>
  </div></div>);
}
