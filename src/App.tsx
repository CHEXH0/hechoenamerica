
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TranslationProvider } from "@/contexts/TranslationContext";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Treats from "./pages/Treats";
import ComingSoon from "./pages/ComingSoon";
import Artist from "./pages/Artist";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import Profile from "./pages/Profile";
import Purchases from "./pages/Purchases";
import PaymentSuccess from "./pages/PaymentSuccess";

const queryClient = new QueryClient();

// Force refresh - treats marketplace

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TranslationProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/treats" element={<Treats />} />
              <Route path="/coming-soon" element={<ComingSoon />} />
              <Route path="/artist/:id" element={<Artist />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/purchases" element={<Purchases />} />
              <Route path="/payment-success" element={<PaymentSuccess />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </TranslationProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
