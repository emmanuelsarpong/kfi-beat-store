import { ExternalLink } from "lucide-react";
import kfiLogo from "@/assets/logo.png";

const Header = () => {
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
        </div>
      </div>
    </header>
  );
};

export default Header;
