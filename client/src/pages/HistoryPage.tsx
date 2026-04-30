import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getSessions, deleteSession } from "../api";
import type { Session } from "../types";
import { formatDate } from "../utils";

export default function HistoryPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await getSessions();
      setSessions(res.data ?? []);
    } catch {
      console.error("Failed to fetch sessions");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteSession(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
    } catch {
      console.error("Failed to delete session");
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Workout History</h1>

        {loading ? (
          <p className="text-gray-400">Loading...</p>
        ) : sessions.length === 0 ? (
          <p className="text-gray-400">
            No workouts logged yet. Start one from the dashboard!
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="bg-gray-800 rounded-lg p-4 flex items-center justify-between"
              >
                <div>
                  <p className="font-bold">{formatDate(session.date)}</p>
                  {session.notes && (
                    <p className="text-sm text-gray-400">{session.notes}</p>
                  )}
                </div>
                <div className="flex gap-3">
                  <Link
                    to={`/session/${session.id}`}
                    className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm cursor-pointer"
                  >
                    View
                  </Link>
                  <button
                    onClick={() => handleDelete(session.id)}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
