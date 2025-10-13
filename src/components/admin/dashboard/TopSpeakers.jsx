import React from "react";
import "./admin.dashboard.css";
import { FiStar } from "react-icons/fi";

export default function TopSpeakers({
  title = "Top speakers",
  items = [
    { name: "Leila Ben Y.", org: "Green Labs",     topic: "Sustainability", sessions: 3, rating: 4.9, avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=160" },
    { name: "Omar Trabelsi", org: "DataJinn",      topic: "AI & Data",      sessions: 2, rating: 4.8, avatar: "https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?q=80&w=160" },
    { name: "Sara Kacem",    org: "MediTech",      topic: "HealthTech",     sessions: 2, rating: 4.7, avatar: "https://images.unsplash.com/photo-1545996124-0501ebae84d0?q=80&w=160" },
    { name: "Yassine M.",    org: "AgriNext",      topic: "AgriTech",       sessions: 1, rating: 4.6, avatar: "https://images.unsplash.com/photo-1511367461989-f85a21fda167?q=80&w=160" },
  ],
}) {
  return (
    <section className="card">
      <div className="card-head">
        <h3 className="card-title">{title}</h3>
      </div>

      <div className="tops-list">
        {items.map((s, i) => (
          <div className="tops-item" key={i}>
            <img className="avatar" src={s.avatar} alt="" />
            <div className="tops-main">
              <div className="tops-name">{s.name}</div>
              <div className="tops-sub">{s.org} • {s.topic}</div>
            </div>
            <div className="tops-meta">
              <div className="stars" aria-label={`${s.rating} stars`}>
                {Array.from({ length: 5 }).map((_, k) => (
                  <FiStar key={k} className={k < Math.round(s.rating - 0.1) ? "on" : ""} />
                ))}
              </div>
              <div className="tops-sessions">{s.sessions} sessions</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
