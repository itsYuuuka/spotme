package workout

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5/pgxpool"
)

var ErrNotFound = errors.New("not found")

type Service struct {
	db *pgxpool.Pool
}

func NewService(db *pgxpool.Pool) *Service {
	return &Service{db: db}
}

func (s *Service) GetTemplates(ctx context.Context, userID string) ([]Template, error) {
	rows, err := s.db.Query(ctx, `
		SELECT id, user_id, name, day_of_week, order_index
		FROM workout_templates
		WHERE user_id = $1
		ORDER BY order_index, name
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var templates []Template
	for rows.Next() {
		var t Template
		if err := rows.Scan(&t.ID, &t.UserID, &t.Name, &t.DayOfWeek, &t.OrderIndex); err != nil {
			return nil, err
		}
		templates = append(templates, t)
	}
	return templates, rows.Err()
}

func (s *Service) GetTemplate(ctx context.Context, id, userID string) (*Template, error) {
	var t Template
	err := s.db.QueryRow(ctx, `
		SELECT id, user_id, name, day_of_week, order_index
		FROM workout_templates
		WHERE id = $1 AND user_id = $2
	`, id, userID).Scan(&t.ID, &t.UserID, &t.Name, &t.DayOfWeek, &t.OrderIndex)
	if err != nil {
		return nil, ErrNotFound
	}

	rows, err := s.db.Query(ctx, `
		SELECT id, template_id, name, target_sets, target_reps, notes, is_timed, order_index
		FROM template_exercises
		WHERE template_id = $1
		ORDER BY order_index
	`, id)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var e Exercise
		if err := rows.Scan(&e.ID, &e.TemplateID, &e.Name, &e.TargetSets, &e.TargetReps, &e.Notes, &e.IsTimed, &e.OrderIndex); err != nil {
			return nil, err
		}
		t.Exercises = append(t.Exercises, e)
	}
	return &t, rows.Err()
}

func (s *Service) CreateTemplate(ctx context.Context, userID string, req CreateTemplateRequest) (*Template, error) {
	var t Template
	err := s.db.QueryRow(ctx, `
		INSERT INTO workout_templates (user_id, name, day_of_week, order_index)
		VALUES ($1, $2, $3, $4)
		RETURNING id, user_id, name, day_of_week, order_index
	`, userID, req.Name, req.DayOfWeek, req.OrderIndex).Scan(&t.ID, &t.UserID, &t.Name, &t.DayOfWeek, &t.OrderIndex)
	if err != nil {
		return nil, err
	}
	return &t, nil
}

func (s *Service) UpdateTemplate(ctx context.Context, id, userID string, req UpdateTemplateRequest) (*Template, error) {
	var t Template
	err := s.db.QueryRow(ctx, `
		UPDATE workout_templates
		SET name = $1, day_of_week = $2, order_index = $3
		WHERE id = $4 AND user_id = $5
		RETURNING id, user_id, name, day_of_week, order_index
	`, req.Name, req.DayOfWeek, req.OrderIndex, id, userID).Scan(&t.ID, &t.UserID, &t.Name, &t.DayOfWeek, &t.OrderIndex)
	if err != nil {
		return nil, ErrNotFound
	}
	return &t, nil
}

func (s *Service) DeleteTemplate(ctx context.Context, id, userID string) error {
	tag, err := s.db.Exec(ctx,
		`DELETE FROM workout_templates WHERE id = $1 AND user_id = $2`, id, userID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

func (s *Service) AddExercise(ctx context.Context, templateID, userID string, req CreateExerciseRequest) (*Exercise, error) {
	var e Exercise
	err := s.db.QueryRow(ctx, `
		INSERT INTO template_exercises (template_id, name, target_sets, target_reps, notes, is_timed, order_index)
		SELECT $1, $2, $3, $4, $5, $6, $7
		FROM workout_templates
		WHERE id = $1 AND user_id = $8
		RETURNING id, template_id, name, target_sets, target_reps, notes, is_timed, order_index
	`, templateID, req.Name, req.TargetSets, req.TargetReps, req.Notes, req.IsTimed, req.OrderIndex, userID).Scan(
		&e.ID, &e.TemplateID, &e.Name, &e.TargetSets, &e.TargetReps, &e.Notes, &e.IsTimed, &e.OrderIndex)
	if err != nil {
		return nil, ErrNotFound
	}
	return &e, nil
}

func (s *Service) UpdateExercise(ctx context.Context, exerciseID, userID string, req UpdateExerciseRequest) (*Exercise, error) {
	var e Exercise
	err := s.db.QueryRow(ctx, `
		UPDATE template_exercises te
		SET name = $1, target_sets = $2, target_reps = $3, notes = $4, is_timed = $5, order_index = $6
		FROM workout_templates wt
		WHERE te.id = $7 AND te.template_id = wt.id AND wt.user_id = $8
		RETURNING te.id, te.template_id, te.name, te.target_sets, te.target_reps, te.notes, te.is_timed, te.order_index
	`, req.Name, req.TargetSets, req.TargetReps, req.Notes, req.IsTimed, req.OrderIndex, exerciseID, userID).
		Scan(&e.ID, &e.TemplateID, &e.Name, &e.TargetSets, &e.TargetReps, &e.Notes, &e.IsTimed, &e.OrderIndex)
	if err != nil {
		return nil, ErrNotFound
	}
	return &e, nil
}

func (s *Service) DeleteExercise(ctx context.Context, exerciseID, userID string) error {
	tag, err := s.db.Exec(ctx, `
		DELETE FROM template_exercises te
		USING workout_templates wt
		WHERE te.id = $1 AND te.template_id = wt.id AND wt.user_id = $2
	`, exerciseID, userID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}
