import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Calculator, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { computeSignals, getStatus, syncMarketData } from "./api";
import { Ledger } from "./ledger";
import { computeNotice, syncNotice } from "./notice";
import { StatusTable } from "./status-table";
import type { SyncResult, SymbolStatus } from "./types";

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

  /** Refresh = full pipeline: network sync, then local signal recompute. */
  async function handleRefresh() {
    setRefreshing(true);
    setNotice(null);
    let sync: SyncResult;
    try {
      sync = await syncMarketData();
    } catch (error) {
      setNotice({
        variant: "destructive",
        title: t("notice.syncFailed"),
        description: errorMessage(error),
      });
      setRefreshing(false);
      return;
    }
    const syncInfo = syncNotice(t, sync);
    const syncLines = [...syncInfo.lines, ...syncInfo.errors];
    try {
      const computeInfo = computeNotice(t, await computeSignals());
      const partial = syncInfo.errors.length > 0 || computeInfo.skipped !== null;
      setNotice({
        variant: partial ? "destructive" : "default",
        title: partial
          ? t("notice.refreshPartial")
          : t("notice.refreshSuccess"),
        description: [
          ...syncLines,
          computeInfo.done,
          ...(computeInfo.skipped ? [computeInfo.skipped] : []),
        ].join(" · "),
      });
    } catch (error) {
      setNotice({
        variant: "destructive",
        title: t("notice.refreshPartial"),
        description: [
          ...syncLines,
          t("notice.computeFailedReason", { message: errorMessage(error) }),
        ].join(" · "),
      });
    } finally {
      setRefreshing(false);
    }
    await loadStatus();
  }

  /** Recompute alone: local-only math over already-synced data. */
  async function handleRecompute() {
    setRecomputing(true);
    setNotice(null);
    try {
      const info = computeNotice(t, await computeSignals());
      setNotice({
        variant: info.skipped ? "destructive" : "default",
        title: info.done,
        description: info.skipped ?? t("notice.computeOk"),
      });
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
            <Calculator />
            {recomputing ? t("actions.recomputing") : t("actions.recompute")}
          </Button>
          <Button
            onClick={() => void handleRefresh()}
            disabled={refreshing || recomputing}
          >
            <RefreshCw />
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
