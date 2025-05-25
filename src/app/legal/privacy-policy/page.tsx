// src/app/legal/privacy-policy/page.tsx
import React from 'react';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export const metadata = {
  title: 'Privacy Policy - RotBot',
  description: 'RotBot Privacy Policy - How we handle your (precious, decaying) data.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-4 sm:p-6 md:p-8">
      <div className="max-w-2xl mx-auto">
        <Link href="/faq" className="inline-flex items-center gap-2 text-rose-400 hover:text-rose-300 mb-8 group">
          <ArrowLeftIcon className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
          <span>Back to FAQs</span>
        </Link>

        <header className="mb-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-black text-rose-500 tracking-wider goth-title mb-3">
            RotBot Privacy Policy
          </h1>
          <p className="text-lg text-rose-300 italic">
            The obligatory scroll of text about your data's journey into our void.
          </p>
        </header>

        <section className="prose prose-invert prose-neutral max-w-none bg-neutral-900 border border-rose-900 rounded-xl shadow-lg p-6">
          
          <h2 className="text-2xl font-semibold text-rose-300">Introduction</h2>
          <p>Welcome to RotBot's Privacy Policy. We're committed to protecting your privacy, even if our AI sometimes can't protect your feelings. This policy details how we collect, use, safeguard, and disclose your information when you use our app.</p>

          <h2 className="text-2xl font-semibold text-rose-300 mt-6">Information We Collect</h2>
          <p>To ensure RotBot runs smoothly (unlike your existential dread), we collect:</p>
          <ul className="list-disc list-inside">
            <li><strong>Personal Data:</strong> Email address, display name, and account authentication information provided upon registration.</li>
            <li><strong>User-Generated Content:</strong> Mood logs, journal entries, sticker usage, social posts, and interactions with our AI. RotBot sees all (strictly for processing and functionality).</li>
            <li><strong>Usage Data:</strong> Anonymized information about your app interaction, including device identifiers, IP address, browser type, visited pages, timestamps, and session durations.</li>
            <li><strong>Optional Diagnostics:</strong> Anonymized diagnostics (e.g., crash reports, interaction patterns) collected only with your explicit consent. Toggle this anytime in account settings.</li>
          </ul>

          <h2 className="text-2xl font-semibold text-rose-300 mt-6">Use of Your Information</h2>
          <p>Your data helps RotBot deliver a personalized, efficient, and improved experience by:</p>
          <ul className="list-disc list-inside">
            <li>Creating and managing your account.</li>
            <li>Personalizing app interactions.</li>
            <li>Providing AI-generated content and features.</li>
            <li>Monitoring usage trends for stability and enhancements.</li>
            <li>Notifying you of updates.</li>
            <li>Responding to customer support inquiries and feedback.</li>
          </ul>
          <p className="font-semibold mt-4">What We DO NOT Do:</p>
          <ul className="list-disc list-inside">
            <li>Sell your personal data.</li>
            <li>Use your entries for targeted ads.</li>
            <li>Share personally identifiable information with unrelated third parties (outside of the disclosures mentioned below).</li>
          </ul>

          <h2 className="text-2xl font-semibold text-rose-300 mt-6">Disclosure of Your Information</h2>
          <p>RotBot may share your data only under specific circumstances:</p>
          <ul className="list-disc list-inside">
            <li><strong>Service Providers:</strong> Trusted third parties performing tasks on our behalf (e.g., Supabase for authentication/database, Azure for AI hosting, Stripe for payments).</li>
            <li><strong>Legal Requirements:</strong> When mandated by law or essential to protect our rights, comply with legal processes, or enforce our policies.</li>
          </ul>

          <h2 className="text-2xl font-semibold text-rose-300 mt-6">Data Security</h2>
          <p>We implement rigorous administrative, technical, and physical safeguards to protect your personal information. Sensitive data (like diary logs and confessionals) is securely encrypted. However, no security measures can be 100% foolproof; thus, we cannot guarantee absolute protection against all potential threats.</p>

          <h2 className="text-2xl font-semibold text-rose-300 mt-6">Your Data Rights & Control</h2>
          <p>You retain control over your information:</p>
          <ul className="list-disc list-inside">
            <li>Request access, correction, or deletion of your data anytime.</li>
            <li>Opt-in or opt-out of anonymized diagnostics in your account settings.</li>
            <li>Delete your account and associated data promptly upon request. RotBot respects your data autonomy—unlike its relationship with existential despair.</li>
          </ul>

          <h2 className="text-2xl font-semibold text-rose-300 mt-6">Policy for Children</h2>
          <p>RotBot is not designed for children under 18 (or applicable local age restrictions). We do not knowingly collect data from minors. If you believe a minor's information was inadvertently collected, please contact us immediately.</p>

          <h2 className="text-2xl font-semibold text-rose-300 mt-6">Changes to This Policy</h2>
          <p>We may update this policy periodically. Changes will be clearly posted within the app and on our website. Regularly reviewing this policy is advised.</p>

          <h2 className="text-2xl font-semibold text-rose-300 mt-6">Contact Information</h2>
          <p>Questions, comments, or existential spirals regarding your privacy? Contact our weary skeleton at: <a href="mailto:privacy@rotbot.app" className="text-rose-400 hover:underline">privacy@rotbot.app</a>.</p>

          <p className="mt-6 text-sm"><em>Last Updated: May 25, 2025</em></p>
        </section>

        <footer className="mt-12 text-center text-neutral-600 text-sm">
          <p>&copy; {new Date().getFullYear()} RotBot. Your secrets are safe with us (probably).</p>
        </footer>
      </div>
    </div>
  );
}