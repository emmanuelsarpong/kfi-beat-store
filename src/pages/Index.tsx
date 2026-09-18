import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import BeatsGrid from "@/components/BeatsGrid";
import Footer from "@/components/Footer";
import ContactForm from "@/components/ContactForm";

const Index = () => (
  <div className="min-h-screen bg-background text-foreground">
    <Header />
    <HeroSection />
    <BeatsGrid />
    <section
      id="contact"
      className="py-12 lg:py-24 px-4 sm:px-6 reveal scroll-mt-24"
    >
      <div className="container mx-auto max-w-7xl">
        <ContactForm />
      </div>
    </section>
    <Footer />
  </div>
);

export default Index;
