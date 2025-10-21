import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, Send } from "lucide-react";
import axios from "axios";

const serverUrl = import.meta.env.VITE_SERVER_URL as string | undefined;

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
      if (!serverUrl) throw new Error("Server not configured");
      await axios.post(
        `${serverUrl.replace(/\/$/, "")}/api/contact`,
        {
          name: formData.name,
          email: formData.email,
          message: formData.message,
        },
        { headers: { "Content-Type": "application/json" } }
      );

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
    <section className="relative w-full min-w-0 bg-[#212327] py-36 px-6 md:px-24 overflow-hidden">
      {/* Fade effect at top */}
      <div className="pointer-events-none absolute top-0 left-0 w-full h-24 bg-gradient-to-t from-transparent to-black z-10" />
      {/* Fade effect at bottom */}
      <div className="pointer-events-none absolute bottom-0 left-0 w-full h-24 bg-gradient-to-b from-transparent to-black z-10" />

      <div id="contact" className="mx-auto max-w-4xl scroll-mt-28">
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
          {/* Personal touch removed per request */}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-gray-300 font-medium">
                Name
              </Label>
              <div className="relative z-0 field-wrapper group">
                {/* Interactive aura appears on hover/focus only */}
                <div className="kfi-aura-warm thin rounded-xl" />
                <Input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="relative z-10 kfi-glass-dark text-white placeholder:text-gray-400 rounded-xl focus-visible:ring-2 focus-visible:ring-amber-400/50 focus:border-transparent"
                  placeholder="Your full name"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300 font-medium">
                Email
              </Label>
              <div className="relative z-0 field-wrapper group">
                <div className="kfi-aura-warm thin rounded-xl" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="relative z-10 kfi-glass-dark text-white placeholder:text-gray-400 rounded-xl focus-visible:ring-2 focus-visible:ring-amber-400/50 focus:border-transparent"
                  placeholder="your@email.com"
                />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="message" className="text-gray-300 font-medium">
              Message
            </Label>
            <div className="relative z-0 field-wrapper group">
              <div className="kfi-aura-warm thin rounded-xl" />
              <Textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows={6}
                className="relative z-10 kfi-glass-dark text-white placeholder:text-gray-400 rounded-xl focus-visible:ring-2 focus-visible:ring-amber-400/50 focus:border-transparent resize-none"
                placeholder="Tell us about your project, budget, timeline, or any questions you have..."
              />
            </div>
          </div>

          <div className="relative group">
            {/* Interactive aura, hidden until hover/focus */}
            <div className="kfi-aura-warm rounded-2xl" />
            <Button
              type="submit"
              size="lg"
              disabled={status === "loading"}
              className="relative z-20 w-full px-9 py-3.5 rounded-xl font-semibold text-white btn-ripple kfi-glass-dark hover:bg-white/10 hover:shadow-[0_0_36px_rgba(168,142,255,0.18),0_10px_30px_-12px_rgba(0,0,0,0.6)] hover:scale-105 ring-1 ring-white/10 focus-visible:ring-2 focus-visible:ring-amber-400/50"
            >
              <Send className="h-5 w-5 mr-2" />
              {status === "loading" ? "Sending…" : "Send Message"}
            </Button>
          </div>

          {status === "success" && (
            <p className="text-emerald-400 text-sm">
              Thanks! Your message has been sent.
            </p>
          )}
          {status === "error" && (
            <p className="text-rose-400 text-sm">
              Something went wrong. Please try again.
            </p>
          )}
        </form>

        <div className="mt-10 text-center">
          <p className="text-gray-400 mb-4">Prefer direct contact?</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <a
              href="mailto:info.kfimusic@gmail.com"
              className="text-white hover:text-gray-300 transition-colors font-medium"
            >
              info.kfimusic@gmail.com
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
          {/* Social proof */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left max-w-4xl mx-auto">
            {/* Card 1 */}
            <div className="relative group">
              <div className="kfi-aura-warm thin rounded-xl" />
              <div className="relative z-10 kfi-glass-dark rounded-xl p-4 transition-transform duration-200 ease-out group-hover:-translate-y-0.5 group-hover:shadow-[0_0_28px_rgba(168,142,255,0.16)]">
                <p className="text-sm text-zinc-300">
                  “Perfect vibe for my last single. Super easy licensing.”
                </p>
                <div className="mt-3 text-xs text-zinc-500">
                  Indie Artist • US
                </div>
              </div>
            </div>

            {/* Card 2 */}
            <div className="relative group">
              <div className="kfi-aura-warm thin rounded-xl" />
              <div className="relative z-10 kfi-glass-dark rounded-xl p-4 transition-transform duration-200 ease-out group-hover:-translate-y-0.5 group-hover:shadow-[0_0_28px_rgba(168,142,255,0.16)]">
                <p className="text-sm text-zinc-300">
                  “Clean mix, strong low-end. Exactly what I needed.”
                </p>
                <div className="mt-3 text-xs text-zinc-500">Producer • UK</div>
              </div>
            </div>

            {/* Card 3 */}
            <div className="relative group">
              <div className="kfi-aura-warm thin rounded-xl" />
              <div className="relative z-10 kfi-glass-dark rounded-xl p-4 transition-transform duration-200 ease-out group-hover:-translate-y-0.5 group-hover:shadow-[0_0_28px_rgba(168,142,255,0.16)]">
                <p className="text-sm text-zinc-300">
                  “Fast delivery and great communication. 10/10.”
                </p>
                <div className="mt-3 text-xs text-zinc-500">Label A&R • DE</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactForm;
