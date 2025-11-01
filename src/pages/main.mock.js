export const topbar = {
  phone: "eventora@seketak-eg.com",
  email: "eventora@seketak-eg.com",
  hours: "Mon–Fri: 9:00 – 18:30",
  socials: [{ fb: "https://www.facebook.com/share/1BTdfK3er7/?mibextid=wwXIfr", ig: "https://www.instagram.com/seketak_solutions?igsh=M2RjYmF5cnVubzA0", yt: "https://youtube.com/@seketak?si=zxyzezoCp_kaTnwt",in:"https://www.linkedin.com/company/seketak-solutions/" }]

};

export const nav = [
  { label: "Home", href: "/" },

  {
    label: "Communities",
    children: [
      { label: "All", href: "/communities" },
      { label: "Students", href: "/communities/students" },
      { label: "Researchers", href: "/communities/researchers" },
      { label: "Coaches & Trainers", href: "/communities/coaches-trainers" },
      { label: "Experts & Consultants", href: "/communities/experts-consultants" },
      { label: "Employees & Professionals", href: "/communities/employees-professionals" },
      { label: "Entrepreneurs & Startups", href: "/communities/entrepreneurs-startups" },
      { label: "Developers & Engineers", href: "/communities/developers-engineers" },
      { label: "Marketing & Communication", href: "/communities/marketing-communication" },
      { label: "Audit, Accounting & Finance", href: "/communities/audit-accounting-finance" },
      { label: "Investment & Banking", href: "/communities/investment-banking" },
      { label: "Insurance & Microfinance", href: "/communities/insurance-microfinance" },
      { label: "Legal & Lawyers", href: "/communities/legal-lawyers" },
      { label: "AI, IoT & Emerging Tech", href: "/communities/ai-iot-emerging-tech" },
      { label: "Audiovisual & Creative Industries", href: "/communities/audiovisual-creative" },
      { label: "Media & Journalists", href: "/communities/media-journalists" },
      { label: "Universities & Academies", href: "/communities/universities-academies" },
      { label: "NGOs & Civil Society", href: "/communities/ngos-civil-society" },
      { label: "Public Sector & Government", href: "/communities/public-sector-government" },
    ],
  },

  { label: "Marketplace", href: "/marketplace" },

  {
    label: "Events",
    children: [
      { label: "Upcoming Events", href: "/events?when=upcoming" },
      { label: "Previous Events", href: "/events?when=past" },
    ],
  },

  {
    label: "Logistics Solutions",
    children: [
      { label: "Freight Calculator: MENA & AFRICA", href: "/logistics/freight-calculator" },
      { label: "Load Calculator: MENA & AFRICA", href: "/logistics/load-calculator" },
      { label: "Container Shipping Costs: Informations", href: "/logistics/container-costs" },
    ],
  },

  {
    label: "Services",
    children: [
      { label: "B2B AI Matchmaking", href: "/services/ai-matchmaking" },
      { label: "Marketplace", href: "/marketplace" },
      { label: "Communities", href: "/communities" },
      { label: "Event Management Platform", href: "/services/event-management" },
      { label: "Export Consultancy", href: "/services/export-consultancy" },
      { label: "Trade Missions", href: "/services/trade-missions" },
      { label: "Exhibitions", href: "/services/exhibitions" },
      { label: "Private Business Missions", href: "/services/private-business-missions" },
      { label: "Logistics Solutions", href: "/services/logistics" },
    ],
  },
];


