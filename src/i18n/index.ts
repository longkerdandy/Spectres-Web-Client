import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import type { Resource } from "i18next";
import { plugins } from "@/plugins";
import type { LocaleMessages } from "@/plugins/types";
import commonEn from "./locales/en/common.json";

/**
 * i18n core.
 *
 * Languages are resolved once at startup: localStorage → navigator → the
 * default. Every supported language's bundles — the core `common` namespace
 * plus each plugin manifest's `contributes.locales`, namespaced by the
 * manifest's `id` — are folded into a single `resources` object and passed
 * to `init()`, so registration is synchronous and atomic: no raw keys on
 * first paint, and `changeLanguage()` needs no async loading.
 *
 * Adding a language = add its `common.json`, one entry in
 * `SUPPORTED_LANGUAGES` and `coreResources`; plugins pick it up by shipping
 * their own `locales/<lang>.json`.
 */

export const SUPPORTED_LANGUAGES = ["en"] as const;
export const DEFAULT_LANGUAGE: string = SUPPORTED_LANGUAGES[0];

const STORAGE_KEY = "spectres:lang";

function isSupported(language: string): boolean {
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(language);
}

function resolveLanguage(): string {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved && isSupported(saved)) return saved;
  const browser = navigator.language;
  const match = SUPPORTED_LANGUAGES.find(
    (language) => browser === language || browser.startsWith(`${language}-`),
  );
  return match ?? DEFAULT_LANGUAGE;
}

/** Core namespaces per language; the `common` bundle lives in this module. */
const coreResources: Record<string, { common: LocaleMessages }> = {
  en: { common: commonEn },
};

function buildResources(): Resource {
  const resources: Resource = {};
  for (const language of SUPPORTED_LANGUAGES) {
    resources[language] = { ...coreResources[language] };
  }
  for (const plugin of plugins) {
    for (const [language, messages] of Object.entries(
      plugin.contributes.locales ?? {},
    )) {
      if (!isSupported(language)) continue;
      resources[language][plugin.id] = messages;
    }
  }
  return resources;
}

const language = resolveLanguage();

void i18n.use(initReactI18next).init({
  resources: buildResources(),
  lng: language,
  fallbackLng: DEFAULT_LANGUAGE,
  defaultNS: "common",
  interpolation: {
    // React already escapes values.
    escapeValue: false,
  },
});

function applyLanguage(resolved: string) {
  localStorage.setItem(STORAGE_KEY, resolved);
  document.documentElement.lang = resolved;
}

applyLanguage(language);
i18n.on("languageChanged", applyLanguage);

export default i18n;
