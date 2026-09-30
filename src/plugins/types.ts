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
 * (`navItems`, `views` today; `toolCards` arrives in v0.2.1) and plugins
 * declare what they add. New extension points are new optional fields, so
 * existing plugins never change when the platform grows one.
 */

export interface PluginNavItem {
  /**
   * Unique across all plugins. Also the id of the view opened when the
   * item is clicked — every nav item must have a matching entry in `views`.
   */
  id: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
}

export interface PluginView {
  /** View id, referenced by a nav item's `id`. Unique across all plugins. */
  id: string;
  component: ComponentType;
}

export interface PluginContributions {
  /** Entries contributed to the sidebar's Plugins group. */
  navItems?: PluginNavItem[];
  /** Pages contributed to the shell's main area. */
  views?: PluginView[];
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
