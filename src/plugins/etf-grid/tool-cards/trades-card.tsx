import { History } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SideBadge } from "../ledger";
import type { Trade } from "../types";
import { formatInt, formatMoney, formatPrice, formatShortDate } from "../format";
import { ToolCardFrame, type ToolCardProps } from "./frame";

function TradesBody({ trades }: { trades: Trade[] }) {
  const { t } = useTranslation("etf-grid");
  if (trades.length === 0) {
    return (
      <div className="text-xs text-muted-foreground">{t("ledger.empty")}</div>
    );
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("ledger.columns.date")}</TableHead>
          <TableHead>{t("ledger.columns.symbol")}</TableHead>
          <TableHead>{t("ledger.columns.side")}</TableHead>
          <TableHead className="text-right">
            {t("ledger.columns.price")}
          </TableHead>
          <TableHead className="text-right">
            {t("ledger.columns.quantity")}
          </TableHead>
          <TableHead className="text-right">
            {t("ledger.columns.net")}
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {trades.map((trade) => (
          <TableRow key={trade.id}>
            <TableCell className="whitespace-nowrap">
              {formatShortDate(trade.trade_date)}
            </TableCell>
            <TableCell>{trade.symbol}</TableCell>
            <TableCell>
              <SideBadge side={trade.side} />
            </TableCell>
            <TableCell className="text-right">
              {formatPrice(trade.price)}
            </TableCell>
            <TableCell className="text-right">
              {formatInt(trade.quantity)}
            </TableCell>
            <TableCell className="text-right">
              {formatMoney(trade.net_amount)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

/**
 * Chat card for the `list_grid_trades` tool: compact table of the latest
 * trades. The tool returns a bare array truncated at `limit` — no
 * pagination envelope like the REST endpoint.
 */
export function TradesToolCard({ status, result }: ToolCardProps) {
  const { t } = useTranslation("etf-grid");
  return (
    <ToolCardFrame
      icon={History}
      title={t("tools.trades.title")}
      status={status}
      result={result}
      renderData={(trades: Trade[]) => <TradesBody trades={trades} />}
    />
  );
}
