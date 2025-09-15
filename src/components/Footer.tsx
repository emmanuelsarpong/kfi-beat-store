import React from "react";
import kfiLogo from "@/assets/logo.png";
import MiniPlayer from "@/components/MiniPlayer";

const Footer = () => (
  <footer className="relative mt-16">
    {/* Animated thin gradient divider at top */}
    <div className="footer-glow-line" />

    {/* Slim, modern glass footer */}
    <div className="footer-glass text-gray-400">
      <div className="relative z-10 mx-auto px-4 max-w-7xl">
        {/* Responsive grid: stack on mobile, 3 columns from md+ */}
        <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4 py-3">
          {/* Left: Logo only (no tagline) */}
          <div className="flex items-center gap-2 min-w-0 justify-center md:justify-start">
            <img
              src={kfiLogo}
              alt="KFI Logo"
              className="h-6 w-auto object-contain"
            />
            <span className="text-xs md:text-sm text-zinc-300/90 hover:text-zinc-100 transition-colors truncate">
              Premium Beats.
            </span>
          </div>

          {/* Center: Player (slightly smaller, dock-like) */}
          <div className="flex justify-center order-last md:order-none">
            <div className="relative group mb-2">
              {/* optional float above footer */}
              <div className="kfi-aura-warm thin rounded-2xl" />
              <div className="relative z-10 transition-all duration-300 ease-out hover:shadow-[0_0_10px_rgba(255,0,128,0.4)] rounded-xl">
                <MiniPlayer mode="footer" />
              </div>
            </div>
          </div>

          {/* Right: Navigation links */}
          <nav className="flex justify-center md:justify-end items-center gap-4 md:gap-6 text-sm">
            <a href="#beats" className="kfi-link text-zinc-300/90">
              Beats
            </a>
            <a href="#contact" className="kfi-link text-zinc-300/90">
              Contact
            </a>
            <a href="/privacy" className="kfi-link text-zinc-300/90">
              Privacy
            </a>
            <a href="/terms" className="kfi-link text-zinc-300/90">
              Terms
            </a>
            <a
              href="https://instagram.com/thisiskfi"
              target="_blank"
              rel="noopener noreferrer"
              className="kfi-link text-zinc-300/90"
            >
              @thisiskfi
            </a>
          </nav>
        </div>

        {/* Bottom: Copyright */}
        <div className="pb-2 text-center text-[10px] md:text-xs text-gray-500/80">
          © {new Date().getFullYear()} KFI Music. All rights reserved.
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
