// src/lib/hooks/useTranslate.js
import { useTranslation } from "react-i18next";

/**
 * Unified translation hook.
 * Default namespace: "common".
 *
 * Usage:
 *   const { t } = useTranslate();
 *   t("key");
 *   t("key", "Default value");
 *   t("key", { defaultValue: "Default value", someVar });
 */
export function useTranslate(ns = "common") {
  const { t, i18n } = useTranslation(ns);

  const tx = (key, defaultValueOrOptions, maybeOptions) => {
    // t("key", "Default")
    if (typeof defaultValueOrOptions === "string") {
      return t(key, { defaultValue: defaultValueOrOptions, ...(maybeOptions || {}) });
    }
    // t("key", { ...options })
    if (typeof defaultValueOrOptions === "object" && defaultValueOrOptions != null) {
      return t(key, defaultValueOrOptions);
    }
    // t("key")
    return t(key);
  };

  return { t: tx, i18n };
}
