import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Check,
  ChevronDown,
  ShoppingBag,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { startCartCheckout } from "@/lib/checkout";
import { useCart } from "@/hooks/useCart";
import type { CartItem } from "@/lib/cartItem";
import { cartItemToLicenseSource } from "@/lib/cartItem";
import {
  getBeatLicenseOptions,
  getLicenseDisplayLabel,
} from "@/lib/beatLicenses";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";

function getGradientClass(item: CartItem) {
  const paletteCount = 22;
  const forced = Number(item.coverVariant);
  if (Number.isFinite(forced) && forced > 0) {
    return `grad-beat-${(Math.floor(forced) - 1) % paletteCount + 1}`;
  }
  const num = parseInt(item.beatId, 10);
  const idx = Number.isFinite(num)
    ? (num - 1) % paletteCount
    : Math.abs(Array.from(item.beatId).reduce((a, c) => a + c.charCodeAt(0), 0)) %
      paletteCount;
  return `grad-beat-${idx + 1}`;
}

function getBeatInitials(title: string) {
  const clean = title.trim();
  if (!clean) return "KB";
  const parts = clean.split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || "KB";
}

function ArtworkThumb({ item }: { item: CartItem }) {
  const [imageFailed, setImageFailed] = useState(false);
  const fallbackClass = getGradientClass(item);
  const initials = getBeatInitials(item.title);

  if (item.artworkUrl && !imageFailed) {
    return (
      <div className="relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-black/30 shadow-[0_12px_30px_rgba(0,0,0,0.35)]">
        <img
          src={item.artworkUrl}
          alt={`${item.title} artwork`}
          className="h-full w-full object-cover"
          onError={() => setImageFailed(true)}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/35" />
      </div>
    );
  }

  return (
    <div className="relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-black/30 shadow-[0_12px_30px_rgba(0,0,0,0.35)]">
      <div
        className={`grad-beat-base ${fallbackClass} h-full w-full scale-105`}
        aria-hidden
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-black/10 to-black/55" />
      <div className="absolute inset-0 flex items-center justify-center text-lg font-semibold tracking-[0.14em] text-white/90">
        {initials}
      </div>
    </div>
  );
}

