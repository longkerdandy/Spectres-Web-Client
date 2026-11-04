import { runtimeRequest } from "@/lib/runtime-api";

export interface Schedule {
  id: string;
  user_id: string | null;
  name: string;
  description: string | null;
  method: string;
  endpoint: string;
  payload: Record<string, unknown> | null;
  cron_expr: string;
  timezone: string;
  timeout_seconds: number;
  max_retries: number;
  retry_delay_seconds: number;
  enabled: boolean;
  next_run_at: number | null;
  managed_by: string | null;
  target_type: string | null;
  target_id: string | null;
  disabled_reason: string | null;
  created_at: number | null;
  updated_at: number | null;
}

export interface ScheduleRun {
  id: string;
  schedule_id: string;
  user_id: string | null;
  attempt: number;
  triggered_at: number | null;
  completed_at: number | null;
  status: string;
  status_code: number | null;
  run_id: string | null;
  session_id: string | null;
  error: string | null;
  input: Record<string, unknown> | null;
  output: Record<string, unknown> | null;
  requirements: Record<string, unknown>[] | null;
  created_at: number | null;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total_pages: number;
  total_count: number;
}

export interface SchedulePage<T> {
  data: T[];
  meta: PaginationMeta;
}

export function getSchedules({
  enabled,
  page = 1,
  limit = 20,
  signal,
}: {
  enabled?: boolean;
  page?: number;
  limit?: number;
  signal?: AbortSignal;
} = {}): Promise<SchedulePage<Schedule>> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (enabled !== undefined) params.set("enabled", String(enabled));
  return runtimeRequest<SchedulePage<Schedule>>(`/schedules?${params.toString()}`, { signal });
}

export function getSchedule(scheduleId: string, signal?: AbortSignal): Promise<Schedule> {
  return runtimeRequest<Schedule>(`/schedules/${encodeURIComponent(scheduleId)}`, { signal });
}

export function getScheduleRuns(
  scheduleId: string,
  { page = 1, limit = 10, signal }: { page?: number; limit?: number; signal?: AbortSignal } = {},
): Promise<SchedulePage<ScheduleRun>> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  return runtimeRequest<SchedulePage<ScheduleRun>>(
    `/schedules/${encodeURIComponent(scheduleId)}/runs?${params.toString()}`,
    { signal },
  );
}

export function getScheduleRun(
  scheduleId: string,
  runId: string,
  signal?: AbortSignal,
): Promise<ScheduleRun> {
  return runtimeRequest<ScheduleRun>(
    `/schedules/${encodeURIComponent(scheduleId)}/runs/${encodeURIComponent(runId)}`,
    { signal },
  );
}
