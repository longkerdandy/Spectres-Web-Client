import type { PluginDefinition, PluginNavItem, PluginView } from "./types";

export type { PluginNavItem, PluginView } from "./types";

/**
 * A plugin nav item as handed to the shell: the manifest entry plus the
 * translation namespace of the owning plugin (its manifest `id`), so the
 * shell renders `t(`${namespace}:${labelKey}`)` without plugin internals.
 */
export interface PluginNavEntry extends PluginNavItem {
  namespace: string;
}

/**
 * Plugin registry.
 *
 * Discovery is build-time: every `src/plugins/<id>/index.ts` is eagerly
 * bundled and its default export is taken as the plugin manifest. Presence
 * in the tree is the only opt-in — there is no enable/disable gating, and
 * a broken plugin fails typecheck/build rather than degrading silently.
 *
 * This glob is the platform's only scan of the plugins tree; everything
 * else a plugin contributes (nav items, views, locale bundles) arrives
 * through the typed manifest.
 */

const modules = import.meta.glob<{ default: PluginDefinition }>(
  "./*/index.ts",
  { eager: true },
);

export const plugins: PluginDefinition[] = Object.values(modules).map(
  (module) => module.default,
);

/** All nav items contributed to the sidebar's Plugins group, in scan order. */
export function navItems(): PluginNavEntry[] {
  return plugins.flatMap((plugin) =>
    (plugin.contributes.navItems ?? []).map((item) => ({
      ...item,
      namespace: plugin.id,
    })),
  );
}

/** The view contributed for `id`, if any plugin provides one. */
export function viewFor(id: string): PluginView | undefined {
  for (const plugin of plugins) {
    const view = plugin.contributes.views?.find((view) => view.id === id);
    if (view) return view;
  }
  return undefined;
}
