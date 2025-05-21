"use client";

// Decay Log Page
// Tagline: Catalog your emotional rot, one festering feeling at a time.

import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useSupabaseAuth } from "../../hooks/SupabaseAuthProvider";
import { useRouter } from "next/navigation";

// Fix all 'any' types for strict TypeScript

type DecayLogEntry = {
  id: number;
  mood: string;
  note: string;
  created_at: string;
};

const MOOD_COLORS = {
  sadness: "bg-rose-900 border-rose-700 text-rose-100",
  anger: "bg-red-800 border-red-600 text-red-100",
  anxiety: "bg-yellow-900 border-yellow-700 text-yellow-100",
  numb: "bg-gray-800 border-gray-600 text-gray-200",
  joy: "bg-green-900 border-green-700 text-green-100",
  apathy: "bg-neutral-800 border-neutral-700 text-neutral-200",
  other: "bg-purple-900 border-purple-700 text-purple-100"
};

export default function DecayLogPage() {
  const { user, loading } = useSupabaseAuth();
  const router = useRouter();
  const [entries, setEntries] = useState<DecayLogEntry[]>([]);
  const [mood, setMood] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  // Add state for snide remarks
  const [snideRemarks, setSnideRemarks] = useState<{ [id: number]: string }>({});

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
    if (user) fetchEntries();
    // eslint-disable-next-line
  }, [user, loading]);

  async function fetchEntries() {
    if (!user) return;
    const { data, error } = await supabase
      .from("decay_log")
      .select("id, mood, note, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (!error) setEntries((data as DecayLogEntry[]) || []);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!mood) return setError("Pick a mood, darling.");
    if (!user) return setError("Not logged in.");
    setError("");
    const { error } = await supabase.from("decay_log").insert([
      { user_id: user.id, mood, note }
    ]);
    if (!error) {
      setMood("");
      setNote("");
      fetchEntries();
    }
  }

  // Generate a snide remark for a log entry using Azure LLM
  const fetchSnideRemark = useCallback(async (entry: DecayLogEntry) => {
    const prompt = `You are RotBot, a gothic therapist with a snarky, irreverent, and clinical style. For the following mood log entry, generate a short, unique, and darkly funny snide remark. Reference the mood and/or note if possible. Do NOT repeat generic comments. Do NOT include any headers, special tokens, or role markers—just the remark itself. Example: If the mood is 'joy', mock the rarity. If it's 'sadness', mock the predictability. If there's a note, riff on it. Do not address the user directly.\n\nMood: ${entry.mood}\nNote: ${entry.note || "(none)"}`;
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [
          { role: "system", content: prompt }
        ]
      })
    });
    const data = await res.json();
    let remark = data.content || "";
    // Remove any LLM role headers or special tokens (compatible with ES2017)
    remark = remark.replace(/<\|im_start\|>[\s\S]*?<\|im_sep\|>/, "").replace(/^\s*assistant:?/i, "").trim();
    setSnideRemarks(prev => ({ ...prev, [entry.id]: remark }));
  }, []);

  // Fetch snide remarks for new entries
  useEffect(() => {
    entries.forEach(entry => {
      if (!snideRemarks[entry.id]) {
        fetchSnideRemark(entry);
      }
    });
    // eslint-disable-next-line
  }, [entries]);

  function getMoodColor(mood: string) {
    return MOOD_COLORS[mood as keyof typeof MOOD_COLORS] || MOOD_COLORS.other;
  }

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-2 tracking-tight text-rose-900">Decay Log</h1>
      <p className="mb-8 text-lg text-rose-700 italic">Catalog your emotional rot, one festering feeling at a time.</p>
      <form onSubmit={handleSubmit} className="mb-8 flex flex-col gap-4 bg-rose-950/80 p-6 rounded-xl border border-rose-900 shadow-gothic">
        <label className="font-semibold text-rose-200">Mood</label>
        <select value={mood} onChange={e => setMood(e.target.value)} className="rounded p-2 bg-rose-900 text-rose-100 border border-rose-700">
          <option value="">Select your rot</option>
          <option value="sadness">Sadness</option>
          <option value="anger">Anger</option>
          <option value="anxiety">Anxiety</option>
          <option value="numb">Numb</option>
          <option value="joy">Joy (rare!)</option>
          <option value="apathy">Apathy</option>
          <option value="other">Other</option>
        </select>
        <label className="font-semibold text-rose-200">Notes (optional)</label>
        <textarea value={note} onChange={e => setNote(e.target.value)} className="rounded p-2 bg-rose-900 text-rose-100 border border-rose-700 min-h-[60px]" placeholder="Describe your decay in detail..." />
        {error && <div className="text-red-400 font-bold">{error}</div>}
        <button type="submit" className="bg-rose-800 hover:bg-rose-700 text-rose-100 font-bold py-2 px-4 rounded mt-2 border border-rose-900">Log Rot</button>
      </form>
      <div className="space-y-6">
        {entries.length === 0 && <div className="text-rose-400">No rot catalogued yet. How inspiring.</div>}
        {entries.map((entry: DecayLogEntry) => (
          <div key={entry.id} className={`p-4 rounded-xl border shadow-gothic flex flex-col gap-2 ${getMoodColor(entry.mood)}`}>
            <div className="flex justify-between items-center">
              <span className="font-bold text-lg capitalize">{entry.mood}</span>
              <span className="text-xs opacity-70">{new Date(entry.created_at).toLocaleString()}</span>
            </div>
            {entry.note && <div className="italic text-sm">{entry.note}</div>}
            <div className="text-xs mt-2 text-rose-300 min-h-[1.5em]">
              {snideRemarks[entry.id] || <span className="opacity-50">Generating snide remark...</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
