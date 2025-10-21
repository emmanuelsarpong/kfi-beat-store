import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import type Stripe from "stripe";
import { getSupabaseAdmin } from "@/lib/supabase";
import { sendDownloadEmail } from "@/lib/mailer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function textBodyToBuffer(text: string): Buffer {
  return Buffer.from(text, "utf8");
}

export async function POST(req: Request) {
  const sig = headers().get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return NextResponse.json(
      { error: "Missing signature or webhook secret" },
      { status: 400 }
    );
  }

  const text = await req.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      textBodyToBuffer(text),
      sig,
      webhookSecret
    );
  } catch (err) {
    console.error("Webhook signature verification failed", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const email = session.customer_details?.email;
    const title = (session.metadata?.title as string) || "Your Beat";
    const storagePath = session.metadata?.storagePath as string | undefined;

    if (email && storagePath) {
      // Generate signed download URL (expires in 60 minutes)
      const { data, error } = await getSupabaseAdmin()
        .storage.from("beats")
        .createSignedUrl(storagePath, 60 * 60);

      if (error) {
        console.error("Signed URL error", error);
      } else if (data?.signedUrl) {
        try {
          await sendDownloadEmail(email, title, data.signedUrl);
        } catch (e) {
          console.error("Email send error", e);
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}
