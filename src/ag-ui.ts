import { HttpAgent } from "@ag-ui/client";

export const AGENT_ID = "default";

const DEFAULT_ENDPOINT = "http://localhost:7777/agui";

export function agentEndpoint(): string {
  return import.meta.env.VITE_AGENT_ENDPOINT ?? DEFAULT_ENDPOINT;
}

export function createAgent(threadId: string): HttpAgent {
  return new HttpAgent({
    url: agentEndpoint(),
    threadId,
  });
}
