import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getTemplates, createTemplate, deleteTemplate } from "../api";
import type { Template } from "../types";

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState("");

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await getTemplates();
      setTemplates(res.data ?? []);
    } catch {
      console.error("Failed to fetch templates");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    try {
      const res = await createTemplate({
        name,
        day_of_week: dayOfWeek,
        order_index: templates.length,
      });
      setTemplates((prev) => [...prev, res.data]);
      setName("");
      setDayOfWeek("");
      setShowForm(false);
    } catch {
      console.error("Failed to create template");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTemplate(id);
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    } catch {
      console.error("Failed to delete template");
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Your Templates</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded font-bold cursor-pointer"
          >
            {showForm ? "Cancel" : "+ New Template"}
          </button>
        </div>

        {/* Create form */}
        {showForm && (
          <form
            onSubmit={handleCreate}
            className="bg-gray-800 rounded-lg p-4 mb-6 flex flex-col gap-3"
          >
            <input
              type="text"
              placeholder="Template name (e.g. Upper Body 1)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="p-2 rounded bg-gray-700 border border-gray-600 text-white"
              required
            />
            <select
              value={dayOfWeek}
              onChange={(e) => setDayOfWeek(e.target.value)}
              className="p-2 rounded bg-gray-700 border border-gray-600 text-white"
            >
              <option value="">No specific day</option>
              <option value="Monday">Monday</option>
              <option value="Tuesday">Tuesday</option>
              <option value="Wednesday">Wednesday</option>
              <option value="Thursday">Thursday</option>
              <option value="Friday">Friday</option>
              <option value="Saturday">Saturday</option>
              <option value="Sunday">Sunday</option>
            </select>
            <button
              type="submit"
              className="py-2 bg-orange-500 hover:bg-orange-600 rounded font-bold cursor-pointer"
            >
              Create Template
            </button>
          </form>
        )}

        {/* Templates list */}
        {loading ? (
          <p className="text-gray-400">...Loading</p>
        ) : templates.length === 0 ? (
          <p className="text-gray-400">
            No templates yet. Create your first split!
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {templates.map((template) => (
              <div
                key={template.id}
                className="bg-gray-800 rounded-lg p-4 flex items-center justify-between"
              >
                <div>
                  <p className="font-bold text-lg">{template.name}</p>
                  {template.day_of_week && (
                    <p className="text-sm text-gray-400">
                      {template.day_of_week}
                    </p>
                  )}
                </div>
                <div className="flex gap-3">
                  <Link
                    to={`/templates/${template.id}`}
                    className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm cursor-pointer"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(template.id)}
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
