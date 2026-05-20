package session

import (
	"context"
	"errors"
	"time"

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
    	SELECT s.id, s.user_id, s.template_id, s.date::text, s.notes, COALESCE(t.name, '') as template_name
    	FROM sessions s
    	LEFT JOIN workout_templates t ON t.id = s.template_id
    	WHERE s.user_id = $1
    	ORDER BY s.created_at DESC
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var sessions []Session
	for rows.Next() {
		var s Session
		var templateID *string
		if err := rows.Scan(&s.ID, &s.UserID, &templateID, &s.Date, &s.Notes, &s.TemplateName); err != nil {
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
    WHERE id = $1 AND (
		user_id = $2
		OR user_id IN (
			SELECT CASE
				WHEN user_id = $2 THEN friend_id
				ELSE user_id
			END
			FROM friendships
			WHERE (user_id = $2 OR friend_id = $2) AND status = 'accepted'
		)
	)
`, id, userID).Scan(&sess.ID, &sess.UserID, &templateID, &sess.Date, &sess.Notes)
	if err != nil {
		return nil, ErrNotFound
	}
	if templateID != nil {
		sess.TemplateID = *templateID
	}

	rows, err := s.db.Query(ctx, `
    SELECT ss.id, ss.session_id,
           COALESCE(ss.exercise_id::text, ss.session_exercise_id::text) as exercise_id,
           COALESCE(te.name, se.name) as exercise_name,
           ss.set_number, ss.reps, ss.weight, ss.duration_seconds
    FROM session_sets ss
    LEFT JOIN template_exercises te ON te.id = ss.exercise_id
    LEFT JOIN session_exercises se ON se.id = ss.session_exercise_id
    WHERE ss.session_id = $1
    ORDER BY COALESCE(te.order_index, se.order_index), ss.set_number
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
	if req.SessionExerciseID != "" {
		err := s.db.QueryRow(ctx, `
            INSERT INTO session_sets (session_id, session_exercise_id, set_number, reps, weight, duration_seconds)
            SELECT $1, $2, $3, $4, $5, $6
            FROM sessions WHERE id = $1 AND user_id = $7
            RETURNING id, session_id, session_exercise_id as exercise_id, set_number, reps, weight, duration_seconds
        `, sessionID, req.SessionExerciseID, req.SetNumber, req.Reps, req.Weight, req.DurationSeconds, userID,
		).Scan(&set.ID, &set.SessionID, &set.ExerciseID, &set.SetNumber, &set.Reps, &set.Weight, &set.DurationSeconds)
		if err != nil {
			return nil, ErrNotFound
		}
	} else {
		err := s.db.QueryRow(ctx, `
            INSERT INTO session_sets (session_id, exercise_id, set_number, reps, weight, duration_seconds)
            SELECT $1, $2, $3, $4, $5, $6
            FROM sessions WHERE id = $1 AND user_id = $7
            RETURNING id, session_id, exercise_id, set_number, reps, weight, duration_seconds
        `, sessionID, req.ExerciseID, req.SetNumber, req.Reps, req.Weight, req.DurationSeconds, userID,
		).Scan(&set.ID, &set.SessionID, &set.ExerciseID, &set.SetNumber, &set.Reps, &set.Weight, &set.DurationSeconds)
		if err != nil {
			return nil, ErrNotFound
		}
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

func (s *Service) GetWeek(ctx context.Context, userID string, tz string) ([]string, error) {
	loc, err := time.LoadLocation(tz)
	if err != nil || tz == "" {
		loc = time.UTC
	}
	now := time.Now().In(loc)
	weekday := int(now.Weekday())
	if weekday == 0 {
		weekday = 7
	}
	monday := now.AddDate(0, 0, -(weekday - 1))
	start := monday.Format("2006-01-02")
	end := now.Format("2006-01-02")

	rows, err := s.db.Query(ctx, `
		SELECT DISTINCT date::text
		FROM sessions
		WHERE user_id = $1
		AND date >= $2
		AND date <= $3
		ORDER BY date ASC
	`, userID, start, end)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var dates []string
	for rows.Next() {
		var d string
		if err := rows.Scan(&d); err != nil {
			return nil, err
		}
		dates = append(dates, d)
	}
	return dates, rows.Err()
}

func (s *Service) AddExerciseToSession(ctx context.Context, sessionID, userID string, req AddExerciseRequest) (*SessionExercise, error) {
	var exists bool
	err := s.db.QueryRow(ctx,
		`SELECT EXISTS(SELECT 1 FROM sessions WHERE id = $1 AND user_id = $2)`,
		sessionID, userID,
	).Scan(&exists)
	if err != nil || !exists {
		return nil, ErrNotFound
	}

	var count int
	s.db.QueryRow(ctx,
		`SELECT COUNT(*) FROM session_exercises WHERE session_id = $1`,
		sessionID,
	).Scan(&count)

	var ex SessionExercise
	err = s.db.QueryRow(ctx, `
        INSERT INTO session_exercises (session_id, name, order_index)
        VALUES ($1, $2, $3)
        RETURNING id, session_id, name
    `, sessionID, req.Name, count).Scan(&ex.ID, &ex.SessionID, &ex.Name)
	if err != nil {
		return nil, err
	}
	return &ex, nil
}
