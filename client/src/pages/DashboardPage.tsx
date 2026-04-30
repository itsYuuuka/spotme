import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  getTemplates,
  getFeed,
  createSession,
  getFriends,
  deleteSession,
} from "../api";
import type { Template, FeedItem, Friendship } from "../types";
import { formatDate } from "../utils";

export default function DashboardPage() {
  const { name } = useAuth();
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [friends, setFriends] = useState<Friendship[]>([]);

  useEffect(() => {
    const liveSessionId = localStorage.getItem("liveSessionId");
    if (liveSessionId) {
      deleteSession(liveSessionId).catch(() => {});
      localStorage.removeItem("liveSessionId");
    }

    const fetchData = async () => {
      try {
        const [templatesRes, feedRes, friendsRes] = await Promise.all([
          getTemplates(),
          getFeed(),
          getFriends(),
        ]);
        setTemplates(templatesRes.data ?? []);
        setFeed(feedRes.data ?? []);
        setFriends(friendsRes.data ?? []);
      } catch {
        console.error("Failed to fetch dashboard data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleStartSession = async (templateId: string) => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const res = await createSession({
        template_id: templateId,
        date: today,
        notes: "",
      });
      localStorage.setItem("liveSessionId", res.data.id);
      navigate(`/session/${res.data.id}?mode=live`);
    } catch {
      console.error("Failed to start session");
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">Hey, {name}!</h1>
        <p className="text-gray-400 mb-8">Ready to train today?</p>

        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Your Split</h2>
            <Link
              to="/templates"
              className="text-orange-400 text-sm hover:underline"
            >
              Manage templates
            </Link>
          </div>
          {loading ? (
            <p className="text-gray-400">Loading...</p>
          ) : templates.length === 0 ? (
            <div className="bg-gray-800 rounded-lg p-6 text-center">
              <p className="text-gray-400 mb-4">No templates yet.</p>
              <Link
                to="/templates"
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded font-bold"
              >
                Create your split
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="bg-gray-800 rounded-lg p-3 flex flex-col gap-2 h-44"
                >
                  <div>
                    <p className="font-bold">{template.name}</p>
                    {template.day_of_week && (
                      <p className="text-xs text-gray-400">
                        {template.day_of_week}
                      </p>
                    )}
                    {template.exercises && template.exercises.length > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        {template.exercises
                          .slice(0, 3)
                          .map((e) => e.name)
                          .join(", ")}
                        {template.exercises.length > 3 &&
                          ` & ${template.exercises.length - 3} more`}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleStartSession(template.id)}
                    className="mt-auto w-full py-2 bg-orange-500 hover:bg-orange-600 rounded font-bold cursor-pointer"
                  >
                    Start Workout
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Friend feed */}
        <div>
          <h2 className="text-xl font-bold mb-4">Friend Activity</h2>
          {feed.length === 0 ? (
            <div className="bg-gray-800 rounded-lg p-6 text-center">
              {friends.filter((f) => f.status === "accepted").length === 0 ? (
                <>
                  <p className="text-gray-400 mb-4">No friend activity yet.</p>
                  <Link
                    to="/friends"
                    className="px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded font-bold"
                  >
                    Add your gym buddy
                  </Link>
                </>
              ) : (
                <p className="text-gray-400">
                  Your buddy hasn't logged a workout yet. Time to motivate them!
                </p>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {feed.slice(0, 5).map((item) => (
                <div
                  key={item.session_id}
                  className="bg-gray-800 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-bold">{item.user_name}</p>
                    <p className="text-sm text-gray-400">
                      {formatDate(item.date)}
                    </p>
                  </div>
                  <p className="text-sm text-gray-400 mt-1">
                    {item.template_name} - {item.set_count} sets
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
