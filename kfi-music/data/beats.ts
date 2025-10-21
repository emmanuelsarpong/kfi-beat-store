export type Beat = {
  id: string;
  title: string;
  priceUSD: number; // Display fallback; if priceId present, Stripe uses that
  priceId?: string; // Stripe Price ID (preferred)
  storagePath: string; // Supabase Storage path, e.g. "lucid/Lucid.mp3"
  genre?: string;
  bpm?: number;
  key?: string;
};

// Replace priceId values with your real Stripe Price IDs per beat.
export const beats: Beat[] = [
  {
    id: "sunset",
    title: "Sunset",
    priceUSD: 400.0,
    priceId: process.env.STRIPE_PRICE_ID_SUNSET,
    storagePath: "sunset/Sunset.mp3",
    genre: "R&B",
    bpm: 98,
    key: "E min",
  },
  {
    id: "wait",
    title: "Wait",
    priceUSD: 500.0,
    priceId: process.env.STRIPE_PRICE_ID_WAIT,
    storagePath: "wait/Wait.mp3",
    genre: "Hip Hop",
    bpm: 99,
    key: "D min",
  },
  {
    id: "roses",
    title: "Roses",
    priceUSD: 450.0,
    priceId: process.env.STRIPE_PRICE_ID_ROSES,
    storagePath: "roses/Roses.mp3",
    genre: "R&B",
    bpm: 110,
    key: "F# min",
  },
  {
    id: "orbit",
    title: "Orbit",
    priceUSD: 600.0,
    priceId: process.env.STRIPE_PRICE_ID_ORBIT,
    storagePath: "orbit/Orbit.mp3",
    genre: "Trap",
    bpm: 120,
    key: "E min",
  },
  {
    id: "pulse",
    title: "Pulse",
    priceUSD: 650.0,
    priceId: process.env.STRIPE_PRICE_ID_PULSE,
    storagePath: "pulse/Pulse.mp3",
    genre: "House",
    bpm: 122,
  },
  {
    id: "i-like-it",
    title: "I Like It",
    priceUSD: 550.0,
    priceId: process.env.STRIPE_PRICE_ID_I_LIKE_IT,
    storagePath: "i like it/I Like It.mp3",
    genre: "House",
    bpm: 122,
  },
  {
    id: "run",
    title: "Run",
    priceUSD: 400.0,
    priceId: process.env.STRIPE_PRICE_ID_RUN,
    storagePath: "run/Run.mp3",
    genre: "Hip Hop",
    bpm: 68,
    key: "G# Maj",
  },
  {
    id: "falling",
    title: "Falling",
    priceUSD: 500.0,
    priceId: process.env.STRIPE_PRICE_ID_FALLING,
    storagePath: "falling/Falling.mp3",
    genre: "Trap / R&B",
    bpm: 96,
    key: "F min",
  },
  {
    id: "memories",
    title: "Memories",
    priceUSD: 29.99,
    priceId: process.env.STRIPE_PRICE_ID_MEMORIES,
    storagePath: "memories/Memories.mp3",
    genre: "Melodic Hip Hop",
    bpm: 88,
  },
  {
    id: "lucid",
    title: "Lucid",
    priceUSD: 600.0,
    priceId: process.env.STRIPE_PRICE_ID_LUCID,
    storagePath: "lucid/Lucid.mp3",
    genre: "Raggaton",
    bpm: 105,
    key: "C# min",
  },
  {
    id: "prism",
    title: "Prism",
    priceUSD: 700.0,
    priceId: process.env.STRIPE_PRICE_ID_PRISM,
    storagePath: "prism/Prism.mp3",
    genre: "Hip Hop",
    bpm: 94,
    key: "C# min",
  },
  {
    id: "see-you-go",
    title: "See You Go",
    priceUSD: 400.0,
    priceId: process.env.STRIPE_PRICE_ID_SEE_YOU_GO,
    storagePath: "see you go/See You Go.mp3",
    genre: "Afrobeats",
    bpm: 80,
    key: "G# min",
  },
  {
    id: "eyes-on-me",
    title: "Eyes On Me",
    priceUSD: 500.0,
    priceId: process.env.STRIPE_PRICE_ID_EYES_ON_ME,
    storagePath: "eyes on me/Eyes On Me.mp3",
    genre: "R&B",
    bpm: 105,
    key: "C min",
  },
];

export function getBeatById(id: string): Beat | undefined {
  return beats.find((b) => b.id === id);
}
