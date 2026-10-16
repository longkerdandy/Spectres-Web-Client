import { z } from "zod";

/**
 * Parameter schemas of the Runtime `etf_grid` tools, mirroring
 * `toolkit.py`. CopilotKit v2's `useRenderTool` requires a Standard
 * Schema per named renderer; these also type the render props.
 */

export const getGridStatusParams = z.object({});

export const refreshGridDataParams = z.object({});

export const recordGridTradeParams = z.object({
  symbol: z.string(),
  trade_date: z.string(),
  side: z.enum(["buy", "sell"]),
  price: z.string(),
  quantity: z.number().int(),
  commission_rate: z.string(),
  note: z.string().optional(),
});

export const listGridTradesParams = z.object({
  symbol: z.string().optional(),
  limit: z.number().int().optional(),
});
