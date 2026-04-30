package friends

type Friendship struct {
	ID         string `json:"id"`
	UserID     string `json:"user_id"`
	FriendID   string `json:"friend_id"`
	FriendName string `json:"friend_name"`
	Status     string `json:"status"`
	CreatedAt  string `json:"created_at"`
}

type FriendRequest struct {
	FriendEmail string `json:"friend_email"`
}

type FeedItem struct {
	SessionID    string `json:"session_id"`
	UserName     string `json:"user_name"`
	TemplateName *string `json:"template_name"`
	Date         string `json:"date"`
	SetCount     int    `json:"set_count"`
}
