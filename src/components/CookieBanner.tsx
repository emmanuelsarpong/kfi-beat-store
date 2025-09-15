import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const COOKIE_KEY = "kfi_cookie_consent_v1";

const CookieBanner = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const val = localStorage.getItem(COOKIE_KEY);
    if (!val) setOpen(true);
  }, []);

  const accept = () => {
    localStorage.setItem(COOKIE_KEY, "accepted");
    setOpen(false);
  };

  const decline = () => {
    localStorage.setItem(COOKIE_KEY, "declined");
    setOpen(false);
  };

  if (!open) return null;
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
      <div className="mx-auto max-w-3xl bg-zinc-950/95 border border-zinc-800 rounded-xl p-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <p className="text-sm text-zinc-300">
            We use cookies to personalize content and analyze traffic. By
            clicking Accept, you consent to our cookies.
          </p>
          <div className="flex gap-2 ml-auto">
            <Button
              onClick={decline}
              className="bg-zinc-800 text-white hover:bg-zinc-700"
            >
              Decline
            </Button>
            <Button
              onClick={accept}
              className="bg-white text-black hover:bg-zinc-200"
            >
              Accept
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieBanner;
