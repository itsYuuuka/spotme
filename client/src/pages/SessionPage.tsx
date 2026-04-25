import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getSession, getTemplate, addSet, deleteSet } from "../api";
import type { Session, SessionSet, Exercise } from "../types";
import { formatDate } from "../utils";

export default function SessionPage() {
  const { id } = useParams<{ id: string }>();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [templateExercises, setTemplateExercises] = useState<Exercise[]>([]);

  // Per exercise input state
  const [inputs, setInputs] = useState<
    Record<string, { reps: number; weight: number }>
  >({});

  useEffect(() => {
    fetchSession();
  }, [id]);

  const fetchSession = async () => {
    if (!id) return;
    try {
      const res = await getSession(id);
      setSession(res.data);
      if (res.data.template_id) {
        const templateRes = await getTemplate(res.data.template_id);
        setTemplateExercises(templateRes.data.exercises ?? []);
      }
    } catch {
      console.error("Failed to fetch session");
    } finally {
      setLoading(false);
    }
  };

  const getExerciseSets = (exerciseId: string): SessionSet[] => {
    return session?.sets?.filter((s) => s.exercise_id === exerciseId) ?? [];
  };

  const handleLogSet = async (exerciseId: string) => {
    if (!id || !session) return;
    const input = inputs[exerciseId] ?? { reps: 8, weight: 0 };
    const existingSets = getExerciseSets(exerciseId);
    try {
      const res = await addSet(id, {
        exercise_id: exerciseId,
        set_number: existingSets.length + 1,
        reps: input.reps,
        weight: input.weight,
        duration_seconds: 0,
      });
      setSession((prev) =>
        prev ? { ...prev, sets: [...(prev.sets ?? []), res.data] } : prev,
      );
    } catch {
      console.error("Failed to log set");
    }
  };

  const handleDeleteSet = async (setId: string) => {
    if (!id) return;
    try {
      await deleteSet(id, setId);
      setSession((prev) =>
        prev
          ? { ...prev, sets: prev.sets?.filter((s) => s.id !== setId) }
          : prev,
      );
    } catch {
      console.error("Failed to delete set");
    }
  };

  const updateInput = (
    exerciseId: string,
    field: "reps" | "weight",
    value: number,
  ) => {
    setInputs((prev) => ({
      ...prev,
      [exerciseId]: {
        ...(prev[exerciseId] ?? { reps: 8, weight: 0 }),
        [field]: value,
      },
    }));
  };

  if (loading)
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6">Loading...</div>
    );
  if (!session)
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6">
        Session not found
      </div>
    );

  const exerciseMap = new Map<string, { id: string; name: string }>();
  session.sets?.forEach((s) => {
    if (!exerciseMap.has(s.exercise_id)) {
      exerciseMap.set(s.exercise_id, {
        id: s.exercise_id,
        name: s.exercise_name,
      });
    }
  });

  const exercises =
    templateExercises.length > 0
      ? templateExercises.map((e) => ({ id: e.id, name: e.name }))
      : Array.from(exerciseMap.values());

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link to="/dashboard" className="text-gray-400 hover:text-white">
            ← Dashboard
          </Link>
          <div>
            <h1 className="text-xl font-bold">Today's Workout</h1>
            <p className="text-sm text-gray-400">{formatDate(session.date)}</p>
          </div>
        </div>

        <p className="text-gray-400 text-sm mb-6">
          Log your sets for today's workout.
        </p>

        {/* Exercises */}
        <div className="flex flex-col gap-6">
          {exercises.map((exercise) => {
            const sets = getExerciseSets(exercise.id);
            const input = inputs[exercise.id] ?? { reps: 8, weight: 0 };

            return (
              <div key={exercise.id} className="bg-gray-800 rounded-lg p-4">
                <h3 className="font-bold text-lg mb-3">{exercise.name}</h3>

                {/* Logged stats */}
                {sets.length > 0 && (
                  <div className="mb-3 flex flex-col gap-1">
                    {sets.map((set) => (
                      <div
                        key={set.id}
                        className="flex items-center justify-between text-sm bg-gray-700 rounded px-3 py-2"
                      >
                        <span className="text-gray-400">
                          Set {set.set_number}
                        </span>
                        <span className="font-bold">
                          {set.weight}kg × {set.reps} reps
                        </span>
                        <button
                          onClick={() => handleDeleteSet(set.id)}
                          className="text-red-400 hover:text-red-300 cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Input for next set */}
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-400 mb-1">
                      Weight (kg)
                    </label>
                    <input
                      type="number"
                      value={input.weight}
                      onChange={(e) =>
                        updateInput(
                          exercise.id,
                          "weight",
                          Number(e.target.value),
                        )
                      }
                      className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white text-center text-lg font-bold"
                      min={0}
                      step={0.5}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-gray-400 mb-1">
                      Reps
                    </label>
                    <input
                      type="number"
                      value={input.reps}
                      onChange={(e) =>
                        updateInput(exercise.id, "reps", Number(e.target.value))
                      }
                      className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white text-center text-lg font-bold"
                      min={1}
                    />
                  </div>
                  <button
                    onClick={() => handleLogSet(exercise.id)}
                    className="px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded font-bold cursor-pointer"
                  >
                    + Set
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {exercises.length === 0 && (
          <div className="bg-gray-800 rounded-lg p-6 text-center">
            <p className="text-gray-400">No exercises logged yet.</p>
            <p className="text-sm text-gray-500 mt-1">
              This session was started from a template - exercises will appear
              here as you log sets.
            </p>
          </div>
        )}
      </div>
      <div className="mt-8 pb-6">
        <Link
          to="/dashboard"
          className="block w-full py-3 bg-green-600 hover:bg-green-700 rounded font-bold text-center cursor-pointer"
        >
          Finish Workout ✓
        </Link>
      </div>
    </div>
  );
}
