import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// Static resources (fastest). You can split per-NS later.
import en from "./locales/en/common.json";
import fr from "./locales/fr/common.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { en: { common: en }, fr: { common: fr } },
    fallbackLng: "en",
    supportedLngs: ["en","fr"],
    load: "languageOnly",
    detection: {
      order: ["localStorage","querystring","navigator"],
      lookupQuerystring: "lang",
      lookupLocalStorage: "i18nextLng",
      caches: ["localStorage"],
    },
    ns: ["common"],
    defaultNS: "common",
    interpolation: { escapeValue: false },
    returnEmptyString: false,
    react: { useSuspense: false },
  });

export default i18n;
