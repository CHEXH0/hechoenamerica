import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Compass, Gift, Loader2, Sparkles, Check } from "lucide-react";
import { useTranslation } from "@/contexts/TranslationContext";

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
  showDistroHelp?: boolean;
  showHeaBox?: boolean;
}

export const SongAddOnsDialog = ({
  open,
  onOpenChange,
  baseTotal,
  onConfirm,
  isSubmitting = false,
  showDistroHelp = true,
  showHeaBox = true,
}: SongAddOnsDialogProps) => {
  const { t } = useTranslation();
  const tx = t.generateSong.songAddOns;
  const [wantsDistroHelp, setWantsDistroHelp] = useState(false);
  const [wantsHeaBox, setWantsHeaBox] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const addOnsTotal =
    (showDistroHelp && wantsDistroHelp ? DISTRO_HELP_PRICE : 0) +
    (showHeaBox && wantsHeaBox ? HEA_BOX_DISCOUNTED_PRICE : 0);
  const grandTotal = baseTotal + addOnsTotal;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        {/* Header with gradient */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[hsl(222.2,47.4%,11.2%)] via-[hsl(217,32%,25%)] to-[hsl(210,40%,20%)] text-white px-6 pt-6 pb-4">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl" />
          <DialogHeader className="relative z-10">
            <DialogTitle className="text-xl font-display flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purpler-400 animate-pulse" />
              {tx.title}
            </DialogTitle>
            <DialogDescription className="text-white/70">
              {tx.subtitle}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="space-y-4 p-6 bg-gradient-to-b from-muted/30 to-transparent">
          {!showDistroHelp && !showHeaBox && (
            <p className="text-center text-sm text-muted-foreground py-6">
              {tx.noAddOns}
            </p>
          )}
          {/* Discover Your Distro Card */}
          {showDistroHelp && (
          <label
            htmlFor="distro-help"
            className={`group relative flex gap-4 rounded-xl border-2 cursor-pointer overflow-hidden transition-all duration-300 ${
              wantsDistroHelp
                ? "border-purple-500/60 bg-gradient-to-br from-purple-50 to-purpla-50 shadow-lg shadow-purple-500/10 scale-[1.01]"
                : "border-border hover:border-purple-300/50 hover:shadow-md hover:shadow-purple-500/5 bg-card"
            }`}
            onMouseEnter={() => setHoveredCard("distro")}
            onMouseLeave={() => setHoveredCard(null)}
          >
            {/* Image Section */}
            <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex-shrink-0 overflow-hidden">
              <img
                src="/laptop-uploads/Find_Your_Distro.png"
                alt="Discover Your Distro"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                loading="lazy"
              />
              <div className={`absolute inset-0 bg-gradient-to-t from-black/40 to-transparent transition-opacity duration-300 ${hoveredCard === "distro" ? "opacity-60" : "opacity-0"}`} />
              {wantsDistroHelp && (
                <div className="absolute top-2 left-2 bg-purple-500 text-white rounded-full p-1 shadow-lg animate-scale-in">
                  <Check className="h-3 w-3" />
                </div>
              )}
            </div>

            {/* Content Section */}
            <div className="flex-1 py-3 pr-3 sm:py-4 sm:pr-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 font-display font-semibold text-foreground">
                    <Compass className={`h-5 w-5 transition-colors duration-300 ${wantsDistroHelp ? "text-purple-600" : "text-purple-500"}`} />
                    <span>{tx.distroTitle}</span>
                  </div>
                  <span className="text-sm font-bold text-purple-600 bg-purple-100 px-2.5 py-1 rounded-full">
                    +${DISTRO_HELP_PRICE}
                  </span>
                </div>
                <p className={`text-sm leading-relaxed transition-all duration-500 ${
                  hoveredCard === "distro" || wantsDistroHelp
                    ? "text-foreground translate-y-0"
                    : "text-muted-foreground"
                }`}>
                  A member of the HEA Support team helps you find the best distribution
                  platform for your budget and project.
                  <span className="block mt-1 text-xs font-medium text-purple-600/80">
                    Handled by our support team.
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-3 mt-2">
                <Checkbox
                  id="distro-help"
                  checked={wantsDistroHelp}
                  onCheckedChange={(c) => setWantsDistroHelp(c === true)}
                  className="data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500"
                />
                <span className={`text-sm font-medium transition-colors ${wantsDistroHelp ? "text-purple-700" : "text-muted-foreground"}`}>
                  {wantsDistroHelp ? "Added to order" : "Click to add"}
                </span>
              </div>
            </div>
          </label>
          )}

          {/* HEA Exclusive Box Card */}
          {showHeaBox && (
          <label
            htmlFor="hea-box"
            className={`group relative flex gap-4 rounded-xl border-2 cursor-pointer overflow-hidden transition-all duration-300 ${
              wantsHeaBox
                ? "border-rose-500/60 bg-gradient-to-br from-rose-50 to-pink-50 shadow-lg shadow-rose-500/10 scale-[1.01]"
                : "border-border hover:border-rose-300/50 hover:shadow-md hover:shadow-rose-500/5 bg-card"
            }`}
            onMouseEnter={() => setHoveredCard("box")}
            onMouseLeave={() => setHoveredCard(null)}
          >
            {/* Image Section */}
            <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex-shrink-0 overflow-hidden">
              <img
                src="/laptop-uploads/Goodie_Box.png"
                alt="HEA Exclusive Box"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                loading="lazy"
              />
              <div className={`absolute inset-0 bg-gradient-to-t from-black/40 to-transparent transition-opacity duration-300 ${hoveredCard === "box" ? "opacity-60" : "opacity-0"}`} />
              {wantsHeaBox && (
                <div className="absolute top-2 left-2 bg-rose-500 text-white rounded-full p-1 shadow-lg animate-scale-in">
                  <Check className="h-3 w-3" />
                </div>
              )}
            </div>

            {/* Content Section */}
            <div className="flex-1 py-3 pr-3 sm:py-4 sm:pr-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 font-display font-semibold text-foreground">
                    <Gift className={`h-5 w-5 transition-colors duration-300 ${wantsHeaBox ? "text-rose-600" : "text-rose-500"}`} />
                    <span>HEA Exclusive Box</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-rose-600 bg-rose-100 px-2.5 py-1 rounded-full">
                      +${HEA_BOX_DISCOUNTED_PRICE.toFixed(2)}
                    </span>
                  </div>
                </div>
                <p className={`text-sm leading-relaxed transition-all duration-500 ${
                  hoveredCard === "box" || wantsHeaBox
                    ? "text-foreground translate-y-0"
                    : "text-muted-foreground"
                }`}>
                  Gomas chamoy, stickers, and "fuel" for your creativity — exclusive 25% off
                  when added with your song submission.
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground line-through">
                    ${HEA_BOX_FULL_PRICE.toFixed(2)}
                  </span>
                  <span className="text-xs font-bold text-green-600 bg-green-100 px-1.5 py-0.5 rounded">
                    SAVE 25%
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-2">
                <Checkbox
                  id="hea-box"
                  checked={wantsHeaBox}
                  onCheckedChange={(c) => setWantsHeaBox(c === true)}
                  className="data-[state=checked]:bg-rose-500 data-[state=checked]:border-rose-500"
                />
                <span className={`text-sm font-medium transition-colors ${wantsHeaBox ? "text-rose-700" : "text-muted-foreground"}`}>
                  {wantsHeaBox ? "Added to order" : "Click to add"}
                </span>
              </div>
            </div>
          </label>
          )}
        </div>

        {/* Order Summary */}
        <div className="mx-6 mb-2 rounded-xl bg-gradient-to-r from-muted/80 to-muted/40 p-4 border border-border/50">
          <div className="flex items-center justify-between text-sm">
            <div className="space-y-1">
              <span className="text-muted-foreground">Song Idea</span>
              <div className="font-medium text-foreground">${baseTotal.toFixed(2)}</div>
            </div>
            {addOnsTotal > 0 && (
              <>
                <div className="text-muted-foreground">+</div>
                <div className="space-y-1 text-center">
                  <span className="text-muted-foreground">Add-ons</span>
                  <div className="font-medium text-foreground">${addOnsTotal.toFixed(2)}</div>
                </div>
              </>
            )}
            <div className="text-muted-foreground">=</div>
            <div className="space-y-1 text-right">
              <span className="text-muted-foreground">Total</span>
              <div className="font-bold text-lg text-foreground">${grandTotal.toFixed(2)}</div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-3 px-6 pb-6 pt-2">
          <Button
            variant="outline"
            onClick={() => onConfirm({ wantsDistroHelp: false, wantsHeaBox: false })}
            disabled={isSubmitting}
            className="flex-1 hover:bg-muted"
          >
            Skip & checkout
          </Button>
          <Button
            onClick={() => onConfirm({ wantsDistroHelp, wantsHeaBox })}
            disabled={isSubmitting}
            className={`flex-[2] transition-all duration-300 ${
              addOnsTotal > 0
                ? "bg-gradient-to-r from-purple-500 to-rose-500 hover:from-purple-600 hover:to-rose-600 text-white shadow-lg"
                : ""
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Redirecting…
              </>
            ) : (
              <>Continue — ${grandTotal.toFixed(2)}</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
