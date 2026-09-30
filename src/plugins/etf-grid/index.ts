import { ChartColumn } from "lucide-react";
import { defineLocales, definePlugin } from "../types";
import GridPage from "./grid-page";

/**
 * ETF Grid plugin — mirrors the Runtime's `etf_grid` extension.
 *
 * v0.1.2 ships only a blank placeholder page to validate the plugin
 * framework; v0.2.0 fills it with the real grid UI, v0.2.1 adds chat
 * tool cards.
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
  },
});
