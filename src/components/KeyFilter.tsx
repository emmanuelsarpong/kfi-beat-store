import { useState } from "react";
import { Popover } from "@headlessui/react";

type KeyFilterValue = {
  note: string | null; // e.g., C, C#, Db
  quality: "Maj" | "min" | null;
};

type KeyFilterProps = {
  value: KeyFilterValue;
  onChange: (val: KeyFilterValue) => void;
  fullWidth?: boolean;
  className?: string;
};

const SHARP_NOTES = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
] as const;
const FLAT_NOTES = [
  "C",
  "Db",
  "D",
  "Eb",
  "E",
  "F",
  "Gb",
  "G",
  "Ab",
  "A",
  "Bb",
  "B",
] as const;

export default function KeyFilter({ value, onChange, fullWidth, className }: KeyFilterProps) {
  const [tab, setTab] = useState<"flat" | "sharp">("flat");
  const [temp, setTemp] = useState<KeyFilterValue>(value);

  const openInit = () => setTemp(value);
  const clear = () => {
    setTemp({ note: null, quality: null });
    onChange({ note: null, quality: null });
  };
  const save = () => onChange(temp);

  const notes = tab === "sharp" ? SHARP_NOTES : FLAT_NOTES;

  const label =
    value.note && value.quality ? `${value.note} ${value.quality}` : "Key";

  return (
    <Popover className="relative z-30">
      <Popover.Button
        className={`px-4 py-2 rounded bg-zinc-900 text-white border border-zinc-700 relative z-30 shadow-sm hover:bg-zinc-800 transition-colors ${
          fullWidth ? "w-full" : ""
        } ${className ?? ""}`}
        onClick={openInit}
      >
        {label}
      </Popover.Button>
      <Popover.Panel className="absolute z-40 mt-2 left-1/2 -translate-x-1/2 w-[min(20rem,92vw)] sm:w-80 bg-black/95 backdrop-blur-md border border-zinc-800 rounded-lg shadow-2xl p-4 ring-1 ring-white/5">
        <div className="flex border-b border-zinc-700 mb-4">
          <button
            className={`flex-1 py-2 text-sm font-semibold ${
              tab === "flat"
                ? "text-white border-b-2 border-white"
                : "text-zinc-400"
            }`}
            onClick={() => setTab("flat")}
          >
            Flat keys
          </button>
          <button
            className={`flex-1 py-2 text-sm font-semibold ${
              tab === "sharp"
                ? "text-white border-b-2 border-white"
                : "text-zinc-400"
            }`}
            onClick={() => setTab("sharp")}
          >
            Sharp keys
          </button>
        </div>
        <div className="grid grid-cols-6 gap-2 mb-3">
          {notes.map((n) => (
            <button
              key={n}
              type="button"
              className={`px-2 py-1 rounded border text-sm ${
                temp.note === n
                  ? "bg-white text-black border-white"
                  : "bg-zinc-900 border-zinc-700 text-zinc-200"
              }`}
              onClick={() => setTemp((t) => ({ ...t, note: n }))}
            >
              {n}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            className={`px-3 py-2 rounded border text-sm ${
              temp.quality === "Maj"
                ? "bg-white text-black border-white"
                : "bg-zinc-900 border-zinc-700 text-zinc-200"
            }`}
            onClick={() => setTemp((t) => ({ ...t, quality: "Maj" }))}
          >
            Major
          </button>
          <button
            type="button"
            className={`px-3 py-2 rounded border text-sm ${
              temp.quality === "min"
                ? "bg-white text-black border-white"
                : "bg-zinc-900 border-zinc-700 text-zinc-200"
            }`}
            onClick={() => setTemp((t) => ({ ...t, quality: "min" }))}
          >
            Minor
          </button>
        </div>
        <div className="flex justify-between items-center mt-4">
          <button
            className="text-xs text-zinc-400 hover:underline"
            onClick={clear}
            type="button"
          >
            Clear
          </button>
          <Popover.Button
            as="button"
            className="px-4 py-1 rounded bg-white text-black font-semibold text-sm"
            onClick={save}
          >
            Close
          </Popover.Button>
        </div>
      </Popover.Panel>
    </Popover>
  );
}

// Component-only export to keep fast refresh happy
