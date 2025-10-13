// src/components/MarketplaceShowcase.jsx
import React, { useMemo, useRef } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import "./marketplace-showcase.css";

/* tiny arrows */
const I = {
  arrowL: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="m15 6-6 6 6 6" stroke="currentColor" strokeWidth="2"/></svg>),
  arrowR: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="m9 18 6-6-6-6" stroke="currentColor" strokeWidth="2"/></svg>),
};

/* -------- Mock sectors (3–4) with 6 products each, each with full data -------- */
const MOCK = [
  {
    sector: "Energy & Utilities",
    products: [
      {
        id: "en-1",
        title: "GridSync Gateway",
        summary: "Modular edge gateway for grid telemetry.",
        sector: "Energy & Utilities",
        company: "YourCo Industries",
        companyId: "co-123",
        country: "Germany",
        city: "Berlin",
        cover: "https://images.unsplash.com/photo-1509395176047-4a66953fd231?q=80&w=1200&auto=format&fit=crop",
        gallery: [
          "https://images.unsplash.com/photo-1563865436873-1b2d9d8a9261?q=80&w=1200&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1518432031352-d6fc5c10da5a?q=80&w=1200&auto=format&fit=crop",
        ],
        features: ["DIN-rail mount", "LTE/5G fallback", "MQTT/OPC-UA"],
        specs: { Power: "9–36V DC", IO: "8 DI / 4 DO", CPU: "Quad ARM" },
        description:
          "Industrial edge gateway designed for substation and DER telemetry. Supports common protocols and secure OTA.",
      },
      {
        id: "en-2",
        title: "BatteryPack BMS",
        summary: "Drop-in BMS for 48–400V strings.",
        sector: "Energy & Utilities",
        company: "HelioGrid",
        companyId: "co-221",
        country: "Germany",
        city: "Leipzig",
        cover: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=1200&auto=format&fit=crop",
        gallery: [
          "https://images.unsplash.com/photo-1581090464426-753f5b3a2f06?q=80&w=1200&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1542051841857-5f90071e7989?q=80&w=1200&auto=format&fit=crop",
        ],
        features: ["Cell balancing", "CAN bus", "Cloud telemetry"],
        specs: { Voltage: "48–400V", Cells: "Up to 120s", Temp: "-20–60°C" },
        description:
          "Flexible BMS platform for industrial storage applications with advanced protections and cloud integrations.",
      },
      {
        id: "en-3",
        title: "FlowOps Cloud",
        summary: "SaaS for grid monitoring and alerting.",
        sector: "Energy & Utilities",
        company: "FlowOps",
        companyId: "co-777",
        country: "USA",
        city: "Austin",
        cover: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1200&auto=format&fit=crop",
        gallery: [],
        features: ["Dashboards", "Alarms", "API"],
        specs: { SLA: "99.9%", Regions: "4", Users: "Unlimited" },
        description: "Modern cloud suite for DSOs and IPPs to monitor assets, ingest telemetry and automate alerts.",
      },
      {
        id: "en-4",
        title: "PowerSense CT",
        summary: "Clip-on current transformer, revenue grade.",
        sector: "Energy & Utilities",
        company: "Voltix",
        companyId: "co-314",
        country: "Italy",
        city: "Milan",
        cover: "https://images.unsplash.com/photo-1509395062183-67c5ad6faff9?q=80&w=1200&auto=format&fit=crop",
        gallery: [],
        features: ["0.5S accuracy", "Split core", "4–20mA"],
        specs: { Range: "5–600A", Accuracy: "0.5S", Output: "4–20mA" },
        description: "Easy-install split core CT for industrial energy monitoring and audits.",
      },
      {
        id: "en-5",
        title: "DER Control Box",
        summary: "Smart control box for PV + storage.",
        sector: "Energy & Utilities",
        company: "SunFleet",
        companyId: "co-271",
        country: "Spain",
        city: "Madrid",
        cover: "https://images.unsplash.com/photo-1509395176047-4a66953fd231?q=80&w=1200&auto=format&fit=crop",
        gallery: [],
        features: ["Rule engine", "Modbus/TCP", "VPP-ready"],
        specs: { Inputs: "RS485 x2", Outputs: "Relay x4", Env: "IP54" },
        description: "All-in-one controller for DER orchestration and grid services.",
      },
      {
        id: "en-6",
        title: "EV Fast Charger 180kW",
        summary: "Outdoor liquid-cooled charger.",
        sector: "Energy & Utilities",
        company: "AmpRoad",
        companyId: "co-987",
        country: "France",
        city: "Lyon",
        cover: "https://images.unsplash.com/photo-1603565816278-c1f9f7a78a5b?q=80&w=1200&auto=format&fit=crop",
        gallery: [],
        features: ["180kW", "OCPP", "Smart billing"],
        specs: { Output: "CCS/CHAdeMO", Cooling: "Liquid", IP: "IP54" },
        description: "High-throughput DC charger with OCPP backend integration.",
      },
    ],
  },
  {
    sector: "Manufacturing",
    products: [
      {
        id: "mf-1",
        title: "Vision QA Cell",
        summary: "Turn-key inspection cell in 2 weeks.",
        sector: "Manufacturing",
        company: "OptiCore",
        companyId: "co-555",
        country: "Germany",
        city: "Stuttgart",
        cover: "https://images.unsplash.com/photo-1567113463300-102a7eb2f5d2?q=80&w=1200&auto=format&fit=crop",
        gallery: [],
        features: ["Multi-camera", "AI models", "Reports"],
        specs: { Cycle: "< 2s", Accuracy: "99.3%", API: "Yes" },
        description: "Pre-engineered inspection cell with lighting, lenses and model training included.",
      },
      {
        id: "mf-2",
        title: "Cobotic Palletizer",
        summary: "Plug-and-play packaging assistant.",
        sector: "Manufacturing",
        company: "Innova",
        companyId: "co-901",
        country: "Italy",
        city: "Turin",
        cover: "https://images.unsplash.com/photo-1519638399535-1b036603ac77?q=80&w=1200&auto=format&fit=crop",
        gallery: [],
        features: ["10kg payload", "MoveIt", "Mobile base"],
        specs: { Payload: "10kg", Reach: "1.3m", Power: "220V" },
        description: "Mobile cobot platform with pallet schemes, safety and quick deployment.",
      },
      {
        id: "mf-3",
        title: "MES Lite",
        summary: "Production tracking for SMEs.",
        sector: "Manufacturing",
        company: "DataForge",
        companyId: "co-811",
        country: "USA",
        city: "Cleveland",
        cover: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?q=80&w=1200&auto=format&fit=crop",
        gallery: [],
        features: ["OEE", "Traceability", "APIs"],
        specs: { Users: "Unlimited", Hosting: "Cloud", SLA: "99.9%" },
        description: "Right-sized MES to digitize work orders, machines and quality.",
      },
      {
        id: "mf-4",
        title: "Smart Torque Wrench",
        summary: "Bluetooth + cloud logging.",
        sector: "Manufacturing",
        company: "ToolMind",
        companyId: "co-818",
        country: "UK",
        city: "Coventry",
        cover: "https://images.unsplash.com/photo-1518779578993-ec3579fee39f?q=80&w=1200&auto=format&fit=crop",
        gallery: [],
        features: ["±1% accuracy", "BLE", "Audit trail"],
        specs: { Range: "10–200Nm", Battery: "8h", IP: "IP40" },
        description: "Connected torque tools with calibration and audit logs.",
      },
      {
        id: "mf-5",
        title: "SCADA Starter",
        summary: "Pre-built SCADA bundle.",
        sector: "Manufacturing",
        company: "NexLabs",
        companyId: "co-222",
        country: "Tunisia",
        city: "Tunis",
        cover: "https://images.unsplash.com/photo-1518773553398-650c184e0bb3?q=80&w=1200&auto=format&fit=crop",
        gallery: [],
        features: ["Templates", "Drivers", "Mobile"],
        specs: { Tags: "10k", Protocols: "Modbus/OPC", Mobile: "Yes" },
        description: "Rapid SCADA deployment pack with common drivers and dashboards.",
      },
      {
        id: "mf-6",
        title: "Industrial 3D Printer",
        summary: "PEEK/PEKK capable system.",
        sector: "Manufacturing",
        company: "Printora",
        companyId: "co-116",
        country: "France",
        city: "Toulouse",
        cover: "https://images.unsplash.com/photo-1581091014534-8987c1d3cd7a?q=80&w=1200&auto=format&fit=crop",
        gallery: [],
        features: ["Heated chamber", "Dual extruder", "QA camera"],
        specs: { Bed: "450×450×450mm", Nozzle: "400°C", Chamber: "160°C" },
        description: "High-temp printing for aerospace, medical and tooling.",
      },
    ],
  },
  {
    sector: "AI, IoT & Emerging Tech",
    products: [
      {
        id: "ai-1",
        title: "Edge AI Box",
        summary: "Fanless inference box.",
        sector: "AI, IoT & Emerging Tech",
        company: "NeuroBits",
        companyId: "co-333",
        country: "UAE",
        city: "Dubai",
        cover: "https://images.unsplash.com/photo-1535223289827-42f1e9919769?q=80&w=1200&auto=format&fit=crop",
        gallery: [],
        features: ["NPU 21TOPS", "PoE", "NVMe"],
        specs: { CPU: "8C", RAM: "16–64GB", Temp: "-10–55°C" },
        description: "Compact, rugged inference computer for on-prem AI.",
      },
      // … add 5 more similar items for this sector …
      {
        id: "ai-2",
        title: "LoRaWAN Kit",
        summary: "Gateway + 10 sensors bundle.",
        sector: "AI, IoT & Emerging Tech",
        company: "SkySense",
        companyId: "co-444",
        country: "Spain",
        city: "Valencia",
        cover: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1200&auto=format&fit=crop",
        gallery: [],
        features: ["EU868", "Grafana", "Alerts"],
        specs: { Range: "5–10km", Nodes: "10", Power: "12V" },
        description: "Starter LPWAN kit for pilots and PoCs.",
      },
      {
        id: "ai-3",
        title: "Computer Vision SDK",
        summary: "Prebuilt models for QA.",
        sector: "AI, IoT & Emerging Tech",
        company: "VisionKit",
        companyId: "co-445",
        country: "USA",
        city: "Denver",
        cover: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?q=80&w=1200&auto=format&fit=crop",
        gallery: [],
        features: ["Defect", "OCR", "Counting"],
        specs: { License: "Per site", API: "C++/Python", GPU: "Optional" },
        description: "SDK to embed in your own apps with ready models.",
      },
      {
        id: "ai-4",
        title: "ML MLOps Platform",
        summary: "Train, deploy, monitor.",
        sector: "AI, IoT & Emerging Tech",
        company: "ModelOps",
        companyId: "co-446",
        country: "UK",
        city: "Manchester",
        cover: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1200&auto=format&fit=crop",
        gallery: [],
        features: ["Pipelines", "Registry", "Metrics"],
        specs: { Users: "Unlimited", SLA: "99.9%", Cloud: "Multi" },
        description: "Full lifecycle management for ML teams.",
      },
      {
        id: "ai-5",
        title: "AR Field Assist",
        summary: "Remote expert with AR.",
        sector: "AI, IoT & Emerging Tech",
        company: "AssistAR",
        companyId: "co-447",
        country: "Canada",
        city: "Toronto",
        cover: "https://images.unsplash.com/photo-1518779578993-ec3579fee39f?q=80&w=1200&auto=format&fit=crop",
        gallery: [],
        features: ["Annotations", "Recording", "2-way"],
        specs: { Devices: "iOS/Android", Bandwidth: "Low", Security: "E2E" },
        description: "Guide technicians hands-free on site.",
      },
      {
        id: "ai-6",
        title: "Digital Twin Suite",
        summary: "Sync OT & IT in 3D.",
        sector: "AI, IoT & Emerging Tech",
        company: "TwinLab",
        companyId: "co-448",
        country: "Germany",
        city: "Munich",
        cover: "https://images.unsplash.com/photo-1567113463300-102a7eb2f5d2?q=80&w=1200&auto=format&fit=crop",
        gallery: [],
        features: ["BIM import", "Physics", "APIs"],
        specs: { Engine: "WebGL", Formats: "IFC/GLTF", Users: "Team" },
        description: "Create and monitor live digital twins.",
      },
    ],
  },
];

