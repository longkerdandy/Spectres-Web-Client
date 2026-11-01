import type { LogtoConfig } from "@logto/react";

const DEFAULT_LOGTO_ENDPOINT = "http://localhost:3001";
const DEFAULT_LOGTO_APP_ID = "20vb1euxbpw6m8nqdgkxs";
const DEFAULT_LOGTO_API_RESOURCE = "https://spectres.runtime/api";
const DEFAULT_LOGTO_ADMIN_ENDPOINT = "http://localhost:3002";

export function logtoEndpoint(): string {
  return import.meta.env.VITE_LOGTO_ENDPOINT ?? DEFAULT_LOGTO_ENDPOINT;
}

export function logtoAppId(): string {
  return import.meta.env.VITE_LOGTO_APP_ID ?? DEFAULT_LOGTO_APP_ID;
}

export function logtoApiResource(): string {
  return import.meta.env.VITE_LOGTO_API_RESOURCE ?? DEFAULT_LOGTO_API_RESOURCE;
}

export function logtoAdminEndpoint(): string {
  return import.meta.env.VITE_LOGTO_ADMIN_ENDPOINT ?? DEFAULT_LOGTO_ADMIN_ENDPOINT;
}

export const logtoConfig: LogtoConfig = {
  endpoint: logtoEndpoint(),
  appId: logtoAppId(),
  scopes: ["openid", "profile"],
  resources: [logtoApiResource()],
};

export function signInRedirectUri(): string {
  return `${window.location.origin}/callback`;
}

export function postLogoutRedirectUri(): string {
  return window.location.origin;
}

export interface AccessTokenClaims {
  scopes: string[];
  sub: string | null;
}

export function decodeAccessToken(token: string): AccessTokenClaims {
  const fallback: AccessTokenClaims = { scopes: [], sub: null };
  try {
    const encodedPayload = token.split(".")[1];
    if (!encodedPayload) return fallback;
    const base64 = encodedPayload.replace(/-/g, "+").replace(/_/g, "/");
    const payload: unknown = JSON.parse(
      atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "=")),
    );
    if (!payload || typeof payload !== "object") return fallback;
    const claims = payload as { scopes?: unknown; sub?: unknown };
    return {
      scopes: Array.isArray(claims.scopes)
        ? claims.scopes.filter((scope): scope is string => typeof scope === "string")
        : [],
      sub: typeof claims.sub === "string" ? claims.sub : null,
    };
  } catch {
    return fallback;
  }
}

type TokenGetter = () => Promise<string | null>;

let tokenGetter: TokenGetter = () => Promise.resolve(null);
let onAuthRequired: () => void = () => undefined;

export function registerAuthHandlers(
  getter: TokenGetter,
  authRequired: () => void,
): void {
  tokenGetter = getter;
  onAuthRequired = authRequired;
}

export function requireReauth(): void {
  onAuthRequired();
}

export async function accessToken(): Promise<string | null> {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const token = await tokenGetter().catch(() => null);
    if (token) return token;
  }
  onAuthRequired();
  return null;
}
