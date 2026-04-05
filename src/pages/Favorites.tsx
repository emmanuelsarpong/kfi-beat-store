import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FavoriteBeatRow from "@/components/FavoriteBeatRow";
import { useFavorites } from "@/hooks/useFavorites";
import { beats as allBeats } from "@/data/beats";

const FavoritesPage = () => {
  const { favorites, ready, remove } = useFavorites();
  const favoriteBeats = favorites
    .map((f) => allBeats.find((b) => b.id === f.id))
    .filter((b): b is (typeof allBeats)[number] => Boolean(b));

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Header />
      <main className="flex-1 w-full">
        <section className="pt-20 pb-16 px-2 sm:px-4 max-w-7xl mx-auto w-full">
          <div className="mb-10 sm:mb-12 text-center space-y-5">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight bg-gradient-to-r from-zinc-200 via-white to-zinc-300 bg-clip-text text-transparent">
              ❤️ Your Favorites
            </h1>
            <p className="text-zinc-400 text-sm sm:text-base max-w-2xl mx-auto">
              Save beats here while you decide. Cart is separate — use it when
              you are ready to license and pay. This list clears when you close
              your browser.
            </p>
          </div>
          {!ready ? (
            <div className="flex justify-center mt-10">Loading…</div>
          ) : favoriteBeats.length === 0 ? (
            <div className="text-center text-zinc-400">
              No favorites yet. Tap the heart on any beat to add it here.
            </div>
          ) : (
            <div className="max-w-3xl mx-auto flex flex-col gap-4 sm:gap-5">
              {favoriteBeats.map((beat) => (
                <div key={beat.id} className="reveal">
                  <FavoriteBeatRow
                    beat={beat}
                    onRemoveFavorite={() => remove(beat.id)}
                  />
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default FavoritesPage;
