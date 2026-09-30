import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  pluginGroup,
  primaryNav,
  recentConversations,
  type NavAction,
  type NavItem,
  type ViewId,
} from "@/nav";
import { navItems as pluginNavItems, type PluginNavItem } from "@/plugins";

/** Eagerly discovered at build time; constant for the app's lifetime. */
const pluginItems = pluginNavItems();

interface AppShellProps {
  activeView: ViewId;
  onSelectView: (view: ViewId) => void;
  onResetThread: () => void;
  children: ReactNode;
}

function NavBadge({ label }: { label: string }) {
  return (
    <SidebarMenuBadge className="rounded-full bg-sidebar-accent px-1.5 text-[10px] font-normal">
      {label}
    </SidebarMenuBadge>
  );
}

export function AppShell({
  activeView,
  onSelectView,
  onResetThread,
  children,
}: AppShellProps) {
  function runAction(action: NavAction | undefined) {
    if (!action) return;
    switch (action.type) {
      case "reset-thread":
        onResetThread();
        onSelectView("chat");
        break;
      case "open-view":
        onSelectView(action.view);
        break;
    }
  }

  function renderNavItem(item: NavItem) {
    return (
      <SidebarMenuItem key={item.id}>
        <SidebarMenuButton
          disabled={item.disabled}
          onClick={() => runAction(item.action)}
        >
          <item.icon />
          <span>{item.label}</span>
          {item.badge && <NavBadge label={item.badge} />}
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  function renderPluginNavItem(item: PluginNavItem) {
    return (
      <SidebarMenuSubItem key={item.id}>
        <SidebarMenuSubButton
          isActive={activeView === item.id}
          onClick={() => onSelectView(item.id)}
        >
          <item.icon />
          <span>{item.label}</span>
          {item.badge && (
            <span className="ml-auto rounded-full bg-sidebar-accent px-1.5 py-0.5 text-[10px] text-sidebar-foreground/70">
              {item.badge}
            </span>
          )}
        </SidebarMenuSubButton>
      </SidebarMenuSubItem>
    );
  }

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader className="flex-row items-center justify-between">
          <span className="px-2 text-sm font-semibold tracking-wide group-data-[collapsible=icon]:hidden">
            Spectres
          </span>
          <SidebarTrigger />
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {primaryNav.map(renderNavItem)}
                <SidebarMenuItem>
                  <Collapsible defaultOpen className="group/collapsible">
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton>
                        <pluginGroup.icon />
                        <span>{pluginGroup.label}</span>
                        <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {pluginItems.map(renderPluginNavItem)}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </Collapsible>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel>最近</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {recentConversations.map((conversation) => (
                  <SidebarMenuItem key={conversation.id}>
                    <SidebarMenuButton
                      isActive={activeView === conversation.view}
                      onClick={() => onSelectView(conversation.view)}
                    >
                      <conversation.icon />
                      <span>{conversation.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <div className="flex items-center gap-2.5 px-2 py-2">
            <Avatar className="size-8 shrink-0">
              <AvatarFallback>DG</AvatarFallback>
            </Avatar>
            <div className="min-w-0 leading-tight group-data-[collapsible=icon]:hidden">
              <div className="truncate text-sm">Dong-xu Gu</div>
              <div className="text-xs text-muted-foreground">本地单用户</div>
            </div>
          </div>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="h-svh">{children}</SidebarInset>
    </SidebarProvider>
  );
}
