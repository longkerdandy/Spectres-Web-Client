import { RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { computeNotice, syncNotice } from "../notice";
import type { RefreshGridData } from "../tool-types";
import { ToolCardFrame, type ToolCardProps } from "./frame";

function RefreshBody({ data }: { data: RefreshGridData }) {
  const { t } = useTranslation("etf-grid");
  const sync = syncNotice(t, data);
  const compute = computeNotice(t, data);
  return (
    <div className="space-y-1 text-xs">
      {sync.lines.map((line) => (
        <div key={line}>{line}</div>
      ))}
      <div>{compute.done}</div>
      {compute.skipped && (
        <div className="text-muted-foreground">{compute.skipped}</div>
      )}
      {sync.errors.map((line) => (
        <div key={line} className="text-destructive">
          {line}
        </div>
      ))}
    </div>
  );
}

/**
 * Chat card for the `refresh_grid_data` tool: rows synced per source,
 * recomputed signal count, per-source failures as warnings.
 */
export function RefreshToolCard({ status, result }: ToolCardProps) {
  const { t } = useTranslation("etf-grid");
  return (
    <ToolCardFrame
      icon={RefreshCw}
      title={t("tools.refresh.title")}
      status={status}
      result={result}
      renderData={(data: RefreshGridData) => <RefreshBody data={data} />}
    />
  );
}
