import { useState } from "react";
import { Popover } from "@headlessui/react";

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
}: BpmFilterProps) => {
  const [tab, setTab] = useState<"range" | "exact">("range");
  const [tempRange, setTempRange] = useState<[number, number]>(bpmRange);
  const [tempExact, setTempExact] = useState<number | "">(bpmExact);

  const handleSave = () => {
    if (tab === "range") setBpmRange(tempRange);
    else setBpmExact(tempExact);
  };

  const handleClear = () => {
    setTempRange([MIN_BPM, MAX_BPM]);
    setTempExact("");
    setBpmRange([MIN_BPM, MAX_BPM]);
    setBpmExact("");
  };

  const handlePopoverOpen = () => {
    setTempRange(bpmRange);
    setTempExact(bpmExact);
  };

  return (
    <Popover className="relative z-30">
      <Popover.Button
        className={`px-4 py-2 rounded bg-zinc-900 text-white border border-zinc-700 relative z-30 shadow-sm hover:bg-zinc-800 transition-colors ${
          props.fullWidth ? "w-full" : ""
        } ${props.className ?? ""}`}
        onClick={handlePopoverOpen}
      >
        BPM
      </Popover.Button>
      <Popover.Panel className="absolute z-40 mt-2 left-1/2 -translate-x-1/2 w-[min(18rem,92vw)] sm:w-72 bg-black/95 backdrop-blur-md border border-zinc-800 rounded-lg shadow-2xl p-4 ring-1 ring-white/5">
        <div className="flex border-b border-zinc-700 mb-4">
          <button
            className={`flex-1 py-2 text-sm font-semibold ${
              tab === "range"
                ? "text-white border-b-2 border-white"
                : "text-zinc-400"
            }`}
            onClick={() => setTab("range")}
          >
            Range
          </button>
          <button
            className={`flex-1 py-2 text-sm font-semibold ${
              tab === "exact"
                ? "text-white border-b-2 border-white"
                : "text-zinc-400"
            }`}
            onClick={() => setTab("exact")}
          >
            Exact
          </button>
        </div>
        {tab === "range" ? (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-zinc-400 text-xs">Min</span>
              <span className="text-zinc-400 text-xs">Max</span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="number"
                min={MIN_BPM}
                max={tempRange[1]}
                value={tempRange[0]}
                onChange={(e) =>
                  setTempRange([Number(e.target.value), tempRange[1]])
                }
                className="w-16 px-2 py-1 rounded bg-zinc-800 text-white border border-zinc-700"
                aria-label="Minimum BPM"
              />
              <span className="text-zinc-400">-</span>
              <input
                type="number"
                min={tempRange[0]}
                max={MAX_BPM}
                value={tempRange[1]}
                onChange={(e) =>
                  setTempRange([tempRange[0], Number(e.target.value)])
                }
                className="w-16 px-2 py-1 rounded bg-zinc-800 text-white border border-zinc-700"
                aria-label="Maximum BPM"
              />
            </div>
            <input
              type="range"
              min={MIN_BPM}
              max={MAX_BPM}
              value={tempRange[0]}
              onChange={(e) =>
                setTempRange([Number(e.target.value), tempRange[1]])
              }
              className="w-full accent-white mb-1"
              aria-label="Minimum BPM slider"
            />
            <input
              type="range"
              min={MIN_BPM}
              max={MAX_BPM}
              value={tempRange[1]}
              onChange={(e) =>
                setTempRange([tempRange[0], Number(e.target.value)])
              }
              className="w-full accent-white"
              aria-label="Maximum BPM slider"
            />
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <input
              type="number"
              min={MIN_BPM}
              max={MAX_BPM}
              value={tempExact}
              onChange={(e) =>
                setTempExact(e.target.value ? Number(e.target.value) : "")
              }
              className="w-full px-2 py-1 rounded bg-zinc-800 text-white border border-zinc-700"
              placeholder="Enter BPM"
              aria-label="Exact BPM"
            />
          </div>
        )}
        <div className="flex justify-between items-center mt-4">
          <button
            className="text-xs text-zinc-400 hover:underline"
            onClick={handleClear}
            type="button"
          >
            Clear
          </button>
          <Popover.Button
            as="button"
            className="px-4 py-1 rounded bg-white text-black font-semibold text-sm"
            onClick={handleSave}
          >
            Save
          </Popover.Button>
        </div>
      </Popover.Panel>
    </Popover>
  );
};

export default BpmFilter;
