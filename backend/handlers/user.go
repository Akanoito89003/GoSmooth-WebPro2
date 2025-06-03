package handlers

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"

	"gosmooth/middleware"
	"gosmooth/models"
)

// GetProfile handles getting user profile
func GetProfile(c *gin.Context) {
	userID := c.GetString("userID")
	objectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user ID"})
		return
	}

	var user models.User
	err = db.Collection("users").FindOne(context.Background(), bson.M{"_id": objectID}).Decode(&user)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"user": user})
}

// UpdateProfile handles updating user profile (name + address)
func UpdateProfile(c *gin.Context) {
	userID := c.GetString("userID")
	objectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user ID"})
		return
	}

	var input struct {
		Name    string         `json:"name" binding:"required"`
		Address models.Address `json:"address" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate address fields (optional: เพิ่ม validate เพิ่มเติม)
	if input.Address.Lat == 0 || input.Address.Lng == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid address coordinates"})
		return
	}

	update := bson.M{
		"$set": bson.M{
			"name":       input.Name,
			"address":    input.Address,
			"updated_at": time.Now(),
		},
	}

	_, err = db.Collection("users").UpdateOne(context.Background(), bson.M{"_id": objectID}, update)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update profile"})
		return
	}

	// ส่ง user กลับ (อัปเดตล่าสุด)
	var user models.User
	err = db.Collection("users").FindOne(context.Background(), bson.M{"_id": objectID}).Decode(&user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch updated user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"user": user, "message": "profile updated successfully"})
}

// RefreshToken handles token refresh
func RefreshToken(c *gin.Context) {
	userID := c.GetString("userID")
	token, err := middleware.GenerateToken(userID, true)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate token"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"token": token})
}

// Logout handles user logout
func Logout(c *gin.Context) {
	// In a JWT-based system, logout is typically handled client-side
	// by removing the token. The server doesn't need to do anything.
	c.JSON(http.StatusOK, gin.H{"message": "logged out successfully"})
}
