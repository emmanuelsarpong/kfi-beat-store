import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, Send } from "lucide-react";
import axios from "axios";

const FORMSPREE_ENDPOINT = "https://formspree.io/f/xyzjpvyw";

const ContactForm = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    try {
      const data = new FormData();
      data.append("name", formData.name);
      data.append("email", formData.email);
      data.append("message", formData.message);

      await axios.post(FORMSPREE_ENDPOINT, data, {
        headers: { Accept: "application/json" },
      });

      setStatus("success");
      setFormData({ name: "", email: "", message: "" });
    } catch (err) {
      setStatus("error");
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <section
      id="contact"
      className="relative w-full min-w-0 bg-[#212327] py-40 px-6 md:px-24 overflow-hidden"
    >
      {/* Fade effect at top */}
      <div className="pointer-events-none absolute top-0 left-0 w-full h-24 bg-gradient-to-t from-transparent to-black z-10" />
      {/* Fade effect at bottom */}
      <div className="pointer-events-none absolute bottom-0 left-0 w-full h-24 bg-gradient-to-b from-transparent to-black z-10" />

      <div className="mx-auto max-w-4xl">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Mail className="h-8 w-8 text-white" />
            <h2 className="text-4xl md:text-5xl font-bold text-white">
              Get In Touch
            </h2>
          </div>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Ready to elevate your music? Let’s discuss your next project and
            bring your vision to life.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-gray-300 font-medium">
                Name
              </Label>
              <Input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                required
                className="bg-black border-gray-700 text-white placeholder:text-gray-400 focus:border-white focus:ring-0 focus:outline-none"
                placeholder="Your full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300 font-medium">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="bg-black border-gray-700 text-white placeholder:text-gray-400 focus:border-white focus:ring-0 focus:outline-none"
                placeholder="your@email.com"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="message" className="text-gray-300 font-medium">
              Message
            </Label>
            <Textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              required
              rows={6}
              className="bg-black border-gray-700 text-white placeholder:text-gray-400 focus:border-white focus:ring-0 focus:outline-none resize-none"
              placeholder="Tell us about your project, budget, timeline, or any questions you have..."
            />
          </div>

          <Button
            type="submit"
            size="lg"
            variant="primary"
            className="w-full bg-white text-black hover:bg-gray-200 hover:text-black text-lg px-8 py-3 rounded-lg transition-all duration-300 font-semibold"
          >
            <Send className="h-5 w-5 mr-2" />
            Send Message
          </Button>
        </form>

        <div className="mt-12 text-center">
          <p className="text-gray-400 mb-4">Prefer direct contact?</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <a
              href="mailto:contact@kfi.com"
              className="text-white hover:text-gray-300 transition-colors font-medium"
            >
              contact@kfi.com
            </a>
            <a
              href="https://instagram.com/thisiskfi"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:text-gray-300 transition-colors font-medium"
            >
              @thisiskfi
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactForm;
