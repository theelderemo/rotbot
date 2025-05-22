import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-04-30.basil",
});

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
  const body = Buffer.from(await req.arrayBuffer());

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig!, webhookSecret);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.user_id;
    const personalityName = session.metadata?.personality;
    if (!userId || !personalityName) {
      return NextResponse.json({ error: "Missing metadata." }, { status: 400 });
    }
    // Look up personality by name to get its id
    const { data: personality, error: lookupError } = await supabase
      .from("personalities")
      .select("id")
      .eq("name", personalityName)
      .single();
    if (lookupError || !personality) {
      console.error("[Webhook] Personality lookup error", lookupError);
      return NextResponse.json({ error: "Personality not found." }, { status: 400 });
    }
    // Insert into user_personalities table using personality_id
    const { error } = await supabase.from("user_personalities").insert([
      { user_id: userId, personality_id: personality.id },
    ]);
    if (error) {
      console.error("[Webhook] Supabase insert error:", error.message);
      return NextResponse.json({ error: "Database error." }, { status: 500 });
    } else {
      console.log("[Webhook] Successfully inserted user_personalities", { user_id: userId, personality_id: personality.id });
    }
  }
  return NextResponse.json({ received: true });
}
