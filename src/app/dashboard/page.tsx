// src/app/dashboard/page.tsx
"use client";

import { useSupabaseAuth } from "../../hooks/SupabaseAuthProvider";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

const AFFIRMATIONS = [
  "Congratulations, you survived another day of your own nonsense.",
  "Remember: progress is just failure with better branding.",
  "You’re not broken, just uniquely dysfunctional.",
  "Healing is a scam, but at least you’re trying.",
  "If you can’t love yourself, at least tolerate your existence.",
  "Today’s growth: realizing you’re the problem and the solution.",
  "You’re doing great at pretending to be okay.",
  "Every setback is just another plot twist in your tragicomedy.",
  "You’re not alone—your issues are always with you.",
  "Self-care: sometimes it’s just not making things worse."
];

function getRandomAffirmation() {
  return AFFIRMATIONS[Math.floor(Math.random() * AFFIRMATIONS.length)];
}

export default function DashboardPage() {
  const { user, loading } = useSupabaseAuth();
  const router = useRouter();
  const [diaryEntries, setDiaryEntries] = useState<{ content: string; created_at: string }[]>([]);
  const [affirmation, setAffirmation] = useState("");
  const [latestDecay, setLatestDecay] = useState<null | { mood: string; note: string; created_at: string; snide: string }>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchDiaryEntries = async () => {
      const { data, error } = await supabase
        .from("diary")
        .select("content, created_at")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });
      if (error) {
        console.error("Error fetching diary entries:", error);
      } else {
        setDiaryEntries(data || []);
      }
    };
    // Fetch latest decay log entry and its snide remark
    const fetchLatestDecay = async () => {
      const { data, error } = await supabase
        .from("decay_log")
        .select("mood, note, created_at, id")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })
        .limit(1);
      if (!error && data && data.length > 0) {
        // Fetch snide remark for this entry
        const entry = data[0];
        const prompt = `You are RotBot, a gothic therapist with a snarky, irreverent, and clinical style. For the following mood log entry, generate a short, unique, and darkly funny snide remark. Reference the mood and/or note if possible. Do NOT repeat generic comments. Do NOT include any headers, special tokens, or role markers—just the remark itself. Example: If the mood is 'joy', mock the rarity. If it's 'sadness', mock the predictability. If there's a note, riff on it. Do not address the user directly.\n\nMood: ${entry.mood}\nNote: ${entry.note || "(none)"}`;
        let snide = "";
        try {
          const res = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ messages: [{ role: "system", content: prompt }] })
          });
          const data = await res.json();
          snide = (data.content || "").replace(/<\|im_start\|>[\s\S]*?<\|im_sep\|>/, "").replace(/^\s*assistant:?/i, "").trim();
        } catch {}
        setLatestDecay({ ...entry, snide });
      }
    };
    if (user) {
      fetchDiaryEntries();
      setAffirmation(getRandomAffirmation());
      fetchLatestDecay();
    }
  }, [user]);

  if (loading || !user) {
    return <div className="text-center mt-20">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto mt-16 px-2 md:px-0">
      <h1 className="text-4xl font-black mb-10 text-center text-rose-500 drop-shadow tracking-widest goth-title">DASHBOARD</h1>
      <div className="flex flex-col md:flex-row gap-10">
        {/* Tarot Card Spread for Latest Decay Log Entry */}
        <div className="flex-1 flex flex-col items-center justify-start">
          <h2 className="text-2xl font-semibold mb-4 text-rose-400 tracking-wider text-center goth-title">Tarot of Rot</h2>
          {latestDecay ? (
            <div className="relative bg-gradient-to-br from-rose-950 via-neutral-900 to-rose-900 border-4 border-rose-800 rounded-2xl shadow-2xl w-80 p-7 flex flex-col items-center animate-fade-in tarot-card">
              <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-rose-900 px-5 py-1 rounded-full border border-rose-700 text-rose-200 font-black text-lg tracking-widest shadow goth-title">TAROT</div>
              <div className="mt-10 mb-2 text-3xl font-black uppercase tracking-widest text-rose-400 drop-shadow goth-title">{latestDecay.mood}</div>
              {latestDecay.note && <div className="italic text-rose-200 text-center mb-2">“{latestDecay.note}”</div>}
              <div className="mt-2 text-rose-300 text-center text-base font-mono border-t border-rose-800 pt-4 min-h-[3em]">{latestDecay.snide || <span className="opacity-50">Reading your rot...</span>}</div>
              <div className="absolute bottom-2 right-4 text-xs text-rose-700 opacity-60">{new Date(latestDecay.created_at).toLocaleString()}</div>
            </div>
          ) : (
            <div className="text-rose-700 italic text-center">No rot to divine. Log your latest decay to receive a reading.</div>
          )}
        </div>
        {/* Diary Section */}
        <div className="flex-1">
          <div className="bg-gradient-to-br from-neutral-900 via-neutral-800 to-rose-950 p-8 rounded-2xl shadow-2xl flex flex-col gap-6 border border-rose-900">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <p className="text-lg font-semibold text-neutral-200 mb-1">Welcome, <span className="font-mono text-rose-300">{user.user_metadata?.name || user.email}</span></p>
                <p className="text-neutral-400">This is your dark lair. More features coming soon.</p>
              </div>
              <div className="bg-rose-900/80 border border-rose-700 rounded-lg px-4 py-3 shadow text-rose-100 text-center max-w-xs mx-auto sm:mx-0 animate-fade-in">
                <span className="font-bold uppercase tracking-wider text-xs text-rose-300">Daily Affirmation</span>
                <div className="mt-2 italic text-base text-rose-100">{affirmation}</div>
              </div>
            </div>
            <h2 className="text-2xl font-semibold mb-4 text-rose-400 goth-title">RotBot&apos;s Diary</h2>
            {diaryEntries.length === 0 ? (
              <p className="text-center text-gray-400">No diary entries yet. RotBot hasn&apos;t bothered to write about you... yet.</p>
            ) : (
              <div className="space-y-4">
                {diaryEntries.map((entry: { content: string; created_at: string }) => (
                  <div key={entry.created_at} className="bg-neutral-700 p-4 rounded-lg shadow-lg border-l-4 border-rose-700">
                    <p className="text-gray-300 whitespace-pre-line">
                      {entry.content.replace(/\|im_start\|>assistant<\|im_sep\|>/g, "").trim()}
                    </p>
                    <p className="text-xs text-gray-500 text-right mt-2">{new Date(entry.created_at).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
