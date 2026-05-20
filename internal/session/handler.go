package session

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/Oqaan/spotme/internal/middleware"
	"github.com/go-chi/chi/v5"
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
	if len(req.Date) == 0 {
		respondError(w, http.StatusBadRequest, "date is required")
		return
	}
	if len(req.Notes) > 500 {
		respondError(w, http.StatusBadRequest, "notes must be under 500 characters")
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
	if req.Reps < 0 || req.Reps > 10000 {
		respondError(w, http.StatusBadRequest, "invalid reps value")
		return
	}
	if req.Weight < 0 || req.Weight > 10000 {
		respondError(w, http.StatusBadRequest, "invalid weight value")
		return
	}
	if req.SetNumber < 1 || req.SetNumber > 1000 {
		respondError(w, http.StatusBadRequest, "invalid set number")
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

func (h *Handler) GetWeek(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)
	tz := r.URL.Query().Get("tz")
	dates, err := h.svc.GetWeek(r.Context(), userID, tz)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to fetch week")
		return
	}
	if dates == nil {
		dates = []string{}
	}
	respondJSON(w, http.StatusOK, map[string][]string{"dates": dates})
}

func (h *Handler) AddExerciseToSession(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)
	sessionID := chi.URLParam(r, "id")
	var req AddExerciseRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if len(req.Name) == 0 || len(req.Name) > 50 {
		respondError(w, http.StatusBadRequest, "exercise name must be between 1 and 50 characters")
		return
	}
	ex, err := h.svc.AddExerciseToSession(r.Context(), sessionID, userID, req)
	if errors.Is(err, ErrNotFound) {
		respondError(w, http.StatusNotFound, "session not found")
		return
	}
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to add exercise")
		return
	}
	respondJSON(w, http.StatusCreated, ex)
}

func respondJSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func respondError(w http.ResponseWriter, status int, msg string) {
	respondJSON(w, status, map[string]string{"error": msg})
}
