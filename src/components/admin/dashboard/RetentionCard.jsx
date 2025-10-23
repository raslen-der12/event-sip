// src/components/admin/dashboard/RetentionCard.jsx
import React from "react";
import BarListCard from "./BarListCard";
export default function RetentionCard({ data }) {
  return <BarListCard title="Returning Attendees" data={data} maxItems={8} />;
}
