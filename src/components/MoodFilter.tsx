import { Popover } from "@headlessui/react";
import { cn } from "@/lib/utils";

type MoodFilterProps = {
  moods: string[];
  value: string;
  onChange: (mood: string) => void;
};

export default function MoodFilter({ moods, value, onChange }: MoodFilterProps) {
  return (
    <Popover className="relative z-[100]">
      <Popover.Button
        className={cn(
          "px-3 py-1.5 rounded-full text-sm text-[#6F6F69] hover:text-foreground",
          value && "text-foreground"
        )}
      >
        {value || "Mood +"}
      </Popover.Button>
      <Popover.Panel className="absolute z-[100] mt-2 left-0 w-[min(16rem,92vw)] rounded-[16px] border border-black/[0.08] bg-white p-2 shadow-soft">
        <button
          type="button"
          onClick={() => onChange("")}
          className="w-full text-left px-3 py-2 text-sm text-[#6F6F69] hover:text-foreground"
        >
          All moods
        </button>
        {moods.map((mood) => (
          <button
            key={mood}
            type="button"
            onClick={() => onChange(mood)}
            className={cn(
              "w-full text-left px-3 py-2 text-sm rounded-[8px]",
              value === mood ? "bg-[#F6F5F1] text-foreground" : "text-[#6F6F69] hover:text-foreground"
            )}
          >
            {mood}
          </button>
        ))}
      </Popover.Panel>
    </Popover>
  );
}
