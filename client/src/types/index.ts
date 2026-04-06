export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Template {
  id: string;
  user_id: string;
  name: string;
  day_of_week: string;
  order_index: number;
  exercises?: Exercise[];
}

export interface Exercise {
  id: string;
  template_id: string;
  name: string;
  target_sets: number;
  target_reps: number;
  notes: string;
  is_timed: boolean;
  order_index: number;
}

export interface Session {
  id: string;
  user_id: string;
  template_id: string;
  date: string;
  notes: string;
  sets?: SessionSet[];
}

export interface SessionSet {
  id: string;
  session_id: string;
  exercise_id: string;
  exercise_name: string;
  set_number: number;
  reps: number;
  weight: number;
  duration_seconds: number;
}

export interface DataPoint {
  date: string;
  max_weight: number;
  total_reps: number;
  sets: number;
}

export interface ExerciseProgress {
  exercise_id: string;
  exercise_name: string;
  history: DataPoint[];
}

export interface Friendship {
  id: string;
  user_id: string;
  friend_id: string;
  friend_name: string;
  status: string;
  created_at: string;
}

export interface FeedItem {
  session_id: string;
  user_name: string;
  template_name: string;
  date: string;
  set_count: number;
}

export interface AuthResponse {
  token: string;
  name: string;
}
