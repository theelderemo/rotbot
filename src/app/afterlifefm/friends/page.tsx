"use client";

import React, { useState, useEffect } from "react";
import { useSupabaseAuth } from "../../../hooks/SupabaseAuthProvider";
import { supabase } from "../../../lib/supabaseClient";
import { useRouter } from "next/navigation";

function FindUserSection({}: {}) {
  const [userId, setUserId] = useState("");
  const [profile, setProfile] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setProfile(null);
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("display_name, bio, avatar_url, user_id")
      .eq("user_id", userId)
      .single();
    if (error || !data) setError("No user found with that ID.");
    else setProfile(data);
    setLoading(false);
  };

  return (
    <div className="bg-neutral-900 border border-rose-900 rounded-xl p-4 flex flex-col gap-4 shadow-lg mb-8">
      <h3 className="text-lg font-bold text-rose-300 mb-2">Find User by ID</h3>
      <form onSubmit={handleSearch} className="flex gap-2 items-center">
        <input
          type="text"
          placeholder="Enter User ID..."
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          className="flex-1 bg-neutral-950 border border-rose-800 rounded p-2 text-gray-100 focus:outline-none focus:border-rose-400 goth-input"
          required
        />
        <button
          type="submit"
          className="bg-rose-800 hover:bg-rose-900 text-white font-bold py-2 px-4 rounded goth-btn"
          disabled={loading || !userId}
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </form>
      {error && <div className="text-rose-400 font-semibold">{error}</div>}
      {profile && (
        <div className="flex items-center gap-4 mt-4">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="avatar" className="w-12 h-12 rounded-full border border-rose-800 object-cover" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-rose-900 flex items-center justify-center text-white font-bold">?</div>
          )}
          <div>
            <div className="font-bold text-rose-300">{profile.display_name || profile.user_id}</div>
            <div className="text-xs text-gray-400">{profile.bio}</div>
            <button
              className="mt-2 bg-rose-800 hover:bg-rose-900 text-white px-3 py-1 rounded goth-btn"
              onClick={() => router.push(`/afterlifefm/profile/${profile.user_id}`)}
            >
              View Profile
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function FriendsSection() {
  const { user } = useSupabaseAuth();
  const [friends, setFriends] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    supabase
      .from('friends')
      .select(`id, user_id, friend_id, status, user_profile:user_id(display_name, avatar_url), friend_profile:friend_id(display_name, avatar_url)`)
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
      .eq('status', 'accepted')
      .then(({ data, error }) => {
        if (error) setError(error.message);
        if (data) setFriends(data);
      });
    supabase
      .from('friends')
      .select(`id, user_id, friend_id, status, user_profile:user_id(display_name, avatar_url), friend_profile:friend_id(display_name, avatar_url)`)
      .eq('friend_id', user.id)
      .eq('status', 'pending')
      .then(({ data, error }) => {
        if (error) setError(error.message);
        if (data) setRequests(data);
        setLoading(false);
      });
  }, [user]);

  const handleAccept = async (id: number) => {
    await supabase.from('friends').update({ status: 'accepted' }).eq('id', id);
    setRequests((reqs) => reqs.filter((r) => r.id !== id));
    setFriends((f) => [...f, requests.find((r) => r.id === id)]);
  };
  const handleDecline = async (id: number) => {
    await supabase.from('friends').delete().eq('id', id);
    setRequests((reqs) => reqs.filter((r) => r.id !== id));
  };

  if (loading) return <div className="text-gray-400">Loading friends...</div>;

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-8">
      <FindUserSection />
      <div>
        <h3 className="text-xl font-bold text-rose-300 mb-2">Pending Requests</h3>
        <ul className="flex flex-col gap-4">
          {requests.length === 0 && <li className="text-gray-500 italic">No pending requests.</li>}
          {requests.map((req) => {
            const isSender = user ? req.user_id === user.id : false;
            const profile = isSender ? req.friend_profile : req.user_profile;
            return (
              <li key={req.id} className="bg-neutral-900 border border-rose-900 rounded p-4 flex items-center gap-4">
                <span className="flex-1 text-gray-200">{profile?.display_name || (isSender ? req.friend_id : req.user_id)}</span>
                <button onClick={() => handleAccept(req.id)} className="bg-green-800 hover:bg-green-900 text-white px-3 py-1 rounded">Accept</button>
                <button onClick={() => handleDecline(req.id)} className="bg-rose-800 hover:bg-rose-900 text-white px-3 py-1 rounded">Decline</button>
              </li>
            );
          })}
        </ul>
      </div>
      <div>
        <h3 className="text-xl font-bold text-rose-300 mb-2">Your Friends</h3>
        <ul className="flex flex-col gap-4">
          {friends.length === 0 && <li className="text-gray-500 italic">No friends yet.</li>}
          {friends.map((friend) => {
            const isSelfUser = user ? friend.user_id === user.id : false;
            const profile = isSelfUser ? friend.friend_profile : friend.user_profile;
            const profileId = isSelfUser ? friend.friend_id : friend.user_id;
            return (
              <li key={friend.id} className="bg-neutral-900 border border-rose-900 rounded p-4 flex items-center gap-4">
                <span className="flex-1 text-gray-200">{profile?.display_name || profileId}</span>
                <button className="bg-purple-800 hover:bg-purple-900 text-white px-3 py-1 rounded" onClick={() => router.push(`/afterlifefm/profile/${profileId}`)}>View Profile</button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

export default FriendsSection;
