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

// Map personality name to Stripe price ID (set these in your Stripe dashboard)
const PERSONALITY_PRICES: Record<string, string> = {
  "Sad Ghost": process.env.STRIPE_PRICE_SAD_GHOST!,
  "Goth Auntie": process.env.STRIPE_PRICE_GOTH_AUNTIE!,
  "Void Lizard": process.env.STRIPE_PRICE_VOID_LIZARD!,
};

export async function POST(req: NextRequest) {
  try {
    const stripeInstance = getStripeInstance(); // Get the Stripe instance here, during the request

    const { personalityName, userId } = await req.json();
    const priceId = PERSONALITY_PRICES[personalityName];
    if (!priceId) {
      return NextResponse.json({ error: "Invalid personality." }, { status: 400 });
    }

    // Create Stripe Checkout session
    const session = await stripeInstance.checkout.sessions.create({ // Use stripeInstance
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
  } catch (error) {
    console.error("Stripe API Error:", error);
    // Provide a more informative error message in the response
    return NextResponse.json(
      { error: "Failed to create Stripe Checkout session." },
      { status: 500 }
    );
  }
}
