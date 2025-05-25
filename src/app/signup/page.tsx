// src/app/signup/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link"; // Import Link for legal pages
import { supabase } from "../../lib/supabaseClient";
import { useSupabaseAuth } from "../../hooks/SupabaseAuthProvider";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // State for consent checkboxes
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
  const [agreedToLiability, setAgreedToLiability] = useState(false);

  const router = useRouter();
  const { user } = useSupabaseAuth();

  if (user) {
    router.replace("/dashboard");
    return null;
  }

  const canSubmit = agreedToTerms && agreedToPrivacy && agreedToLiability;

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) {
      setError("Please agree to all terms and policies before signing up. The void demands your consent.");
      return;
    }
    setLoading(true);
    setError(null);
    const { error: signUpError } = await supabase.auth.signUp({ // Renamed error to signUpError
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    });
    setLoading(false);
    if (signUpError) setError(signUpError.message);
    else router.push("/dashboard"); // Or to a "please check your email" page if email confirmation is enabled
  }

  return (
    <div className="max-w-md mx-auto mt-12 mb-12 p-8 bg-neutral-800 rounded-xl shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-center text-rose-400">Pledge Your (Digital) Soul to RotBot</h1>
      <p className="text-neutral-400 text-sm mb-6 text-center">
        Before you dive into the delightful dysfunction, a few formalities...
      </p>
      <form className="space-y-6" onSubmit={handleSignup}>
        <input
          type="email"
          placeholder="Email Address (for lamentations)"
          className="w-full p-3 rounded bg-neutral-700 text-white placeholder-neutral-500 border border-neutral-600 focus:border-rose-500 focus:ring-rose-500"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password (stronger than your will to live)"
          className="w-full p-3 rounded bg-neutral-700 text-white placeholder-neutral-500 border border-neutral-600 focus:border-rose-500 focus:ring-rose-500"
          value={password}
          onChange={e => setPassword(e.target.value)}
          minLength={6} // Enforce a minimum password length
          required
        />
        <input
          type="text"
          placeholder="Display Name (your chosen moniker of misery)"
          className="w-full p-3 rounded bg-neutral-700 text-white placeholder-neutral-500 border border-neutral-600 focus:border-rose-500 focus:ring-rose-500"
          value={name}
          onChange={e => setName(e.target.value)}
          required
        />

        {/* Consent Checkboxes */}
        <div className="space-y-4 pt-2">
          <label className="flex items-start gap-3 cursor-pointer text-sm text-neutral-300">
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={() => setAgreedToTerms(!agreedToTerms)}
              className="mt-1 h-5 w-5 rounded bg-neutral-700 border-neutral-600 text-rose-600 focus:ring-rose-500 accent-rose-600"
            />
            <span>
              I have stared into the abyss of the <Link href="/legal/terms-of-use" target="_blank" rel="noopener noreferrer" className="text-rose-400 hover:underline">Terms of Use</Link> and willingly nod in grim understanding.
            </span>
          </label>
          <label className="flex items-start gap-3 cursor-pointer text-sm text-neutral-300">
            <input
              type="checkbox"
              checked={agreedToPrivacy}
              onChange={() => setAgreedToPrivacy(!agreedToPrivacy)}
              className="mt-1 h-5 w-5 rounded bg-neutral-700 border-neutral-600 text-rose-600 focus:ring-rose-500 accent-rose-600"
            />
            <span>
              I acknowledge the <Link href="/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-rose-400 hover:underline">Privacy Policy</Link> and accept that my data might be used to fuel RotBot's snark engine.
            </span>
          </label>
          <label className="flex items-start gap-3 cursor-pointer text-sm text-neutral-300">
            <input
              type="checkbox"
              checked={agreedToLiability}
              onChange={() => setAgreedToLiability(!agreedToLiability)}
              className="mt-1 h-5 w-5 rounded bg-neutral-700 border-neutral-600 text-rose-600 focus:ring-rose-500 accent-rose-600"
            />
            <span>
              I've perused the <Link href="/legal/liability-disclaimer" target="_blank" rel="noopener noreferrer" className="text-rose-400 hover:underline">Liability & Disclaimer</Link> and embrace the chaos at my own peril.
            </span>
          </label>
        </div>

        {error && <div className="text-red-400 text-sm p-3 bg-red-900/30 border border-red-700 rounded">{error}</div>}
        
        <button 
          type="submit" 
          className="w-full bg-rose-600 hover:bg-rose-700 text-white p-3 rounded font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-opacity" 
          disabled={!canSubmit || loading}
        >
          {loading ? "Summoning Your Account..." : "Sign Up & Descend"}
        </button>
        
        <div className="text-center mt-4">
          <Link href="/login" className="text-rose-400 hover:underline">Already a tortured soul? Login</Link>
        </div>
      </form>
    </div>
  );
}