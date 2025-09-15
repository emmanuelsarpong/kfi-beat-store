import React from "react";
import kfiLogo from "@/assets/logo.png";
import MiniPlayer from "@/components/MiniPlayer";

// 2026+ Modern Footer with integrated layout harmony & micro-interactions
const Footer = () => {
  const year = new Date().getFullYear();
  return (
    <footer className="relative mt-20 selection:bg-white/10">
      {/* Top luminous gradient hairline */}
      <div className="footer-glow-line after:absolute after:inset-0 after:bg-[radial-gradient(circle_at_30%_120%,rgba(255,255,255,0.06),transparent_60%)]" />

      {/* Main footer shell */}
      <div className="footer-glass text-zinc-400/90">
        <div className="relative z-10 mx-auto px-4 md:px-6 max-w-7xl">
          {/* Grid: 12 columns from md upward for precision placement */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-8 md:gap-6 py-8 md:py-10">
            {/* Brand + tagline */}
            <div className="md:col-span-3 flex flex-col gap-4 items-center md:items-start text-center md:text-left">
              <div className="flex items-center gap-3">
                <img
                  src={kfiLogo}
                  alt="KFI Logo"
                  className="h-8 w-auto object-contain drop-shadow-[0_0_6px_rgba(255,255,255,0.12)]"
                />
                <span className="text-sm font-medium tracking-wide bg-gradient-to-r from-zinc-200 via-white to-zinc-300 bg-clip-text text-transparent">
                  KFI
                </span>
              </div>
              <p className="text-xs leading-relaxed max-w-[240px] text-zinc-400/80">
                Premium, future-forward sound beds crafted for artists & creators seeking atmospheric impact and replay value.
              </p>
              <div className="flex items-center gap-3 text-[11px] font-medium tracking-wide">
                <a
                  href="https://instagram.com/thisiskfi"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-link subtle"
                >
                  Instagram
                </a>
                <span className="text-zinc-600">/</span>
                <a href="mailto:collab@kfi.io" className="footer-link subtle">
                  collab@kfi.io
                </a>
              </div>
            </div>

            {/* Navigation clusters */}
            <div className="md:col-span-3 grid grid-cols-2 gap-6 text-sm place-content-start">
              <div className="flex flex-col gap-3">
                <span className="footer-label">Explore</span>
                <a href="#beats" className="footer-link">
                  🔥 Beat Catalog
                </a>
                <a href="/store" className="footer-link">
                  🎧 Browse Store
                </a>
                <a href="#contact" className="footer-link">
                  ✉️ Contact
                </a>
              </div>
              <div className="flex flex-col gap-3">
                <span className="footer-label">Legal</span>
                <a href="/privacy" className="footer-link">
                  Privacy
                </a>
                <a href="/terms" className="footer-link">
                  Terms
                </a>
                <a href="/licensing" className="footer-link">
                  Licensing
                </a>
              </div>
            </div>

            {/* Player Core */}
            <div className="md:col-span-6 flex flex-col items-center md:items-end gap-4">
              <div className="w-full md:max-w-xl relative group/footer-player">
                <div className="pointer-events-none absolute -inset-3 rounded-2xl bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-amber-400/10 opacity-0 group-hover/footer-player:opacity-100 blur-xl transition-opacity" />
                <MiniPlayer mode="footer" />
                <div className="absolute -bottom-4 left-0 text-[10px] tracking-wide uppercase text-zinc-500 hidden md:block">
                  Live Preview Engine
                </div>
              </div>
              <div className="flex gap-4 md:gap-6 text-[11px] text-zinc-500/70">
                <span className="hover:text-zinc-300 transition-colors">v1.0.0</span>
                <span className="hover:text-zinc-300 transition-colors">Status: Live</span>
              </div>
            </div>
          </div>

          {/* Lower meta bar */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-t border-white/5 py-4 text-[10px] md:text-[11px] text-zinc-600/80">
            <div className="flex items-center gap-2">
              <span className="font-medium tracking-wide text-zinc-400/90">
                © {year} KFI Music
              </span>
              <span className="hidden sm:inline">•</span>
              <span className="text-zinc-500">All rights reserved.</span>
            </div>
            <div className="flex items-center gap-4">
              <a href="/changelog" className="footer-link subtle">Changelog</a>
              <a href="/roadmap" className="footer-link subtle">Roadmap</a>
              <a href="/support" className="footer-link subtle">Support</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
