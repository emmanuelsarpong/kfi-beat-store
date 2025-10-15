import React from "react";

const serverUrl = import.meta.env.VITE_SERVER_URL as string | undefined;

type DownloadFile = { name: string; url: string };

export default function Download() {
  const [files, setFiles] = React.useState<DownloadFile[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

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
    </div>
  );
}
