"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  HomeIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  UserCircleIcon,
} from "@heroicons/react/24/solid";
import { useSupabaseAuth } from "../../hooks/SupabaseAuthProvider";
import { supabase } from "../../lib/supabaseClient";
import {
  UserPlusIcon,
  HandRaisedIcon,
  CameraIcon,
} from "@heroicons/react/24/outline";

const sections = [
  { name: "Newsfeed", icon: HomeIcon },
  { name: "Friends", icon: UserGroupIcon },
  { name: "Messages", icon: ChatBubbleLeftRightIcon },
  { name: "Profile", icon: UserCircleIcon },
];

// Define a type for posts
interface Post {
  id: number;
  content: string;
  created_at: string;
}

function CreatePost({
  onPost,
}: {
  onPost: (content: string, imageUrl?: string) => void;
}) {
  const [content, setContent] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setImage(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    let imageUrl = undefined;
    if (image) {
      // Upload image to Supabase Storage (placeholder logic)
      const fileExt = image.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const { data, error } = await supabase
        .storage
        .from('afterlife-photos')
        .upload(fileName, image);
      if (!error && data) {
        const { publicUrl } = supabase
          .storage
          .from('afterlife-photos')
          .getPublicUrl(data.path).data;
        imageUrl = publicUrl;
      }
    }
    onPost(content, imageUrl);
    setContent("");
    setImage(null);
    setPreview(null);
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-neutral-900 border border-rose-900 rounded-xl p-4 flex flex-col gap-4 shadow-lg"
    >
      <textarea
        className="bg-neutral-950 border border-rose-800 rounded p-2 text-gray-100 focus:outline-none focus:border-rose-400 resize-none min-h-[60px]"
        placeholder="What's on your mind?"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        maxLength={500}
        required={!image}
      />
      {preview && (
        <div className="relative w-32 h-32 mb-2">
          <img
            src={preview}
            alt="Preview"
            className="object-cover w-full h-full rounded-lg border border-rose-800"
          />
          <button
            type="button"
            className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1"
            onClick={() => {
              setImage(null);
              setPreview(null);
              if (fileInputRef.current) fileInputRef.current.value = "";
            }}
          >
            ✕
          </button>
        </div>
      )}
      <div className="flex items-center gap-4">
        <button
          type="button"
          className="flex items-center gap-2 text-rose-400 hover:text-rose-200 font-semibold"
          onClick={() => fileInputRef.current?.click()}
        >
          <CameraIcon className="w-5 h-5" /> Add Photo
        </button>
        <input
          type="file"
          accept="image/*"
          className="hidden"
          ref={fileInputRef}
          onChange={handleImageChange}
        />
        <button
          type="submit"
          className="ml-auto bg-rose-800 hover:bg-rose-900 text-white font-bold py-2 px-6 rounded goth-btn transition-all disabled:opacity-60"
          disabled={uploading || (!content && !image)}
        >
          {uploading ? "Posting..." : "Post"}
        </button>
      </div>
    </form>
  );
}

