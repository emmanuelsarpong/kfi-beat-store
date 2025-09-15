import React from "react";
// import "./Header.css";
import { ExternalLink } from "lucide-react";
import kfiLogo from "@/assets/logo.png";

const Header = () => (
  <div className="header-container">
    <div className="logo-tagline">
      <div className="logo-box">
        <img
          src={kfiLogo}
          alt="KFI Logo"
          className="h-10 w-auto object-contain mr-3"
        />
        KFI
      </div>
      <span className="tagline">Premium beats for the modern sound</span>
    </div>
    <hr className="header-divider" />
  </div>
);

const Footer = () => (
  <footer className="relative bg-black text-gray-400 py-10 md:py-12 mt-12 border-t border-gray-800">
    {/* Watermark */}
    <div className="absolute inset-0 items-center justify-center opacity-5 z-0 text-8xl font-bold pointer-events-none select-none hidden md:flex md:items-center md:justify-center">
      <span>KFI</span>
    </div>
    <div className="relative z-10 container mx-auto px-4 max-w-7xl flex flex-col md:flex-row items-center justify-between">
      {/* Left: Logo & Tagline */}
      <div className="flex items-center mb-6 md:mb-0">
        <img
          src={kfiLogo}
          alt="KFI Logo"
          className="h-10 w-auto object-contain mr-3"
        />
        <span className="text-zinc-200 font-semibold">
          Premium beats for the modern sound
        </span>
      </div>
      {/* Right: Links */}
      <nav className="flex space-x-8">
        <a
          href="#beats"
          className="hover:text-white hover:underline transition-colors font-medium"
        >
          Beats
        </a>
        <a
          href="#contact"
          className="hover:text-white hover:underline transition-colors font-medium"
        >
          Contact
        </a>
        <a
          href="/privacy"
          className="hover:text-white hover:underline transition-colors font-medium"
        >
          Privacy
        </a>
        <a
          href="/terms"
          className="hover:text-white hover:underline transition-colors font-medium"
        >
          Terms
        </a>
        <a
          href="https://twitter.com/kfiaudio"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-white hover:underline transition-colors font-medium"
        >
          @thisiskfi
        </a>
      </nav>
    </div>
    {/* Bottom: Copyright */}
    <div className="relative z-10 mt-8 text-center text-xs text-gray-500">
      &copy; {new Date().getFullYear()} KFI Music. All rights reserved.
    </div>
  </footer>
);

export { Header, Footer };
export default Footer;
