import { useEffect, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useLogto } from "@logto/react";
import {
  ChevronDown,
  Clock,
  LogOut,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { postLogoutRedirectUri } from "@/auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  extensionGroup,
  primaryNav,
  type NavAction,
  type NavItem,
  type ViewId,
} from "@/nav";
import { navItems as extensionNavItems, type ExtensionNavEntry } from "@/extensions";
import type { Session } from "@/sessions-api";

/** Eagerly discovered at build time; constant for the app's lifetime. */
const extensionItems = extensionNavItems();

interface AppShellProps {
  activeView?: ViewId;
  activeThreadId?: string;
  sessions?: Session[];
  sessionsLoading?: boolean;
  sessionsError?: Error | null;
  onSelectView?: (view: ViewId) => void;
  onResetThread?: () => void;
  onSelectSession?: (sessionId: string) => void;
  onRenameSession?: (sessionId: string, name: string) => Promise<void>;
  onDeleteSession?: (sessionId: string) => Promise<void>;
  onRefreshSessions?: () => void;
  mode?: "assistant" | "admin";
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
  activeThreadId,
  sessions = [],
  sessionsLoading = false,
  sessionsError = null,
  onSelectView,
  onResetThread,
  onSelectSession,
  onRenameSession,
  onDeleteSession,
  onRefreshSessions,
  mode = "assistant",
  children,
}: AppShellProps) {
  const { t } = useTranslation("common");
  const { signOut, getIdTokenClaims } = useLogto();
  const [userName, setUserName] = useState<string>();
  const [userEmail, setUserEmail] = useState<string>();
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [renamingSession, setRenamingSession] = useState<Session | null>(null);
  const [deletingSession, setDeletingSession] = useState<Session | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [actionPending, setActionPending] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    void getIdTokenClaims().then((claims) => {
      setUserName(claims?.name ?? claims?.username ?? undefined);
      setUserEmail(claims?.email ?? undefined);
    });
  }, [getIdTokenClaims]);

  const displayName = userName ?? userEmail ?? "";
  const initials =
    displayName
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?";

  function runAction(action: NavAction | undefined) {
    if (!action) return;
    switch (action.type) {
      case "reset-thread":
        onResetThread?.();
        onSelectView?.("chat");
        break;
      case "select-view":
        onSelectView?.(action.view);
        break;
    }
  }

  function renderNavItem(item: NavItem) {
    return (
      <SidebarMenuItem key={item.id}>
        <SidebarMenuButton
          isActive={item.id === activeView}
          disabled={item.disabled}
          onClick={() => runAction(item.action)}
        >
          <item.icon />
          <span>{t(item.labelKey)}</span>
          {item.badgeKey && <NavBadge label={t(item.badgeKey)} />}
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  function renderExtensionNavItem(item: ExtensionNavEntry) {
    return (
      <SidebarMenuSubItem key={item.id}>
        <SidebarMenuSubButton
          isActive={activeView === item.id}
          onClick={() => onSelectView?.(item.id)}
        >
          <item.icon />
          <span>{t(`${item.namespace}:${item.labelKey}`)}</span>
          {item.badgeKey && (
            <span className="ml-auto rounded-full bg-sidebar-accent px-1.5 py-0.5 text-[10px] text-sidebar-foreground/70">
              {t(`${item.namespace}:${item.badgeKey}`)}
            </span>
          )}
        </SidebarMenuSubButton>
      </SidebarMenuSubItem>
    );
  }

  function sessionTitle(session: Session): string {
    return session.session_name?.trim() || t("session.untitled");
  }

  async function handleRename() {
    if (!renamingSession || !onRenameSession) return;
    const name = renameValue.trim();
    if (!name) return;
    setActionPending(true);
    setActionError(null);
    try {
      await onRenameSession(renamingSession.session_id, name);
      setRenamingSession(null);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : String(error));
    } finally {
      setActionPending(false);
    }
  }

  async function handleDelete() {
    if (!deletingSession || !onDeleteSession) return;
    setActionPending(true);
    setActionError(null);
    try {
      await onDeleteSession(deletingSession.session_id);
      setDeletingSession(null);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : String(error));
    } finally {
      setActionPending(false);
    }
  }

  function renderSessionItem(session: Session) {
    return (
      <SidebarMenuItem key={session.session_id}>
        <SidebarMenuButton
          isActive={activeView === "chat" && activeThreadId === session.session_id}
          onClick={() => onSelectSession?.(session.session_id)}
        >
          <MessageSquare />
          <span className="truncate">{sessionTitle(session)}</span>
        </SidebarMenuButton>
        <Popover
          open={openMenuId === session.session_id}
          onOpenChange={(open) => setOpenMenuId(open ? session.session_id : null)}
        >
          <PopoverTrigger asChild>
            <SidebarMenuAction showOnHover aria-label={t("session.actions")}>
              <MoreHorizontal />
            </SidebarMenuAction>
          </PopoverTrigger>
          <PopoverContent side="right" align="start" className="w-40 p-1">
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-sidebar-accent"
              onClick={() => {
                setRenamingSession(session);
                setRenameValue(session.session_name ?? "");
                setActionError(null);
                setOpenMenuId(null);
              }}
            >
              <Pencil className="size-4" />
              {t("session.rename")}
            </button>
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-destructive hover:bg-sidebar-accent"
              onClick={() => {
                setDeletingSession(session);
                setActionError(null);
                setOpenMenuId(null);
              }}
            >
              <Trash2 className="size-4" />
              {t("session.delete")}
            </button>
          </PopoverContent>
        </Popover>
      </SidebarMenuItem>
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
          {mode === "admin" ? (
            <SidebarGroup>
              <SidebarGroupLabel>{t("admin.console")}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={activeView === "overview"}
                      onClick={() => onSelectView?.("overview")}
                    >
                      <ShieldCheck />
                      <span>{t("admin.title")}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={activeView === "scheduled-tasks"}
                      onClick={() => onSelectView?.("scheduled-tasks")}
                    >
                      <Clock />
                      <span>{t("nav.scheduledTasks")}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ) : (
            <>
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {primaryNav.map(renderNavItem)}
                    <SidebarMenuItem>
                      <Collapsible defaultOpen className="group/collapsible">
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton>
                            <extensionGroup.icon />
                            <span>{t(extensionGroup.labelKey)}</span>
                            <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {extensionItems.map(renderExtensionNavItem)}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </Collapsible>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>

              <SidebarGroup>
                <SidebarGroupLabel>{t("nav.recent")}</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {sessionsLoading ? (
                      Array.from({ length: 3 }, (_, index) => (
                        <SidebarMenuItem key={index}>
                          <SidebarMenuSkeleton showIcon />
                        </SidebarMenuItem>
                      ))
                    ) : sessionsError ? (
                      <div className="flex flex-col gap-2 px-2 py-1.5 text-xs text-muted-foreground">
                        <span>{t("session.loadError")}</span>
                        <Button
                          variant="outline"
                          size="xs"
                          className="self-start"
                          onClick={() => onRefreshSessions?.()}
                        >
                          {t("session.retry")}
                        </Button>
                      </div>
                    ) : sessions.length === 0 ? (
                      <div className="px-2 py-1.5 text-xs text-muted-foreground">
                        {t("session.empty")}
                      </div>
                    ) : (
                      sessions.map(renderSessionItem)
                    )}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </>
          )}
        </SidebarContent>

        <SidebarFooter>
          <div className="flex items-center gap-2.5 px-2 py-2">
            <Avatar className="size-8 shrink-0">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 leading-tight group-data-[collapsible=icon]:hidden">
              <div className="truncate text-sm">{displayName}</div>
              {userName && userEmail && (
                <div className="truncate text-xs text-muted-foreground">
                  {userEmail}
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 shrink-0 group-data-[collapsible=icon]:hidden"
              title={t("auth.signOut")}
              onClick={() => void signOut(postLogoutRedirectUri())}
            >
              <LogOut />
            </Button>
          </div>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="h-svh">{children}</SidebarInset>

      <Dialog
        open={renamingSession !== null}
        onOpenChange={(open) => {
          if (!open) setRenamingSession(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("session.renameTitle")}</DialogTitle>
            <DialogDescription>
              {t("session.renameDescription")}
            </DialogDescription>
          </DialogHeader>
          <Input
            value={renameValue}
            onChange={(event) => setRenameValue(event.target.value)}
            placeholder={t("session.renamePlaceholder")}
            onKeyDown={(event) => {
              if (event.key === "Enter") void handleRename();
            }}
            autoFocus
          />
          {actionError && (
            <p className="text-xs text-destructive">{actionError}</p>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRenamingSession(null)}
              disabled={actionPending}
            >
              {t("session.cancel")}
            </Button>
            <Button
              onClick={() => void handleRename()}
              disabled={actionPending || !renameValue.trim()}
            >
              {actionPending ? t("session.saving") : t("session.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deletingSession !== null}
        onOpenChange={(open) => {
          if (!open) setDeletingSession(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("session.deleteTitle")}</DialogTitle>
            <DialogDescription>
              {t("session.deleteDescription", {
                name: deletingSession ? sessionTitle(deletingSession) : "",
              })}
            </DialogDescription>
          </DialogHeader>
          {actionError && (
            <p className="text-xs text-destructive">{actionError}</p>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeletingSession(null)}
              disabled={actionPending}
            >
              {t("session.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => void handleDelete()}
              disabled={actionPending}
            >
              {actionPending ? t("session.deleting") : t("session.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
