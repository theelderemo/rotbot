import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-04-30.basil", // Use a standard API version
});

export const runtime = "nodejs";

async function manageSubscriptionInSupabase(
  userId: string,
  stripeCustomerId: string,
  stripeSubscriptionId: string,
  status: Stripe.Subscription.Status,
  currentPeriodStart: number, // Unix timestamp in seconds
  currentPeriodEnd: number   // Unix timestamp in seconds
) {
  const { data, error } = await supabase
    .from("user_subscriptions")
    .upsert(
      {
        user_id: userId,
        stripe_customer_id: stripeCustomerId,
        stripe_subscription_id: stripeSubscriptionId,
        status: status,
        current_period_start: new Date(currentPeriodStart * 1000).toISOString(),
        current_period_end: new Date(currentPeriodEnd * 1000).toISOString(),
      },
      {
        onConflict: "stripe_subscription_id", 
      }
    )
    .select();

  if (error) {
    console.error("[Webhook] Supabase manageSubscriptionInSupabase error:", error);
    throw error; 
  }
  console.log(`[Webhook] Subscription ${stripeSubscriptionId} for user ${userId} managed. Status: ${status}`);
  return data;
}


export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = process.env.WEBHOOK_SIGNING_SECRET!;
  if (!sig || !webhookSecret) {
    console.error("Webhook Error: Missing Stripe signature or webhook secret.");
    return NextResponse.json({ error: "Webhook Error: Missing Stripe signature or webhook secret." }, { status: 400 });
  }
  
  let event: Stripe.Event;
  const bodyBuffer = Buffer.from(await req.arrayBuffer());

  try {
    event = stripe.webhooks.constructEvent(bodyBuffer, sig, webhookSecret);
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === "subscription" && session.subscription && session.customer) {
          const userId = session.metadata?.user_id;
          if (!userId) {
            console.error("[Webhook] checkout.session.completed: Missing user_id in session metadata.");
            return NextResponse.json({ error: "Missing user_id in session metadata." }, { status: 400 });
          }

          const stripeSubscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription.id;
          
          let stripeCustomerId: string;
          if (typeof session.customer === 'string') {
            stripeCustomerId = session.customer;
          } else if (session.customer?.id) {
            stripeCustomerId = session.customer.id;
          } else {
             console.error("[Webhook] checkout.session.completed: Missing customer ID in session.");
             return NextResponse.json({ error: "Missing customer ID in session." }, { status: 400 });
          }
                    
          const subscription: Stripe.Subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);

          await manageSubscriptionInSupabase(
            userId,
            stripeCustomerId,
            subscription.id,
            subscription.status,
            (subscription as any).current_period_start.current_period_start,
            (subscription as any).current_period_end
          );
          console.log(`[Webhook] New subscription ${subscription.id} processed for user ${userId}.`);
        } else if (session.mode === "payment") {
            console.log("[Webhook] Received checkout.session.completed for one-time payment, no action taken for subscription logic.");
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        let userId = subscription.metadata?.user_id;
        
        let stripeCustomerId: string;
        if (typeof subscription.customer === 'string') {
            stripeCustomerId = subscription.customer;
        } else { // It's an object (Stripe.Customer | Stripe.DeletedCustomer)
            stripeCustomerId = subscription.customer.id;
        }

        if (!userId && stripeCustomerId) {
            const customer = await stripe.customers.retrieve(stripeCustomerId);
            if (customer && !customer.deleted) { 
                 userId = customer.metadata?.user_id;
            }
        }
        
        if (!userId) {
            const { data: existingSub } = await supabase
                .from('user_subscriptions')
                .select('user_id')
                .eq('stripe_subscription_id', subscription.id)
                .single();
            if (existingSub) {
                userId = existingSub.user_id;
            } else {
                console.warn(`[Webhook] customer.subscription.updated: Could not determine user_id for subscription ${subscription.id}. Acknowledging event to Stripe.`);
                return NextResponse.json({ received: true, warning: `Could not determine user_id for subscription ${subscription.id}. No db record found.` }, { status: 200 });
            }
        }
        
        await manageSubscriptionInSupabase(
          userId,
          stripeCustomerId,
          subscription.id,
          subscription.status,
          (subscription as any).current_period_start,
          (subscription as any).current_period_end
        );
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription; 
        const { error } = await supabase
          .from("user_subscriptions")
          .update({ status: "canceled" }) 
          .eq("stripe_subscription_id", subscription.id);

        if (error) {
          console.error(`[Webhook] Supabase customer.subscription.deleted error for subId ${subscription.id}:`, error);
          throw error;
        }
        console.log(`[Webhook] Subscription ${subscription.id} marked as canceled.`);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription && (invoice.billing_reason === 'subscription_cycle' || invoice.billing_reason === 'subscription_create')) { 
          
          const stripeSubscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription.id;
          
          let stripeCustomerId: string | null = null;
          if (typeof invoice.customer === 'string') {
            stripeCustomerId = invoice.customer;
          } else if (invoice.customer && 'id' in invoice.customer) { // Check if it's a Customer-like object with an id
            stripeCustomerId = invoice.customer.id;
          }

          if (!stripeCustomerId) {
            console.error(`[Webhook] invoice.payment_succeeded: Missing customer ID on invoice ${invoice.id}.`);
            return NextResponse.json({ error: `Missing customer ID on invoice.` }, { status: 400 }); // Or 200
          }
          
          const subscription: Stripe.Subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
          
          let userId = subscription.metadata?.user_id;
           if (!userId) { // Try to get from customer metadata if not on subscription
                const customer = await stripe.customers.retrieve(stripeCustomerId);
                 if (customer && !customer.deleted) {
                    userId = customer.metadata?.user_id;
                }
           }
            if (!userId) { // Fallback to DB lookup
                const { data: existingSub } = await supabase
                    .from('user_subscriptions')
                    .select('user_id')
                    .eq('stripe_subscription_id', stripeSubscriptionId)
                    .single();
                if (existingSub) userId = existingSub.user_id;
            }

          if (!userId) {
            console.warn(`[Webhook] invoice.payment_succeeded: Could not determine user_id for subscription ${stripeSubscriptionId}. Acknowledging event.`);
            return NextResponse.json({ received: true, warning: `Could not determine user_id for subscription ${stripeSubscriptionId}.` }, { status: 200 });
          }

          await manageSubscriptionInSupabase(
            userId, 
            stripeCustomerId,
            subscription.id,
            subscription.status, 
            (subscription as any).current_period_start,
            (subscription as any).current_period_end
          );
          console.log(`[Webhook] Subscription ${subscription.id} updated/renewed for user ${userId}.`);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription) { // Ensure there's a subscription associated
          const stripeSubscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription.id;
          const { error } = await supabase
            .from("user_subscriptions")
            .update({ status: "past_due" }) 
            .eq("stripe_subscription_id", stripeSubscriptionId);

          if (error) {
            console.error(`[Webhook] Supabase invoice.payment_failed error for subId ${stripeSubscriptionId}:`, error);
            throw error; 
          }
          console.log(`[Webhook] Subscription ${stripeSubscriptionId} payment failed, status updated.`);
        }
        break;
      }

      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`);
    }
  } catch (error: any) {
    console.error("[Webhook] Error processing event:", event.type, error.message, error.stack);
    return NextResponse.json({ error: "Webhook handler failed. See server logs." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}