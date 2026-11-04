import {
  RuntimeApiError,
  runtimeRequest,
} from "@/lib/runtime-api";
import type {
  ComputeSignalsResult,
  Page,
  SyncResult,
  SymbolStatus,
  Trade,
  TradeCreate,
  TradeFilters,
  ValidationErrorItem,
} from "./types";

/**
 * Typed fetch wrappers for the etf_grid extension REST API. The base URL
 * is derived from the same `VITE_AGENT_ENDPOINT` the AG-UI connection
 * uses (strip `/agui`, append the extension prefix) — no separate
 * configuration.
 */

const API_BASE = "/api/v1/extensions/etf-grid";

/** Request failure; `validation` carries the unified 422 `detail[]` items. */
export class ApiError extends Error {
  readonly status: number;
  readonly validation?: ValidationErrorItem[];

  constructor(status: number, message: string, validation?: ValidationErrorItem[]) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.validation = validation;
  }
}

/** Display string for an unknown thrown value (Error message or coercion). */
export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  try {
    return await runtimeRequest<T>(`${API_BASE}${path}`, init);
  } catch (error) {
    if (!(error instanceof RuntimeApiError)) throw error;
    const body = error.body;
    const validation =
      body && typeof body === "object" && "detail" in body &&
      Array.isArray((body as { detail: unknown }).detail)
        ? ((body as { detail: ValidationErrorItem[] }).detail)
        : undefined;
    throw new ApiError(error.status, error.message, validation);
  }
}

export function getStatus(signal?: AbortSignal): Promise<SymbolStatus[]> {
  return request("/status", { signal });
}

export function refreshData(signal?: AbortSignal): Promise<SyncResult> {
  return request("/sync", { method: "POST", signal });
}

export function computeSignals(signal?: AbortSignal): Promise<ComputeSignalsResult> {
  return request("/signals/compute", { method: "POST", signal });
}

export function getTrades(
  filters: TradeFilters,
  signal?: AbortSignal,
): Promise<Page<Trade>> {
  const params = new URLSearchParams();
  if (filters.symbol) params.set("symbol", filters.symbol);
  if (filters.start) params.set("start", filters.start);
  if (filters.end) params.set("end", filters.end);
  params.set("limit", String(filters.limit));
  params.set("offset", String(filters.offset));
  return request(`/trades?${params.toString()}`, { signal });
}

export function createTrade(body: TradeCreate): Promise<Trade> {
  return request("/trades", { method: "POST", body: JSON.stringify(body) });
}
