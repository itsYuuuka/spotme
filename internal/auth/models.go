package auth

type RegisterRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	Name     string `json:"name"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type AuthResponse struct {
	Token string `json:"token"`
	Name  string `json:"name"`
}

type User struct {
	ID           string
	Email        string
	Name         string
	PasswordHash string
}
