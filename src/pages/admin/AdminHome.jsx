import React from "react";
import TopControls from "../../components/admin/dashboard/TopControls";
import KpiRow from "../../components/admin/dashboard/KpiRow";
import RevenueByEvent from "../../components/admin/dashboard/RevenueByEvent";
import RevenueBreakdown from "../../components/admin/dashboard/RevenueBreakdown";
import RecentActivity from "../../components/admin/dashboard/RecentActivity";
import EventsTable from "../../components/admin/dashboard/EventsTable";
import TopSpeakers from "../../components/admin/dashboard/TopSpeakers";
import "../../components/admin/dashboard/admin.dashboard.css";

export default function AdminHome() {
  const [state, setState] = React.useState({});

  const kpis = [
    { title: "Revenue", value: 34700, delta: 12, trend: [18,22,20,24,28,27,32,34,35,37], footnote: "vs last 30 days" },
    { title: "Tickets", value: 1580,  delta: 6,  trend: [90,110,105,120,130,140,150,155,158,160], footnote: "total across events" },
    { title: "Check-ins", value: 1240, delta: -3, trend: [75,72,76,80,78,77,79,81,80,78], footnote: "day-1 on-site" },
    { title: "Conversion", value: 18,  delta: 2,  trend: [12,13,14,14,15,16,16,17,18,18], footnote: "registrations → paid", currency: undefined, compact: false },
  ];

  const revenueData = [
    { name: "AI Summit",               value: 128000 },
    { name: "Digital Innovation Forum",value:  94000 },
    { name: "AgriTech Expo",           value:  72000 },
    { name: "HealthTech Day",          value:  38000 },
    { name: "Green Future",            value:  26000 },
    { name: "UX Live",                 value:  21000 },
  ];

  const breakdown = [
    { label: "Online",      value: 58, color: "var(--c1)" },
    { label: "On-site",     value: 22, color: "var(--c2)" },
    { label: "Sponsorship", value: 16, color: "var(--c3)" },
    { label: "Other",       value: 4,  color: "var(--c5)" },
  ];

  const activity = [
    { type: "payment", title: "Bill paid",            sub: "INV-341 • AI Summit", time: "2m" },
    { type: "signup",  title: "Speaker registered",   sub: "Dr. Sara K.",         time: "18m" },
    { type: "checkin", title: "150 on-site check-ins",sub: "DIF",                 time: "1h" },
    { type: "comment", title: "New comment",          sub: "“Great logistics!”",  time: "3h" },
    { type: "payment", title: "Refund processed",     sub: "#REF-712",            time: "5h" },
  ];

  const tableRows = [
    { name: "AI Summit",               start: "2025-10-05", end: "2025-10-06", status: "live",     tickets: 1280, capacity: 1600, revenue: 128000 },
    { name: "Digital Innovation Forum",start: "2025-09-18", end: "2025-09-19", status: "scheduled",tickets:  940, capacity: 1500, revenue:  94000 },
    { name: "AgriTech Expo",           start: "2025-07-21", end: "2025-07-22", status: "ended",    tickets:  720, capacity: 1200, revenue:  72000 },
    { name: "HealthTech Day",          start: "2025-11-03", end: "2025-11-03", status: "draft",    tickets:   80, capacity:  900, revenue:   8000 },
  ];

  const speakers = [
    { name: "Leila Ben Y.", org: "Green Labs", topic: "Sustainability", sessions: 3, rating: 4.9, avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=160" },
    { name: "Omar Trabelsi", org: "DataJinn",  topic: "AI & Data",      sessions: 2, rating: 4.8, avatar: "https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?q=80&w=160" },
    { name: "Sara Kacem",    org: "MediTech",  topic: "HealthTech",     sessions: 2, rating: 4.7, avatar: "https://images.unsplash.com/photo-1545996124-0501ebae84d0?q=80&w=160" },
    { name: "Yassine M.",    org: "AgriNext",  topic: "AgriTech",       sessions: 1, rating: 4.6, avatar: "https://images.unsplash.com/photo-1511367461989-f85a21fda167?q=80&w=160" },
  ];

  return (
    <div className="d-grid">
      <TopControls onChange={setState} />
      <KpiRow currency="USD" items={kpis} />

      <div className="overview-grid">
        <RevenueByEvent data={revenueData} currency="USD" />
        <RevenueBreakdown data={breakdown} />
        <RecentActivity items={activity} />
      </div>

      <div className="bottom-grid">
        <EventsTable currency="USD" rows={tableRows} />
        <TopSpeakers items={speakers} />
      </div>
    </div>
  );
}
