import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { startCartCheckout } from "@/lib/checkout";
import { useCart } from "@/hooks/useCart";
import type { CartItem } from "@/lib/cartItem";
import { cartItemToLicenseSource } from "@/lib/cartItem";
import {
  getBeatLicenseOptions,
  getLicenseDisplayLabel,
} from "@/lib/beatLicenses";
import { formatPrice } from "@/lib/catalog";
import { shortLicenseLabel } from "@/components/LicensePicker";
import BeatArtwork from "@/components/BeatArtwork";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";

function ArtworkThumb({ item }: { item: CartItem }) {
  return (
    <BeatArtwork
      beat={{
        id: item.beatId,
        title: item.title,
        coverImage: item.artworkUrl,
        coverVariant: item.coverVariant,
      }}
      className="h-16 w-16 rounded-[10px]"
      compact
    />
  );
}

export default function CartDrawer() {
  const {
    items,
    ready,
    drawerOpen,
    setDrawerOpen,
    removeItem,
    updateItemLicense,
    getSubtotal,
  } = useCart();
  const [checkingOut, setCheckingOut] = useState(false);
  const modalRoot =
    typeof document !== "undefined" ? document.getElementById("modal-root") : null;

  useEffect(() => {
    if (typeof document === "undefined" || !drawerOpen) return;
    const { body } = document;
    const previousOverflow = body.style.overflow;
    body.style.overflow = "hidden";
    return () => {
      body.style.overflow = previousOverflow;
    };
  }, [drawerOpen]);

  const handleRemove = (beatId: string, title: string) => {
    removeItem(beatId);
    toast.message("Removed from cart", { description: title });
  };

  const handleCheckout = async () => {
    if (!items.length) return;
    try {
      setCheckingOut(true);
      await startCartCheckout(
        items.map((item) => ({
          beatId: item.beatId,
          beatTitle: item.title,
          selectedLicense: item.selectedLicense,
        }))
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Checkout failed. Try again.";
      toast.error(msg);
      setCheckingOut(false);
    }
  };

  return (
    <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
      <SheetContent
        side="right"
        container={modalRoot}
        overlayClassName="bg-black/25 backdrop-blur-[8px]"
        className="w-full max-w-none h-full border-l border-black/[0.06] bg-[#F6F5F1] text-foreground p-0 flex flex-col lg:max-w-[420px]"
      >
        <SheetHeader className="px-5 pt-6 pb-4 border-b border-black/[0.06] pr-14">
          <SheetTitle className="text-left font-display text-2xl tracking-display">
            Cart
          </SheetTitle>
          <SheetDescription className="text-left text-sm text-[#6F6F69]">
            {!ready
              ? "Loading…"
              : items.length === 0
                ? "Your cart is quiet."
                : `${items.length} beat${items.length === 1 ? "" : "s"}`}
          </SheetDescription>
        </SheetHeader>

        {!ready ? (
          <div className="flex-1 flex items-center justify-center px-6 py-12 text-sm text-[#6F6F69]">
            Loading cart…
          </div>
        ) : items.length === 0 ? (
          <div className="flex-1 px-6 pt-10 pb-12 lg:flex lg:flex-col lg:items-center lg:justify-center lg:text-center">
            <div className="kfi-wave text-foreground/40 mb-6 hidden lg:inline-flex" aria-hidden>
              <span />
              <span />
              <span />
              <span />
            </div>
            <h3 className="font-display text-2xl tracking-display">Your cart is quiet.</h3>
            <p className="mt-3 text-sm text-[#6F6F69] max-w-xs lg:mx-auto">
              Add a beat when something catches your ear.
            </p>
            <Button asChild className="mt-8 w-full lg:w-auto">
              <Link to="/store" onClick={() => setDrawerOpen(false)}>
                Explore beats →
              </Link>
            </Button>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 min-h-0">
              <ul className="px-5 py-4 space-y-0">
                {items.map((item, index) => (
                  <li
                    key={item.id}
                    className={index > 0 ? "border-t border-black/[0.06] pt-5 mt-5" : ""}
                  >
                    <div className="flex gap-4">
                      <ArtworkThumb item={item} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium truncate">{item.title}</p>
                            <p className="mt-1 text-[13px] text-[#6F6F69]">
                              {shortLicenseLabel(item.selectedLicense)} license
                            </p>
                          </div>
                          <p className="text-sm tabular-nums">{formatPrice(item.unitPrice)}</p>
                        </div>
                        <CartLicenseSelect
                          item={item}
                          onSelect={(licenseType) => {
                            updateItemLicense(item.beatId, licenseType);
                            toast.success("License updated", {
                              description: `${item.title} · ${getLicenseDisplayLabel(licenseType)}`,
                            });
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemove(item.beatId, item.title)}
                          className="mt-3 text-[12px] text-[#999991] hover:text-foreground"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </ScrollArea>
            <div className="border-t border-black/[0.06] p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#6F6F69]">Subtotal</span>
                <span className="text-lg tabular-nums">{formatPrice(getSubtotal())}</span>
              </div>
              <Button
                disabled={checkingOut}
                onClick={handleCheckout}
                className="w-full h-12"
              >
                {checkingOut ? "Redirecting…" : `Checkout · ${formatPrice(getSubtotal())}`}
              </Button>
              <p className="text-center text-[11px] text-[#999991]">Secure checkout</p>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function CartLicenseSelect({
  item,
  onSelect,
}: {
  item: CartItem;
  onSelect: (licenseType: CartItem["selectedLicense"]) => void;
}) {
  const options = useMemo(
    () => getBeatLicenseOptions(cartItemToLicenseSource(item)).filter((option) => option.type !== "exclusive" || option.available),
    [item]
  );

  return (
    <select
      className="mt-3 h-9 w-full rounded-[8px] border border-black/[0.08] bg-white px-2 text-sm"
      value={item.selectedLicense}
      onChange={(e) => onSelect(e.target.value as CartItem["selectedLicense"])}
    >
      {options.map((option) => (
        <option key={option.type} value={option.type} disabled={!option.available}>
          {shortLicenseLabel(option.type)} · {formatPrice(option.price)}
          {option.available ? "" : " (unavailable)"}
        </option>
      ))}
    </select>
  );
}
