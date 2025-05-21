import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { supabase } from "../../../../lib/supabaseClient";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-04-30.basil",
});

// Map personality name to Stripe price ID (set these in your Stripe dashboard)
const PERSONALITY_PRICES: Record<string, string> = {
  "Sad Ghost": process.env.STRIPE_PRICE_SAD_GHOST!,
  "Goth Auntie": process.env.STRIPE_PRICE_GOTH_AUNTIE!,
  "Void Lizard": process.env.STRIPE_PRICE_VOID_LIZARD!,
};

export async function POST(req: NextRequest) {
  const { personalityName, userId } = await req.json();
  const priceId = PERSONALITY_PRICES[personalityName];
  if (!priceId) {
    return NextResponse.json({ error: "Invalid personality." }, { status: 400 });
  }

  // Create Stripe Checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/personalities?success=1&personality=${encodeURIComponent(personalityName)}`,
    cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/personalities?canceled=1`,
    metadata: {
      user_id: userId,
      personality: personalityName,
    },
  });

  return NextResponse.json({ url: session.url });
}
