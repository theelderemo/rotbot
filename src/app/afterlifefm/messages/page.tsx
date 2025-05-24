"use client";

import React, { useState, useEffect } from "react";
import { useSupabaseAuth } from "../../../hooks/SupabaseAuthProvider";
import { supabase } from "../../../lib/supabaseClient";
import { useRouter } from "next/navigation";

function MessagesSection() {
  const { user, loading } = useSupabaseAuth();
  const router = useRouter();
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");

  // Redirect to /login if not loading and user is null
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return <div className="text-center mt-20">Loading...</div>;
  }

  // Fetch all unique conversation partners
  useEffect(() => {
    if (!user) return;
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
      });
  }, [user]);

  // Fetch messages for selected conversation
  useEffect(() => {
    if (!user || !selectedUser) return;
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

export default MessagesSection;
