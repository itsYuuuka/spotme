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

	// Try template_exercises first, then session_exercises
	err := s.db.QueryRow(ctx,
		`SELECT name FROM template_exercises WHERE id = $1`, exerciseID,
	).Scan(&p.ExerciseName)
	if err != nil {
		err = s.db.QueryRow(ctx,
			`SELECT name FROM session_exercises WHERE id = $1`, exerciseID,
		).Scan(&p.ExerciseName)
		if err != nil {
			return nil, err
		}
	}

	rows, err := s.db.Query(ctx, `
              SELECT date::text, max_weight, best_reps, sets FROM (
                      SELECT
                              s.date,
                              MAX(ss.weight) AS max_weight,
                              (SELECT ss2.reps FROM session_sets ss2
                              JOIN sessions s2 ON s2.id = ss2.session_id
                              WHERE ss2.exercise_id = $1 AND s2.user_id = $2 AND s2.date = s.date
                              ORDER BY ss2.weight DESC, ss2.reps DESC
                              LIMIT 1) AS best_reps,
                              COUNT(ss.id) AS sets
                      FROM session_sets ss
                      JOIN sessions s ON s.id = ss.session_id
                      WHERE ss.exercise_id = $1 AND s.user_id = $2
                      GROUP BY s.date

                      UNION ALL

                      SELECT
                              s.date,
                              MAX(ss.weight) AS max_weight,
                              (SELECT ss2.reps FROM session_sets ss2
                              JOIN sessions s2 ON s2.id = ss2.session_id
                              WHERE ss2.session_exercise_id = $1 AND s2.user_id = $2 AND s2.date = s.date
                              ORDER BY ss2.weight DESC, ss2.reps DESC
                              LIMIT 1) AS best_reps,
                              COUNT(ss.id) AS sets
                      FROM session_sets ss
                      JOIN sessions s ON s.id = ss.session_id
                      WHERE ss.session_exercise_id = $1 AND s.user_id = $2
                      GROUP BY s.date
              ) combined
              ORDER BY date ASC
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
              SELECT DISTINCT ON (exercise_id)
                      exercise_id,
                      exercise_name,
                      date::text,
                      max_weight
              FROM (
                      SELECT ss.exercise_id AS exercise_id, te.name AS exercise_name, s.date, MAX(ss.weight) OVER (PARTITION BY ss.exercise_id, s.date) AS max_weight
                      FROM session_sets ss
                      JOIN sessions s ON s.id = ss.session_id
                      JOIN template_exercises te ON te.id = ss.exercise_id
                      WHERE s.user_id = $1 AND ss.exercise_id IS NOT NULL

                      UNION ALL

                      SELECT ss.session_exercise_id AS exercise_id, se.name AS exercise_name, s.date, MAX(ss.weight) OVER (PARTITION BY ss.session_exercise_id, s.date) AS max_weight
                      FROM session_sets ss
                      JOIN sessions s ON s.id = ss.session_id
                      JOIN session_exercises se ON se.id = ss.session_exercise_id
                      WHERE s.user_id = $1 AND ss.session_exercise_id IS NOT NULL
              ) combined
              ORDER BY exercise_id, date DESC
      `, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var exercises []ExerciseProgress
	for rows.Next() {
		var p ExerciseProgress
		var dp DataPoint
		if err := rows.Scan(&p.ExerciseID, &p.ExerciseName, &dp.Date, &dp.MaxWeight); err != nil {
			return nil, err
		}
		p.History = []DataPoint{dp}
		exercises = append(exercises, p)
	}
	return exercises, rows.Err()
}
