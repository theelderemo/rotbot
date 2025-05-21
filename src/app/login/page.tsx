// src/app/login/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabaseClient";
import { useSupabaseAuth } from "../../hooks/SupabaseAuthProvider";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user } = useSupabaseAuth();

  if (user) {
    router.replace("/dashboard");
    return null;
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setError(error.message);
    else router.push("/dashboard");
  }

  return (
    <div className="max-w-md mx-auto mt-20 p-8 bg-neutral-800 rounded-xl shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-center">RotBot Login</h1>
      <form className="space-y-6" onSubmit={handleLogin}>
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
        {error && <div className="text-red-400">{error}</div>}
        <div className="flex space-x-4">
          <button type="submit" className="flex-1 bg-rose-600 hover:bg-rose-700 text-white p-3 rounded font-bold" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
          <a href="/signup" className="flex-1 bg-neutral-600 hover:bg-neutral-700 text-white p-3 rounded font-bold text-center cursor-pointer select-none flex items-center justify-center">
            Sign Up
          </a>
        </div>
      </form>
    </div>
  );
}
