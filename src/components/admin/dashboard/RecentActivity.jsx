import React from "react";
import { FiCreditCard, FiUserPlus, FiCheckCircle, FiMessageSquare } from "react-icons/fi";
import "./admin.dashboard.css";

const iconMap = {
  payment: FiCreditCard,
  signup: FiUserPlus,
  checkin: FiCheckCircle,
  comment: FiMessageSquare,
};

export default function RecentActivity({
  items = [
    { type: "payment", title: "Bill paid", sub: "INV-341 • AI Summit", time: "2m" },
    { type: "signup",  title: "Speaker registered", sub: "Dr. Sara K.", time: "18m" },
    { type: "checkin", title: "150 on-site check-ins", sub: "DIF", time: "1h" },
    { type: "comment", title: "New comment", sub: "“Great logistics!”", time: "3h" },
  ],
  title = "Recent activity",
}) {
  return (
    <section className="card">
      <div className="card-head">
        <h3 className="card-title">{title}</h3>
      </div>

      <div className="ra-list">
        {items.map((it, i) => {
          const Icon = iconMap[it.type] || FiMessageSquare;
          return (
            <div key={i} className="ra-item">
              <div className="ra-ico"><Icon size={16} /></div>
              <div>
                <h4 className="ra-title">{it.title}</h4>
                <div className="ra-sub">{it.sub}</div>
              </div>
              <div className="ra-time">{it.time}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
