import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

const COOKIE_KEY = "kfi_cookie_consent_v1";

const CookieBanner = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const val = localStorage.getItem(COOKIE_KEY);
    if (!val) setOpen(true);
  }, []);

  if (!open) return null;
  return (
    <div
      className="fixed left-0 right-0 p-4 z-50"
      style={{ bottom: "calc(var(--player-h, 0px) + 12px + env(safe-area-inset-bottom, 0px))" }}
    >
      <div className="mx-auto max-w-3xl rounded-[16px] border border-black/[0.08] bg-white/90 backdrop-blur-md p-4 shadow-soft">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <p className="text-sm text-[#6F6F69]">
            We use cookies to keep the store working and understand what people play.
          </p>
          <div className="flex gap-2 sm:ml-auto">
            <Button
              variant="ghost"
              onClick={() => {
                localStorage.setItem(COOKIE_KEY, "declined");
                setOpen(false);
              }}
            >
              Decline
            </Button>
            <Button
              onClick={() => {
                localStorage.setItem(COOKIE_KEY, "accepted");
                setOpen(false);
              }}
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
