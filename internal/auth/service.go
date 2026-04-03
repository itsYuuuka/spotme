package auth

import (
	"context"
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"
)

var (
	ErrUserExists   = errors.New("email already registered")
	ErrInvalidCreds = errors.New("invalid email or password")
)

type Service struct {
	db        *pgxpool.Pool
	jwtSecret []byte
}

func NewService(db *pgxpool.Pool, jwtSecret string) *Service {
	return &Service{db: db, jwtSecret: []byte(jwtSecret)}
}

func (s *Service) Register(ctx context.Context, req RegisterRequest) (AuthResponse, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return AuthResponse{}, err
	}
	var id string
	err = s.db.QueryRow(ctx,
		`INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id`,
		req.Email, string(hash), req.Name,
	).Scan(&id)
	if err != nil {
		return AuthResponse{}, ErrUserExists
	}
	token, err := s.generateToken(id)
	if err != nil {
		return AuthResponse{}, err
	}
	return AuthResponse{Token: token, Name: req.Name}, nil
}

func (s *Service) Login(ctx context.Context, req LoginRequest) (AuthResponse, error) {
	var u User
	err := s.db.QueryRow(ctx,
		`SELECT id, email, name, password_hash FROM users WHERE email = $1`, req.Email,
	).Scan(&u.ID, &u.Email, &u.Name, &u.PasswordHash)
	if err != nil {
		return AuthResponse{}, ErrInvalidCreds
	}
	if err := bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(req.Password)); err != nil {
		return AuthResponse{}, ErrInvalidCreds
	}
	token, err := s.generateToken(u.ID)
	if err != nil {
		return AuthResponse{}, err
	}
	return AuthResponse{Token: token, Name: u.Name}, nil
}

func (s *Service) generateToken(userID string) (string, error) {
	claims := jwt.MapClaims{
		"sub": userID,
		"exp": time.Now().Add(7 * 24 * time.Hour).Unix(),
		"iat": time.Now().Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(s.jwtSecret)
}

func (s *Service) ValidateToken(tokenStr string) (string, error) {
	token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return s.jwtSecret, nil
	})
	if err != nil || !token.Valid {
		return "", errors.New("invalid token")
	}
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return "", errors.New("invalid claims")
	}
	return claims["sub"].(string), nil
}
