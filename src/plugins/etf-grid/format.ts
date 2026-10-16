/**
 * Presentation formatting for the ETF Grid plugin: display strings and
 * semantic color classes. Money arrives as strings; formatting for
 * display (thousand separators) is the only place values pass through
 * Number — never arithmetic.
 */

import type { Side } from "./types";

const money = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const price = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 4,
  maximumFractionDigits: 4,
});
const integer = new Intl.NumberFormat("en-US");

export const EM_DASH = "—";

/** "11830.00" → "11,830.00"; null → "—". */
export function formatMoney(value: string | null): string {
  if (value === null) return EM_DASH;
  return money.format(Number(value));
}

/** Like `formatMoney` but always signed: "+326.40" / "-58.20". */
export function formatSignedMoney(value: string): string {
  const formatted = money.format(Number(value));
  return value.startsWith("-") ? formatted : `+${formatted}`;
}

/** "0.8450" → "0.8450"; null → "—". */
export function formatPrice(value: string | null): string {
  if (value === null) return EM_DASH;
  return price.format(Number(value));
}

export function formatInt(value: number): string {
  return integer.format(value);
}

/** Fraction string ("0.12") → "12%"; null → "—". */
export function formatPercent(fraction: string | null): string {
  if (fraction === null) return EM_DASH;
  return `${Math.round(Number(fraction) * 100)}%`;
}

/** Signed percent with one decimal: "0.1234" → "+12.3%", "-0.05" → "-5.0%"; null → "—". */
export function formatSignedPercent(fraction: string | null): string {
  if (fraction === null) return EM_DASH;
  const percent = Number(fraction) * 100;
  const formatted = `${Math.abs(percent).toFixed(1)}%`;
  return percent < 0 ? `-${formatted}` : `+${formatted}`;
}

/** ISO date "2026-09-26" → "09-26" — year dropped; compact form for dense tables and cards. */
export function formatShortDate(iso: string | null): string {
  if (!iso) return EM_DASH;
  return iso.slice(5);
}

/** Badge outline colors for a trade/order side: green buy, red sell. */
export function sideClassName(side: Side): string {
  return side === "buy"
    ? "border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
    : "border-rose-500/40 text-rose-600 dark:text-rose-400";
}

/** Text color for a signed money string: red when "-"-prefixed, else green. */
export function signedClassName(value: string | null): string {
  return value !== null && value.startsWith("-")
    ? "text-rose-600 dark:text-rose-400"
    : "text-emerald-600 dark:text-emerald-400";
}

/** Signed level display: 1 → "+1", -2 → "-2", 0 → "0". */
export function formatLevel(level: number): string {
  return level > 0 ? `+${level}` : String(level);
}
