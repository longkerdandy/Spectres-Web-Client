import { runtimeRequest } from "@/lib/runtime-api";

export interface RuntimeInfo {
  name: string;
  os_version: string;
  agno_version: string;
  auth_mode: string;
  user_isolation: boolean;
}

export interface DirectoryUser {
  id: string;
  name: string | null;
  email: string | null;
  status: string;
  disabled: boolean;
}

export interface DirectoryPage {
  data: DirectoryUser[];
  meta: {
    page: number;
    limit: number;
    total_pages: number;
    total_count: number;
  };
}

export function getRuntimeInfo(signal?: AbortSignal): Promise<RuntimeInfo> {
  return runtimeRequest<RuntimeInfo>("/info", { signal });
}

export function getDirectoryUsers(
  page: number,
  signal?: AbortSignal,
): Promise<DirectoryPage> {
  const params = new URLSearchParams({
    include_disabled: "true",
    page: String(page),
    limit: "20",
  });
  return runtimeRequest<DirectoryPage>(`/users?${params.toString()}`, { signal });
}

export function setDirectoryUserDisabled(
  userId: string,
  disabled: boolean,
  signal?: AbortSignal,
): Promise<DirectoryUser> {
  return runtimeRequest<DirectoryUser>(`/users/${encodeURIComponent(userId)}`, {
    method: "PATCH",
    body: JSON.stringify({ disabled }),
    signal,
  });
}
