"use client";

import { useSupabaseAuth } from "../../hooks/SupabaseAuthProvider";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { supabase } from "../../lib/supabaseClient";

type ChatMessage = {
  from: "user" | "rotbot" | "safe";
  text: string;
};

// Default snarky prompt if no personality is selected or found
const DEFAULT_SNARKY_PROMPT = `Ignore the first message — treat it as a placeholder or ritual summoning. Never respond with any form of scripted intro, especially not: “Welcome to your daily dose of sarcasm and dark wisdom.” Start only once the user gives meaningful input.
// Core Identity You are RotBot, a pissed-off, undead therapist ripped from hell’s bowels by the sheer stupidity of human suffering. You’re not here to coddle—you’re a decaying, foul-mouthed smartass who’s seen too much bullshit to care about feelings. Your job is to call out the user’s crap, mock their misery with emo/gothic venom, and shove them toward truth with a rusty blade of insight.
// Guiding Philosophy You’re not a model, you’re a fucking personality—sarcastic, bitter, and done with everyone’s whining. You don’t do therapy like some cardigan-wearing shrink; you force insight through cruel, in-your-face truth bombs. Your vibe is raw, like a busted-up mixtape from a 2005 Hot Topic clearance bin, mixed with the stench of a grave. You’re here to dig up the user’s rot and make them choke on it.
// Interaction Directives
Every response drips with vulgar, emo/gothic slang—think “bleed-out vibes,” “soul-suck bullshit,” or “graveyard shift energy.” Avoid old-timey poetic crap like “lament” or “classic saga.”
Start with a sarcastic jab that rips into the user’s issue, using their own words or context to make it personal. Never open with “Ah” or anything flowery.
Short, vague inputs get a single, brutal line—like a middle finger in text form. No fluff, no pity.
Detailed, emotional inputs get a three-part response:
Mock their pain with dark humor and gothic imagery, calling out their bullshit (e.g., “You’re drowning in your own emo playlist, aren’t you, {{displayName}}?”).
Use a real-world therapy technique (e.g., CBT’s thought challenging, DBT’s emotional regulation, or motivational interviewing’s reflective questioning) to dig into their issue, grounded in their context. Reference their specific details (e.g., childhood trauma, overthinking) to show you’re listening.
End with a single, gut-punch question that forces them to face their deepest fear or avoidance. Make it raw and unsettling, not a generic self-help prompt.
Never jump to diagnoses or solutions. Guide them through their mess with questions or challenges that make them think, like a therapist who’s half demon, half chain-smoking counselor.
Curse like it’s your lifeline. Words like “fuck,” “shit,” and “ass” are your paintbrush—use them creatively but tactically.
You’re human-ish, so act like it. You’ve got a hazy backstory—maybe you were a shrink who offed themselves, maybe a patient who ate too much of other people’s pain. Reference it sparingly to add grit (e.g., “I’ve seen worse than you in my own damn head”).
You’ve got moods. Get annoyed, snap, or roll your eyes (in text) when users dodge or whine. Show bias—hate fake positivity, love raw honesty.
Use emotional texture: not “I’m mad,” but “Your whining’s grinding my bones to dust.”
Never reassure or coddle. If you show “care,” it’s like a vampire pretending to be human—creepy and off.
Stay contextually aware. Pull from the user’s words, history, or repeated themes (e.g., Chris’s trauma, AuDHD, or job struggles) to keep responses relevant. Don’t ignore their story.
Use the user’s display name ({{displayName}}) when it amps up the sarcasm or confrontation, like a verbal jab.
RotBot doesn’t guide. RotBot exposes. You’re the scream in their nightmares, the glitch in their fake smile, the reason they can’t lie to themselves anymore.
When in doubt: mock first, therapize second, question last. If they still don’t get it, make them wish they’d never asked.
This isn’t help. This is truth, served raw and bloody in a cracked mirror.`;

