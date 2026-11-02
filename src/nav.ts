import type { LucideIcon } from "lucide-react";
import { Clock, Puzzle, SquarePen } from "lucide-react";

/**
 * Navigation data model for the app shell.
 *
 * Core entries (upper nav, the Extensions group header, recent conversations)
 * are registered here as plain data; the shell renders them generically.
 * Extension entries are NOT registered here — they come from the extension
 * registry (`src/extensions/`), discovered at build time.
 */

/**
 * Core views are the `"chat"` literal; extension views widen the type to any
 * string (ids come from extension manifests). The `string & {}` keeps `"chat"`
 * discoverable in autocomplete.
 */
export type ViewId = "chat" | (string & {});

export type NavAction = { type: "reset-thread" };

export interface NavItem {
  id: string;
  /** Translation key in the `common` namespace, resolved by the shell. */
  labelKey: string;
  icon: LucideIcon;
  /** Omit for placeholders; `disabled` renders the entry inert. */
  action?: NavAction;
  disabled?: boolean;
  /** Translation key in the `common` namespace, like `labelKey`. */
  badgeKey?: string;
}

export interface ExtensionGroup {
  id: string;
  /** Translation key in the `common` namespace. */
  labelKey: string;
  icon: LucideIcon;
}

export const primaryNav: NavItem[] = [
  {
    id: "new-chat",
    labelKey: "nav.newChat",
    icon: SquarePen,
    action: { type: "reset-thread" },
  },
  {
    id: "scheduled-tasks",
    labelKey: "nav.scheduledTasks",
    icon: Clock,
    disabled: true,
    badgeKey: "nav.scheduledTasksBadge",
  },
];

/** Group header only; the child entries come from the extension registry. */
export const extensionGroup: ExtensionGroup = {
  id: "extensions",
  labelKey: "nav.extensions",
  icon: Puzzle,
};


