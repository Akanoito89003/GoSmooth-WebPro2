package handlers

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"

	"gosmooth/models"
)

// SuggestRoute handles route suggestions
func SuggestRoute(c *gin.Context) {
	var input models.RouteSuggestion
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Add user ID to suggestion
	userID := c.GetString("userID")
	input.UserID = userID
	input.CreatedAt = time.Now()

	result, err := db.Collection("route_suggestions").InsertOne(context.Background(), input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save route suggestion"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "route suggestion saved successfully",
		"id":      result.InsertedID,
	})
}

// GetRouteSuggestions handles getting route suggestions
func GetRouteSuggestions(c *gin.Context) {
	var suggestions []models.RouteSuggestion
	cursor, err := db.Collection("route_suggestions").Find(context.Background(), bson.M{})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get route suggestions"})
		return
	}
	defer cursor.Close(context.Background())

	if err = cursor.All(context.Background(), &suggestions); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to decode route suggestions"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"suggestions": suggestions})
}

// GetRouteSuggestion handles getting a single route suggestion
func GetRouteSuggestion(c *gin.Context) {
	id := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid route suggestion ID"})
		return
	}

	var suggestion models.RouteSuggestion
	err = db.Collection("route_suggestions").FindOne(context.Background(), bson.M{"_id": objectID}).Decode(&suggestion)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "route suggestion not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"suggestion": suggestion})
}

// UpdateRouteSuggestion handles updating a route suggestion
func UpdateRouteSuggestion(c *gin.Context) {
	id := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid route suggestion ID"})
		return
	}

	var input models.RouteSuggestion
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	update := bson.M{
		"$set": bson.M{
			"start_location": input.StartLocation,
			"end_location":   input.EndLocation,
			"description":    input.Description,
			"updated_at":     time.Now(),
		},
	}

	_, err = db.Collection("route_suggestions").UpdateOne(context.Background(), bson.M{"_id": objectID}, update)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update route suggestion"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "route suggestion updated successfully"})
}

// DeleteRouteSuggestion handles deleting a route suggestion
func DeleteRouteSuggestion(c *gin.Context) {
	id := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid route suggestion ID"})
		return
	}

	_, err = db.Collection("route_suggestions").DeleteOne(context.Background(), bson.M{"_id": objectID})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete route suggestion"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "route suggestion deleted successfully"})
}

// EstimateCost handles route cost estimation
func EstimateCost(c *gin.Context) {
	var input models.RouteInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// TODO: Implement cost estimation logic
	c.JSON(http.StatusOK, gin.H{
		"message": "cost estimation endpoint",
		"input":   input,
	})
}
