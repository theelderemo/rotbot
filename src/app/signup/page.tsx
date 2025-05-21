// src/app/signup/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import { useSupabaseAuth } from "../../hooks/SupabaseAuthProvider";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user } = useSupabaseAuth();

  if (user) {
    router.replace("/dashboard");
    return null;
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    });
    setLoading(false);
    if (error) setError(error.message);
    else router.push("/dashboard");
  }

  return (
    <div className="max-w-md mx-auto mt-20 p-8 bg-neutral-800 rounded-xl shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-center">Sign Up for RotBot</h1>
      <form className="space-y-6" onSubmit={handleSignup}>
        <input
          type="email"
          placeholder="Email"
          className="w-full p-3 rounded bg-neutral-700 text-white"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full p-3 rounded bg-neutral-700 text-white"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Display Name"
          className="w-full p-3 rounded bg-neutral-700 text-white"
          value={name}
          onChange={e => setName(e.target.value)}
          required
        />
        {error && <div className="text-red-400">{error}</div>}
        <button type="submit" className="w-full bg-rose-600 hover:bg-rose-700 text-white p-3 rounded font-bold" disabled={loading}>
          {loading ? "Signing up..." : "Sign Up"}
        </button>
        <div className="text-center mt-4">
          <a href="/login" className="text-rose-400 hover:underline">Already have an account? Login</a>
        </div>
      </form>
    </div>
  );
}
