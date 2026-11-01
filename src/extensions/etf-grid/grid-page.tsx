import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Calculator, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError, computeSignals, errorMessage, getStatus, refreshData } from "./api";
import { Ledger } from "./ledger";
import { computeNotice, syncNotice } from "./notice";
import { StatusTable } from "./status-table";
import type { SymbolStatus } from "./types";

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

export default function GridPage() {
  const { t } = useTranslation("etf-grid");
  const [status, setStatus] = useState<SymbolStatus[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [recomputing, setRecomputing] = useState(false);

  // Latest-wins for status loads (same pattern as the Ledger); the
  // refresh/recompute pipeline only aborts on unmount — the action
  // buttons already prevent it from overlapping itself.
  const statusControllerRef = useRef<AbortController | null>(null);
  const pipelineControllerRef = useRef<AbortController | null>(null);

  const loadStatus = useCallback(async () => {
    statusControllerRef.current?.abort();
    const controller = new AbortController();
    statusControllerRef.current = controller;
    try {
      const result = await getStatus(controller.signal);
      if (controller.signal.aborted) return;
      setStatus(result);
      setLoadError(null);
    } catch (error) {
      if (controller.signal.aborted) return;
      setLoadError(errorMessage(error));
    } finally {
      if (statusControllerRef.current === controller) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStatus();
    return () => {
      statusControllerRef.current?.abort();
      statusControllerRef.current = null;
      pipelineControllerRef.current?.abort();
      pipelineControllerRef.current = null;
    };
  }, [loadStatus]);

  /** Refresh = full pipeline (sync + recompute) in one composite call. */
  async function handleRefresh() {
    const controller = new AbortController();
    pipelineControllerRef.current = controller;
    setRefreshing(true);
    setNotice(null);
    // Whether server data may have changed and the tables are worth
    // reloading: always on 200; on failure only when sync completed and
    // the recompute raised (500) — on 502/network failure nothing changed.
    let completed = false;
    try {
      const result = await refreshData(controller.signal);
      completed = true;
      const syncInfo = syncNotice(t, result.sync);
      const computeInfo = computeNotice(t, result.signals);
      const partial = syncInfo.errors.length > 0 || computeInfo.skipped !== null;
      setNotice({
        variant: partial ? "destructive" : "default",
        title: partial
          ? t("notice.refreshPartial")
          : t("notice.refreshSuccess"),
        description: [
          ...syncInfo.lines,
          ...syncInfo.errors,
          computeInfo.done,
          ...(computeInfo.skipped ? [computeInfo.skipped] : []),
        ].join(" · "),
      });
    } catch (error) {
      if (error instanceof ApiError && error.status === 500) completed = true;
      if (!controller.signal.aborted) {
        // 502 (or unreachable) = sync stage failed; 500 = recompute raised.
        const syncFailed = !(error instanceof ApiError) || error.status === 502;
        setNotice({
          variant: "destructive",
          title: syncFailed
            ? t("notice.syncFailed")
            : t("notice.computeFailed"),
          description: errorMessage(error),
        });
      }
    } finally {
      setRefreshing(false);
    }
    if (completed && !controller.signal.aborted) await loadStatus();
  }

  /** Recompute alone: local-only math over already-synced data. */
  async function handleRecompute() {
    const controller = new AbortController();
    pipelineControllerRef.current = controller;
    setRecomputing(true);
    setNotice(null);
    try {
      const info = computeNotice(
        t,
        await computeSignals(controller.signal),
      );
      setNotice({
        variant: info.skipped ? "destructive" : "default",
        title: info.done,
        description: info.skipped ?? t("notice.computeOk"),
      });
      if (!controller.signal.aborted) await loadStatus();
    } catch (error) {
      if (!controller.signal.aborted) {
        setNotice({
          variant: "destructive",
          title: t("notice.computeFailed"),
          description: errorMessage(error),
        });
      }
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
