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
  baseURL: "http://localhost:8080",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

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

// Sets
export const addSet = (
  sessionId: string,
  data: {
    exercise_id: string;
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

export const getFeed = () => api.get<FeedItem[]>("/api/feed");
