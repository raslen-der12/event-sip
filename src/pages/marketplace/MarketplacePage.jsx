// src/pages/Marketplace.jsx
import React, { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import Lottie from "lottie-react";
import marketplaceAnim from "../../assets/lottie/marketplace.json"; // keep this path
import Footer from "../../components/footer/Footer";
import { cta, footerData, nav, topbar } from "../main.mock";
import HeaderShell from "../../components/layout/HeaderShell";

/* ------------------------------------------------------------------
   SAME MOCK STYLE AS MarketplaceShowcase.jsx
   (3–4 sectors, 6 products each, full data: cover/gallery/specs, etc.)
   NOTE: I kept the same keys you used there: sector, products[], cover, gallery...
-------------------------------------------------------------------*/
const SECTORS = [
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
        cover:
          "https://images.unsplash.com/photo-1509395176047-4a66953fd231?q=80&w=1200&auto=format&fit=crop",
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
        cover:
          "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=1200&auto=format&fit=crop",
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
        cover:
          "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1200&auto=format&fit=crop",
        gallery: [],
        features: ["Dashboards", "Alarms", "API"],
        specs: { SLA: "99.9%", Regions: "4", Users: "Unlimited" },
        description:
          "Modern cloud suite for DSOs and IPPs to monitor assets, ingest telemetry and automate alerts.",
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
        cover:
          "https://images.unsplash.com/photo-1509395062183-67c5ad6faff9?q=80&w=1200&auto=format&fit=crop",
        gallery: [],
        features: ["0.5S accuracy", "Split core", "4–20mA"],
        specs: { Range: "5–600A", Accuracy: "0.5S", Output: "4–20mA" },
        description:
          "Easy-install split core CT for industrial energy monitoring and audits.",
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
        cover:
          "https://images.unsplash.com/photo-1509395176047-4a66953fd231?q=80&w=1200&auto=format&fit=crop",
        gallery: [],
        features: ["Rule engine", "Modbus/TCP", "VPP-ready"],
        specs: { Inputs: "RS485 x2", Outputs: "Relay x4", Env: "IP54" },
        description:
          "All-in-one controller for DER orchestration and grid services.",
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
        cover:
          "https://images.unsplash.com/photo-1603565816278-c1f9f7a78a5b?q=80&w=1200&auto=format&fit=crop",
        gallery: [],
        features: ["180kW", "OCPP", "Smart billing"],
        specs: { Output: "CCS/CHAdeMO", Cooling: "Liquid", IP: "IP54" },
        description:
          "High-throughput DC charger with OCPP backend integration.",
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
        cover:
          "https://images.unsplash.com/photo-1567113463300-102a7eb2f5d2?q=80&w=1200&auto=format&fit=crop",
        gallery: [],
        features: ["Multi-camera", "AI models", "Reports"],
        specs: { Cycle: "< 2s", Accuracy: "99.3%", API: "Yes" },
        description:
          "Pre-engineered inspection cell with lighting, lenses and model training included.",
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
        cover:
          "https://images.unsplash.com/photo-1519638399535-1b036603ac77?q=80&w=1200&auto=format&fit=crop",
        gallery: [],
        features: ["10kg payload", "MoveIt", "Mobile base"],
        specs: { Payload: "10kg", Reach: "1.3m", Power: "220V" },
        description:
          "Mobile cobot platform with pallet schemes, safety and quick deployment.",
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
        cover:
          "https://images.unsplash.com/photo-1551836022-d5d88e9218df?q=80&w=1200&auto=format&fit=crop",
        gallery: [],
        features: ["OEE", "Traceability", "APIs"],
        specs: { Users: "Unlimited", Hosting: "Cloud", SLA: "99.9%" },
        description:
          "Right-sized MES to digitize work orders, machines and quality.",
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
        cover:
          "https://images.unsplash.com/photo-1518779578993-ec3579fee39f?q=80&w=1200&auto=format&fit=crop",
        gallery: [],
        features: ["±1% accuracy", "BLE", "Audit trail"],
        specs: { Range: "10–200Nm", Battery: "8h", IP: "IP40" },
        description:
          "Connected torque tools with calibration and audit logs.",
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
        cover:
          "https://images.unsplash.com/photo-1518773553398-650c184e0bb3?q=80&w=1200&auto=format&fit=crop",
        gallery: [],
        features: ["Templates", "Drivers", "Mobile"],
        specs: { Tags: "10k", Protocols: "Modbus/OPC", Mobile: "Yes" },
        description:
          "Rapid SCADA deployment pack with common drivers and dashboards.",
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
        cover:
          "https://images.unsplash.com/photo-1581091014534-8987c1d3cd7a?q=80&w=1200&auto=format&fit=crop",
        gallery: [],
        features: ["Heated chamber", "Dual extruder", "QA camera"],
        specs: { Bed: "450×450×450mm", Nozzle: "400°C", Chamber: "160°C" },
        description:
          "High-temp printing for aerospace, medical and tooling.",
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
        cover:
          "https://images.unsplash.com/photo-1535223289827-42f1e9919769?q=80&w=1200&auto=format&fit=crop",
        gallery: [],
        features: ["NPU 21TOPS", "PoE", "NVMe"],
        specs: { CPU: "8C", RAM: "16–64GB", Temp: "-10–55°C" },
        description: "Compact, rugged inference computer for on-prem AI.",
      },
      {
        id: "ai-2",
        title: "LoRaWAN Kit",
        summary: "Gateway + 10 sensors bundle.",
        sector: "AI, IoT & Emerging Tech",
        company: "SkySense",
        companyId: "co-444",
        country: "Spain",
        city: "Valencia",
        cover:
          "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1200&auto=format&fit=crop",
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
        cover:
          "https://images.unsplash.com/photo-1551836022-d5d88e9218df?q=80&w=1200&auto=format&fit=crop",
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
        cover:
          "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1200&auto=format&fit=crop",
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
        cover:
          "https://images.unsplash.com/photo-1518779578993-ec3579fee39f?q=80&w=1200&auto=format&fit=crop",
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
        cover:
          "https://images.unsplash.com/photo-1567113463300-102a7eb2f5d2?q=80&w=1200&auto=format&fit=crop",
        gallery: [],
        features: ["BIM import", "Physics", "APIs"],
        specs: { Engine: "WebGL", Formats: "IFC/GLTF", Users: "Team" },
        description: "Create and monitor live digital twins.",
      },
    ],
  },
];

