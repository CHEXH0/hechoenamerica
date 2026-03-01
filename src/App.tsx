
import { lazy, Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ScrollToTop from "@/components/ScrollToTop";
import TranslateHelper from "@/components/TranslateHelper";
import { TranslationProvider } from "@/contexts/TranslationContext";
import { AuthProvider } from "@/contexts/AuthContext";
import CookieConsent from "@/components/CookieConsent";
import { toast } from "sonner";

// Eagerly load the landing page for fast first paint
import Index from "./pages/Index";

// Lazy load all other pages — only downloaded when user navigates to them
const Treats = lazy(() => import("./pages/Treats"));
const ComingSoon = lazy(() => import("./pages/ComingSoon"));
const Producer = lazy(() => import("./pages/Producer"));
const Auth = lazy(() => import("./pages/Auth"));
const Admin = lazy(() => import("./pages/Admin"));
const Profile = lazy(() => import("./pages/Profile"));
const Purchases = lazy(() => import("./pages/Purchases"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const PurchaseConfirmation = lazy(() => import("./pages/PurchaseConfirmation"));
const GenerateSong = lazy(() => import("./pages/GenerateSong"));
const MyProjects = lazy(() => import("./pages/MyProjects"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const ProducerApplication = lazy(() => import("./pages/ProducerApplication"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const ProducerProfile = lazy(() => import("./pages/ProducerProfile"));
const SignContract = lazy(() => import("./pages/SignContract"));
const Producers = lazy(() => import("./pages/Producers"));
const HEAProjects = lazy(() => import("./pages/HEAProjects"));

// Loading fallback for lazy-loaded routes
const PageLoader = () => (
  <div className="min-h-screen bg-black flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // Data stays fresh for 2 minutes — prevents refetch storms
      gcTime: 1000 * 60 * 10, // Cache kept for 10 minutes
      refetchOnWindowFocus: false, // Don't refetch when user tabs back
      retry: 2, // Retry failed requests twice
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    },
  },
});

const App = () => {
  // Global safety net: catch unhandled promise rejections to prevent white screens
  useEffect(() => {
    const handler = (event: PromiseRejectionEvent) => {
      console.error("Unhandled rejection:", event.reason);
      toast.error("An error occurred. Please try again.");
      event.preventDefault();
    };
    window.addEventListener("unhandledrejection", handler);
    return () => window.removeEventListener("unhandledrejection", handler);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TranslationProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <ScrollToTop />
              <TranslateHelper />
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/treats" element={<Treats />} />
                  <Route path="/coming-soon" element={<ComingSoon />} />
                  <Route path="/producer/:id" element={<Producer />} />
                  <Route path="/producers" element={<Producers />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/admin" element={<Admin />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/purchases" element={<Purchases />} />
                  <Route path="/payment-success" element={<PaymentSuccess />} />
                  <Route path="/purchase-confirmation" element={<PurchaseConfirmation />} />
                  <Route path="/generate-song" element={<GenerateSong />} />
                  <Route path="/my-projects" element={<MyProjects />} />
                  <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                  <Route path="/terms-of-service" element={<TermsOfService />} />
                  <Route path="/producer-application" element={<ProducerApplication />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/producer-profile" element={<ProducerProfile />} />
                  <Route path="/hea-projects" element={<HEAProjects />} />
                  <Route path="/sign-contract" element={<SignContract />} />
                </Routes>
              </Suspense>
              <CookieConsent />
            </BrowserRouter>
          </TooltipProvider>
        </TranslationProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
