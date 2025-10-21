import React from "react";

const serverUrl = import.meta.env.VITE_SERVER_URL as string | undefined;

type DownloadFile = { name: string; url: string };

export default function Download() {
  const [files, setFiles] = React.useState<DownloadFile[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [folder, setFolder] = React.useState<string>("");
  const [email, setEmail] = React.useState<string>("");
  const [sending, setSending] = React.useState<boolean>(false);
  const [sentMsg, setSentMsg] = React.useState<string>("");

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");
    const beat = params.get("beat") || "lucid";
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
    fetch(`${serverUrl}/api/downloads/${beat}/${sessionId}`)
      .then(async (r) => {
        if (!r.ok) throw new Error(await r.text());
        return r.json();
      })
      .then((data) => {
        const arr = Array.isArray(data?.files)
          ? (data.files as DownloadFile[])
          : [];
        setFiles(arr.map((f) => ({ name: f.name, url: f.url })));
        if (typeof data?.beat === "string") setFolder(data.beat);
      })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        Loading your downloads…
      </div>
    );
  if (error) return <div className="p-6 text-red-400">{error}</div>;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Your Downloads</h1>
      <p className="text-zinc-400 mb-6">
        Thanks for your purchase! Links expire in ~1 hour. Save them locally.
      </p>
      <ul className="space-y-3">
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

      {/* Resend email helper */}
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
