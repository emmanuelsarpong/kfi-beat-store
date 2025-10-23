import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BeatCard from "@/components/BeatCard";
import { useFavorites } from "@/hooks/useFavorites";
import { beats as allBeats } from "@/data/beats";

const FavoritesPage = () => {
  const { favorites, ready } = useFavorites();
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
              Quickly revisit the beats you saved this session. This list clears
              when you close your browser.
            </p>
          </div>
          {!ready ? (
            <div className="flex justify-center mt-10">Loading…</div>
          ) : favoriteBeats.length === 0 ? (
            <div className="text-center text-zinc-400">
              No favorites yet. Tap the heart on any beat to add it here.
            </div>
          ) : (
            <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-y-12 gap-x-6 sm:gap-y-14 sm:gap-x-8">
              {favoriteBeats.map((beat) => (
                <div key={beat.id} className="reveal">
                  <BeatCard beat={beat} />
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
