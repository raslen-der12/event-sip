// src/components/admin/dashboard/ActorTypeCard.jsx
import React from "react";
import BarListCard from "./BarListCard";
export default function ActorTypeCard({ data }) {
  return <BarListCard title="Distribution by Actor Type" data={data} maxItems={8} />;
}


