import { runtimeRequest } from "@/lib/runtime-api";

export interface Session {
  session_id: string;
  session_name?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface SessionPage {
  data: Session[];
  meta: {
    page: number;
    limit: number;
    total_pages: number;
    total_count: number;
  };
}

export interface SessionMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: unknown;
  created_at?: number;
}

export interface SessionDetail extends Session {
  chat_history?: SessionMessage[];
}

export function getSessions(options?: {
  page?: number;
  limit?: number;
  signal?: AbortSignal;
}): Promise<SessionPage> {
  const params = new URLSearchParams({
    type: "agent",
    component_id: "team-leader",
    page: String(options?.page ?? 1),
    limit: String(options?.limit ?? 20),
    sort_by: "updated_at",
    sort_order: "desc",
  });
  return runtimeRequest<SessionPage>(`/sessions?${params.toString()}`, {
    signal: options?.signal,
  });
}

export function getSession(
  sessionId: string,
  signal?: AbortSignal,
): Promise<SessionDetail> {
  return runtimeRequest<SessionDetail>(
    `/sessions/${encodeURIComponent(sessionId)}`,
    { signal },
  );
}

export function renameSession(
  sessionId: string,
  name: string,
  signal?: AbortSignal,
): Promise<Session> {
  return runtimeRequest<Session>(
    `/sessions/${encodeURIComponent(sessionId)}/rename`,
    {
      method: "POST",
      body: JSON.stringify({ session_name: name }),
      signal,
    },
  );
}

export function deleteSession(
  sessionId: string,
  signal?: AbortSignal,
): Promise<void> {
  return runtimeRequest<void>(
    `/sessions/${encodeURIComponent(sessionId)}`,
    {
      method: "DELETE",
      signal,
    },
  );
}
