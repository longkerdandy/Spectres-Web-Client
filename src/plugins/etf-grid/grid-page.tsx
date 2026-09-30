import { ChartColumn } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * Placeholder page for the ETF Grid plugin.
 *
 * Exists to validate the plugin framework end to end (discovery → nav →
 * view switch); v0.2.0 replaces this with the real grid status and ledger
 * UI backed by the Runtime's `etf_grid` extension.
 */
export default function GridPage() {
  return (
    <div className="flex h-full flex-col">
      <header className="border-b px-6 py-4">
        <h1 className="text-lg font-semibold">ETF 网格</h1>
        <p className="text-sm text-muted-foreground">
          网格交易策略的运行状态与账本视图。
        </p>
      </header>
      <div className="flex flex-1 items-center justify-center p-6">
        <Card className="w-full max-w-sm border-dashed">
          <CardHeader className="items-center text-center">
            <ChartColumn className="size-10 text-muted-foreground" />
            <CardTitle>页面建设中</CardTitle>
            <CardDescription>
              该插件页面将在 v0.2.0 中提供完整的网格状态与账本功能。
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center text-xs text-muted-foreground">
            ETF Grid plugin · v0.1.2 framework validation
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
