/**
 * Payload shapes inside the tool envelope's `data` for the `etf_grid`
 * tools. Unlike the REST contract (types.ts), tool results carry no
 * pagination envelope — `list_grid_trades` returns a bare `Trade[]`
 * truncated at `limit`. `SymbolStatus` / `SignalSnapshot` / `Trade` rows
 * are shared with REST and imported from `./types`.
 */

import type { ComputeSignalsResult, SyncResult } from "./types";

/** `refresh_grid_data` payload: sync results merged with signal recompute. */
export type RefreshGridData = SyncResult & ComputeSignalsResult;
