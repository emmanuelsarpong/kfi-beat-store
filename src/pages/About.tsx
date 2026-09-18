import PageLayout from "@/components/PageLayout";
import { Link } from "react-router-dom";

const About = () => (
  <PageLayout>
    <section className="container mx-auto max-w-7xl px-4 sm:px-6 pt-10 pb-20 lg:pt-16 lg:pb-24">
      <p className="kfi-kicker reveal">KFI / PRODUCER</p>
      <h1 className="mt-5 lg:mt-6 max-w-3xl font-display text-[40px] sm:text-5xl lg:text-7xl leading-[0.95] tracking-[-0.05em] reveal">
        Taste first.
        <br />
        Then the record.
      </h1>
      <div className="mt-12 max-w-xl space-y-6 text-[16px] leading-8 text-[#6F6F69] reveal">
        <p>
          KFI is a producer-led catalog of premium beats and licenses. The
          work is built for artists who care about replay value — not volume,
          not templates, not whatever is trending this week.
        </p>
        <p>
          Listen first. If something catches your ear, choose the license that
          fits the release. Everything else stays out of the way.
        </p>
      </div>
      <Link to="/store" className="mt-12 inline-flex text-sm reveal">
        Explore beats →
      </Link>
    </section>
  </PageLayout>
);

export default About;
