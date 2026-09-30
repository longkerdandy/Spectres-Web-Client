import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation("etf-grid");

  return (
    <div className="flex h-full flex-col">
      <header className="border-b px-6 py-4">
        <h1 className="text-lg font-semibold">{t("page.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("page.description")}</p>
      </header>
      <div className="flex flex-1 items-center justify-center p-6">
        <Card className="w-full max-w-sm border-dashed">
          <CardHeader className="items-center text-center">
            <ChartColumn className="size-10 text-muted-foreground" />
            <CardTitle>{t("page.underConstruction")}</CardTitle>
            <CardDescription>
              {t("page.underConstructionDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center text-xs text-muted-foreground">
            {t("page.frameworkFooter")}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
