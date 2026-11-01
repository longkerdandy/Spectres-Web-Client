import { accessToken, requireReauth } from "@/auth";

const DEFAULT_AGENT_ENDPOINT = "http://localhost:7777/agui";

export function agentEndpoint(): string {
  return import.meta.env.VITE_AGENT_ENDPOINT ?? DEFAULT_AGENT_ENDPOINT;
}

export const runtimeBaseUrl = agentEndpoint().replace(/\/agui\/?$/, "");

export class RuntimeApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.name = "RuntimeApiError";
    this.status = status;
    this.body = body;
  }
}

function errorMessage(status: number, body: unknown): string {
  const fallback = `Request failed with status ${status}`;
  if (!body || typeof body !== "object" || !("detail" in body)) return fallback;
  const detail = (body as { detail: unknown }).detail;
  if (typeof detail === "string") return detail;
  if (!Array.isArray(detail)) return fallback;
  const messages = detail.flatMap((item) =>
    item && typeof item === "object" && "msg" in item &&
    typeof (item as { msg: unknown }).msg === "string"
      ? [(item as { msg: string }).msg]
      : [],
  );
  return messages.length > 0 ? messages.join("; ") : fallback;
}

export async function runtimeRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const token = await accessToken();
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${runtimeBaseUrl}${path}`, { ...init, headers });
  if (response.status === 401) {
    requireReauth();
    throw new RuntimeApiError(response.status, "Authentication required");
  }
  if (!response.ok) {
    const body: unknown = await response.json().catch(() => undefined);
    throw new RuntimeApiError(
      response.status,
      errorMessage(response.status, body),
      body,
    );
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}
