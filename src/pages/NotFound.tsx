import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import PageLayout from "@/components/PageLayout";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <PageLayout>
      <section className="container mx-auto max-w-7xl px-4 sm:px-6 py-24">
        <p className="kfi-kicker">404</p>
        <h1 className="mt-4 font-display text-5xl tracking-display">
          This page is silent.
        </h1>
        <p className="mt-4 text-[#6F6F69]">The track you’re looking for isn’t here.</p>
        <Link to="/store" className="mt-8 inline-flex text-sm">
          Explore beats →
        </Link>
      </section>
    </PageLayout>
  );
};

export default NotFound;
