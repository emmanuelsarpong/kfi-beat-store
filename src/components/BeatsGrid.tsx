import React from "react";
import BeatCard from "./BeatCard";

interface Beat {
  id: string;
  title: string;
  genre: string;
  bpm: number;
  mood: string;
  price: number;
  audioUrl: string;
  coverImage?: string;
}

// Sample beats data
const beats: Beat[] = [
  {
    id: "1",
    title: "Midnight Drive",
    genre: "Trap",
    bpm: 140,
    mood: "Dark",
    price: 29.99,
    audioUrl: "/api/placeholder-audio",
    coverImage:
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop",
  },
  {
    id: "2",
    title: "Neon Dreams",
    genre: "Synthwave",
    bpm: 128,
    mood: "Atmospheric",
    price: 34.99,
    audioUrl: "/api/placeholder-audio",
    coverImage:
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&h=300&fit=crop",
  },
  {
    id: "3",
    title: "Urban Flow",
    genre: "Hip Hop",
    bpm: 90,
    mood: "Chill",
    price: 24.99,
    audioUrl: "/api/placeholder-audio",
    coverImage:
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop",
  },
  {
    id: "4",
    title: "Digital Pulse",
    genre: "Electronic",
    bpm: 132,
    mood: "Energetic",
    price: 39.99,
    audioUrl: "/api/placeholder-audio",
    coverImage:
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&h=300&fit=crop",
  },
  {
    id: "5",
    title: "Shadow Work",
    genre: "Trap",
    bpm: 145,
    mood: "Aggressive",
    price: 32.99,
    audioUrl: "/api/placeholder-audio",
    coverImage:
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop",
  },
  {
    id: "6",
    title: "Cosmic Drift",
    genre: "Ambient",
    bpm: 110,
    mood: "Dreamy",
    price: 27.99,
    audioUrl: "/api/placeholder-audio",
    coverImage:
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&h=300&fit=crop",
  },
];

const BeatsGrid = () => {
  return (
    <section id="beats" className="py-16 px-4 scroll-mt-24">
      <div className="container mx-auto max-w-7xl p-0 md:px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 tracking-tight">
          <span className="bg-gradient-to-r from-zinc-200 via-white to-zinc-300 bg-clip-text text-transparent">
            🔥 Premium Catalog
          </span>
        </h2>
        <p className="text-center text-sm md:text-base text-zinc-400 max-w-2xl mx-auto mb-10">
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
