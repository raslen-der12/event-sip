// countryCanon.js — full coverage canonizer for country filters (codes + EN/FR/AR names + common aliases)
// Usage:
//   import { canonCountry, buildCountryCanon } from "../utils/countryCanon";
//   const CANON = buildCountryCanon();  // build once (cached)
//   const key = canonCountry("TUNISIE"); // -> "TUNISIA"

const stripDiacritics = (s="") => s.normalize?.("NFD").replace(/[\u0300-\u036f]/g,"") || s;
const norm = (s="") => stripDiacritics(String(s||"").trim().toUpperCase())
  .replace(/[\u061B\u061F\u060C]/g, "")               // Arabic punctuations
  .replace(/['’`´^~.,()/\-–—]/g, " ")                  // unify punctuation/spacing
  .replace(/\s+/g, " ");                               // collapse spaces

// Aliases that CLDR/Intl won't generate (brand acronyms, legacy names, exonyms)
const EXTRA_SYNONYMS = {
  // Short acronyms / brands
  LIBYA:"LIBYA",
  LB:"LIBYA",
  UK: "UNITED KINGDOM",
  GB: "UNITED KINGDOM",
  KSA: "SAUDI ARABIA",
  UAE: "UNITED ARAB EMIRATES",
  USA: "UNITED STATES",
  "U S A": "UNITED STATES",
  "U S": "UNITED STATES",
  RUSSIA: "RUSSIAN FEDERATION",
  "HONG KONG": "HONG KONG SAR CHINA",
  MACAU: "MACAO SAR CHINA",
  VIETNAM: "VIET NAM",
  LAOS: "LAO PEOPLE S DEMOCRATIC REPUBLIC",
  BOLIVIA: "BOLIVIA PLURINATIONAL STATE OF",
  VENEZUELA: "VENEZUELA BOLIVARIAN REPUBLIC OF",
  TANZANIA: "TANZANIA UNITED REPUBLIC OF",
  IRAN: "IRAN ISLAMIC REPUBLIC OF",
  SYRIA: "SYRIAN ARAB REPUBLIC",
  MOLDOVA: "MOLDOVA REPUBLIC OF",
  PALESTINE: "PALESTINE STATE OF",
  CONGO: "CONGO",                           // CG
  "REPUBLIC OF THE CONGO": "CONGO",         // CG
  "DEMOCRATIC REPUBLIC OF CONGO": "CONGO DEMOCRATIC REPUBLIC OF", // CD
  DRC: "CONGO DEMOCRATIC REPUBLIC OF",
  SWAZILAND: "ESWATINI",
  BURMA: "MYANMAR",
  "CAPE VERDE": "CABO VERDE",
  "COTE D IVOIRE": "CÔTE D IVOIRE",           // will normalize diacritics anyway
  "IVORY COAST": "CÔTE D IVOIRE",
  "KOREA SOUTH": "KOREA REPUBLIC OF",
  "SOUTH KOREA": "KOREA REPUBLIC OF",
  "KOREA NORTH": "KOREA DEMOCRATIC PEOPLE S REPUBLIC OF",
  "NORTH KOREA": "KOREA DEMOCRATIC PEOPLE S REPUBLIC OF",
  "BRITAIN": "UNITED KINGDOM",
  "HOLY SEE": "HOLY SEE",
  VATICAN: "HOLY SEE",
  "CZECH REPUBLIC": "CZECHIA",
  MACEDONIA: "NORTH MACEDONIA",
  "RÉUNION": "RÉUNION", // keep diacritics (FR ODD)
};

// Arabic popular exonyms -> canonical English (covers most common cases)
const AR_SYNONYMS = {
  "تونس": "TUNISIA",
  "مصر": "EGYPT",
  "الجزائر": "ALGERIA",
  "المغرب": "MOROCCO",
  "ليبيا": "LIBYA",
  "موريتانيا": "MAURITANIA",
  "السودان": "SUDAN",
  "السعودية": "SAUDI ARABIA",
  "الإمارات": "UNITED ARAB EMIRATES",
  "قطر": "QATAR",
  "الكويت": "KUWAIT",
  "البحرين": "BAHRAIN",
  "عمان": "OMAN",
  "العراق": "IRAQ",
  "سوريا": "SYRIAN ARAB REPUBLIC",
  "لبنان": "LEBANON",
  "الأردن": "JORDAN",
  "فلسطين": "PALESTINE STATE OF",
  "اليمن": "YEMEN",
  "تركيا": "TÜRKİYE",
  "الصين": "CHINA",
  "الولايات المتحدة": "UNITED STATES",
  "أمريكا": "UNITED STATES",
  "بريطانيا": "UNITED KINGDOM",
  "فرنسا": "FRANCE",
  "ألمانيا": "GERMANY",
  "إيطاليا": "ITALY",
  "إسبانيا": "SPAIN",
  "البرتغال": "PORTUGAL",
  "هولندا": "NETHERLANDS",
  "بلجيكا": "BELGIUM",
  "السويد": "SWEDEN",
  "النرويج": "NORWAY",
  "الدنمارك": "DENMARK",
  "فنلندا": "FINLAND",
  "روسيا": "RUSSIAN FEDERATION",
  "أوكرانيا": "UKRAINE",
  "بيلاروس": "BELARUS",
  "بولندا": "POLAND",
  "التشيك": "CZECHIA",
  "النمسا": "AUSTRIA",
  "سويسرا": "SWITZERLAND",
  "اليونان": "GREECE",
  "رومانيا": "ROMANIA",
  "بلغاريا": "BULGARIA",
  "كرواتيا": "CROATIA",
  "صربيا": "SERBIA",
  "مولدوفا": "MOLDOVA REPUBLIC OF",
  "المجر": "HUNGARY",
  "سلوفاكيا": "SLOVAKIA",
  "سلوفينيا": "SLOVENIA",
  "البوسنة والهرسك": "BOSNIA AND HERZEGOVINA",
  "جمهورية مقدونيا الشمالية": "NORTH MACEDONIA",
  "إيرلندا": "IRELAND",
  "إسكتلندا": "UNITED KINGDOM",
  "ويلز": "UNITED KINGDOM",
  "إستونيا": "ESTONIA",
  "لاتفيا": "LATVIA",
  "ليتوانيا": "LITHUANIA",
  "آيسلندا": "ICELAND",
  "كندا": "CANADA",
  "المكسيك": "MEXICO",
  "البرازيل": "BRAZIL",
  "الأرجنتين": "ARGENTINA",
  "كولومبيا": "COLOMBIA",
  "بيرو": "PERU",
  "تشيلي": "CHILE",
  "أستراليا": "AUSTRALIA",
  "نيوزيلندا": "NEW ZEALAND",
  "اليابان": "JAPAN",
  "كوريا الجنوبية": "KOREA REPUBLIC OF",
  "كوريا الشمالية": "KOREA DEMOCRATIC PEOPLE S REPUBLIC OF",
  "الهند": "INDIA",
  "باكستان": "PAKISTAN",
  "بنغلاديش": "BANGLADESH",
  "إندونيسيا": "INDONESIA",
  "ماليزيا": "MALAYSIA",
  "سنغافورة": "SINGAPORE",
  "الفلبين": "PHILIPPINES",
  "سريلانكا": "SRI LANKA",
  "نيجيريا": "NIGERIA",
  "غانا": "GHANA",
  "ساحل العاج": "CÔTE D IVOIRE",
  "إثيوبيا": "ETHIOPIA",
  "كينيا": "KENYA",
  "جنوب أفريقيا": "SOUTH AFRICA",
  "المغرب الصحراوي": "WESTERN SAHARA",
};

let _CANON_MAP = null;

/** Build (once) a map of all supported strings -> canonical EN uppercase name. */
export function buildCountryCanon() {
  if (_CANON_MAP) return _CANON_MAP;

  // Prepare CLDR display names for EN, FR, AR
  const idn_en = new Intl.DisplayNames(["en"], { type: "region" });
  const idn_fr = new Intl.DisplayNames(["fr"], { type: "region" });
  const idn_ar = new Intl.DisplayNames(["ar"], { type: "region" });

  const M = new Map();

  // Discover valid ISO alpha-2 region codes via CLDR (iterate A-ZA-Z and keep recognized)
  const a2 = [];
  for (let i = 65; i <= 90; i++) {
    for (let j = 65; j <= 90; j++) {
      const code = String.fromCharCode(i) + String.fromCharCode(j);
      const name = idn_en.of(code);
      if (name && name !== code) a2.push(code);
    }
  }

  // Seed map: code -> EN canonical, EN/FR/AR names -> EN canonical
  for (const code of a2) {
    const en = norm(idn_en.of(code));
    const fr = norm(idn_fr.of(code));
    const ar = norm(idn_ar.of(code));
    const cCode = norm(code);
    if (en && en !== cCode) {
      M.set(cCode, en);
      M.set(en, en);
      if (fr) M.set(fr, en);
      if (ar) M.set(ar, en);
    }
  }

  // Add extra popular synonyms/aliases (normalized)
  for (const [k, v] of Object.entries(EXTRA_SYNONYMS)) {
    M.set(norm(k), norm(v));
  }
  for (const [k, v] of Object.entries(AR_SYNONYMS)) {
    M.set(norm(k), norm(v));
  }

  _CANON_MAP = M;
  return _CANON_MAP;
}

/** Return canonical EN uppercase country name (or the normalized input if unknown). */
export function canonCountry(input) {
  if (!input) return "";
  const M = buildCountryCanon();
  const key = norm(input);
  return M.get(key) || key; // fallback to normalized user string
}
