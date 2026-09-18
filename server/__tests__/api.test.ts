import request from "supertest";
import { describe, it, expect, vi, afterEach } from "vitest";
import crypto from "node:crypto";

// Helper to import a fresh copy of the app with current env
async function importFreshApp(opts?: { preserveMocks?: boolean }) {
  if (!opts?.preserveMocks) vi.resetModules();
  const mod = (await import("../app.js")) as {
    default?: unknown;
    app?: unknown;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (mod as any).default || (mod as any).app;
}

afterEach(() => {
  // reset modules after each test to avoid cross-test contamination
  vi.resetModules();
});

describe("API", () => {
  it("GET /api/health returns ok: true", async () => {
    const app = await importFreshApp();
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("ok", true);
  });

  it("POST /api/checkout/create returns 500 when Stripe not configured", async () => {
    const original = process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_SECRET_KEY;
    const app = await importFreshApp();
    const res = await request(app)
      .post("/api/checkout/create")
      .send({ beatId: "lucid", returnUrl: "http://localhost:5173" })
      .set("Content-Type", "application/json");
    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty("error");
    expect(String(res.body.error)).toMatch(/Stripe not configured/i);
    // restore
    if (original !== undefined) process.env.STRIPE_SECRET_KEY = original;
  });

  it("POST /webhook/stripe returns 200 with valid signature (non-checkout event)", async () => {
    process.env.STRIPE_SECRET_KEY =
      process.env.STRIPE_SECRET_KEY || "sk_test_dummy";
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test_secret";

    const app = await importFreshApp();
    const payload = JSON.stringify({
      id: "evt_123",
      type: "account.updated",
      data: { object: { id: "acct_123" } },
    });
    const timestamp = Math.floor(Date.now() / 1000);
    const signedPayload = `${timestamp}.${payload}`;
    const signature = crypto
      .createHmac("sha256", process.env.STRIPE_WEBHOOK_SECRET!)
      .update(signedPayload, "utf8")
      .digest("hex");
    const header = `t=${timestamp},v1=${signature}`;

    const res = await request(app)
      .post("/webhook/stripe")
      .set("Content-Type", "application/json")
      .set("stripe-signature", header)
      .send(payload);

    expect(res.status).toBe(200);
  });

  it("POST /webhook/stripe returns 400 with invalid signature", async () => {
    process.env.STRIPE_SECRET_KEY =
      process.env.STRIPE_SECRET_KEY || "sk_test_dummy";
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test_secret";

    const app = await importFreshApp();
    const payload = JSON.stringify({
      id: "evt_456",
      type: "account.updated",
      data: { object: { id: "acct_456" } },
    });
    const timestamp = Math.floor(Date.now() / 1000);
    const header = `t=${timestamp},v1=deadbeef`;

    const res = await request(app)
      .post("/webhook/stripe")
      .set("Content-Type", "application/json")
      .set("stripe-signature", header)
      .send(payload);

    expect(res.status).toBe(400);
  });

  it("GET /api/downloads/:beat/:sessionId returns signed files when paid", async () => {
    // mock Stripe and Supabase before importing app
    vi.doMock("stripe", () => {
      return {
        default: class MockStripe {
          // apiVersion ignored
          constructor(_key: string, _opts?: Record<string, unknown>) {}
          checkout = {
            sessions: {
              retrieve: async (_id: string, _opts?: unknown) => ({
                payment_status: "paid",
                status: "complete",
                metadata: { license_type: "unlimited" },
                line_items: {
                  data: [
                    {
                      price: {
                        id: "price_123",
                        product: { id: "prod_abc", name: "Lucid" },
                      },
                    },
                  ],
                },
                customer_details: { email: "test@example.com" },
              }),
            },
          };
        },
      };
    });

    vi.doMock("@supabase/supabase-js", () => {
      const files = [
        { name: "Lucid.mp3", metadata: { mimetype: "audio/mpeg" } },
        { name: "Lucid.wav", metadata: { mimetype: "audio/wav" } },
        { name: "stems.zip", metadata: { mimetype: "application/zip" } },
      ];
      return {
        createClient: () => ({
          storage: {
            from: (_bucket: string) => ({
              list: async (prefix?: string) => {
                // when called with "lucid", return files
                if (!prefix || String(prefix) === "lucid") {
                  return { data: files, error: null } as const;
                }
                return { data: [], error: null } as const;
              },
              createSignedUrl: async (path: string, _expires: number) => ({
                data: {
                  signedUrl: `https://example.com/signed/${encodeURIComponent(
                    path
                  )}`,
                },
                error: null,
              }),
            }),
          },
          from: () => ({
            update: () => ({ eq: () => ({}) }),
            ilike: () => ({}),
          }),
        }),
      };
    });

    process.env.STRIPE_SECRET_KEY =
      process.env.STRIPE_SECRET_KEY || "sk_test_dummy";
    process.env.SUPABASE_URL =
      process.env.SUPABASE_URL || "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY =
      process.env.SUPABASE_SERVICE_ROLE_KEY || "service_key";

    const app = await importFreshApp({ preserveMocks: true });
    const res = await request(app).get("/api/downloads/lucid/cs_test_123");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("beat", "lucid");
    expect(res.body).toHaveProperty("files");
    expect(Array.isArray(res.body.files)).toBe(true);
    const names = (res.body.files as Array<{ name: string }>).map(
      (f) => f.name
    );
    expect(names).toContain("Lucid.wav");
    expect(names).toContain("stems.zip");
    expect(names).not.toContain("Lucid.mp3");
  });

  it("POST /api/checkout/create sends beat+license text and no images", async () => {
    const created: { payload?: Record<string, unknown> } = {};
    vi.doMock("stripe", () => {
      return {
        default: class MockStripe {
          constructor(_key: string, _opts?: Record<string, unknown>) {}
          prices = {
            retrieve: async (id: string) => ({
              id,
              currency: "usd",
              unit_amount: 9900,
              product: "prod_premium",
              recurring: null,
            }),
          };
          checkout = {
            sessions: {
              create: async (payload: Record<string, unknown>) => {
                created.payload = payload;
                return {
                  id: "cs_test_no_art",
                  url: "https://checkout.stripe.com/c/pay/cs_test_no_art",
                };
              },
            },
          };
        },
      };
    });
    vi.doMock("@supabase/supabase-js", () => {
      return {
        createClient: () => ({
          from: () => ({
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: { sold: false, exclusive_available: true },
                  error: null,
                }),
              }),
            }),
          }),
        }),
      };
    });

    process.env.STRIPE_SECRET_KEY =
      process.env.STRIPE_SECRET_KEY || "sk_test_dummy";
    process.env.STRIPE_PRICE_PREMIUM =
      process.env.STRIPE_PRICE_PREMIUM || "price_premium_test";
    process.env.SUPABASE_URL =
      process.env.SUPABASE_URL || "https://example.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY =
      process.env.SUPABASE_SERVICE_ROLE_KEY || "service_key";

    const app = await importFreshApp({ preserveMocks: true });
    const res = await request(app)
      .post("/api/checkout/create")
      .send({
        beatId: "42",
        beatTitle: "Breeze",
        licenseType: "premium",
        returnUrl: "http://localhost:8080",
      })
      .set("Content-Type", "application/json");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("url");
    expect(created.payload).toBeTruthy();

    const payload = created.payload as {
      line_items: Array<{
        price?: string;
        quantity: number;
        price_data?: {
          currency: string;
          unit_amount?: number;
          product_data?: Record<string, unknown>;
        };
      }>;
      metadata: Record<string, string>;
    };
    const item = payload.line_items[0];
    expect(item.price).toBeUndefined();
    expect(item.quantity).toBe(1);
    expect(item.price_data?.currency).toBe("usd");
    expect(item.price_data?.unit_amount).toBe(9900);
    expect(item.price_data?.product_data).toMatchObject({
      name: "Breeze · Premium License",
      description: "WAV · Commercial streaming · Non-exclusive",
    });
    expect(item.price_data?.product_data).not.toHaveProperty("images");
    expect(JSON.stringify(payload)).not.toMatch(/"images"\s*:/);
    expect(payload.metadata.beat_id).toBe("42");
    expect(payload.metadata.beat_title).toBe("Breeze");
    expect(payload.metadata.license_type).toBe("premium");
    const cart = JSON.parse(payload.metadata.cart_json);
    expect(cart[0]).toMatchObject({
      beat_id: "42",
      beat_title: "Breeze",
      license_type: "premium",
      stripe_price_id: process.env.STRIPE_PRICE_PREMIUM,
    });
  });
});
