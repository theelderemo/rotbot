// src/app/legal/liability-disclaimer/page.tsx
import React from 'react';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export const metadata = {
  title: 'Liability & Disclaimer - RotBot',
  description: 'RotBot\'s attempt to absolve itself from the chaos it might cause.',
};

export default function LiabilityDisclaimerPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-4 sm:p-6 md:p-8">
      <div className="max-w-2xl mx-auto">
        <Link href="/faq" className="inline-flex items-center gap-2 text-rose-400 hover:text-rose-300 mb-8 group">
          <ArrowLeftIcon className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
          <span>Back to FAQs</span>
        </Link>

        <header className="mb-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-black text-rose-500 tracking-wider goth-title mb-3">
            RotBot Disclaimer & Release of Liability
          </h1>
          <p className="text-lg text-rose-300 italic">
            Where we artfully dodge responsibility. Read it and weep (or don't, we're not liable for your tears either).
          </p>
        </header>

        <section className="prose prose-invert prose-neutral max-w-none bg-neutral-900 border border-rose-900 rounded-xl shadow-lg p-6">
          
          <h2 className="text-2xl font-semibold text-rose-300">Entertainment and Satirical Nature</h2>
          <p>RotBot is an AI application strictly for entertainment, personal journaling, mood tracking, and social interaction. The characters, responses, affirmations, diary entries, and emotional insights provided within RotBot are fictional, satirical, and intentionally designed to be darkly humorous, sarcastic, ironic, and occasionally absurd. They are meant to provoke thought and amusement, not to serve as factual statements or real-life guidance. User discretion is advised, particularly if you're easily offended or prone to existential crises triggered by digital snark.</p>

          <h2 className="text-2xl font-semibold text-rose-300 mt-6">Not Professional Advice</h2>
          <p>RotBot's AI-generated content does not constitute professional medical, psychological, financial, legal, or other professional advice. RotBot is NOT a substitute for therapy, crisis intervention, professional mental health care, or consultation with qualified professionals. You must not rely on information or AI interactions from RotBot to make decisions. Always seek advice from qualified professionals regarding your specific concerns.</p>

          <h2 className="text-2xl font-semibold text-rose-300 mt-6">Accuracy and User-Generated Content</h2>
          <p>While we aim to provide an engaging experience, RotBot does not guarantee the accuracy, completeness, reliability, suitability, or availability of its information or graphics. Any reliance you place on such content is strictly at your own risk. RotBot may include user-generated content (such as on Afterlife.fm), for which users bear full responsibility. We do not endorse, verify, or take responsibility for user-generated content.</p>

          <h2 className="text-2xl font-semibold text-rose-300 mt-6">External Links</h2>
          <p>RotBot may contain external website links not affiliated with or maintained by RotBot. We do not guarantee the accuracy, timeliness, or completeness of external website content.</p>

          <h2 className="text-2xl font-semibold text-rose-300 mt-6">Assumption of Risk</h2>
          <p>Your interaction with RotBot is entirely at your own risk. RotBot is not responsible for any user's or AI personality's conduct or for side effects like sarcasm overload, questioning life choices, existential spirals, or an increased affinity for the color black. By using RotBot, you agree that you understand:</p>
          <ul className="list-disc list-inside">
            <li>RotBot is a sarcastic safe space that is honest but not gentle.</li>
            <li>No AI can replace genuine human connection.</li>
            <li>All content, including snark, symbolism, and satire, is for entertainment, not intervention.</li>
          </ul>

          <h2 className="text-2xl font-semibold text-rose-300 mt-6">Limitation and Release of Liability</h2>
          <p>RotBot, its creators, developers, affiliates, licensors, and associates will not be liable for any loss, damage, emotional distress, offense, existential spirals, or journaling side effects arising from your use or inability to use RotBot. This includes indirect, consequential, or direct damages such as loss of data, profits, or emotional wellbeing due to errors, omissions, interruptions, viruses, unauthorized access, or other causes related to app usage.</p>
          <p>The app is provided "AS IS" and "AS AVAILABLE," without warranties of any kind, expressed or implied, including merchantability, fitness for a particular purpose, non-infringement, or course of performance.</p>
          <p>By creating an account and using RotBot, you explicitly release, waive, and hold harmless the creators, developers, affiliates, and any associated individuals from all claims, damages, losses, liabilities, costs, or expenses connected to your app use.</p>
          <p>If any part of this disclaimer is deemed unenforceable under applicable law, the remaining terms continue to stand as resolutely as RotBot's sarcastic wit and brittle bones.</p>

          <h2 className="text-2xl font-semibold text-rose-300 mt-6">Mental Health and Crisis Notice</h2>
          <p><strong>If you experience thoughts of self-harm, suicidal ideation, or mental health crises, immediately seek professional help from a qualified mental health provider or crisis hotline.</strong></p>
          
          <p className="mt-8 text-sm"><em>Welcome to the void—snark included.</em></p>
          <p className="mt-2 text-sm"><em>Last Updated: May 25, 2025</em></p>
        </section>

        <footer className="mt-12 text-center text-neutral-600 text-sm">
          <p>&copy; {new Date().getFullYear()} RotBot. We told you so (in legalese).</p>
        </footer>
      </div>
    </div>
  );
}