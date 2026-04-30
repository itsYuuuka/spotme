import { useState, useEffect } from "react";
import { getAllProgress, getExerciseProgress } from "../api";
import type { ExerciseProgress } from "../types";
import { formatDate } from "../utils";

export default function ProgressPage() {
  const [exercises, setExercises] = useState<ExerciseProgress[]>([]);
  const [selected, setSelected] = useState<ExerciseProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProgress();
  }, []);

  const fetchProgress = async () => {
    try {
      const res = await getAllProgress();
      setExercises(res.data ?? []);
    } catch {
      console.error("Failed to fetch progress");
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = async (exerciseId: string) => {
    try {
      const res = await getExerciseProgress(exerciseId);
      setSelected(res.data);
    } catch {
      console.error("Failed to fetch exercise progress");
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Progress</h1>

        {loading ? (
          <p className="text-gray-400">Loading...</p>
        ) : exercises.length === 0 ? (
          <p className="text-gray-400">
            No progress data yet. Log some workouts first!
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Exercise list */}
            <div className="flex flex-col gap-2">
              <h2 className="text-sm font-bold text-gray-400 uppercase mb-2">
                Exercises
              </h2>
              {exercises.map((ex) => (
                <button
                  key={ex.exercise_id}
                  onClick={() => handleSelect(ex.exercise_id)}
                  className={`text-left px-4 py-3 rounded-lg cursor-pointer transition-colors ${
                    selected?.exercise_id === ex.exercise_id
                      ? "bg-orange-500 text-white"
                      : "bg-gray-800 hover:bg-gray-700 text-gray-300"
                  }`}
                >
                  {ex.exercise_name}
                </button>
              ))}
            </div>

            {/* Progress detail */}
            <div className="md:col-span-2">
              {!selected ? (
                <div className="bg-gray-800 rounded-lg p-6 text-center">
                  <p className="text-gray-400">
                    Select an exercise to see your progress
                  </p>
                </div>
              ) : (
                <div className="bg-gray-800 rounded-lg p-6">
                  <h2 className="text-xl font-bold mb-4">
                    {selected.exercise_name}
                  </h2>
                  {selected.history.length === 0 ? (
                    <p className="text-gray-400">No data yet.</p>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {selected.history.map((dp, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between bg-gray-700 rounded-lg px-4 py-3"
                        >
                          <span className="text-sm text-gray-400">
                            {formatDate(dp.date)}
                          </span>
                          <div className="flex gap-6 text-sm">
                            <span className="font-bold text-orange-400">
                              {dp.max_weight}
                            </span>
                            <span className="text-gray-300">
                              {dp.total_reps}
                            </span>
                            <span className="text-gray-400">{dp.sets}</span>
                          </div>
                        </div>
                      ))}
                      {/* PR indicator */}
                      {selected.history.length > 1 && (
                        <div className="mt-2 text-sm text-gray-400">
                          {selected.history[selected.history.length - 1]
                            .max_weight > selected.history[0].max_weight ? (
                            <p className="text-green-400">
                              ↑ PR: +
                              {(
                                selected.history[selected.history.length - 1]
                                  .max_weight - selected.history[0].max_weight
                              ).toFixed(1)}
                              kg since first session
                            </p>
                          ) : (
                            <p className="text-gray-400">Keep pushing!</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
