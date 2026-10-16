/**
 * Payload shapes inside the tool envelope's `data` for the `etf_grid`
 * tools. Unlike the REST contract (types.ts), tool results carry no
 * pagination envelope — `list_grid_trades` returns a bare `Trade[]`
 * truncated at `limit`. `SymbolStatus` / `SignalSnapshot` / `Trade` rows
 * are shared with REST and imported from `./types`.
 */

import type { SignalSnapshot } from "./types";

/** `refresh_grid_data` payload: sync results merged with signal recompute. */
export interface RefreshGridData {
  /** Rows synced per symbol; null when the candles source failed. */
  candles: Record<string, number> | null;
  /** Valuation rows synced; null when the valuation source failed. */
  valuation: number | null;
  /** Per-source failure messages. */
  errors: Record<string, string>;
  /** Freshly recomputed signal snapshots by symbol. */
  signals: Record<string, SignalSnapshot>;
  /** Symbols skipped during recompute, with reasons. */
  skipped: Record<string, string>;
}
