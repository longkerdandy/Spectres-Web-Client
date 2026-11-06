import { useEffect, useRef, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import {
  createSchedule,
  getWorkflows,
  updateSchedule,
  type Schedule,
  type ScheduleCreateInput,
  type ScheduleMethod,
  type ScheduleUpdateInput,
  type WorkflowSummary,
} from "@/scheduled-tasks-api";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RuntimeApiError } from "@/lib/runtime-api";

const RECOMPUTE_ENDPOINT = "/workflows/etf_grid_recompute/runs";
const DEFAULT_PAYLOAD = { message: "Run scheduled ETF Grid recompute" };
const TIMEZONES = [
  "UTC",
  "Asia/Shanghai",
  "Asia/Hong_Kong",
  "Asia/Taipei",
  "Asia/Tokyo",
  "Asia/Singapore",
  "Europe/London",
  "Europe/Paris",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
];
const FIELD_NAMES = [
  "name",
  "description",
  "cron_expr",
  "endpoint",
  "payload",
  "timezone",
  "timeout_seconds",
  "max_retries",
  "retry_delay_seconds",
] as const;

type FieldName = (typeof FIELD_NAMES)[number];
type FieldErrors = Partial<Record<FieldName, string>>;

interface FormState {
  name: string;
  description: string;
  cron_expr: string;
  endpoint: string;
  method: ScheduleMethod;
  payload: string;
  timezone: string;
  timeout_seconds: string;
  max_retries: string;
  retry_delay_seconds: string;
}

interface FormError {
  message: string;
  status?: number;
}

interface WorkflowTarget {
  id: string;
  name: string;
  description: string;
  target: string;
  method: ScheduleMethod;
}

function initialForm(schedule?: Schedule): FormState {
  return {
    name: schedule?.name ?? "",
    description: schedule?.description ?? "",
    cron_expr: schedule?.cron_expr ?? "",
    endpoint: schedule?.endpoint ?? "",
    method: (schedule?.method as ScheduleMethod | undefined) ?? "POST",
    payload: schedule
      ? schedule.payload === null
        ? ""
        : JSON.stringify(schedule.payload, null, 2)
      : JSON.stringify(DEFAULT_PAYLOAD, null, 2),
    timezone: schedule?.timezone ?? "UTC",
    timeout_seconds: String(schedule?.timeout_seconds ?? 3600),
    max_retries: String(schedule?.max_retries ?? 0),
    retry_delay_seconds: String(schedule?.retry_delay_seconds ?? 60),
  };
}

