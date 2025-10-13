// Community mock data with your exact sub-role list + helpers.

export const SUBROLES = [
  "Students",
  "Researchers",
  "Coaches & Trainers",
  "Experts & Consultants",
  "Employees & Professionals",
  "Entrepreneurs & Startups",
  "Developers & Engineers",
  "Marketing & Communication",
  "Audit, Accounting & Finance",
  "Investment & Banking",
  "Insurance & Microfinance",
  "Legal & Lawyers",
  "AI, IoT & Emerging Tech",
  "Audiovisual & Creative Industries",
  "Media & Journalists",
  "Universities & Academies",
  "NGOs & Civil Society",
  "Public Sector & Government",
];

export const ROLE_FILTERS = [
  { key: "attendee",      label: "Attendees" },
  { key: "speaker",       label: "Speakers" },
  { key: "exhibitor",     label: "Exhibitors" },
  { key: "investor",      label: "Investors" },
  { key: "consultant",    label: "Consultants" },
  { key: "employee",      label: "Employees" },
  { key: "businessowner", label: "Business Owners" },
  { key: "expert",        label: "Experts" },
  { key: "student",       label: "Students" },
];

/* slug util for url fragments & params */
export const slugOf = (s="") =>
  String(s).toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g,"")
    .replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"");

/* ---------------- big demo (≈210) ---------------- */
const NAMES = [
  "Maya Reed","Jamal Ortiz","Rania Khaled","Alex Chen","Lara Petit","Sofien H.","Yara Slim",
  "Clara Zhou","Omar Saidi","Noah Becker","Leila Haddad","Samir Bouaziz","Jonas Wolf","Sara Kim",
  "Pedro Alvarez","Aisha Khan","Luc Moreau","Nina Rossi","Hassan M.","Emily Hart","Karim D.",
  "Ibrahim N.","Anya Petrova","Zineb L.","Dario Costa","Mounir S.","Ines B.","Youssef A.",
  "Mariam Z.","Felix Lang","Olivia Tran","Victor Hugo","Imane T.","Kenji Ito","Luca Greco",
  "Fatma Ben A.","Adam G.","Aaliyah Ford","Tariq Rahman","Selma B.","Nour Ch.","Yanis F.",
];
const ORGS = [
  "ByteLeaf","EdgeHive","FlowOps","SenseForge","NorthCap","StageLink","Cam+Co","Ummah Micro",
  "Kite Audit","AdZebra","HelioGrid","Apex Motors","BlueBay Health","Nova Labs","GreenTrace",
  "RapidCloud","VectorIQ","UnityWare","Quantica","SolarNest","Oceanix","MetroTech","BrightBridge",
  "DataBloom","SkyForge","Zen Robotics","Circuitry","LuminaSoft","OptiWave","TrueNorth",
];
const TITLES = [
  "CEO","CTO","Founder","Head of Growth","Lead Engineer","Product Manager","Data Scientist",
  "Solutions Architect","Business Analyst","Community Lead","Engineer","Operations","Member",
];
const LOCS = [
  { city:"Berlin", country:"DE" }, { city:"Paris", country:"FR" }, { city:"Milan", country:"IT" },
  { city:"Madrid", country:"ES" }, { city:"Tunis", country:"TN" }, { city:"Casablanca", country:"MA" },
  { city:"Dubai", country:"AE" }, { city:"Cairo", country:"EG" }, { city:"Riyadh", country:"SA" },
  { city:"London", country:"GB" }, { city:"San Francisco", country:"US" }, { city:"New York", country:"US" },
];
const UNSPLASH_IDS = [
  "1544005313-94ddf0286df2","1527980965255-d3b416303d12","1517841905240-472988babdf9",
  "1511367461205-9b8979428c2a","1502823403499-6ccfcf4fb453","1506794778202-cad84cf45f1d",
  "1508214751196-bcfd4ca60f91","1520813792240-56fc4a3765a7","1494790108377-be9c29b29330",
  "1520975787433-0f7f27f7f6f3","1519340241574-2f102d955b2a","1547425260-76bcadfb4f2c",
];

const pick = (arr, i) => arr[(i % arr.length + arr.length) % arr.length];
const avatarUrl = (i) => `https://images.unsplash.com/photo-${pick(UNSPLASH_IDS,i)}?auto=format&fit=crop&w=160&q=60`;

function subrolesFor(seed){
  const a = pick(SUBROLES, seed + 1);
  const b = pick(SUBROLES, seed * 3 + 7);
  const c = pick(SUBROLES, seed * 5 + 11);
  const arr = [a,b,c].filter((v,i,s) => s.indexOf(v) === i);
  return arr.slice(0, (seed % 3) + 1);
}

function makeActor(i, role){
  const loc = pick(LOCS, i*7 + role.length);
  const org = pick(ORGS, i*5 + 3);
  const name = pick(NAMES, i*11 + 2);
  const title = pick(TITLES, i*13 + 1);
  const subs = subrolesFor(i + role.length);

  if (role === "exhibitor") {
    return {
      _id: `${role}-${i}`,
      role,
      subRole: subs,
      identity: {
        exhibitorName: org,
        orgName: `${org} Ltd`,
        country: loc.country, city: loc.city,
      },
      avatar: avatarUrl(i),
    };
  }
  return {
    _id: `${role}-${i}`,
    role,
    subRole: subs,
    personal: { fullName: name, country: loc.country, city: loc.city },
    organization: { orgName: org, businessRole: title },
    avatar: avatarUrl(i),
  };
}

const COUNTS = {
  attendee: 40, speaker: 30, exhibitor: 30, investor: 25, consultant: 20,
  employee: 25, businessowner: 15, expert: 15, student: 10,
};

export const COMMUNITY_DEMO = Object.entries(COUNTS).flatMap(([role, count], j) =>
  Array.from({ length: count }, (_, i) => makeActor(i + j*100, role))
);

export function groupBySubrole(actors = COMMUNITY_DEMO){
  const map = {};
  for (const sr of SUBROLES) map[sr] = [];
  for (const a of actors) {
    const list = Array.isArray(a?.subRole) ? a.subRole : [];
    for (const sr of list) {
      if (!map[sr]) map[sr] = [];
      map[sr].push(a);
    }
  }
  return map;
}
