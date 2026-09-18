import { Link } from "react-router-dom";
import type { LicenseType } from "@/config/licenses";
import {
  getBeatLicenseOptions,
  type BeatLicenseOption,
} from "@/lib/beatLicenses";
import { formatPrice } from "@/lib/catalog";
import { cn } from "@/lib/utils";
import type { BeatData } from "@/data/beats";

const SHORT_LABEL: Record<LicenseType, string> = {
  starter: "Starter",
  premium: "Premium",
  unlimited: "Unlimited",
  exclusive: "Exclusive",
};

const SHORT_COPY: Record<LicenseType, string> = {
  starter: "WAV · Demos and small releases",
  premium: "WAV · Commercial streaming",
  unlimited: "WAV + stems · Full mixing control",
  exclusive: "Full ownership · Removed from catalog",
};

type LicensePickerProps = {
  beat: BeatData;
  selected: LicenseType;
  onSelect: (type: LicenseType) => void;
  accent?: string;
};

export function shortLicenseLabel(type: LicenseType) {
  return SHORT_LABEL[type];
}

export default function LicensePicker({
  beat,
  selected,
  onSelect,
  accent = "#111111",
}: LicensePickerProps) {
  const options = getBeatLicenseOptions(beat);
  const leases = options.filter((option) => option.type !== "exclusive");
  const exclusive = options.find((option) => option.type === "exclusive");

  return (
    <div>
      <p className="kfi-kicker">License</p>
      <div className="mt-4 space-y-2">
        {leases.map((option) => (
          <LicenseRow
            key={option.type}
            option={option}
            selected={selected === option.type}
            accent={accent}
            onSelect={onSelect}
          />
        ))}
        {exclusive ? (
          <div className="lg:hidden">
            <LicenseRow
              option={exclusive}
              selected={selected === "exclusive"}
              accent={accent}
              onSelect={onSelect}
              sold={!exclusive.available}
            />
          </div>
        ) : null}
      </div>
      {exclusive ? (
        <p className="mt-4 hidden text-[12px] text-[#999991] lg:block">
          {beat.sold
            ? "Exclusive · Sold"
            : exclusive.available
              ? `Exclusive · ${formatPrice(exclusive.price)}`
              : "Exclusive license unavailable"}
        </p>
      ) : null}
      {exclusive?.available ? (
        <button
          type="button"
          onClick={() => onSelect("exclusive")}
          className={cn(
            "mt-2 hidden text-[12px] lg:inline-flex",
            selected === "exclusive" ? "text-foreground" : "text-[#6F6F69] hover:text-foreground"
          )}
        >
          {selected === "exclusive" ? "Exclusive selected" : "Select exclusive"}
        </button>
      ) : null}
      <Link
        to="/licensing"
        className="mt-5 inline-flex min-h-11 items-center text-[12px] text-[#999991] hover:text-foreground lg:min-h-0"
      >
        Compare licenses
      </Link>
    </div>
  );
}

function LicenseRow({
  option,
  selected,
  accent,
  onSelect,
  sold,
}: {
  option: BeatLicenseOption;
  selected: boolean;
  accent: string;
  onSelect: (type: LicenseType) => void;
  sold?: boolean;
}) {
  const unavailable = !option.available && !sold;
  return (
    <button
      type="button"
      disabled={unavailable || Boolean(sold)}
      onClick={() => option.available && onSelect(option.type)}
        className={cn(
        "w-full min-h-[72px] rounded-[14px] border px-4 py-3.5 text-left lg:min-h-0",
        option.available ? "hover:border-black/20" : sold ? "border-black/[0.08]" : "opacity-40 cursor-not-allowed",
        selected ? "bg-white" : "border-black/[0.08] bg-transparent"
      )}
      style={selected ? { borderColor: accent } : undefined}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium">{SHORT_LABEL[option.type]}</p>
          <p className="mt-1 text-[13px] lg:text-[12px] text-[#6F6F69]">
            {sold ? "Sold" : option.available ? SHORT_COPY[option.type] : option.description}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm tabular-nums">
            {sold ? "" : formatPrice(option.price)}
          </span>
          <span
            className="h-4 w-4 rounded-full border"
            style={{
              borderColor: selected ? accent : "rgba(17,17,17,0.2)",
              background: selected ? accent : "transparent",
            }}
          />
        </div>
      </div>
    </button>
  );
}
