import { Heart, Instagram, ShoppingBag } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import kfiLogo from "@/assets/logo.png";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { useLocation, useNavigate, Link } from "react-router-dom";

const Header = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { items, openDrawer } = useCart();
  const cartCount = items.length;

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (location.pathname === "/") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      navigate("/");
    }
  };

  const handleContactClick = (e?: React.MouseEvent) => {
    e?.preventDefault?.();
    if (location.pathname === "/") {
      // Already on home, just scroll
      const section = document.getElementById("contact");
      if (section) {
        section.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      // Navigate home, then scroll after navigation
      navigate("/", { replace: false });
      setTimeout(() => {
        const section = document.getElementById("contact");
        if (section) {
          section.scrollIntoView({ behavior: "smooth" });
        }
      }, 100); // Delay to ensure DOM updates
    }
  };

  return (
    <header className="border-b border-gray-800 bg-black/80 backdrop-blur-sm sticky top-0 layer-sticky">
      <div className="container mx-auto px-4 py-2 max-w-7xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <a
              href="/"
              onClick={handleLogoClick}
              className="flex items-center gap-2 cursor-pointer"
            >
              <img
                src={kfiLogo}
                alt="KFI Logo"
                className="h-10 w-10 object-contain"
                decoding="async"
                loading="lazy"
              />
            </a>
          </div>
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              to="/store"
              className="text-gray-300 hover:text-white transition-colors font-medium"
              onClick={() => setOpen(false)}
            >
              Store
            </Link>
            <Link
              to="/favorites"
              className="text-gray-300 hover:text-white transition-colors font-medium flex items-center gap-1"
              onClick={() => setOpen(false)}
            >
              <Heart className="h-4 w-4" /> Favorites
            </Link>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                openDrawer();
              }}
              className="text-gray-300 hover:text-white transition-colors font-medium inline-flex items-center gap-2"
              aria-label={`Open cart${cartCount ? `, ${cartCount} items` : ""}`}
            >
              <span className="relative inline-flex">
                <ShoppingBag className="h-4 w-4" />
                {cartCount > 0 ? (
                  <span className="absolute -top-2 -right-2 min-w-[16px] h-[16px] px-0.5 flex items-center justify-center rounded-full bg-amber-400/90 text-[9px] font-bold text-black leading-none tabular-nums">
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                ) : null}
              </span>
              Cart
            </button>
            <a
              href="/#contact"
              onClick={handleContactClick}
              className="text-gray-300 hover:text-white transition-colors font-medium"
            >
              Contact
            </a>
            <a
              href="https://instagram.com/thisiskfi"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="text-gray-300 hover:text-white transition-colors inline-flex items-center justify-center h-5 w-5"
            >
              <Instagram className="h-4 w-4" />
            </a>
          </nav>
          <button
            className={`md:hidden flex items-center justify-center p-2 ${
              open ? "invisible" : ""
            }`}
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="text-white" size={28} />
          </button>
        </div>
      </div>
      {open && (
        <div className="fixed inset-0 layer-nav-overlay flex items-center justify-center min-h-screen md:hidden">
          {/* Strong blurry overlay */}
          <div
            className="absolute inset-0 bg-black/85 backdrop-blur-[20px]"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          {/* Centered modal menu */}
          <div className="relative layer-nav-panel flex flex-col items-center justify-center w-full h-full">
            <button
              className="fixed top-4 right-4 layer-nav-panel text-white p-2 bg-transparent border-0 -mt-2"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
            >
              <X className="h-7 w-7" />
            </button>
            {/* Menu links */}
            <nav className="flex flex-col items-center space-y-8">
              <Link
                to="/store"
                className="text-3xl font-bold text-white"
                onClick={() => setOpen(false)}
              >
                Store
              </Link>
              <Link
                to="/favorites"
                className="text-3xl font-bold text-white"
                onClick={() => setOpen(false)}
              >
                Favorites
              </Link>
              <button
                type="button"
                className="text-3xl font-bold text-white inline-flex items-center gap-3"
                onClick={() => {
                  setOpen(false);
                  openDrawer();
                }}
              >
                <ShoppingBag className="h-8 w-8" />
                Cart
                {cartCount > 0 ? (
                  <span className="text-lg font-semibold text-amber-300">
                    ({cartCount})
                  </span>
                ) : null}
              </button>
              <a
                href="/#contact"
                className="text-3xl font-bold text-white"
                onClick={() => {
                  setOpen(false);
                  handleContactClick();
                }}
              >
                Contact
              </a>
              <a
                href="https://instagram.com/thisiskfi"
                target="_blank"
                rel="noopener noreferrer"
                className="text-3xl font-bold text-white inline-flex items-center gap-3"
                onClick={() => setOpen(false)}
              >
                <Instagram className="h-7 w-7" />
                Instagram
              </a>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
