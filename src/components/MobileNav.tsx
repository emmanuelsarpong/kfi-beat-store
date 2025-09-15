import React from "react";
import { Home, Grid3X3, ShoppingCart, Mail } from "lucide-react";
import {
  Link,
  useLocation,
  useInRouterContext,
  useNavigate,
} from "react-router-dom";

const NavItem: React.FC<{
  to: string;
  label: string;
  icon: React.ReactNode;
}> = ({ to, label, icon }) => {
  const { pathname } = useLocation();
  const active = pathname === to || (to !== "/" && pathname.startsWith(to));
  return (
    <Link
      to={to}
      className={`flex flex-col items-center gap-1 px-3 py-2 rounded-md ${
        active ? "text-white" : "text-zinc-400"
      }`}
    >
      {icon}
      <span className="text-[11px] font-medium">{label}</span>
    </Link>
  );
};

const MobileNav: React.FC = () => {
  const hasRouter = useInRouterContext();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  if (!hasRouter) return null;
  const goToAnchor = (hash: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    const go = () => {
      const id = hash.replace("#", "");
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    };
    if (pathname !== "/") {
      navigate("/");
      setTimeout(go, 120);
    } else {
      go();
    }
  };
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-zinc-950/90 backdrop-blur border-t border-zinc-800">
      <div className="max-w-3xl mx-auto grid grid-cols-4 py-2 pb-[max(env(safe-area-inset-bottom),0.5rem)]">
        <NavItem to="/" label="Home" icon={<Home className="w-5 h-5" />} />
        <button
          onClick={goToAnchor("#beats")}
          className="flex flex-col items-center gap-1 px-3 py-2 rounded-md text-zinc-400"
        >
          <Grid3X3 className="w-5 h-5" />
          <span className="text-[11px] font-medium">Beats</span>
        </button>
        <button
          type="button"
          className="flex flex-col items-center gap-1 px-3 py-2 rounded-md text-zinc-400"
          aria-disabled
        >
          <ShoppingCart className="w-5 h-5" />
          <span className="text-[11px] font-medium">Cart</span>
        </button>
        <button
          onClick={goToAnchor("#contact")}
          className="flex flex-col items-center gap-1 px-3 py-2 rounded-md text-zinc-400"
        >
          <Mail className="w-5 h-5" />
          <span className="text-[11px] font-medium">Contact</span>
        </button>
      </div>
    </nav>
  );
};

export default MobileNav;
