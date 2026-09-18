import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import axios from "axios";

const serverUrl = import.meta.env.VITE_SERVER_URL as string | undefined;

const ContactForm = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );

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
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
      <div className="lg:col-span-5">
        <p className="kfi-kicker">Contact</p>
        <h2 className="mt-4 font-display text-[40px] lg:text-5xl tracking-display leading-[1.05]">
          Start a
          <br />
          conversation.
        </h2>
        <p className="mt-6 max-w-sm text-[15px] leading-7 text-[#6F6F69]">
          Custom production, holds, or a question about a license. Write when
          you’re ready.
        </p>
        <div className="mt-8 flex flex-col gap-2 text-sm">
          <a href="mailto:info.kfimusic@gmail.com" className="hover:text-[#6F6F69]">
            info.kfimusic@gmail.com
          </a>
          <a
            href="https://instagram.com/thisiskfi"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#6F6F69]"
          >
            Instagram
          </a>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-5">
        <div className="grid sm:grid-cols-2 gap-5">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-[12px] uppercase tracking-[0.16em] text-[#999991]">
              Name
            </Label>
            <Input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="h-12 rounded-[10px] border-black/[0.08] bg-white text-foreground"
              placeholder="Your name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-[12px] uppercase tracking-[0.16em] text-[#999991]">
              Email
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="h-12 rounded-[10px] border-black/[0.08] bg-white text-foreground"
              placeholder="you@studio.com"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="message" className="text-[12px] uppercase tracking-[0.16em] text-[#999991]">
            Message
          </Label>
          <Textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            required
            rows={6}
            className="rounded-[10px] border-black/[0.08] bg-white text-foreground resize-none"
            placeholder="Tell me about the record."
          />
        </div>
        <Button type="submit" size="lg" disabled={status === "loading"} className="w-full px-7 lg:w-auto">
          {status === "loading" ? "Sending…" : "Send message"}
        </Button>
        {status === "success" && (
          <p className="text-sm text-[#6F6F69]">Received. I’ll get back to you soon.</p>
        )}
        {status === "error" && (
          <p className="text-sm text-destructive">Something went wrong. Please try again.</p>
        )}
      </form>
    </div>
  );
};

export default ContactForm;
