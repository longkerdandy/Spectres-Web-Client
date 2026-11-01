/**
 * Exact decimal arithmetic on string inputs, BigInt-backed. The Runtime is
 * authoritative for persisted amounts; these helpers exist only for the
 * record-trade local preview, and never touch floats.
 */

function parse(value: string): { int: bigint; scale: number } {
  const negative = value.startsWith("-");
  const digits = value.replace("-", "");
  const [whole, frac = ""] = digits.split(".");
  const int = BigInt(whole + frac) * (negative ? -1n : 1n);
  return { int, scale: frac.length };
}

/** Renders `value / 10^scale` rounded half-up to `digits` decimals. */
function roundScaled(value: bigint, scale: number, digits: number): string {
  const drop = scale - digits;
  let rounded: bigint;
  if (drop > 0) {
    const divisor = 10n ** BigInt(drop);
    const half = divisor / 2n;
    rounded = (value >= 0n ? value + half : value - half) / divisor;
  } else {
    rounded = value * 10n ** BigInt(-drop);
  }
  const sign = rounded < 0n ? "-" : "";
  const abs = rounded < 0n ? -rounded : rounded;
  const text = abs.toString().padStart(digits + 1, "0");
  if (digits === 0) return sign + text;
  return `${sign}${text.slice(0, -digits)}.${text.slice(-digits)}`;
}

function rescale(int: bigint, from: number, to: number): bigint {
  return int * 10n ** BigInt(to - from);
}

/** a × b, rounded half-up to `digits` decimals. */
export function mulDecimal(a: string, b: string, digits = 2): string {
  const pa = parse(a);
  const pb = parse(b);
  return roundScaled(pa.int * pb.int, pa.scale + pb.scale, digits);
}

/** a × integer n, rounded half-up to `digits` decimals. */
export function mulInt(a: string, n: number, digits = 2): string {
  const pa = parse(a);
  return roundScaled(pa.int * BigInt(n), pa.scale, digits);
}

/** a + b (either may be negative), rounded half-up to `digits` decimals. */
export function addDecimal(a: string, b: string, digits = 2): string {
  const pa = parse(a);
  const pb = parse(b);
  const scale = Math.max(pa.scale, pb.scale);
  const sum = rescale(pa.int, pa.scale, scale) + rescale(pb.int, pb.scale, scale);
  return roundScaled(sum, scale, digits);
}

/** True when the string is a plain positive decimal (optionally with fraction). */
export function isPositiveDecimal(value: string): boolean {
  return /^\d+(\.\d+)?$/.test(value.trim());
}
