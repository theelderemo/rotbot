"use client";

import React, { useState, useEffect } from "react";
import { UserCircleIcon } from "@heroicons/react/24/outline";
import { useSupabaseAuth } from "../../../hooks/SupabaseAuthProvider";
import { supabase } from "../../../lib/supabaseClient";
import { useRouter } from "next/navigation";

// Define a type for posts
interface Post {
  id: number;
  content: string;
  created_at: string;
  user_id?: string;
}

function CreatePost({ onPost }: { onPost: (content: string, imageUrl?: string) => void }) {
  const { user } = useSupabaseAuth();
  const [content, setContent] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (image) {
      const objectUrl = URL.createObjectURL(image);
      setImagePreview(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    }
    setImagePreview(null);
  }, [image]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !image) return;
    let imageUrl = "";
    if (image) {
      const formData = new FormData();
      formData.append("file", image);
      const { data, error } = await supabase.storage.from("images").upload(`public/${image.name}`, image);
      if (error) {
        console.error("Error uploading image:", error);
        return;
      }
      imageUrl = data?.path || "";
    }
    await onPost(content.trim(), imageUrl);
    setContent("");
    setImage(null);
  };

  if (!user) return null;

  return (
    <form onSubmit={handleSubmit} className="bg-neutral-900 p-4 rounded-lg shadow-md flex flex-col gap-4">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="bg-neutral-800 border border-rose-800 rounded p-2 text-gray-100 focus:outline-none focus:border-rose-400 goth-input"
        placeholder="What's on your mind?"
        rows={3}
      />
      {imagePreview && (
        <div className="relative w-full h-40 rounded-lg overflow-hidden">
          <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => setImage(null)}
            className="absolute top-2 right-2 bg-rose-800 hover:bg-rose-900 text-white rounded-full p-1"
          >
            &times;
          </button>
        </div>
      )}
      <div className="flex gap-2">
        <label className="flex-1">
          <span className="sr-only">Upload Image</span>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0] || null;
              setImage(file);
            }}
            className="hidden"
          />
          <button className="w-full bg-rose-800 hover:bg-rose-900 text-white font-bold py-2 px-4 rounded goth-btn">
            Upload Image
          </button>
        </label>
        <button
          type="submit"
          className="bg-rose-800 hover:bg-rose-900 text-white font-bold py-2 px-4 rounded goth-btn"
        >
          Post
        </button>
      </div>
    </form>
  );
}

const reactionTypes = [
  { type: "rot", label: "Rot", emoji: "💀" },
  { type: "possess", label: "Possess", emoji: "👻" },
  { type: "mourn", label: "Mourn", emoji: "🕯️" },
  { type: "cringe", label: "Cringe", emoji: "😬" },
];

function NewsfeedSection() {
  const { user, loading: authLoading } = useSupabaseAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [profiles, setProfiles] = useState<Record<string, { display_name: string; avatar_url: string }>>({});
  const [reactions, setReactions] = useState<Record<number, any[]>>({});
  const [commenting, setCommenting] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const { data: postsData } = await supabase
        .from("posts")
        .select("id, content, created_at, user_id")
        .order("created_at", { ascending: false });
      setPosts(postsData || []);
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

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [user, authLoading, router]);

  const handleReact = async (postId: number, type: string) => {
    if (!user) return;
    await supabase.from("post_reactions").upsert({ post_id: postId, user_id: user.id, type });
    setReactions((prev) => {
      const arr = prev[postId] ? [...prev[postId]] : [];
      const existing = arr.find((r) => r.user_id === user.id);
      if (existing) existing.type = type;
      else arr.push({ post_id: postId, user_id: user.id, type });
      return { ...prev, [postId]: arr };
    });
  };

  const handleComment = (postId: number) => {
    setCommenting((c) => ({ ...c, [postId]: "" }));
    // TODO: Persist comment to Supabase
  };

  if (authLoading || !user) {
    return <div className="text-center mt-20">Loading...</div>;
  }

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

export default NewsfeedSection;
