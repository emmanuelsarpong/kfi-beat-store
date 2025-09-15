import { useEffect, useState } from "react";
import type { BeatData } from "@/data/beats";

// Simulate async network fetch of beats with an artificial delay to demonstrate loading states
export function useBeats(delayMs: number = 600) {
  const [data, setData] = useState<BeatData[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    // Dynamic import to create a code-split boundary and mimic network
    Promise.all([
      import("@/data/beats").then((m) => m.beats),
      new Promise((res) => setTimeout(res, delayMs)),
    ])
      .then(([beats]) => {
        if (!active) return;
        setData(beats);
      })
      .catch((e) => {
        if (!active) return;
        setError(e instanceof Error ? e : new Error("Unknown error"));
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [delayMs]);

  return { beats: data, loading, error };
}
