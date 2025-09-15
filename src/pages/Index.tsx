import React from "react";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import BeatsGrid from "@/components/BeatsGrid";
import Footer from "@/components/Footer";
import ContactForm from "@/components/ContactForm";

const Index = () => (
  <div className="min-h-screen bg-black text-white">
    <Header />
    <HeroSection />
    <BeatsGrid />
    {/* Contact form section */}
    <section
      id="contact"
      className="py-16 md:py-24 px-4 bg-black reveal scroll-mt-24"
    >
      <ContactForm />
    </section>
    <Footer />
  </div>
);

export default Index;
