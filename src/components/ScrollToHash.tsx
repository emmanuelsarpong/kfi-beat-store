import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// Smoothly scrolls to an element id when the URL contains a hash (e.g. /#contact).
// Works across route navigations and when content mounts lazily.
export default function ScrollToHash() {
  const location = useLocation();

  useEffect(() => {
    if (!location.hash) return;
    const id = location.hash.replace(/^#/, "");

    // Try immediately, then retry once on the next frame in case content is lazy-mounted
    const tryScroll = () => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        return true;
      }
      return false;
    };

    if (!tryScroll()) {
      requestAnimationFrame(() => {
        tryScroll();
      });
    }
  }, [location.pathname, location.hash]);

  return null;
}
