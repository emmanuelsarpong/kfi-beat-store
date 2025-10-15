export async function startCheckout(beatId: string = "lucid") {
  const serverUrl =
    (import.meta.env.VITE_SERVER_URL as string | undefined) ||
    "http://localhost:8080";
  const frontendUrl = window.location.origin;
  if (!serverUrl) {
    throw new Error(
      "Checkout server not configured. Set VITE_SERVER_URL in .env"
    );
  }

  const res = await fetch(
    `${serverUrl.replace(/\/$/, "")}/api/checkout/create`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ beatId, returnUrl: frontendUrl }),
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
