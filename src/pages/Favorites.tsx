import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BeatCard from "@/components/BeatCard";
import FavoriteBeatRow from "@/components/FavoriteBeatRow";
import { useFavorites } from "@/hooks/useFavorites";
import { beats as allBeats } from "@/data/beats";

const FavoritesPage = () => {
  const { favorites, ready, remove } = useFavorites();
  const [sort, setSort] = useState<"recent" | "title" | "bpm">("recent");
  const favoriteBeats = useMemo(() => {
    const list = favorites
      .map((f) => allBeats.find((b) => b.id === f.id))
      .filter((b): b is (typeof allBeats)[number] => Boolean(b));
    if (sort === "title") return [...list].sort((a, b) => a.title.localeCompare(b.title));
    if (sort === "bpm") return [...list].sort((a, b) => a.bpm - b.bpm);
    return list;
  }, [favorites, sort]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
      <main className="flex-1 w-full">
        <section className="pt-8 lg:pt-12 pb-16 px-4 sm:px-6 max-w-4xl mx-auto w-full">
          <p className="kfi-kicker">Collection</p>
          <h1 className="mt-3 font-display text-[40px] leading-[1.05] tracking-display lg:text-5xl">
            Saved beats
          </h1>
          <p className="mt-4 text-[15px] text-[#6F6F69]">
            The ones worth coming back to.
          </p>

          {!ready ? (
            <div className="mt-16 text-sm text-[#6F6F69]">Loading…</div>
          ) : favoriteBeats.length === 0 ? (
            <div className="mt-10 lg:mt-16">
              <p className="text-[#6F6F69]">Nothing saved yet.</p>
              <Link to="/store" className="mt-4 inline-flex min-h-11 items-center text-sm">
                Explore beats →
              </Link>
            </div>
          ) : (
            <>
              <div className="mt-8 flex gap-4 text-sm text-[#6F6F69]">
                {(["recent", "title", "bpm"] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setSort(value)}
                    className={sort === value ? "text-foreground" : "hover:text-foreground"}
                  >
                    {value === "recent" ? "Recent" : value === "title" ? "Title" : "BPM"}
                  </button>
                ))}
              </div>
              <div className="mt-6 grid grid-cols-1 gap-y-12 lg:hidden">
                {favoriteBeats.map((beat) => (
                  <BeatCard key={beat.id} beat={beat} />
                ))}
              </div>
              <div className="mt-4 hidden lg:block">
                {favoriteBeats.map((beat) => (
                  <FavoriteBeatRow
                    key={beat.id}
                    beat={beat}
                    onRemoveFavorite={() => remove(beat.id)}
                  />
                ))}
              </div>
            </>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default FavoritesPage;
