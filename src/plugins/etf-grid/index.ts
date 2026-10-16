import { ChartColumn } from "lucide-react";
import { defineLocales, definePlugin } from "../types";
import GridPage from "./grid-page";
import { EtfGridToolCards } from "./tool-cards";

/**
 * ETF Grid plugin — mirrors the Runtime's `etf_grid` extension.
 *
 * v0.1.2 shipped a blank placeholder page to validate the plugin
 * framework; v0.2.0 filled it with the real grid UI, v0.2.1 added the
 * chat tool cards.
 */
export default definePlugin({
  id: "etf-grid",
  contributes: {
    navItems: [
      { id: "etf-grid", labelKey: "nav.title", icon: ChartColumn },
    ],
    views: [{ id: "etf-grid", component: GridPage }],
    locales: defineLocales(
      import.meta.glob("./locales/*.json", {
        eager: true,
        import: "default",
      }),
    ),
    toolCards: [EtfGridToolCards],
  },
});
