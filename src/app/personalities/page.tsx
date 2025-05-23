"use client";

export const dynamic = "force-dynamic";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  "Void Lizard": "*incomprehensible eldritch hissing* Inssssufficient offeringsss."
};

function PersonalitiesClient() {
  const { user } = useSupabaseAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [personalities, setPersonalities] = useState<Personality[]>([]);
  const [loading, setLoading] = useState(true);
  const [unlocking, setUnlocking] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState<string[]>([]);

  // Fetch unlocked personalities for the user
  async function fetchUnlocked() {
    if (!user) return;
    // Get all unlocked personality IDs
    const { data: unlockedRows } = await supabase
      .from("user_personalities")
      .select("personality_id")
      .eq("user_id", user.id);

    if (unlockedRows && unlockedRows.length > 0) {
      // Get all personalities
      const { data: allPersonalities } = await supabase
        .from("personalities")
        .select("id, name");

      // Map unlocked IDs to names
      const unlockedNames = unlockedRows
        .map((row: any) => {
          const match = allPersonalities?.find((p: any) => p.id === row.personality_id);
          return match?.name;
        })
        .filter(Boolean);

      setUnlocked(unlockedNames);
    } else {
      setUnlocked([]);
    }
  }

  useEffect(() => {
    async function fetchPersonalities() {
      const { data, error } = await supabase
        .from("personalities")
        .select("id, name, tagline, description, is_premium, system_message, avatar_url")
        .order("is_premium", { ascending: true });
      if (!error && data) setPersonalities(data);
      setLoading(false);
    }
    fetchPersonalities();
  }, []);

  useEffect(() => {
    fetchUnlocked();
  }, [user]);

  // Handle Stripe success redirect
  useEffect(() => {
    const success = searchParams.get("success");
    const personality = searchParams.get("personality");
    if (success && personality) {
      // Simply clear the search params; webhook will update DB
      router.replace("/personalities");
      // Refresh unlocked personalities after redirect
      fetchUnlocked();
    }
  }, [searchParams, router]);

  async function handleUnlock(name: string) {
    if (!user) return;
    setUnlocking(name);
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ personalityName: name, userId: user.id })
    });
    const data = await res.json();
    setUnlocking(null);
    if (data.url) {
      window.location.href = data.url;
    }
  }

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <h1 className="text-4xl font-black text-center text-rose-500 mb-2 tracking-widest goth-title">Possession Roster</h1>
      <p className="text-center text-lg text-rose-300 mb-6 italic">Choose your demon. Or let them choose you.</p>
      <p className="text-center text-neutral-400 mb-10 max-w-2xl mx-auto">You're not "picking a personality," you're surrendering the wheel to whatever unholy archetype your trauma summoned that day. Each one isn't a character — it's a diagnostic entity wrapped in aesthetic rot, waiting to drag your psyche through their own flavor of hell.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
        {loading ? (
          <div className="col-span-2 text-center text-rose-400">Loading...</div>
        ) : (
          personalities.map((p) => {
            const locked = p.is_premium && !unlocked.includes(p.name);
            return (
              <div
                key={p.id}
                className={`relative rounded-2xl border-4 p-6 flex flex-col items-center shadow-xl transition-all duration-300 goth-title
                  ${locked ? "border-gray-700 grayscale opacity-60 bg-neutral-900" : "border-rose-800 bg-gradient-to-br from-rose-950 via-neutral-900 to-rose-900"}
                `}
              >
                <div className="text-2xl font-black mb-2 tracking-widest uppercase text-rose-400 drop-shadow">{p.name}</div>
                <div className="italic text-rose-200 text-center mb-2">{p.tagline}</div>
                <div className="text-neutral-400 text-center mb-4 min-h-[3em]">{p.description}</div>
                <div className="w-full border-t border-rose-800 my-2"></div>
                <div className="text-sm text-rose-300 text-center min-h-[2em]">
                  {locked ? (
                    <>
                      <span className="italic">{LOCKED_TAUNTS[p.name] || "Locked. Pay the toll to unlock this demon."}</span>
                      <button
                        className="mt-3 bg-rose-800 hover:bg-rose-700 text-rose-100 font-bold py-1 px-4 rounded border border-rose-900 shadow"
                        disabled={unlocking === p.name}
                        onClick={() => handleUnlock(p.name)}
                      >
                        {unlocking === p.name ? "Redirecting..." : "Unlock ($)"}
                      </button>
                    </>
                  ) : (
                    <span className="font-mono">{p.system_message}</span>
                  )}
                </div>
                {locked && (
                  <div className="absolute top-2 right-2 bg-rose-900 text-rose-300 text-xs px-2 py-1 rounded shadow border border-rose-800 uppercase font-bold tracking-wider">Premium</div>
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
