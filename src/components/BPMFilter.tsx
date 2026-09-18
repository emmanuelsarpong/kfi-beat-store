import { Popover } from "@headlessui/react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const MIN_BPM = 1;
const MAX_BPM = 300;

type BpmFilterProps = {
  bpmRange: [number, number];
  setBpmRange: (range: [number, number]) => void;
  bpmExact: number | "";
  setBpmExact: (val: number | "") => void;
  fullWidth?: boolean;
  className?: string;
};

const BpmFilter = ({
  bpmRange,
  setBpmRange,
  bpmExact,
  setBpmExact,
  fullWidth,
  className,
}: BpmFilterProps) => {
  const [tab, setTab] = useState<"range" | "exact">("range");
  const [tempRange, setTempRange] = useState<[number, number]>(bpmRange);
  const [tempExact, setTempExact] = useState<number | "">(bpmExact);
  const active =
    bpmExact !== "" || bpmRange[0] !== MIN_BPM || bpmRange[1] !== MAX_BPM;

  const handleSave = () => {
    if (tab === "range") {
      setBpmRange(tempRange);
      setBpmExact("");
    } else {
      setBpmExact(tempExact);
      setBpmRange([MIN_BPM, MAX_BPM]);
    }
  };

  const handleClear = () => {
    setTempRange([MIN_BPM, MAX_BPM]);
    setTempExact("");
    setBpmRange([MIN_BPM, MAX_BPM]);
    setBpmExact("");
  };

  return (
    <Popover className="relative z-[100]">
      <Popover.Button
        className={cn(
          "px-3 py-1.5 rounded-full text-sm border border-transparent text-[#6F6F69] hover:text-foreground",
          active && "text-foreground",
          fullWidth && "w-full",
          className
        )}
        onClick={() => {
          setTempRange(bpmRange);
          setTempExact(bpmExact);
        }}
      >
        BPM{active ? " ·" : " +"}
      </Popover.Button>
      <Popover.Panel className="absolute z-[100] mt-2 left-0 w-[min(18rem,92vw)] rounded-[16px] border border-black/[0.08] bg-white p-4 shadow-soft">
        <div className="flex gap-4 mb-4 text-sm">
          <button
            className={tab === "range" ? "text-foreground" : "text-[#999991]"}
            onClick={() => setTab("range")}
          >
            Range
          </button>
          <button
            className={tab === "exact" ? "text-foreground" : "text-[#999991]"}
            onClick={() => setTab("exact")}
          >
            Exact
          </button>
        </div>
        {tab === "range" ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={MIN_BPM}
                max={tempRange[1]}
                value={tempRange[0]}
                onChange={(e) => setTempRange([Number(e.target.value), tempRange[1]])}
                className="w-20 h-9 px-2 rounded-[8px] border border-black/[0.08] bg-[#F6F5F1] text-sm tabular-nums"
                aria-label="Minimum BPM"
              />
              <span className="text-[#999991]">–</span>
              <input
                type="number"
                min={tempRange[0]}
                max={MAX_BPM}
                value={tempRange[1]}
                onChange={(e) => setTempRange([tempRange[0], Number(e.target.value)])}
                className="w-20 h-9 px-2 rounded-[8px] border border-black/[0.08] bg-[#F6F5F1] text-sm tabular-nums"
                aria-label="Maximum BPM"
              />
            </div>
          </div>
        ) : (
          <input
            type="number"
            min={MIN_BPM}
            max={MAX_BPM}
            value={tempExact}
            onChange={(e) => setTempExact(e.target.value ? Number(e.target.value) : "")}
            className="w-full h-9 px-2 rounded-[8px] border border-black/[0.08] bg-[#F6F5F1] text-sm tabular-nums"
            placeholder="Enter BPM"
            aria-label="Exact BPM"
          />
        )}
        <div className="flex justify-between items-center mt-4">
          <button className="text-xs text-[#999991]" onClick={handleClear} type="button">
            Clear
          </button>
          <Popover.Button
            as="button"
            className="text-sm"
            onClick={handleSave}
          >
            Apply
          </Popover.Button>
        </div>
      </Popover.Panel>
    </Popover>
  );
};

export default BpmFilter;
