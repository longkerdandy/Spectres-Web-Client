import type { ComponentType } from "react";
import type { LucideIcon } from "lucide-react";

/**
 * Extension contract.
 *
 * A extension is one self-contained directory under `src/extensions/<id>/` whose
 * `index.ts` default-exports `defineExtension({...})`. Everything a extension
 * needs (views, API clients, types, components) lives inside its directory;
 * the shell only sees the typed contributions declared here.
 *
 * `contributes` is an extension-point bag: the platform defines the points
 * (`navItems`, `views`, `locales`, `toolCards`) and extensions declare what
 * they add. New extension points are new optional fields, so existing
 * extensions never change when the platform grows one.
 */

export interface ExtensionNavItem {
  /**
   * Unique across all extensions. Also the id of the view opened when the
   * item is clicked — every nav item must have a matching entry in `views`.
   */
  id: string;
  /**
   * Translation key within the extension's own namespace (= the extension id),
   * resolved by the shell as `t(`${namespace}:${labelKey}`)`.
   */
  labelKey: string;
  icon: LucideIcon;
  /** Translation key within the extension's namespace, like `labelKey`. */
  badgeKey?: string;
}

export interface ExtensionView {
  /** View id, referenced by a nav item's `id`. Unique across all extensions. */
  id: string;
  component: ComponentType;
}

/** Nested translation messages of one language for one extension namespace. */
export interface LocaleMessages {
  [key: string]: string | LocaleMessages;
}

export interface ExtensionContributions {
  /** Entries contributed to the sidebar's Extensions group. */
  navItems?: ExtensionNavItem[];
  /** Pages contributed to the shell's main area. */
  views?: ExtensionView[];
  /**
   * Translation bundles keyed by language code (`en`, `zh-CN`, …),
   * registered under the namespace equal to the extension id. Build with
   * `defineLocales(import.meta.glob("./locales/*.json", …))`.
   */
  locales?: Record<string, LocaleMessages>;
  /**
   * Chat tool-card registrars: components that register CopilotKit
   * `useRenderTool` renderers for the extension's Runtime tools and render
   * nothing. Mounted by the chat page inside the CopilotKit provider.
   */
  toolCards?: ComponentType[];
}

export interface ExtensionDefinition {
  /** Matches the Runtime extension name (`etf-grid` ↔ `etf_grid`). */
  id: string;
  contributes: ExtensionContributions;
}

/**
 * Identity helper that enforces the manifest shape at compile time:
 * a wrong-shaped manifest fails `npm run typecheck` (fail-loud).
 */
export function defineExtension(definition: ExtensionDefinition): ExtensionDefinition {
  return definition;
}

/**
 * Normalizes a extension-local locale glob into language-keyed bundles:
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
