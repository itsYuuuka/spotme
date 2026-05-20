import axios from "axios";
import type {
  AuthResponse,
  Template,
  Exercise,
  Session,
  SessionSet,
  ExerciseProgress,
  Friendship,
  FeedItem,
} from "../types";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8080",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("name");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

// Auth
export const register = (email: string, password: string, name: string) =>
  api.post<AuthResponse>("/api/auth/register", { email, password, name });

export const login = (email: string, password: string) =>
  api.post<AuthResponse>("/api/auth/login", { email, password });

// Templates
export const getTemplates = () => api.get<Template[]>("/api/templates");

export const getTemplate = (id: string) =>
  api.get<Template>(`/api/templates/${id}`);

export const createTemplate = (data: {
  name: string;
  day_of_week: string;
  order_index: number;
}) => api.post<Template>("/api/templates", data);

export const updateTemplate = (
  id: string,
  data: {
    name: string;
    day_of_week: string;
    order_index: number;
  },
) => api.put<Template>(`/api/templates/${id}`, data);

export const deleteTemplate = (id: string) =>
  api.delete(`/api/templates/${id}`);

// Exercises
export const addExercise = (
  templateId: string,
  data: {
    name: string;
    target_sets: number;
    target_reps: number;
    notes: string;
    is_timed: boolean;
    order_index: number;
  },
) => api.post<Exercise>(`/api/templates/${templateId}/exercises`, data);

export const updateExercise = (
  templateId: string,
  exerciseId: string,
  data: {
    name: string;
    target_sets: number;
    target_reps: number;
    notes: string;
    is_timed: boolean;
    order_index: number;
  },
) =>
  api.put<Exercise>(
    `/api/templates/${templateId}/exercises/${exerciseId}`,
    data,
  );

export const deleteExercise = (templateId: string, exerciseId: string) =>
  api.delete(`/api/templates/${templateId}/exercises/${exerciseId}`);

// Sessions
export const getSessions = () => api.get<Session[]>("/api/sessions");

export const getSession = (id: string) =>
  api.get<Session>(`/api/sessions/${id}`);

export const createSession = (data: {
  template_id: string;
  date: string;
  notes: string;
}) => api.post<Session>("/api/sessions", data);

export const deleteSession = (id: string) => api.delete(`/api/sessions/${id}`);

export const addExerciseToSession = (sessionId: string, name: string) =>
  api.post<Exercise>(`/api/sessions/${sessionId}/exercises`, { name });

export const getWeek = () =>
  api.get<{ dates: string[] }>(
    `/api/sessions/week?tz=${encodeURIComponent(Intl.DateTimeFormat().resolvedOptions().timeZone)}`,
  );

// Sets
export const addSet = (
  sessionId: string,
  data: {
    exercise_id?: string;
    session_exercise_id?: string;
    set_number: number;
    reps: number;
    weight: number;
    duration_seconds: number;
  },
) => api.post<SessionSet>(`/api/sessions/${sessionId}/sets`, data);

export const updateSet = (
  sessionId: string,
  setId: string,
  data: {
    reps?: number;
    weight?: number;
    duration_seconds?: number;
  },
) => api.patch<SessionSet>(`/api/sessions/${sessionId}/sets/${setId}`, data);

export const deleteSet = (sessionId: string, setId: string) =>
  api.delete(`/api/sessions/${sessionId}/sets/${setId}`);

// Progress
export const getAllProgress = () =>
  api.get<ExerciseProgress[]>("/api/progress");

export const getExerciseProgress = (exerciseId: string) =>
  api.get<ExerciseProgress>(`/api/progress/${exerciseId}`);

// Friends
export const getFriends = () => api.get<Friendship[]>("/api/friends");

export const sendFriendRequest = (friendEmail: string) =>
  api.post("/api/friends/request", { friend_email: friendEmail });

export const acceptFriendRequest = (id: string) =>
  api.put(`/api/friends/${id}/accept`);

export const deleteFriend = (id: string) => api.delete(`/api/friends/${id}`);

export const getFeed = () => api.get<FeedItem[]>("/api/feed");

// Account
export const getAccount = () =>
  api.get<{ id: string; email: string; name: string }>("/api/account");

export const updateName = (name: string) =>
  api.put("/api/account/name", { name });

export const updatePassword = (
  current_password: string,
  new_password: string,
) => api.put("/api/account/password", { current_password, new_password });

export const deleteAccount = () => api.delete("/api/account");
