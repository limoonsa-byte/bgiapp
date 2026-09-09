import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import enAuth from "./locales/en/auth.json";
import enChat from "./locales/en/chat.json";
import enCommon from "./locales/en/common.json";
import enConsole from "./locales/en/console.json";
import enLayout from "./locales/en/layout.json";
import enOffice from "./locales/en/office.json";
import enPanels from "./locales/en/panels.json";
import koAuth from "./locales/ko/auth.json";
import koChat from "./locales/ko/chat.json";
import koCommon from "./locales/ko/common.json";
import koConsole from "./locales/ko/console.json";
import koLayout from "./locales/ko/layout.json";
import koOffice from "./locales/ko/office.json";
import koPanels from "./locales/ko/panels.json";
import zhChat from "./locales/zh/chat.json";
import zhCommon from "./locales/zh/common.json";
import zhConsole from "./locales/zh/console.json";
import zhLayout from "./locales/zh/layout.json";
import zhOffice from "./locales/zh/office.json";
import zhPanels from "./locales/zh/panels.json";
import zhAuth from "./locales/zh/auth.json";

export const supportedLngs = ["ko", "en", "zh"] as const;
export type SupportedLng = (typeof supportedLngs)[number];

export const namespaces = ["common", "layout", "office", "panels", "chat", "console", "auth"] as const;

// Existing preview users may have inherited the old Chinese default in localStorage.
// Migrate once to Korean, then respect whatever language the user chooses afterwards.
if (typeof window !== "undefined" && !window.localStorage.getItem("oro-ko-locale-migrated-v1")) {
  window.localStorage.setItem("i18nextLng", "ko");
  window.localStorage.setItem("oro-ko-locale-migrated-v1", "1");
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      ko: {
        common: koCommon,
        layout: koLayout,
        office: koOffice,
        panels: koPanels,
        chat: koChat,
        console: koConsole,
        auth: koAuth,
      },
      en: {
        common: enCommon,
        layout: enLayout,
        office: enOffice,
        panels: enPanels,
        chat: enChat,
        console: enConsole,
        auth: enAuth,
      },
      zh: {
        common: zhCommon,
        layout: zhLayout,
        office: zhOffice,
        panels: zhPanels,
        chat: zhChat,
        console: zhConsole,
        auth: zhAuth,
      },
    },
    supportedLngs: [...supportedLngs],
    fallbackLng: "en",
    defaultNS: "common",
    ns: [...namespaces],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "i18nextLng",
    },
  });

export default i18n;
