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
import { Suspense, lazy } from "react";
import LoadingSpinner from "@/components/LoadingSpinner";
const Index = lazy(() => import("./pages/Index"));
const Store = lazy(() => import("./pages/store"));
const Download = lazy(() => import("./pages/Download"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const Licensing = lazy(() => import("./pages/Licensing"));
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

    if (!("IntersectionObserver" in window)) {
      showAll();
      return;
    }

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

    const observeNew = () => {
      document
        .querySelectorAll<HTMLElement>(".reveal:not(.reveal-bound)")
        .forEach((n) => {
          n.classList.add("reveal-bound");
          io.observe(n);
        });
    };

    // Initial pass (after a microtask & next frame to allow lazy content to mount)
    observeNew();
    requestAnimationFrame(() => observeNew());
    setTimeout(observeNew, 120); // safety pass for slower mounts

    // MutationObserver to catch dynamically inserted nodes (e.g. lazy route content)
    const mo = new MutationObserver(() => observeNew());
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      mo.disconnect();
      io.disconnect();
    };
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
            <Suspense
              fallback={
                <div className="flex items-center justify-center min-h-[40vh]">
                  <LoadingSpinner size="lg" />
                </div>
              }
            >
              <RouteFade>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/store" element={<Store />} />
                  <Route path="/download" element={<Download />} />
                  <Route path="/privacy" element={<Privacy />} />
                  <Route path="/terms" element={<Terms />} />
                  <Route path="/licensing" element={<Licensing />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </RouteFade>
            </Suspense>
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
