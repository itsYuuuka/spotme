package progress

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Service struct {
	db *pgxpool.Pool
}

func NewService(db *pgxpool.Pool) *Service {
	return &Service{db: db}
}

func (s *Service) GetExerciseProgress(ctx context.Context, exerciseID, userID string) (*ExerciseProgress, error) {
	var p ExerciseProgress
	p.ExerciseID = exerciseID

	err := s.db.QueryRow(ctx,
		`SELECT name FROM template_exercises WHERE id = $1`, exerciseID,
	).Scan(&p.ExerciseName)
	if err != nil {
		return nil, err
	}

	rows, err := s.db.Query(ctx, `
		SELECT
			s.date,
			MAX(ss.weight) AS max_weight,
			SUM(ss.reps) AS total_reps,
			COUNT(ss.id) AS sets
		FROM session_sets ss
		JOIN sessions s ON s.id = ss.session_id
		WHERE ss.exercise_id = $1 AND s.user_id = $2
		GROUP BY s.date
		ORDER BY s.date ASC
	`, exerciseID, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var dp DataPoint
		if err := rows.Scan(&dp.Date, &dp.MaxWeight, &dp.TotalReps, &dp.Sets); err != nil {
			return nil, err
		}
		p.History = append(p.History, dp)
	}
	return &p, rows.Err()
}

func (s *Service) GetAllProgress(ctx context.Context, userID string) ([]ExerciseProgress, error) {
	rows, err := s.db.Query(ctx, `
		SELECT DISTINCT ss.exercise_id, te.name
		FROM session_sets ss
		JOIN sessions s ON s.id = ss.session_id
		JOIN template_exercises te ON te.id = ss.exercise_id
		WHERE s.user_id = $1
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var exercises []ExerciseProgress
	for rows.Next() {
		var p ExerciseProgress
		if err := rows.Scan(&p.ExerciseID, &p.ExerciseName); err != nil {
			return nil, err
		}
		exercises = append(exercises, p)
	}
	return exercises, rows.Err()
}
