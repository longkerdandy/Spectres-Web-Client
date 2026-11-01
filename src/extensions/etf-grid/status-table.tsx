import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { GridOrder, SignalSnapshot, SymbolStatus } from "./types";
import {
  EM_DASH,
  formatInt,
  formatLevel,
  formatMoney,
  formatPercent,
  formatPrice,
  formatShortDate,
  formatSignedMoney,
  formatSignedPercent,
  sideClassName,
  signedClassName,
} from "./format";

export function OrderRow({ order }: { order: GridOrder }) {
  const { t } = useTranslation("etf-grid");
  return (
    <div className="flex items-center gap-1">
      <Badge variant="outline" className={sideClassName(order.side)}>
        {t(`status.order.${order.side}`, {
          price: formatPrice(order.limit_price),
          grids: order.grids,
        })}
      </Badge>
      <Badge variant="secondary">{t(`status.order.${order.kind}`)}</Badge>
      {order.note && (
        <Badge
          variant={order.note === "gate_closed" ? "destructive" : "secondary"}
        >
          {t(`status.order.note.${order.note}`)}
        </Badge>
      )}
    </div>
  );
}

export function SignalCell({ signal }: { signal: SignalSnapshot }) {
  const { t } = useTranslation("etf-grid");
  const triggered = signal.orders.filter((order) => order.kind === "triggered");
  const pendingBuy = signal.orders.find(
    (order) => order.side === "buy" && order.kind === "pending",
  );
  const pendingSell = signal.orders.find(
    (order) => order.side === "sell" && order.kind === "pending",
  );
  return (
    <div className="space-y-1 text-xs whitespace-nowrap">
      {triggered.map((order, index) => (
        <OrderRow key={`t-${index}`} order={order} />
      ))}
      {pendingBuy ? (
        <OrderRow order={pendingBuy} />
      ) : (
        <div className="text-muted-foreground">
          {t("status.order.noPendingBuy")}
        </div>
      )}
      {pendingSell ? (
        <OrderRow order={pendingSell} />
      ) : (
        <div className="text-muted-foreground">
          {t("status.order.noPendingSell")}
        </div>
      )}
      {signal.block_reason && (
        <div className="text-destructive">
          {t(`status.blockReason.${signal.block_reason}`, {
            percentile: formatPercent(signal.gate_percentile),
          })}
        </div>
      )}
    </div>
  );
}

export function GateCell({ signal }: { signal: SignalSnapshot | null }) {
  const { t } = useTranslation("etf-grid");
  if (!signal || !signal.gate_closed) {
    return <span className="text-xs text-muted-foreground">{EM_DASH}</span>;
  }
  return (
    <Badge variant="destructive">
      {t("status.gate.closed", {
        percentile: formatPercent(signal.gate_percentile),
      })}
    </Badge>
  );
}

function StatusRow({ row }: { row: SymbolStatus }) {
  const { t } = useTranslation("etf-grid");
  const unrealizedClass = signedClassName(row.unrealized);
  return (
    <TableRow>
      <TableCell>
        <div className="font-medium whitespace-nowrap">{row.name}</div>
        <div className="text-xs text-muted-foreground">{row.symbol}</div>
      </TableCell>
      <TableCell className="whitespace-nowrap text-right">
        {formatInt(row.shares)}
      </TableCell>
      <TableCell className="whitespace-nowrap text-right">
        {formatPrice(row.avg_cost)}
      </TableCell>
      <TableCell className="whitespace-nowrap text-right">
        {formatPrice(row.close)}
        {row.close_date && (
          <>
            <br />
            <span className="text-xs text-muted-foreground">
              {formatShortDate(row.close_date)}
            </span>
          </>
        )}
      </TableCell>
      <TableCell className="whitespace-nowrap text-right">
        {formatMoney(row.market_value)}
      </TableCell>
      <TableCell className="whitespace-nowrap text-right">
        {row.unrealized !== null ? (
          <div className={unrealizedClass}>
            {formatSignedMoney(row.unrealized)}{" "}
            <span className="text-xs">
              ({formatSignedPercent(row.unrealized_percent)})
            </span>
          </div>
        ) : (
          <div className="text-xs text-muted-foreground">{EM_DASH}</div>
        )}
        <div className="text-xs text-muted-foreground">
          {t("status.realizedLabel", { value: formatSignedMoney(row.realized) })}
        </div>
      </TableCell>
      <TableCell className="text-center">
        {row.signal ? (
          <Badge variant="secondary">{formatLevel(row.signal.level)}</Badge>
        ) : (
          <span className="text-xs text-muted-foreground">{EM_DASH}</span>
        )}
      </TableCell>
      <TableCell>
        {row.signal ? (
          <SignalCell signal={row.signal} />
        ) : (
          <span className="text-xs text-muted-foreground">
            {t("status.noSignal")}
          </span>
        )}
      </TableCell>
      <TableCell className="text-center">
        <GateCell signal={row.signal} />
      </TableCell>
    </TableRow>
  );
}

export function StatusTable({ status }: { status: SymbolStatus[] }) {
  const { t } = useTranslation("etf-grid");
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>{t("status.title")}</CardTitle>
        <span className="text-xs text-muted-foreground">
          {t("status.configHint")}
        </span>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table className="min-w-448 table-fixed">
            <colgroup>
              <col className="w-64" />
              <col className="w-40" />
              <col className="w-40" />
              <col className="w-48" />
              <col className="w-48" />
              <col className="w-48" />
              <col className="w-32" />
              <col />
              <col className="w-40" />
            </colgroup>
            <TableHeader>
              <TableRow>
                <TableHead>{t("status.columns.symbol")}</TableHead>
                <TableHead className="text-right">
                  {t("status.columns.shares")}
                </TableHead>
                <TableHead className="text-right">
                  {t("status.columns.avgCost")}
                </TableHead>
                <TableHead className="text-right">
                  {t("status.columns.close")}
                </TableHead>
                <TableHead className="text-right">
                  {t("status.columns.marketValue")}
                </TableHead>
                <TableHead className="text-right">
                  {t("status.columns.pnl")}
                </TableHead>
                <TableHead className="text-center">
                  {t("status.columns.level")}
                </TableHead>
                <TableHead>{t("status.columns.signals")}</TableHead>
                <TableHead className="text-center">
                  {t("status.columns.gate")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {status.map((row) => (
                <StatusRow key={row.symbol} row={row} />
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
