package friends

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5/pgxpool"
)

var (
	ErrNotFound       = errors.New("friendship not found")
	ErrAlreadyFriends = errors.New("already friends or request pending")
	ErrUserNotFound   = errors.New("user not found")
)

type Service struct {
	db *pgxpool.Pool
}

func NewService(db *pgxpool.Pool) *Service {
	return &Service{db: db}
}

func (s *Service) GetFriends(ctx context.Context, userID string) ([]Friendship, error) {
	rows, err := s.db.Query(ctx, `
		SELECT f.id, f.user_id, f.friend_id, u.name, f.status, f.created_at::text
		FROM friendships f
		JOIN users u ON u.id = CASE
			WHEN f.user_id = $1 THEN f.friend_id
			ELSE f.user_id
		END
		WHERE f.user_id = $1 OR f.friend_id = $1
		ORDER BY f.created_at DESC
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var friends []Friendship
	for rows.Next() {
		var f Friendship
		if err := rows.Scan(&f.ID, &f.UserID, &f.FriendID, &f.FriendName, &f.Status, &f.CreatedAt); err != nil {
			return nil, err
		}
		friends = append(friends, f)
	}
	return friends, rows.Err()
}

func (s *Service) SendRequest(ctx context.Context, userID, friendEmail string) error {
	var friendID string
	err := s.db.QueryRow(ctx,
		`SELECT id FROM users WHERE email = $1`, friendEmail,
	).Scan(&friendID)
	if err != nil {
		return ErrUserNotFound
	}

	_, err = s.db.Exec(ctx, `
		INSERT INTO friendships (user_id, friend_id, status)
		VALUES ($1, $2, 'pending')
	`, userID, friendID)
	if err != nil {
		return ErrAlreadyFriends
	}
	return nil
}

func (s *Service) AcceptRequest(ctx context.Context, friendshipID, userID string) error {
	tag, err := s.db.Exec(ctx, `
		UPDATE friendships
		SET status = 'accepted'
		WHERE id = $1 AND friend_id = $2 AND status = 'pending'
	`, friendshipID, userID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

func (s *Service) GetFeed(ctx context.Context, userID string) ([]FeedItem, error) {
	rows, err := s.db.Query(ctx, `
		SELECT s.id, u.name, wt.name, s.date::text, COUNT(ss.id)
		FROM sessions s
		JOIN users u ON u.id = s.user_id
		LEFT JOIN workout_templates wt ON wt.id = s.template_id
		LEFT JOIN session_sets ss ON ss.session_id = s.id
		WHERE s.user_id IN (
			SELECT CASE
				WHEN user_id = $1 THEN friend_id
				ELSE user_id
			END
			FROM friendships
			WHERE (user_id = $1 OR friend_id = $1) AND status = 'accepted'
		)
		GROUP BY s.id, u.name, wt.name, s.date
		ORDER BY s.date DESC
		LIMIT 20
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var feed []FeedItem
	for rows.Next() {
		var item FeedItem
		if err := rows.Scan(&item.SessionID, &item.UserName, &item.TemplateName, &item.Date, &item.SetCount); err != nil {
			return nil, err
		}
		feed = append(feed, item)
	}
	return feed, rows.Err()
}
