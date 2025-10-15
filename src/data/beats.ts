// Centralized beats seed data. Eventually this could be replaced by an API call.
export interface BeatData {
  id: string;
  title: string;
  genre: string;
  bpm: number;
  mood: string;
  key?: string;
  price: number;
  audioUrl: string;
  coverImage?: string;
  paymentLink?: string;
}

// Helper to safely read Vite env at module init without using any
const VITE_SERVER_URL: string | undefined =
  typeof import.meta !== "undefined" &&
  (import.meta as unknown as { env?: Record<string, string> }).env
    ? (import.meta as unknown as { env: Record<string, string> }).env
        .VITE_SERVER_URL
    : undefined;

export const beats: BeatData[] = [
  // Newest: Sunset
  {
    id: "29",
    title: "Sunset",
    genre: "R&B",
    bpm: 98,
    mood: "Chill",
    price: 29.99,
    audioUrl:
      "https://dohbpspufehpuyfskahm.supabase.co/storage/v1/object/public/beats/sunset/Sunset.mp3",
  },
  // Newest: Wait
  {
    id: "28",
    title: "Wait",
    genre: "Hip Hop",
    bpm: 99,
    mood: "Vibey",
    price: 31.99,
    audioUrl:
      "https://dohbpspufehpuyfskahm.supabase.co/storage/v1/object/public/beats/wait/Wait.mp3",
  },
  // Newest: Roses
  {
    id: "27",
    title: "Roses",
    genre: "Trap / R&B",
    bpm: 110,
    mood: "Moody",
    price: 32.99,
    audioUrl:
      "https://dohbpspufehpuyfskahm.supabase.co/storage/v1/object/public/beats/roses/Roses.mp3",
  },
  // Newest: Orbit
  {
    id: "26",
    title: "Orbit",
    genre: "Trap",
    bpm: 120,
    mood: "Dark",
    key: "E min",
    price: 32.99,
    audioUrl:
      "https://dohbpspufehpuyfskahm.supabase.co/storage/v1/object/public/beats/orbit/Orbit.mp3",
  },
  // Newest: Pulse
  {
    id: "25",
    title: "Pulse",
    genre: "Afrohouse",
    bpm: 122,
    mood: "Party",
    key: "B min",
    price: 34.99,
    audioUrl:
      "https://dohbpspufehpuyfskahm.supabase.co/storage/v1/object/public/beats/pulse/Pulse.mp3",
  },
  // Newest: I Like It
  {
    id: "24",
    title: "I Like It",
    genre: "House",
    bpm: 122,
    mood: "Party",
    price: 34.99,
    audioUrl:
      "https://dohbpspufehpuyfskahm.supabase.co/storage/v1/object/public/beats/i%20like%20it/I%20Like%20It.mp3",
  },
  // Newest: Run
  {
    id: "23",
    title: "Run",
    genre: "Hip Hop",
    bpm: 68,
    mood: "Dreamy",
    key: "Ab Maj",
    price: 29.99,
    audioUrl:
      "https://dohbpspufehpuyfskahm.supabase.co/storage/v1/object/public/beats/run/Run.mp3",
  },
  // Newest: Falling
  {
    id: "22",
    title: "Falling",
    genre: "Trap / R&B",
    bpm: 96,
    mood: "Dreamy",
    price: 29.99,
    audioUrl:
      "https://dohbpspufehpuyfskahm.supabase.co/storage/v1/object/public/beats/falling/Falling.mp3",
  },
  // Newest first: Memories
  {
    id: "21",
    title: "Memories",
    genre: "Melodic Hip Hop",
    bpm: 88,
    mood: "Sad",
    price: 29.99,
    audioUrl:
      "https://dohbpspufehpuyfskahm.supabase.co/storage/v1/object/public/beats/memories/Memories.mp3",
  },
  {
    id: "1",
    title: "Lucid",
    genre: "Reggaeton / EDM",
    bpm: 105,
    mood: "Euphoric",
    price: 29.99,
    // Use a server-signed preview URL if available (works for private buckets),
    // otherwise fall back to a public Supabase URL.
    // Use preview endpoint so playback works for private buckets.
    audioUrl: VITE_SERVER_URL
      ? `${VITE_SERVER_URL.replace(/\/$/, "")}/api/preview/lucid?redirect=1`
      : "https://dohbpspufehpuyfskahm.supabase.co/storage/v1/object/public/beats/Lucid.mp3",
    paymentLink: "https://buy.stripe.com/test_28E14g7W4gyR5BudbQ6AM00",
  },
  {
    id: "2",
    title: "Prism",
    genre: "Hip Hop",
    bpm: 94,
    mood: "Energetic",
    price: 34.99,
    audioUrl:
      "https://dohbpspufehpuyfskahm.supabase.co/storage/v1/object/public/beats/prism/Prism.mp3",
  },
  {
    id: "3",
    title: "See You Go",
    genre: "Afrobeat",
    bpm: 80,
    mood: "Playful",
    price: 24.99,
    audioUrl:
      "https://dohbpspufehpuyfskahm.supabase.co/storage/v1/object/public/beats/see%20you%20go/See%20You%20Go.mp3",
  },
  {
    id: "4",
    title: "Eyes On Me",
    genre: "R&B",
    bpm: 105,
    mood: "Chill",
    price: 29.99,
    audioUrl:
      "https://dohbpspufehpuyfskahm.supabase.co/storage/v1/object/public/beats/eyes%20on%20me/Eyes%20On%20Me.mp3",
  },
  {
    id: "5",
    title: "Shadow Work",
    genre: "Trap",
    bpm: 145,
    mood: "Aggressive",
    price: 32.99,
    audioUrl: "/api/placeholder-audio",
  },
  {
    id: "6",
    title: "Cosmic Drift",
    genre: "Ambient",
    bpm: 110,
    mood: "Dreamy",
    price: 27.99,
    audioUrl: "/api/placeholder-audio",
  },
  {
    id: "7",
    title: "Sunset Vibes",
    genre: "Lo-fi",
    bpm: 85,
    mood: "Relaxed",
    price: 19.99,
    audioUrl: "/api/placeholder-audio",
  },
  {
    id: "8",
    title: "Night Runner",
    genre: "Synthwave",
    bpm: 122,
    mood: "Retro",
    price: 31.99,
    audioUrl: "/api/placeholder-audio",
  },
  {
    id: "9",
    title: "Golden Hour",
    genre: "Pop",
    bpm: 100,
    mood: "Uplifting",
    price: 26.99,
    audioUrl: "/api/placeholder-audio",
  },
  {
    id: "10",
    title: "Deep Space",
    genre: "Ambient",
    bpm: 60,
    mood: "Ethereal",
    price: 22.99,
    audioUrl: "/api/placeholder-audio",
  },
  {
    id: "11",
    title: "Bounce Back",
    genre: "Hip Hop",
    bpm: 95,
    mood: "Confident",
    price: 28.99,
    audioUrl: "/api/placeholder-audio",
  },
  {
    id: "12",
    title: "Electric Avenue",
    genre: "Electronic",
    bpm: 128,
    mood: "Vibrant",
    price: 36.99,
    audioUrl: "/api/placeholder-audio",
  },
  {
    id: "13",
    title: "Cloud Surfing",
    genre: "Lo-fi",
    bpm: 78,
    mood: "Chill",
    price: 18.99,
    audioUrl: "/api/placeholder-audio",
  },
  {
    id: "14",
    title: "Pulse",
    genre: "House",
    bpm: 124,
    mood: "Groovy",
    price: 33.99,
    audioUrl: "/api/placeholder-audio",
  },
  {
    id: "15",
    title: "Dreamcatcher",
    genre: "Ambient",
    bpm: 72,
    mood: "Peaceful",
    price: 21.99,
    audioUrl: "/api/placeholder-audio",
  },
  {
    id: "16",
    title: "Starlight",
    genre: "Pop",
    bpm: 105,
    mood: "Bright",
    price: 27.99,
    audioUrl: "/api/placeholder-audio",
  },
  {
    id: "17",
    title: "Afterglow",
    genre: "Synthwave",
    bpm: 115,
    mood: "Nostalgic",
    price: 30.99,
    audioUrl: "/api/placeholder-audio",
  },
  {
    id: "18",
    title: "Groove Machine",
    genre: "House",
    bpm: 126,
    mood: "Funky",
    price: 35.99,
    audioUrl: "/api/placeholder-audio",
  },
  {
    id: "19",
    title: "Rainy Days",
    genre: "Lo-fi",
    bpm: 82,
    mood: "Moody",
    price: 20.99,
    audioUrl: "/api/placeholder-audio",
  },
  {
    id: "20",
    title: "Firestarter",
    genre: "Trap",
    bpm: 150,
    mood: "Intense",
    price: 37.99,
    audioUrl: "/api/placeholder-audio",
  },
];