function ProfileSection({ userId }: { userId?: string } = {}) {
  const { user } = useSupabaseAuth();
  const [profile, setProfile] = useState({
    display_name: "",
    bio: "",
    avatar_url: "",
  });
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const isOwner = !userId || userId === user?.id;

  useEffect(() => {
    const id = userId || user?.id;
    if (!id) return;
    setLoading(true);
    Promise.all([
      supabase
        .from("profiles")
        .select("display_name, bio, avatar_url")
        .eq("user_id", id)
        .single(),
      supabase
        .from("posts")
        .select("id, content, created_at")
        .eq("user_id", id)
        .order("created_at", { ascending: false }),
    ]).then(([profileRes, postsRes]) => {
      if (profileRes.error && profileRes.error.code !== "PGRST116")
        setError(profileRes.error.message);
      if (profileRes.data) setProfile(profileRes.data);
      if (postsRes.data) setPosts(postsRes.data as Post[]);
      setLoading(false);
    });
  }, [user, userId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setProfile((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setError("");
    setSuccess(false);
    const { error } = await supabase.from("profiles").upsert({
      user_id: user.id,
      ...profile,
    });
    if (error) setError(error.message);
    else setSuccess(true);
    setSaving(false);
  };

  // Placeholder actions
  const handleAddFriend = () => alert("Friend request sent!");
  const handleSendMessage = () => alert("Message dialog coming soon!");
  const handleJab = () => alert("You jabbed this user!");

  const handleCreatePost = async (content: string, imageUrl?: string) => {
    if (!user) return;
    const { error, data } = await supabase.from("posts").insert({
      user_id: user.id,
      content: content + (imageUrl ? `\n![image](${imageUrl})` : ""),
    }).select();
    if (!error && data && data.length > 0) {
      setPosts([
        { id: data[0].id, content: data[0].content, created_at: data[0].created_at },
        ...posts,
      ]);
    }
  };

  if (loading) return <div className="text-gray-400">Loading profile...</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {/* Left: Profile info & actions */}
      <div className="col-span-1 flex flex-col gap-6">
        {/* Profile header */}
        <div className="flex items-center gap-6">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt="avatar"
              className="w-24 h-24 rounded-full border-4 border-rose-800 object-cover"
            />
          ) : (
            <UserCircleIcon className="w-24 h-24 text-rose-900" />
          )}
          <div>
            <div className="text-3xl font-black text-rose-400">
              {profile.display_name || "Unnamed"}
            </div>
            {/* User ID below display name, styled for subtle copy UX */}
            {isOwner && user && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs bg-neutral-900 border border-rose-900 rounded px-2 py-0.5 text-gray-400 select-all font-mono tracking-tight" title="Your unique user ID">{user.id}</span>
                <button
                  type="button"
                  className="text-xs text-rose-400 hover:text-rose-200 underline underline-offset-2 ml-1"
                  onClick={() => {navigator.clipboard.writeText(user.id)}}
                  title="Copy user ID to clipboard"
                >
                  Copy
                </button>
              </div>
            )}
            <div className="text-gray-400 italic">
              {profile.bio || "No bio yet."}
            </div>
          </div>
        </div>
        {/* Actions for public profile */}
        {!isOwner && (
          <div className="flex gap-4 mt-2">
            <button
              onClick={handleAddFriend}
              className="flex items-center gap-2 bg-rose-900 hover:bg-rose-800 text-white px-4 py-2 rounded goth-btn"
            >
              <UserPlusIcon className="w-5 h-5" /> Add Friend
            </button>
            <button
              onClick={handleSendMessage}
              className="flex items-center gap-2 bg-purple-900 hover:bg-purple-800 text-white px-4 py-2 rounded goth-btn"
            >
              <ChatBubbleLeftRightIcon className="w-5 h-5" /> Message
            </button>
            <button
              onClick={handleJab}
              className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-rose-400 px-4 py-2 rounded goth-btn"
            >
              <HandRaisedIcon className="w-5 h-5" /> Jab
            </button>
          </div>
        )}
        {/* Edit form for owner */}
        {isOwner && (
          <form onSubmit={handleSave} className="flex flex-col gap-6">
            <label className="flex flex-col gap-1">
              <span className="font-semibold text-rose-400">Display Name</span>
              <input
                type="text"
                name="display_name"
                value={profile.display_name}
                onChange={handleChange}
                className="bg-neutral-900 border border-rose-800 rounded px-3 py-2 text-gray-100 focus:outline-none focus:border-rose-400 goth-input"
                maxLength={32}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-semibold text-rose-400">Bio</span>
              <textarea
                name="bio"
                value={profile.bio}
                onChange={handleChange}
                className="bg-neutral-900 border border-rose-800 rounded px-3 py-2 text-gray-100 focus:outline-none focus:border-rose-400 goth-input"
                rows={3}
                maxLength={200}
              />
            </label>
            {/* Avatar upload can be added later */}
            <button
              type="submit"
              className="bg-rose-800 hover:bg-rose-900 text-white font-bold py-2 px-6 rounded goth-btn transition-all disabled:opacity-60"
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Profile"}
            </button>
            {error && (
              <div className="text-rose-400 font-semibold">{error}</div>
            )}
            {success && (
              <div className="text-green-400 font-semibold">
                Profile updated!
              </div>
            )}
          </form>
        )}
        {/* Feature buttons */}
        <div className="flex flex-col gap-3 mt-4">
          <button className="bg-rose-900 hover:bg-rose-800 text-white px-4 py-2 rounded goth-btn">
            Add Friend
          </button>
          <button className="bg-purple-900 hover:bg-purple-800 text-white px-4 py-2 rounded goth-btn">
            Message
          </button>
          <button className="bg-gray-800 hover:bg-gray-700 text-rose-400 px-4 py-2 rounded goth-btn">
            Jab
          </button>
          <button className="bg-neutral-800 hover:bg-neutral-700 text-gray-200 px-4 py-2 rounded goth-btn">
            Customize Profile
          </button>
        </div>
        {/* Photo album (placeholder) */}
        <div>
          <h3 className="text-lg font-bold text-rose-300 mb-2 flex items-center gap-2">
            <CameraIcon className="w-5 h-5" /> Photo Album
          </h3>
          <div className="flex flex-wrap gap-4">
            <div className="w-20 h-20 bg-neutral-900 border-2 border-rose-900 rounded flex items-center justify-center text-gray-700 goth-album">
              No photos yet
            </div>
          </div>
        </div>
      </div>
      {/* Right: Timeline & Create Post */}
      <div className="col-span-2 flex flex-col gap-6">
        <CreatePost onPost={handleCreatePost} />
        <div>
          <h3 className="text-xl font-bold text-rose-300 mb-2 flex items-center gap-2">
            <span>Timeline</span>
          </h3>
          <ul className="flex flex-col gap-4">
            {posts.length === 0 && (
              <li className="text-gray-500 italic">No posts yet.</li>
            )}
            {posts.map((post: any) => (
              <li
                key={post.id}
                className="bg-neutral-900 border border-rose-900 rounded p-4 shadow goth-timeline"
              >
                <div className="text-gray-300 whitespace-pre-line">
                  {post.content}
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  {new Date(post.created_at).toLocaleString()}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

// --- Newsfeed section update ---
function NewsfeedSection({ user }: { user: any }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [profiles, setProfiles] = useState<Record<string, { display_name: string; avatar_url: string }>>({});
  const [reactions, setReactions] = useState<Record<number, any[]>>({});
  const [commenting, setCommenting] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);

  // Fetch posts and user profiles
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const { data: postsData } = await supabase
        .from("posts")
        .select("id, content, created_at, user_id")
        .order("created_at", { ascending: false });
      setPosts(postsData || []);
      // Fetch all unique user profiles for posts
      const userIds = [...new Set((postsData || []).map((p: any) => p.user_id))];
      if (userIds.length) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("user_id, display_name, avatar_url")
          .in("user_id", userIds);
        const profileMap: Record<string, { display_name: string; avatar_url: string }> = {};
        (profileData || []).forEach((p: any) => {
          profileMap[p.user_id] = { display_name: p.display_name, avatar_url: p.avatar_url };
        });
        setProfiles(profileMap);
      }
      // Fetch reactions for all posts
      const { data: reactionsData } = await supabase
        .from("post_reactions")
        .select("post_id, user_id, type");
      const reactionsMap: Record<number, any[]> = {};
      (reactionsData || []).forEach((r: any) => {
        if (!reactionsMap[r.post_id]) reactionsMap[r.post_id] = [];
        reactionsMap[r.post_id].push(r);
      });
      setReactions(reactionsMap);
      setLoading(false);
    }
    fetchData();
  }, []);

  // Reaction types (snarky)
  const reactionTypes = [
    { type: "rot", label: "Rot", emoji: "💀" },
    { type: "possess", label: "Possess", emoji: "👻" },
    { type: "mourn", label: "Mourn", emoji: "🕯️" },
    { type: "cringe", label: "Cringe", emoji: "😬" },
  ];

  // Add reaction
  const handleReact = async (postId: number, type: string) => {
    if (!user) return;
    await supabase.from("post_reactions").upsert({ post_id: postId, user_id: user.id, type });
    // Optimistically update UI
    setReactions((prev) => {
      const arr = prev[postId] ? [...prev[postId]] : [];
      const existing = arr.find((r) => r.user_id === user.id);
      if (existing) existing.type = type;
      else arr.push({ post_id: postId, user_id: user.id, type });
      return { ...prev, [postId]: arr };
    });
  };

  // Add comment (placeholder, not persisted yet)
  const handleComment = (postId: number) => {
    setCommenting((c) => ({ ...c, [postId]: "" }));
    // TODO: Persist comment to Supabase
  };

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-8">
      <CreatePost onPost={async () => {}} />
      <div>
        <h3 className="text-xl font-bold text-rose-300 mb-2 flex items-center gap-2"><span>Newsfeed</span></h3>
        {loading ? (
          <div className="text-gray-400">Loading...</div>
        ) : (
          <ul className="flex flex-col gap-4">
            {posts.length === 0 && <li className="text-gray-500 italic">No posts yet.</li>}
            {posts.map((post: any) => {
              const profile = profiles[post.user_id] || {};
              return (
                <li key={post.id} className="bg-neutral-900 border border-rose-900 rounded p-4 shadow goth-timeline">
                  <div className="flex items-center gap-3 mb-2">
                    {profile.avatar_url ? (
                      <img src={profile.avatar_url} alt="avatar" className="w-8 h-8 rounded-full border border-rose-800 object-cover" />
                    ) : (
                      <UserCircleIcon className="w-8 h-8 text-rose-900" />
                    )}
                    <span className="font-bold text-rose-300">{profile.display_name || post.user_id}</span>
                    <span className="ml-auto text-xs text-gray-500">{new Date(post.created_at).toLocaleString()}</span>
                  </div>
                  <div className="text-gray-300 whitespace-pre-line mb-2">{post.content}</div>
                  {/* Reactions */}
                  <div className="flex gap-2 mb-2">
                    {reactionTypes.map((r) => (
                      <button
                        key={r.type}
                        className={`px-2 py-1 rounded goth-btn text-sm flex items-center gap-1 ${
                          (reactions[post.id] || []).find((x) => x.user_id === user?.id && x.type === r.type)
                            ? "bg-rose-800 text-white" : "bg-neutral-800 text-rose-300 hover:bg-rose-950"
                        }`}
                        onClick={() => handleReact(post.id, r.type)}
                      >
                        <span>{r.emoji}</span> {r.label}
                        <span className="ml-1 text-xs">{(reactions[post.id] || []).filter((x) => x.type === r.type).length}</span>
                      </button>
                    ))}
                  </div>
                  {/* Comments (placeholder) */}
                  <div className="mt-2">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleComment(post.id);
                      }}
                      className="flex gap-2"
                    >
                      <input
                        type="text"
                        placeholder="Add a snarky comment..."
                        value={commenting[post.id] || ""}
                        onChange={(e) => setCommenting((c) => ({ ...c, [post.id]: e.target.value }))}
                        className="flex-1 bg-neutral-950 border border-rose-800 rounded p-2 text-gray-100 focus:outline-none focus:border-rose-400 goth-input"
                      />
                      <button
                        type="submit"
                        className="bg-rose-800 hover:bg-rose-900 text-white font-bold py-2 px-4 rounded goth-btn"
                      >
                        Comment
                      </button>
                    </form>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

// --- FriendsSection ---
function FriendsSection({ user }: { user: any }) {
  const [friends, setFriends] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    // Fetch accepted friends with profile info (join on both user_id and friend_id)
    supabase
      .from('friends')
      .select(`id, user_id, friend_id, status, user_profile:user_id(display_name, avatar_url), friend_profile:friend_id(display_name, avatar_url)`)
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
      .eq('status', 'accepted')
      .then(({ data, error }) => {
        if (error) setError(error.message);
        if (data) setFriends(data);
      });
    // Fetch pending requests with profile info
    supabase
      .from('friends')
      .select(`id, user_id, friend_id, status, user_profile:user_id(display_name, avatar_url), friend_profile:friend_id(display_name, avatar_url)`)
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
      .eq('status', 'pending')
      .then(({ data, error }) => {
        if (error) setError(error.message);
        if (data) setRequests(data);
        setLoading(false);
      });
  }, [user]);

  // Accept/decline friend request handlers
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
      <div>
        <h3 className="text-xl font-bold text-rose-300 mb-2">Pending Requests</h3>
        <ul className="flex flex-col gap-4">
          {requests.length === 0 && <li className="text-gray-500 italic">No pending requests.</li>}
          {requests.map((req) => {
            // Show the other user's profile info
            const isSender = req.user_id === user.id;
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
            // Show the other user's profile info
            const isSelfUser = friend.user_id === user.id;
            const profile = isSelfUser ? friend.friend_profile : friend.user_profile;
            return (
              <li key={friend.id} className="bg-neutral-900 border border-rose-900 rounded p-4 flex items-center gap-4">
                <span className="flex-1 text-gray-200">{profile?.display_name || (isSelfUser ? friend.friend_id : friend.user_id)}</span>
                <button className="bg-purple-800 hover:bg-purple-900 text-white px-3 py-1 rounded">View Profile</button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

// --- FindUserSection ---
function FindUserSection({ onSelect }: { onSelect: (userId: string) => void }) {
  const [userId, setUserId] = useState("");
  const [profile, setProfile] = useState<any>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
        <div className="flex items-center gap-4 mt-2 p-2 bg-neutral-950 rounded">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="avatar" className="w-12 h-12 rounded-full border-2 border-rose-800 object-cover" />
          ) : (
            <UserCircleIcon className="w-12 h-12 text-rose-900" />
          )}
          <div className="flex-1">
            <div className="font-bold text-rose-300">{profile.display_name || "Unnamed"}</div>
            <div className="text-xs text-gray-400">{profile.user_id}</div>
            <div className="text-gray-400 italic">{profile.bio || "No bio yet."}</div>
          </div>
          <button
            className="bg-purple-800 hover:bg-purple-900 text-white px-3 py-1 rounded"
            onClick={() => onSelect(profile.user_id)}
          >
            View Profile
          </button>
        </div>
      )}
    </div>
  );
}

// --- MessagesSection ---
function MessagesSection({ user }: { user: any }) {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);

  // Fetch all unique conversation partners
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    supabase
      .from("afterlife_messages")
      .select("id, sender_id, receiver_id, content, created_at")
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) return;
        // Get unique conversation partners
        const partners = new Set<string>();
        (data || []).forEach((msg: any) => {
          const partnerId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
          partners.add(partnerId);
        });
        setConversations(Array.from(partners));
        setLoading(false);
      });
  }, [user]);

  // Fetch messages for selected conversation
  useEffect(() => {
    if (!user || !selectedUser) return;
    setLoading(true);
    supabase
      .from("afterlife_messages")
      .select("id, sender_id, receiver_id, content, created_at")
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .or(`sender_id.eq.${selectedUser},receiver_id.eq.${selectedUser}`)
      .order("created_at", { ascending: true })
      .then(({ data, error }) => {
        if (!error && data) setMessages(data.filter((msg: any) =>
          (msg.sender_id === user.id && msg.receiver_id === selectedUser) ||
          (msg.sender_id === selectedUser && msg.receiver_id === user.id)
        ));
        setLoading(false);
      });
  }, [user, selectedUser]);

  // Send a message
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedUser || !newMessage.trim()) return;
    const { error, data } = await supabase.from("afterlife_messages").insert({
      sender_id: user.id,
      receiver_id: selectedUser,
      content: newMessage.trim(),
    }).select();
    if (!error && data && data.length > 0) {
      setMessages((msgs) => [...msgs, data[0]]);
      setNewMessage("");
    }
  };

  return (
    <div className="max-w-3xl mx-auto flex gap-8">
      {/* Conversation list */}
      <aside className="w-64 bg-neutral-900 border border-rose-900 rounded-xl p-4 flex flex-col gap-2 shadow-lg">
        <h3 className="text-lg font-bold text-rose-300 mb-2">Conversations</h3>
        {loading ? <div className="text-gray-400">Loading...</div> : null}
        {conversations.length === 0 && !loading && <div className="text-gray-500 italic">No conversations yet.</div>}
        <ul className="flex flex-col gap-2">
          {conversations.map((partnerId) => (
            <li key={partnerId}>
              <button
                className={`w-full text-left px-3 py-2 rounded goth-btn ${selectedUser === partnerId ? "bg-rose-800 text-white" : "bg-neutral-800 text-rose-300 hover:bg-rose-950"}`}
                onClick={() => setSelectedUser(partnerId)}
              >
                {partnerId}
              </button>
            </li>
          ))}
        </ul>
      </aside>
      {/* Message thread */}
      <section className="flex-1 flex flex-col bg-neutral-900 border border-rose-900 rounded-xl p-4 shadow-lg">
        {selectedUser ? (
          <>
            <div className="font-bold text-rose-300 mb-2">Chat with {selectedUser}</div>
            <div className="flex-1 overflow-y-auto mb-4 flex flex-col gap-2">
              {messages.map((msg: any) => (
                <div key={msg.id} className={`max-w-[70%] px-3 py-2 rounded-lg ${msg.sender_id === user.id ? "bg-rose-800 text-white self-end" : "bg-neutral-800 text-rose-200 self-start"}`}>
                  <div className="text-sm">{msg.content}</div>
                  <div className="text-xs text-gray-400 mt-1">{new Date(msg.created_at).toLocaleString()}</div>
                </div>
              ))}
            </div>
            <form onSubmit={handleSend} className="flex gap-2 mt-auto">
              <input
                type="text"
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-1 bg-neutral-950 border border-rose-800 rounded p-2 text-gray-100 focus:outline-none focus:border-rose-400 goth-input"
              />
              <button
                type="submit"
                className="bg-rose-800 hover:bg-rose-900 text-white font-bold py-2 px-4 rounded goth-btn"
                disabled={!newMessage.trim()}
              >
                Send
              </button>
            </form>
          </>
        ) : (
          <div className="text-gray-400 flex-1 flex items-center justify-center">Select a conversation to start messaging.</div>
        )}
      </section>
    </div>
  );
}

