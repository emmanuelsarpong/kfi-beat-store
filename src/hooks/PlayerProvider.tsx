import React from "react";
import PlayerAudio from "@/components/PlayerAudio";

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Lightweight wrapper to mount the single PlayerAudio element at the app root.
  return (
    <>
      {children}
      <PlayerAudio />
    </>
  );
};
