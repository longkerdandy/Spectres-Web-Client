import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ApiError, createTrade, errorMessage } from "./api";
import { DatePicker } from "./date-picker";
import type { Side, ValidationErrorItem } from "./types";
import { addDecimal, isPositiveDecimal, mulDecimal, mulInt } from "./money";

export interface SymbolOption {
  symbol: string;
  name: string;
}

interface RecordTradeDialogProps {
  symbols: SymbolOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRecorded: () => void;
}

interface Preview {
  gross: string;
  commission: string;
  net: string;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function isPositiveInteger(value: string): boolean {
  return /^\d+$/.test(value.trim()) && Number(value) > 0;
}

/**
 * Mounted only while open (the parent renders it conditionally), so form
 * state initializes fresh on every open via the lazy initializers below.
 */
export function RecordTradeDialog({
  symbols,
  open,
  onOpenChange,
  onRecorded,
}: RecordTradeDialogProps) {
  const { t } = useTranslation("etf-grid");
  const [symbol, setSymbol] = useState(() => symbols[0]?.symbol ?? "");
  const [tradeDate, setTradeDate] = useState(today);
  const [side, setSide] = useState<Side>("buy");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [commissionRate, setCommissionRate] = useState("");
  const [note, setNote] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<ValidationErrorItem[] | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const preview = useMemo<Preview | null>(() => {
    if (!isPositiveDecimal(price) || !isPositiveInteger(quantity)) return null;
    if (!isPositiveDecimal(commissionRate)) return null;
    const gross = mulInt(price, Number(quantity));
    const commission = mulDecimal(gross, commissionRate);
    const net =
      side === "buy"
        ? `-${addDecimal(gross, commission)}`
        : addDecimal(gross, `-${commission}`);
    return { gross, commission, net };
  }, [price, quantity, commissionRate, side]);

  const canSubmit = preview !== null && symbol !== "" && tradeDate !== "";

  async function submit() {
    setSubmitting(true);
    setErrors(null);
    setFormError(null);
    try {
      await createTrade({
        symbol,
        trade_date: tradeDate,
        side,
        price,
        quantity: Number(quantity),
        commission_rate: commissionRate,
        ...(note.trim() ? { note: note.trim() } : {}),
      });
      onOpenChange(false);
      onRecorded();
    } catch (error) {
      if (error instanceof ApiError && error.validation) {
        setErrors(error.validation);
      } else {
        setFormError(errorMessage(error));
      }
      setConfirming(false);
    } finally {
      setSubmitting(false);
    }
  }

  const fieldLabel = "text-xs text-muted-foreground";
  const fieldInput = "mt-1";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("record.title")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <label className="block">
            <span className={fieldLabel}>{t("record.symbol")}</span>
            <Select value={symbol} onValueChange={setSymbol}>
              <SelectTrigger className={fieldInput}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {symbols.map((option) => (
                  <SelectItem key={option.symbol} value={option.symbol}>
                    {option.symbol} {option.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <div className="block">
              <span className={fieldLabel}>{t("record.date")}</span>
              <DatePicker
                value={tradeDate}
                onChange={setTradeDate}
                className={`${fieldInput} w-full`}
              />
            </div>
            <label className="block">
              <span className={fieldLabel}>{t("record.side")}</span>
              <Select
                value={side}
                onValueChange={(value) => setSide(value as Side)}
              >
                <SelectTrigger className={fieldInput}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="buy">{t("record.buy")}</SelectItem>
                  <SelectItem value="sell">{t("record.sell")}</SelectItem>
                </SelectContent>
              </Select>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className={fieldLabel}>{t("record.price")}</span>
              <Input
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                placeholder="0.8030"
                className={fieldInput}
              />
            </label>
            <label className="block">
              <span className={fieldLabel}>{t("record.quantity")}</span>
              <Input
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                placeholder="2800"
                className={fieldInput}
              />
            </label>
          </div>

          <label className="block">
            <span className={fieldLabel}>{t("record.commissionRate")}</span>
            <Input
              value={commissionRate}
              onChange={(event) => setCommissionRate(event.target.value)}
              placeholder="0.00020"
              className={fieldInput}
            />
          </label>

          <label className="block">
            <span className={fieldLabel}>{t("record.note")}</span>
            <Input
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder={t("record.notePlaceholder")}
              className={fieldInput}
            />
          </label>

          <div className="rounded-lg border bg-muted/50 px-3 py-2.5 text-xs space-y-1">
            <div className="font-medium text-muted-foreground">
              {t("record.preview")}
            </div>
            <div className="flex justify-between">
              <span>{t("record.gross")}</span>
              <span>{preview?.gross ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span>{t("record.commission")}</span>
              <span>{preview?.commission ?? "—"}</span>
            </div>
            <div className="flex justify-between font-medium">
              <span>{t("record.net")}</span>
              <span>{preview?.net ?? "—"}</span>
            </div>
          </div>

          {errors && (
            <ul className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive space-y-0.5">
              {errors.map((item, index) => (
                <li key={index}>{item.msg}</li>
              ))}
            </ul>
          )}
          {formError && (
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {formError}
            </div>
          )}
        </div>

        <DialogFooter className="flex items-center justify-between gap-3 sm:justify-between">
          <p className="text-xs text-muted-foreground">{t("record.hint")}</p>
          <div className="flex gap-2">
            {confirming ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => setConfirming(false)}
                  disabled={submitting}
                >
                  {t("record.back")}
                </Button>
                <Button onClick={() => void submit()} disabled={submitting}>
                  {submitting ? t("record.submitting") : t("record.confirm")}
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  {t("record.cancel")}
                </Button>
                <Button
                  onClick={() => setConfirming(true)}
                  disabled={!canSubmit}
                >
                  {t("record.continue")}
                </Button>
              </>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
