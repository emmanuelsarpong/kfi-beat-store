import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Heart, Menu, Search, ShoppingBag, X } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useCart } from "@/hooks/useCart";
import { useFavorites } from "@/hooks/useFavorites";
import { cn } from "@/lib/utils";

const Header = () => {
  const [open, setOpen] = useState(false);
  const [compact, setCompact] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { items, openDrawer } = useCart();
  const { favorites } = useFavorites();
  const cartCount = items.length;
  const favCount = favorites.length;

  useEffect(() => {
    const onScroll = () => setCompact(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
    setSearchOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    if (!open) return;
    const { body } = document;
    const previous = body.style.overflow;
    body.style.overflow = "hidden";
    return () => {
      body.style.overflow = previous;
    };
  }, [open]);

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (location.pathname === "/") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      navigate("/");
    }
  };

  const goContact = (e?: React.MouseEvent) => {
    e?.preventDefault?.();
    setOpen(false);
    if (location.pathname === "/") {
      document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    navigate("/#contact");
  };

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const value = query.trim();
    navigate(value ? `/store?q=${encodeURIComponent(value)}` : "/store");
    setSearchOpen(false);
  };

  const navLink = (to: string, label: string, active?: boolean) => (
    <Link
      to={to}
      className={cn(
        "text-[13px] tracking-body text-[#6F6F69] hover:text-foreground",
        active && "text-foreground"
      )}
    >
      {label}
    </Link>
  );

  const menu =
    open && typeof document !== "undefined"
      ? createPortal(
          <div className="fixed inset-0 layer-nav-overlay lg:hidden">
            <div className="absolute inset-0 bg-[#F6F5F1]" />
            <div className="relative layer-nav-panel flex h-full flex-col px-6 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
              <div className="flex items-center justify-between">
                <span className="font-display tracking-[0.22em] text-sm">KFI</span>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close menu"
                  className="h-11 w-11 inline-flex items-center justify-center"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="mt-16 flex flex-col gap-7">
                <Link
                  to="/store"
                  onClick={() => setOpen(false)}
                  className="font-display text-[40px] tracking-display"
                >
                  Beats
                </Link>
                <Link
                  to="/favorites"
                  onClick={() => setOpen(false)}
                  className="font-display text-[40px] tracking-display"
                >
                  Favorites
                </Link>
                <Link
                  to="/about"
                  onClick={() => setOpen(false)}
                  className="font-display text-[40px] tracking-display"
                >
                  About
                </Link>
                <a
                  href="/#contact"
                  onClick={goContact}
                  className="font-display text-[40px] tracking-display"
                >
                  Contact
                </a>
              </nav>
              <div className="mt-auto flex flex-col gap-4 pb-4 text-sm text-[#6F6F69]">
                <a
                  href="https://instagram.com/thisiskfi"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setOpen(false)}
                >
                  Instagram
                </a>
                <button
                  type="button"
                  className="text-left"
                  onClick={() => {
                    setOpen(false);
                    openDrawer();
                  }}
                >
                  Cart{cartCount ? ` · ${cartCount}` : ""}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <header className="sticky top-0 layer-sticky border-b border-black/[0.06] bg-[#F6F5F1]/85 backdrop-blur-md pt-[env(safe-area-inset-top)]">
        <div
          className={cn(
            "container mx-auto max-w-7xl px-4 sm:px-6 flex items-center justify-between gap-3 lg:gap-4 transition-[height] duration-300",
            compact ? "h-14" : "h-14 lg:h-[68px]"
          )}
        >
          <a
            href="/"
            onClick={handleLogoClick}
            className="font-display text-[15px] tracking-[0.22em] text-foreground py-3"
          >
            KFI
          </a>

          <nav className="hidden lg:flex items-center gap-8">
            {navLink(
              "/store",
              "Beats",
              location.pathname.startsWith("/store") || location.pathname.startsWith("/beats")
            )}
            {navLink("/about", "About", location.pathname === "/about")}
            <a
              href="/#contact"
              onClick={goContact}
              className="text-[13px] text-[#6F6F69] hover:text-foreground"
            >
              Contact
            </a>
          </nav>

          <div className="flex items-center lg:gap-2">
            {searchOpen ? (
              <form onSubmit={submitSearch} className="hidden lg:flex items-center">
                <input
                  ref={searchRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search beats"
                  className="h-9 w-44 lg:w-56 bg-transparent border-b border-foreground/20 text-sm outline-none placeholder:text-[#999991]"
                />
              </form>
            ) : null}
            <button
              type="button"
              aria-label="Search beats"
              onClick={() => setSearchOpen((value) => !value)}
              className="inline-flex h-11 w-11 lg:h-9 lg:w-9 items-center justify-center text-[#6F6F69] hover:text-foreground"
            >
              <Search className="h-4 w-4" strokeWidth={1.7} />
            </button>
            <Link
              to="/favorites"
              aria-label="Saved beats"
              className="relative hidden lg:inline-flex h-9 w-9 items-center justify-center text-[#6F6F69] hover:text-foreground"
            >
              <Heart className="h-4 w-4" strokeWidth={1.7} />
              {favCount > 0 ? (
                <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-foreground" />
              ) : null}
            </Link>
            <button
              type="button"
              onClick={() => openDrawer()}
              aria-label={`Open cart${cartCount ? `, ${cartCount} items` : ""}`}
              className="relative inline-flex h-11 w-11 lg:h-9 lg:w-9 items-center justify-center text-[#6F6F69] hover:text-foreground"
            >
              <ShoppingBag className="h-4 w-4" strokeWidth={1.7} />
              {cartCount > 0 ? (
                <span className="absolute top-1.5 right-1.5 lg:-top-0.5 lg:-right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-foreground text-[9px] leading-4 text-background tabular-nums">
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              ) : null}
            </button>
            <button
              type="button"
              className="lg:hidden inline-flex h-11 w-11 items-center justify-center text-foreground"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" strokeWidth={1.6} />
            </button>
          </div>
        </div>

        {searchOpen ? (
          <form
            onSubmit={submitSearch}
            className="lg:hidden border-t border-black/[0.06] px-4 py-2"
          >
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search beats"
              className="h-11 w-full bg-transparent text-[16px] outline-none placeholder:text-[#999991]"
            />
          </form>
        ) : null}
      </header>
      {menu}
    </>
  );
};

export default Header;