function isAbort(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

function parsePayload(value: string): Record<string, unknown> | null {
  if (!value.trim()) return null;
  const parsed: unknown = JSON.parse(value);
  if (parsed === null) return null;
  if (typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Payload must be a JSON object or null");
  }
  return parsed as Record<string, unknown>;
}

function sameJson(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function toWorkflowTarget(workflow: WorkflowSummary): WorkflowTarget | null {
  if (!workflow.id) return null;
  return {
    id: workflow.id,
    name: workflow.name ?? workflow.id,
    description: workflow.description ?? "",
    target: `/workflows/${encodeURIComponent(workflow.id)}/runs`,
    method: "POST",
  };
}

function targetValue(target: Pick<WorkflowTarget, "method" | "target">): string {
  return `${target.method} ${target.target}`;
}

export default function ScheduleFormDialog({
  mode,
  schedule,
  onClose,
  onSaved,
}: {
  mode: "user" | "admin";
  schedule?: Schedule;
  onClose: () => void;
  onSaved: (schedule: Schedule) => void;
}) {
  const { t } = useTranslation("common");
  const [form, setForm] = useState<FormState>(() => initialForm(schedule));
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<FormError | null>(null);
  const [workflowTargets, setWorkflowTargets] = useState<WorkflowTarget[]>([]);
  const [targetsLoading, setTargetsLoading] = useState(true);
  const [targetsError, setTargetsError] = useState<FormError | null>(null);
  const [targetsRevision, setTargetsRevision] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);
  const editing = schedule !== undefined;

  useEffect(() => () => controllerRef.current?.abort(), []);

  useEffect(() => {
    const controller = new AbortController();
    setTargetsLoading(true);
    setTargetsError(null);
    void getWorkflows(controller.signal)
      .then((workflows) => {
        if (controller.signal.aborted) return;
        const result = workflows.flatMap((workflow) => {
          const target = toWorkflowTarget(workflow);
          return target ? [target] : [];
        });
        setWorkflowTargets(result);
        if (!editing) {
          setForm((current) => {
            if (current.endpoint) return current;
            const target = result.find((item) => item.target === RECOMPUTE_ENDPOINT) ?? result[0];
            return target ? { ...current, endpoint: target.target, method: target.method } : current;
          });
        }
      })
      .catch((reason: unknown) => {
        if (!isAbort(reason) && !controller.signal.aborted) {
          setTargetsError({
            message: reason instanceof Error ? reason.message : String(reason),
            status: reason instanceof RuntimeApiError ? reason.status : undefined,
          });
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setTargetsLoading(false);
      });
    return () => controller.abort();
  }, [editing, targetsRevision]);

  function update<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
    if (field !== "method") {
      setFieldErrors((current) => ({ ...current, [field]: undefined }));
    }
    setFormError(null);
  }

  function selectTarget(value: string) {
    const target = workflowTargets.find((item) => targetValue(item) === value);
    if (!target) return;
    setForm((current) => ({ ...current, endpoint: target.target, method: target.method }));
    setFieldErrors((current) => ({ ...current, endpoint: undefined }));
    setFormError(null);
  }

  function validate(): { errors: FieldErrors; payload: Record<string, unknown> | null } {
    const errors: FieldErrors = {};
    if (!form.name.trim()) errors.name = t("scheduledTasks.form.errors.nameRequired");
    else if (!/^[a-zA-Z0-9][a-zA-Z0-9 ._-]*$/.test(form.name.trim())) {
      errors.name = t("scheduledTasks.form.errors.nameInvalid");
    } else if (form.name.trim().length > 255) errors.name = t("scheduledTasks.form.errors.nameLength");
    if (form.description.length > 1024) errors.description = t("scheduledTasks.form.errors.descriptionLength");
    if (!form.cron_expr.trim()) errors.cron_expr = t("scheduledTasks.form.errors.cronRequired");
    else if (form.cron_expr.trim().length > 128) errors.cron_expr = t("scheduledTasks.form.errors.cronLength");
    if (!form.endpoint.trim()) errors.endpoint = t("scheduledTasks.form.errors.endpointRequired");
    else if (!form.endpoint.trim().startsWith("/") || form.endpoint.trim().includes("://")) {
      errors.endpoint = t("scheduledTasks.form.errors.endpointInvalid");
    } else if (form.endpoint.trim().length > 512) errors.endpoint = t("scheduledTasks.form.errors.endpointLength");
    if (!form.timezone.trim()) errors.timezone = t("scheduledTasks.form.errors.timezoneRequired");
    else if (form.timezone.trim().length > 64) errors.timezone = t("scheduledTasks.form.errors.timezoneLength");

    const numericRules = [
      { field: "timeout_seconds", value: form.timeout_seconds, min: 1, max: 86400 },
      { field: "max_retries", value: form.max_retries, min: 0, max: 10 },
      { field: "retry_delay_seconds", value: form.retry_delay_seconds, min: 1, max: 3600 },
    ] as const;
    for (const rule of numericRules) {
      const value = Number(rule.value);
      if (!/^\d+$/.test(rule.value.trim()) || !Number.isInteger(value) || value < rule.min || value > rule.max) {
        errors[rule.field] = t("scheduledTasks.form.errors.integerRange", { min: rule.min, max: rule.max });
      }
    }

    let payload: Record<string, unknown> | null = null;
    try {
      payload = parsePayload(form.payload);
    } catch {
      errors.payload = t("scheduledTasks.form.errors.payloadInvalid");
    }
    return { errors, payload };
  }

  function applyServerError(error: unknown) {
    if (!(error instanceof RuntimeApiError)) {
      setFormError({ message: error instanceof Error ? error.message : String(error) });
      return;
    }
    const nextFields: FieldErrors = {};
    const remaining: string[] = [];
    if (error.status === 422 && error.body && typeof error.body === "object" && "detail" in error.body) {
      const detail = (error.body as { detail: unknown }).detail;
      if (Array.isArray(detail)) {
        for (const item of detail) {
          if (!item || typeof item !== "object" || !("msg" in item) || typeof item.msg !== "string") continue;
          const location = "loc" in item && Array.isArray(item.loc) ? item.loc : [];
          const field = location[location.length - 1];
          if (typeof field === "string" && FIELD_NAMES.includes(field as FieldName)) {
            nextFields[field as FieldName] = item.msg;
          } else {
            remaining.push(item.msg);
          }
        }
      }
    }
    setFieldErrors(nextFields);
    setFormError(remaining.length > 0 || Object.keys(nextFields).length === 0
      ? { message: remaining.length > 0 ? remaining.join("; ") : error.message, status: error.status }
      : null);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (submitting || targetsLoading) return;
    const { errors, payload } = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setFormError(null);
      return;
    }

    const common = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      cron_expr: form.cron_expr.trim(),
      payload,
      timezone: form.timezone.trim(),
      timeout_seconds: Number(form.timeout_seconds),
      max_retries: Number(form.max_retries),
      retry_delay_seconds: Number(form.retry_delay_seconds),
    };
    const controller = new AbortController();
    controllerRef.current = controller;
    setSubmitting(true);
    setFieldErrors({});
    setFormError(null);
    try {
      if (!schedule) {
        const input: ScheduleCreateInput = {
          ...common,
          endpoint: form.endpoint.trim(),
          method: form.method,
        };
        const created = await createSchedule(input, controller.signal);
        if (!controller.signal.aborted) onSaved(created);
        return;
      }

      const input: ScheduleUpdateInput = {};
      if (common.name !== schedule.name) input.name = common.name;
      if (common.description !== schedule.description) input.description = common.description;
      if (common.cron_expr !== schedule.cron_expr) input.cron_expr = common.cron_expr;
      if (!sameJson(common.payload, schedule.payload)) input.payload = common.payload;
      if (common.timezone !== schedule.timezone) input.timezone = common.timezone;
      if (common.timeout_seconds !== schedule.timeout_seconds) input.timeout_seconds = common.timeout_seconds;
      if (common.max_retries !== schedule.max_retries) input.max_retries = common.max_retries;
      if (common.retry_delay_seconds !== schedule.retry_delay_seconds) input.retry_delay_seconds = common.retry_delay_seconds;
      if (form.endpoint.trim() !== schedule.endpoint) input.endpoint = form.endpoint.trim();
      if (form.method !== schedule.method) input.method = form.method;
      if (Object.keys(input).length === 0) {
        onClose();
        return;
      }
      const updated = await updateSchedule(schedule.id, input, controller.signal);
      if (!controller.signal.aborted) onSaved(updated);
    } catch (error) {
      if (!isAbort(error) && !controller.signal.aborted) applyServerError(error);
    } finally {
      if (!controller.signal.aborted) setSubmitting(false);
      if (controllerRef.current === controller) controllerRef.current = null;
    }
  }

  function errorTitle(): string {
    if (formError?.status === 403) return t("scheduledTasks.mutationErrors.forbidden");
    if (formError?.status === 404) return t("scheduledTasks.mutationErrors.notFound");
    if (formError?.status === 409) return t("scheduledTasks.mutationErrors.conflict");
    if (formError?.status === 422) return t("scheduledTasks.mutationErrors.validation");
    if (formError?.status === 503) return t("scheduledTasks.mutationErrors.unavailable");
    return t("scheduledTasks.errors.request");
  }

  function fieldError(field: FieldName) {
    return fieldErrors[field] ? <p className="mt-1 text-xs text-destructive">{fieldErrors[field]}</p> : null;
  }

  const labelClass = "text-xs font-medium text-muted-foreground";
  const inputClass = "mt-1.5";
  const textareaClass = "mt-1.5 w-full min-w-0 resize-y rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30";
  const selectedTargetValue = form.endpoint ? `${form.method} ${form.endpoint}` : "";
  const currentTarget: WorkflowTarget | null = schedule && form.endpoint &&
    !workflowTargets.some((target) => targetValue(target) === selectedTargetValue)
    ? {
        id: schedule.target_id ?? "current",
        name: t("scheduledTasks.form.currentTarget"),
        description: "",
        target: form.endpoint,
        method: form.method,
      }
    : null;
  const targetOptions = currentTarget ? [currentTarget, ...workflowTargets] : workflowTargets;
  const selectedTarget = targetOptions.find((target) => targetValue(target) === selectedTargetValue);

  return (
    <Dialog open onOpenChange={(open) => { if (!open && !submitting) onClose(); }}>
      <DialogContent
        className="max-h-[92vh] overflow-y-auto sm:max-w-2xl"
        showCloseButton={!submitting}
        onEscapeKeyDown={(event) => { if (submitting) event.preventDefault(); }}
        onPointerDownOutside={(event) => { if (submitting) event.preventDefault(); }}
      >
        <DialogHeader>
          <DialogTitle>{t(editing ? "scheduledTasks.form.editTitle" : "scheduledTasks.form.createTitle")}</DialogTitle>
          <DialogDescription className={editing ? "sr-only" : undefined}>
            {t(editing
              ? "scheduledTasks.form.editDescription"
              : mode === "admin"
                ? "scheduledTasks.form.adminDescription"
                : "scheduledTasks.form.userDescription")}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={(event) => void submit(event)} noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className={labelClass}>{t("scheduledTasks.form.name")}</span>
              <Input
                className={inputClass}
                value={form.name}
                onChange={(event) => update("name", event.target.value)}
                aria-invalid={Boolean(fieldErrors.name)}
                disabled={submitting}
                autoFocus
              />
              {fieldError("name")}
            </label>
            <label className="block sm:col-span-2">
              <span className={labelClass}>{t("scheduledTasks.form.description")}</span>
              <textarea
                className={textareaClass}
                rows={2}
                value={form.description}
                onChange={(event) => update("description", event.target.value)}
                aria-invalid={Boolean(fieldErrors.description)}
                disabled={submitting}
              />
              {fieldError("description")}
            </label>
            <label className="block">
              <span className={labelClass}>{t("scheduledTasks.form.cron")}</span>
              <Input
                className={`${inputClass} font-mono text-xs`}
                value={form.cron_expr}
                onChange={(event) => update("cron_expr", event.target.value)}
                placeholder="0 10 * * 1-5"
                aria-invalid={Boolean(fieldErrors.cron_expr)}
                disabled={submitting}
              />
              <p className="mt-1 text-xs text-muted-foreground">{t("scheduledTasks.form.cronHint")}</p>
              {fieldError("cron_expr")}
            </label>
            <label className="block">
              <span className={labelClass}>{t("scheduledTasks.form.timezone")}</span>
              <Select
                value={form.timezone}
                onValueChange={(value) => update("timezone", value)}
                disabled={submitting}
              >
                <SelectTrigger
                  className={`${inputClass} w-full`}
                  aria-label={t("scheduledTasks.form.timezone")}
                  aria-invalid={Boolean(fieldErrors.timezone)}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(TIMEZONES.includes(form.timezone) ? TIMEZONES : [form.timezone, ...TIMEZONES]).map((timezone) => (
                    <SelectItem key={timezone} value={timezone}>{timezone}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldError("timezone")}
            </label>

            <div className="sm:col-span-2">
              <span className={labelClass}>{t("scheduledTasks.form.target")}</span>
              <Select
                value={selectedTargetValue}
                onValueChange={selectTarget}
                disabled={submitting || targetsLoading || Boolean(targetsError) || targetOptions.length === 0}
              >
                <SelectTrigger
                  className={`${inputClass} w-full`}
                  aria-label={t("scheduledTasks.form.target")}
                  aria-invalid={Boolean(fieldErrors.endpoint)}
                >
                  <SelectValue
                    placeholder={t(targetsLoading
                      ? "scheduledTasks.form.targetLoading"
                      : "scheduledTasks.form.targetPlaceholder")}
                  />
                </SelectTrigger>
                <SelectContent>
                  {targetOptions.map((target) => (
                    <SelectItem key={targetValue(target)} value={targetValue(target)}>
                      {target.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedTarget?.description && (
                <p className="mt-1 text-xs text-muted-foreground">{selectedTarget.description}</p>
              )}
              {selectedTarget && (
                <p className="mt-1 font-mono text-xs break-all text-muted-foreground">
                  {selectedTarget.method} {selectedTarget.target}
                </p>
              )}
              {!targetsLoading && !targetsError && targetOptions.length === 0 && (
                <p className="mt-1 text-xs text-muted-foreground">{t("scheduledTasks.form.targetEmpty")}</p>
              )}
              {targetsError && (
                <Alert variant="destructive" className="mt-2">
                  <AlertTitle>{t("scheduledTasks.form.targetLoadError")}</AlertTitle>
                  <AlertDescription className="break-words">
                    <p>{targetsError.message}</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => setTargetsRevision((value) => value + 1)}
                    >
                      {t("scheduledTasks.retry")}
                    </Button>
                  </AlertDescription>
                </Alert>
              )}
              {fieldError("endpoint")}
            </div>

            <label className="block sm:col-span-2">
              <span className={labelClass}>{t("scheduledTasks.form.payload")}</span>
              <textarea
                className={`${textareaClass} min-h-28 font-mono text-xs`}
                rows={6}
                value={form.payload}
                onChange={(event) => update("payload", event.target.value)}
                placeholder={t("scheduledTasks.form.payloadPlaceholder")}
                aria-invalid={Boolean(fieldErrors.payload)}
                disabled={submitting}
              />
              {fieldError("payload")}
            </label>
            <label className="block">
              <span className={labelClass}>{t("scheduledTasks.form.timeout")}</span>
              <Input
                className={inputClass}
                type="number"
                min={1}
                max={86400}
                step={1}
                value={form.timeout_seconds}
                onChange={(event) => update("timeout_seconds", event.target.value)}
                aria-invalid={Boolean(fieldErrors.timeout_seconds)}
                disabled={submitting}
              />
              {fieldError("timeout_seconds")}
            </label>
            <label className="block">
              <span className={labelClass}>{t("scheduledTasks.form.maxRetries")}</span>
              <Input
                className={inputClass}
                type="number"
                min={0}
                max={10}
                step={1}
                value={form.max_retries}
                onChange={(event) => update("max_retries", event.target.value)}
                aria-invalid={Boolean(fieldErrors.max_retries)}
                disabled={submitting}
              />
              {fieldError("max_retries")}
            </label>
            <label className="block">
              <span className={labelClass}>{t("scheduledTasks.form.retryDelay")}</span>
              <Input
                className={inputClass}
                type="number"
                min={1}
                max={3600}
                step={1}
                value={form.retry_delay_seconds}
                onChange={(event) => update("retry_delay_seconds", event.target.value)}
                aria-invalid={Boolean(fieldErrors.retry_delay_seconds)}
                disabled={submitting}
              />
              {fieldError("retry_delay_seconds")}
            </label>
          </div>

          {schedule?.user_id === null && mode === "admin" && (
            <Alert className="mt-4">
              <AlertTitle>{t("scheduledTasks.form.systemSchedule")}</AlertTitle>
              <AlertDescription>{t("scheduledTasks.form.systemScheduleDescription")}</AlertDescription>
            </Alert>
          )}
          {formError && (
            <Alert variant="destructive" className="mt-4">
              <AlertTitle>{errorTitle()}</AlertTitle>
              <AlertDescription className="break-words">{formError.message}</AlertDescription>
            </Alert>
          )}
          <DialogFooter className="mt-5">
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              {t("scheduledTasks.form.cancel")}
            </Button>
            <Button type="submit" disabled={submitting || targetsLoading || !form.endpoint}>
              {submitting && <Loader2 className="animate-spin" />}
              {submitting
                ? t("scheduledTasks.form.saving")
                : t(editing ? "scheduledTasks.form.save" : "scheduledTasks.form.create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
