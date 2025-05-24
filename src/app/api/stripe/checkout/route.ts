// src/app/api/stripe/checkout/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
// import { supabase } from "../../../../lib/supabaseClient"; // REMOVED: 'supabase' is defined but never used.

// Lazy initialization for Stripe client
let stripe: Stripe | null = null; // Changed to allow null initially

function getStripeInstance(): Stripe {
  if (!stripe) {
    const apiKey = process.env.STRIPE_SECRET_KEY;
    if (!apiKey) {
      // This error will now correctly fire at runtime if the key is missing
      // instead of during the build process.
      throw new Error('STRIPE_SECRET_KEY environment variable is not set.');
    }
    stripe = new Stripe(apiKey, {
      apiVersion: "2025-04-30.basil", // Keep your specified API version
    });
  }
  return stripe;
}

export async function POST(req: NextRequest) {
  try {
    const stripeInstance = getStripeInstance();
    const { userId } = await req.json();
    // Use a single price ID for the premium subscription
    const priceId = process.env.STRIPE_PREMIUM_PRICE_ID;
    if (!priceId) {
      return NextResponse.json({ error: "Stripe price ID not configured." }, { status: 500 });
    }
    // Create Stripe Checkout session
    const session = await stripeInstance.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/personalities?success=1`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/personalities?canceled=1`,
      metadata: {
        user_id: userId,
      },
    });
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe API Error:", error);
    return NextResponse.json(
      { error: "Failed to create Stripe Checkout session." },
      { status: 500 }
    );
  }
}
