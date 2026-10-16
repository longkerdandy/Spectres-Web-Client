import { RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { RefreshGridData } from "../tool-types";
import { ToolCardFrame, type ToolCardProps } from "./frame";

function RefreshBody({ data }: { data: RefreshGridData }) {
  const { t } = useTranslation("etf-grid");
  const candlesDetail = Object.entries(data.candles ?? {})
    .map(([symbol, rows]) => `${symbol} +${rows}`)
    .join(", ");
  const skippedDetail = Object.entries(data.skipped)
    .map(([symbol, reason]) => `${symbol}: ${reason}`)
    .join(", ");
  return (
    <div className="space-y-1 text-xs">
      <div>
        {data.candles === null
          ? t("notice.candlesFailed")
          : t("notice.candles", { detail: candlesDetail })}
      </div>
      <div>
        {data.valuation === null
          ? t("notice.valuationFailed")
          : t("notice.valuation", { count: data.valuation })}
      </div>
      <div>{t("notice.computeDone", { count: Object.keys(data.signals).length })}</div>
      {skippedDetail && (
        <div className="text-muted-foreground">
          {t("notice.computeSkipped", { detail: skippedDetail })}
        </div>
      )}
      {Object.entries(data.errors).map(([source, message]) => (
        <div key={source} className="text-destructive">
          {source}: {message}
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
