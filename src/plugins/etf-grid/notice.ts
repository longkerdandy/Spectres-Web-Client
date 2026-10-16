/**
 * Notice-line builders for market-data sync and signal recompute outcomes.
 * Shared by the grid page's alert notices and the chat `refresh_grid_data`
 * tool card so wording and detail formats live in one place. All functions
 * are pure: callers pass the plugin-namespaced `t` and get display strings.
 */

import type { TFunction } from "i18next";
import type { ComputeSignalsResult, SyncResult } from "./types";

export interface SyncNotice {
  /** Candles and valuation outcome lines, in display order. */
  lines: [string, string];
  /** `"source: message"` per failed source; empty on full success. */
  errors: string[];
}

export function syncNotice(t: TFunction, result: SyncResult): SyncNotice {
  const candles =
    result.candles === null
      ? t("notice.candlesFailed")
      : t("notice.candles", {
          detail: Object.entries(result.candles)
            .map(([symbol, rows]) => `${symbol} +${rows}`)
            .join(", "),
        });
  const valuation =
    result.valuation === null
      ? t("notice.valuationFailed")
      : t("notice.valuation", { count: result.valuation });
  return {
    lines: [candles, valuation],
    errors: Object.entries(result.errors).map(
      ([source, message]) => `${source}: ${message}`,
    ),
  };
}

export interface ComputeNotice {
  /** Recomputed-symbols summary line. */
  done: string;
  /** Skipped-symbols line; null when every symbol recomputed. */
  skipped: string | null;
}

export function computeNotice(
  t: TFunction,
  result: ComputeSignalsResult,
): ComputeNotice {
  const skipped = Object.entries(result.skipped);
  return {
    done: t("notice.computeDone", {
      count: Object.keys(result.signals).length,
    }),
    skipped:
      skipped.length > 0
        ? t("notice.computeSkipped", {
            detail: skipped
              .map(([symbol, reason]) => `${symbol}: ${reason}`)
              .join("; "),
          })
        : null,
  };
}
