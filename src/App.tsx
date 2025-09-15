import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import React from "react";
import Index from "./pages/Index";
import Store from "./pages/store";
import NotFound from "./pages/NotFound";
import MiniPlayer from "./components/MiniPlayer";
import { PlayerProvider } from "@/hooks/PlayerProvider";
import CookieBanner from "./components/CookieBanner";
import { FavoritesProvider } from "@/hooks/useFavorites";

const queryClient = new QueryClient();

const RouteFade: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  return (
    <div key={location.pathname} className="animate-fade-in">
      {children}
    </div>
  );
};

// Observe `.reveal` elements and add `.is-visible` when they enter the viewport.
// Updated to re-run on route changes so newly navigated pages reveal content.
const RevealManager: React.FC = () => {
  const location = useLocation();
  React.useEffect(() => {
    const showAll = () => {
      document.querySelectorAll<HTMLElement>(".reveal").forEach((el) => {
        el.classList.add("is-visible");
      });
    };

    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              io.unobserve(entry.target);
            }
          });
        },
        { root: null, rootMargin: "0px 0px -10% 0px", threshold: 0.1 }
      );

      const nodes = document.querySelectorAll<HTMLElement>(".reveal");
      nodes.forEach((n) => io.observe(n));

      // In case elements are already in view on mount
      requestAnimationFrame(() => {
        nodes.forEach((n) => {
          const rect = n.getBoundingClientRect();
          if (rect.top < window.innerHeight && rect.bottom > 0) {
            n.classList.add("is-visible");
            io.unobserve(n);
          }
        });
      });

      return () => io.disconnect();
    }

    // Fallback for older environments
    showAll();
    return;
  }, [location.pathname]);
  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <PlayerProvider>
        <FavoritesProvider>
          <Toaster />
          <Sonner />
          <Router>
            <RouteFade>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/store" element={<Store />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </RouteFade>
            <RevealManager />
            {/* Mobile bottom nav removed for responsive website design */}
          </Router>
          <CookieBanner />
        </FavoritesProvider>
      </PlayerProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
