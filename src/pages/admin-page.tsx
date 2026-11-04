import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight, ExternalLink, Loader2 } from "lucide-react";
import {
  getDirectoryUsers,
  getRuntimeInfo,
  setDirectoryUserDisabled,
  type DirectoryPage,
  type DirectoryUser,
  type RuntimeInfo,
} from "@/admin-api";
import { logtoAdminEndpoint } from "@/auth";
import { AppShell } from "@/components/app-shell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TooltipProvider } from "@/components/ui/tooltip";
import { RuntimeApiError } from "@/lib/runtime-api";
import ScheduledTasksPage from "@/pages/scheduled-tasks-page";

interface RequestFailure {
  message: string;
  status?: number;
}

function isAbort(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

function failure(error: unknown): RequestFailure {
  return {
    message: error instanceof Error ? error.message : String(error),
    status: error instanceof RuntimeApiError ? error.status : undefined,
  };
}

function RequestError({
  error,
  onRetry,
}: {
  error: RequestFailure;
  onRetry: () => void;
}) {
  const { t } = useTranslation("common");
  const forbidden = error.status === 403;
  return (
    <Alert variant="destructive">
      <AlertTitle>
        {forbidden ? t("admin.errors.forbidden") : t("admin.errors.request")}
      </AlertTitle>
      <AlertDescription>
        <p>{forbidden ? t("admin.errors.forbiddenDescription") : error.message}</p>
        <Button variant="outline" size="sm" className="mt-3" onClick={onRetry}>
          {t("admin.retry")}
        </Button>
      </AlertDescription>
    </Alert>
  );
}

function SystemOverview() {
  const { t } = useTranslation("common");
  const [info, setInfo] = useState<RuntimeInfo | null>(null);
  const [error, setError] = useState<RequestFailure | null>(null);
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    void getRuntimeInfo(controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setInfo(result);
      })
      .catch((reason: unknown) => {
        if (!isAbort(reason) && !controller.signal.aborted) {
          setError(failure(reason));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [revision]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("admin.system.title")}</CardTitle>
        <CardDescription>{t("admin.system.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {Array.from({ length: 5 }, (_, index) => (
              <Skeleton key={index} className="h-12" />
            ))}
          </div>
        ) : error ? (
          <RequestError error={error} onRetry={() => setRevision((value) => value + 1)} />
        ) : info ? (
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <dt className="text-xs text-muted-foreground">{t("admin.system.name")}</dt>
              <dd className="mt-1 font-medium">{info.name}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">{t("admin.system.agentOsVersion")}</dt>
              <dd className="mt-1 font-medium">{info.os_version}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">{t("admin.system.agnoVersion")}</dt>
              <dd className="mt-1 font-medium">{info.agno_version}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">{t("admin.system.authMode")}</dt>
              <dd className="mt-1 font-medium">{info.auth_mode}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">{t("admin.system.userIsolation")}</dt>
              <dd className="mt-1 font-medium">
                {info.user_isolation ? t("admin.system.enabled") : t("admin.system.disabled")}
              </dd>
            </div>
          </dl>
        ) : null}
      </CardContent>
    </Card>
  );
}

