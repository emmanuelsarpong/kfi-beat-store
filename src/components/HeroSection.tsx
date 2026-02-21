import React from "react";
import clsx from "clsx";
import { Button } from "@/components/ui/button";
import studioVideo from "@/assets/studio.mp4";
import { useNavigate } from "react-router-dom";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "cart" | "secondary";
};

export const CustomButton: React.FC<ButtonProps> = ({
  size = "md",
  variant = "primary",
  className,
  children,
  ...props
}) => {
  const base =
    "inline-flex items-center justify-center font-semibold rounded-lg transition focus:outline-none focus:ring-2 focus:ring-offset-2";
  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-3 text-lg",
  };
  const variants = {
    primary:
      "bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow hover:from-purple-600 hover:to-blue-600",
    cart: "bg-black text-white shadow hover:bg-zinc-900",
    secondary: "bg-zinc-200 text-black shadow hover:bg-zinc-300",
  };

  return (
    <button
      className={clsx(base, sizes[size], variants[variant], className)}
      {...props}
    >
      {children}
    </button>
  );
};

const HeroSection = () => {
  const navigate = useNavigate();

  const goToStore = () => {
    navigate("/store");
  };

  return (
    <section className="relative min-h-[66vh] flex items-center justify-center py-16 md:py-24 bg-black overflow-hidden w-full">
      <video
        src={studioVideo}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover opacity-70"
      />
      {/* Faint #0B0F1A overlay to match contact form */}
      <div className="absolute inset-0 w-full h-full bg-[#0B0F1A] opacity-40 pointer-events-none z-10" />
      {/* Gradient overlay at bottom */}
      <div className="pointer-events-none absolute bottom-0 w-full h-24 bg-gradient-to-b from-transparent to-black z-20" />
      <div className="relative z-30 flex flex-col items-center w-full max-w-7xl mx-auto px-6 md:px-8">
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-white mb-4 text-center px-2 md:px-4">
          Premium Beats. No Exceptions.
        </h1>
        <div className="flex-1" />
        {/* CTA with subtle aura and synced waves behind */}
        <div className="relative mt-10 group">
          {/* Glow aura (warm) behind button */}
          <div className="pointer-events-none absolute -inset-4 md:-inset-5 rounded-2xl bg-gradient-to-r from-rose-500/25 via-orange-500/25 to-amber-400/25 blur-xl opacity-30 group-hover:opacity-40 transition-opacity animate-cta-pulse" />
          {/* Waves behind button as atmospheric motion */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-10 opacity-25 animate-cta-pulse">
            <div className="kfi-cta-waves scale-90 md:scale-100">
              <div className="flex items-end justify-center gap-1.5">
                {Array.from({ length: 16 }).map((_, i) => (
                  <span key={i} className="kfi-eq-bar" />
                ))}
              </div>
            </div>
          </div>
          <Button
            size="lg"
            className="relative z-20 px-9 py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-black via-zinc-900 to-zinc-800 hover:from-zinc-900 hover:via-zinc-800 hover:to-zinc-700 shadow-lg hover:shadow-amber-500/25 hover:scale-105 btn-ripple ring-1 ring-white/10 focus-visible:ring-2 focus-visible:ring-amber-400/50"
            onClick={goToStore}
          >
            Explore Beats
          </Button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
