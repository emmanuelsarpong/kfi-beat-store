import React from "react";
import clsx from "clsx";

export interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  label?: string;
  className?: string;
}

// Pure CSS ring spinner using Tailwind utilities
const sizeMap: Record<string, string> = {
  sm: "h-5 w-5 border-2",
  md: "h-8 w-8 border-3",
  lg: "h-12 w-12 border-4",
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "md",
  label = "Loading...",
  className,
}) => {
  return (
    <div
      role="status"
      aria-label={label}
      className={clsx(
        "flex items-center justify-center w-full h-full min-h-[120px]",
        className
      )}
    >
      <div
        className={clsx(
          "relative animate-spin rounded-full border-t-transparent border-white/60 border-solid",
          sizeMap[size] || sizeMap.md
        )}
      />
      <span className="sr-only">{label}</span>
    </div>
  );
};

export default LoadingSpinner;
