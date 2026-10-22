import { HttpAgent } from "@ag-ui/client";
import { accessToken } from "./auth";

export const AGENT_ID = "default";

const DEFAULT_ENDPOINT = "http://localhost:7777/agui";

export function agentEndpoint(): string {
  return import.meta.env.VITE_AGENT_ENDPOINT ?? DEFAULT_ENDPOINT;
}

async function authenticatedFetch(
  url: string,
  requestInit: RequestInit,
): Promise<Response> {
  const headers = new Headers(requestInit.headers);
  const token = await accessToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return fetch(url, { ...requestInit, headers });
}

export function createAgent(threadId: string): HttpAgent {
  return new HttpAgent({
    url: agentEndpoint(),
    threadId,
    fetch: authenticatedFetch,
  });
}
