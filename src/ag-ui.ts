import { HttpAgent } from "@ag-ui/client";
import { accessToken } from "./auth";
import { agentEndpoint } from "./lib/runtime-api";

export const AGENT_ID = "default";

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
