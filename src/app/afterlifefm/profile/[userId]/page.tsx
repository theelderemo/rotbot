"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSupabaseAuth } from "../../../../hooks/SupabaseAuthProvider";
import { supabase } from "../../../../lib/supabaseClient";
import { UserCircleIcon, UserPlusIcon, HandRaisedIcon, CameraIcon, ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";

// Define a type for posts
interface Post {
  id: number;
  content: string;
  created_at: string;
}

function CreatePost({ onPost }: { onPost: (content: string, imageUrl?: string) => void }) {
  const { user } = useSupabaseAuth();
  const [content, setContent] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setImage(file);
    if (file) {
      setImageUrl(URL.createObjectURL(file));
    } else {
      setImageUrl("");
    }
  };

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setUploading(true);
    setError("");
    setSuccess(false);
    let uploadedImageUrl = "";
    // Upload image if exists
    if (image) {
      const { data, error: uploadError } = await supabase.storage
        .from("images")
        .upload(`public/${image.name}`, image, {
          cacheControl: "3600",
          upsert: false,
        });
      if (uploadError) {
        setError(uploadError.message);
        setUploading(false);
        return;
      }
      uploadedImageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/images/${data.path}`;
    }
    const { error } = await supabase.from("posts").insert({
      user_id: user.id,
      content: content + (uploadedImageUrl ? `\n![image](${uploadedImageUrl})` : ""),
    });
    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
      setContent("");
      setImage(null);
      setImageUrl("");
      onPost(content, uploadedImageUrl);
    }
    setUploading(false);
  };

  return (
    <div className="bg-neutral-900 p-4 rounded-lg shadow-md">
      <h3 className="text-lg font-bold text-rose-300 mb-2">Create a Post</h3>
      <form onSubmit={handlePost} className="flex flex-col gap-4">
        <textarea
          value={content}
          onChange={handleContentChange}
          className="bg-neutral-800 border border-rose-900 rounded px-3 py-2 text-gray-100 focus:outline-none focus:border-rose-400 goth-input"
          rows={3}
          placeholder="What's on your mind?"
          maxLength={500}
        />
        {imageUrl && (
          <div className="relative w-full h-40 rounded-lg overflow-hidden">
            <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => setImageUrl("")}
              className="absolute top-2 right-2 bg-red-600 hover:bg-red-500 text-white rounded-full p-1"
              title="Remove image"
            >
              &times;
            </button>
          </div>
        )}
        <div className="flex gap-2">
          <label className="flex-1">
            <span className="sr-only">Image upload</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
              ref={fileInputRef}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center bg-rose-900 hover:bg-rose-800 text-white rounded-lg px-4 py-2 flex-1"
            >
              <CameraIcon className="w-5 h-5 mr-2" />
              Upload Image
            </button>
          </label>
          <button
            type="submit"
            className="bg-rose-800 hover:bg-rose-900 text-white font-bold py-2 px-6 rounded goth-btn transition-all disabled:opacity-60 flex-1"
            disabled={uploading}
          >
            {uploading ? "Posting..." : "Post"}
          </button>
        </div>
        {error && <div className="text-rose-400 text-sm">{error}</div>}
        {success && <div className="text-green-400 text-sm">Post created!</div>}
      </form>
    </div>
  );
}

function ProfileSection({ userId }: { userId: string }) {
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
  const [friendStatus, setFriendStatus] = useState<string | null>(null); // 'pending', 'accepted', 'none', 'self'
  const isOwner = userId === user?.id;

  // Check friend status if viewing another user's profile
  useEffect(() => {
    if (!user || isOwner || !userId) return;
    supabase
      .from("friends")
      .select("status")
      .or(`and(user_id.eq.${user.id},friend_id.eq.${userId}),and(user_id.eq.${userId},friend_id.eq.${user.id})`)
      .then(({ data }) => {
        if (data && data.length > 0) setFriendStatus(data[0].status);
        else setFriendStatus("none");
      });
  }, [user, userId, isOwner]);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    Promise.all([
      supabase
        .from("profiles")
        .select("display_name, bio, avatar_url")
        .eq("user_id", userId)
        .single(),
      supabase
        .from("posts")
        .select("id, content, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
    ]).then(([profileRes, postsRes]) => {
      if (profileRes.error && profileRes.error.code !== "PGRST116")
        setError(profileRes.error.message);
      if (profileRes.data) setProfile(profileRes.data);
      if (postsRes.data) setPosts(postsRes.data as Post[]);
      setLoading(false);
    });
  }, [userId]);

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

  // Add friend request logic
  const handleAddFriend = async () => {
    if (!user || !userId) return;
    setError("");
    if (friendStatus === "pending" || friendStatus === "accepted") return;
    const { error } = await supabase.from("friends").insert({
      user_id: user.id,
      friend_id: userId,
      status: "pending",
    });
    if (error) setError(error.message);
    else setFriendStatus("pending");
  };

  // Placeholder actions
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
            {/* Only show Add Friend if not already friends or pending */}
            {friendStatus === "none" && (
              <button
                onClick={handleAddFriend}
                className="flex items-center gap-2 bg-rose-900 hover:bg-rose-800 text-white px-4 py-2 rounded goth-btn"
              >
                <UserPlusIcon className="w-5 h-5" /> Add Friend
              </button>
            )}
            {friendStatus === "pending" && (
              <span className="text-xs text-rose-400 px-2 py-1 bg-neutral-900 border border-rose-900 rounded">Friend Request Sent</span>
            )}
            {friendStatus === "accepted" && (
              <span className="text-xs text-green-400 px-2 py-1 bg-neutral-900 border border-green-900 rounded">You are friends</span>
            )}
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
        {!isOwner && (
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
          </div>
        )}
        {isOwner && (
          <button className="bg-neutral-800 hover:bg-neutral-700 text-gray-200 px-4 py-2 rounded goth-btn mt-4">
            Customize Profile
          </button>
        )}
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

export default function ProfilePage({ params }: { params: { userId: string } }) {
  return <ProfileSection userId={params.userId} />;
}
