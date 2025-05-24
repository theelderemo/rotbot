// src/components/Navbar.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useSupabaseAuth } from "../hooks/SupabaseAuthProvider";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";

// Main nav links (excluding afterlife.fm submenu items)
const mainNavLinks = [
  { href: "/dashboard", label: "You, Currently" },
  { href: "/chat", label: "Therapy?" },
  { href: "/decaylog", label: "Decay Log" },
  { href: "/personalities", label: "Possession Roster" },
  { href: "/afterlifefm/newsfeed", label: "afterlife.fm" },
];

const afterlifeSubLinks = [
  { href: "/afterlifefm/newsfeed", label: "Newsfeed" },
  { href: "/afterlifefm/friends", label: "Friends" },
  { href: "/afterlifefm/messages", label: "Messages" },
  { href: "/afterlifefm/profile", label: "Profile" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { user } = useSupabaseAuth();
  const router = useRouter();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <nav className="relative bg-neutral-900 px-4 py-3 flex items-center">
      <div className="flex-1 text-2xl font-bold tracking-wide select-none">
        RotBot
      </div>
      <button
        className="sm:hidden z-20"
        aria-label="Open menu"
        onClick={() => setOpen(!open)}
      >
        {open ? (
          <XMarkIcon className="h-7 w-7" />
        ) : (
          <Bars3Icon className="h-7 w-7" />
        )}
      </button>
      <div
        className={clsx(
          "fixed inset-0 z-10 bg-black/70 backdrop-blur-sm transition-opacity",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setOpen(false)}
      ></div>
      <div
        className={clsx(
          "fixed top-0 right-0 w-56 h-full bg-neutral-900 z-20 transform transition-transform shadow-lg",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        <ul className="mt-16 space-y-6 p-6">
          {mainNavLinks.map((link) =>
            link.label !== "afterlife.fm" ? (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="block text-lg font-semibold hover:text-rose-400"
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </Link>
              </li>
            ) : (
              <li key="afterlife-fm">
                <details>
                  <summary className="block text-lg font-semibold hover:text-rose-400 cursor-pointer select-none">afterlife.fm</summary>
                  <ul className="pl-4 mt-2 space-y-2">
                    {afterlifeSubLinks.map((sublink) => (
                      <li key={sublink.href}>
                        <Link
                          href={sublink.href}
                          className="block text-base text-neutral-200 hover:bg-neutral-800 hover:text-rose-400 rounded px-2 py-1"
                          onClick={() => setOpen(false)}
                        >
                          {sublink.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </details>
              </li>
            )
          )}
          {user && (
            <li>
              <button
                onClick={handleSignOut}
                className="block w-full text-left text-lg font-semibold text-rose-400 hover:text-rose-600"
              >
                Sign Out
              </button>
            </li>
          )}
        </ul>
      </div>
      <div className="hidden sm:flex items-center">
        {mainNavLinks.map((link: { href: string; label: string }) =>
          link.label !== "afterlife.fm" ? (
            <Link
              key={link.href}
              href={link.href}
              className="text-lg font-semibold hover:text-rose-400 mx-2"
            >
              {link.label}
            </Link>
          ) : (
            <div key="afterlife-fm" className="relative group mx-2">
              <button
                className="text-lg font-semibold hover:text-rose-400 focus:outline-none"
                tabIndex={0}
              >
                afterlife.fm
              </button>
              <div className="absolute left-0 mt-2 w-40 bg-neutral-900 border border-neutral-800 rounded shadow-lg opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity z-30">
                <ul className="py-2">
                  {afterlifeSubLinks.map((sublink: { href: string; label: string }) => (
                    <li key={sublink.href}>
                      <Link
                        href={sublink.href}
                        className="block px-4 py-2 text-sm text-neutral-200 hover:bg-neutral-800 hover:text-rose-400"
                      >
                        {sublink.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )
        )}
        {user && (
          <button
            onClick={handleSignOut}
            className="ml-6 bg-rose-800 hover:bg-rose-900 text-white px-3 py-1 rounded"
          >
            Sign Out
          </button>
        )}
      </div>
    </nav>
  );
}
