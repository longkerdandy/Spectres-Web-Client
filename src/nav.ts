import type { LucideIcon } from "lucide-react";
import { Clock, MessageSquare, Puzzle, SquarePen } from "lucide-react";

/**
 * Navigation data model for the app shell.
 *
 * Core entries (upper nav, the Plugins group header, recent conversations)
 * are registered here as plain data; the shell renders them generically.
 * Plugin entries are NOT registered here — they come from the plugin
 * registry (`src/plugins/`), discovered at build time.
 */

/**
 * Core views are the `"chat"` literal; plugin views widen the type to any
 * string (ids come from plugin manifests). The `string & {}` keeps `"chat"`
 * discoverable in autocomplete.
 */
export type ViewId = "chat" | (string & {});

export type NavAction =
  | { type: "reset-thread" }
  | { type: "open-view"; view: ViewId };

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

export interface PluginGroup {
  id: string;
  /** Translation key in the `common` namespace. */
  labelKey: string;
  icon: LucideIcon;
}

export interface RecentConversation {
  id: string;
  /** Translation key in the `common` namespace. */
  titleKey: string;
  /** Shown when the sidebar collapses to icon mode. */
  icon: LucideIcon;
  view: ViewId;
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

/** Group header only; the child entries come from the plugin registry. */
export const pluginGroup: PluginGroup = {
  id: "plugins",
  labelKey: "nav.plugins",
  icon: Puzzle,
};

/** Only the current conversation is real; history arrives with thread management. */
export const recentConversations: RecentConversation[] = [
  { id: "current", titleKey: "nav.currentConversation", icon: MessageSquare, view: "chat" },
];
