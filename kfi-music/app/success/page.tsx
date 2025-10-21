export default function SuccessPage() {
  return (
    <section className="card">
      <h1>Thank you!</h1>
      <p>
        We’re processing your order. You’ll receive an email shortly with your
        download link.
      </p>
      <p className="mt-3">
        <a className="btn" href="/beats">
          Back to catalog
        </a>
      </p>
    </section>
  );
}
