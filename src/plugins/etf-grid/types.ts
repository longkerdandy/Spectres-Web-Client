/**
 * TypeScript mirror of the Runtime's etf_grid REST contract
 * (`/api/v1/extensions/etf-grid`, Runtime v0.4.5). All Decimal values
 * arrive as strings; dates are ISO strings. Nullable fields are explicit.
 */

export type Side = "buy" | "sell";

export type BlockReason =
  | "gate_closed"
  | "max_grids_reached"
  | "cost_protection"
  | "no_position";

export interface GridOrder {
  side: Side;
  limit_price: string;
  grids: number;
  shares_est: number;
  kind: "triggered" | "pending";
  note: "cost_protection" | "gate_closed" | null;
}

/** Latest-signal snapshot nested under `SymbolStatus.signal`; null before the first compute. */
export interface SignalSnapshot {
  level: number;
  prev_level: number;
  anchor_ma60: string;
  close: string;
  block_reason: BlockReason | null;
  gate_closed: boolean;
  /** Fraction 0..1 as a string (0.12 = 12th percentile). */
  gate_percentile: string | null;
  gate_metric_value: string | null;
  orders: GridOrder[];
  computed_at: string;
}

export interface SymbolStatus {
  symbol: string;
  name: string;
  shares: number;
  avg_cost: string | null;
  realized: string;
  close: string | null;
  close_date: string | null;
  market_value: string | null;
  /** close × shares − avg_cost × shares; null without position, cost, or close. */
  unrealized: string | null;
  /** Fraction of cost basis as a string ("0.1234" = +12.34%); null with `unrealized`. */
  unrealized_percent: string | null;
  signal: SignalSnapshot | null;
}

/** `POST /sync`: failed sources are null with messages in `errors`. */
export interface SyncResult {
  candles: Record<string, number> | null;
  valuation: number | null;
  errors: Record<string, string>;
}

/** `POST /signals/compute`: local recompute; skipped symbols carry reasons. */
export interface ComputeSignalsResult {
  signals: Record<string, SignalSnapshot>;
  skipped: Record<string, string>;
}

export interface Trade {
  id: number;
  trade_date: string;
  symbol: string;
  side: Side;
  price: string;
  quantity: number;
  gross_amount: string;
  commission_rate: string;
  commission: string;
  net_amount: string;
  source: string;
  note: string | null;
  created_at: string;
}

/** v0.4.4 pagination envelope on `GET /trades` and `GET /signals`. */
export interface Page<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface TradeFilters {
  symbol?: string;
  start?: string;
  end?: string;
  limit: number;
  offset: number;
}

export interface TradeCreate {
  symbol: string;
  trade_date: string;
  side: Side;
  price: string;
  quantity: number;
  commission_rate: string;
  note?: string;
}

/** One item of the unified 422 `detail` list (extra keys ignored). */
export interface ValidationErrorItem {
  loc: (string | number)[];
  msg: string;
  type: string;
}
