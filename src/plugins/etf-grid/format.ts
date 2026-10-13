/**
 * Presentation formatting for the ETF Grid plugin. Money arrives as
 * strings; formatting for display (thousand separators) is the only place
 * values pass through Number — never arithmetic.
 */

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

/** ISO date "2026-09-26" → "09-26". */
export function formatDate(iso: string | null): string {
  if (!iso) return EM_DASH;
  return iso.slice(5);
}

/** Signed level display: 1 → "+1", -2 → "-2", 0 → "0". */
export function formatLevel(level: number): string {
  return level > 0 ? `+${level}` : String(level);
}
