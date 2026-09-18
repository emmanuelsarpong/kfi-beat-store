import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BeatCard from "@/components/BeatCard";
import BPMFilter from "@/components/BPMFilter";
import KeyFilter from "@/components/KeyFilter";
import MoodFilter from "@/components/MoodFilter";
import { keyMatches, type KeyFilterValue } from "@/lib/keys";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useBeats } from "@/hooks/useBeats";
import { EDITORIAL_GENRES, matchesEditorialGenre } from "@/lib/catalog";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const EMPTY_KEY: KeyFilterValue = { note: null, quality: null };

const SkeletonCard = () => (
  <div className="animate-pulse">
    <div className="aspect-square rounded-[14px] bg-black/[0.04]" />
    <div className="mt-4 h-4 w-2/3 rounded bg-black/[0.05]" />
    <div className="mt-2 h-3 w-1/2 rounded bg-black/[0.04]" />
  </div>
);

const Store = () => {
  const { beats, loading, error } = useBeats();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const [genre, setGenre] = useState(searchParams.get("genre") ?? "");
  const [mood, setMood] = useState("");
  const [bpmRange, setBpmRange] = useState<[number, number]>([1, 300]);
  const [bpmExact, setBpmExact] = useState<number | "">("");
  const [keyFilter, setKeyFilter] = useState<KeyFilterValue>(EMPTY_KEY);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [searchExpanded, setSearchExpanded] = useState(Boolean(searchParams.get("q")));
  const [sort, setSort] = useState<"latest" | "title" | "bpm">("latest");

  useEffect(() => {
    const next = searchParams.get("q") ?? "";
    setSearch(next);
    if (next) setSearchExpanded(true);
  }, [searchParams]);

  const uniqueMoods = useMemo(
    () => (beats ? [...new Set(beats.map((b) => b.mood).filter(Boolean))] : []),
    [beats]
  );

  const genreChips = useMemo(() => {
    if (!beats) return [];
    return EDITORIAL_GENRES.filter((group) =>
      beats.some((beat) => group.match(beat.genre))
    );
  }, [beats]);

  const filteredBeats = useMemo(() => {
    if (!beats) return [];
    const next = beats.filter((beat) => {
      const matchesSearch =
        beat.title.toLowerCase().includes(search.toLowerCase()) ||
        beat.genre.toLowerCase().includes(search.toLowerCase()) ||
        beat.mood.toLowerCase().includes(search.toLowerCase());
      const matchesGenre = matchesEditorialGenre(beat.genre, genre);
      const matchesMood = mood ? beat.mood === mood : true;
      const matchesBpm =
        bpmExact !== ""
          ? beat.bpm === Number(bpmExact)
          : beat.bpm >= bpmRange[0] && beat.bpm <= bpmRange[1];
      const matchesKey = keyMatches(keyFilter, beat.key);
      return matchesSearch && matchesGenre && matchesMood && matchesBpm && matchesKey;
    });
    if (sort === "title") return [...next].sort((a, b) => a.title.localeCompare(b.title));
    if (sort === "bpm") return [...next].sort((a, b) => a.bpm - b.bpm);
    return next;
  }, [beats, search, genre, mood, bpmRange, bpmExact, keyFilter, sort]);

  const advancedActive =
    Boolean(mood) ||
    bpmExact !== "" ||
    bpmRange[0] !== 1 ||
    bpmRange[1] !== 300 ||
    Boolean(keyFilter.note) ||
    sort !== "latest";

  const setGenreChip = (value: string) => {
    setGenre(value);
    const params = new URLSearchParams(searchParams);
    if (value) params.set("genre", value);
    else params.delete("genre");
    setSearchParams(params, { replace: true });
  };

  const updateSearch = (value: string) => {
    setSearch(value);
    const params = new URLSearchParams(searchParams);
    if (value) params.set("q", value);
    else params.delete("q");
    setSearchParams(params, { replace: true });
  };

  const resetAdvancedFilters = () => {
    setMood("");
    setBpmRange([1, 300]);
    setBpmExact("");
    setKeyFilter(EMPTY_KEY);
    setSort("latest");
  };

  const advancedFilters = (
    <div className="flex flex-wrap items-center gap-1">
      <MoodFilter moods={uniqueMoods} value={mood} onChange={setMood} />
      <BPMFilter
        bpmRange={bpmRange}
        setBpmRange={setBpmRange}
        bpmExact={bpmExact}
        setBpmExact={setBpmExact}
      />
      <KeyFilter value={keyFilter} onChange={setKeyFilter} />
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
      <main className="flex-1 w-full">
        <section className="pt-7 lg:pt-14 pb-16 px-4 sm:px-6 max-w-7xl mx-auto w-full">
          <div className="mb-6 lg:mb-10">
            <p className="kfi-kicker">Catalog</p>
            <h1 className="mt-2 lg:mt-3 font-display text-[36px] sm:text-[42px] lg:text-5xl tracking-display leading-[1.05]">
              Explore beats
            </h1>
          </div>

          <div className="sticky top-[calc(3.5rem+env(safe-area-inset-top,0px))] z-30 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 bg-[#F6F5F1]/90 backdrop-blur-md border-b border-black/[0.05] mb-8 lg:mb-10">
            <div className="flex flex-col gap-3">
              <div className="flex w-full flex-wrap gap-x-[22px] gap-y-2 lg:hidden">
                <button
                  type="button"
                  onClick={() => setGenreChip("")}
                  className={cn(
                    "max-w-full border-b-2 pb-1.5 text-[14px] leading-5 whitespace-nowrap",
                    !genre
                      ? "border-foreground font-medium text-foreground"
                      : "border-transparent text-[#6F6F69]"
                  )}
                >
                  All beats
                </button>
                {genreChips.map((chip) => (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => setGenreChip(chip.id)}
                    className={cn(
                      "max-w-full border-b-2 pb-1.5 text-[14px] leading-5 whitespace-nowrap",
                      genre === chip.id
                        ? "border-foreground font-medium text-foreground"
                        : "border-transparent text-[#6F6F69]"
                    )}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
              <div className="kfi-chip-scroller hidden lg:block">
                <div className="flex items-center gap-3 overflow-visible flex-wrap">
                  <button
                    type="button"
                    onClick={() => setGenreChip("")}
                    className={cn(
                      "shrink-0 rounded-full px-3 py-1.5 text-sm",
                      !genre ? "bg-foreground text-background" : "text-[#6F6F69] hover:text-foreground"
                    )}
                  >
                    All beats
                  </button>
                  {genreChips.map((chip) => (
                    <button
                      key={chip.id}
                      type="button"
                      onClick={() => setGenreChip(chip.id)}
                      className={cn(
                        "shrink-0 rounded-full px-3 py-1.5 text-sm",
                        genre === chip.id
                          ? "bg-foreground text-background"
                          : "text-[#6F6F69] hover:text-foreground"
                      )}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between gap-4">
                <div className="hidden lg:flex">{advancedFilters}</div>
                <button
                  type="button"
                  className="lg:hidden inline-flex min-h-11 items-center text-[14px] text-[#6F6F69]"
                  onClick={() => setFiltersOpen(true)}
                >
                  Filters{advancedActive ? " · On" : ""}
                </button>
                <input
                  type="search"
                  placeholder="Search beats"
                  className="hidden lg:block ml-auto h-9 w-full max-w-[220px] bg-transparent border-b border-black/[0.12] text-sm outline-none placeholder:text-[#999991]"
                  value={search}
                  onChange={(e) => updateSearch(e.target.value)}
                />
                {searchExpanded ? (
                  <input
                    type="search"
                    placeholder="Search beats"
                    autoFocus
                    className="lg:hidden h-11 flex-1 bg-transparent border-b border-black/[0.12] text-[16px] outline-none placeholder:text-[#999991]"
                    value={search}
                    onChange={(e) => updateSearch(e.target.value)}
                  />
                ) : (
                  <button
                    type="button"
                    className="lg:hidden inline-flex min-h-11 items-center text-[14px] text-[#6F6F69]"
                    onClick={() => setSearchExpanded(true)}
                  >
                    Search beats
                  </button>
                )}
              </div>
            </div>
          </div>

          {error && (
            <div className="text-center text-destructive mb-8">Failed to load beats.</div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-12 md:gap-y-10">
            {loading && !beats && Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
            {!loading && filteredBeats.length === 0 && (
              <div className="col-span-full py-20 text-center text-[#6F6F69]">
                Nothing in this range. Try another filter.
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
            <div className="flex justify-center mt-10">
              <LoadingSpinner />
            </div>
          )}
        </section>
      </main>
      <Footer />

      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetContent
          side="bottom"
          className="rounded-t-[20px] bg-[#F6F5F1] border-black/[0.06] h-auto max-h-[min(86vh,720px)] overflow-y-auto px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
        >
          <SheetHeader>
            <SheetTitle className="text-left font-display tracking-display">Filters</SheetTitle>
          </SheetHeader>
          <div className="pt-6 space-y-7">
            <div>
              <p className="kfi-kicker">Genre</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setGenreChip("")}
                  className={cn(
                    "rounded-full px-4 py-2.5 text-[14px]",
                    !genre ? "bg-foreground text-background" : "text-[#6F6F69] bg-white"
                  )}
                >
                  All beats
                </button>
                {genreChips.map((chip) => (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => setGenreChip(chip.id)}
                    className={cn(
                      "rounded-full px-4 py-2.5 text-[14px]",
                      genre === chip.id ? "bg-foreground text-background" : "text-[#6F6F69] bg-white"
                    )}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="kfi-kicker">Mood</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setMood("")}
                  className={cn(
                    "rounded-full px-4 py-2.5 text-[14px]",
                    !mood ? "bg-foreground text-background" : "text-[#6F6F69] bg-white"
                  )}
                >
                  All
                </button>
                {uniqueMoods.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setMood(item)}
                    className={cn(
                      "rounded-full px-4 py-2.5 text-[14px]",
                      mood === item ? "bg-foreground text-background" : "text-[#6F6F69] bg-white"
                    )}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="kfi-kicker">BPM</p>
              <div className="mt-3 flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={bpmRange[1]}
                  value={bpmRange[0]}
                  onChange={(e) => {
                    setBpmExact("");
                    setBpmRange([Number(e.target.value) || 1, bpmRange[1]]);
                  }}
                  className="h-11 w-24 rounded-[10px] border border-black/[0.08] bg-white px-3 text-sm tabular-nums"
                  aria-label="Minimum BPM"
                />
                <span className="text-[#999991]">–</span>
                <input
                  type="number"
                  min={bpmRange[0]}
                  max={300}
                  value={bpmRange[1]}
                  onChange={(e) => {
                    setBpmExact("");
                    setBpmRange([bpmRange[0], Number(e.target.value) || 300]);
                  }}
                  className="h-11 w-24 rounded-[10px] border border-black/[0.08] bg-white px-3 text-sm tabular-nums"
                  aria-label="Maximum BPM"
                />
              </div>
            </div>
            <div>
              <p className="kfi-kicker">Key</p>
              <div className="mt-3">
                <KeyFilter value={keyFilter} onChange={setKeyFilter} inline />
              </div>
            </div>
            <div>
              <p className="kfi-kicker">Sort</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {([
                  ["latest", "Latest"],
                  ["title", "Title"],
                  ["bpm", "BPM"],
                ] as const).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setSort(value)}
                    className={cn(
                      "rounded-full px-4 py-2.5 text-[14px]",
                      sort === value ? "bg-foreground text-background" : "text-[#6F6F69] bg-white"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-8 flex items-center justify-between gap-3">
            <button
              type="button"
              className="inline-flex min-h-11 items-center text-sm text-[#6F6F69]"
              onClick={resetAdvancedFilters}
            >
              Reset
            </button>
            <button
              type="button"
              className="inline-flex min-h-11 items-center rounded-full bg-foreground px-5 text-sm text-background"
              onClick={() => setFiltersOpen(false)}
            >
              Apply filters
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Store;
