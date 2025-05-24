"use client";

export const dynamic = "force-dynamic";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation"; // Removed useSearchParams as it's no longer used here
import { supabase } from "../../lib/supabaseClient";
import { useSupabaseAuth } from "../../hooks/SupabaseAuthProvider";

interface Personality {
  id: string;
  name: string;
  tagline: string;
  description: string;
  is_premium: boolean;
  system_message: string;
  avatar_url?: string;
}

const LOCKED_TAUNTS: Record<string, string> = {
  "Sad Ghost": "I’d hug you, but I’m stuck behind this capitalism.",
  "Goth Auntie": "Darling, your free-tier drama isn’t even vintage.",
  "Void Lizard": "*incomprehensible eldritch hissing* Insssssufficient offeringsss."
};

function PersonalitiesClient() {
  const { user } = useSupabaseAuth();
  const router = useRouter();
  // const searchParams = useSearchParams(); // Removed as no longer needed by the removed useEffect
  const [personalities, setPersonalities] = useState<Personality[]>([]);
  const [loadingPersonalities, setLoadingPersonalities] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  
  const [hasActiveSubscription, setHasActiveSubscription] = useState<boolean>(false);
  const [selectedPersonalityId, setSelectedPersonalityId] = useState<string | null>(null);
  const [loadingSubscriptionInfo, setLoadingSubscriptionInfo] = useState(true);

  async function fetchUserSubscriptionAndSelection() {
    if (!user) {
      setHasActiveSubscription(false);
      setSelectedPersonalityId(null);
      setLoadingSubscriptionInfo(false);
      return;
    }
    setLoadingSubscriptionInfo(true);
    try {
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from("user_subscriptions")
        .select("status")
        .eq("user_id", user.id)
        .eq("status", "active")
        .single();

      if (subscriptionError && subscriptionError.code !== 'PGRST116') {
        console.error("Error fetching subscription status:", subscriptionError);
      }
      setHasActiveSubscription(!!subscriptionData && subscriptionData.status === 'active');

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("selected_personality_id")
        .eq("user_id", user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error("Error fetching selected personality:", profileError);
      }
      setSelectedPersonalityId(profileData?.selected_personality_id || null);
    } catch (e) {
        console.error("Error in fetchUserSubscriptionAndSelection:", e);
        setHasActiveSubscription(false);
        setSelectedPersonalityId(null);
    } finally {
        setLoadingSubscriptionInfo(false);
    }
  }

  useEffect(() => {
    if (user) {
      fetchUserSubscriptionAndSelection();
    } else {
      setHasActiveSubscription(false);
      setSelectedPersonalityId(null);
      setLoadingSubscriptionInfo(false); 
    }
  }, [user]);

  useEffect(() => {
    async function fetchPersonalities() {
      setLoadingPersonalities(true);
      const { data, error } = await supabase
        .from("personalities")
        .select("id, name, tagline, description, is_premium, system_message, avatar_url")
        .order("is_premium", { ascending: true });
      if (!error && data) setPersonalities(data);
      else if (error) console.error("Error fetching personalities:", error);
      setLoadingPersonalities(false);
    }
    fetchPersonalities();
  }, []);

  // Removed the useEffect hook that handled searchParams.get("success")
  // as per your request. Webhooks are now the primary source of truth for subscription status.
  // If you still need to clear URL parameters after Stripe redirect, 
  // you might consider a simpler effect that only runs once on mount if specific params exist,
  // or handle it as part of a dedicated redirect page from Stripe.
  // For now, it's removed entirely.

  async function handleSubscribe() {
    if (!user) return;
    setSubscribing(true); 
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id }) 
    });
    const data = await res.json();
    setSubscribing(false);
    if (data.url) {
      window.location.href = data.url;
    } else {
      console.error("Failed to get Stripe checkout URL:", data.error);
    }
  }

  async function handleSelectPersonality(personalityId: string) {
    if (!user) return;
    const personality = personalities.find(p => p.id === personalityId);
    if (!personality || (personality.is_premium && !hasActiveSubscription) || selectedPersonalityId === personalityId) {
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({ selected_personality_id: personalityId })
      .eq("user_id", user.id);

    if (error) {
      console.error("Error updating selected personality:", error);
    } else {
      setSelectedPersonalityId(personalityId);
    }
  }
  
  const isLoading = loadingPersonalities || (user && loadingSubscriptionInfo);

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <h1 className="text-4xl font-black text-center text-rose-500 mb-2 tracking-widest goth-title">Possession Roster</h1>
      <p className="text-center text-lg text-rose-300 mb-6 italic">Choose your demon. Or let them choose you.</p>
      
      {user && !isLoading && !hasActiveSubscription && (
        <div className="text-center mb-8 p-6 bg-neutral-800 rounded-lg shadow-xl border border-rose-700">
          <h2 className="text-2xl font-semibold text-rose-400 mb-3">Unlock All Personalities!</h2>
          <p className="text-neutral-300 mb-4">
            Gain full access to every RotBot personality and all premium features with a single subscription.
          </p>
          <button
            onClick={handleSubscribe}
            disabled={subscribing}
            className="bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg text-xl transition-opacity duration-150 disabled:opacity-70"
          >
            {subscribing ? "Redirecting to Checkout..." : "Subscribe to RotBot Premium ($9.99/month)"}
          </button>
        </div>
      )}
      
      <p className="text-center text-neutral-400 mb-10 max-w-2xl mx-auto">You're not "picking a personality," you're surrendering the wheel to whatever unholy archetype your trauma summoned that day. Each one isn't a character — it's a diagnostic entity wrapped in aesthetic rot, waiting to drag your psyche through their own flavor of hell.</p>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
        {isLoading ? (
          <div className="col-span-2 text-center text-rose-400">Loading Possibilities...</div>
        ) : (
          personalities.map((p) => {
            const locked = p.is_premium && !hasActiveSubscription;
            const isCurrentlySelected = p.id === selectedPersonalityId;

            return (
              <div
                key={p.id}
                className={`relative rounded-2xl border-4 p-6 flex flex-col items-center shadow-xl transition-all duration-300 
                  ${locked 
                    ? "border-gray-700 grayscale opacity-60 bg-neutral-900" 
                    : isCurrentlySelected 
                      ? "border-green-500 ring-2 ring-green-400 bg-gradient-to-br from-neutral-900 via-green-950 to-neutral-900" 
                      : "border-rose-800 bg-gradient-to-br from-rose-950 via-neutral-900 to-rose-900 hover:border-rose-600"
                  }
                  ${(!locked && !isCurrentlySelected) ? 'cursor-pointer' : ''}
                `}
                onClick={() => !locked && !isCurrentlySelected && handleSelectPersonality(p.id)}
              >
                <div className="text-2xl font-black mb-2 tracking-widest uppercase text-rose-400 drop-shadow">{p.name}</div>
                <div className="italic text-rose-200 text-center mb-2">{p.tagline}</div>
                <div className="text-neutral-400 text-center mb-4 min-h-[3em]">{p.description}</div>
                <div className="w-full border-t border-rose-800 my-2"></div>
                <div className="text-sm text-rose-300 text-center min-h-[4em] flex flex-col justify-center items-center w-full">
                  {locked ? (
                    <span className="italic">{LOCKED_TAUNTS[p.name] || "Locked. Requires active subscription."}</span>
                  ) : isCurrentlySelected ? (
                     <span className="font-bold text-green-400 text-lg">✓ Currently Possessed</span>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); 
                        handleSelectPersonality(p.id);
                      }}
                      className="mt-2 bg-rose-700 hover:bg-rose-600 text-white font-semibold py-2 px-4 rounded transition-transform hover:scale-105"
                    >
                      Select this Demon
                    </button>
                  )}
                   {!locked && p.system_message && ( 
                     <span 
                        className="font-mono mt-2 block text-xs overflow-hidden overflow-ellipsis whitespace-nowrap max-w-full px-2 text-neutral-500" 
                        title={p.system_message}
                      >
                       System Prompt: {p.system_message}
                     </span>
                  )}
                </div>
                {p.is_premium && (
                  <div className={`absolute top-2 right-2 text-xs px-2 py-1 rounded shadow border uppercase font-bold tracking-wider
                    ${locked ? "bg-gray-800 text-gray-400 border-gray-700" : "bg-rose-900 text-rose-300 border-rose-800"}
                  `}>Premium Demon</div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default function PersonalitiesPage() {
  return (
    <Suspense fallback={<div className="text-center text-rose-400">Loading...</div>}>
      <PersonalitiesClient />
    </Suspense>
  );
}