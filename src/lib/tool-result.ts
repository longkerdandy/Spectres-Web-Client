/**
 * Runtime tool result envelope (`runtime-extensions.md` §6.5): every tool
 * returns `{"ok": true, "data": ...}` or `{"ok": false, "error": {...}}`
 * and never raises across the tool boundary. The AG-UI stream delivers the
 * envelope as a JSON string in the tool call's `result`.
 */

export interface ToolError {
  type: string;
  message: string;
  trace_id: string;
  hint: string;
}

export type ToolResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ToolError };

/**
 * Parses a tool call's `result` string into the envelope. Returns null
 * when the payload is not valid envelope JSON.
 */
export function parseToolResult<T>(raw: string): ToolResult<T> | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof parsed !== "object" || parsed === null) return null;
  const envelope = parsed as Record<string, unknown>;
  if (envelope.ok === true && "data" in envelope) {
    return { ok: true, data: envelope.data as T };
  }
  if (
    envelope.ok === false &&
    typeof envelope.error === "object" &&
    envelope.error !== null
  ) {
    return { ok: false, error: envelope.error as ToolError };
  }
  return null;
}
