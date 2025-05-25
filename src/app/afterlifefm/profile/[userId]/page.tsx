// src/app/afterlifefm/profile/[userId]/page.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSupabaseAuth } from "../../../../hooks/SupabaseAuthProvider";
import { supabase } from "../../../../lib/supabaseClient";
import { UserCircleIcon, UserPlusIcon, HandRaisedIcon, CameraIcon, ChatBubbleLeftRightIcon, TrashIcon } from "@heroicons/react/24/outline"; // Added TrashIcon

interface Post {
  id: number;
  content: string;
  created_at: string;
  user_id?: string; // Added to ensure we can check ownership
  image_url?: string;
}

// CreatePost component (can be kept similar or refactored into a shared component if used in multiple places)
// For brevity, assuming a similar CreatePost component as in newsfeed,
// or you can reuse the one from newsfeed if structured appropriately.
// Let's assume a CreatePost component tailored for this page:

function CreatePostOnProfile({ onPost, userId }: { onPost: (newPost: Post) => void; userId: string }) {
  const { user } = useSupabaseAuth();
  const [content, setContent] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
    if ((!content.trim() && !image) || !user || user.id !== userId) return; // Ensure user is owner
    setIsSubmitting(true);
    let uploadedImageUrl: string | undefined = undefined;

    if (image) {
      const fileExt = image.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`; // User-specific folder
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("images") // Bucket for post images
        .upload(fileName, image);

      if (uploadError) {
        console.error("Error uploading image:", uploadError);
        setIsSubmitting(false);
        return;
      }
      const { data: publicUrlData } = supabase.storage
        .from("images")
        .getPublicUrl(uploadData.path);
      uploadedImageUrl = publicUrlData?.publicUrl;
    }

    const { data: postData, error: postError } = await supabase
      .from("posts")
      .insert({
        content: content.trim(),
        user_id: user.id,
        image_url: uploadedImageUrl,
      })
      .select()
      .single();

    if (postError) {
      console.error("Error creating post:", postError);
    } else if (postData) {
      onPost(postData as Post);
      setContent("");
      setImage(null);
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
    setIsSubmitting(false);
  };

  if (!user || user.id !== userId) return null; // Only show create post if it's the user's own profile

  return (
    <div className="bg-neutral-900 p-4 rounded-lg shadow-md">
      <h3 className="text-lg font-bold text-rose-300 mb-2">Create a Post</h3>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="bg-neutral-800 border border-rose-900 rounded px-3 py-2 text-gray-100 focus:outline-none focus:border-rose-400 goth-input"
          rows={3}
          placeholder="What's on your mind?"
          maxLength={500}
        />
        {imagePreview && (
          <div className="relative w-full h-40 rounded-lg overflow-hidden">
            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => {
                setImage(null);
                setImagePreview(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              className="absolute top-2 right-2 bg-red-600 hover:bg-red-500 text-white rounded-full p-1 text-xs"
              title="Remove image"
            >
              &times;
            </button>
          </div>
        )}
        <div className="flex gap-2">
          <label className="flex-1 cursor-pointer">
            <span className="sr-only">Image upload</span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                setImage(file);
              }}
              className="hidden"
              ref={fileInputRef}
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center bg-rose-900 hover:bg-rose-800 text-white rounded-lg px-4 py-2 flex-1 text-center"
            >
              <CameraIcon className="w-5 h-5 mr-2" />
              Upload Image
            </div>
          </label>
          <button
            type="submit"
            className="bg-rose-800 hover:bg-rose-900 text-white font-bold py-2 px-6 rounded goth-btn transition-all disabled:opacity-60 flex-1"
            disabled={isSubmitting || (!content.trim() && !image)}
          >
            {isSubmitting ? "Posting..." : "Post"}
          </button>
        </div>
      </form>
    </div>
  );
}


function ProfileSection({ userId }: { userId: string }) {
  const { user, loading: authLoading } = useSupabaseAuth(); // Renamed for clarity
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
  const [friendStatus, setFriendStatus] = useState<string | null>(null);
  const isOwner = userId === user?.id;

  const fetchProfileData = async () => {
    if (!userId) return;
    setLoading(true);
    setError("");
    try {
      const [profileRes, postsRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("display_name, bio, avatar_url")
          .eq("user_id", userId)
          .single(),
        supabase
          .from("posts")
          .select("id, content, created_at, user_id, image_url") // Ensure user_id and image_url are selected
          .eq("user_id", userId)
          .order("created_at", { ascending: false }),
      ]);

      if (profileRes.error && profileRes.error.code !== "PGRST116") {
        setError(profileRes.error.message);
      } else if (profileRes.data) {
        setProfile(profileRes.data);
      } else {
        // Handle case where profile might not exist for a userId (though unlikely if users create profiles)
        setError("Profile not found.");
      }

      if (postsRes.error) {
        setError(prevError => prevError ? `${prevError}, ${postsRes.error.message}` : postsRes.error.message);
        setPosts([]);
      } else {
        setPosts((postsRes.data as Post[]) || []);
      }
    } catch (e: any) {
      setError(e.message || "Failed to fetch profile data.");
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchProfileData();
  }, [userId]);


  useEffect(() => {
    if (!user || isOwner || !userId) {
      setFriendStatus(isOwner ? 'self' : null);
      return;
    };
    supabase
      .from("friends")
      .select("status, user_id, friend_id") // Select user_id and friend_id to determine who sent the request
      .or(`and(user_id.eq.${user.id},friend_id.eq.${userId}),and(user_id.eq.${userId},friend_id.eq.${user.id})`)
      .maybeSingle() // Use maybeSingle to handle no rows found without error
      .then(({ data, error: friendError }) => {
        if (friendError) {
          console.error("Error fetching friend status:", friendError);
          setFriendStatus("none");
        } else if (data) {
           // If status is 'pending', check who is the sender
           if (data.status === 'pending') {
            setFriendStatus(data.user_id === user.id ? 'pending_sent' : 'pending_received');
          } else {
            setFriendStatus(data.status);
          }
        } else {
          setFriendStatus("none");
        }
      });
  }, [user, userId, isOwner]);


  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setProfile((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !isOwner) return;
    setSaving(true);
    setError("");
    setSuccess(false);
    const { error: saveError } = await supabase.from("profiles").upsert({
      user_id: user.id,
      ...profile,
    }, { onConflict: 'user_id' });
    if (saveError) setError(saveError.message);
    else setSuccess(true);
    setSaving(false);
  };

  const handleAddFriend = async () => {
    if (!user || !userId || isOwner || friendStatus === "pending_sent" || friendStatus === "accepted") return;
    setError("");
    const { error: addFriendError } = await supabase.from("friends").insert({
      user_id: user.id,
      friend_id: userId,
      status: "pending",
    });
    if (addFriendError) setError(addFriendError.message);
    else setFriendStatus("pending_sent"); // Request sent by current user
  };

  const handleAcceptFriend = async () => {
    if (!user || !userId || friendStatus !== "pending_received") return;
    const { error: acceptError } = await supabase
      .from("friends")
      .update({ status: "accepted" })
      .match({ user_id: userId, friend_id: user.id, status: "pending" }); // Match the request sent TO the current user
    if (acceptError) setError(acceptError.message);
    else setFriendStatus("accepted");
  };
  
  const handleDeclineFriend = async () => {
    if (!user || !userId || friendStatus !== "pending_received") return;
     const { error: declineError } = await supabase
      .from("friends")
      .delete()
      .match({ user_id: userId, friend_id: user.id, status: "pending" });
    if (declineError) setError(declineError.message);
    else setFriendStatus("none");
  };


  const handlePostCreatedOnProfile = (newPost: Post) => {
    setPosts(prevPosts => [newPost, ...prevPosts]);
  };

  const handleDeletePost = async (postId: number) => {
    if (!user || !isOwner) return; // Only owner can delete

    setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));

    const { error: deleteError } = await supabase
      .from("posts")
      .delete()
      .eq("id", postId)
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("Error deleting post:", deleteError);
      // Revert or show error
      fetchProfileData(); // Re-fetch to be sure
      alert(`Error deleting post: ${deleteError.message}`);
    }
  };


  if (authLoading) return <div className="text-gray-400 text-center mt-10">Loading authentication...</div>;
  if (loading) return <div className="text-gray-400 text-center mt-10">Loading profile...</div>;
  if (error && !profile.display_name) return <div className="text-rose-400 text-center mt-10">Error: {error}</div>;


  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="col-span-1 flex flex-col gap-6">
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
              {profile.display_name || "Unnamed Soul"}
            </div>
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
              {profile.bio || "No epitaph written yet."}
            </div>
          </div>
        </div>

        {!isOwner && user && (
          <div className="flex flex-col gap-3 mt-2">
            {friendStatus === "none" && (
              <button
                onClick={handleAddFriend}
                className="flex items-center justify-center gap-2 bg-rose-900 hover:bg-rose-800 text-white px-4 py-2 rounded goth-btn"
              >
                <UserPlusIcon className="w-5 h-5" /> Add Friend
              </button>
            )}
            {friendStatus === "pending_sent" && (
              <span className="text-xs text-rose-400 px-2 py-1 bg-neutral-900 border border-rose-900 rounded text-center">Friend Request Sent</span>
            )}
            {friendStatus === "pending_received" && (
              <div className="flex gap-2">
                 <button onClick={handleAcceptFriend} className="flex-1 bg-green-700 hover:bg-green-600 text-white px-4 py-2 rounded goth-btn">Accept</button>
                 <button onClick={handleDeclineFriend} className="flex-1 bg-red-700 hover:bg-red-600 text-white px-4 py-2 rounded goth-btn">Decline</button>
              </div>
            )}
            {friendStatus === "accepted" && (
              <span className="text-xs text-green-400 px-2 py-1 bg-neutral-900 border border-green-900 rounded text-center">You are friends</span>
            )}
             {/* Placeholder actions - keep if you have plans for them */}
            <button
              onClick={() => alert("Message dialog coming soon!")}
              className="flex items-center justify-center gap-2 bg-purple-900 hover:bg-purple-800 text-white px-4 py-2 rounded goth-btn"
            >
              <ChatBubbleLeftRightIcon className="w-5 h-5" /> Message
            </button>
            <button
              onClick={() => alert("You jabbed this user!")}
              className="flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-rose-400 px-4 py-2 rounded goth-btn"
            >
              <HandRaisedIcon className="w-5 h-5" /> Jab
            </button>
          </div>
        )}

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
            <button
              type="submit"
              className="bg-rose-800 hover:bg-rose-900 text-white font-bold py-2 px-6 rounded goth-btn transition-all disabled:opacity-60"
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Profile"}
            </button>
            {error && !success && ( // Only show general errors if not a success message
              <div className="text-rose-400 font-semibold">{error}</div>
            )}
            {success && (
              <div className="text-green-400 font-semibold">
                Profile updated!
              </div>
            )}
          </form>
        )}
         {isOwner && (
          <button className="bg-neutral-800 hover:bg-neutral-700 text-gray-200 px-4 py-2 rounded goth-btn mt-4 w-full">
            Customize Profile
          </button>
        )}
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

      <div className="col-span-2 flex flex-col gap-6">
        {isOwner && <CreatePostOnProfile onPost={handlePostCreatedOnProfile} userId={userId}/>}
        <div>
          <h3 className="text-xl font-bold text-rose-300 mb-2 flex items-center gap-2">
            <span>Timeline</span>
          </h3>
          {posts.length === 0 && (
            <p className="text-gray-500 italic">No posts from this soul... yet.</p>
          )}
          <ul className="flex flex-col gap-4">
            {posts.map((post) => (
              <li
                key={post.id}
                className="bg-neutral-900 border border-rose-900 rounded p-4 shadow goth-timeline"
              >
                {post.image_url && (
                    <div className="my-2 rounded-lg overflow-hidden border border-rose-900">
                      <img src={post.image_url} alt="Post image" className="w-full h-auto object-contain max-h-96" />
                    </div>
                  )}
                <div className="text-gray-300 whitespace-pre-line">
                  {post.content}
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-gray-500">
                    {new Date(post.created_at).toLocaleString()}
                  </span>
                  {isOwner && ( // Show delete button only if the current user is the owner of the post
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      className="text-rose-500 hover:text-rose-300"
                      aria-label="Delete post"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  )}
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