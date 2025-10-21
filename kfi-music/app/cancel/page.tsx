export default function CancelPage() {
  return (
    <section className="card">
      <h1>Purchase canceled</h1>
      <p className="muted">
        Your checkout session was canceled. You can restart anytime.
      </p>
      <p className="mt-3">
        <a className="btn" href="/beats">
          Try again
        </a>
      </p>
    </section>
  );
}
