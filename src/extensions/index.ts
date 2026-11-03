import type { ComponentType } from "react";
import type { ExtensionDefinition, ExtensionNavItem, ExtensionView } from "./types";

/**
 * A extension nav item as handed to the shell: the manifest entry plus the
 * translation namespace of the owning extension (its manifest `id`), so the
 * shell renders `t(`${namespace}:${labelKey}`)` without extension internals.
 */
export interface ExtensionNavEntry extends ExtensionNavItem {
  namespace: string;
}

/**
 * Extension registry.
 *
 * Discovery is build-time: every `src/extensions/<id>/index.ts` is eagerly
 * bundled and its default export is taken as the extension manifest. Presence
 * in the tree is the only opt-in — there is no enable/disable gating, and
 * a broken extension fails typecheck/build rather than degrading silently.
 *
 * This glob is the platform's only scan of the extensions tree; everything
 * else a extension contributes (nav items, views, locale bundles) arrives
 * through the typed manifest.
 */

const modules = import.meta.glob<{ default: ExtensionDefinition }>(
  "./*/index.ts",
  { eager: true },
);

export const extensions: ExtensionDefinition[] = Object.values(modules).map(
  (module) => module.default,
);

/** All nav items contributed to the sidebar's Extensions group, in scan order. */
export function navItems(): ExtensionNavEntry[] {
  return extensions.flatMap((extension) =>
    (extension.contributes.navItems ?? []).map((item) => ({
      ...item,
      namespace: extension.id,
    })),
  );
}

/** The view contributed for `id`, if any extension provides one. */
export function viewFor(id: string): ExtensionView | undefined {
  for (const extension of extensions) {
    const view = extension.contributes.views?.find((view) => view.id === id);
    if (view) return view;
  }
  return undefined;
}

/**
 * All tool-card registrar components contributed by extensions, in scan
 * order. The chat page mounts them inside the CopilotKit provider.
 */
export function toolCardComponents(): ComponentType[] {
  return extensions.flatMap((extension) => extension.contributes.toolCards ?? []);
}
