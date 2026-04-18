import { useEffect, useState } from "react";
import type { Language } from "@/types/translations";

// Spanish-speaking countries: LATAM + Spain + Equatorial Guinea + Puerto Rico
const SPANISH_COUNTRIES = new Set([
  "AR", "BO", "CL", "CO", "CR", "CU", "DO", "EC", "ES", "GQ",
  "GT", "HN", "MX", "NI", "PA", "PE", "PR", "PY", "SV", "UY", "VE",
]);

const STORAGE_KEY = "preferredLanguage";
const GEO_CACHE_KEY = "geoDetectedCountry";

const detectFromBrowser = (): Language => {
  if (typeof navigator === "undefined") return "en";
  const lang = (navigator.language || "en").toLowerCase();
  if (lang.startsWith("es")) return "es";
  if (lang.startsWith("zh")) return "zh";
  if (lang.startsWith("pt")) return "pt";
  if (lang.startsWith("ru")) return "ru";
  return "en";
};

const fetchCountryCode = async (): Promise<string | null> => {
  // Try ipapi.co first (free, no key, ~30k req/month)
  try {
    const res = await fetch("https://ipapi.co/json/", { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      const data = await res.json();
      if (data?.country_code) return String(data.country_code).toUpperCase();
    }
  } catch (e) {
    console.warn("[geo] ipapi.co failed, trying fallback", e);
  }
  // Fallback to ipwho.is (also free, no key)
  try {
    const res = await fetch("https://ipwho.is/", { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      const data = await res.json();
      if (data?.country_code) return String(data.country_code).toUpperCase();
    }
  } catch (e) {
    console.warn("[geo] ipwho.is failed", e);
  }
  return null;
};

/**
 * Detects the user's preferred language.
 * Priority:
 *   1. localStorage (manual user choice — sticky forever)
 *   2. IP geolocation → if Spanish-speaking country → 'es'
 *   3. Browser language
 *   4. 'en'
 *
 * Returns the initial language synchronously (from localStorage if available)
 * and asynchronously updates it after geo lookup if no manual choice was saved.
 */
export const useGeoLanguage = (): {
  language: Language;
  setLanguage: (lang: Language) => void;
  isDetecting: boolean;
} => {
  // Synchronous initial value: localStorage > browser > 'en'
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window === "undefined") return "en";
    const stored = localStorage.getItem(STORAGE_KEY) as Language | null;
    if (stored && ["en", "es", "zh", "pt", "ru"].includes(stored)) return stored;
    // For first-time visitors we optimistically use browser language
    // (will be overridden by geo lookup below if it disagrees)
    return detectFromBrowser();
  });

  const [isDetecting, setIsDetecting] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return !localStorage.getItem(STORAGE_KEY);
  });

  useEffect(() => {
    // If user already has a manual preference, skip geo lookup entirely
    if (localStorage.getItem(STORAGE_KEY)) {
      setIsDetecting(false);
      return;
    }

    let cancelled = false;
    (async () => {
      // Use cached country if we've looked it up before this session
      const cached = sessionStorage.getItem(GEO_CACHE_KEY);
      const country = cached || (await fetchCountryCode());
      if (cancelled) return;

      if (country) {
        sessionStorage.setItem(GEO_CACHE_KEY, country);
        const detected: Language = SPANISH_COUNTRIES.has(country) ? "es" : detectFromBrowser();
        setLanguageState(detected);
        console.log(`[geo] Detected country=${country}, language=${detected}`);
      } else {
        // Geo failed — keep the browser-language fallback we set initially
        console.log("[geo] Geo lookup failed, using browser language");
      }
      setIsDetecting(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEY, lang);
  };

  return { language, setLanguage, isDetecting };
};