export const cta = { href: "/login", label: "Log In" };
export const heroV2 = {
  eyebrow: "UPCOMING • 2025",
  title: "Host, discover, and grow",
  highlight: "together",
  subtitle: "GITS event platform for devs and creators",
  metaDate: "22–24 May 2025",
  metaLocation: "Queenbay Hall, USA",
  desc: "Hands-on sessions, real projects, and a community that ships. MERN, AI, cloud, and more.",
  ctaPrimary: { href: "/Register", label: "Register" },
  ctaSecondary: { href: "/schedule", label: "View Schedule" },
  tags: ["IPDAYS", "Events", "speaker", "Program"],
  stats: [
    { label: "EVENTS", value: 128 },
    { label: "ATTENDEES", value: "5.3K" },
    { label: "CITIES", value: 12 },
    { label: "ORGANIZERS", value: 47 },
  ],
};
export const overview = {
  heading: "Why join GITS events?",
  subheading:
    "Whether you’re attending, organizing, or sponsoring—our platform keeps the focus on shipping and learning with real teams.",
  tabs: [
    { id: "attendees", label: "For Attendees", icon: "users" },
    { id: "organizers", label: "For Organizers", icon: "gear" },
    { id: "sponsors", label: "For Sponsors", icon: "star" },
  ],
  featuresByTab: {
    attendees: [
      {
        icon: "users",
        title: "Hands-on workshops",
        desc: "Build real features with mentors and take home repos you’ll keep using.",
        bullets: ["Live coding rooms", "Beginner–advanced tracks", "Project-based learning"],
      },
      {
        icon: "mic",
        title: "Curated talks",
        desc: "Short, dense talks from engineers who’ve shipped the thing—no fluff.",
        bullets: ["Case studies", "Architecture deep dives", "Lightning demos"],
      },
      {
        icon: "star",
        title: "Real networking",
        desc: "Meet collaborators and hiring teams in structured mixers.",
        bullets: ["Skill-matched groups", "Mentor office hours", "Recruiter lanes"],
      },
    ],
    organizers: [
      {
        icon: "gear",
        title: "Zero-friction RSVPs",
        desc: "Clean flows, QR check-in, and capacity control out of the box.",
        bullets: ["Waitlists", "Seat maps", "Auto-reminders"],
      },
      {
        icon: "mic",
        title: "Speaker tooling",
        desc: "Simple CFP and slide assets, with timeboxed agenda builder.",
        bullets: ["CFP forms", "Timers & cues", "A/V checklist"],
      },
      {
        icon: "users",
        title: "Community growth",
        desc: "Track retention and share-ready highlights to grow your base.",
        bullets: ["Engagement stats", "NPS, churn, return", "Exportable recaps"],
      },
    ],
    sponsors: [
      {
        icon: "star",
        title: "Visible placement",
        desc: "Audience-first placements that don’t feel spammy.",
        bullets: ["Talk interstitials", "Hall signage", "Newsletter shoutouts"],
      },
      {
        icon: "users",
        title: "Qualified leads",
        desc: "Opt-in, GDPR-friendly lead capture at the point of interest.",
        bullets: ["Session scans", "Booth QR", "Auto follow-ups"],
      },
      {
        icon: "gear",
        title: "Measurable ROI",
        desc: "Share clean metrics with your team in minutes.",
        bullets: ["Traffic & scans", "Attribution links", "Export to CRM"],
      },
    ],
  },
};
export const programLanes = {
  heading: "Choose your path",
  subheading: "Three lanes to get value fast: build hands-on, learn from experts, and connect with people who matter.",
  lanes: [
    {
      id: "build",
      label: "Build",
      icon: "code",
      variant: "purple",
      items: [
        { id: "b1", time: "10:00", title: "RTK patterns that scale", desc: "Ship state without spaghetti.", tags: ["Redux", "Toolkit"] },
        { id: "b2", time: "12:00", title: "RSC in production", desc: "Server Components the safe way.", tags: ["React", "RSC"] },
        { id: "b3", time: "15:00", title: "Pipelines that don’t break", desc: "CI you won’t babysit.", tags: ["CI/CD"] },
      ],
    },
    {
      id: "learn",
      label: "Learn",
      icon: "mic",
      variant: "teal",
      items: [
        { id: "l1", time: "09:30", title: "Prompting beyond toys", desc: "Make LLMs useful, not magical.", tags: ["AI", "LLM"] },
        { id: "l2", time: "11:30", title: "Vector search on a budget", desc: "Cheap, fast, correct(ish).", tags: ["Embeddings"] },
        { id: "l3", time: "14:30", title: "Cloud cost controls", desc: "Stop burning credit cards.", tags: ["Cloud"] },
      ],
    },
    {
      id: "connect",
      label: "Connect",
      icon: "users",
      variant: "amber",
      items: [
        { id: "c1", time: "13:00", title: "Mentor office hours", desc: "Bring your repo, leave with answers.", tags: ["Mentors"] },
        { id: "c2", time: "16:00", title: "Hiring mixer", desc: "Actual roles. Actual humans.", tags: ["Careers"] },
        { id: "c3", time: "17:00", title: "Open-source sprint", desc: "Push meaningful PRs together.", tags: ["OSS"] },
      ],
    },
  ],
};
const placeholderLogo =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='220' height='90' viewBox='0 0 220 90'>
  <defs><linearGradient id='g' x1='0' x2='1' y1='0' y2='1'><stop offset='0' stop-color='#6f42c1'/><stop offset='1' stop-color='#3b82f6'/></linearGradient></defs>
  <rect width='100%' height='100%' rx='12' fill='white'/>
  <rect x='6' y='6' width='208' height='78' rx='10' fill='url(#g)' opacity='0.12'/>
  <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-family='Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial' font-weight='800' font-size='24' fill='#3b2a7a'>LOGO</text>
