import React from "react";
import clsx from "clsx";
import { Button } from "@/components/ui/button";
import studioVideo from "@/assets/studio.mp4";

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
  const scrollToBeats = () => {
    document.getElementById("beats")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative min-h-[66vh] flex items-center justify-center py-8 bg-black overflow-hidden w-full">
      <video
        src={studioVideo}
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-70"
      />
      {/* Faint #0B0F1A overlay to match contact form */}
      <div className="absolute inset-0 w-full h-full bg-[#0B0F1A] opacity-40 pointer-events-none z-10" />
      {/* Gradient overlay at bottom */}
      <div className="pointer-events-none absolute bottom-0 w-full h-24 bg-gradient-to-b from-transparent to-black z-20" />
      <div className="relative z-30 flex flex-col items-center w-full">
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-white mb-4">
          Premium beats for the modern sound
        </h1>
        <div className="flex-1" />
        <Button
          size="lg"
          className="mt-8 px-8 py-3 bg-white/90 text-black font-semibold rounded shadow hover:bg-white transition-all duration-200 ease-in-out hover:scale-105"
          onClick={scrollToBeats}
        >
          Explore Beats
        </Button>
      </div>
    </section>
  );
};

export default HeroSection;
