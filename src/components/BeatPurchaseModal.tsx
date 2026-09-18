import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import Modal from "@/components/Modal";
import LicensePicker, { shortLicenseLabel } from "@/components/LicensePicker";
import BeatArtwork from "@/components/BeatArtwork";
import { Button } from "@/components/ui/button";
import { startCheckout } from "@/lib/checkout";
import type { LicenseType } from "@/config/licenses";
import type { BeatData } from "@/data/beats";
import { useCart } from "@/hooks/useCart";
import { getLicenseDisplayLabel, getBeatLicenseOptions } from "@/lib/beatLicenses";
import { formatGenre, formatPrice } from "@/lib/catalog";
import { getAccentColor } from "@/lib/artwork";

type BeatPurchaseModalProps = {
  beat: BeatData;
  open: boolean;
  onClose: () => void;
};

export default function BeatPurchaseModal({
  beat,
  open,
  onClose,
}: BeatPurchaseModalProps) {
  const { addItemWithLicense, getItem, openDrawer } = useCart();
  const cartItem = getItem(beat.id);
  const [selectedLicense, setSelectedLicense] = useState<LicenseType>("premium");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const accent = getAccentColor(beat);

  useEffect(() => {
    if (open) {
      setSelectedLicense(cartItem?.selectedLicense ?? "premium");
      setCheckoutLoading(false);
    }
  }, [open, beat.id, cartItem?.selectedLicense]);

  const licenseOptions = useMemo(() => getBeatLicenseOptions(beat), [beat]);
  const selectedOption =
    licenseOptions.find((option) => option.type === selectedLicense) ??
    licenseOptions.find((option) => option.available);
  const guardsOk = Boolean(selectedOption?.available);

  const handleAddToCart = () => {
    if (!guardsOk || !selectedOption) return;
    const alreadySelected = cartItem?.selectedLicense === selectedLicense;
    addItemWithLicense(beat, selectedLicense);
    toast.success(
      alreadySelected ? "Cart ready" : cartItem ? "Cart updated" : "Added to cart",
      { description: `${beat.title} · ${shortLicenseLabel(selectedLicense)}` }
    );
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
      const message =
        err instanceof Error ? err.message : "Checkout failed. Please try again later.";
      toast.error(message);
      setCheckoutLoading(false);
    }
  };

  if (!open) return null;

  return (
    <Modal
      title="Choose license"
      onClose={() => {
        if (!checkoutLoading) onClose();
      }}
    >
      <div className="flex gap-4 mb-6">
        <BeatArtwork beat={beat} className="h-20 w-20 shrink-0 rounded-[12px]" compact />
        <div className="min-w-0">
          <h2 className="font-display text-xl tracking-display truncate">{beat.title}</h2>
          <p className="mt-1 text-sm text-[#6F6F69]">
            {formatGenre(beat.genre)} · {beat.bpm} BPM
          </p>
          {cartItem ? (
            <p className="mt-2 text-[12px] text-[#999991]">
              In cart as {getLicenseDisplayLabel(cartItem.selectedLicense)}
            </p>
          ) : null}
        </div>
      </div>

      <LicensePicker
        beat={beat}
        selected={selectedLicense}
        onSelect={setSelectedLicense}
        accent={accent}
      />

      <div className="mt-6 flex flex-col sm:flex-row gap-2.5">
        <Button
          type="button"
          variant="outline"
          onClick={handleAddToCart}
          disabled={checkoutLoading || !guardsOk}
          className="h-12 flex-1"
        >
          {cartItem ? "Update cart" : "Add to cart"}
        </Button>
        <Button
          type="button"
          onClick={handleBuyNow}
          disabled={checkoutLoading || !guardsOk}
          className="h-12 flex-1"
        >
          {checkoutLoading
            ? "Redirecting…"
            : `Continue with ${shortLicenseLabel(selectedOption?.type ?? "premium")} · ${formatPrice(selectedOption?.price ?? 0)}`}
        </Button>
      </div>
    </Modal>
  );
}