</svg>`);

export const partners = {
  heading: "Partners",
  subheading: "Organizers, co-funders, supporters, and media who make this possible.",
  groups: [
    {
      id: "organizers",
      label: "Organizers",
      variant: "purple",
      logos: [
        { id: "o1", name: "GITS Foundation", img: placeholderLogo },
        { id: "o2", name: "Queenbay Hall",   img: placeholderLogo },
      ],
    },
    {
      id: "cofunders",
      label: "Co-funders",
      variant: "teal",
      logos: [
        { id: "c1", name: "StackForge", img: placeholderLogo },
        { id: "c2", name: "CloudRail",  img: placeholderLogo },
      ],
    },
    {
      id: "sponsors",
      label: "Sponsors",
      variant: "amber",
      logos: [
        { id: "s1", name: "Vectorly", img: placeholderLogo },
        { id: "s2", name: "DevDeck",  img: placeholderLogo },
        { id: "s3", name: "Formify",  img: placeholderLogo },
        { id: "s4", name: "EdgeKit",  img: placeholderLogo },
      ],
    },
    {
      id: "media",
      label: "Media partners",
      variant: "blue",
      logos: [
        { id: "m1", name: "TechWave",   img: placeholderLogo },
        { id: "m2", name: "DevDaily",   img: placeholderLogo },
        { id: "m3", name: "CloudNews",  img: placeholderLogo },
      ],
    },
    {
      id: "community",
      label: "Community",
      variant: "pink",
      logos: [
        { id: "cm1", name: "TunisJS",             img: placeholderLogo },
        { id: "cm2", name: "React North Africa",  img: placeholderLogo },
      ],
    },
  ],
};





export const eventsList = {
  heading: "Upcoming & featured events",
  subheading: "Hand-picked gatherings for builders and teams. See what’s next.",
  events: [
    {
      id: "e1",
      title: "Les InnoPreneurs Days",
      summary: "A fast one-day summit focused on state management, RSC, and DX patterns.",
      startISO: "2025-10-12T09:00:00Z",
      endISO: "2025-10-12T18:00:00Z",
      location: "Queenbay Hall, Tunis",
      tags: ["MERN", "Redux", "Workshops"],
      variant: "purple",
      status: "open",
      href: "/event/gits-tunis-mern",
    },
    {
      id: "e2",
      title: "GLOBAL INVESTMENT & TRADE SUMMIT - Abidjan 12 & 13 June",
      summary: "A fast one-day summit focused on state management, RSC, and DX patterns.",
      startISO: "2025-10-12T09:00:00Z",
      endISO: "2025-10-12T18:00:00Z",
      location: "abidjan , cote du voire",
      tags: ["MERN", "Redux", "Workshops"],
      variant: "purple",
      status: "open",
      href: "/event/gits-tunis-mern",
    },
    {
      id: "e3",
      title: "GLOBAL INVESTMENT & TRADE SUMMIT - Cairo 12 & 13 May",
      summary: "Make LLMs useful in production: embeddings, evals, and safe prompting.",
      startISO: "2025-11-02T09:00:00Z",
      endISO: "2025-11-02T18:00:00Z",
      location: "cario Egypt",
      tags: ["B2B", "global"],
      variant: "teal",
      status: "open",
      href: "/event/ai-for-product-teams",
    },

  ],
};

export const sdgCarousel = {
  heading: "Sustainable Development Goals",
  subheading: "We align our programs with SDGs that matter for builders.",
  goals: [
    { id: "sdg1",  num: 1 }, { id: "sdg2",  num: 2 }, { id: "sdg3",  num: 3 },
    { id: "sdg4",  num: 4 }, { id: "sdg5",  num: 5 }, { id: "sdg6",  num: 6 },
    { id: "sdg7",  num: 7 }, { id: "sdg8",  num: 8 }, { id: "sdg9",  num: 9 },
    { id: "sdg10", num:10 }, { id: "sdg11", num:11 }, { id: "sdg12", num:12 },
    { id: "sdg13", num:13 }, { id: "sdg14", num:14 }, { id: "sdg15", num:15 },
    { id: "sdg16", num:16 }, { id: "sdg17", num:17 },
    // If you have official square icons, add: img: "/assets/sdgs/goal-04.png"
  ],
};

export const lastEventGallery = {
  heading: "Gallery — last event",
  subheading: "Highlights from the last edition: stage moments, workshops, and the crowd.",
  photos: [
    // Use any images you like; these are just examples (Unsplash/Picsum links are fine for mocks)
    { id: "g1", size: "lg", src: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?q=80&w=1600", alt: "Main stage keynote" },
    { id: "g3", size: "md", src: "https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=1200", alt: "Networking hall" },
    { id: "g4", size: "sm", src: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=800",  alt: "Speaker portrait" },
    { id: "g5", size: "lg", src: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=1600", alt: "Crowd cheering" },
    { id: "g6", size: "md", src: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1200", alt: "Expo booth" },
    { id: "g7", size: "sm", src: "https://images.unsplash.com/photo-1521336575822-6da63fb45455?q=80&w=800",  alt: "Mentor session" },
    { id: "g8", size: "md", src: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=1200", alt: "Panel discussion" },
    { id: "g9", size: "sm", src: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=800",  alt: "Coffee break" },
  ],
};
export const globalStats = {
  heading: "Global stats — all events",
  subheading: "A growing community across talks, workshops, and B2B meetings.",
  kpis: [
    {
      id: "k1",
      img: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=1600",
      value: "18k+",
      label: "Total attendees",
      hint: "+12% YoY",
      variant: "purple",
    },
    {
      id: "k2",
      img: "https://images.unsplash.com/photo-1511578314322-379afb476865?q=80&w=1600",
      value: "420+",
      label: "Speakers hosted",
      hint: "42 cities",
      variant: "blue",
    },
    {
      id: "k3",
      img: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1600",
      value: "650+",
      label: "Workshops delivered",
      hint: "Hands-on labs",
      variant: "teal",
    },
    {
      id: "k4",
      img: "https://images.unsplash.com/photo-1521336575822-6da63fb45455?q=80&w=1600",
      value: "3.1k+",
      label: "B2B meetings",
      hint: "Matchmaking",
      variant: "amber",
    },
  ],
  minis: [
    {
      id: "m1",
      img: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=800",
      value: "97%",
      label: "Would attend again",
    },
    {
      id: "m2",
      img: "https://images.unsplash.com/photo-1544717302-de2939b7ef71?q=80&w=800",
      value: "1,200+",
      label: "Exhibitor booths",
    },
    {
      id: "m3",
      img: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=800",
      value: "4.8★",
      label: "Avg session rating",
    },
    {
      id: "m4",
      img: "https://images.unsplash.com/photo-1503424886300-4d7d2a3b28c7?q=80&w=800",
      value: "$1.8M",
      label: "Creator grants",
    },
  ],
  banner: {
    img: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?q=80&w=1920",
    alt: "Global audience",
    badges: [
      { id: "b1", value: "15+", label: "Countries", color: "var(--accent-teal)" },
      { id: "b2", value: "48",  label: "Events run", color: "var(--brand-600)" },
      { id: "b3", value: "35%", label: "Women in tech", color: "var(--accent-pink)" },
      { id: "b4", value: "12%", label: "Student tickets", color: "var(--accent-amber)" },
    ],
  },
};
export const speakers = {
  heading: "Featured speakers",
  subheading: "Leaders, builders, and teachers joining our next editions.",
  items: [
    {
      id: "s1",
      name: "Maya Haddad",
      title: "Head of AI",
      org: "Nebula Labs",
      photo: "https://images.unsplash.com/photo-1550525811-e5869dd03032?q=80&w=800",
      href: "/speaker/maya-haddad",
      tags: ["LLM Safety", "Evals", "RAG"],
      variant: "teal",
      verified: true,
      sessions: 2,
      bio: "Maya leads applied AI teams shipping evaluation-driven systems at scale. Formerly at OpenGrid.",
      socials: [
        { type: "in", url: "#" },
        { type: "x",  url: "#" },
        { type: "web", url: "#" },
      ],
    },
    {
      id: "s2",
      name: "Karim Ben Salem",
      title: "Staff Engineer",
      org: "ShipFast",
      photo: "https://images.unsplash.com/photo-1544717302-de2939b7ef71?q=80&w=800",
      href: "/speaker/karim-ben-salem",
      tags: ["CI/CD", "Terraform", "DX"],
      variant: "blue",
      sessions: 1,
      bio: "Karim works on developer tooling, focusing on CI reliability, caching, and reproducible infra.",
      socials: [{ type: "in", url: "#" }, { type: "x", url: "#" }],
    },
    {
      id: "s3",
      name: "Salma Trabelsi",
      title: "Founder",
      org: "Vectorly",
      photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=800",
      href: "/speaker/salma-trabelsi",
      tags: ["Product", "Growth", "Community"],
      variant: "amber",
      verified: true,
      sessions: 3,
      bio: "Salma mentors early-stage teams on product-market fit and open-source community strategy.",
      socials: [{ type: "web", url: "#" }],
    },
    {
      id: "s4",
      name: "Omar Jaziri",
      title: "Cloud Architect",
      org: "EdgeKit",
      photo: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?q=80&w=800",
      href: "/speaker/omar-jaziri",
      tags: ["Edge", "Kubernetes"],
      variant: "purple",
      sessions: 1,
      bio: "Omar designs edge-first architectures and teaches resilient multi-region patterns.",
      socials: [{ type: "in", url: "#" }],
    },
    {
      id: "s5",
      name: "Yasmine Aouini",
      title: "Design Engineer",
      org: "Formify",
      photo: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=800",
      href: "/speaker/yasmine-aouini",
      tags: ["Design Systems", "A11y"],
      variant: "pink",
      sessions: 2,
      bio: "Yasmine builds systems that scale across web stacks with accessibility by default.",
      socials: [{ type: "x", url: "#" }],
    },
    {
      id: "s6",
      name: "Mohamed Gharbi",
      title: "Security Lead",
      org: "Rivet",
      photo: "https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?q=80&w=800",
      href: "/speaker/mohamed-gharbi",
      tags: ["AppSec", "Threat modeling"],
      variant: "teal",
      sessions: 1,
      bio: "Mohamed focuses on developer-first security practices and pragmatic threat modeling.",
      socials: [{ type: "in", url: "#" }, { type: "web", url: "#" }],
    },
  ],
};

export const footerData = {
  brand: {
    logoSrc: "/assets/logo.svg",
    name: "Eventra",
    tagline: "Events for builders, teams, and communities.",
  },
  socials: [
    { type: "in", url: "#" },
    { type: "x",  url: "#" },
    { type: "yt", url: "#" },
    { type: "web", url: "#" },
  ],
  columns: [
    { id: "explore", heading: "Explore", items: [
      { label: "Upcoming events", href: "/events" },
      { label: "Speakers", href: "/speakers" },
      { label: "Exhibitors", href: "/exhibitors" },
      { label: "Gallery", href: "/gallery" },
    ]},
    { id: "company", heading: "Company", items: [
      { label: "About Eventra", href: "/about-us" },
      { label: "Build your business profile", href: "/BusinessProfile/dashboard" },
      { label: "Book your B2B meeting", href: "/attendees/open-to-meet" }
    ]},
    { id: "support", heading: "Support", items: [
      { label: "Contact", href: "/support" },
      { label: "Privacy policy", href: "/privacy-policy" },
      { label: "Refund Policy", href: "/refund-policy" }
    ]},
  ],
  actions: [
    { id: "a1", label: "Contact us",        href: "/support",       icon: "mail" },
    { id: "a2", label: "Become a partner",  href: "/partners/apply", icon: "partner" },
    { id: "a3", label: "Download media kit",href: "/press/kit",      icon: "kit" },
  ],
  bottomLinks: [
    { label: "Terms & Conditions", href: "/terms" },
    { label: "Cookies", href: "/cookies" },
  ],
};
// Part 12 — Target Audience mock
export const audienceTags = [
  {
    tag: "Developers",
    hero: {
      img: "https://images.unsplash.com/photo-1518779578993-ec3579fee39f?q=80&w=1600",
      text: "Hands-on workshops, code labs, and architecture deep dives to ship scalable apps.",
    },
    minis: [
      { img: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=800", label: "Live workshops" },
      { img: "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=800", label: "Tech talks" },
      { img: "https://images.unsplash.com/photo-1551836022-4c4c79ecde51?q=80&w=800", label: "Hackathons" },
    ],
  },
  {
    tag: "Startups",
    hero: {
      img: "https://images.unsplash.com/photo-1551836022-2f28a3f1d3f8?q=80&w=1600",
      text: "Pitch, launch, and meet mentors and VCs to turn prototypes into go-to-market plans.",
    },
    minis: [
      { img: "https://images.unsplash.com/photo-1485217988980-11786ced9454?q=80&w=800", label: "Demo booths" },
      { img: "https://images.unsplash.com/photo-1556157382-97eda2d62296?q=80&w=800", label: "VC 1:1s" },
      { img: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=800", label: "Mentoring" },
    ],
  },
  // … Investors / Students / Policy Makers (same structure)
];

