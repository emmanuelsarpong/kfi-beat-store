import BeatCard from "./BeatCard";
import { Link } from "react-router-dom";
import { beats as beatsData } from "@/data/beats";
import { useBeats } from "@/hooks/useBeats";

const BeatsGrid = () => {
  const { beats } = useBeats();
  const latestBeats = [...(beats ?? beatsData)]
    .sort((a, b) => Number(b.id) - Number(a.id))
    .slice(0, 6);

  return (
    <section id="beats" className="py-6 lg:py-12 px-4 sm:px-6 scroll-mt-24">
      <div className="container mx-auto max-w-7xl">
        <div className="flex items-end justify-between gap-6 mb-8 lg:mb-10">
          <div>
            <p className="kfi-kicker">Latest</p>
            <h2 className="mt-3 font-display text-3xl md:text-4xl tracking-display">
              New from the studio
            </h2>
          </div>
          <Link
            to="/store"
            className="hidden sm:inline-flex text-sm text-[#6F6F69] hover:text-foreground"
          >
            Explore beats →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-12 md:gap-y-10">
          {latestBeats.map((beat) => (
            <div key={beat.id} className="reveal">
              <BeatCard beat={beat} />
            </div>
          ))}
        </div>

        <div className="mt-10 sm:hidden">
          <Link to="/store" className="text-sm">
            Explore beats →
          </Link>
        </div>
      </div>
    </section>
  );
};

export default BeatsGrid;