export default function AfterlifeFM() {
  const [activeSection, setActiveSection] = useState("Newsfeed");
  const { user } = useSupabaseAuth();
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-black via-neutral-900 to-gray-900 text-gray-100 font-mono">
      {/* Sidebar */}
      <aside className="w-64 bg-gradient-to-b from-neutral-950 to-neutral-900 border-r border-rose-900 shadow-2xl flex flex-col p-6">
        <h1 className="text-3xl font-black tracking-widest mb-10 text-rose-600 drop-shadow-lg goth-title select-none">
          afterlife.fm
        </h1>
        <nav className="flex flex-col gap-4">
          {sections.map(({ name, icon: Icon }) => (
            <button
              key={name}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all goth-nav text-lg font-semibold tracking-wide border border-transparent hover:border-rose-700 hover:bg-rose-950/40 hover:text-rose-400 ${
                activeSection === name
                  ? "bg-rose-950/60 border-rose-700 text-rose-400 shadow-inner"
                  : "text-gray-300"
              }`}
              onClick={() => setActiveSection(name)}
            >
              <Icon className="h-6 w-6" />
              {name}
            </button>
          ))}
        </nav>
        <div className="mt-auto pt-10 text-xs text-gray-600 opacity-60 goth-footer">
          <span>Embrace the void.</span>
        </div>
      </aside>
      {/* Main Content */}
      <main className="flex-1 p-10 relative overflow-y-auto">
        {/* Subtle gothic background pattern */}
        <div className="pointer-events-none absolute inset-0 opacity-10 bg-[url('/window.svg')] bg-center bg-no-repeat bg-contain" />
        <section className="relative z-10">
          {activeSection === "Newsfeed" && <NewsfeedSection user={user} />}
          {activeSection === "Friends" && (
            <div>
              <h2 className="text-2xl font-bold mb-6 text-rose-400 goth-section">
                Friends
              </h2>
              <FindUserSection onSelect={(userId) => alert(`Navigate to profile for user: ${userId}`)} />
              <FriendsSection user={user} />
            </div>
          )}
          {activeSection === "Messages" && (
            <div>
              <h2 className="text-2xl font-bold mb-6 text-rose-400 goth-section">
                Messages
              </h2>
              <MessagesSection user={user} />
            </div>
          )}
          {activeSection === "Profile" && (
            <div>
              <h2 className="text-2xl font-bold mb-6 text-rose-400 goth-section">
                Profile
              </h2>
              <ProfileSection />
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

// Custom gothic/emo font and style classes can be added in your Tailwind config or globals.css for .goth-title, .goth-nav, etc.
