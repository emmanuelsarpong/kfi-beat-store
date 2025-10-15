import supabase from "@/lib/supabase";

function extractPathFromPublicUrl(url: string): string | null {
  const m = url.match(/\/object\/public\/beats\/(.+)$/);
  if (!m) return null;
  try {
    return decodeURIComponent(m[1]);
  } catch {
    return m[1];
  }
}

export async function getPlayableUrlForBeat(beat: {
  id: string;
  title?: string;
  audioUrl: string;
}): Promise<string> {
  const env = (import.meta as unknown as { env?: Record<string, string> }).env;
  const server = env?.VITE_SERVER_URL;

  // Determine storage path inside the beats bucket
  const title = (beat.title || "").toLowerCase();
  let storagePath = extractPathFromPublicUrl(beat.audioUrl) || "";
  if (!storagePath) {
    if (title === "lucid" || beat.id === "1") storagePath = "lucid/Lucid.mp3";
    else if (title === "prism" || beat.id === "2")
      storagePath = "prism/Prism.mp3";
    else if (title === "see you go" || beat.id === "3")
      storagePath = "see you go/See You Go.mp3";
    else if (title === "eyes on me" || beat.id === "4")
      storagePath = "eyes on me/Eyes On Me.mp3";
    else if (title === "memories" || beat.id === "21")
      storagePath = "memories/Memories.mp3";
    else if (title === "falling" || beat.id === "22")
      storagePath = "falling/Falling.mp3";
    else if (title === "run" || beat.id === "23") storagePath = "run/Run.mp3";
    else if (title === "i like it" || beat.id === "24")
      storagePath = "i like it/I Like It.mp3";
    else if (title === "pulse" || beat.id === "25")
      storagePath = "pulse/Pulse.mp3";
    else if (title === "orbit" || beat.id === "26")
      storagePath = "orbit/Orbit.mp3";
    else if (title === "roses" || beat.id === "27")
      storagePath = "roses/Roses.mp3";
    else if (title === "wait" || beat.id === "28")
      storagePath = "wait/Wait.mp3";
    else if (title === "sunset" || beat.id === "29")
      storagePath = "sunset/Sunset.mp3";
  }

  // 1) Prefer public URL (bucket is Public)
  if (storagePath) {
    const { data } = supabase.storage.from("beats").getPublicUrl(storagePath);
    if (data?.publicUrl) return data.publicUrl;
  }

  // 2) Preview server only implemented for Lucid
  if (server && (title === "lucid" || beat.id === "1")) {
    return `${server.replace(/\/$/, "")}/api/preview/lucid?redirect=1`;
  }

  // 3) Client-signed fallback (requires permissive read policy)
  if (storagePath) {
    try {
      const { data, error } = await supabase.storage
        .from("beats")
        .createSignedUrl(storagePath, 60 * 5);
      if (data?.signedUrl && !error) return data.signedUrl;
    } catch {
      // ignore
    }
  }

  // 4) Last resort: whatever was provided
  return beat.audioUrl;
}