/* ---------- Showcase ---------- */
export default function MarketplaceShowcase({ sectors = MOCK }) {
  const rows = Array.isArray(sectors) && sectors.length ? sectors : MOCK;

  // flatten for global stash (so ProductPage can recover on refresh)
  const ALL = useMemo(
    () => rows.flatMap((r) => r.products.map((p) => ({ ...p }))),
    [rows]
  );
  // expose global & session for fallbacks
  React.useEffect(() => {
    try { window.__MK_PRODUCTS = ALL; } catch {}
  }, [ALL]);

  const Row = ({ sector, products }) => {
    const ref = useRef(null);
    const scrollBy = (dx) => ref.current?.scrollBy({ left: dx, behavior: "smooth" });

    return (
      <section className="mks-row">
        <header className="mks-row-head">
          <h3 className="mks-row-title">{sector}</h3>
          <div className="mks-row-ctrls">
            <button className="mks-nav" onClick={() => scrollBy(-640)} aria-label="Left"><I.arrowL/></button>
            <button className="mks-nav" onClick={() => scrollBy(+640)} aria-label="Right"><I.arrowR/></button>
          </div>
        </header>

        <div className="mks-track" ref={ref}>
          {products.map((p) => (
            <article key={p.id} className="mks-card">
              <Link
                className="mks-hit"
                to={`/products/${p.id}`}
                state={{ product: p }}
                onClick={() => {
                  try { sessionStorage.setItem("mk:lastProduct", JSON.stringify(p)); } catch {}
                }}
              />
              <div className="mks-thumb" style={{ backgroundImage:`url(${p.cover})` }} />
              <div className="mks-body">
                <h4 className="mks-title" title={p.title}>{p.title}</h4>
                <div className="mks-meta">
                  <span className="chip">{p.company}</span>
                  <span className="chip">{p.city && p.country ? `${p.city}, ${p.country}` : (p.city || p.country || "—")}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    );
  };

  return (
    <section className="mks">
      <div className="container">
        <header className="mks-hero">
          <h2 className="mks-title text-center">Marketplace</h2>
          <p className="mks-sub text-center">Fresh products & solutions from verified companies.</p>
        </header>

        <div className="mks-body">
          {rows.map((r) => <Row key={r.sector} {...r} />)}
        </div>

        <div className="mks-cta">
          <a className="mks-btn" href="/marketplace">Explore full marketplace</a>
        </div>
      </div>
    </section>
  );
}

MarketplaceShowcase.propTypes = {
  sectors: PropTypes.array,
};
