package session

type Session struct {
	ID         string       `json:"id"`
	UserID     string       `json:"user_id"`
	TemplateID string       `json:"template_id"`
	Date       string       `json:"date"`
	Notes      string       `json:"notes"`
	Sets       []SessionSet `json:"sets,omitempty"`
}

type SessionSet struct {
	ID              string  `json:"id"`
	SessionID       string  `json:"session_id"`
	ExerciseID      string  `json:"exercise_id"`
	ExerciseName    string  `json:"exercise_name"`
	SetNumber       int     `json:"set_number"`
	Reps            int     `json:"reps"`
	Weight          float64 `json:"weight"`
	DurationSeconds int     `json:"duration_seconds"`
}

type CreateSessionRequest struct {
	TemplateID string `json:"template_id"`
	Date       string `json:"date"`
	Notes      string `json:"notes"`
}

type AddSetRequest struct {
	ExerciseID      string  `json:"exercise_id"`
	SetNumber       int     `json:"set_number"`
	Reps            int     `json:"reps"`
	Weight          float64 `json:"weight"`
	DurationSeconds int     `json:"duration_seconds"`
}

type UpdateSetRequest struct {
	Reps            *int     `json:"reps"`
	Weight          *float64 `json:"weight"`
	DurationSeconds *int     `json:"duration_seconds"`
}