function CartLicenseEditor({
  item,
  expanded,
  onToggle,
  onSelect,
}: {
  item: CartItem;
  expanded: boolean;
  onToggle: () => void;
  onSelect: (licenseType: CartItem["selectedLicense"]) => void;
}) {
  const options = useMemo(
    () => getBeatLicenseOptions(cartItemToLicenseSource(item)),
    [item]
  );

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={onToggle}
        className="w-full inline-flex min-h-11 items-center justify-between rounded-2xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-left transition-colors hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/40"
      >
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.24em] text-zinc-500">
            License
          </p>
          <p className="mt-1 text-sm font-medium text-zinc-100">
            {getLicenseDisplayLabel(item.selectedLicense)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-white">
            ${item.unitPrice.toFixed(0)}
          </span>
          <ChevronDown
            className={`h-4 w-4 text-zinc-500 transition-transform ${
              expanded ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>

      {expanded ? (
        <div className="mt-2 grid gap-2">
          {options.map((option) => {
            const selected = option.type === item.selectedLicense;
            return (
              <button
                key={option.type}
                type="button"
                disabled={!option.available}
                onClick={() => onSelect(option.type)}
                className={`rounded-2xl border px-3 py-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/40 ${
                  !option.available
                    ? "border-white/[0.05] bg-white/[0.02] opacity-45 cursor-not-allowed"
                    : selected
                      ? "border-amber-300/50 bg-amber-300/[0.08] shadow-[0_0_0_1px_rgba(252,211,77,0.15)]"
                      : "border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.05] hover:border-white/[0.12]"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-white">
                        {option.label}
                      </p>
                      {selected ? (
                        <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-amber-300 text-black">
                          <Check className="h-3 w-3" />
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs text-zinc-500">
                      {option.description}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-zinc-100">
                    ${option.price.toFixed(0)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
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
    clearCart,
  } = useCart();
  const [checkingOut, setCheckingOut] = useState(false);
  const [editingBeatId, setEditingBeatId] = useState<string | null>(null);
  const modalRoot =
    typeof document !== "undefined"
      ? document.getElementById("modal-root")
      : null;

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
    setEditingBeatId((current) => (current === beatId ? null : current));
    toast.message("Removed from cart", {
      description: title,
    });
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
      console.error(e);
      const msg =
        e instanceof Error ? e.message : "Checkout failed. Try again.";
      toast.error(msg);
      setCheckingOut(false);
    }
  };

  return (
    <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
      <SheetContent
        side="right"
        container={modalRoot}
        overlayClassName="bg-[rgba(0,0,0,0.72)] backdrop-blur-[10px]"
        className="w-full sm:max-w-[440px] border-l border-white/10 bg-[linear-gradient(180deg,#090909,#050505)] text-white p-0 flex flex-col shadow-[-28px_0_80px_rgba(0,0,0,0.7)]"
      >
        <SheetHeader className="px-5 pt-6 pb-4 border-b border-white/[0.06] bg-[radial-gradient(circle_at_top,rgba(250,204,21,0.08),transparent_42%)]">
          <SheetTitle className="text-left text-lg font-semibold tracking-tight text-white">
            Cart
          </SheetTitle>
          <SheetDescription className="text-left text-xs text-zinc-500 font-normal">
            {!ready
              ? "Loading your selection tray…"
              : items.length === 0
                ? "Nothing here yet"
                : `${items.length} beat${items.length === 1 ? "" : "s"} staged for checkout`}
          </SheetDescription>
        </SheetHeader>

        {!ready ? (
          <div className="flex-1 flex items-center justify-center px-6 py-12 text-sm text-zinc-500">
            Loading cart…
          </div>
        ) : items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-zinc-300">
              <ShoppingBag className="h-6 w-6" />
            </div>
            <h3 className="mt-5 text-lg font-medium tracking-tight text-white">
              Your cart is empty
            </h3>
            <p className="mt-2 text-sm text-zinc-400 max-w-xs">
              Add beats with a selected license when you are ready to check out.
              Favorites stay separate.
            </p>
            <Button
              asChild
              variant="outline"
              className="mt-6 rounded-full border-white/15 bg-white/[0.04] text-white hover:bg-white/[0.08]"
            >
              <Link to="/store" onClick={() => setDrawerOpen(false)}>
                Browse store
              </Link>
            </Button>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 min-h-0">
              <div className="px-4 py-4">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-[11px] tracking-[0.18em] uppercase text-zinc-500">
                  <Sparkles className="h-3.5 w-3.5" />
                  Purchase-ready selection
                </div>
                <ul className="space-y-3">
                {items.map((item) => {
                  const meta = [item.genre, item.bpm ? `${item.bpm} BPM` : null, item.key]
                    .filter(Boolean)
                    .join(" • ");
                  return (
                    <li
                      key={item.id}
                      className="rounded-[24px] border border-white/[0.07] bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02))] p-3.5 shadow-[0_10px_36px_rgba(0,0,0,0.28)]"
                    >
                      <div className="flex gap-3.5">
                        <ArtworkThumb item={item} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <p className="font-medium text-[15px] leading-tight text-white truncate">
                                {item.title}
                              </p>
                              {meta ? (
                                <p className="mt-1 text-[11px] text-zinc-500">
                                  {meta}
                                </p>
                              ) : null}
                            </div>
                            <div className="shrink-0 text-right">
                              <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                                Price
                              </p>
                              <p className="mt-1 text-sm font-semibold text-white">
                                ${item.unitPrice.toFixed(0)}
                              </p>
                            </div>
                          </div>

                          <CartLicenseEditor
                            item={item}
                            expanded={editingBeatId === item.beatId}
                            onToggle={() =>
                              setEditingBeatId((current) =>
                                current === item.beatId ? null : item.beatId
                              )
                            }
                            onSelect={(licenseType) => {
                              updateItemLicense(item.beatId, licenseType);
                              setEditingBeatId(null);
                              toast.success("License updated", {
                                description: `${item.title} · ${getLicenseDisplayLabel(licenseType)}`,
                              });
                            }}
                          />

                          <div className="mt-3 flex items-center justify-between gap-3">
                            <p className="text-[11px] text-zinc-600">
                              1 beat · {getLicenseDisplayLabel(item.selectedLicense)}
                            </p>
                            <button
                              type="button"
                              aria-label={`Remove ${item.title} from cart`}
                              onClick={() => handleRemove(item.beatId, item.title)}
                              className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3.5 text-sm text-zinc-400 transition-colors hover:border-white/[0.14] hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/40"
                            >
                              <Trash2 className="h-4 w-4" />
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
                </ul>
              </div>
            </ScrollArea>

            <div className="border-t border-white/[0.06] bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(0,0,0,0.35))] p-5 space-y-4 backdrop-blur-xl shadow-[0_-16px_30px_rgba(0,0,0,0.25)]">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">
                    Subtotal
                  </p>
                  <p className="mt-1 text-sm text-zinc-400">
                    Display total for your selected licenses
                  </p>
                </div>
                <span className="text-xl font-semibold tracking-tight text-white">
                  ${getSubtotal().toFixed(0)}
                </span>
              </div>
              <p className="text-[10px] text-zinc-600 leading-relaxed">
                Final totals and exclusive availability are rechecked on the
                server before Stripe checkout starts.
              </p>
              <Button
                disabled={checkingOut}
                onClick={handleCheckout}
                className="w-full h-12 rounded-2xl font-semibold text-white bg-[linear-gradient(135deg,#1a1a1a,#0a0a0a)] border border-white/15 hover:border-white/25 hover:-translate-y-[1px] transition-transform"
              >
                {checkingOut ? "Redirecting…" : "Checkout with Stripe"}
              </Button>
              <div className="flex items-center justify-between gap-3">
                <Button
                  asChild
                  variant="ghost"
                  className="h-10 px-0 text-zinc-400 hover:text-white hover:bg-transparent"
                >
                  <Link to="/store" onClick={() => setDrawerOpen(false)}>
                    Continue browsing
                  </Link>
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    clearCart();
                    setEditingBeatId(null);
                    toast.message("Cart cleared");
                  }}
                  className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  Clear cart
                </button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
