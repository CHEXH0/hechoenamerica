import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { DollarSign, TrendingUp, Save, RotateCcw, Lightbulb, Percent } from "lucide-react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import {
  useSongPricing,
  useUpdateSongPricing,
  DEFAULT_PRICING,
  getSuggestedPrice,
  type SongPricingConfig,
} from "@/hooks/useSongPricing";

const TIER_NAMES = ["Free", "Demo", "Artist", "Industry"];
const ADD_ON_LABELS: Record<string, string> = {
  stems: "Recorded Stems",
  analog: "Analog Equipment",
  mixing: "Mixing Service",
  mastering: "Mastering Service",
  revision: "Revision (each)",
};

const PricingAdmin = () => {
  const { data: pricing, isLoading } = useSongPricing();
  const updatePricing = useUpdateSongPricing();
  const { toast } = useToast();

  const [config, setConfig] = useState<SongPricingConfig>(DEFAULT_PRICING);
  const [inflationRate, setInflationRate] = useState(3.5);
  const [taxRate, setTaxRate] = useState(8.25);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (pricing) {
      setConfig(pricing);
    }
  }, [pricing]);

  const updateTierPrice = (tierIndex: number, price: number) => {
    const newConfig = { ...config };
    newConfig.tiers = [...config.tiers];
    newConfig.tiers[tierIndex] = {
      ...newConfig.tiers[tierIndex],
      price,
      label: price === 0 ? "$0" : `$${price}`,
    };
    setConfig(newConfig);
    setHasChanges(true);
  };

  const updateTierDescription = (tierIndex: number, description: string) => {
    const newConfig = { ...config };
    newConfig.tiers = [...config.tiers];
    newConfig.tiers[tierIndex] = { ...newConfig.tiers[tierIndex], description };
    setConfig(newConfig);
    setHasChanges(true);
  };

  const updateAddOnPrice = (addOn: string, tierIndex: number, price: number) => {
    const newConfig = { ...config };
    newConfig.addOns = { ...config.addOns };
    const key = addOn as keyof typeof config.addOns;
    newConfig.addOns[key] = {
      ...config.addOns[key],
      prices: config.addOns[key].prices.map((p, i) => (i === tierIndex ? price : p)),
    };
    setConfig(newConfig);
    setHasChanges(true);
  };

  const updateAudioQualitySurcharge = (
    type: "bitDepthOptions" | "sampleRateOptions",
    optionIndex: number,
    tierIndex: number,
    surcharge: number
  ) => {
    const newConfig = { ...config };
    newConfig[type] = config[type].map((opt, i) =>
      i === optionIndex
        ? { ...opt, surcharge: opt.surcharge.map((s, j) => (j === tierIndex ? surcharge : s)) }
        : opt
    );
    setConfig(newConfig);
    setHasChanges(true);
  };

  const updatePlatformFee = (fee: number) => {
    setConfig({ ...config, platformFeePercent: fee });
    setHasChanges(true);
  };

  const applySuggestionToTier = (tierIndex: number) => {
    const current = config.tiers[tierIndex].price;
    if (current === 0) return;
    const suggested = getSuggestedPrice(current, inflationRate, taxRate);
    updateTierPrice(tierIndex, suggested);
  };

  const applySuggestionToAddOn = (addOn: string, tierIndex: number) => {
    const key = addOn as keyof typeof config.addOns;
    const current = config.addOns[key].prices[tierIndex];
    if (current === 0) return;
    const suggested = getSuggestedPrice(current, inflationRate, taxRate);
    updateAddOnPrice(addOn, tierIndex, suggested);
  };

  const applyAllSuggestions = () => {
    const newConfig = { ...config };

    // Tiers
    newConfig.tiers = config.tiers.map((tier) => {
      if (tier.price === 0) return tier;
      const suggested = getSuggestedPrice(tier.price, inflationRate, taxRate);
      return { ...tier, price: suggested, label: `$${suggested}` };
    });

    // Add-ons
    newConfig.addOns = { ...config.addOns };
    for (const key of Object.keys(config.addOns) as (keyof typeof config.addOns)[]) {
      newConfig.addOns[key] = {
        ...config.addOns[key],
        prices: config.addOns[key].prices.map((p) =>
          p === 0 ? 0 : getSuggestedPrice(p, inflationRate, taxRate)
        ),
      };
    }

    // Audio quality surcharges
    newConfig.bitDepthOptions = config.bitDepthOptions.map((opt) => ({
      ...opt,
      surcharge: opt.surcharge.map((s) => (s === 0 ? 0 : getSuggestedPrice(s, inflationRate, taxRate))),
    }));
    newConfig.sampleRateOptions = config.sampleRateOptions.map((opt) => ({
      ...opt,
      surcharge: opt.surcharge.map((s) => (s === 0 ? 0 : getSuggestedPrice(s, inflationRate, taxRate))),
    }));

    setConfig(newConfig);
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      await updatePricing.mutateAsync(config);
      setHasChanges(false);
      toast({ title: "Pricing updated", description: "New prices are now live on the Generate Song page." });
    } catch (err) {
      toast({ title: "Error saving pricing", description: String(err), variant: "destructive" });
    }
  };

  const handleReset = () => {
    setConfig(DEFAULT_PRICING);
    setHasChanges(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">Loading pricing…</CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Song Pricing Management
        </CardTitle>
        <CardDescription>
          Manage tier prices, add-on costs, and audio quality surcharges for the Generate Song page
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Inflation & Tax Suggestions */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Lightbulb className="h-4 w-4 text-yellow-500" />
            Price Suggestions (Inflation & Tax)
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label className="text-xs">Annual Inflation Rate (%)</Label>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="50"
                value={inflationRate}
                onChange={(e) => setInflationRate(parseFloat(e.target.value) || 0)}
                className="h-8"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Tax Rate (%)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                max="50"
                value={taxRate}
                onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                className="h-8"
              />
            </div>
            <div className="flex items-end">
              <Button variant="outline" size="sm" onClick={applyAllSuggestions} className="w-full">
                <TrendingUp className="h-3.5 w-3.5 mr-1.5" />
                Apply to All Prices
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Suggested = Current × (1 + inflation%) × (1 + tax%). Click "Apply" on individual items or apply to all at once.
          </p>
        </div>

        {/* Platform Fee */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2 font-semibold">
            <Percent className="h-4 w-4" />
            Platform Fee Percentage
          </Label>
          <div className="flex items-center gap-3">
            <Input
              type="number"
              step="0.5"
              min="0"
              max="50"
              value={config.platformFeePercent}
              onChange={(e) => updatePlatformFee(parseFloat(e.target.value) || 0)}
              className="w-24 h-8"
            />
            <span className="text-sm text-muted-foreground">% of each transaction goes to the platform</span>
          </div>
        </div>

        <Separator />

        {/* Tier Pricing */}
        <div className="space-y-4">
          <h3 className="font-semibold text-sm">Tier Base Prices</h3>
          <div className="grid gap-3">
            {config.tiers.map((tier, i) => {
              const suggested = tier.price > 0 ? getSuggestedPrice(tier.price, inflationRate, taxRate) : 0;
              return (
                <div key={i} className="flex items-center gap-3 flex-wrap">
                  <Badge variant="outline" className="w-20 justify-center shrink-0">
                    {TIER_NAMES[i]}
                  </Badge>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm text-muted-foreground">$</span>
                    <Input
                      type="number"
                      min="0"
                      value={tier.price}
                      onChange={(e) => updateTierPrice(i, parseInt(e.target.value) || 0)}
                      className="w-20 h-8"
                      disabled={i === 0}
                    />
                  </div>
                  <Input
                    value={tier.description}
                    onChange={(e) => updateTierDescription(i, e.target.value)}
                    className="flex-1 min-w-[200px] h-8 text-sm"
                    disabled={i === 0}
                  />
                  {suggested > 0 && suggested !== tier.price && (
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-yellow-600 hover:text-yellow-700"
                          onClick={() => applySuggestionToTier(i)}
                        >
                          <Lightbulb className="h-3 w-3 mr-1" />
                          ${suggested}
                        </Button>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-48 text-xs">
                        Suggested price accounting for {inflationRate}% inflation and {taxRate}% tax
                      </HoverCardContent>
                    </HoverCard>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <Separator />

        {/* Add-On Pricing */}
        <div className="space-y-4">
          <h3 className="font-semibold text-sm">Add-On Prices (per tier)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-4 font-medium">Add-On</th>
                  {TIER_NAMES.map((name) => (
                    <th key={name} className="text-center py-2 px-2 font-medium min-w-[70px]">
                      {name}
                    </th>
                  ))}
                  <th className="text-center py-2 px-2 font-medium min-w-[60px]">Suggest</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(ADD_ON_LABELS).map(([key, label]) => {
                  const addOn = config.addOns[key as keyof typeof config.addOns];
                  return (
                    <tr key={key} className="border-b border-muted/50">
                      <td className="py-2 pr-4 text-muted-foreground">{label}</td>
                      {addOn.prices.map((price, i) => (
                        <td key={i} className="py-2 px-1 text-center">
                          <Input
                            type="number"
                            min="0"
                            value={price}
                            onChange={(e) => updateAddOnPrice(key, i, parseInt(e.target.value) || 0)}
                            className="w-16 h-7 text-center mx-auto text-xs"
                            disabled={i === 0}
                          />
                        </td>
                      ))}
                      <td className="py-2 px-1 text-center">
                        <div className="flex flex-col gap-0.5 items-center">
                          {addOn.prices.slice(1).map((p, j) => {
                            const suggested = p > 0 ? getSuggestedPrice(p, inflationRate, taxRate) : 0;
                            return suggested > 0 && suggested !== p ? (
                              <button
                                key={j}
                                onClick={() => applySuggestionToAddOn(key, j + 1)}
                                className="text-[10px] text-yellow-600 hover:underline"
                              >
                                T{j + 1}: ${suggested}
                              </button>
                            ) : null;
                          })}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <Separator />

        {/* Audio Quality Surcharges */}
        <div className="space-y-4">
          <h3 className="font-semibold text-sm">Audio Quality Surcharges (per tier)</h3>

          <div className="space-y-3">
            <Label className="text-xs text-muted-foreground">Bit Depth</Label>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-1 pr-4 font-medium">Option</th>
                    {TIER_NAMES.map((name) => (
                      <th key={name} className="text-center py-1 px-2 font-medium min-w-[70px]">
                        {name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {config.bitDepthOptions.map((opt, oi) => (
                    <tr key={opt.value} className="border-b border-muted/50">
                      <td className="py-1 pr-4 text-muted-foreground">{opt.label}</td>
                      {opt.surcharge.map((s, ti) => (
                        <td key={ti} className="py-1 px-1 text-center">
                          <Input
                            type="number"
                            min="0"
                            value={s}
                            onChange={(e) =>
                              updateAudioQualitySurcharge("bitDepthOptions", oi, ti, parseInt(e.target.value) || 0)
                            }
                            className="w-16 h-7 text-center mx-auto text-xs"
                            disabled={ti === 0}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-xs text-muted-foreground">Sample Rate</Label>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-1 pr-4 font-medium">Option</th>
                    {TIER_NAMES.map((name) => (
                      <th key={name} className="text-center py-1 px-2 font-medium min-w-[70px]">
                        {name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {config.sampleRateOptions.map((opt, oi) => (
                    <tr key={opt.value} className="border-b border-muted/50">
                      <td className="py-1 pr-4 text-muted-foreground">{opt.label}</td>
                      {opt.surcharge.map((s, ti) => (
                        <td key={ti} className="py-1 px-1 text-center">
                          <Input
                            type="number"
                            min="0"
                            value={s}
                            onChange={(e) =>
                              updateAudioQualitySurcharge("sampleRateOptions", oi, ti, parseInt(e.target.value) || 0)
                            }
                            className="w-16 h-7 text-center mx-auto text-xs"
                            disabled={ti === 0}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <Separator />

        {/* Actions */}
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
            Reset to Defaults
          </Button>
          <div className="flex items-center gap-3">
            {hasChanges && (
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                Unsaved changes
              </Badge>
            )}
            <Button onClick={handleSave} disabled={!hasChanges || updatePricing.isPending} size="sm">
              <Save className="h-3.5 w-3.5 mr-1.5" />
              {updatePricing.isPending ? "Saving…" : "Save Pricing"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PricingAdmin;
