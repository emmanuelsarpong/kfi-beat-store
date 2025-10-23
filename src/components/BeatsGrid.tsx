import React from "react";
import BeatCard from "./BeatCard";
import { beats as beatsData } from "@/data/beats";

// Only show the most recent 6 beats. We treat the order in beats.ts as recency.
const beats = beatsData.slice(0, 6);

const BeatsGrid = () => {
  return (
    <section id="beats" className="py-16 px-4 scroll-mt-24">
      <div className="container mx-auto max-w-7xl p-0 md:px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 tracking-tight">
          <span className="bg-gradient-to-r from-zinc-200 via-white to-zinc-300 bg-clip-text text-transparent">
            🔥 Premium Catalog
          </span>
        </h2>
        <p className="text-center text-sm md:text-base text-zinc-400 max-w-2xl mx-auto mb-10 px-6 md:px-8">
          Handcrafted sonic landscapes engineered for replay value. Browse,
          preview & build your next record faster.
        </p>

        {/* Restored simple responsive grid (6 cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 md:gap-10">
          {beats.map((beat) => (
            <div key={beat.id} className="reveal">
              <BeatCard beat={beat} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BeatsGrid;
