import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Store from "./pages/store";
import NotFound from "./pages/NotFound";
import MiniPlayer from "./components/MiniPlayer";
import MobileNav from "./components/MobileNav";
import { PlayerProvider } from "@/hooks/PlayerProvider";
import CookieBanner from "./components/CookieBanner";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <PlayerProvider>
        <Toaster />
        <Sonner />
        <Router>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/store" element={<Store />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          {/* Components that need Router context should render inside Router */}
          <MobileNav />
        </Router>
        <MiniPlayer />
        <CookieBanner />
      </PlayerProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
