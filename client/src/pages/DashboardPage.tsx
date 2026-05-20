import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  getTemplates,
  getFeed,
  createSession,
  getFriends,
  deleteSession,
  getWeek,
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
  const [weekDates, setWeekDates] = useState<string[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
    null,
  );

  useEffect(() => {
    const liveSessionId = localStorage.getItem("liveSessionId");
    if (liveSessionId) {
      deleteSession(liveSessionId).catch(() => {});
      localStorage.removeItem("liveSessionId");
    }

    const fetchData = async () => {
      try {
        const [templatesRes, feedRes, friendsRes, weekRes] = await Promise.all([
          getTemplates(),
          getFeed(),
          getFriends(),
          getWeek(),
        ]);
        setTemplates(templatesRes.data ?? []);
        setFeed(feedRes.data ?? []);
        setFriends(friendsRes.data ?? []);
        setWeekDates(weekRes.data.dates ?? []);
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

  const getUpNext = (): Template | null => {
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    const trainedToday = weekDates.includes(todayStr);
    const todayIdx = today.getDay();

    // If already trained today, start search from tomorrow
    const startOffset = trainedToday ? 1 : 0;

    for (let i = startOffset; i < 7; i++) {
      const checkDay = days[(todayIdx + i) % 7];
      const match = templates.find(
        (t) => t.day_of_week?.toLowerCase() === checkDay.toLowerCase(),
      );
      if (match) return match;
    }
    return null;
  };

  const dayOrder = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];
  const sortedTemplates = [...templates].sort((a, b) => {
    const ai = dayOrder.indexOf(a.day_of_week ?? "");
    const bi = dayOrder.indexOf(b.day_of_week ?? "");
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

  const upNext = getUpNext();

  return (
    <div
      className="text-white h-full flex flex-col"
      style={{
        background: "#0B0810",
        backgroundImage: `
    radial-gradient(140% 80% at 100% 0%, color-mix(in oklab, #E8E1D3 22%, transparent), transparent 55%),
    radial-gradient(80% 50% at -10% 100%, color-mix(in oklab, #E8E1D3 16%, transparent), transparent 60%)
  `,
      }}
    >
      <div className="max-w-4xl mx-auto w-full flex-1 overflow-y-auto px-4 pt-4 pb-4">
        {/* Hero card */}
        <div
          className="rounded-2xl p-4 mb-4 overflow-hidden relative"
          style={{
            background:
              "linear-gradient(180deg, color-mix(in oklab, #E8E1D3 12%, rgba(20,16,28,0.6)), rgba(20,16,28,0.6))",
            border: "1px solid color-mix(in oklab, #E8E1D3 35%, transparent)",
          }}
        >
          <div className="flex justify-between items-start">
            <div>
              <p
                className="text-xs font-bold tracking-widest uppercase mb-2"
                style={{ color: "rgba(255,255,255,0.55)" }}
              >
                {new Date()
                  .toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })
                  .toUpperCase()}
              </p>
              <h1 className="text-4xl font-extrabold tracking-tight leading-none mb-1">
                Hey {name}.
              </h1>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>
                Ready to train today?
              </p>
            </div>
            <div className="text-right">
              <p
                className="text-4xl font-extrabold"
                style={{ color: "#E8E1D3" }}
              >
                {weekDates.length}
                <span
                  className="text-xl"
                  style={{ color: "rgba(255,255,255,0.35)" }}
                >
                  /{new Set(templates.map(t => t.day_of_week).filter(Boolean)).size}
                </span>
              </p>
              <p
                className="text-xs font-bold tracking-widest uppercase"
                style={{ color: "rgba(255,255,255,0.45)" }}
              >
                this week
              </p>
            </div>
          </div>

          {/* Week dots */}
          <div className="flex gap-1 mt-4">
            {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => {
              const today = new Date().getDay();
              const mondayBased = today === 0 ? 6 : today - 1;
              const isToday = i === mondayBased;
              const isFuture = i > mondayBased;

              // Get the date for this day slot
              const now = new Date();
              const diff = i - mondayBased;
              const slotDate = new Date(now);
              slotDate.setDate(now.getDate() + diff);
              const slotStr = slotDate.toISOString().split("T")[0];

              const isDone = weekDates.includes(slotStr);

              return (
                <div
                  key={i}
                  className="flex-1 flex flex-col items-center gap-1"
                >
                  <span
                    className="font-bold"
                    style={{
                      color: isToday ? "#E8E1D3" : "rgba(255,255,255,0.35)",
                      fontSize: 9,
                    }}
                  >
                    {d}
                  </span>
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 5,
                      background: isDone
                        ? "#E8E1D3"
                        : isToday && !isDone
                          ? "transparent"
                          : isFuture
                            ? "rgba(255,255,255,0.1)"
                            : "rgba(255,255,255,0.1)",
                      border:
                        isToday && !isDone ? "1.5px solid #E8E1D3" : "none",
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {upNext && (
          <div
            className="rounded-2xl p-4 mb-6 flex items-center gap-4"
            style={{
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.015))",
              border: "1px solid rgba(255,255,255,0.08)",
              backdropFilter: "blur(20px)",
            }}
          >
            <div className="flex-1 min-w-0">
              <p
                className="text-xs font-bold tracking-widest uppercase mb-1"
                style={{ color: "rgba(255,255,255,0.5)" }}
              >
                Up next ·{" "}
                {upNext.day_of_week?.toLowerCase() ===
                new Date()
                  .toLocaleDateString("en-US", { weekday: "long" })
                  .toLowerCase()
                  ? "Today"
                  : upNext.day_of_week}
              </p>
              <p className="text-lg font-extrabold tracking-tight">
                {upNext.name}
              </p>
              <p
                className="text-xs mt-0.5"
                style={{ color: "rgba(255,255,255,0.5)" }}
              >
                {upNext.exercises?.length ?? 0} ex ·{" "}
                {upNext.exercises?.reduce(
                  (a, e) => a + (e.target_sets ?? 0),
                  0,
                ) ?? 0}{" "}
                sets
              </p>
            </div>
            <button
              onClick={() => setSelectedTemplate(upNext)}
              className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
              style={{
                background: "#E8E1D3",
              }}
            >
              <svg
                className="cursor-pointer"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M9 6l6 6-6 6"
                  stroke="#0B0810"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        )}

        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-extrabold tracking-tight">
              Your Split
            </h2>
            <Link
              to="/templates"
              className="text-sm font-bold hover:underline"
              style={{ color: "#E8E1D3" }}
            >
              Manage
            </Link>
          </div>
          {loading ? (
            <p style={{ color: "rgba(255,255,255,0.4)" }}>Loading...</p>
          ) : templates.length === 0 ? (
            <div
              className="rounded-xl p-6 text-center"
              style={{
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.015))",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <p className="mb-4" style={{ color: "rgba(255,255,255,0.4)" }}>
                No templates yet.
              </p>
              <Link
                to="/templates"
                className="px-4 py-2 rounded font-bold"
                style={{ background: "#E8E1D3", color: "#0B0810" }}
              >
                Create your split
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {sortedTemplates.map((template) => (
                <div
                  key={template.id}
                  onClick={() => setSelectedTemplate(template)}
                  className="rounded-xl p-3 flex flex-col gap-2 h-33 cursor-pointer relative overflow-hidden"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.015))",
                    border: "1px solid rgba(255,255,255,0.08)",
                    backdropFilter: "blur(20px)",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      height: 3,
                      width: "40%",
                      background: "#E8E1D3",
                    }}
                  />
                  {template.day_of_week && (
                    <p
                      className="text-xs font-bold tracking-widest uppercase"
                      style={{ color: "rgba(255,255,255,0.4)" }}
                    >
                      {template.day_of_week.slice(0, 3)}
                    </p>
                  )}
                  <p className="font-extrabold tracking-tight">
                    {template.name}
                  </p>
                  {template.exercises && template.exercises.length > 0 && (
                    <p
                      className="text-xs mt-1"
                      style={{ color: "rgba(255,255,255,0.5)" }}
                    >
                      {template.exercises
                        .slice(0, 3)
                        .map((e) => e.name)
                        .join(", ")}
                      {template.exercises.length > 3 &&
                        ` & ${template.exercises.length - 3} more`}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Friend feed */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-extrabold tracking-tight">
              Friend Activity
            </h2>
          </div>
          {feed.length === 0 ? (
            <div
              className="rounded-xl p-6 text-center"
              style={{
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.015))",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              {friends.filter((f) => f.status === "accepted").length === 0 ? (
                <>
                  <p
                    className="mb-4"
                    style={{ color: "rgba(255,255,255,0.4)" }}
                  >
                    No friend activity yet.
                  </p>
                  <Link
                    to="/friends"
                    className="px-4 py-2 rounded font-bold"
                    style={{ background: "#E8E1D3", color: "#0B0810" }}
                  >
                    Add your gym buddy
                  </Link>
                </>
              ) : (
                <p style={{ color: "rgba(255,255,255,0.4)" }}>
                  Your buddy hasn't logged a workout yet. Time to motivate them!
                </p>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {feed.slice(0, 5).map((item) => (
                <div
                  key={item.session_id}
                  className="rounded-xl p-4 flex items-center gap-3"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.015))",
                    border: "1px solid rgba(255,255,255,0.08)",
                    backdropFilter: "blur(20px)",
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-sm shrink-0"
                    style={{
                      background: "rgba(255,255,255,0.08)",
                      border: "1px solid rgba(255,255,255,0.12)",
                    }}
                  >
                    {item.user_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm">{item.user_name}</p>
                    <p
                      className="text-xs mt-0.5"
                      style={{ color: "rgba(255,255,255,0.5)" }}
                    >
                      {item.template_name} · {item.set_count} sets ·{" "}
                      {formatDate(item.date)}
                    </p>
                  </div>
                  <span
                    className="text-sm font-bold cursor-pointer shrink-0"
                    style={{ color: "#E8E1D3" }}
                    onClick={() => navigate(`/session/${item.session_id}?from=dashboard`)}
                  >
                    View →
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {selectedTemplate && (
        <div
          className="fixed inset-0 flex items-end z-50"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
          onClick={() => setSelectedTemplate(null)}
        >
          <div
            className="w-full rounded-t-2xl p-6 max-h-[80vh] overflow-y-auto"
            style={{
              background:
                "linear-gradient(180deg, rgba(20,18,16,0.98), rgba(11,8,16,0.98))",
              border: "1px solid rgba(255,255,255,0.08)",
              borderBottom: "none",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-extrabold tracking-tight">
                {selectedTemplate.name}
              </h2>
              <div className="flex items-center gap-6">
                <button
                  onClick={() => {
                    setSelectedTemplate(null);
                    navigate(`/templates/${selectedTemplate.id}`);
                  }}
                  className="text-sm font-bold cursor-pointer"
                  style={{ color: "#E8E1D3" }}
                >
                  Edit
                </button>
                <button
                  onClick={() => setSelectedTemplate(null)}
                  className="text-xl cursor-pointer"
                  style={{ color: "rgba(255,255,255,0.5)" }}
                >
                  ✕
                </button>
              </div>
            </div>

            {selectedTemplate.day_of_week && (
              <p
                className="text-xs font-bold tracking-widest uppercase mb-4"
                style={{ color: "rgba(255,255,255,0.4)" }}
              >
                {selectedTemplate.day_of_week}
              </p>
            )}

            <div className="flex flex-col gap-2 mb-6">
              {selectedTemplate.exercises?.map((exercise, index) => (
                <div
                  key={exercise.id}
                  className="flex items-center justify-between rounded-xl px-4 py-3 gap-2"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <span className="text-xs font-bold">
                    {index + 1}. {exercise.name}
                  </span>
                  <span
                    className="text-xs font-bold shrink-0"
                    style={{ color: "rgba(255,255,255,0.4)" }}
                  >
                    {exercise.target_sets} × {exercise.target_reps}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                setSelectedTemplate(null);
                handleStartSession(selectedTemplate.id);
              }}
              className="w-full py-3 rounded-xl font-extrabold cursor-pointer tracking-tight"
              style={{
                background: "#E8E1D3",
                color: "#0B0810",
              }}
            >
              Start Workout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
