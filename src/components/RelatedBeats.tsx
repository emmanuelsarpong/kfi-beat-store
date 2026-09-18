import BeatCard from "@/components/BeatCard";
import type { BeatData } from "@/data/beats";
import { getRelatedBeats } from "@/lib/catalog";

export default function RelatedBeats({
  beat,
  catalog,
}: {
  beat: BeatData;
  catalog: BeatData[];
}) {
  const related = getRelatedBeats(beat, catalog, 3);
  if (!related.length) return null;

  return (
    <section className="mt-16 lg:mt-24">
      <p className="kfi-kicker">Next</p>
      <h2 className="mt-3 font-display text-3xl tracking-display">
        You might also like
      </h2>
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-12 md:gap-y-10">
        {related.map((item) => (
          <BeatCard key={item.id} beat={item} />
        ))}
      </div>
    </section>
  );
}
