package session

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5/pgxpool"
)

var ErrNotFound = errors.New("session not found")

type Service struct {
	db *pgxpool.Pool
}

func NewService(db *pgxpool.Pool) *Service {
	return &Service{db: db}
}

func (s *Service) GetSessions(ctx context.Context, userID string) ([]Session, error) {
	rows, err := s.db.Query(ctx, `
		SELECT id, user_id, template_id, date::text, notes
		FROM sessions
		WHERE user_id = $1
		ORDER BY created_at DESC
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var sessions []Session
	for rows.Next() {
		var s Session
		var templateID *string
		if err := rows.Scan(&s.ID, &s.UserID, &templateID, &s.Date, &s.Notes); err != nil {
			return nil, err
		}
		if templateID != nil {
			s.TemplateID = *templateID
		}
		sessions = append(sessions, s)
	}
	return sessions, rows.Err()
}

func (s *Service) GetSession(ctx context.Context, id, userID string) (*Session, error) {
	var sess Session
	var templateID *string
	err := s.db.QueryRow(ctx, `
    SELECT id, user_id, template_id, date::text, notes
    FROM sessions
    WHERE id = $1 AND user_id = $2
`, id, userID).Scan(&sess.ID, &sess.UserID, &templateID, &sess.Date, &sess.Notes)
	if err != nil {
		return nil, ErrNotFound
	}
	if templateID != nil {
		sess.TemplateID = *templateID
	}

	rows, err := s.db.Query(ctx, `
		SELECT ss.id, ss.session_id, ss.exercise_id, te.name, ss.set_number, ss.reps, ss.weight, ss.duration_seconds
		FROM session_sets ss
		JOIN template_exercises te ON te.id = ss.exercise_id
		WHERE ss.session_id = $1
		ORDER BY ss.exercise_id, ss.set_number
	`, id)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var set SessionSet
		if err := rows.Scan(&set.ID, &set.SessionID, &set.ExerciseID, &set.ExerciseName, &set.SetNumber, &set.Reps, &set.Weight, &set.DurationSeconds); err != nil {
			return nil, err
		}
		sess.Sets = append(sess.Sets, set)
	}
	return &sess, rows.Err()
}

func (s *Service) CreateSession(ctx context.Context, userID string, req CreateSessionRequest) (*Session, error) {
	var sess Session
	err := s.db.QueryRow(ctx, `
		INSERT INTO sessions (user_id, template_id, date, notes)
		VALUES ($1, $2, $3, $4)
		RETURNING id, user_id, template_id, date::text, notes
	`, userID, req.TemplateID, req.Date, req.Notes).Scan(&sess.ID, &sess.UserID, &sess.TemplateID, &sess.Date, &sess.Notes)
	if err != nil {
		return nil, err
	}
	return &sess, nil
}

func (s *Service) DeleteSession(ctx context.Context, id, userID string) error {
	tag, err := s.db.Exec(ctx,
		`DELETE FROM sessions WHERE id = $1 AND user_id = $2`, id, userID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

func (s *Service) AddSet(ctx context.Context, sessionID, userID string, req AddSetRequest) (*SessionSet, error) {
	var set SessionSet
	err := s.db.QueryRow(ctx, `
		INSERT INTO session_sets (session_id, exercise_id, set_number, reps, weight, duration_seconds)
		SELECT $1, $2, $3, $4, $5, $6
		FROM sessions
		WHERE id = $1 AND user_id = $7
		RETURNING id, session_id, exercise_id, set_number, reps, weight, duration_seconds		
	`, sessionID, req.ExerciseID, req.SetNumber, req.Reps, req.Weight, req.DurationSeconds, userID).Scan(&set.ID, &set.SessionID, &set.ExerciseID, &set.SetNumber, &set.Reps, &set.Weight, &set.DurationSeconds)
	if err != nil {
		return nil, ErrNotFound
	}
	return &set, nil
}

func (s *Service) UpdateSet(ctx context.Context, setID, userID string, req UpdateSetRequest) (*SessionSet, error) {
	var set SessionSet
	err := s.db.QueryRow(ctx, `
		UPDATE session_sets ss
		SET reps = COALESCE($1, ss.reps),
			weight = COALESCE($2, ss.weight),
			duration_seconds = COALESCE($3, ss.duration_seconds)
		FROM sessions s
		WHERE ss.id = $4 AND ss.session_id = s.id AND s.user_id = $5
		RETURNING ss.id, ss.session_id, ss.exercise_id, ss.set_number, ss.reps, ss.weight, ss.duration_seconds`, req.Reps, req.Weight, req.DurationSeconds, setID, userID).Scan(&set.ID, &set.SessionID, &set.ExerciseID, &set.SetNumber, &set.Reps, &set.Weight, &set.DurationSeconds)
	if err != nil {
		return nil, ErrNotFound
	}
	return &set, nil
}

func (s *Service) DeleteSet(ctx context.Context, setID, userID string) error {
	tag, err := s.db.Exec(ctx, `
		DELETE FROM session_sets ss
		USING sessions s
		WHERE ss.id = $1 AND session_id = s.id AND s.user_id = $2
	`, setID, userID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}
