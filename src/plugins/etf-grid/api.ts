import { agentEndpoint } from "@/ag-ui";
import type {
  ComputeSignalsResult,
  Page,
  RefreshResult,
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

const API_BASE = `${agentEndpoint().replace(/\/agui\/?$/, "")}/api/v1/extensions/etf-grid`;

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
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    let validation: ValidationErrorItem[] | undefined;
    try {
      const body: unknown = await response.json();
      if (body && typeof body === "object" && "detail" in body) {
        const detail = (body as { detail: unknown }).detail;
        if (Array.isArray(detail)) {
          validation = detail as ValidationErrorItem[];
          message = validation.map((item) => item.msg).join("; ");
        } else if (typeof detail === "string") {
          message = detail;
        }
      }
    } catch {
      // Non-JSON error body — keep the status-based message.
    }
    throw new ApiError(response.status, message, validation);
  }
  return (await response.json()) as T;
}

export function getStatus(signal?: AbortSignal): Promise<SymbolStatus[]> {
  return request("/status", { signal });
}

export function refreshData(signal?: AbortSignal): Promise<RefreshResult> {
  return request("/refresh", { method: "POST", signal });
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
