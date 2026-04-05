package progress

type ExerciseProgress struct {
	ExerciseID   string      `json:"exercise_id"`
	ExerciseName string      `json:"exercise_name"`
	History      []DataPoint `json:"history"`
}

type DataPoint struct {
	Date      string  `json:"date"`
	MaxWeight float64 `json:"max_weight"`
	TotalReps int     `json:"total_reps"`
	Sets      int     `json:"sets"`
}
