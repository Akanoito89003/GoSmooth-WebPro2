package middleware

import (
	"net/http"
	"regexp"
	"strings"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

// ValidationError represents a validation error
type ValidationError struct {
	Field   string `json:"field"`
	Message string `json:"message"`
}

// ValidationErrors represents multiple validation errors
type ValidationErrors struct {
	Errors []ValidationError `json:"errors"`
}

// ValidateEmail checks if the email is valid
func ValidateEmail(email string) bool {
	emailRegex := regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)
	return emailRegex.MatchString(email)
}

// ValidatePassword checks if the password meets requirements
func ValidatePassword(password string) bool {
	// At least 8 characters, 1 uppercase, 1 lowercase, 1 number
	passwordRegex := regexp.MustCompile(`^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$`)
	return passwordRegex.MatchString(password)
}

// ValidateObjectID checks if the string is a valid MongoDB ObjectID
func ValidateObjectID(id string) bool {
	_, err := primitive.ObjectIDFromHex(id)
	return err == nil
}

// ValidateReview validates review creation/update request
func ValidateReview() gin.HandlerFunc {
	return func(c *gin.Context) {
		var errors []ValidationError

		// Validate rating
		rating := c.PostForm("rating")
		if rating == "" {
			errors = append(errors, ValidationError{
				Field:   "rating",
				Message: "Rating is required",
			})
		}

		// Validate comment
		comment := c.PostForm("comment")
		if comment == "" {
			errors = append(errors, ValidationError{
				Field:   "comment",
				Message: "Comment is required",
			})
		} else if len(comment) < 10 {
			errors = append(errors, ValidationError{
				Field:   "comment",
				Message: "Comment must be at least 10 characters long",
			})
		}

		// Validate placeId
		placeId := c.PostForm("placeId")
		if placeId == "" {
			errors = append(errors, ValidationError{
				Field:   "placeId",
				Message: "Place ID is required",
			})
		} else if !ValidateObjectID(placeId) {
			errors = append(errors, ValidationError{
				Field:   "placeId",
				Message: "Invalid Place ID format",
			})
		}

		if len(errors) > 0 {
			c.JSON(http.StatusBadRequest, ValidationErrors{Errors: errors})
			c.Abort()
			return
		}

		c.Next()
	}
}

// ValidateUserRegistration validates user registration request
func ValidateUserRegistration() gin.HandlerFunc {
	return func(c *gin.Context) {
		var errors []ValidationError

		// Validate name
		name := c.PostForm("name")
		if name == "" {
			errors = append(errors, ValidationError{
				Field:   "name",
				Message: "Name is required",
			})
		} else if len(strings.TrimSpace(name)) < 2 {
			errors = append(errors, ValidationError{
				Field:   "name",
				Message: "Name must be at least 2 characters long",
			})
		}

		// Validate email
		email := c.PostForm("email")
		if email == "" {
			errors = append(errors, ValidationError{
				Field:   "email",
				Message: "Email is required",
			})
		} else if !ValidateEmail(email) {
			errors = append(errors, ValidationError{
				Field:   "email",
				Message: "Invalid email format",
			})
		}

		// Validate password
		password := c.PostForm("password")
		if password == "" {
			errors = append(errors, ValidationError{
				Field:   "password",
				Message: "Password is required",
			})
		} else if !ValidatePassword(password) {
			errors = append(errors, ValidationError{
				Field:   "password",
				Message: "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number",
			})
		}

		if len(errors) > 0 {
			c.JSON(http.StatusBadRequest, ValidationErrors{Errors: errors})
			c.Abort()
			return
		}

		c.Next()
	}
}

// ValidateRoute validates route creation request
func ValidateRoute() gin.HandlerFunc {
	return func(c *gin.Context) {
		var errors []ValidationError

		// Validate origin
		origin := c.PostForm("origin")
		if origin == "" {
			errors = append(errors, ValidationError{
				Field:   "origin",
				Message: "Origin is required",
			})
		}

		// Validate destination
		destination := c.PostForm("destination")
		if destination == "" {
			errors = append(errors, ValidationError{
				Field:   "destination",
				Message: "Destination is required",
			})
		}

		// Validate transport mode
		transportMode := c.PostForm("transportMode")
		if transportMode == "" {
			errors = append(errors, ValidationError{
				Field:   "transportMode",
				Message: "Transport mode is required",
			})
		} else {
			validModes := map[string]bool{
				"driving": true,
				"walking": true,
				"cycling": true,
				"transit": true,
			}
			if !validModes[transportMode] {
				errors = append(errors, ValidationError{
					Field:   "transportMode",
					Message: "Invalid transport mode",
				})
			}
		}

		if len(errors) > 0 {
			c.JSON(http.StatusBadRequest, ValidationErrors{Errors: errors})
			c.Abort()
			return
		}

		c.Next()
	}
}
