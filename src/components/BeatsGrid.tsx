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
    <section id="beats" className="py-16 px-4">
      <div className="container mx-auto max-w-7xl p-0 md:px-4">
        <h3 className="text-3xl font-bold text-center mb-12">
          Latest{" "}
          <span className="bg-gradient-to-r from-zinc-300 via-zinc-400 to-zinc-200 bg-clip-text text-transparent font-semibold">
            Beats
          </span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {beats.map((beat) => (
            <BeatCard key={beat.id} beat={beat} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default BeatsGrid;
