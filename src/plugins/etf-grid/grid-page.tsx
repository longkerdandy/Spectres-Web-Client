import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { computeSignals, getStatus, syncMarketData } from "./api";
import { Ledger } from "./ledger";
import { StatusTable } from "./status-table";
import type { ComputeSignalsResult, SyncResult, SymbolStatus } from "./types";

/**
 * ETF Grid page: per-symbol grid status with daily signal orders, market
 * data refresh / signal recompute actions, and the trade ledger with
 * manual trade recording. All data comes from the Runtime's etf_grid
 * REST API (see ./api.ts).
 */

interface Notice {
  variant: "default" | "destructive";
  title: string;
  description: string;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export default function GridPage() {
  const { t } = useTranslation("etf-grid");
  const [status, setStatus] = useState<SymbolStatus[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [recomputing, setRecomputing] = useState(false);

  const loadStatus = useCallback(async () => {
    try {
      setStatus(await getStatus());
      setLoadError(null);
    } catch (error) {
      setLoadError(errorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  function syncNotice(result: SyncResult): Notice {
    const failed = Object.keys(result.errors).length > 0;
    const candles = result.candles
      ? Object.entries(result.candles)
          .map(([symbol, rows]) => `${symbol} +${rows}`)
          .join(", ")
      : null;
    const parts: string[] = [];
    parts.push(
      candles
        ? t("notice.candles", { detail: candles })
        : t("notice.candlesFailed"),
    );
    parts.push(
      result.valuation !== null
        ? t("notice.valuation", { count: result.valuation })
        : t("notice.valuationFailed"),
    );
    const errors = Object.values(result.errors).join("; ");
    return {
      variant: failed ? "destructive" : "default",
      title: failed ? t("notice.syncPartial") : t("notice.syncSuccess"),
      description: failed
        ? `${parts.join(" · ")} — ${errors}`
        : parts.join(" · "),
    };
  }

  function computeNotice(result: ComputeSignalsResult): Notice {
    const computed = Object.keys(result.signals).length;
    const skipped = Object.entries(result.skipped);
    const skippedDetail = skipped
      .map(([symbol, reason]) => `${symbol}: ${reason}`)
      .join("; ");
    return {
      variant: skipped.length > 0 ? "destructive" : "default",
      title: t("notice.computeDone", { count: computed }),
      description:
        skipped.length > 0
          ? t("notice.computeSkipped", { detail: skippedDetail })
          : t("notice.computeOk"),
    };
  }

  async function handleRefresh() {
    setRefreshing(true);
    setNotice(null);
    try {
      const result = await syncMarketData();
      setNotice(syncNotice(result));
      await loadStatus();
    } catch (error) {
      setNotice({
        variant: "destructive",
        title: t("notice.syncFailed"),
        description: errorMessage(error),
      });
    } finally {
      setRefreshing(false);
    }
  }

  async function handleRecompute() {
    setRecomputing(true);
    setNotice(null);
    try {
      const result = await computeSignals();
      setNotice(computeNotice(result));
      await loadStatus();
    } catch (error) {
      setNotice({
        variant: "destructive",
        title: t("notice.computeFailed"),
        description: errorMessage(error),
      });
    } finally {
      setRecomputing(false);
    }
  }

  const symbols = (status ?? []).map((row) => ({
    symbol: row.symbol,
    name: row.name,
  }));

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between border-b px-6 py-4">
        <div>
          <h1 className="text-lg font-semibold">{t("page.title")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("page.description")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => void handleRecompute()}
            disabled={refreshing || recomputing}
          >
            {recomputing ? t("actions.recomputing") : t("actions.recompute")}
          </Button>
          <Button
            onClick={() => void handleRefresh()}
            disabled={refreshing || recomputing}
          >
            {refreshing ? t("actions.refreshing") : t("actions.refresh")}
          </Button>
        </div>
      </header>

      <div className="flex-1 space-y-4 overflow-auto px-6 py-4">
        {notice && (
          <Alert variant={notice.variant}>
            <AlertTitle>{notice.title}</AlertTitle>
            <AlertDescription>{notice.description}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : loadError ? (
          <Alert variant="destructive">
            <AlertTitle>{t("errors.loadFailed")}</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span>{loadError}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setLoading(true);
                  void loadStatus();
                }}
              >
                {t("errors.retry")}
              </Button>
            </AlertDescription>
          </Alert>
        ) : status && status.length > 0 ? (
          <StatusTable status={status} />
        ) : (
          <Alert>
            <AlertTitle>{t("errors.emptyTitle")}</AlertTitle>
            <AlertDescription>{t("errors.emptyDescription")}</AlertDescription>
          </Alert>
        )}

        <Ledger symbols={symbols} onTradeRecorded={() => void loadStatus()} />
      </div>
    </div>
  );
}
