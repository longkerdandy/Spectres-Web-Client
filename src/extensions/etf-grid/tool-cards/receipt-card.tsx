import { ReceiptText } from "lucide-react";
import { useTranslation } from "react-i18next";
import { SideBadge } from "../ledger";
import type { Trade } from "../types";
import { formatInt, formatMoney, formatPrice } from "../format";
import { Field, ToolCardFrame, type ToolCardProps } from "./frame";

function ReceiptBody({ trade }: { trade: Trade }) {
  const { t } = useTranslation("etf-grid");
  return (
    <div className="space-y-1 text-xs">
      <div className="flex flex-wrap items-center gap-2">
        <SideBadge side={trade.side} />
        <span className="font-medium">{trade.symbol}</span>
        <span className="text-muted-foreground">{trade.trade_date}</span>
      </div>
      <div className="flex flex-wrap gap-x-5 gap-y-1">
        <Field label={t("tools.receipt.price")}>
          {formatPrice(trade.price)} × {formatInt(trade.quantity)}
        </Field>
        <Field label={t("tools.receipt.gross")}>
          {formatMoney(trade.gross_amount)}
        </Field>
        <Field label={t("tools.receipt.commission")}>
          {formatMoney(trade.commission)} ({trade.commission_rate})
        </Field>
        <Field label={t("tools.receipt.net")}>
          {formatMoney(trade.net_amount)}
        </Field>
      </div>
      {trade.note && (
        <div className="text-muted-foreground">{trade.note}</div>
      )}
      <div className="text-muted-foreground">{t("tools.receipt.verify")}</div>
    </div>
  );
}

/**
 * Chat card for the `record_grid_trade` tool: echoes the persisted row's
 * gross/commission/net for in-dialog verification. Not a confirmation
 * gate — the Runtime has already executed the write.
 */
export function ReceiptToolCard({ status, result }: ToolCardProps) {
  const { t } = useTranslation("etf-grid");
  return (
    <ToolCardFrame
      icon={ReceiptText}
      title={t("tools.receipt.title")}
      status={status}
      result={result}
      renderData={(trade: Trade) => <ReceiptBody trade={trade} />}
    />
  );
}
