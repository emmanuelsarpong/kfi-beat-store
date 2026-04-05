import { getApiServerUrl } from "@/lib/apiServerUrl";

export interface CheckoutPayload {
  beatId: string;
  beatTitle: string;
  licenseType: "starter" | "premium" | "unlimited" | "exclusive";
}

export type CheckoutCartItemPayload = {
  beatId: string;
  beatTitle: string;
  selectedLicense: CheckoutPayload["licenseType"];
};

function readPromotionCodeFromQuery(): string | undefined {
  try {
    const params = new URLSearchParams(window.location.search);
    const promo =
      params.get("promo") || params.get("promotionCode") || undefined;
    if (promo && /^promo_[a-zA-Z0-9]+$/.test(promo)) return promo;
  } catch {
    /* ignore */
  }
  return undefined;
}

async function postCheckoutCreate(body: Record<string, unknown>) {
  const serverUrl = getApiServerUrl();
  const endpoint = `${serverUrl.replace(/\/$/, "")}/api/checkout/create`;
  const frontendUrl =
    typeof window !== "undefined" ? window.location.origin : "";
  if (serverUrl == null) {
    throw new Error(
      "Checkout server not configured. Set VITE_SERVER_URL in .env"
    );
  }
  const promotionCode = readPromotionCodeFromQuery();
  const requestBody = {
    ...body,
    returnUrl: frontendUrl,
    promotionCode,
  };

  let res: Response;
  try {
    res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error("[checkout] network request failed", {
        endpoint,
        requestBody,
        error,
      });
    }
    throw new Error(
      "Checkout service is unavailable. Make sure the backend server is running, then try again."
    );
  }

  let data: { url?: string; error?: string } = {};
  const text = await res.text();
  try {
    if (text) data = JSON.parse(text) as { url?: string; error?: string };
  } catch {
    /* non-JSON response */
  }
  if (!res.ok) {
    if (import.meta.env.DEV) {
      console.error("[checkout] create session failed", {
        endpoint,
        status: res.status,
        responseText: text,
        responseJson: data,
        requestBody,
      });
    }
    const msg =
      typeof data?.error === "string" && data.error.trim()
        ? data.error
        : text && text.length < 300
          ? `Server error (${res.status}): ${text}`
          : res.statusText || "Failed to create checkout session";
    throw new Error(msg);
  }
  const url = data?.url;
  if (!url) throw new Error("No checkout URL returned");
  window.location.href = url;
}

export async function startCheckout(payload: CheckoutPayload) {
  await postCheckoutCreate({
    beatId: payload.beatId,
    beatTitle: payload.beatTitle,
    licenseType: payload.licenseType,
  });
}

export async function startCartCheckout(items: CheckoutCartItemPayload[]) {
  if (!items.length) throw new Error("Cart is empty");
  await postCheckoutCreate({
    items: items.map((i) => ({
      beatId: i.beatId,
      beatTitle: i.beatTitle,
      selectedLicense: i.selectedLicense,
    })),
  });
}
