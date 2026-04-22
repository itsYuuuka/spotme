import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getTemplate, addExercise, deleteExercise } from "../api";
import type { Template } from "../types";

export default function TemplatePage() {
  const { id } = useParams<{ id: string }>();
  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [exName, setExName] = useState("");
  const [targetSets, setTargetSets] = useState(2);
  const [targetReps, setTargetReps] = useState(8);
  const [notes, setNotes] = useState("");
  const [isTimed, setIsTimed] = useState(false);

  useEffect(() => {
    fetchTemplate();
  }, [id]);

  const fetchTemplate = async () => {
    if (!id) return;
    try {
      const res = await getTemplate(id);
      setTemplate(res.data);
    } catch {
      console.error("Failed to fetch template");
    } finally {
      setLoading(false);
    }
  };

  const handleAddExercise = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!id || !template) return;
    try {
      const res = await addExercise(id, {
        name: exName,
        target_sets: targetSets,
        target_reps: targetReps,
        notes,
        is_timed: isTimed,
        order_index: template.exercises?.length ?? 0,
      });
      setTemplate((prev) =>
        prev
          ? { ...prev, exercises: [...(prev.exercises ?? []), res.data] }
          : prev,
      );
      setExName("");
      setTargetSets(2);
      setTargetReps(8);
      setNotes("");
      setIsTimed(false);
      setShowForm(false);
    } catch {
      console.error("Failed to add exercise");
    }
  };

  const handleDeleteExercise = async (exerciseId: string) => {
    if (!id) return;
    try {
      await deleteExercise(id, exerciseId);
      setTemplate((prev) =>
        prev
          ? {
              ...prev,
              exercises: prev.exercises?.filter((e) => e.id !== exerciseId),
            }
          : prev,
      );
    } catch {
      console.error("Failed to delete exercise");
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6">Loading...</div>
    );
  if (!template)
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6">
        Template not found.
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link to="/templates" className="text-gray-400 hover:text-white">
            ← Back
          </Link>
          <h1 className="text-2xl font-bold">{template.name}</h1>
          {template.day_of_week && (
            <span className="text-sm text-gray-400">
              {template.day_of_week}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Exercises</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded font-bold cursor-pointer"
          >
            {showForm ? "Cancel" : "+ Add Exercise"}
          </button>
        </div>

        {/* Add exercise form */}
        {showForm && (
          <form
            onSubmit={handleAddExercise}
            className="bg-gray-800 rounded-lg p-4 mb-6 flex flex-col gap-3"
          >
            <input
              type="text"
              placeholder="Exercise Name"
              value={exName}
              onChange={(e) => setExName(e.target.value)}
              className="p-2 rounded bg-gray-700 border border-gray-600 text-white"
              required
            />
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm text-gray-400 mb-1">
                  Target Sets
                </label>
                <input
                  type="number"
                  value={targetSets}
                  onChange={(e) => setTargetSets(Number(e.target.value))}
                  className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white"
                  min={1}
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm text-gray-400 mb-1">
                  Target Reps
                </label>
                <input
                  type="number"
                  value={targetReps}
                  onChange={(e) => setTargetReps(Number(e.target.value))}
                  className="w-full p-2 rounded bg-gray-700 border border-gray-600 text-white"
                  min={1}
                />
              </div>
            </div>
            <input
              type="text"
              placeholder="Notes (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="p-2 rounded bg-gray-700 border border-gray-600 text-white"
            />
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={isTimed}
                onChange={(e) => setIsTimed(e.target.checked)}
              />
              Timed exercise (seconds instead of reps)
            </label>
            <button
              type="submit"
              className="py-2 bg-orange-500 hover:bg-orange-600 rounded font-bold cursor-pointer"
            >
              Add Exercise
            </button>
          </form>
        )}

        {/* Exercises list */}
        {!template.exercises || template.exercises.length === 0 ? (
          <p className="text-gray-400">No exercises yet. Add your first one!</p>
        ) : (
          <div className="flex flex-col gap-3">
            {template.exercises.map((exercise, index) => (
              <div
                key={exercise.id}
                className="bg-gray-800 rounded-lg p-4 flex items-center justify-between"
              >
                <div>
                  <p className="font-bold">
                    {index + 1}. {exercise.name}
                  </p>
                  <p className="text-sm text-gray-400">
                    {exercise.target_sets} sets ×{" "}
                    {exercise.is_timed
                      ? `${exercise.target_reps}s`
                      : `${exercise.target_reps} reps`}
                    {exercise.notes && ` — ${exercise.notes}`}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteExercise(exercise.id)}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm cursor-pointer"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
