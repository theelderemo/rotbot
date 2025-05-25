// src/app/page.tsx
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-950 text-neutral-100 px-4">
      <main className="flex flex-col items-center gap-10 py-20 w-full max-w-2xl">
        <Image
          src="/vercel.svg" // Consider updating this to a RotBot specific logo if you have one
          alt="RotBot logo"
          width={80}
          height={80}
          className="mb-4 dark:invert" // dark:invert might not be needed if your logo is already themed
          priority
        />
        <h1 className="text-4xl sm:text-5xl font-extrabold text-center tracking-tight mb-2">
          RotBot
        </h1>
        <h2 className="text-xl sm:text-2xl text-rose-400 font-semibold text-center mb-6">
          Dark Humor Therapy, Powered by AI
        </h2>
        <p className="text-lg text-center text-neutral-300 max-w-xl mb-8">
          Welcome to RotBot, your gothic AI companion for emotional health. Get
          roasted, get real, and maybe even feel a little better. Sign up to
          start your session or log in to continue your journey into the abyss.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
          <Link
            href="/signup" // Changed from /login to /signup for "Get Started"
            className="flex-1 bg-rose-700 hover:bg-rose-800 text-white font-bold py-3 rounded-lg text-center transition-colors"
          >
            Get Started
          </Link>
          <Link
            href="/login"
            className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-white font-bold py-3 rounded-lg text-center transition-colors"
          >
            Login
          </Link>
          <Link
            href="/abyss-info" // New button linking to the features page
            className="flex-1 bg-neutral-700 hover:bg-neutral-600 text-rose-300 font-bold py-3 rounded-lg text-center transition-colors border border-rose-900 hover:border-rose-700"
          >
            Peer Into the Abyss
          </Link>
        </div>
      </main>
      <footer className="w-full text-center py-6 text-neutral-500 text-sm border-t border-neutral-800 mt-auto">
        &copy; {new Date().getFullYear()} RotBot. All rights reserved.
      </footer>
    </div>
  );
}