import React from "react";
import "./admin.dashboard.css";

function Meter({ label, value = 0, total = 0, colorVar = "var(--c2)" }) {
  const vNum = Number(value) || 0;
  const tNum = Math.max(0, Number(total) || 0);
  const pct = tNum ? Math.round((vNum / tNum) * 100) : 0;
  return (
    <div className="meter-row">
      <div className="meter-head">
        <div className="meter-label">{label}</div>
        <div className="meter-val">{vNum.toLocaleString()} ({pct}%)</div>
      </div>
      <div className="meter-track"><div className="meter-fill" style={{ width: `${pct}%`, background: colorVar }} /></div>
    </div>
  );
}

export default function VerificationCard({
  total = 0,
  verification = { verified: 0, unverified: 0, adminVerified: 0, adminPending: 0, adminRejected: 0 },
}) {
  return (
    <section className="card">
      <div className="card-head"><h3 className="card-title">Verification & Admin</h3></div>
      <div className="meter-wrap">
        <Meter label="Email Verified" value={verification.verified} total={total} colorVar="var(--c3)" />
        <Meter label="Email Not Verified" value={verification.unverified} total={total} colorVar="var(--c5)" />
        <Meter label="Admin Verified" value={verification.adminVerified} total={total} colorVar="var(--c1)" />
        <Meter label="Admin Pending" value={verification.adminPending} total={total} colorVar="var(--c4)" />
        {"adminRejected" in verification ? (
          <Meter label="Admin Rejected" value={verification.adminRejected} total={total} colorVar="var(--c6)" />
        ) : null}
      </div>
    </section>
  );
}
