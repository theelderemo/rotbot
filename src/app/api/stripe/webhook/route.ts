import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

// Use the service_role key for admin actions
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-04-30.basil",
});

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
  let event;
  const buf = await req.arrayBuffer();
  try {
    event = stripe.webhooks.constructEvent(Buffer.from(buf), sig!, webhookSecret);
  } catch (err: any) {
    console.error("Webhook signature verification failed.", err.message);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.user_id;
    const personalityName = session.metadata?.personality;
    console.log("[Webhook] Received checkout.session.completed", { userId, personalityName });
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

export const config = {
  api: {
    bodyParser: false,
  },
};
