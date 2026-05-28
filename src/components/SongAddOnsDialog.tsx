import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Compass, Gift, Loader2 } from "lucide-react";

export const DISTRO_HELP_PRICE = 15;
export const HEA_BOX_FULL_PRICE = 36.90;
export const HEA_BOX_DISCOUNT = 0.25;
export const HEA_BOX_DISCOUNTED_PRICE = Math.round(HEA_BOX_FULL_PRICE * (1 - HEA_BOX_DISCOUNT) * 100) / 100; // 27.68

interface SongAddOnsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  baseTotal: number;
  onConfirm: (selections: { wantsDistroHelp: boolean; wantsHeaBox: boolean }) => void;
  isSubmitting?: boolean;
}

export const SongAddOnsDialog = ({
  open,
  onOpenChange,
  baseTotal,
  onConfirm,
  isSubmitting = false,
}: SongAddOnsDialogProps) => {
  const [wantsDistroHelp, setWantsDistroHelp] = useState(false);
  const [wantsHeaBox, setWantsHeaBox] = useState(false);

  const addOnsTotal =
    (wantsDistroHelp ? DISTRO_HELP_PRICE : 0) +
    (wantsHeaBox ? HEA_BOX_DISCOUNTED_PRICE : 0);
  const grandTotal = baseTotal + addOnsTotal;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Want to add anything else?</DialogTitle>
          <DialogDescription>
            Optional bonuses from the HEA Team — skip or add before checkout.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {/* Discover Your Distro */}
          <label
            htmlFor="distro-help"
            className={`flex gap-3 rounded-lg border p-4 cursor-pointer transition-colors ${
              wantsDistroHelp ? "border-primary bg-primary/5" : "hover:bg-muted/50"
            }`}
          >
            <Checkbox
              id="distro-help"
              checked={wantsDistroHelp}
              onCheckedChange={(c) => setWantsDistroHelp(c === true)}
              className="mt-1"
            />
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 font-medium">
                  <Compass className="h-4 w-4 text-primary" />
                  Discover Your Distro
                </div>
                <span className="text-sm font-semibold">+${DISTRO_HELP_PRICE}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                A member of the HEA Support team helps you find the best distribution
                platform for your budget and project. (Handled by HEA Support, not your producer.)
              </p>
            </div>
          </label>

          {/* HEA Exclusive Box */}
          <label
            htmlFor="hea-box"
            className={`flex gap-3 rounded-lg border p-4 cursor-pointer transition-colors ${
              wantsHeaBox ? "border-primary bg-primary/5" : "hover:bg-muted/50"
            }`}
          >
            <Checkbox
              id="hea-box"
              checked={wantsHeaBox}
              onCheckedChange={(c) => setWantsHeaBox(c === true)}
              className="mt-1"
            />
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 font-medium">
                  <Gift className="h-4 w-4 text-primary" />
                  HEA Exclusive Box
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold">+${HEA_BOX_DISCOUNTED_PRICE.toFixed(2)}</span>
                  <span className="ml-2 text-xs text-muted-foreground line-through">
                    ${HEA_BOX_FULL_PRICE.toFixed(2)}
                  </span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Gomas chamoy, stickers, and "fuel" for your creativity — exclusive 25% off
                when added with your song submission.
              </p>
            </div>
          </label>
        </div>

        <div className="rounded-md bg-muted/50 p-3 text-sm flex items-center justify-between">
          <span className="text-muted-foreground">Order total</span>
          <span className="font-semibold">${grandTotal.toFixed(2)}</span>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={() => onConfirm({ wantsDistroHelp: false, wantsHeaBox: false })}
            disabled={isSubmitting}
          >
            Skip & checkout
          </Button>
          <Button
            onClick={() => onConfirm({ wantsDistroHelp, wantsHeaBox })}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Redirecting…
              </>
            ) : (
              <>Continue to checkout — ${grandTotal.toFixed(2)}</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
