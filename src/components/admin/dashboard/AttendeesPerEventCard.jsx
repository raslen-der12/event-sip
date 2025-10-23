// src/components/admin/dashboard/AttendeesPerEventCard.jsx
import React from "react";
import BarListCard from "./BarListCard";
export default function AttendeesPerEventCard({ data }) {
  return <BarListCard title="Attendees per Event" data={data} maxItems={8} />;
}


