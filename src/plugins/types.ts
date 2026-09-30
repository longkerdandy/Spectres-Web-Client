import type { ComponentType } from "react";
import type { LucideIcon } from "lucide-react";

/**
 * Plugin contract.
 *
 * A plugin is one self-contained directory under `src/plugins/<id>/` whose
 * `index.ts` default-exports `definePlugin({...})`. Everything a plugin
 * needs (views, API clients, types, components) lives inside its directory;
 * the shell only sees the typed contributions declared here.
 *
 * `contributes` is an extension-point bag: the platform defines the points
 * (`navItems`, `views`, `locales` today; `toolCards` arrives in v0.2.1) and
 * plugins declare what they add. New extension points are new optional
 * fields, so existing plugins never change when the platform grows one.
 */

export interface PluginNavItem {
  /**
   * Unique across all plugins. Also the id of the view opened when the
   * item is clicked — every nav item must have a matching entry in `views`.
   */
  id: string;
  /**
   * Translation key within the plugin's own namespace (= the plugin id),
   * resolved by the shell as `t(`${namespace}:${labelKey}`)`.
   */
  labelKey: string;
  icon: LucideIcon;
  /** Translation key within the plugin's namespace, like `labelKey`. */
  badgeKey?: string;
}

export interface PluginView {
  /** View id, referenced by a nav item's `id`. Unique across all plugins. */
  id: string;
  component: ComponentType;
}

/** Nested translation messages of one language for one plugin namespace. */
export interface LocaleMessages {
  [key: string]: string | LocaleMessages;
}

export interface PluginContributions {
  /** Entries contributed to the sidebar's Plugins group. */
  navItems?: PluginNavItem[];
  /** Pages contributed to the shell's main area. */
  views?: PluginView[];
  /**
   * Translation bundles keyed by language code (`en`, `zh-CN`, …),
   * registered under the namespace equal to the plugin id. Build with
   * `defineLocales(import.meta.glob("./locales/*.json", …))`.
   */
  locales?: Record<string, LocaleMessages>;
}

export interface PluginDefinition {
  /** Matches the Runtime extension name (`etf-grid` ↔ `etf_grid`). */
  id: string;
  contributes: PluginContributions;
}

/**
 * Identity helper that enforces the manifest shape at compile time:
 * a wrong-shaped manifest fails `npm run typecheck` (fail-loud).
 */
export function definePlugin(definition: PluginDefinition): PluginDefinition {
  return definition;
}

/**
 * Normalizes a plugin-local locale glob into language-keyed bundles:
 * `./locales/en.json` → `en`. Pass the result of
 * `import.meta.glob("./locales/*.json", { eager: true, import: "default" })`.
 */
export function defineLocales(
  modules: Record<string, LocaleMessages>,
): Record<string, LocaleMessages> {
  const locales: Record<string, LocaleMessages> = {};
  for (const [path, messages] of Object.entries(modules)) {
    const language = /([^/]+)\.json$/.exec(path)?.[1];
    if (language) locales[language] = messages;
  }
  return locales;
}
