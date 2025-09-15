import React from "react";
import { Home, Grid3X3, ShoppingCart, Mail } from "lucide-react";
import { Link, useLocation, useInRouterContext } from "react-router-dom";

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
  if (!hasRouter) return null;
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-zinc-950/90 backdrop-blur border-t border-zinc-800">
      <div className="max-w-3xl mx-auto grid grid-cols-4 py-2">
        <NavItem to="/" label="Home" icon={<Home className="w-5 h-5" />} />
        <a
          href="#beats"
          className="flex flex-col items-center gap-1 px-3 py-2 rounded-md text-zinc-400"
        >
          <Grid3X3 className="w-5 h-5" />
          <span className="text-[11px] font-medium">Beats</span>
        </a>
        <a
          href="#"
          className="flex flex-col items-center gap-1 px-3 py-2 rounded-md text-zinc-400"
        >
          <ShoppingCart className="w-5 h-5" />
          <span className="text-[11px] font-medium">Cart</span>
        </a>
        <a
          href="#contact"
          className="flex flex-col items-center gap-1 px-3 py-2 rounded-md text-zinc-400"
        >
          <Mail className="w-5 h-5" />
          <span className="text-[11px] font-medium">Contact</span>
        </a>
      </div>
    </nav>
  );
};

export default MobileNav;
