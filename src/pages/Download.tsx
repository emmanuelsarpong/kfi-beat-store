import React from "react";
import { getApiServerUrl } from "@/lib/apiServerUrl";
import { useCart } from "@/hooks/useCart";

type DownloadFile = { name: string; url: string };

type SessionItem = {
  beat: string;
  beatTitle?: string;
  licenseType?: string;
  files: DownloadFile[];
};

export default function Download() {
  const { clearCart } = useCart();
  const [files, setFiles] = React.useState<DownloadFile[]>([]);
  const [grouped, setGrouped] = React.useState<SessionItem[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [folder, setFolder] = React.useState<string>("");
  const [email, setEmail] = React.useState<string>("");
  const [sending, setSending] = React.useState<boolean>(false);
  const [sentMsg, setSentMsg] = React.useState<string>("");

  React.useEffect(() => {
    const isAllowed = (name: string) => {
      const n = String(name || "").toLowerCase();
      return n.endsWith(".wav") || n.endsWith(".zip");
    };
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");
    const beat = params.get("beat") || "";
    const multi = params.get("multi") === "1";
    const serverUrl = getApiServerUrl();

    if (!serverUrl) {
      setError("Download server not configured. Set VITE_SERVER_URL in .env");
      setLoading(false);
      return;
    }
    if (!sessionId) {
      setError("Missing session_id");
      setLoading(false);
      return;
    }

    const url = multi
      ? `${serverUrl.replace(/\/$/, "")}/api/downloads/session/${encodeURIComponent(sessionId)}`
      : `${serverUrl.replace(/\/$/, "")}/api/downloads/${encodeURIComponent(beat || "lucid")}/${encodeURIComponent(sessionId)}`;

    fetch(url)
      .then(async (r) => {
        if (!r.ok) throw new Error(await r.text());
        return r.json();
      })
      .then((data) => {
        if (multi && Array.isArray(data?.items)) {
          const items = data.items as SessionItem[];
          setGrouped(items);
          const all: DownloadFile[] = [];
          for (const it of items) {
            const arr = Array.isArray(it?.files) ? it.files : [];
            for (const f of arr) {
              if (f && f.name && f.url && isAllowed(f.name))
                all.push({ name: f.name, url: f.url });
            }
          }
          const rank = (name: string) => {
            const n = String(name).toLowerCase();
            if (n === "stems.zip") return 0;
            if (n.endsWith(".wav")) return 1;
            if (n.endsWith(".zip")) return 2;
            return 3;
          };
          all.sort((a, b) => rank(a.name) - rank(b.name));
          setFiles(all);
          if (items[0]?.beat) setFolder(String(items[0].beat));
          clearCart();
          return;
        }

        const arr = Array.isArray(data?.files)
          ? (data.files as DownloadFile[])
          : [];
        const cleaned = arr
          .filter((f) => f && f.name && f.url && isAllowed(f.name))
          .map((f) => ({ name: f.name, url: f.url }));
        const rank = (name: string) => {
          const n = String(name).toLowerCase();
          if (n === "stems.zip") return 0;
          if (n.endsWith(".wav")) return 1;
          if (n.endsWith(".zip")) return 2;
          return 3;
        };
        cleaned.sort((a, b) => rank(a.name) - rank(b.name));
        setFiles(cleaned);
        if (typeof data?.beat === "string") setFolder(data.beat);
        clearCart();
      })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, [clearCart]);

  if (loading)
    return (
      <div className="min-h-[40vh] flex items-center justify-center text-zinc-300">
        Loading your downloads…
      </div>
    );
  if (error) return <div className="p-6 text-red-400">{error}</div>;

  return (
    <div className="max-w-3xl mx-auto p-6 text-white">
      <h1 className="text-2xl font-bold mb-4">Your Downloads</h1>
      <p className="text-zinc-400 mb-6">
        Thanks for your purchase! Links expire in ~1 hour. Save them locally.
      </p>

      {grouped && grouped.length > 1 ? (
        <div className="space-y-8 mb-8">
          {grouped.map((it, gi) => {
            const list = (it.files || []).filter(
              (f) =>
                f &&
                f.name &&
                f.url &&
                (String(f.name).toLowerCase().endsWith(".wav") ||
                  String(f.name).toLowerCase().endsWith(".zip"))
            );
            if (!list.length) return null;
            return (
              <div key={`${it.beat}-${gi}`}>
                <h2 className="text-lg font-semibold text-zinc-200 mb-3">
                  {it.beatTitle || it.beat}
                  {it.licenseType ? (
                    <span className="text-zinc-500 font-normal text-sm ml-2">
                      ({it.licenseType})
                    </span>
                  ) : null}
                </h2>
                <ul className="space-y-3">
                  {list.map((f, i) => (
                    <li
                      key={`${f.name}-${i}`}
                      className="flex items-center justify-between bg-white/5 rounded-lg px-4 py-3"
                    >
                      <span className="truncate mr-4">{f.name}</span>
                      <a
                        className="text-amber-300 hover:underline shrink-0"
                        href={f.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Download
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      ) : (
        <ul className="space-y-3 mb-8">
          {files.map((f, i) => (
            <li
              key={i}
              className="flex items-center justify-between bg-white/5 rounded-lg px-4 py-3"
            >
              <span className="truncate mr-4">{f.name}</span>
              <a
                className="text-amber-300 hover:underline"
                href={f.url}
                target="_blank"
                rel="noreferrer"
              >
                Download
              </a>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-8 border-t border-white/10 pt-6">
        <h2 className="font-semibold mb-2">Didn’t get the email?</h2>
        <p className="text-sm text-zinc-400 mb-3">
          Enter your email and we’ll send these links to your inbox.
        </p>
        <div className="flex gap-2 max-w-xl">
          <input
            type="email"
            placeholder="you@example.com"
            className="flex-1 bg-white/5 border border-white/10 rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-amber-300"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button
            disabled={sending || !email || !folder}
            onClick={async () => {
              const serverUrl = getApiServerUrl();
              if (!serverUrl) return;
              setSending(true);
              setSentMsg("");
              try {
                const res = await fetch(
                  `${serverUrl}/api/email/test-download`,
                  {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ to: email, folder }),
                  }
                );
                const data = await res.json().catch(() => ({}));
                if (res.ok)
                  setSentMsg(
                    "Email sent. Please check your Inbox and Spam/Promotions."
                  );
                else setSentMsg(data?.error || "Failed to send email.");
              } catch (e) {
                setSentMsg(String(e));
              } finally {
                setSending(false);
              }
            }}
            className="bg-amber-300 text-black font-medium px-4 py-2 rounded-md disabled:opacity-50"
          >
            {sending ? "Sending…" : "Email me these links"}
          </button>
        </div>
        {sentMsg && <p className="text-sm mt-2 text-zinc-300">{sentMsg}</p>}
      </div>
    </div>
  );
}
