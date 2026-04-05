package session

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/itsYuuuka/spotme/internal/middleware"
)

type Handler struct {
	svc *Service
}

func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

func (h *Handler) GetSessions(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)
	sessions, err := h.svc.GetSessions(r.Context(), userID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to fetch sessions")
		return
	}
	respondJSON(w, http.StatusOK, sessions)
}

func (h *Handler) GetSession(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)
	id := chi.URLParam(r, "id")
	session, err := h.svc.GetSession(r.Context(), id, userID)
	if errors.Is(err, ErrNotFound) {
		respondError(w, http.StatusNotFound, "session not found")
		return
	}
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to fetch session")
		return
	}
	respondJSON(w, http.StatusOK, session)
}

func (h *Handler) CreateSession(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)
	var req CreateSessionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	session, err := h.svc.CreateSession(r.Context(), userID, req)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to create session")
		return
	}
	respondJSON(w, http.StatusCreated, session)
}

func (h *Handler) DeleteSession(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)
	id := chi.URLParam(r, "id")
	err := h.svc.DeleteSession(r.Context(), id, userID)
	if errors.Is(err, ErrNotFound) {
		respondError(w, http.StatusNotFound, "session not found")
		return
	}
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to delete session")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) AddSet(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)
	sessionID := chi.URLParam(r, "id")
	var req AddSetRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	set, err := h.svc.AddSet(r.Context(), sessionID, userID, req)
	if errors.Is(err, ErrNotFound) {
		respondError(w, http.StatusNotFound, "session not found")
		return
	}
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to add set")
		return
	}
	respondJSON(w, http.StatusCreated, set)
}

func (h *Handler) UpdateSet(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)
	setID := chi.URLParam(r, "setId")
	var req UpdateSetRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	set, err := h.svc.UpdateSet(r.Context(), setID, userID, req)
	if errors.Is(err, ErrNotFound) {
		respondError(w, http.StatusNotFound, "set not found")
		return
	}
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to update set")
		return
	}
	respondJSON(w, http.StatusOK, set)
}

func (h *Handler) DeleteSet(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)
	setID := chi.URLParam(r, "setId")
	err := h.svc.DeleteSet(r.Context(), setID, userID)
	if errors.Is(err, ErrNotFound) {
		respondError(w, http.StatusNotFound, "set not found")
		return
	}
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to delete set")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func respondJSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func respondError(w http.ResponseWriter, status int, msg string) {
	respondJSON(w, status, map[string]string{"error": msg})
}
