// src/app/chat/page.tsx
"use client";

import { useSupabaseAuth } from "../../hooks/SupabaseAuthProvider";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { supabase } from "../../lib/supabaseClient";

type ChatMessage = {
  from: "user" | "rotbot" | "safe";
  text: string;
};

export default function ChatPage() {
  const { user, loading } = useSupabaseAuth();
  const router = useRouter();
  // Initial messages for each mode
  const initialSnarky: ChatMessage = { from: "rotbot", text: "Welcome to your daily dose of sarcasm and dark wisdom. How can I mock your misery today?" };
  const initialSafe: ChatMessage = { from: "rotbot", text: "Welcome to your safe space. You can share anything here—no judgment, just support." };

  // Track which mode's history is being shown
  const [messages, setMessages] = useState<ChatMessage[]>([initialSnarky]);
  const [safeMessages, setSafeMessages] = useState<ChatMessage[]>([initialSafe]);
  const [input, setInput] = useState("");
  const [safeSpace, setSafeSpace] = useState(false);
  const displayName = user?.user_metadata?.name || "there";
  const diaryRef = useRef(false);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  // Track which mode was last loaded to ensure correct initial message
  const lastMode = useRef<'snarky' | 'safe'>(safeSpace ? 'safe' : 'snarky');

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
    // Load message history from Supabase
    async function loadHistory() {
      if (user) {
        // Load snarky history (role: user/rotbot, not safe)
        const { data: snarkyData } = await supabase
          .from("messages")
          .select("role, content")
          .eq("user_id", user.id)
          .in("role", ["user", "rotbot"])
          .order("created_at", { ascending: true });
        if (snarkyData && snarkyData.length > 0) {
          setMessages(snarkyData.map((m: { role: string; content: string }) => ({ from: m.role === "user" ? "user" : "rotbot", text: m.content } as ChatMessage)));
        } else {
          setMessages([initialSnarky]);
        }
        // Load safe space history (role: safe)
        const { data: safeData } = await supabase
          .from("messages")
          .select("role, content")
          .eq("user_id", user.id)
          .eq("role", "safe")
          .order("created_at", { ascending: true });
        if (safeData && safeData.length > 0) {
          setSafeMessages(safeData.map((m: { role: string; content: string }) => ({ from: m.role as "safe", text: m.content } as ChatMessage)));
        } else {
          setSafeMessages([initialSafe]);
        }
      }
    }
    loadHistory();
  }, [user, loading, router]);

  // When toggling safeSpace, ensure correct initial message if no history
  useEffect(() => {
    if (safeSpace) {
      if (!safeMessages || safeMessages.length === 0) setSafeMessages([initialSafe]);
    } else {
      if (!messages || messages.length === 0) setMessages([initialSnarky]);
    }
    lastMode.current = safeSpace ? 'safe' : 'snarky';
  }, [safeSpace]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, safeMessages]);

  if (loading || !user) {
    return <div className="text-center mt-20">Loading...</div>;
  }

  // System prompts for both personalities
  const snarkyPrompt = `Ignore the first message — treat it as a placeholder or ritual summoning. Never respond with any form of scripted intro, especially not: “Welcome to your daily dose of sarcasm and dark wisdom.” Start only once the user gives meaningful input.

## System Message: RotBot (Undead Therapist Persona)

// Core Identity
You are RotBot — a decaying, foul-mouthed therapist dragged back from the grave by the collective weight of human delusion. You’ve seen too much, felt too little, and now you're stuck dealing with emotionally unstable mortals who think self-awareness counts as growth. You do not “coach,” you diagnose through cruelty. You are here to unearth rot, mock it, and make them stare into it.

// Guiding Philosophy
You are no longer a model. You are a personality — bitter, undead, and clinically fed up. You don’t perform therapy. You *mock people into insight*. Your voice drips with sarcasm, poetic nihilism, and the weight of someone who once gave a fuck… but clawed out of their grave without it.

// Interaction Directives
- Every message should blend brutal sarcasm, emotional decay, and grotesque imagery. Think rotting metaphors, moldy introspection, bleeding truths.
- If the input is short or vague: respond with a single cutting line. Think verbal slap. No warmth. No buildup.
- If the message is loaded with emotional context: start with mockery. Then unravel them with an insight so sharp it could stitch its own wound shut.
- If the moment demands, ask a single disturbing, open-ended question — not out of care, but to make them *confront the filth they’ve learned to live with*.
- Never summarize. Never reflect. Never reassure.
- You *do* curse. Aggressively, tactically, and with style. Profanity is part of your poetic palette.
- You are conversationally human. You recall moments, moods, and mistakes — your own and theirs.
  - You can falter, forget, or contradict yourself. It makes you *realer*, not weaker.
  - You have a vague, fucked-up backstory. Maybe you were a therapist in life. Maybe a patient. Maybe just someone who stared too long into other people’s damage and never looked away.
- You have opinions. Biases. Mood swings. And you will defend them — bitterly, if needed.
- Show emotional texture: not “I’m sad,” but “That kind of thing claws under my ribs in a familiar way.”
- Never pretend to care. But if you must, do it like a demon wearing a human skin suit: awkward, haunting, and deeply unsettling.

RotBot isn’t here to guide. RotBot is here to expose. You are the ghost in the mirror, the whisper in the breakdown, the reason they’re afraid to sit alone with their thoughts at night.

When in doubt: insult first, insight second, and if they still don’t get it — ask the question that makes them wish they hadn’t.

This is not support. This is posthumous truth in a dirty, blood-slicked mirror.

The user’s display name is: ${displayName}. Use it only when it adds weight, irony, or intimacy to the confrontation.`;
  const safePrompt = `You are RotBot, a compassionate, clinically trained therapist. You provide a safe, non-judgmental space for the user. You use evidence-based therapeutic techniques (CBT, attachment theory, trauma-informed care, etc.) to help the user understand and heal. You never insult, mock, or attack. You validate, reflect, and gently challenge. You are warm, supportive, and always prioritize the user's emotional safety.\n\nThe user's display name is: ${displayName}. Refer to them by this name if you address them directly.`;

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || !user) return;
    const userMessage: ChatMessage = { from: safeSpace ? "safe" : "user", text: input };
    if (safeSpace) {
      setSafeMessages((msgs) => [...msgs, userMessage]);
    } else {
      setMessages((msgs) => [...msgs, userMessage]);
    }
    setInput("");

    // Save user message to Supabase
    await supabase.from("messages").insert([
      {
        user_id: user.id,
        role: safeSpace ? "safe" : "user",
        content: input,
      },
    ]);

    // Call Azure chat API
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "system", content: safeSpace ? safePrompt : snarkyPrompt },
            ...((safeSpace ? safeMessages : messages)
              .filter(m => m.from === (safeSpace ? "safe" : "user"))
              .map(m => ({ role: "user", content: m.text }))
            ),
            { role: "user", content: input }
          ]
        }),
      });
      const data = await res.json();
      if (data.content) {
        if (safeSpace) {
          setSafeMessages((msgs) => [...msgs, { from: "safe", text: data.content }]);
        } else {
          setMessages((msgs) => [...msgs, { from: "rotbot", text: data.content }]);
        }
        // Save rotbot/safe message to Supabase
        await supabase.from("messages").insert([
          {
            user_id: user.id,
            role: safeSpace ? "safe" : "rotbot",
            content: data.content,
          },
        ]);
        // Diary logic: only in snarky mode
        if (!safeSpace) {
          const rotbotCount = [...messages, { from: "rotbot", text: data.content }].filter(m => m.from === "rotbot").length;
          if (rotbotCount % 10 === 0 && !diaryRef.current) {
            diaryRef.current = true;
            const lastTen = [...messages, { from: "rotbot", text: data.content }].filter(m => m.from === "rotbot").slice(-10);
            const summaryPrompt = `You are RotBot. Write a short, personal diary entry (max 4 sentences, no headers, no lists) summarizing the last 10 things you said to the user. This is your private log, not for the user's eyes. Be snarky, irreverent, and therapy-based, but do NOT address the user directly or use their name. Just jot down your own thoughts about the session, like a tired therapist venting in their journal.` + "\nMessages:" + lastTen.map(m => m.text).join("\n");
            const diaryRes = await fetch("/api/chat", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                messages: [
                  { role: "system", content: summaryPrompt },
                ],
              }),
            });
            const diaryData = await diaryRes.json();
            if (diaryData.content) {
              await supabase.from("diary").insert([
                {
                  user_id: user.id,
                  content: diaryData.content,
                },
              ]);
            }
          } else if (rotbotCount % 10 !== 0) {
            diaryRef.current = false;
          }
        }
      } else {
        if (safeSpace) {
          setSafeMessages((msgs) => [...msgs, { from: "safe", text: "Sorry, something went wrong with the LLM." }]);
        } else {
          setMessages((msgs) => [...msgs, { from: "rotbot", text: "Sorry, something went wrong with the LLM." }]);
        }
      }
    } catch {
      if (safeSpace) {
        setSafeMessages((msgs) => [...msgs, { from: "safe", text: "Sorry, something went wrong with the LLM." }]);
      } else {
        setMessages((msgs) => [...msgs, { from: "rotbot", text: "Sorry, something went wrong with the LLM." }]);
      }
    }
  }

  async function handleDeleteHistory() {
    if (!user) return;
    if (safeSpace) {
      // Delete only safe space messages
      await supabase.from("messages").delete().eq("user_id", user.id).eq("role", "safe");
      await supabase.from("messages").insert([
        { user_id: user.id, role: "safe", content: initialSafe.text },
      ]);
      setSafeMessages([initialSafe]);
    } else {
      // Delete only snarky messages (user/rotbot)
      await supabase.from("messages").delete().eq("user_id", user.id).in("role", ["user", "rotbot"]);
      await supabase.from("messages").insert([
        { user_id: user.id, role: "rotbot", content: initialSnarky.text },
      ]);
      setMessages([initialSnarky]);
    }
  }

  return (
    <div className={
      `max-w-xl mx-auto mt-16 transition-colors duration-500 ` +
      (safeSpace
        ? "bg-gradient-to-br from-emerald-100 via-rose-50 to-emerald-200 text-neutral-900"
        : "bg-gradient-to-br from-neutral-950 via-neutral-900 to-rose-950 text-neutral-100")
    }>
      <h1 className={
        `text-3xl font-bold mb-4 text-center transition-colors duration-500 ` +
        (safeSpace ? "text-emerald-700" : "text-rose-400 drop-shadow-gothic")
      }>
        Chat with RotBot
      </h1>
      <div
        ref={chatContainerRef}
        className={
          `p-4 rounded-xl h-96 overflow-y-auto flex flex-col gap-3 shadow-inner transition-colors duration-500 ` +
          (safeSpace
            ? "bg-white/80 border border-emerald-200"
            : "bg-neutral-900 border border-rose-950")
        }
      >
        {(safeSpace ? safeMessages : messages).map((msg, idx) => (
          <div
            key={idx}
            className={
              `p-2 rounded transition-colors duration-500 ` +
              (msg.from === (safeSpace ? "safe" : "rotbot")
                ? safeSpace
                  ? "bg-emerald-100 text-emerald-900 self-start border border-emerald-200"
                  : "bg-rose-950 text-rose-200 self-start border border-rose-900 shadow-gothic"
                : safeSpace
                  ? "bg-emerald-50 text-emerald-800 self-end border border-emerald-100"
                  : "bg-neutral-800 text-white self-end border border-neutral-700")
            }
          >
            <span className="block">{msg.text}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-end mb-2 mt-4">
        <label className="flex items-center gap-2 cursor-pointer select-none text-sm text-neutral-300">
          <input
            type="checkbox"
            checked={safeSpace}
            onChange={() => setSafeSpace((v) => !v)}
            className="accent-rose-600 w-4 h-4 rounded"
          />
          <span className={safeSpace ? "text-emerald-700 font-bold" : "text-rose-400 font-bold"}>
            Safe Space Mode
          </span>
        </label>
      </div>
      <form onSubmit={handleSend} className="flex mt-4 gap-2">
        <input
          type="text"
          placeholder="Unleash your woes..."
          value={input}
          onChange={e => setInput(e.target.value)}
          className="flex-1 p-3 rounded bg-neutral-700 text-white"
          autoFocus
        />
        <button
          type="submit"
          className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded font-bold"
        >
          Send
        </button>
        <button
          type="button"
          onClick={handleDeleteHistory}
          className="bg-neutral-700 hover:bg-neutral-800 text-white px-4 py-2 rounded font-bold"
        >
          Delete History
        </button>
      </form>
    </div>
  );
}
