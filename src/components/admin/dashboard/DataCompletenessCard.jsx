import React, { useEffect, useState } from "react";

export default function DataCompletenessCard({ data = { withPhotoPct: 0, withLinksPct: 0, completeProfilePct: 0 } }) {
    console.log(data);
    const [photoPct,setPhotoPct] = useState(0);
    const [linksBothPct,setlinksBothPct] = useState(0);
    const [orgPct,setOrgPct] = useState(0);
    useEffect(()=>{
        setPhotoPct(data.photoPct);
        setlinksBothPct(data.linksBothPct);
        setOrgPct(data.orgPct);
    },[data])
  const p = (n) => `${Math.max(0, Math.min(100, Number(n) || 0))}%`;
  return (
    <section className="dash-card">
      <div className="dash-card-head">
        <h3>Data Completeness</h3>
        <div className="sub">Profile coverage overview</div>
      </div>

      <div className="meter-row">
        <div className="meter-k">With Photo</div>
        <div className="meter">
          <div className="meter-bar" style={{ width: p(data.photoPct) }} />
        </div>
        <div className="meter-v">{p(data.photoPct)}</div>
      </div>

      <div className="meter-row">
        <div className="meter-k">With Links</div>
        <div className="meter">
          <div className="meter-bar" style={{ width: p(data.linksBothPct) }} />
        </div>
        <div className="meter-v">{p(data.linksBothPct)}</div>
      </div>

      <div className="meter-row">
        <div className="meter-k">Complete Profile</div>
        <div className="meter">
          <div className="meter-bar" style={{ width: p(data.orgPct) }} />
        </div>
        <div className="meter-v">{p(data.orgPct)}</div>
      </div>
    </section>
  );
}
