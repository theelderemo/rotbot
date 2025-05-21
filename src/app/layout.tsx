// src/app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import { SupabaseAuthProvider } from "../hooks/SupabaseAuthProvider";
import Navbar from "../components/Navbar";

export const metadata: Metadata = {
  title: "RotBot: Dark Humor Therapy",
  description: "Gothic AI for emotional health",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-neutral-950 text-neutral-100">
        <SupabaseAuthProvider>
          <Navbar />
          {children}
        </SupabaseAuthProvider>
      </body>
    </html>
  );
}
