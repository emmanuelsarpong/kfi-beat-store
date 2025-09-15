import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BeatCard from "@/components/BeatCard";
import BPMFilter from "@/components/BPMFilter";

const beats = [
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
      "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?w=300&h=300&fit=crop",
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
      "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&h=300&fit=crop",
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
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=300&h=300&fit=crop",
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
      "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=300&h=300&fit=crop",
  },
  {
    id: "7",
    title: "Sunset Vibes",
    genre: "Lo-fi",
    bpm: 85,
    mood: "Relaxed",
    price: 19.99,
    audioUrl: "/api/placeholder-audio",
    coverImage:
      "https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=300&h=300&fit=crop",
  },
  {
    id: "8",
    title: "Night Runner",
    genre: "Synthwave",
    bpm: 122,
    mood: "Retro",
    price: 31.99,
    audioUrl: "/api/placeholder-audio",
    coverImage:
      "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?w=300&h=300&fit=crop",
  },
  {
    id: "9",
    title: "Golden Hour",
    genre: "Pop",
    bpm: 100,
    mood: "Uplifting",
    price: 26.99,
    audioUrl: "/api/placeholder-audio",
    coverImage:
      "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?w=300&h=300&fit=crop",
  },
  {
    id: "10",
    title: "Deep Space",
    genre: "Ambient",
    bpm: 60,
    mood: "Ethereal",
    price: 22.99,
    audioUrl: "/api/placeholder-audio",
    coverImage:
      "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?w=300&h=300&fit=crop",
  },
  {
    id: "11",
    title: "Bounce Back",
    genre: "Hip Hop",
    bpm: 95,
    mood: "Confident",
    price: 28.99,
    audioUrl: "/api/placeholder-audio",
    coverImage:
      "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&h=300&fit=crop",
  },
  {
    id: "12",
    title: "Electric Avenue",
    genre: "Electronic",
    bpm: 128,
    mood: "Vibrant",
    price: 36.99,
    audioUrl: "/api/placeholder-audio",
    coverImage:
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&h=300&fit=crop",
  },
  {
    id: "13",
    title: "Cloud Surfing",
    genre: "Lo-fi",
    bpm: 78,
    mood: "Chill",
    price: 18.99,
    audioUrl: "/api/placeholder-audio",
    coverImage:
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=300&h=300&fit=crop",
  },
  {
    id: "14",
    title: "Pulse",
    genre: "House",
    bpm: 124,
    mood: "Groovy",
    price: 33.99,
    audioUrl: "/api/placeholder-audio",
    coverImage:
      "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?w=300&h=300&fit=crop",
  },
  {
    id: "15",
    title: "Dreamcatcher",
    genre: "Ambient",
    bpm: 72,
    mood: "Peaceful",
    price: 21.99,
    audioUrl: "/api/placeholder-audio",
    coverImage:
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=300&h=300&fit=crop",
  },
  {
    id: "16",
    title: "Starlight",
    genre: "Pop",
    bpm: 105,
    mood: "Bright",
    price: 27.99,
    audioUrl: "/api/placeholder-audio",
    coverImage:
      "https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=300&h=300&fit=crop",
  },
  {
    id: "17",
    title: "Afterglow",
    genre: "Synthwave",
    bpm: 115,
    mood: "Nostalgic",
    price: 30.99,
    audioUrl: "/api/placeholder-audio",
    coverImage:
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&h=300&fit=crop",
  },
  {
    id: "18",
    title: "Groove Machine",
    genre: "House",
    bpm: 126,
    mood: "Funky",
    price: 35.99,
    audioUrl: "/api/placeholder-audio",
    coverImage:
      "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&h=300&fit=crop",
  },
  {
    id: "19",
    title: "Rainy Days",
    genre: "Lo-fi",
    bpm: 82,
    mood: "Moody",
    price: 20.99,
    audioUrl: "/api/placeholder-audio",
    coverImage:
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=300&h=300&fit=crop",
  },
  {
    id: "20",
    title: "Firestarter",
    genre: "Trap",
    bpm: 150,
    mood: "Intense",
    price: 37.99,
    audioUrl: "/api/placeholder-audio",
    coverImage:
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop",
  },
];

const uniqueGenres = [...new Set(beats.map((beat) => beat.genre))];

const Store = () => {
  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState("");
  const [bpmRange, setBpmRange] = useState<[number, number]>([1, 300]);
  const [bpmExact, setBpmExact] = useState<number | "">("");

  const filteredBeats = beats.filter((beat) => {
    const matchesSearch =
      beat.title.toLowerCase().includes(search.toLowerCase()) ||
      beat.genre.toLowerCase().includes(search.toLowerCase());
    const matchesGenre = genre ? beat.genre === genre : true;
    const matchesBpm =
      bpmExact !== ""
        ? beat.bpm === Number(bpmExact)
        : beat.bpm >= bpmRange[0] && beat.bpm <= bpmRange[1];
    return matchesSearch && matchesGenre && matchesBpm;
  });

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Header />
      <main className="flex-1 w-full">
        <section className="py-8 px-2 sm:px-4 max-w-7xl mx-auto w-full">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-6 text-center">
            All Beats
          </h1>
          {/* Responsive Search Bar */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-8 justify-center">
            <input
              type="text"
              placeholder="Search by title or genre..."
              className="px-4 py-2 rounded bg-zinc-900 text-white border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-500 w-full sm:w-72"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              aria-label="Filter by genre"
              className="px-4 py-2 rounded bg-zinc-900 text-white border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-500 w-full sm:w-48"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
            >
              <option value="">All Genres</option>
              {uniqueGenres.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
            <BPMFilter
              bpmRange={bpmRange}
              setBpmRange={setBpmRange}
              bpmExact={bpmExact}
              setBpmExact={setBpmExact}
            />
          </div>
          {/* Responsive Beats Grid */}
          <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
            {filteredBeats.length > 0 ? (
              filteredBeats.map((beat) => (
                <BeatCard key={beat.id} beat={beat} />
              ))
            ) : (
              <div className="col-span-full text-center text-zinc-400">
                No beats found.
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Store;
