import type { LucideIcon } from "lucide-react";
import { ChartColumn, Clock, MessageSquare, Puzzle, SquarePen } from "lucide-react";

/**
 * Navigation data model for the app shell.
 *
 * Views and plugin entries are registered here as plain data; the shell
 * renders them generically. Adding a future view (e.g. v0.2.0's ETF Grid)
 * is a one-record change: extend ViewId, add the entry, flip `disabled`.
 */

export type ViewId = "chat";

export type NavAction =
  | { type: "reset-thread" }
  | { type: "open-view"; view: ViewId };

export interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  /** Omit for placeholders; `disabled` renders the entry inert. */
  action?: NavAction;
  disabled?: boolean;
  badge?: string;
}

export interface PluginGroup {
  id: string;
  label: string;
  icon: LucideIcon;
  items: NavItem[];
}

export interface RecentConversation {
  id: string;
  title: string;
  /** Shown when the sidebar collapses to icon mode. */
  icon: LucideIcon;
  view: ViewId;
}

export const primaryNav: NavItem[] = [
  {
    id: "new-chat",
    label: "新聊天",
    icon: SquarePen,
    action: { type: "reset-thread" },
  },
  {
    id: "scheduled-tasks",
    label: "定时任务",
    icon: Clock,
    disabled: true,
    badge: "未来",
  },
];

export const pluginGroup: PluginGroup = {
  id: "plugins",
  label: "插件",
  icon: Puzzle,
  items: [
    {
      id: "etf-grid",
      label: "ETF 网格",
      icon: ChartColumn,
      disabled: true,
      badge: "v0.2.0",
    },
  ],
};

/** Only the current conversation is real; history arrives with thread management. */
export const recentConversations: RecentConversation[] = [
  { id: "current", title: "当前会话", icon: MessageSquare, view: "chat" },
];
