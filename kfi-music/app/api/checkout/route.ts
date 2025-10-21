import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getBeatById } from "@/data/beats";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const beatId = String(form.get("beatId") || "");
    const beat = getBeatById(beatId);
    if (!beat) {
      return NextResponse.json({ error: "Invalid beat" }, { status: 400 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    const cents = Math.round(beat.priceUSD * 100);
    const line_item = beat.priceId
      ? { price: beat.priceId, quantity: 1 }
      : {
          price_data: {
            currency: "usd",
            unit_amount: cents,
            product_data: { name: beat.title },
          },
          quantity: 1,
        };

    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      success_url: `${siteUrl}/success`,
      cancel_url: `${siteUrl}/cancel`,
      line_items: [line_item],
      metadata: {
        beatId: beat.id,
        storagePath: beat.storagePath,
        title: beat.title,
      },
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Failed to create session" },
        { status: 500 }
      );
    }

    return NextResponse.redirect(session.url, { status: 303 });
  } catch (err: any) {
    console.error("Checkout error", err);
    return NextResponse.json(
      { error: err?.message || "Internal error" },
      { status: 500 }
    );
  }
}
