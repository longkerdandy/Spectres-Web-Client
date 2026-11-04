import { Fragment, useEffect, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, RefreshCw } from "lucide-react";
import {
  getSchedule,
  getScheduleRun,
  getScheduleRuns,
  getSchedules,
  type Schedule,
  type SchedulePage,
  type ScheduleRun,
} from "@/scheduled-tasks-api";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RuntimeApiError } from "@/lib/runtime-api";

type EnabledFilter = "all" | "enabled" | "disabled";

interface RequestFailure {
  message: string;
  status?: number;
}

function isAbort(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

function failure(error: unknown): RequestFailure {
  return {
    message: error instanceof Error ? error.message : String(error),
    status: error instanceof RuntimeApiError ? error.status : undefined,
  };
}

function formatTimestamp(value: number | null, timezone?: string): string {
  if (value === null) return "—";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: timezone,
  }).format(new Date(value * 1000));
}

function formatDuration(run: ScheduleRun): string {
  if (run.triggered_at === null || run.completed_at === null) return "—";
  const seconds = run.completed_at - run.triggered_at;
  if (seconds < 0) return "—";
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}m ${remainder}s`;
}

function RequestError({ error, onRetry }: { error: RequestFailure; onRetry: () => void }) {
  const { t } = useTranslation("common");
  const forbidden = error.status === 403;
  const notFound = error.status === 404;
  return (
    <Alert variant="destructive">
      <AlertTitle>
        {forbidden
          ? t("scheduledTasks.errors.forbidden")
          : notFound
            ? t("scheduledTasks.errors.notFound")
            : t("scheduledTasks.errors.request")}
      </AlertTitle>
      <AlertDescription>
        <p>
          {forbidden
            ? t("scheduledTasks.errors.forbiddenDescription")
            : notFound
              ? t("scheduledTasks.errors.notFoundDescription")
              : error.message}
        </p>
        {!forbidden && (
          <Button variant="outline" size="sm" className="mt-3" onClick={onRetry}>
            {t("scheduledTasks.retry")}
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}

function PaginationControls({
  noun,
  page,
  totalPages,
  totalCount,
  loading,
  onPageChange,
}: {
  noun: "tasks" | "runs";
  page: number;
  totalPages: number;
  totalCount: number;
  loading: boolean;
  onPageChange: (page: number) => void;
}) {
  const { t } = useTranslation("common");
  const displayedTotal = Math.max(1, totalPages);
  return (
    <div className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-xs text-muted-foreground">
        {t(`scheduledTasks.pagination.${noun}`, {
          page,
          total: displayedTotal,
          count: totalCount,
        })}
      </span>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={loading || page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft />
          {t("scheduledTasks.previous")}
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={loading || totalPages === 0 || page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          {t("scheduledTasks.next")}
          <ChevronRight />
        </Button>
      </div>
    </div>
  );
}

function JsonBlock({ label, value }: { label: string; value: unknown }) {
  const { t } = useTranslation("common");
  return (
    <div className="space-y-2">
      <h4 className="text-xs font-medium text-muted-foreground">{label}</h4>
      {value === null || value === undefined ? (
        <p className="text-sm text-muted-foreground">{t("scheduledTasks.notRecorded")}</p>
      ) : (
        <pre className="max-w-full overflow-x-auto rounded-lg border bg-background p-3 text-xs whitespace-pre-wrap break-all text-muted-foreground">
          {JSON.stringify(value, null, 2)}
        </pre>
      )}
    </div>
  );
}

function DetailItem({
  label,
  children,
  full = false,
  mono = false,
}: {
  label: string;
  children: ReactNode;
  full?: boolean;
  mono?: boolean;
}) {
  return (
    <div className={full ? "sm:col-span-2" : undefined}>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={`mt-1 text-sm break-words ${mono ? "font-mono text-xs" : ""}`}>{children}</dd>
    </div>
  );
}

function ScheduleDetails({ schedule, mode }: { schedule: Schedule; mode: "user" | "admin" }) {
  const { t } = useTranslation("common");
  const localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return (
    <div className="space-y-5">
      <section className="space-y-3">
        <h3 className="text-sm font-medium">{t("scheduledTasks.details.configuration")}</h3>
        <dl className="grid gap-x-5 gap-y-4 rounded-lg border p-4 sm:grid-cols-2">
          <DetailItem label={t("scheduledTasks.details.owner")}>
            {schedule.user_id
              ? mode === "admin"
                ? `${t("scheduledTasks.personal")} · ${schedule.user_id}`
                : t("scheduledTasks.personal")
              : t("scheduledTasks.system")}
          </DetailItem>
          <DetailItem label={t("scheduledTasks.details.nextRun")}>
            {formatTimestamp(schedule.next_run_at, schedule.timezone)}
            {schedule.next_run_at !== null && (
              <span className="block text-xs text-muted-foreground">{schedule.timezone}</span>
            )}
          </DetailItem>
          <DetailItem label={t("scheduledTasks.details.cron")} mono>
            {schedule.cron_expr}
          </DetailItem>
          <DetailItem label={t("scheduledTasks.details.timezone")}>{schedule.timezone}</DetailItem>
          <DetailItem label={t("scheduledTasks.details.target")} full mono>
            {schedule.method} {schedule.endpoint}
          </DetailItem>
          <DetailItem label={t("scheduledTasks.details.timeout")}>
            {t("scheduledTasks.details.seconds", { count: schedule.timeout_seconds })}
          </DetailItem>
          <DetailItem label={t("scheduledTasks.details.retries")}>
            {t("scheduledTasks.details.retryValue", {
              count: schedule.max_retries,
              delay: schedule.retry_delay_seconds,
            })}
          </DetailItem>
          <DetailItem label={t("scheduledTasks.details.created")}>
            {formatTimestamp(schedule.created_at, localTimezone)}
          </DetailItem>
          <DetailItem label={t("scheduledTasks.details.updated")}>
            {formatTimestamp(schedule.updated_at, localTimezone)}
          </DetailItem>
          {schedule.managed_by && (
            <DetailItem label={t("scheduledTasks.details.managedBy")}>{schedule.managed_by}</DetailItem>
          )}
          {schedule.target_type && (
            <DetailItem label={t("scheduledTasks.details.targetType")}>{schedule.target_type}</DetailItem>
          )}
          {schedule.target_id && (
            <DetailItem label={t("scheduledTasks.details.targetId")} full mono>
              {schedule.target_id}
            </DetailItem>
          )}
          {schedule.disabled_reason && (
            <DetailItem label={t("scheduledTasks.details.disabledReason")} full>
              {schedule.disabled_reason}
            </DetailItem>
          )}
        </dl>
      </section>
      <JsonBlock label={t("scheduledTasks.details.payload")} value={schedule.payload} />
    </div>
  );
}

function RunDetail({
  scheduleId,
  runId,
  refreshRevision,
}: {
  scheduleId: string;
  runId: string;
  refreshRevision: number;
}) {
  const { t } = useTranslation("common");
  const [run, setRun] = useState<ScheduleRun | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<RequestFailure | null>(null);
  const [revision, setRevision] = useState(0);
  const localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setRun(null);
    void getScheduleRun(scheduleId, runId, controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setRun(result);
      })
      .catch((reason: unknown) => {
        if (!isAbort(reason) && !controller.signal.aborted) setError(failure(reason));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [scheduleId, runId, refreshRevision, revision]);

  return (
    <div className="space-y-4 rounded-lg bg-muted/40 p-4">
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : error ? (
        <RequestError error={error} onRetry={() => setRevision((value) => value + 1)} />
      ) : run ? (
        <>
          <dl className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
            <DetailItem label={t("scheduledTasks.run.runId")} mono>{run.id}</DetailItem>
            <DetailItem label={t("scheduledTasks.run.attempt")}>{run.attempt}</DetailItem>
            <DetailItem label={t("scheduledTasks.run.triggeredAt")}>
              {formatTimestamp(run.triggered_at, localTimezone)}
            </DetailItem>
            <DetailItem label={t("scheduledTasks.run.completedAt")}>
              {formatTimestamp(run.completed_at, localTimezone)}
            </DetailItem>
            <DetailItem label={t("scheduledTasks.run.linkedRunId")} mono>{run.run_id ?? "—"}</DetailItem>
            <DetailItem label={t("scheduledTasks.run.sessionId")} mono>{run.session_id ?? "—"}</DetailItem>
          </dl>
          <p className="text-xs text-muted-foreground">
            {t("scheduledTasks.run.localTimes", { timezone: localTimezone })}
          </p>
          {run.error && (
            <Alert variant="destructive">
              <AlertTitle>{t("scheduledTasks.run.executionError")}</AlertTitle>
              <AlertDescription className="break-words">{run.error}</AlertDescription>
            </Alert>
          )}
          <JsonBlock label={t("scheduledTasks.run.input")} value={run.input} />
          <JsonBlock label={t("scheduledTasks.run.output")} value={run.output} />
          <JsonBlock label={t("scheduledTasks.run.requirements")} value={run.requirements} />
        </>
      ) : null}
    </div>
  );
}

function RunHistory({ scheduleId, refreshRevision }: { scheduleId: string; refreshRevision: number }) {
  const { t } = useTranslation("common");
  const [page, setPage] = useState(1);
  const [runsPage, setRunsPage] = useState<SchedulePage<ScheduleRun> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<RequestFailure | null>(null);
  const [revision, setRevision] = useState(0);
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null);
  const localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    void getScheduleRuns(scheduleId, { page, signal: controller.signal })
      .then((result) => {
        if (!controller.signal.aborted) setRunsPage(result);
      })
      .catch((reason: unknown) => {
        if (!isAbort(reason) && !controller.signal.aborted) setError(failure(reason));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [scheduleId, page, refreshRevision, revision]);

  function changePage(nextPage: number) {
    setExpandedRunId(null);
    setPage(nextPage);
  }

  function statusLabel(status: string): string {
    if (["success", "failed", "running", "pending"].includes(status)) {
      return t(`scheduledTasks.runStatus.${status}`);
    }
    return status;
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-medium">{t("scheduledTasks.runs.title")}</h3>
        <span className="text-xs text-muted-foreground">
          {t("scheduledTasks.runs.localTimes", { timezone: localTimezone })}
        </span>
      </div>
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }, (_, index) => <Skeleton key={index} className="h-12 w-full" />)}
        </div>
      ) : error ? (
        <RequestError error={error} onRetry={() => setRevision((value) => value + 1)} />
      ) : runsPage?.data.length === 0 ? (
        <div className="rounded-lg border py-8 text-center">
          <p className="text-sm font-medium">{t("scheduledTasks.runs.empty")}</p>
          <p className="mt-1 text-xs text-muted-foreground">{t("scheduledTasks.runs.emptyDescription")}</p>
        </div>
      ) : runsPage ? (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("scheduledTasks.runs.attempt")}</TableHead>
                <TableHead>{t("scheduledTasks.runs.status")}</TableHead>
                <TableHead>{t("scheduledTasks.runs.triggered")}</TableHead>
                <TableHead>{t("scheduledTasks.runs.http")}</TableHead>
                <TableHead className="w-10"><span className="sr-only">{t("scheduledTasks.runs.details")}</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {runsPage.data.map((run) => {
                const expanded = expandedRunId === run.id;
                return (
                  <Fragment key={run.id}>
                    <TableRow aria-expanded={expanded}>
                      <TableCell>#{run.attempt}</TableCell>
                      <TableCell>
                        <Badge variant={run.status === "failed" ? "destructive" : "secondary"}>
                          {statusLabel(run.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-normal">
                        {formatTimestamp(run.triggered_at, localTimezone)}
                        <span className="block text-xs text-muted-foreground">{formatDuration(run)}</span>
                      </TableCell>
                      <TableCell>{run.status_code ?? "—"}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={expanded ? t("scheduledTasks.runs.collapse") : t("scheduledTasks.runs.expand")}
                          onClick={() => setExpandedRunId(expanded ? null : run.id)}
                        >
                          {expanded ? <ChevronUp /> : <ChevronDown />}
                        </Button>
                      </TableCell>
                    </TableRow>
                    {expanded && (
                      <TableRow className="hover:bg-transparent">
                        <TableCell colSpan={5} className="whitespace-normal">
                          <RunDetail scheduleId={scheduleId} runId={run.id} refreshRevision={refreshRevision} />
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : null}
      <PaginationControls
        noun="runs"
        page={page}
        totalPages={runsPage?.meta.total_pages ?? 0}
        totalCount={runsPage?.meta.total_count ?? 0}
        loading={loading}
        onPageChange={changePage}
      />
    </section>
  );
}

function ScheduleDetailSheet({
  scheduleId,
  fallbackName,
  mode,
  refreshRevision,
  onClose,
  onListRefresh,
}: {
  scheduleId: string;
  fallbackName: string;
  mode: "user" | "admin";
  refreshRevision: number;
  onClose: () => void;
  onListRefresh: () => void;
}) {
  const { t } = useTranslation("common");
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<RequestFailure | null>(null);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setSchedule(null);
    void getSchedule(scheduleId, controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setSchedule(result);
      })
      .catch((reason: unknown) => {
        if (!isAbort(reason) && !controller.signal.aborted) setError(failure(reason));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [scheduleId, refreshRevision, revision]);

  return (
    <Sheet open onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent className="w-full gap-0 sm:max-w-2xl">
        <SheetHeader className="border-b pr-12">
          <div className="flex flex-wrap items-center gap-2">
            <SheetTitle className="break-words text-lg">{schedule?.name ?? fallbackName}</SheetTitle>
            {schedule && (
              <Badge variant="secondary">
                {schedule.enabled ? t("scheduledTasks.enabled") : t("scheduledTasks.disabled")}
              </Badge>
            )}
          </div>
          <SheetDescription className="break-words">
            {schedule?.description || t("scheduledTasks.noDescription")}
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 space-y-6 overflow-y-auto p-4">
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : error ? (
            <RequestError
              error={error}
              onRetry={() => {
                if (error.status === 404) {
                  onClose();
                  onListRefresh();
                } else {
                  setRevision((value) => value + 1);
                }
              }}
            />
          ) : schedule ? (
            <ScheduleDetails schedule={schedule} mode={mode} />
          ) : null}
          <RunHistory scheduleId={scheduleId} refreshRevision={refreshRevision} />
          <p className="text-xs text-muted-foreground">{t("scheduledTasks.readOnlyNote")}</p>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default function ScheduledTasksPage({ mode }: { mode: "user" | "admin" }) {
  const { t } = useTranslation("common");
  const [filter, setFilter] = useState<EnabledFilter>("all");
  const [page, setPage] = useState(1);
  const [schedulePage, setSchedulePage] = useState<SchedulePage<Schedule> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<RequestFailure | null>(null);
  const [revision, setRevision] = useState(0);
  const [selected, setSelected] = useState<{ id: string; name: string } | null>(null);
  const [detailRefreshRevision, setDetailRefreshRevision] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    void getSchedules({
      enabled: filter === "all" ? undefined : filter === "enabled",
      page,
      signal: controller.signal,
    })
      .then((result) => {
        if (!controller.signal.aborted) setSchedulePage(result);
      })
      .catch((reason: unknown) => {
        if (!isAbort(reason) && !controller.signal.aborted) setError(failure(reason));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [filter, page, revision]);

  function changeFilter(value: EnabledFilter) {
    setSelected(null);
    setPage(1);
    setFilter(value);
  }

  function changePage(nextPage: number) {
    setSelected(null);
    setPage(nextPage);
  }

  function refresh() {
    setRevision((value) => value + 1);
    if (selected) setDetailRefreshRevision((value) => value + 1);
  }

  return (
    <main className="h-full overflow-y-auto">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 p-4 md:p-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold">{t("scheduledTasks.title")}</h1>
            <p className="max-w-3xl text-sm text-muted-foreground">
              {t(mode === "admin" ? "scheduledTasks.adminDescription" : "scheduledTasks.userDescription")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{t("scheduledTasks.readOnly")}</Badge>
            <Button variant="outline" size="sm" disabled={loading} onClick={refresh}>
              <RefreshCw className={loading ? "animate-spin" : undefined} />
              {t("scheduledTasks.refresh")}
            </Button>
          </div>
        </header>

        <Card className="gap-0 py-0">
          <CardHeader className="flex-row items-center justify-between gap-4 border-b py-4">
            <div className="flex items-center gap-2">
              <CardTitle>{t("scheduledTasks.listTitle")}</CardTitle>
              <span className="text-xs text-muted-foreground">
                {t("scheduledTasks.total", { count: schedulePage?.meta.total_count ?? 0 })}
              </span>
            </div>
            <Select value={filter} onValueChange={(value) => changeFilter(value as EnabledFilter)}>
              <SelectTrigger size="sm" aria-label={t("scheduledTasks.filterLabel")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("scheduledTasks.filters.all")}</SelectItem>
                <SelectItem value="enabled">{t("scheduledTasks.filters.enabled")}</SelectItem>
                <SelectItem value="disabled">{t("scheduledTasks.filters.disabled")}</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="px-0">
            {loading ? (
              <div className="space-y-3 p-4">
                {Array.from({ length: 5 }, (_, index) => <Skeleton key={index} className="h-12 w-full" />)}
              </div>
            ) : error ? (
              <div className="p-4">
                <RequestError error={error} onRetry={() => setRevision((value) => value + 1)} />
              </div>
            ) : schedulePage?.data.length === 0 ? (
              <div className="px-4 py-12 text-center">
                <p className="text-sm font-medium">{t("scheduledTasks.empty")}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {filter === "all"
                    ? t(mode === "admin" ? "scheduledTasks.emptyAdmin" : "scheduledTasks.emptyUser")
                    : t("scheduledTasks.emptyFiltered")}
                </p>
              </div>
            ) : schedulePage ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-4">{t("scheduledTasks.columns.task")}</TableHead>
                    {mode === "admin" && <TableHead>{t("scheduledTasks.columns.owner")}</TableHead>}
                    <TableHead>{t("scheduledTasks.columns.schedule")}</TableHead>
                    <TableHead>{t("scheduledTasks.columns.nextRun")}</TableHead>
                    <TableHead className="pr-4">{t("scheduledTasks.columns.state")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schedulePage.data.map((schedule) => (
                    <TableRow key={schedule.id}>
                      <TableCell className="max-w-80 pl-4 whitespace-normal">
                        <button
                          type="button"
                          className="block w-full rounded-sm text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          onClick={() => setSelected({ id: schedule.id, name: schedule.name })}
                        >
                          <span className="font-medium hover:underline">{schedule.name}</span>
                          <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                            {schedule.description || t("scheduledTasks.noDescription")}
                          </span>
                        </button>
                      </TableCell>
                      {mode === "admin" && (
                        <TableCell>
                          <span className="block text-xs font-medium">
                            {schedule.user_id ? t("scheduledTasks.personal") : t("scheduledTasks.system")}
                          </span>
                          <span className="mt-0.5 block max-w-48 truncate text-xs text-muted-foreground" title={schedule.user_id ?? undefined}>
                            {schedule.user_id ?? t("scheduledTasks.systemVisibility")}
                          </span>
                        </TableCell>
                      )}
                      <TableCell>
                        <span className="font-mono text-xs">{schedule.cron_expr}</span>
                        <span className="block text-xs text-muted-foreground">{schedule.timezone}</span>
                      </TableCell>
                      <TableCell>
                        {formatTimestamp(schedule.next_run_at, schedule.timezone)}
                        {schedule.next_run_at !== null && (
                          <span className="block text-xs text-muted-foreground">{schedule.timezone}</span>
                        )}
                      </TableCell>
                      <TableCell className="pr-4">
                        <Badge variant="secondary">
                          {schedule.enabled ? t("scheduledTasks.enabled") : t("scheduledTasks.disabled")}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : null}
          </CardContent>
          <PaginationControls
            noun="tasks"
            page={page}
            totalPages={schedulePage?.meta.total_pages ?? 0}
            totalCount={schedulePage?.meta.total_count ?? 0}
            loading={loading}
            onPageChange={changePage}
          />
        </Card>
      </div>
      {selected && (
        <ScheduleDetailSheet
          key={selected.id}
          scheduleId={selected.id}
          fallbackName={selected.name}
          mode={mode}
          refreshRevision={detailRefreshRevision}
          onClose={() => setSelected(null)}
          onListRefresh={() => setRevision((value) => value + 1)}
        />
      )}
    </main>
  );
}
