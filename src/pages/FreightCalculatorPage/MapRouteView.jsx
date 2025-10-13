// src/components/MapRouteView.jsx
import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";
L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl });

function FitBounds({ positions }) {
  const map = useMap();
  useEffect(() => {
    if (!positions?.length) return;
    const bounds = positions.map((p) => [p.lat, p.lon]);
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [positions, map]);
  return null;
}

export default function MapRouteView({ from, to }) {
  const positions = [];
  if (from?.lat && from?.lon) positions.push({ lat: from.lat, lon: from.lon });
  if (to?.lat && to?.lon) positions.push({ lat: to.lat, lon: to.lon });

  if (!positions.length) return <div style={{ padding: 12, color: "#475569" }}>Choose origin & destination to preview the route</div>;

  const polyline = positions.map((p) => [p.lat, p.lon]);

  return (
    <MapContainer center={[positions[0].lat, positions[0].lon]} zoom={3} style={{ height: "100%", width: "100%" }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {positions.map((p, i) => <Marker key={i} position={[p.lat, p.lon]} />)}
      <Polyline positions={polyline} />
      <FitBounds positions={positions} />
    </MapContainer>
  );
}