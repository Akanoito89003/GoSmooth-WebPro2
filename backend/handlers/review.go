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

// CreateReview handles creating a new review
func CreateReview(c *gin.Context) {
	var input models.Review
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Add user ID and timestamps
	userID := c.GetString("userID")
	input.UserID = userID
	input.CreatedAt = time.Now()
	input.UpdatedAt = time.Now()

	result, err := db.Collection("reviews").InsertOne(context.Background(), input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create review"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "review created successfully",
		"id":      result.InsertedID,
	})
}

// GetReviews handles getting all reviews
func GetReviews(c *gin.Context) {
	var reviews []models.Review
	cursor, err := db.Collection("reviews").Find(context.Background(), bson.M{})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get reviews"})
		return
	}
	defer cursor.Close(context.Background())

	if err = cursor.All(context.Background(), &reviews); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to decode reviews"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"reviews": reviews})
}

// GetReview handles getting a single review
func GetReview(c *gin.Context) {
	id := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid review ID"})
		return
	}

	var review models.Review
	err = db.Collection("reviews").FindOne(context.Background(), bson.M{"_id": objectID}).Decode(&review)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "review not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"review": review})
}

// UpdateReview handles updating a review
func UpdateReview(c *gin.Context) {
	id := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid review ID"})
		return
	}

	var input models.Review
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	update := bson.M{
		"$set": bson.M{
			"rating":     input.Rating,
			"comment":    input.Comment,
			"updated_at": time.Now(),
		},
	}

	_, err = db.Collection("reviews").UpdateOne(context.Background(), bson.M{"_id": objectID}, update)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update review"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "review updated successfully"})
}

// DeleteReview handles deleting a review
func DeleteReview(c *gin.Context) {
	id := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid review ID"})
		return
	}

	_, err = db.Collection("reviews").DeleteOne(context.Background(), bson.M{"_id": objectID})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete review"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "review deleted successfully"})
}