export default function AdminPage({ currentUserId }: { currentUserId: string | null }) {
  const { t } = useTranslation("common");
  const [view, setView] = useState<"overview" | "scheduled-tasks">("overview");
  const [page, setPage] = useState(1);
  const [directory, setDirectory] = useState<DirectoryPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<RequestFailure | null>(null);
  const [revision, setRevision] = useState(0);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});
  const [disableTarget, setDisableTarget] = useState<DirectoryUser | null>(null);
  const updateController = useRef<AbortController | null>(null);
  const updateRevision = useRef(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setDirectory(null);
    void getDirectoryUsers(page, controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setDirectory(result);
      })
      .catch((reason: unknown) => {
        if (!isAbort(reason) && !controller.signal.aborted) {
          setError(failure(reason));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [page, revision]);

  useEffect(() => () => {
    updateRevision.current += 1;
    updateController.current?.abort();
  }, []);

  async function updateUser(user: DirectoryUser, disabled: boolean) {
    if (disabled && user.id === currentUserId) return;
    const operation = ++updateRevision.current;
    updateController.current?.abort();
    const controller = new AbortController();
    updateController.current = controller;
    setPendingId(user.id);
    setRowErrors((current) => {
      const next = { ...current };
      delete next[user.id];
      return next;
    });
    try {
      const updated = await setDirectoryUserDisabled(user.id, disabled, controller.signal);
      if (controller.signal.aborted || operation !== updateRevision.current) return;
      setDirectory((current) =>
        current
          ? { ...current, data: current.data.map((row) => row.id === updated.id ? updated : row) }
          : current,
      );
      setDisableTarget(null);
    } catch (reason: unknown) {
      if (!isAbort(reason) && operation === updateRevision.current) {
        setRowErrors((current) => ({ ...current, [user.id]: failure(reason).message }));
      }
    } finally {
      if (operation === updateRevision.current) {
        setPendingId(null);
        updateController.current = null;
      }
    }
  }

  const totalPages = Math.max(1, directory?.meta.total_pages ?? 1);

  return (
    <TooltipProvider>
      <AppShell
        mode="admin"
        activeView={view}
        onSelectView={(nextView) => setView(nextView === "scheduled-tasks" ? "scheduled-tasks" : "overview")}
      >
        {view === "scheduled-tasks" ? <ScheduledTasksPage mode="admin" /> : (
        <main className="h-full overflow-y-auto">
          <div className="mx-auto flex max-w-6xl flex-col gap-6 p-4 md:p-8">
            <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <h1 className="text-2xl font-semibold">{t("admin.title")}</h1>
                <p className="text-sm text-muted-foreground">{t("admin.description")}</p>
              </div>
              <Button variant="outline" asChild>
                <a href={logtoAdminEndpoint()} target="_blank" rel="noreferrer">
                  {t("admin.openLogto")}
                  <ExternalLink />
                </a>
              </Button>
            </header>

            <SystemOverview />

            <Card>
              <CardHeader>
                <CardTitle>{t("admin.directory.title")}</CardTitle>
                <CardDescription>{t("admin.directory.description")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{t("admin.directory.disableBoundary")}</p>
                {loading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 5 }, (_, index) => (
                      <Skeleton key={index} className="h-12 w-full" />
                    ))}
                  </div>
                ) : error ? (
                  <RequestError error={error} onRetry={() => setRevision((value) => value + 1)} />
                ) : directory?.data.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    {t("admin.directory.empty")}
                  </p>
                ) : directory ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("admin.directory.user")}</TableHead>
                        <TableHead>{t("admin.directory.email")}</TableHead>
                        <TableHead>{t("admin.directory.status")}</TableHead>
                        <TableHead className="text-right">{t("admin.directory.action")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {directory.data.map((user) => {
                        const isCurrent = user.id === currentUserId;
                        const isPending = pendingId === user.id;
                        return (
                          <TableRow key={user.id}>
                            <TableCell>
                              <div className="font-medium">{user.name || user.email || user.id}</div>
                              <div className="max-w-64 truncate text-xs text-muted-foreground">{user.id}</div>
                            </TableCell>
                            <TableCell>{user.email || "—"}</TableCell>
                            <TableCell>
                              <Badge variant={user.disabled ? "destructive" : "secondary"}>
                                {user.disabled ? t("admin.directory.disabled") : user.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex flex-col items-end gap-1">
                                {isCurrent && !user.disabled ? (
                                  <span className="text-xs text-muted-foreground">
                                    {t("admin.directory.currentUser")}
                                  </span>
                                ) : (
                                  <Button
                                    variant={user.disabled ? "outline" : "destructive"}
                                    size="sm"
                                    disabled={pendingId !== null}
                                    onClick={() => {
                                      if (user.disabled) void updateUser(user, false);
                                      else setDisableTarget(user);
                                    }}
                                  >
                                    {isPending && <Loader2 className="animate-spin" />}
                                    {isPending
                                      ? t("admin.directory.saving")
                                      : user.disabled
                                        ? t("admin.directory.enable")
                                        : t("admin.directory.disable")}
                                  </Button>
                                )}
                                {rowErrors[user.id] && (
                                  <span className="max-w-56 whitespace-normal text-xs text-destructive">
                                    {rowErrors[user.id]}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                ) : null}

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-sm text-muted-foreground">
                    {t("admin.directory.page", {
                      page: directory?.meta.page ?? page,
                      total: totalPages,
                      count: directory?.meta.total_count ?? 0,
                    })}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={loading || page <= 1 || pendingId !== null}
                      onClick={() => setPage((value) => value - 1)}
                    >
                      <ChevronLeft />
                      {t("admin.directory.previous")}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={loading || page >= totalPages || pendingId !== null}
                      onClick={() => setPage((value) => value + 1)}
                    >
                      {t("admin.directory.next")}
                      <ChevronRight />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
        )}
      </AppShell>

      <Dialog
        open={disableTarget !== null}
        onOpenChange={(open) => {
          if (!open && pendingId === null) setDisableTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("admin.directory.confirmTitle")}</DialogTitle>
            <DialogDescription>
              {t("admin.directory.confirmDescription", {
                user: disableTarget?.name || disableTarget?.email || disableTarget?.id || "",
              })}
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{t("admin.directory.disableBoundary")}</p>
          {disableTarget && rowErrors[disableTarget.id] && (
            <p role="alert" className="text-sm text-destructive">
              {rowErrors[disableTarget.id]}
            </p>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={pendingId !== null}>
                {t("admin.directory.cancel")}
              </Button>
            </DialogClose>
            <Button
              variant="destructive"
              disabled={pendingId !== null || disableTarget === null}
              onClick={() => {
                if (disableTarget) void updateUser(disableTarget, true);
              }}
            >
              {pendingId !== null && <Loader2 className="animate-spin" />}
              {pendingId !== null ? t("admin.directory.saving") : t("admin.directory.confirmDisable")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
