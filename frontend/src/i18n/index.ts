import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { enUS, zhCN } from "./resources";

export const LANGUAGE_STORAGE_KEY = "journiv.language";
export const SUPPORTED_LANGUAGES = ["zh-CN", "en-US"] as const;
export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number];

function readLanguage(): AppLanguage {
  try {
    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored === "zh-CN" || stored === "en-US") return stored;
  } catch {
    // Storage can be unavailable in privacy modes; Chinese is the product
    // default and still gives the app a deterministic first paint.
  }
  return "zh-CN";
}

void i18n.use(initReactI18next).init({
  resources: {
    "zh-CN": { translation: zhCN },
    "en-US": { translation: enUS },
  },
  lng: readLanguage(),
  fallbackLng: "zh-CN",
  supportedLngs: [...SUPPORTED_LANGUAGES],
  interpolation: { escapeValue: false },
  initAsync: false,
});

function syncDocumentLanguage(language: string) {
  if (typeof document !== "undefined") document.documentElement.lang = language;
}

syncDocumentLanguage(i18n.resolvedLanguage ?? "zh-CN");
i18n.on("languageChanged", syncDocumentLanguage);

export async function setAppLanguage(language: AppLanguage) {
  try {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch {
    // The active session can still change language when persistence is blocked.
  }
  await i18n.changeLanguage(language);
}

export function getAppLanguage(): AppLanguage {
  return i18n.resolvedLanguage === "en-US" ? "en-US" : "zh-CN";
}

export default i18n;
