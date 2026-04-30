import React, { useState, useEffect } from "react";
import { getFriends, sendFriendRequest, acceptFriendRequest } from "../api";
import type { Friendship } from "../types";

export default function FriendsPage() {
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchFriends();
  }, []);

  const fetchFriends = async () => {
    try {
      const res = await getFriends();
      setFriends(res.data ?? []);
    } catch {
      console.error("Failed to fetch friends");
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      await sendFriendRequest(email);
      setSuccess("Friend request sent!");
      setEmail("");
    } catch {
      setError("User not found or request already sent");
    }
  };

  const handleAccept = async (id: string) => {
    try {
      await acceptFriendRequest(id);
      setFriends((prev) =>
        prev.map((f) => (f.id === id ? { ...f, status: "accepted" } : f)),
      );
    } catch {
      console.error("Failed to accept request");
    }
  };

  const accepted = friends.filter((f) => f.status === "accepted");
  const pending = friends.filter((f) => f.status === "pending");

  return (
    <div className="h-full overflow-y-auto bg-gray-900 text-white p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Friends</h1>

        {/* Add friend form */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <h2 className="font-bold mb-3">Add Gym Buddy</h2>
          <form onSubmit={handleSendRequest} className="flex gap-3">
            <input
              type="email"
              placeholder="Enter their email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 p-2 rounded bg-gray-700 border border-gray-600 text-white"
              required
            />
            <button
              type="submit"
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded font-bold cursor-pointer"
            >
              Send Request
            </button>
          </form>
          {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
          {success && <p className="text-green-400 text-sm mt-2">{success}</p>}
        </div>

        {/* Pending requests */}
        {pending.length > 0 && (
          <div className="mb-6">
            <h2 className="font-bold mb-3 text-gray-400">Pending Requests</h2>
            <div className="flex flex-col gap-2">
              {pending.map((f) => (
                <div
                  key={f.id}
                  className="bg-gray-800 rounded-lg p-4 flex items-center justify-between"
                >
                  <p className="font-bold">{f.friend_name}</p>
                  <button
                    onClick={() => handleAccept(f.id)}
                    className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm cursor-pointer"
                  >
                    Accept
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Friends list */}
        <div>
          <h2 className="font-bold mb-3 text-gray-400">Your Buddies</h2>
          {loading ? (
            <p className="text-gray-400">Loading...</p>
          ) : accepted.length === 0 ? (
            <p className="text-gray-400">
              No friends yet. Add your gym buddy above!
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {accepted.map((f) => (
                <div
                  key={f.id}
                  className="bg-gray-800 rounded-lg p-4 flex items-center justify-between"
                >
                  <p className="font-bold">{f.friend_name}</p>
                  <span className="text-green-400 text-sm">Active</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
