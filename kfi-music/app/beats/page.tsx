import { beats, type Beat } from "@/data/beats";

export default function BeatsPage() {
  return (
    <section className="card">
      <h1>Catalog</h1>
      <ul className="list-reset grid-gap">
        {beats.map((b: Beat) => (
          <li key={b.id} className="card row">
            <div>
              <div className="fw-600">{b.title}</div>
              <div className="muted">
                {b.genre} • {b.bpm} BPM
              </div>
            </div>
            <form action="/api/checkout" method="POST">
              <input type="hidden" name="beatId" value={b.id} />
              <button className="btn" type="submit">
                Buy ${b.priceUSD.toFixed(2)}
              </button>
            </form>
          </li>
        ))}
      </ul>
    </section>
  );
}
