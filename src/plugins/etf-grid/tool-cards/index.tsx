import { useRenderTool } from "@copilotkit/react-core/v2";
import {
  getGridStatusParams,
  listGridTradesParams,
  recordGridTradeParams,
  refreshGridDataParams,
} from "../tool-schemas";
import { ReceiptToolCard } from "./receipt-card";
import { RefreshToolCard } from "./refresh-card";
import { StatusToolCard } from "./status-card";
import { TradesToolCard } from "./trades-card";

/**
 * Registers the chat tool cards for the four `etf_grid` Runtime tools —
 * matched by the stable tool names guaranteed by
 * `runtime-extensions.md` §6.3. Mounted by the chat page inside the
 * CopilotKit provider; renders nothing itself. Unregistered tools keep
 * the generic `useDefaultRenderTool` fallback.
 */
export function EtfGridToolCards() {
  useRenderTool({
    name: "get_grid_status",
    parameters: getGridStatusParams,
    render: ({ status, result }) => (
      <StatusToolCard status={status} result={result} />
    ),
  });
  useRenderTool({
    name: "refresh_grid_data",
    parameters: refreshGridDataParams,
    render: ({ status, result }) => (
      <RefreshToolCard status={status} result={result} />
    ),
  });
  useRenderTool({
    name: "record_grid_trade",
    parameters: recordGridTradeParams,
    render: ({ status, result }) => (
      <ReceiptToolCard status={status} result={result} />
    ),
  });
  useRenderTool({
    name: "list_grid_trades",
    parameters: listGridTradesParams,
    render: ({ status, result }) => (
      <TradesToolCard status={status} result={result} />
    ),
  });
  return null;
}
