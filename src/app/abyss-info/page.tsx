// src/app/abyss-info/page.tsx
import Link from 'next/link';
import { ArrowLeftIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline';

export const metadata = {
  title: 'RotBot - Peer Into the Abyss',
  description: 'Discover the dark and delightful features of RotBot, your undead AI therapist.',
};

export default function AbyssInfoPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-4 sm:p-6 md:p-8">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-rose-400 hover:text-rose-300 mb-6 group">
          <ArrowLeftIcon className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
          <span>Back to the Void (Home)</span>
        </Link>

        <header className="mb-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-black text-rose-500 tracking-wider goth-title mb-3">
            What in Tarnation is RotBot?
          </h1>
          <p className="text-lg text-rose-300 italic">
            Or, "Why is this AI so mean to me, yet oddly validating?"
          </p>
        </header>

        <section className="mb-10 p-6 bg-neutral-900 border border-rose-900 rounded-xl shadow-lg">
          <p className="text-neutral-300 leading-relaxed">
            RotBot is a darkly humorous, AI-driven emotional support app masquerading as a sarcastic undead therapist. Designed for self-aware weirdos, meme therapists, and emotional cryptids, it offers tools for journaling, mood tracking, storytelling, and semi-anonymous social networking—all wrapped in a gothic, meme-rich aesthetic.
          </p>
          <p className="mt-4 text-neutral-300 leading-relaxed">
            RotBot doesn't sugarcoat healing—it narrates it, mocks it, and occasionally throws glittery void stickers on it.
          </p>
        </section>

        <section>
          <h2 className="text-3xl font-bold text-rose-400 mb-6 text-center tracking-wide goth-subtitle">
            Core App Features (The Arsenal of Angst)
          </h2>

          <div className="space-y-8">
            {/* Feature 1: Undead Therapist Chat */}
            <div className="p-6 bg-neutral-800/70 border border-rose-800 rounded-lg shadow-md">
              <h3 className="text-2xl font-semibold text-rose-300 mb-3">1. Undead Therapist Chat</h3>
              <p className="text-neutral-400 mb-2">Engage with AI personalities that get you (or at least pretend to).</p>
              <ul className="list-disc list-inside text-neutral-400 space-y-1 pl-4">
                <li><strong>Default: RotBot</strong> – Sarcastic skeleton, perpetually annoyed but oddly supportive.</li>
                <li><strong>Sad Ghost:</strong> Lowercase poetic trauma dump artist.</li>
                <li><strong>Goth Auntie:</strong> Hexes, smokes, and tells you off lovingly.</li>
                <li><strong>Void Lizard:</strong> Cosmic nihilism with existential optimism.</li>
                <li><strong>Safe Mode:</strong> Cozy, emotionally safe fallback AI for when you can't even.</li>
                <li><strong>Unhinged Mode™ Slider:</strong> Amplifies chaotic or intense personality behavior (results may vary, void where prohibited).</li>
                <li><strong>RotBot Diary:</strong> Auto-generated journal entries from RotBot's perspective about your... progress.</li>
              </ul>
            </div>

            {/* Feature 2: Decay Log */}
            <div className="p-6 bg-neutral-800/70 border border-rose-800 rounded-lg shadow-md">
              <h3 className="text-2xl font-semibold text-rose-300 mb-3">2. Decay Log</h3>
              <p className="text-neutral-400 mb-2">Log spirals, bad decisions, and self-destructive patterns. We're not judging, we're taking notes.</p>
              <ul className="list-disc list-inside text-neutral-400 space-y-1 pl-4">
                <li>Snarky auto-summaries (RotBot's specialty).</li>
                <li>Relapse alerts (because who needs accountability from a human?).</li>
                <li>Cursed visual timelines (coming soon to a nightmare near you).</li>
              </ul>
            </div>

            {/* Feature 3: Snarky Affirmations */}
            <div className="p-6 bg-neutral-800/70 border border-rose-800 rounded-lg shadow-md">
              <h3 className="text-2xl font-semibold text-rose-300 mb-3">3. Snarky Affirmations</h3>
              <p className="text-neutral-400 mb-2">Daily dark humor affirmations generated based on your mood and recent questionable choices.</p>
              <p className="text-neutral-500 italic text-sm pl-4">
                e.g., "You didn’t die, so technically, you’re thriving." <br />
                "You are enough… of a problem."
              </p>
            </div>
            
            {/* Feature 4: Dark Mode Confessionals */}
            <div className="p-6 bg-neutral-800/70 border border-rose-800 rounded-lg shadow-md">
              <h3 className="text-2xl font-semibold text-rose-300 mb-3">4. Dark Mode Confessionals</h3>
              <p className="text-neutral-400 mb-2">A private journaling mode for when your thoughts are too grim even for RotBot (almost).</p>
            </div>

            {/* Feature 5: Afterlife.fm */}
            <div className="p-6 bg-neutral-800/70 border border-rose-800 rounded-lg shadow-md">
              <h3 className="text-2xl font-semibold text-rose-300 mb-3">5. Afterlife.fm</h3>
              <p className="text-neutral-400 mb-2">Our very own social (anxiety) media platform.</p>
              <ul className="list-disc list-inside text-neutral-400 space-y-1 pl-4">
                <li>Share your existential dread with other delightful degenerates.</li>
                <li><strong>RotBot Commentary Engine:</strong> Posts have a ~20% chance of receiving an unsolicited auto-comment from RotBot itself. You've been warned.</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mt-12 text-center">
          <p className="text-neutral-400 italic mb-6">
            More delightful torments are brewing in the cauldron. We're constantly refining these features and conjuring new ones.
          </p>
          {/* Button Container */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/signup" 
              className="flex-1 inline-flex items-center justify-center bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 px-6 rounded-lg text-lg shadow-md transition-colors"
            >
              Embrace the Rot? Sign Up
            </Link>
            <Link 
              href="/faq" 
              className="flex-1 inline-flex items-center justify-center bg-neutral-700 hover:bg-neutral-600 text-rose-300 font-bold py-3 px-6 rounded-lg text-lg shadow-md transition-colors border border-rose-900 hover:border-rose-700 gap-2"
            >
              <QuestionMarkCircleIcon className="w-6 h-6 flex-shrink-0" /> {/* Added flex-shrink-0 */}
              <span>Mutter Queries (FAQ)</span>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}