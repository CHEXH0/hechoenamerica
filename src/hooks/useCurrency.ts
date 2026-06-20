import { useEffect, useState } from "react";

/**
 * Lightweight display-currency hook.
 *
 * - Detects the visitor's country via IP (reusing the geo cache that
 *   useGeoLanguage already populates) and maps it to a curated short
 *   list of supported display currencies.
 * - Fetches live USD -> currency rates (cached for 6h in sessionStorage).
 * - Provides formatters so the UI can show LOCAL price (primary) with the
 *   real USD charge as a secondary reference.
 *
 * Charging always happens in USD — Stripe Adaptive Pricing handles the
 * actual local-currency conversion at checkout. These figures are friendly
 * estimates, never the source of truth.
 */

const GEO_CACHE_KEY = "geoDetectedCountry";
const FX_CACHE_KEY = "fxRatesUSD";
const FX_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

// Curated short list of supported display currencies (LATAM focus + majors)
const SUPPORTED = new Set([
  "USD", "EUR", "GBP", "MXN", "BRL", "CAD", "AUD", "ARS", "COP", "CLP", "PEN",
]);

const EUROZONE = [
  "AT", "BE", "CY", "EE", "FI", "FR", "DE", "GR", "IE", "IT",
  "LV", "LT", "LU", "MT", "NL", "PT", "SK", "SI", "ES", "HR",
];

const COUNTRY_CURRENCY: Record<string, string> = {
  US: "USD",
  GB: "GBP",
  MX: "MXN",
  BR: "BRL",
  CA: "CAD",
  AU: "AUD",
  AR: "ARS",
  CO: "COP",
  CL: "CLP",
  PE: "PEN",
};
EUROZONE.forEach((c) => (COUNTRY_CURRENCY[c] = "EUR"));


// Currencies we display without decimals (large nominal values)
const ZERO_DECIMAL = new Set(["CLP", "COP", "ARS", "JPY"]);

const fetchCountry = async (): Promise<string | null> => {
  const cached = sessionStorage.getItem(GEO_CACHE_KEY);
  if (cached) return cached;
  try {
    const res = await fetch("https://ipapi.co/json/", { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      const data = await res.json();
      if (data?.country_code) {
        const cc = String(data.country_code).toUpperCase();
        sessionStorage.setItem(GEO_CACHE_KEY, cc);
        return cc;
      }
    }
  } catch (e) {
    console.warn("[currency] geo lookup failed", e);
  }
  return null;
};

const fetchRates = async (): Promise<Record<string, number> | null> => {
  const raw = sessionStorage.getItem(FX_CACHE_KEY);
  if (raw) {
    try {
      const c = JSON.parse(raw);
      if (Date.now() - c.t < FX_TTL_MS && c.rates) return c.rates;
    } catch {
      /* ignore */
    }
  }
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", { signal: AbortSignal.timeout(4000) });
    if (res.ok) {
      const data = await res.json();
      if (data?.rates) {
        sessionStorage.setItem(FX_CACHE_KEY, JSON.stringify({ t: Date.now(), rates: data.rates }));
        return data.rates;
      }
    }
  } catch (e) {
    console.warn("[currency] FX lookup failed", e);
  }
  return null;
};

export interface UseCurrencyResult {
  code: string;
  rate: number;
  ready: boolean;
  isLocal: boolean;
  /** Formats a USD amount as USD currency. */
  usd: (amountUsd: number) => string;
  /** Formats a USD amount converted to the local currency. */
  local: (amountUsd: number) => string;
}

export const useCurrency = (): UseCurrencyResult => {
  const [code, setCode] = useState("USD");
  const [rate, setRate] = useState(1);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const country = await fetchCountry();
        const cur = (country && COUNTRY_CURRENCY[country]) || "USD";
        if (cur === "USD" || !SUPPORTED.has(cur)) {
          if (!cancelled) setReady(true);
          return;
        }
        const rates = await fetchRates();
        if (cancelled) return;
        if (rates && typeof rates[cur] === "number" && rates[cur] > 0) {
          setCode(cur);
          setRate(rates[cur]);
        }
        setReady(true);
      } catch {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const usd = (amountUsd: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: Number.isInteger(amountUsd) ? 0 : 2,
    }).format(amountUsd);

  const local = (amountUsd: number) => {
    if (code === "USD") return usd(amountUsd);
    const value = amountUsd * rate;
    // Use en-US base locale so symbols are distinguishable from USD
    // (e.g. MX$, R$, CA$) instead of a bare "$".
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: code,
      maximumFractionDigits: ZERO_DECIMAL.has(code) ? 0 : 2,
    }).format(value);
  };

  return { code, rate, ready, isLocal: code !== "USD", usd, local };
};