/* ------------------------------------------------------------
   STASH FULL DATA GLOBALLY (same safety net as your showcase):
   - window.__MK_PRODUCTS for global recovery
   - sessionStorage "mk:lastProduct" on click
-------------------------------------------------------------*/
const FLAT_FULL = SECTORS.flatMap((r) => r.products.map((p) => ({ ...p })));

function stashGlobals() {
  try {
    window.__MK_PRODUCTS = FLAT_FULL;
  } catch {}
}

/* ---------------- MAPPING TO YOUR PAGE'S CARD SHAPE ----------------
   Keep *your* card props: name, category, subCategory, price, img.
   We keep the original full object in _full so we can pass it to Link state.
--------------------------------------------------------------------*/
const CARD_PRODUCTS = FLAT_FULL.map((p) => ({
  id: p.id,
  name: p.title,
  category: p.sector,
  subCategory: p.features?.[0] || p.company || "—",
  price: "Request Quote", // B2B
  img: p.cover,
  images: [p.cover, ...(p.gallery || [])],
  _full: p,
}));

/* Keep your filters object intact but derive from data to prevent drift */
const categories = CARD_PRODUCTS.reduce((acc, x) => {
  if (!acc[x.category]) acc[x.category] = new Set();
  acc[x.category].add(x.subCategory);
  return acc;
}, {});
const categoriesObj = Object.fromEntries(
  Object.entries(categories).map(([k, v]) => [k, Array.from(v)])
);

