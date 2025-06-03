package handlers

import (
	"errors"
	"log"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/mongo"
)

// Custom error types
var (
	ErrNotFound     = errors.New("resource not found")
	ErrUnauthorized = errors.New("unauthorized access")
	ErrForbidden    = errors.New("forbidden access")
	ErrBadRequest   = errors.New("bad request")
	ErrInternal     = errors.New("internal server error")
	ErrDuplicateKey = errors.New("duplicate key error")
)

// ErrorResponse represents the structure of error responses
type ErrorResponse struct {
	Error   string `json:"error"`
	Message string `json:"message"`
	Code    int    `json:"code"`
}

// isDuplicateKeyError checks if the error is a MongoDB duplicate key error
func isDuplicateKeyError(err error) bool {
	if err == nil {
		return false
	}
	return strings.Contains(err.Error(), "duplicate key error") || strings.Contains(err.Error(), "E11000")
}

// HandleError handles different types of errors and returns appropriate responses
func HandleError(c *gin.Context, err error) {
	var statusCode int
	var message string

	switch {
	case errors.Is(err, ErrNotFound):
		statusCode = http.StatusNotFound
		message = "The requested resource was not found"
	case errors.Is(err, ErrUnauthorized):
		statusCode = http.StatusUnauthorized
		message = "Unauthorized access"
	case errors.Is(err, ErrForbidden):
		statusCode = http.StatusForbidden
		message = "Access forbidden"
	case errors.Is(err, ErrBadRequest):
		statusCode = http.StatusBadRequest
		message = "Invalid request"
	case errors.Is(err, mongo.ErrNoDocuments):
		statusCode = http.StatusNotFound
		message = "Resource not found"
	case isDuplicateKeyError(err):
		statusCode = http.StatusConflict
		message = "Resource already exists"
	default:
		statusCode = http.StatusInternalServerError
		message = "An internal server error occurred"
	}

	// Log the error
	log.Printf("[ERROR] %v", err)

	// Send error response
	c.JSON(statusCode, ErrorResponse{
		Error:   err.Error(),
		Message: message,
		Code:    statusCode,
	})
}

// HandleValidationError handles validation errors
func HandleValidationError(c *gin.Context, field string, message string) {
	c.JSON(http.StatusBadRequest, ErrorResponse{
		Error:   "validation_error",
		Message: message,
		Code:    http.StatusBadRequest,
	})
}

// HandleDatabaseError handles database-related errors
func HandleDatabaseError(c *gin.Context, err error) {
	if err == mongo.ErrNoDocuments {
		HandleError(c, ErrNotFound)
		return
	}
	if isDuplicateKeyError(err) {
		HandleError(c, ErrBadRequest)
		return
	}
	HandleError(c, ErrInternal)
}

// HandleAuthError handles authentication-related errors
func HandleAuthError(c *gin.Context, err error) {
	if err == nil {
		return
	}
	HandleError(c, ErrUnauthorized)
}

// HandlePermissionError handles permission-related errors
func HandlePermissionError(c *gin.Context, err error) {
	if err == nil {
		return
	}
	HandleError(c, ErrForbidden)
}

// HandleRequestError handles general request errors
func HandleRequestError(c *gin.Context, err error) {
	if err == nil {
		return
	}
	HandleError(c, ErrBadRequest)
}

// HandleInternalError handles internal server errors
func HandleInternalError(c *gin.Context, err error) {
	if err == nil {
		return
	}
	HandleError(c, ErrInternal)
}
