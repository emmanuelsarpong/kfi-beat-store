import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import Modal from "@/components/Modal";
import { Button } from "@/components/ui/button";
import { startCheckout } from "@/lib/checkout";
import {
  MIN_LICENSE_PRICE_DISPLAY,
  type LicenseType,
} from "@/config/licenses";
import type { BeatData } from "@/data/beats";
import { useCart } from "@/hooks/useCart";
import {
  getBeatLicenseOptions,
  getLicenseDisplayLabel,
} from "@/lib/beatLicenses";

type BeatPurchaseModalProps = {
  beat: BeatData;
  open: boolean;
  onClose: () => void;
};

function stopEvent(e: { stopPropagation?: () => void }) {
  e.stopPropagation?.();
}

export default function BeatPurchaseModal({
  beat,
  open,
  onClose,
}: BeatPurchaseModalProps) {
  const { addItemWithLicense, getItem, openDrawer } = useCart();
  const cartItem = getItem(beat.id);
  const [selectedLicense, setSelectedLicense] =
    useState<LicenseType>("premium");
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setSelectedLicense(cartItem?.selectedLicense ?? "premium");
      setCheckoutLoading(false);
    }
  }, [open, beat.id, cartItem?.selectedLicense]);

  const licenseOptions = useMemo(() => getBeatLicenseOptions(beat), [beat]);
  const selectedOption = useMemo(
    () =>
      licenseOptions.find((option) => option.type === selectedLicense) ??
      licenseOptions[1],
    [licenseOptions, selectedLicense]
  );

  const selectedLabel = useMemo(() => {
    return getLicenseDisplayLabel(selectedLicense);
  }, [selectedLicense]);

  const guardsOk = Boolean(selectedOption?.available);

  const handleAddToCart = () => {
    if (!guardsOk) return;
    const alreadySelected = cartItem?.selectedLicense === selectedLicense;
    addItemWithLicense(beat, selectedLicense);
    toast.success(alreadySelected ? "Cart ready" : cartItem ? "Cart updated" : "Added to cart", {
      description: `${beat.title} · ${selectedLabel}`,
    });
    openDrawer();
    onClose();
  };

  const handleBuyNow = async () => {
    if (!guardsOk) return;

    try {
      setCheckoutLoading(true);
      await startCheckout({
        beatId: beat.id,
        beatTitle: beat.title,
        licenseType: selectedLicense,
      });
    } catch (err) {
      console.error(err);
      const message =
        err instanceof Error
          ? err.message
          : "Checkout failed. Please try again later.";
      toast.error(message);
      setCheckoutLoading(false);
    }
  };

  if (!open) return null;

  return (
    <Modal
      title="Choose License"
      onClose={() => {
        if (!checkoutLoading) onClose();
      }}
    >
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-black/95 via-zinc-950/95 to-black/98 shadow-[0_14px_40px_rgba(0,0,0,0.8)]">
        <div className="pointer-events-none absolute -inset-8 bg-[radial-gradient(circle_at_top,_rgba(148,163,255,0.12),_transparent_50%),radial-gradient(circle_at_bottom,_rgba(251,191,36,0.06),_transparent_50%)] opacity-90" />

        <div className="relative p-5 sm:p-6">
          <div className="flex gap-3 sm:gap-4 mb-[18px]">
            <div className="relative w-24 h-20 sm:w-28 sm:h-24 rounded-xl overflow-hidden shadow-lg shrink-0">
              {(() => {
                const num = parseInt(beat.id, 10);
                const paletteCount = 21;
                const forced = Number(beat.coverVariant);
                const idx =
                  Number.isFinite(forced) && forced > 0
                    ? (Math.floor(forced) - 1) % paletteCount
                    : isNaN(num)
                      ? Math.abs(
                          Array.from(beat.id).reduce(
                            (a, c) => a + c.charCodeAt(0),
                            0
                          )
                        ) % paletteCount
                      : (num - 1) % paletteCount;
                const gradClass = `grad-beat-${idx + 1}`;
                return (
                  <div
                    role="img"
                    aria-label={`${beat.title} cover artwork`}
                    className={`grad-beat-base ${gradClass} scale-105`}
                  />
                );
              })()}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/20 via-black/5 to-black/70" />
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <p className="text-[10px] tracking-[0.2em] text-zinc-500 uppercase">
                Beat
              </p>
              <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-white truncate">
                {beat.title}
              </h2>
              <p className="text-xs text-zinc-400">
                {beat.genre} • {beat.bpm} BPM
                {beat.mood ? ` • ${beat.mood}` : ""}
                {beat.key ? ` • ${beat.key}` : ""}
              </p>
              <p className="text-xs text-zinc-500">
                Leases from ${MIN_LICENSE_PRICE_DISPLAY.toFixed(0)}
              </p>
              {cartItem ? (
                <p className="text-[11px] text-amber-200/85">
                  Already in cart as {getLicenseDisplayLabel(cartItem.selectedLicense)}
                </p>
              ) : null}
            </div>
          </div>

          <div className="space-y-2.5">
            {licenseOptions.map((option) => {
              const isActive = selectedLicense === option.type;
              return (
                <button
                  key={option.type}
                  type="button"
                  onClick={(e) => {
                    stopEvent(e);
                    if (option.available) setSelectedLicense(option.type);
                  }}
                  disabled={!option.available}
                  className={`w-full text-left rounded-[14px] border px-4 py-4 md:px-5 md:py-4 transition-all duration-200 flex items-start justify-between gap-4 ${
                    !option.available
                      ? "border-white/10 bg-white/[0.02] opacity-60 cursor-not-allowed"
                      : isActive
                        ? "border-[rgba(255,210,90,0.7)] shadow-[0_0_0_1px_rgba(255,210,90,0.35)] bg-[rgba(255,210,90,0.05)]"
                        : option.type === "exclusive"
                          ? "border-white/10 bg-[linear-gradient(180deg,rgba(255,215,120,0.06),rgba(255,215,120,0.02))] hover:border-white/25 hover:bg-white/[0.04] hover:shadow-[0_0_0_1px_rgba(255,255,255,0.08)]"
                          : "border-white/10 bg-white/[0.02] hover:border-white/25 hover:bg-white/[0.04] hover:shadow-[0_0_0_1px_rgba(255,255,255,0.08)]"
                  }`}
                >
                  <div className="space-y-0.5 flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-white">
                        {option.label}
                      </p>
                      {option.featured && option.available && (
                        <span className="shrink-0 text-[10px] font-medium tracking-wide uppercase px-2 py-0.5 rounded-full bg-[rgba(255,210,90,0.2)] text-[rgba(255,210,90,0.95)] border border-[rgba(255,210,90,0.35)]">
                          Most Popular
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400">
                      {option.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <p className="text-base font-semibold text-zinc-50">
                      ${option.price.toFixed(0)}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          <div
            className="mt-6 pt-4 border-t border-white/[0.06] flex flex-col gap-4"
            role="group"
            aria-label="Selected license and purchase actions"
          >
            <div className="text-xs sm:text-sm text-zinc-400">
              <span className="text-zinc-500 block mb-1 font-medium tracking-wide">
                Selected License
              </span>
              <span className="text-zinc-200 font-medium">{selectedLabel}</span>
              <span className="text-zinc-500 mx-1">•</span>
              <span className="text-zinc-100">
                ${selectedOption.price.toFixed(0)}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row gap-2.5 sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={handleAddToCart}
                disabled={
                  checkoutLoading ||
                  !selectedOption.available
                }
                className="h-[52px] rounded-2xl font-medium border-white/15 bg-white/[0.03] text-zinc-100 hover:bg-white/[0.07] hover:text-white"
              >
                {cartItem ? "Update cart" : "Add to cart"}
              </Button>
              <Button
                type="button"
                onClick={handleBuyNow}
                disabled={
                  checkoutLoading ||
                  !selectedOption.available
                }
                className="relative inline-flex items-center justify-center h-[52px] px-6 rounded-2xl font-semibold text-white bg-[linear-gradient(135deg,#1f1f1f,#0d0d0d)] border border-white/15 hover:border-white/25 hover:-translate-y-[1px] hover:shadow-[0_10px_25px_rgba(0,0,0,0.4)] transition-transform duration-200 ease-out disabled:opacity-60 disabled:hover:translate-y-0"
              >
                {checkoutLoading
                  ? "Redirecting..."
                  : !selectedOption.available
                    ? selectedOption.description
                    : `Buy now — $${selectedOption.price.toFixed(0)}`}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
