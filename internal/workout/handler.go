package workout

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/Oqaan/spotme/internal/middleware"
)

type Handler struct {
	svc *Service
}

func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

func (h *Handler) GetTemplates(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)
	templates, err := h.svc.GetTemplates(r.Context(), userID)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to fetch templates")
		return
	}
	respondJSON(w, http.StatusOK, templates)
}

func (h *Handler) GetTemplate(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)
	id := chi.URLParam(r, "id")
	template, err := h.svc.GetTemplate(r.Context(), id, userID)
	if errors.Is(err, ErrNotFound) {
		respondError(w, http.StatusNotFound, "template not found")
		return
	}
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to fetch template")
		return
	}
	respondJSON(w, http.StatusOK, template)
}

func (h *Handler) CreateTemplate(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)
	var req CreateTemplateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if len(req.Name) == 0 || len(req.Name) > 50 {
		respondError(w, http.StatusBadRequest, "template name must be between 1 and 50 characters")
		return
	}
	template, err := h.svc.CreateTemplate(r.Context(), userID, req)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to create template")
		return
	}
	respondJSON(w, http.StatusCreated, template)
}

func (h *Handler) UpdateTemplate(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)
	id := chi.URLParam(r, "id")
	var req UpdateTemplateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if len(req.Name) == 0 || len(req.Name) > 50 {
		respondError(w, http.StatusBadRequest, "template name must be between 1 and 50 characters")
		return
	}
	template, err := h.svc.UpdateTemplate(r.Context(), id, userID, req)
	if errors.Is(err, ErrNotFound) {
		respondError(w, http.StatusNotFound, "template not found")
		return
	}
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to update template")
		return
	}
	respondJSON(w, http.StatusOK, template)
}

func (h *Handler) DeleteTemplate(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)
	id := chi.URLParam(r, "id")
	err := h.svc.DeleteTemplate(r.Context(), id, userID)
	if errors.Is(err, ErrNotFound) {
		respondError(w, http.StatusNotFound, "template not found")
		return
	}
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to delete template")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) AddExercise(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)
	templateID := chi.URLParam(r, "id")
	var req CreateExerciseRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if len(req.Name) == 0 || len(req.Name) > 50 {
		respondError(w, http.StatusBadRequest, "exercise name must be between 1 and 50 characters")
		return
	}
	if msg := validateExerciseTargets(req.TargetSets, req.TargetReps, req.IsTimed); msg != "" {
		respondError(w, http.StatusBadRequest, msg)
		return
	}
	exercise, err := h.svc.AddExercise(r.Context(), templateID, userID, req)
	if errors.Is(err, ErrNotFound) {
		respondError(w, http.StatusNotFound, "template not found")
		return
	}
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to add exercise")
		return
	}
	respondJSON(w, http.StatusCreated, exercise)
}

func (h *Handler) UpdateExercise(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)
	exerciseID := chi.URLParam(r, "exerciseId")
	var req UpdateExerciseRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if len(req.Name) == 0 || len(req.Name) > 50 {
		respondError(w, http.StatusBadRequest, "exercise name must be between 1 and 50 characters")
		return
	}
	if msg := validateExerciseTargets(req.TargetSets, req.TargetReps, req.IsTimed); msg != "" {
		respondError(w, http.StatusBadRequest, msg)
		return
	}
	exercise, err := h.svc.UpdateExercise(r.Context(), exerciseID, userID, req)
	if errors.Is(err, ErrNotFound) {
		respondError(w, http.StatusNotFound, "exercise not found")
		return
	}
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to update exercise")
		return
	}
	respondJSON(w, http.StatusOK, exercise)
}

func (h *Handler) DeleteExercise(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r)
	exerciseID := chi.URLParam(r, "exerciseId")
	err := h.svc.DeleteExercise(r.Context(), exerciseID, userID)
	if errors.Is(err, ErrNotFound) {
		respondError(w, http.StatusNotFound, "exercise not found")
		return
	}
	if err != nil {
		respondError(w, http.StatusInternalServerError, "failed to delete exercise")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// validateExerciseTargets returns an error message, or "" if the targets are
// valid. Timed exercises are measured in duration rather than reps, so they may
// target 0 reps.
func validateExerciseTargets(sets, reps int, isTimed bool) string {
	if sets < 1 || sets > 100 {
		return "target sets must be between 1 and 100"
	}
	minReps := 1
	if isTimed {
		minReps = 0
	}
	if reps < minReps || reps > 1000 {
		if isTimed {
			return "target reps must be between 0 and 1000"
		}
		return "target reps must be between 1 and 1000"
	}
	return ""
}

func respondJSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func respondError(w http.ResponseWriter, status int, msg string) {
	respondJSON(w, status, map[string]string{"error": msg})
}
