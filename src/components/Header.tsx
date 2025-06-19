import { ExternalLink } from "lucide-react";
import kfiLogo from "@/assets/logo.png";
import { useState } from "react";
import { Menu, X } from "lucide-react";

const Header = () => {
  const [open, setOpen] = useState(false);

  return (
    <header className="border-b border-gray-800 bg-black/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-2 max-w-7xl">
        <div className="flex items-center justify-between">
          <img src={kfiLogo} alt="KFI Logo" className="h-10 object-contain" />
          <nav className="hidden md:flex items-center space-x-8">
            <a
              href="#beats"
              className="text-gray-300 hover:text-white transition-colors font-medium"
            >
              Beats
            </a>
            <a
              href="#contact"
              className="text-gray-300 hover:text-white transition-colors font-medium"
            >
              Contact
            </a>
            <a
              href="https://instagram.com/thisiskfi"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-300 hover:text-white transition-colors flex items-center gap-1 font-medium"
            >
              Instagram <ExternalLink className="h-3 w-3" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center min-h-screen">
          {/* Strong blurry overlay */}
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-[12px]"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          {/* Centered modal menu */}
          <div className="relative z-10 flex flex-col items-center justify-center w-full h-full">
            <button
              className="fixed top-4 right-4 text-white p-2 z-50"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              style={{ background: "none", border: "none", marginTop: -8 }}
            >
              <X className="h-7 w-7" />
            </button>
            {/* Menu links */}
            <nav className="flex flex-col items-center space-y-8">
              <a
                href="#beats"
                className="text-3xl font-bold text-white"
                onClick={() => setOpen(false)}
              >
                Beats
              </a>
              <a
                href="#contact"
                className="text-3xl font-bold text-white"
                onClick={() => setOpen(false)}
              >
                Contact
              </a>
              <a
                href="https://instagram.com/thisiskfi"
                target="_blank"
                rel="noopener noreferrer"
                className="text-3xl font-bold text-white"
                onClick={() => setOpen(false)}
              >
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
