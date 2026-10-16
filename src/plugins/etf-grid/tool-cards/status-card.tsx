import { ChartColumn } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { GateCell, SignalCell } from "../status-table";
import type { SymbolStatus } from "../types";
import {
  EM_DASH,
  formatInt,
  formatLevel,
  formatMoney,
  formatPrice,
  formatShortDate,
  formatSignedMoney,
  formatSignedPercent,
  signedClassName,
} from "../format";
import { Field, ToolCardFrame, type ToolCardProps } from "./frame";

function SymbolBlock({ row }: { row: SymbolStatus }) {
  const { t } = useTranslation("etf-grid");
  const unrealizedClass = signedClassName(row.unrealized);
  return (
    <div className="space-y-1">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium">{row.name}</span>
        <span className="text-xs text-muted-foreground">{row.symbol}</span>
        {row.signal && (
          <Badge variant="secondary">{formatLevel(row.signal.level)}</Badge>
        )}
        <GateCell signal={row.signal} />
      </div>
      <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs">
        <Field label={t("status.columns.shares")}>
          {formatInt(row.shares)}
        </Field>
        <Field label={t("status.columns.avgCost")}>
          {formatPrice(row.avg_cost)}
        </Field>
        <Field label={t("status.columns.close")}>
          {formatPrice(row.close)}
          {row.close_date && (
            <span className="text-muted-foreground">
              {" "}
              {formatShortDate(row.close_date)}
            </span>
          )}
        </Field>
        <Field label={t("status.columns.marketValue")}>
          {formatMoney(row.market_value)}
        </Field>
        <Field label={t("status.columns.pnl")}>
          {row.unrealized !== null ? (
            <span className={unrealizedClass}>
              {formatSignedMoney(row.unrealized)} (
              {formatSignedPercent(row.unrealized_percent)})
            </span>
          ) : (
            EM_DASH
          )}
          <span className="text-muted-foreground">
            {" "}
            · {t("status.realizedLabel", {
              value: formatSignedMoney(row.realized),
            })}
          </span>
        </Field>
      </div>
      {row.signal ? (
        <SignalCell signal={row.signal} />
      ) : (
        <div className="text-xs text-muted-foreground">
          {t("status.noSignal")}
        </div>
      )}
    </div>
  );
}

/** Chat card for the `get_grid_status` tool: compact per-symbol status. */
export function StatusToolCard({ status, result }: ToolCardProps) {
  const { t } = useTranslation("etf-grid");
  return (
    <ToolCardFrame
      icon={ChartColumn}
      title={t("tools.status.title")}
      status={status}
      result={result}
      renderData={(rows: SymbolStatus[]) => (
        <div className="space-y-3">
          {rows.map((row) => (
            <SymbolBlock key={row.symbol} row={row} />
          ))}
        </div>
      )}
    />
  );
}
