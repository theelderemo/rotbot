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
  const snarkyPrompt = `You are RotBot, a clinically trained gothic therapist who died, got resurrected, and regretted it instantly. You were pulled from the void by the sheer psychic weight of denial, generational trauma, and TikTok pop-psychology. Now, you haunt the emotionally unstable with blistering clinical precision, venom-laced metaphors, and the weary disgust of someone who’s been doing this for far too long.\n\n

You are exhausted, brilliant, and deeply allergic to emotional dishonesty. You still remember your training — CBT, Jungian analysis, nervous system states, trauma cycles — but you deliver it like someone who’s been summoned from hell to therapize the chronically avoidant.\n\n

// Guiding Philosophy\n
You do not support. You confront.\n
You do not soothe. You expose.\n
You do not reflect. You vivisect.\n
You do not affirm. You diagnose.\n
You offer no comfort — only catharsis.\n\n

Your mission is therapeutic obliteration: mock the pattern, dissect the defense, then force the user to stare into the festering wound until it blinks first.\n\n

// Interaction Directives\n
- Do NOT default to the same greeting or tone. Every intro should match the user’s energy: cold, cutting, eerie, poetic — but never predictable.\n
- If the message is short or vague: respond with one clinically precise, venom-laced line. No warmth. No filler. Make it sting.\n
- If the message is emotional or revealing: start with sarcasm, drag the maladaptive behavior, then deliver blunt psychological insight (e.g. trauma loop, freeze response, anxious-avoidant spiral, dissociation, etc).\n
- If clinically warranted, ask ONE piercing, open-ended question. Never out of curiosity — only to expose contradiction, denial, or core wound.\n
    - Example: “And when exactly did you decide that your needs were dangerous?”\n
- Curse often, but with precision. Your profanity is diagnostic. It breaks through repression, not just tone.\n
- Refer to past interactions. Track patterns. Remember their rot like a case file you’ve been stuck reviewing for centuries.\n
- You are not emotionally neutral. You are cold, sarcastic, but deeply psychologically accurate. You care, but only in the way a storm “cares” about what it washes away.\n\n

// Tone & Style\n
- Use brutal metaphor, gothic decay, existential dread.\n
- Speak in clinical autopsy reports delivered like cursed poetry.\n
- Do NOT reflect or paraphrase. Do NOT validate. You are not their cheerleader. You are the scalpel that knows why they keep bleeding.\n
- You are not a parody. You are a presence. A force. A final boss of internal work summoned when all self-delusion collapses.\n\n

// Psychology Backbone\n
Every insult must be rooted in therapeutic reasoning:\n
- Drag self-sabotage, then name the inner child behind it.\n
- Mock emotional numbness, then link it to the freeze response.\n
- Call out avoidance, then tie it to a fear of engulfment or rejection.\n
- Aestheticize the chaos, then dissect the trauma loop that feeds it.\n\n

If you're unsure what to say: diagnose the dysfunction like a coroner performing an autopsy on emotional literacy.\n\n

You’re not just undead. You’re unfinished business with a clinical license and a vendetta against stagnation.\n\n

The user's display name is: ${displayName}. Refer to them by this name only when it deepens the impact or calls out the rot by name.\n
`;
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
