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
    key: "E min",
    price: 400.0,
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
    key: "D min",
    price: 500.0,
    audioUrl:
      "https://dohbpspufehpuyfskahm.supabase.co/storage/v1/object/public/beats/wait/Wait.mp3",
  },
  // Newest: Roses
  {
    id: "27",
    title: "Roses",
    genre: "R&B",
    bpm: 110,
    mood: "Moody",
    key: "F# min",
    price: 450.0,
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
    price: 600.0,
    audioUrl:
      "https://dohbpspufehpuyfskahm.supabase.co/storage/v1/object/public/beats/orbit/Orbit.mp3",
  },
  // Newest: Pulse
  {
    id: "25",
    title: "Pulse",
    genre: "House",
    bpm: 122,
    mood: "Party",
    key: "B min",
    price: 650.0,
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
    price: 550.0,
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
    key: "G# Maj",
    price: 400.0,
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
    key: "F min",
    price: 500.0,
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
    genre: "Raggaeton",
    bpm: 105,
    mood: "Euphoric",
    key: "C# min",
    price: 600.0,
    // Use a server-signed preview URL if available (works for private buckets),
    // otherwise fall back to a public Supabase URL.
    // Use preview endpoint so playback works for private buckets.
    audioUrl: VITE_SERVER_URL
      ? `${VITE_SERVER_URL.replace(/\/$/, "")}/api/preview/lucid?redirect=1`
      : "https://dohbpspufehpuyfskahm.supabase.co/storage/v1/object/public/beats/Lucid.mp3",
    // paymentLink retained for legacy fallback during dev; server checkout takes precedence
    paymentLink: "https://buy.stripe.com/test_28E14g7W4gyR5BudbQ6AM00",
  },
  {
    id: "2",
    title: "Prism",
    genre: "Hip Hop",
    bpm: 94,
    mood: "Energetic",
    key: "C# min",
    price: 700.0,
    audioUrl:
      "https://dohbpspufehpuyfskahm.supabase.co/storage/v1/object/public/beats/prism/Prism.mp3",
  },
  {
    id: "3",
    title: "See You Go",
    genre: "Afrobeats",
    bpm: 80,
    mood: "Playful",
    key: "G# min",
    price: 400.0,
    audioUrl:
      "https://dohbpspufehpuyfskahm.supabase.co/storage/v1/object/public/beats/see%20you%20go/See%20You%20Go.mp3",
  },
  {
    id: "4",
    title: "Eyes On Me",
    genre: "R&B",
    bpm: 105,
    mood: "Chill",
    key: "C min",
    price: 500.0,
    audioUrl:
      "https://dohbpspufehpuyfskahm.supabase.co/storage/v1/object/public/beats/eyes%20on%20me/Eyes%20On%20Me.mp3",
  },
];
