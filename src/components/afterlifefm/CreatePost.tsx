"use client";

import React, { useState, useRef } from "react";
import { supabase } from "../../lib/supabaseClient";
import { CameraIcon } from "@heroicons/react/24/outline";

interface CreatePostProps {
  onPost: (content: string, imageUrl?: string) => void;
}

const CreatePost: React.FC<CreatePostProps> = ({ onPost }) => {
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
};

export default CreatePost;
