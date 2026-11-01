import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, type LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { parseToolResult, type ToolError } from "@/lib/tool-result";

/** Status of an AG-UI tool call as delivered by CopilotKit v2 render props. */
type ToolCallStatus = "inProgress" | "executing" | "complete";

/** Props every tool card accepts, forwarded from `useRenderTool` render props. */
export interface ToolCardProps {
  status: ToolCallStatus;
  result: string | undefined;
}

/** Labeled value pair used by the compact card layouts. */
export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <div className="text-muted-foreground">{label}</div>
      <div className="whitespace-nowrap">{children}</div>
    </div>
  );
}

function ErrorBody({ error }: { error: ToolError }) {
  const { t } = useTranslation("etf-grid");
  return (
    <div className="space-y-1 text-xs">
      <div className="text-destructive">
        {error.type}: {error.message}
      </div>
      <div className="text-muted-foreground">
        {t("tools.errorHint")}
        <code className="ml-1 rounded bg-muted px-1 py-0.5">{error.hint}</code>
      </div>
    </div>
  );
}

interface ToolCardFrameProps<T> {
  icon: LucideIcon;
  title: string;
  status: ToolCallStatus;
  result: string | undefined;
  renderData: (data: T) => ReactNode;
}

/**
 * Shared chrome for the etf-grid chat tool cards: title row plus the
 * streaming/result state machine — in-flight indicator while the call
 * runs, Runtime envelope (`{ok, data}` / `{ok, error}`) parsing at
 * `complete`, structured error body on failure.
 */
export function ToolCardFrame<T>({
  icon: Icon,
  title,
  status,
  result,
  renderData,
}: ToolCardFrameProps<T>) {
  const { t } = useTranslation("etf-grid");

  let body: ReactNode;
  if (status !== "complete") {
    body = (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="size-3.5 animate-spin" />
        {status === "inProgress" ? t("tools.preparing") : t("tools.executing")}
      </div>
    );
  } else {
    const parsed = parseToolResult<T>(result ?? "");
    if (!parsed) {
      body = (
        <div className="text-xs text-destructive">{t("tools.unparseable")}</div>
      );
    } else if (!parsed.ok) {
      body = <ErrorBody error={parsed.error} />;
    } else {
      body = renderData(parsed.data);
    }
  }

  return (
    <Card size="sm" className="my-1">
      <CardHeader className="flex-row items-center gap-2">
        <Icon className="size-4 shrink-0 text-muted-foreground" />
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>{body}</CardContent>
    </Card>
  );
}
