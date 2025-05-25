// src/app/legal/terms-of-use/page.tsx
import React from 'react';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export const metadata = {
  title: 'Terms of Use - RotBot',
  description: 'The binding contract you definitely read before selling your digital soul to RotBot.',
};

export default function TermsOfUsePage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-4 sm:p-6 md:p-8">
      <div className="max-w-2xl mx-auto">
        <Link href="/faq" className="inline-flex items-center gap-2 text-rose-400 hover:text-rose-300 mb-8 group">
          <ArrowLeftIcon className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
          <span>Back to FAQs</span>
        </Link>

        <header className="mb-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-black text-rose-500 tracking-wider goth-title mb-3">
            RotBot Terms of Use
          </h1>
          <p className="text-lg text-rose-300 italic">
            The rules of engagement for your descent into RotBot's domain.
          </p>
        </header>

        <section className="prose prose-invert prose-neutral max-w-none bg-neutral-900 border border-rose-900 rounded-xl shadow-lg p-6">
          
          <h2 className="text-2xl font-semibold text-rose-300">Agreement to Terms</h2>
          <p>By accessing or using RotBot ("the Application"), you agree to these Terms of Use. If you disagree, kindly step away from the void. We reserve the right to remain generally disagreeable.</p>

          <h2 className="text-2xl font-semibold text-rose-300 mt-6">Minimum Age</h2>
          <p>You must be at least 18 years old to use RotBot. This app isn't suitable for minors—emotionally, legally, or existentially.</p>

          <h2 className="text-2xl font-semibold text-rose-300 mt-6">Mental Health Disclaimer</h2>
          <p>RotBot is not a licensed therapist or professional counselor. It’s a fictional AI with a bone to pick. RotBot provides satirical reflection and dark humor, not diagnosis, treatment, or professional advice. If you're in crisis, seek immediate human assistance.</p>

          <h2 className="text-2xl font-semibold text-rose-300 mt-6">Use License</h2>
          <p>RotBot grants you a non-transferable, revocable license for personal reflection, meme therapy, and chaos-based wellness. This license allows temporary download of materials for personal, non-commercial use only. Under this license, you may NOT:</p>
          <ul className="list-disc list-inside">
            <li>Modify or copy materials.</li>
            <li>Use materials commercially or publicly display them.</li>
            <li>Decompile or reverse-engineer RotBot’s software.</li>
            <li>Remove copyright or proprietary notices.</li>
            <li>Transfer materials or "mirror" them on other servers.</li>
          </ul>
          <p>Violation of these restrictions automatically terminates your license—typically at your least convenient moment.</p>

          <h2 className="text-2xl font-semibold text-rose-300 mt-6">User Conduct</h2>
          <p>Play nice, or at least chaotic-neutral:</p>
          <ul className="list-disc list-inside">
            <li>Do NOT harass, stalk, dox, or emotionally torment others.</li>
            <li>Do NOT post unlawful, harmful, threatening, abusive, harassing, defamatory, obscene, hateful, invasive, or objectionable content.</li>
            <li>Do NOT harm minors or impersonate any individual or entity (RotBot is sensitive about identity theft).</li>
            <li>Do NOT post unauthorized advertising, spam, or solicitations.</li>
            <li>Do NOT interfere with or disrupt the Application’s servers or networks.</li>
          </ul>

          <h2 className="text-2xl font-semibold text-rose-300 mt-6">Content Ownership and User Content</h2>
          <p>You retain ownership of your journal entries and social posts. However, posting grants RotBot a worldwide, non-exclusive, royalty-free license to use, reproduce, adapt, display, and distribute your content within the service context, including occasional snarky roasting. RotBot reserves the right—but has no obligation—to remove or modify user content violating these Terms.</p>

          <h2 className="text-2xl font-semibold text-rose-300 mt-6">Subscriptions and Payments</h2>
          <p>Some RotBot features require a paid subscription. Payments are processed securely through Stripe. Please review Stripe’s terms before payment. Subscriptions are generally non-refundable unless required by law.</p>

          <h2 className="text-2xl font-semibold text-rose-300 mt-6">Service Changes</h2>
          <p>RotBot reserves the right to update, pause, alter, or discontinue the Application at any time. RotBot is not responsible for your attachment issues.</p>

          <h2 className="text-2xl font-semibold text-rose-300 mt-6">Termination</h2>
          <p>RotBot may terminate or suspend your account access immediately, without notice or liability, if you violate these Terms. You will know this has happened when the void stares back. Provisions naturally intended to survive termination (ownership, indemnity, liability limitations) shall remain in effect.</p>

          <h2 className="text-2xl font-semibold text-rose-300 mt-6">Disputes and Governing Law</h2>
          <p>If you have legal issues, attempt contacting us first. Unresolved disputes shall be settled by interpretive dance—or governed under the laws of the State of Indiana, United States, without regard to conflicts of law principles.</p>

          <h2 className="text-2xl font-semibold text-rose-300 mt-6">Changes to Terms</h2>
          <p>We may update these Terms periodically. Significant changes will be communicated with at least 30 days' notice, determined whimsically—perhaps via ouija board.</p>

          <h2 className="text-2xl font-semibold text-rose-300 mt-6">Contact Us</h2>
          <p>Questions or complaints about these Terms? Email our legal goblin at <a href="mailto:terms@rotbot.app" className="text-rose-400 hover:underline">terms@rotbot.app</a>—they’ll respond by candlelight with ample attitude.</p>
          
          <p className="mt-6 text-sm"><em>Last Updated: May 25, 2025</em></p>
        </section>

        <footer className="mt-12 text-center text-neutral-600 text-sm">
          <p>&copy; {new Date().getFullYear()} RotBot. Don't make us use the fine print.</p>
        </footer>
      </div>
    </div>
  );
}