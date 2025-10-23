export async function startCheckout(beatId: string = "lucid") {
  // Prefer explicit env; otherwise infer local server port 8787 when running Vite on 8080/5173
  const inferredServer = (() => {
    try {
      const { origin } = window.location;
      // If we're on common Vite ports, assume the API runs on 8787
      const m = origin.match(/^(https?:\/\/localhost)(?::(\d+))?/i);
      if (m) {
        const port = Number(m[2] || 80);
        // Common local dev ports for Vite/preview
        if (port === 8080 || port === 8081 || port === 5173)
          return "http://localhost:8787";
      }
      return origin; // same origin fallback
    } catch {
      return "http://localhost:8787"; // SSR or unusual env
    }
  })();

  // Prefer same-origin in production. Only use VITE_SERVER_URL when it's set to a non-localhost URL.
  const envServer =
    (import.meta.env.VITE_SERVER_URL as string | undefined) || "";
  const isLocalEnv = /localhost|127\.0\.0\.1|^$/i.test(envServer);
  const serverUrl = isLocalEnv ? inferredServer : envServer;
  const frontendUrl =
    typeof window !== "undefined" ? window.location.origin : "";
  if (!serverUrl) {
    throw new Error(
      "Checkout server not configured. Set VITE_SERVER_URL in .env"
    );
  }

  // Optional: auto-apply a Stripe Promotion Code when provided in the URL
  // Usage: add ?promo=promo_XXXXXXXX to the page URL, then click Buy Now
  let promotionCode: string | undefined = undefined;
  try {
    const params = new URLSearchParams(window.location.search);
    const promo =
      params.get("promo") || params.get("promotionCode") || undefined;
    if (promo && /^promo_[a-zA-Z0-9]+$/.test(promo)) promotionCode = promo;
  } catch {
    // ignore parsing errors; just don't auto-apply a promo code
  }

  const res = await fetch(
    `${serverUrl.replace(/\/$/, "")}/api/checkout/create`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ beatId, returnUrl: frontendUrl, promotionCode }),
    }
  );

  if (!res.ok) {
    let text = "";
    try {
      text = await res.text();
    } catch (e) {
      // ignore
    }
    throw new Error(
      `Failed to create checkout session: ${res.status} ${
        text || res.statusText
      }`
    );
  }
  const data = await res.json();
  const url = data?.url;
  if (!url) throw new Error("No checkout URL returned");
  window.location.href = url;
}
