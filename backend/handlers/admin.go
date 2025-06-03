package handlers

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"

	"gosmooth/models"
)

// GetPlaces handles getting all places (admin only)
func GetPlaces(c *gin.Context) {
	var places []models.Place
	cursor, err := db.Collection("places").Find(c, bson.M{})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch places"})
		return
	}
	defer cursor.Close(c)

	if err = cursor.All(c, &places); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to decode places"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"places": places})
}

// CreatePlace handles creating a new place (admin only)
func CreatePlace(c *gin.Context) {
	var place models.Place
	if err := c.ShouldBindJSON(&place); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	place.CreatedAt = time.Now()
	place.UpdatedAt = time.Now()

	_, err := db.Collection("places").InsertOne(c, place)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create place"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"place": place})
}

// UpdatePlace handles updating a place (admin only)
func UpdatePlace(c *gin.Context) {
	id := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid place ID"})
		return
	}

	var input models.UpdatePlaceInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	update := bson.M{
		"$set": bson.M{
			"name":        input.Name,
			"description": input.Description,
			"location_id": input.LocationID,
			"updated_at":  time.Now(),
		},
	}

	result, err := db.Collection("places").UpdateOne(c, bson.M{"_id": objectID}, update)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update place"})
		return
	}

	if result.MatchedCount == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "place not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "place updated successfully"})
}

// DeletePlace handles deleting a place (admin only)
func DeletePlace(c *gin.Context) {
	id := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid place ID"})
		return
	}

	result, err := db.Collection("places").DeleteOne(c, bson.M{"_id": objectID})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete place"})
		return
	}

	if result.DeletedCount == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "place not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "place deleted successfully"})
}

// GetUsers handles getting all users
func GetUsers(c *gin.Context) {
	var users []models.User
	cursor, err := db.Collection("users").Find(context.Background(), bson.M{})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get users"})
		return
	}
	defer cursor.Close(context.Background())

	if err = cursor.All(context.Background(), &users); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to decode users"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"users": users})
}

// GetUser handles getting a single user
func GetUser(c *gin.Context) {
	id := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(id)
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

// UpdateUser handles updating a user
func UpdateUser(c *gin.Context) {
	id := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user ID"})
		return
	}

	var input models.UpdateUserInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	update := bson.M{
		"$set": bson.M{
			"updated_at": time.Now(),
		},
	}
	if input.Name != "" {
		update["$set"].(bson.M)["name"] = input.Name
	}
	if input.Role != "" {
		update["$set"].(bson.M)["role"] = input.Role
	}
	if input.Status != "" {
		update["$set"].(bson.M)["status"] = input.Status
	}
	if input.BanReason != "" {
		update["$set"].(bson.M)["ban_reason"] = input.BanReason
	}

	_, err = db.Collection("users").UpdateOne(context.Background(), bson.M{"_id": objectID}, update)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "user updated successfully"})
}

// DeleteUser handles deleting a user
func DeleteUser(c *gin.Context) {
	id := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user ID"})
		return
	}

	_, err = db.Collection("users").DeleteOne(context.Background(), bson.M{"_id": objectID})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "user deleted successfully"})
}

// GetStats handles getting system statistics
func GetStats(c *gin.Context) {
	// Get total users count
	usersCount, err := db.Collection("users").CountDocuments(context.Background(), bson.M{})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get users count"})
		return
	}

	// Get total reviews count
	reviewsCount, err := db.Collection("reviews").CountDocuments(context.Background(), bson.M{})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get reviews count"})
		return
	}

	// Get total route suggestions count
	routesCount, err := db.Collection("route_suggestions").CountDocuments(context.Background(), bson.M{})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get routes count"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"total_users":   usersCount,
		"total_reviews": reviewsCount,
		"total_routes":  routesCount,
		"last_updated":  time.Now(),
	})
}

// UploadImage handles image upload for places/locations (admin only)
func UploadImage(c *gin.Context) {
	file, err := c.FormFile("image")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file is received"})
		return
	}
	folderType := c.Query("type") // "places" หรือ "locations"
	name := c.Query("name")       // ชื่อสถานที่
	if folderType == "" || name == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "type and name are required"})
		return
	}
	// สร้าง path โฟลเดอร์
	uploadPath := fmt.Sprintf("./uploads/%s/%s", folderType, name)
	os.MkdirAll(uploadPath, os.ModePerm)
	// เซฟไฟล์
	filePath := fmt.Sprintf("%s/%s", uploadPath, file.Filename)
	if err := c.SaveUploadedFile(file, filePath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"})
		return
	}
	// ส่ง path กลับไป (frontend จะเอา path นี้ไปเก็บใน DB)
	relativePath := strings.TrimPrefix(filePath, ".")
	relativePath = strings.ReplaceAll(relativePath, "\\", "/") // สำหรับ Windows
	c.JSON(http.StatusOK, gin.H{"imageUrl": relativePath})
}
