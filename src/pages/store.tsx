import { useState, useMemo } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BeatCard from "@/components/BeatCard";
import BPMFilter from "@/components/BPMFilter";
import KeyFilter from "@/components/KeyFilter";
import { keyMatches, type KeyFilterValue } from "@/lib/keys";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useBeats } from "@/hooks/useBeats";

const SkeletonCard: React.FC = () => (
  <div className="reveal animate-pulse rounded-xl border border-zinc-800/60 bg-gradient-to-br from-zinc-900/60 to-zinc-800/40 h-72 flex flex-col">
    <div className="h-36 w-full rounded-t-xl bg-zinc-800/60" />
    <div className="p-4 space-y-3">
      <div className="h-4 w-3/4 bg-zinc-700/50 rounded" />
      <div className="flex gap-2">
        <div className="h-5 w-14 bg-zinc-700/40 rounded-full" />
        <div className="h-5 w-16 bg-zinc-700/40 rounded-full" />
      </div>
      <div className="h-6 w-16 bg-zinc-700/40 rounded" />
    </div>
  </div>
);

const Store = () => {
  const { beats, loading, error } = useBeats();
  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState("");
  const [bpmRange, setBpmRange] = useState<[number, number]>([1, 300]);
  const [bpmExact, setBpmExact] = useState<number | "">("");
  const [keyFilter, setKeyFilter] = useState<KeyFilterValue>({
    note: null,
    quality: null,
  });
  // Removed sortMode & vibe UI/state per design request
  const uniqueGenres = useMemo(
    () => (beats ? [...new Set(beats.map((b) => b.genre))] : []),
    [beats]
  );
  const filteredBeats = useMemo(() => {
    if (!beats) return [];
    return beats.filter((beat) => {
      const matchesSearch =
        beat.title.toLowerCase().includes(search.toLowerCase()) ||
        beat.genre.toLowerCase().includes(search.toLowerCase());
      const matchesGenre = genre ? beat.genre === genre : true;
      const matchesBpm =
        bpmExact !== ""
          ? beat.bpm === Number(bpmExact)
          : beat.bpm >= bpmRange[0] && beat.bpm <= bpmRange[1];
      const matchesKey = keyMatches(keyFilter, beat.key);
      return matchesSearch && matchesGenre && matchesBpm && matchesKey;
    });
  }, [beats, search, genre, bpmRange, bpmExact, keyFilter]);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Header />
      <main className="flex-1 w-full">
        {/* Increased vertical padding for more breathing room */}
        <section className="pt-20 pb-16 px-2 sm:px-4 max-w-7xl mx-auto w-full">
          <div className="mb-10 sm:mb-12 text-center space-y-5">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight bg-gradient-to-r from-zinc-200 via-white to-zinc-300 bg-clip-text text-transparent">
              🎧 Explore the Catalog
            </h1>
            <p className="text-zinc-400 text-sm sm:text-base max-w-2xl mx-auto">
              Handcrafted sonic landscapes engineered for replay value. Dial in
              a vibe, preview, and build faster.
            </p>
          </div>
          {/* Subtle gradient divider for visual separation */}
          <div className="mx-auto h-px w-full max-w-3xl bg-gradient-to-r from-transparent via-zinc-700/60 to-transparent mb-12" />
          {/* Controls row: Search, Genre, Key, BPM on one line (desktop). On phones: Search, Genre full-width; Key/BPM 50/50. */}
          <div className="reveal relative z-[100] mb-10">
            <div className="flex flex-wrap md:flex-nowrap items-center justify-center gap-3 sm:gap-4">
              {/* Search */}
              <input
                type="text"
                placeholder="Search by title or genre..."
                className="px-4 py-2 rounded bg-zinc-900 text-white border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-500 w-full md:w-96"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {/* Genre */}
              <select
                aria-label="Filter by genre"
                className="px-4 py-2 rounded bg-zinc-900 text-white border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-500 w-full md:w-56"
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
              {/* Key + BPM group: grid 2 cols on phones (true 50/50), inline on desktop */}
              <div className="relative w-full md:w-auto grid grid-cols-2 gap-2 md:grid-cols-[auto_auto] md:flex md:gap-4">
                <div className="w-full md:w-auto">
                  <KeyFilter
                    value={keyFilter}
                    onChange={setKeyFilter}
                    fullWidth
                    className="w-full md:w-auto"
                  />
                </div>
                <div className="w-full md:w-auto">
                  <BPMFilter
                    bpmRange={bpmRange}
                    setBpmRange={setBpmRange}
                    bpmExact={bpmExact}
                    setBpmExact={setBpmExact}
                    fullWidth
                    className="w-full md:w-auto"
                  />
                </div>
              </div>
            </div>
          </div>
          {/* Removed vibe + sorting bar */}
          {/* Responsive Beats Grid */}
          {error && (
            <div className="text-center text-red-400 mb-8 reveal">
              Failed to load beats.
            </div>
          )}
          <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-y-12 gap-x-6 sm:gap-y-14 sm:gap-x-8">
            {loading &&
              !beats &&
              Array.from({ length: 9 }).map((_, i) => <SkeletonCard key={i} />)}
            {!loading && filteredBeats.length === 0 && (
              <div className="col-span-full text-center text-zinc-400">
                No beats found.
              </div>
            )}
            {!loading &&
              filteredBeats.map((beat) => (
                <div key={beat.id} className="reveal">
                  <BeatCard beat={beat} />
                </div>
              ))}
          </div>
          {loading && (
            <div className="flex justify-center mt-10 reveal">
              <LoadingSpinner />
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Store;
