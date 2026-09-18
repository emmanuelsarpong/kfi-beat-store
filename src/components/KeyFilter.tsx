import { useState } from "react";
import { Popover } from "@headlessui/react";
import { cn } from "@/lib/utils";

type KeyFilterValue = {
  note: string | null;
  quality: "Maj" | "min" | null;
};

type KeyFilterProps = {
  value: KeyFilterValue;
  onChange: (val: KeyFilterValue) => void;
  fullWidth?: boolean;
  className?: string;
  inline?: boolean;
};

const SHARP_NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"] as const;
const FLAT_NOTES = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"] as const;

export default function KeyFilter({
  value,
  onChange,
  fullWidth,
  className,
  inline = false,
}: KeyFilterProps) {
  const [tab, setTab] = useState<"flat" | "sharp">("flat");
  const [temp, setTemp] = useState<KeyFilterValue>(value);
  const active = Boolean(value.note);
  const label =
    value.note && value.quality
      ? `${value.note} ${value.quality}`
      : value.note
        ? value.note
        : "Key +";

  const notes = tab === "sharp" ? SHARP_NOTES : FLAT_NOTES;

  if (inline) {
    return (
      <div className={cn("w-full", className)}>
        <div className="flex gap-4 mb-4 text-sm">
          <button
            type="button"
            className={tab === "flat" ? "text-foreground" : "text-[#999991]"}
            onClick={() => setTab("flat")}
          >
            Flat
          </button>
          <button
            type="button"
            className={tab === "sharp" ? "text-foreground" : "text-[#999991]"}
            onClick={() => setTab("sharp")}
          >
            Sharp
          </button>
        </div>
        <div className="grid grid-cols-6 gap-2 mb-3">
          {notes.map((n) => (
            <button
              key={n}
              type="button"
              className={cn(
                "h-11 rounded-[8px] text-sm",
                value.note === n ? "bg-foreground text-background" : "bg-white text-[#6F6F69]"
              )}
              onClick={() => onChange({ ...value, note: n })}
            >
              {n}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            className={cn(
              "h-11 rounded-[8px] text-sm",
              value.quality === "Maj" ? "bg-foreground text-background" : "bg-white text-[#6F6F69]"
            )}
            onClick={() => onChange({ ...value, quality: "Maj" })}
          >
            Major
          </button>
          <button
            type="button"
            className={cn(
              "h-11 rounded-[8px] text-sm",
              value.quality === "min" ? "bg-foreground text-background" : "bg-white text-[#6F6F69]"
            )}
            onClick={() => onChange({ ...value, quality: "min" })}
          >
            Minor
          </button>
        </div>
      </div>
    );
  }

  return (
    <Popover className="relative z-[100]">
      <Popover.Button
        className={cn(
          "px-3 py-1.5 rounded-full text-sm border border-transparent text-[#6F6F69] hover:text-foreground",
          active && "text-foreground",
          fullWidth && "w-full",
          className
        )}
        onClick={() => setTemp(value)}
      >
        {label}
      </Popover.Button>
      <Popover.Panel className="absolute z-[100] mt-2 left-0 w-[min(20rem,92vw)] rounded-[16px] border border-black/[0.08] bg-white p-4 shadow-soft">
        <div className="flex gap-4 mb-4 text-sm">
          <button
            className={tab === "flat" ? "text-foreground" : "text-[#999991]"}
            onClick={() => setTab("flat")}
          >
            Flat
          </button>
          <button
            className={tab === "sharp" ? "text-foreground" : "text-[#999991]"}
            onClick={() => setTab("sharp")}
          >
            Sharp
          </button>
        </div>
        <div className="grid grid-cols-6 gap-2 mb-3">
          {notes.map((n) => (
            <button
              key={n}
              type="button"
              className={cn(
                "h-8 rounded-[8px] text-sm",
                temp.note === n ? "bg-foreground text-background" : "bg-[#F6F5F1] text-[#6F6F69]"
              )}
              onClick={() => setTemp((t) => ({ ...t, note: n }))}
            >
              {n}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            className={cn(
              "h-9 rounded-[8px] text-sm",
              temp.quality === "Maj" ? "bg-foreground text-background" : "bg-[#F6F5F1] text-[#6F6F69]"
            )}
            onClick={() => setTemp((t) => ({ ...t, quality: "Maj" }))}
          >
            Major
          </button>
          <button
            type="button"
            className={cn(
              "h-9 rounded-[8px] text-sm",
              temp.quality === "min" ? "bg-foreground text-background" : "bg-[#F6F5F1] text-[#6F6F69]"
            )}
            onClick={() => setTemp((t) => ({ ...t, quality: "min" }))}
          >
            Minor
          </button>
        </div>
        <div className="flex justify-between items-center mt-4">
          <button
            className="text-xs text-[#999991]"
            onClick={() => {
              setTemp({ note: null, quality: null });
              onChange({ note: null, quality: null });
            }}
            type="button"
          >
            Clear
          </button>
          <Popover.Button as="button" className="text-sm" onClick={() => onChange(temp)}>
            Apply
          </Popover.Button>
        </div>
      </Popover.Panel>
    </Popover>
  );
}
