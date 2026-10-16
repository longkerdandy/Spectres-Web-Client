import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { errorMessage, getTrades } from "./api";
import { DatePicker } from "./date-picker";
import { RecordTradeDialog, type SymbolOption } from "./record-trade-dialog";
import type { Page, Trade } from "./types";
import {
  EM_DASH,
  formatInt,
  formatMoney,
  formatPrice,
  sideClassName,
} from "./format";

const PAGE_SIZE = 20;
const ALL_SYMBOLS = "__all__";

interface LedgerProps {
  symbols: SymbolOption[];
  onTradeRecorded: () => void;
}

export function SideBadge({ side }: { side: Trade["side"] }) {
  const { t } = useTranslation("etf-grid");
  return (
    <Badge variant="outline" className={sideClassName(side)}>
      {t(`ledger.side.${side}`)}
    </Badge>
  );
}

export function Ledger({ symbols, onTradeRecorded }: LedgerProps) {
  const { t } = useTranslation("etf-grid");
  const [symbol, setSymbol] = useState(ALL_SYMBOLS);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [query, setQuery] = useState({ symbol: "", start: "", end: "" });
  const [offset, setOffset] = useState(0);
  const [page, setPage] = useState<Page<Trade> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Latest-wins: starting a new load aborts the previous in-flight one,
  // and only the latest request may commit state or end the loading flag.
  const controllerRef = useRef<AbortController | null>(null);

  const load = useCallback(
    async (filters: { symbol: string; start: string; end: string }, off: number) => {
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;
      try {
        const result = await getTrades(
          {
            symbol: filters.symbol || undefined,
            start: filters.start || undefined,
            end: filters.end || undefined,
            limit: PAGE_SIZE,
            offset: off,
          },
          controller.signal,
        );
        if (controller.signal.aborted) return;
        setPage(result);
        setError(null);
      } catch (loadError) {
        if (controller.signal.aborted) return;
        setError(errorMessage(loadError));
      } finally {
        if (controllerRef.current === controller) setLoading(false);
      }
    },
    [],
  );

  // Initial page load; subsequent loads are driven by the event handlers
  // below (filters, pagination, recorded trade).
  useEffect(() => {
    void load({ symbol: "", start: "", end: "" }, 0);
    return () => {
      controllerRef.current?.abort();
      controllerRef.current = null;
    };
  }, [load]);

  function applyFilters() {
    const filters = {
      symbol: symbol === ALL_SYMBOLS ? "" : symbol,
      start,
      end,
    };
    setQuery(filters);
    setOffset(0);
    setLoading(true);
    void load(filters, 0);
  }

  function gotoOffset(next: number) {
    setOffset(next);
    setLoading(true);
    void load(query, next);
  }

  function handleRecorded() {
    setLoading(true);
    void load(query, offset);
    onTradeRecorded();
  }

  const totalPages = page ? Math.max(1, Math.ceil(page.total / PAGE_SIZE)) : 1;
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;

  return (
    <Card>
      <CardHeader className="flex-row items-center flex-wrap gap-2">
        <CardTitle>{t("ledger.title")}</CardTitle>
        <div className="flex items-center gap-2">
          <Select value={symbol} onValueChange={setSymbol}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_SYMBOLS}>
                {t("ledger.allSymbols")}
              </SelectItem>
              {symbols.map((option) => (
                <SelectItem key={option.symbol} value={option.symbol}>
                  {option.symbol}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DatePicker
            value={start}
            onChange={setStart}
            placeholder={t("ledger.startDate")}
            className="w-36"
          />
          <span className="text-muted-foreground">~</span>
          <DatePicker
            value={end}
            onChange={setEnd}
            placeholder={t("ledger.endDate")}
            className="w-36"
          />
          <Button variant="outline" size="sm" onClick={applyFilters}>
            <Search />
            {t("ledger.query")}
          </Button>
        </div>
        <Button
          size="sm"
          className="ml-auto"
          onClick={() => setDialogOpen(true)}
          disabled={symbols.length === 0}
        >
          <Plus />
          {t("ledger.record")}
        </Button>
      </CardHeader>
      <CardContent>
        {loading && !page ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : error ? (
          <div className="py-6 text-center text-sm text-destructive">
            {t("ledger.loadFailed", { message: error })}
          </div>
        ) : page && page.items.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            {t("ledger.empty")}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table className="min-w-480 table-fixed">
              <colgroup>
                <col className="w-56" />
                <col className="w-56" />
                <col className="w-40" />
                <col className="w-48" />
                <col className="w-48" />
                <col className="w-56" />
                <col className="w-48" />
                <col className="w-56" />
                <col className="w-40" />
                <col />
              </colgroup>
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
                    {t("ledger.columns.gross")}
                  </TableHead>
                  <TableHead className="text-right">
                    {t("ledger.columns.commission")}
                  </TableHead>
                  <TableHead className="text-right">
                    {t("ledger.columns.net")}
                  </TableHead>
                  <TableHead className="text-center">
                    {t("ledger.columns.source")}
                  </TableHead>
                  <TableHead>{t("ledger.columns.note")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {page?.items.map((trade) => (
                  <TableRow key={trade.id}>
                    <TableCell className="whitespace-nowrap">
                      {trade.trade_date}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {trade.symbol}
                    </TableCell>
                    <TableCell>
                      <SideBadge side={trade.side} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right">
                      {formatPrice(trade.price)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right">
                      {formatInt(trade.quantity)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right">
                      {formatMoney(trade.gross_amount)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right">
                      {formatMoney(trade.commission)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right">
                      {formatMoney(trade.net_amount)}
                    </TableCell>
                    <TableCell className="text-center text-xs text-muted-foreground">
                      {trade.source}
                    </TableCell>
                    <TableCell
                      className="truncate text-xs text-muted-foreground"
                      title={trade.note ?? undefined}
                    >
                      {trade.note ?? EM_DASH}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        {page && page.total > 0 && (
          <div className="mt-2 flex items-center justify-between border-t pt-2 text-xs text-muted-foreground">
            <span>{t("ledger.total", { total: page.total })}</span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={offset === 0 || loading}
                onClick={() => gotoOffset(Math.max(0, offset - PAGE_SIZE))}
              >
                {t("ledger.prev")}
              </Button>
              <span>
                {t("ledger.page", { page: currentPage, pages: totalPages })}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={offset + PAGE_SIZE >= page.total || loading}
                onClick={() => gotoOffset(offset + PAGE_SIZE)}
              >
                {t("ledger.next")}
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      {dialogOpen && (
        <RecordTradeDialog
          symbols={symbols}
          open
          onOpenChange={setDialogOpen}
          onRecorded={handleRecorded}
        />
      )}
    </Card>
  );
}
