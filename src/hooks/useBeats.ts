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
        // After initial load, try to sync live prices from API
        (async () => {
          try {
            // Infer server URL similar to checkout implementation
            const inferredServer = (() => {
              try {
                const { origin } = window.location;
                const m = origin.match(/^(https?:\/\/localhost)(?::(\d+))?/i);
                if (m) {
                  const port = Number(m[2] || 80);
                  if (port === 8080 || port === 8081 || port === 5173)
                    return "http://localhost:8787";
                }
                return origin;
              } catch {
                return "http://localhost:8787";
              }
            })();
            const envServer: string | undefined =
              typeof import.meta !== "undefined" &&
              (import.meta as unknown as { env?: Record<string, string> }).env
                ? (import.meta as unknown as { env: Record<string, string> })
                    .env.VITE_SERVER_URL
                : undefined;
            const origin =
              typeof window !== "undefined" ? window.location.origin : "";
            const isLocalEnv = /localhost|127\.0\.0\.1/i.test(origin);
            const serverUrl = isLocalEnv ? inferredServer : (envServer || origin);
            if (!serverUrl) return;
            const [pricesRes, availabilityRes] = await Promise.all([
              fetch(`${serverUrl.replace(/\/$/, "")}/api/prices`, {
                method: "GET",
                headers: { "Content-Type": "application/json" },
              }),
              fetch(`${serverUrl.replace(/\/$/, "")}/api/beat-availability`, {
                method: "GET",
                headers: { "Content-Type": "application/json" },
              }),
            ]);
            const pricesJson = pricesRes.ok ? await pricesRes.json() : {};
            const availabilityJson = availabilityRes.ok
              ? await availabilityRes.json()
              : {};
            if (typeof window !== "undefined") {
              console.log("[useBeats] /api/beat-availability ok=" + availabilityRes.ok + " status=" + availabilityRes.status);
              console.log("[useBeats] raw response:", JSON.stringify(availabilityJson));
              const avail39 = availabilityJson?.availability?.["39"];
              console.log("[useBeats] availability['39'] (Sunrise):", avail39);
            }
            const prices = (pricesJson?.prices || {}) as Record<
              string,
              { amount?: number; unit_amount?: number }
            >;
            const availability = (availabilityJson?.availability || {}) as Record<
              string,
              {
                sold?: boolean;
                exclusive_available?: boolean;
                hasStems?: boolean;
              }
            >;
            const merged = beats.map((b) => {
              const lowerTitle = String(b.title || "")
                .trim()
                .toLowerCase();
              const candidates = [String(b.id), lowerTitle];
              let newPrice = b.price;
              for (const key of candidates) {
                const p = prices[key];
                if (
                  p &&
                  (typeof p.amount === "number" ||
                    typeof p.unit_amount === "number")
                ) {
                  const dollars =
                    typeof p.amount === "number"
                      ? p.amount
                      : (Number(p.unit_amount) || 0) / 100;
                  if (dollars > 0) {
                    newPrice = dollars;
                    break;
                  }
                }
              }
              const avail = availability[String(b.id)];
              // Use backend truth when present; when missing, do not assume fully available
              const sold = avail?.sold ?? b.sold ?? false;
              const exclusive_available =
                avail !== undefined ? avail.exclusive_available !== false : false;
              const mergedBeat = {
                ...b,
                price: newPrice,
                sold,
                exclusive_available,
                hasStems: avail?.hasStems,
              } as BeatData;
              if (typeof window !== "undefined" && String(b.id) === "39") {
                console.log("[useBeats] merged beat (Sunrise):", { id: b.id, title: b.title, hasStems: mergedBeat.hasStems, availHasStems: avail?.hasStems });
              }
              return mergedBeat;
            });
            if (!active) return;
            setData(merged);
          } catch {
            // Non-fatal; leave static prices
          }
        })();
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
