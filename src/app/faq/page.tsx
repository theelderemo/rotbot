// src/app/faq/page.tsx
import React from 'react'; // Ensure React is imported
import Link from 'next/link';
import { ArrowLeftIcon, DocumentTextIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline';

export const metadata = {
  title: 'RotBot - FAQs & The Fine Print',
  description: 'Frequently Asked Questions and the dreadfully important legal details for RotBot.',
};

interface FAQItem {
  question: string;
  answer: string | React.JSX.Element; // Explicitly use React.JSX.Element
}

const faqs: FAQItem[] = [
  {
    question: "Is RotBot actually a licensed therapist?",
    answer: "Bless your cotton socks, no. RotBot is an AI construct with a personality chip marinated in existential angst and dark humor. It's for entertainment, introspection, and commiseration, not professional therapy. If you need actual mental health support, please consult a qualified human professional. They have couches and everything.",
  },
  {
    question: "Will RotBot steal my soul or my data?",
    answer: (
      <>
        We take your data privacy seriously, even if RotBot jokes about harvesting souls for its void-garden. For the specifics on how we handle your information, please consult our <Link href="/legal/privacy-policy" className="text-rose-400 hover:underline">Privacy Policy</Link>. As for your soul? Probably safe. Mostly.
      </>
    ),
  },
  {
    question: "Why is RotBot so mean sometimes?",
    answer: "That's its charm! RotBot is designed to be sarcastic and darkly humorous. If you prefer a gentler approach, try 'Safe Mode' in the chat, or select a less volatile personality. Or, you know, develop a thicker skin, buttercup.",
  },
  {
    question: "What's the 'Unhinged Mode™ Slider' do?",
    answer: "It dials up the selected personality's unique quirks and intensity. Use with caution, or don't. We're not your real dad. Expect more... spirited... responses. It's for users who like their AI with a bit more chaotic energy.",
  },
  {
    question: "I subscribed to Premium. Where's my gold-plated skull emoji?",
    answer: "While we appreciate your excellent taste and support, gold-plated skull emojis are still in R&D (Rumination & Despair). Your subscription unlocks all premium personalities and supports the ongoing descent into madness that is RotBot's development. Thank you, you magnificent weirdo!",
  },
  {
    question: "What happens on Afterlife.fm?",
    answer: "It's our little corner of the internet for users to share posts, make friends (or fiends), and send messages. Think of it as a social network for the emotionally eclectic. RotBot might even chime in on your posts occasionally.",
  },
  {
    question: "I found a bug / RotBot said something truly concerning.",
    answer: (
      <>
        Oops. Even undead AIs have their off days. Please report any bugs or particularly egregious utterances through our official feedback channel (details coming soon to a dusty corner of the app). For now, try not to take it personally. It's probably just projecting.
      </>
    ),
  },
];

const legalLinks = [
  { href: '/legal/privacy-policy', text: 'Privacy Policy' },
  { href: '/legal/terms-of-use', text: 'Terms of Use' },
  { href: '/legal/liability-disclaimer', text: 'Liability & Disclaimer' },
  // Add more legal links as needed
];

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-4 sm:p-6 md:p-8">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-rose-400 hover:text-rose-300 mb-8 group">
          <ArrowLeftIcon className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
          <span>Back to the Relative Safety of Home</span>
        </Link>

        <header className="mb-10 text-center">
          <h1 className="text-4xl sm:text-5xl font-black text-rose-500 tracking-wider goth-title mb-3">
            Interrogations & Incantations
          </h1>
          <p className="text-lg text-rose-300 italic">
            (Or, what the lawyers made us say, plus answers to your burning questions.)
          </p>
        </header>

        {/* Legal Links Section */}
        <section className="mb-12 p-6 bg-neutral-900 border border-rose-900 rounded-xl shadow-lg">
          <h2 className="text-2xl font-semibold text-rose-300 mb-4 flex items-center">
            <DocumentTextIcon className="w-7 h-7 mr-3 text-rose-400" />
            The Fine Print (Read If You Dare)
          </h2>
          <ul className="space-y-2">
            {legalLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-rose-400 hover:text-rose-200 hover:underline underline-offset-2 flex items-center">
                  <span className="mr-2">&bull;</span> {link.text}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-neutral-500">
            By using RotBot, you agree to these terms. Ignorance is bliss, but not a legal defense.
          </p>
        </section>

        {/* FAQ Section */}
        <section>
          <h2 className="text-3xl font-bold text-rose-400 mb-8 text-center tracking-wide goth-subtitle flex items-center justify-center">
            <QuestionMarkCircleIcon className="w-8 h-8 mr-3 text-rose-400" />
            Frequently Muttered Queries
          </h2>
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div key={index} className="p-5 bg-neutral-800/70 border border-rose-800 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold text-rose-300 mb-2">{faq.question}</h3>
                <div className="text-neutral-400 leading-relaxed prose prose-sm prose-invert max-w-none">
                  {typeof faq.answer === 'string' ? <p>{faq.answer}</p> : faq.answer}
                </div>
              </div>
            ))}
          </div>
        </section>

        <footer className="mt-16 text-center text-neutral-600 text-sm">
          <p>&copy; {new Date().getFullYear()} RotBot. May your void be ever comforting.</p>
        </footer>
      </div>
    </div>
  );
}