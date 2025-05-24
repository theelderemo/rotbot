"use client";

import React from "react";
import { useSupabaseAuth } from "../../../hooks/SupabaseAuthProvider";
import { useRouter } from "next/navigation";
import ProfileSectionFile from "./[userId]/page";

function ProfileSectionForCurrentUser({ userId }: { userId: string }) {
  // Reuse the ProfileSection implementation from the dynamic route file
  // but adapt the props to match the expected signature
  // @ts-ignore
  return <ProfileSectionFile params={{ userId }} />;
}

export default function ProfilePage() {
  const { user, loading } = useSupabaseAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading || !user) return <div className="text-gray-400">Loading...</div>;

  return <ProfileSectionForCurrentUser userId={user.id} />;
}