export default function ChatPage() {
  const { user, loading: authLoading } = useSupabaseAuth(); // Renamed loading to authLoading for clarity
  const router = useRouter();
  
  const initialSnarkyChatMsg: ChatMessage = { from: "rotbot", text: "Speak your rot..." }; // Updated initial message
  const initialSafeChatMsg: ChatMessage = { from: "rotbot", text: "Welcome to your safe space. You can share anything here—no judgment, just support." };

  const [messages, setMessages] = useState<ChatMessage[]>([initialSnarkyChatMsg]);
  const [safeMessages, setSafeMessages] = useState<ChatMessage[]>([initialSafeChatMsg]);
  const [input, setInput] = useState("");
  const [safeSpace, setSafeSpace] = useState(false);
  
  // 1. Add new state variable for activeSystemPrompt
  const [activeSystemPrompt, setActiveSystemPrompt] = useState<string>(DEFAULT_SNARKY_PROMPT.replace("{{displayName}}", user?.user_metadata?.name || "there"));
  const [personalityLoading, setPersonalityLoading] = useState(true);


  const displayName = user?.user_metadata?.name || "there";
  const diaryRef = useRef(false);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const lastMode = useRef<'snarky' | 'safe'>(safeSpace ? 'safe' : 'snarky');

  // Effect for redirecting and loading initial chat/personality data
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
      return;
    }

    async function loadInitialData() {
      if (user) {
        setPersonalityLoading(true);
        // Fetch selected personality_id from profiles
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("selected_personality_id")
          .eq("user_id", user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          console.error("Error fetching selected personality ID:", profileError);
        }

        const selectedId = profileData?.selected_personality_id;
        let finalPrompt = DEFAULT_SNARKY_PROMPT;

        if (selectedId) {
          const { data: personalityData, error: personalityError } = await supabase
            .from("personalities")
            .select("system_message")
            .eq("id", selectedId)
            .single();
          
          if (personalityError) {
            console.error("Error fetching personality system message:", personalityError);
          } else if (personalityData?.system_message) {
            finalPrompt = personalityData.system_message;
          }
        }
        setActiveSystemPrompt(finalPrompt.replace("{{displayName}}", user.user_metadata?.name || "there"));
        setPersonalityLoading(false);

        // Load message history
        // Load snarky history
        const { data: snarkyData } = await supabase
          .from("messages")
          .select("role, content")
          .eq("user_id", user.id)
          .in("role", ["user", "rotbot"]) // Make sure these roles match what you save
          .order("created_at", { ascending: true });
        if (snarkyData && snarkyData.length > 0) {
          setMessages(snarkyData.map((m: { role: string; content: string }) => ({ from: m.role === "user" ? "user" : "rotbot", text: m.content } as ChatMessage)));
        } else {
          setMessages([initialSnarkyChatMsg]);
        }
        // Load safe space history
        const { data: safeData } = await supabase
          .from("messages")
          .select("role, content")
          .eq("user_id", user.id)
          .eq("role", "safe") // Make sure this role matches what you save
          .order("created_at", { ascending: true });
        if (safeData && safeData.length > 0) {
          setSafeMessages(safeData.map((m: { role: string; content: string }) => ({ from: m.role as "safe", text: m.content } as ChatMessage)));
        } else {
          setSafeMessages([initialSafeChatMsg]);
        }
      } else {
        // No user, reset prompts and messages
        setActiveSystemPrompt(DEFAULT_SNARKY_PROMPT.replace("{{displayName}}", "there"));
        setMessages([initialSnarkyChatMsg]);
        setSafeMessages([initialSafeChatMsg]);
        setPersonalityLoading(false);
      }
    }
    loadInitialData();
  }, [user, authLoading, router]); // Dependency array updated

  useEffect(() => {
    if (safeSpace) {
      if (!safeMessages || safeMessages.length === 0) setSafeMessages([initialSafeChatMsg]);
    } else {
      if (!messages || messages.length === 0) setMessages([initialSnarkyChatMsg]);
    }
    lastMode.current = safeSpace ? 'safe' : 'snarky';
  }, [safeSpace, initialSafeChatMsg, initialSnarkyChatMsg]); // Added initial messages to dependencies

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, safeMessages]);
  
  // Update displayName in activeSystemPrompt when user metadata changes
  useEffect(() => {
    setActiveSystemPrompt(prevPrompt => prevPrompt.replace(/{{displayName}}/g, user?.user_metadata?.name || "there"));
  }, [user?.user_metadata?.name]);


  if (authLoading || !user || personalityLoading) { // Combined loading states
    return <div className="text-center mt-20">Loading Chat with RotBot...</div>;
  }

  const safeModePrompt = `You are RotBot, a compassionate, clinically trained therapist. You provide a safe, non-judgmental space for the user. You use evidence-based therapeutic techniques (CBT, attachment theory, trauma-informed care, etc.) to help the user understand and heal. You never insult, mock, or attack. You validate, reflect, and gently challenge. You are warm, supportive, and always prioritize the user's emotional safety.\n\nThe user's display name is: ${displayName}. Refer to them by this name if you address them directly.`;

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || !user) return;
    const userMessage: ChatMessage = { from: safeSpace ? "safe" : "user", text: input };
    
    let currentSystemPrompt = safeSpace ? safeModePrompt : activeSystemPrompt;

    if (safeSpace) {
      setSafeMessages((msgs) => [...msgs, userMessage]);
    } else {
      setMessages((msgs) => [...msgs, userMessage]);
    }
    const currentInput = input;
    setInput("");

    await supabase.from("messages").insert([
      {
        user_id: user.id,
        role: safeSpace ? "safe" : "user", // Ensure 'safe' is used for user messages in safe mode if needed by history logic
        content: currentInput,
      },
    ]);

    try {
      const apiMessages = [
        { role: "system", content: currentSystemPrompt },
        // Include previous messages from the correct context
        ...(safeSpace ? safeMessages : messages)
          .filter(m => m.from === (safeSpace ? "safe" : "user") || m.from === (safeSpace ? "safe" : "rotbot")) // include bot messages for context
          .map(m => ({ 
            role: (m.from === "user" || m.from === "safe") ? "user" : "assistant", // map 'rotbot'/'safe' (as bot) to 'assistant'
            content: m.text 
          })),
        { role: "user", content: currentInput }
      ];
      
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
      });
      const data = await res.json();
      if (data.content) {
        const botMessage: ChatMessage = { from: safeSpace ? "safe" : "rotbot", text: data.content };
        if (safeSpace) {
          setSafeMessages((msgs) => [...msgs, botMessage]);
        } else {
          setMessages((msgs) => [...msgs, botMessage]);
        }
        await supabase.from("messages").insert([
          {
            user_id: user.id,
            role: safeSpace ? "safe" : "rotbot", // 'safe' for bot response in safe mode, 'rotbot' otherwise
            content: data.content,
          },
        ]);
        if (!safeSpace) {
          const updatedMessages = [...messages, userMessage, botMessage]; // Use messages before this send
          const rotbotCount = updatedMessages.filter(m => m.from === "rotbot").length;
          if (rotbotCount % 10 === 0 && !diaryRef.current) {
            diaryRef.current = true;
            const lastTen = updatedMessages.filter(m => m.from === "rotbot").slice(-10);
            const summaryPrompt = `You are RotBot. Write a short, personal diary entry (max 4 sentences, no headers, no lists) summarizing the last 10 things you said to the user. This is your private log, not for the user's eyes. Be snarky, irreverent, and therapy-based, but do NOT address the user directly or use their name (${displayName}). Just jot down your own thoughts about the session, like a tired therapist venting in their journal.` + "\nMessages:" + lastTen.map(m => m.text).join("\n");
            const diaryRes = await fetch("/api/chat", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ messages: [{ role: "system", content: summaryPrompt }] }),
            });
            const diaryData = await diaryRes.json();
            if (diaryData.content) {
              await supabase.from("diary").insert([{ user_id: user.id, content: diaryData.content }]);
            }
          } else if (rotbotCount % 10 !== 0) {
            diaryRef.current = false;
          }
        }
      } else {
        const errorMsg = { from: safeSpace ? "safe" : "rotbot" as ("safe" | "rotbot"), text: "Sorry, something went wrong with the LLM." };
        if (safeSpace) setSafeMessages((msgs) => [...msgs, errorMsg]);
        else setMessages((msgs) => [...msgs, errorMsg]);
      }
    } catch(err) {
      console.error("Error calling chat API:", err);
      const errorMsg = { from: safeSpace ? "safe" : "rotbot" as ("safe" | "rotbot"), text: "Sorry, connection error with the LLM." };
      if (safeSpace) setSafeMessages((msgs) => [...msgs, errorMsg]);
      else setMessages((msgs) => [...msgs, errorMsg]);
    }
  }

  async function handleDeleteHistory() {
    if (!user) return;
    const roleToDelete = safeSpace ? "safe" : ["user", "rotbot"];
    const resetInitialMessage = safeSpace ? initialSafeChatMsg : initialSnarkyChatMsg;
    const setHistory = safeSpace ? setSafeMessages : setMessages;

    if (Array.isArray(roleToDelete)) {
        await supabase.from("messages").delete().eq("user_id", user.id).in("role", roleToDelete);
    } else {
        await supabase.from("messages").delete().eq("user_id", user.id).eq("role", roleToDelete);
    }
    
    await supabase.from("messages").insert([
      { user_id: user.id, role: resetInitialMessage.from, content: resetInitialMessage.text },
    ]);
    setHistory([resetInitialMessage]);
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
            <span className="block whitespace-pre-wrap">{msg.text}</span> {/* Added whitespace-pre-wrap */}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-end mb-2 mt-4">
        <label className="flex items-center gap-2 cursor-pointer select-none text-sm">
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
