package workout

type Template struct {
	ID         string     `json:"id"`
	UserID     string     `json:"user_id"`
	Name       string     `json:"name"`
	DayOfWeek  string     `json:"day_of_week"`
	OrderIndex int        `json:"order_index"`
	Exercises  []Exercise `json:"exercises,omitempty"`
}

type Exercise struct {
	ID         string `json:"id"`
	TemplateID string `json:"template_id"`
	Name       string `json:"name"`
	TargetSets int    `json:"target_sets"`
	TargetReps int    `json:"target_reps"`
	Notes      string `json:"notes"`
	IsTimed    bool   `json:"is_timed"`
	OrderIndex int    `json:"order_index"`
}

type CreateTemplateRequest struct {
	Name       string `json:"name"`
	DayOfWeek  string `json:"day_of_week"`
	OrderIndex int    `json:"order_index"`
}

type UpdateTemplateRequest struct {
	Name       string `json:"name"`
	DayOfWeek  string `json:"day_of_week"`
	OrderIndex int    `json:"order_index"`
}

type CreateExerciseRequest struct {
	Name       string `json:"name"`
	TargetSets int    `json:"target_sets"`
	TargetReps int    `json:"target_reps"`
	Notes      string `json:"notes"`
	IsTimed    bool   `json:"is_timed"`
	OrderIndex int    `json:"order_index"`
}

type UpdateExerciseRequest struct {
	Name       string `json:"name"`
	TargetSets int    `json:"target_sets"`
	TargetReps int    `json:"target_reps"`
	Notes      string `json:"notes"`
	IsTimed    bool   `json:"is_timed"`
	OrderIndex int    `json:"order_index"`
}
