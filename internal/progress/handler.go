package progress

import (
	"encoding/json"
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

func (h *Handler) GetAllProgress(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)
	progress, err := h.svc.GetAllProgress(r.Context(), userID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to fetch progress")
		return
	}
	respondJSON(w, http.StatusOK, progress)
}

func (h *Handler) GetExerciseProgress(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)
	exerciseID := chi.URLParam(r, "exerciseId")
	progress, err := h.svc.GetExerciseProgress(r.Context(), exerciseID, userID)
	if err != nil {
		respondError(w, http.StatusNotFound, "exercise not found")
		return
	}
	respondJSON(w, http.StatusOK, progress)
}

func respondJSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func respondError(w http.ResponseWriter, status int, msg string) {
	respondJSON(w, status, map[string]string{"error": msg})
}