/* ---------------- Product Card (UNCHANGED SKELETON) ---------------- */
function ProductCard({ product }) {
  return (
    <article className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-transform transform hover:-translate-y-1 overflow-hidden">
      <div className="relative h-56">
        <img
          src={product.img}
          alt={product.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <span className="absolute left-3 top-3 text-xs font-semibold px-3 py-1 bg-[#1C3664] text-white rounded-full">
          {product.category}
        </span>
        <span className="absolute right-3 bottom-3 text-sm font-semibold bg-white/90 text-[#1C3664] px-3 py-1 rounded-md">
          {product.price}
        </span>
      </div>

      <div className="p-2">
        <h3 className="text-lg font-semibold text-[#1C3664] mb-2">{product.name}</h3>
        <p className="text-sm text-gray-500 mb-3">{product.subCategory}</p>

        <div className="flex gap-2">
          {/* >>> EXACT SAME HAND-OFF AS YOUR SHOWCASE <<< */}
          <Link
            to={`/products/${product.id}`}
            state={{ product: product._full || product }}
            onClick={() => {
              try {
                sessionStorage.setItem(
                  "mk:lastProduct",
                  JSON.stringify(product._full || product)
                );
              } catch {}
            }}
            className="flex-1 text-center bg-[#EB5434] hover:bg-[#ff7a4b] text-white px-3 py-2 rounded-lg font-medium transition"
          >
            View
          </Link>
          <a
            href="/messages"
            className="flex-1 text-center border border-gray-200 px-3 py-2 rounded-lg font-medium text-[#1C3664] hover:bg-gray-50"
          >
            Contact
          </a>
        </div>
      </div>
    </article>
  );
}

/* ---------------- Filters Sidebar (UNCHANGED UI) ---------------- */
function FiltersSidebar({
  search,
  setSearch,
  selectedCategory,
  setSelectedCategory,
  selectedSubCategory,
  setSelectedSubCategory,
  onClear,
}) {
  return (
    <aside className="w-full lg:w-72 bg-white p-6 rounded-2xl shadow-sm sticky top-20 h-max">
      <h4 className="text-lg font-semibold mb-4 text-[#1C3664]">Filters</h4>

      <input
        type="text"
        placeholder="Search products..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full p-3 border rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-[#EB5434]/40"
      />

      <label className="block text-sm font-medium mb-2 text-gray-700">Category</label>
      <select
        value={selectedCategory}
        onChange={(e) => {
          setSelectedCategory(e.target.value);
          setSelectedSubCategory("");
        }}
        className="w-full p-3 border rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-[#EB5434]/40"
      >
        <option value="">All categories</option>
        {Object.keys(categoriesObj).map((cat) => (
          <option key={cat} value={cat}>
            {cat}
          </option>
        ))}
      </select>

      {selectedCategory && (
        <>
          <label className="block text-sm font-medium mb-2 text-gray-700">
            Sub-sector
          </label>
          <select
            value={selectedSubCategory}
            onChange={(e) => setSelectedSubCategory(e.target.value)}
            className="w-full p-3 border rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-[#EB5434]/40"
          >
            <option value="">All sub-sectors</option>
            {categoriesObj[selectedCategory].map((sub) => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </select>
        </>
      )}

      <button
        onClick={onClear}
        className="w-full mt-3 py-2 bg-[#EB5434] text-white rounded-lg hover:bg-[#ff7a4b]"
      >
        Clear Filters
      </button>
    </aside>
  );
}

/* ---------------- MAIN COMPONENT (SKELETON KEPT) ---------------- */
export default function Marketplace() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubCategory, setSelectedSubCategory] = useState("");

  useEffect(() => {
    stashGlobals();
  }, []);

  const filteredProducts = useMemo(() => {
    const q = search.toLowerCase().trim();
    return CARD_PRODUCTS.filter((p) => {
      const textHit =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.subCategory?.toLowerCase().includes(q) ||
        (p._full?.company || "").toLowerCase().includes(q);
      const catHit = selectedCategory ? p.category === selectedCategory : true;
      const subHit = selectedSubCategory ? p.subCategory === selectedSubCategory : true;
      return textHit && catHit && subHit;
    });
  }, [search, selectedCategory, selectedSubCategory]);

  return (
    <>
      <HeaderShell top={topbar} nav={nav} cta={cta} />
      <div className="font-poppins bg-[#F9FAFB] text-gray-800 min-h-screen">
        {/* HERO SECTION (unchanged) */}
        <section className="flex flex-col lg:flex-row items-center justify-center text-center lg:text-left bg-gradient-to-r from-[#1C3664] to-[#EB5434] text-white py-24 px-5 gap-10">
          <div className="w-full lg:w-1/2 flex justify-center">
            <Lottie animationData={marketplaceAnim} loop className="w-72 lg:w-96" />
          </div>
          <div className="w-full lg:w-1/2">
            <h1 className="text-4xl font-bold mb-4">Explore the Marketplace</h1>
            <p className="text-lg mb-6 max-w-xl mx-auto lg:mx-0">
              Find verified products across multiple sectors — from agriculture to electronics.
            </p>
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full md:w-3/4 p-4 rounded-full text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#EB5434]"
            />
          </div>
        </section>

        {/* MAIN CONTENT (unchanged) */}
        <div className="max-w-7xl mx-auto px-5 py-16 flex flex-col lg:flex-row gap-10">
          {/* FILTERS SIDEBAR */}
          <FiltersSidebar
            search={search}
            setSearch={setSearch}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            selectedSubCategory={selectedSubCategory}
            setSelectedSubCategory={setSelectedSubCategory}
            onClear={() => {
              setSearch("");
              setSelectedCategory("");
              setSelectedSubCategory("");
            }}
          />

          {/* PRODUCT GRID */}
          <main className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))
            ) : (
              <p className="col-span-full text-center text-gray-500 text-lg">
                No products found.
              </p>
            )}
          </main>
        </div>
      </div>
      <Footer
        brand={footerData.brand}
        columns={footerData.columns}
        socials={footerData.socials}
        actions={footerData.actions}
        bottomLinks={footerData.bottomLinks}
      />
    </>
  );
}
