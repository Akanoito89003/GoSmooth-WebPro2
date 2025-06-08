package handlers

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/google/uuid"

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

	// --- เพิ่ม logic คำนวณ rating จาก reviews ---
	for i, place := range places {
		reviewCursor, err := db.Collection("reviews").Find(c, bson.M{"place_id": place.ID})
		if err == nil {
			var reviews []struct {
				Rating int `bson:"rating"`
			}
			_ = reviewCursor.All(c, &reviews)
			total := 0
			for _, r := range reviews {
				total += r.Rating
			}
			if len(reviews) > 0 {
				places[i].Rating = float64(total) / float64(len(reviews))
			} else {
				places[i].Rating = 0.0
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{"places": places})
}

// CreatePlace handles creating a new place (admin only)
func CreatePlace(c *gin.Context) {
	var input models.UpdatePlaceInput
	if err := c.ShouldBindJSON(&input); err != nil {
		fmt.Printf("[DEBUG] CreatePlace ShouldBindJSON error: %v\n", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	fmt.Printf("[DEBUG] CreatePlace input: %+v\n", input)

	place := models.Place{
		ID:              primitive.NewObjectID().Hex(),
		Name:            input.Name,
		LocationID:      input.LocationID,
		Description:     input.Description,
		Category:        input.Category,
		CoverImage:      input.CoverImage,
		HighlightImages: input.Highlights,
		Coordinates:     models.Place{}.Coordinates, // จะ map ด้านล่าง
		Address:         input.Address,
		Phone:           input.Phone,
		Website:         input.Website,
		Hours:           input.Hours,
		CreatedAt:       time.Now(),
		UpdatedAt:       time.Now(),
	}
	// map coordinates
	place.Coordinates.Lat = input.Coordinates.Lat
	place.Coordinates.Lng = input.Coordinates.Lng

	fmt.Printf("[DEBUG] CreatePlace mapped place: %+v\n", place)

	_, err := db.Collection("places").InsertOne(c, place)
	if err != nil {
		fmt.Printf("[DEBUG] CreatePlace InsertOne error: %v\n", err)
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
		fmt.Printf("[DEBUG] UpdatePlace ShouldBindJSON error: %v\n", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	fmt.Printf("[DEBUG] UpdatePlace input: %+v\n", input)

	update := bson.M{
		"$set": bson.M{
			"name":             input.Name,
			"description":      input.Description,
			"location_id":      input.LocationID,
			"category":         input.Category,
			"address":          input.Address,
			"phone":            input.Phone,
			"website":          input.Website,
			"hours":            input.Hours,
			"cover_image":      input.CoverImage,
			"highlight_images": input.Highlights,
			"coordinates":      input.Coordinates,
			"updated_at":       time.Now(),
		},
	}

	result, err := db.Collection("places").UpdateOne(c, bson.M{"_id": objectID}, update)
	if err != nil {
		fmt.Printf("[DEBUG] UpdatePlace UpdateOne error: %v\n", err)
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
			"name":       input.Name,
			"role":       input.Role,
			"updated_at": time.Now(),
		},
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
	imgType := c.Query("imgType") // "cover" หรือ "highlight"
	if imgType == "" {
		imgType = "cover"
	}
	var uploadPath string
	if imgType == "cover" {
		uploadPath = "./uploads/CoverImage"
	} else {
		uploadPath = "./uploads/HighlightImages"
	}
	os.MkdirAll(uploadPath, os.ModePerm)

	ext := filepath.Ext(file.Filename)
	base := strings.TrimSuffix(file.Filename, ext)
	uniqueName := fmt.Sprintf("%s-%d-%s%s", base, time.Now().Unix(), uuid.New().String(), ext)
	filePath := fmt.Sprintf("%s/%s", uploadPath, uniqueName)

	if err := c.SaveUploadedFile(file, filePath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"})
		return
	}
	// ส่ง path กลับไป (frontend จะเอา path นี้ไปเก็บใน DB)
	var relativePath string
	if imgType == "cover" {
		relativePath = fmt.Sprintf("uploads/CoverImage/%s", uniqueName)
	} else {
		relativePath = fmt.Sprintf("uploads/HighlightImages/%s", uniqueName)
	}
	c.JSON(http.StatusOK, gin.H{"imageUrl": relativePath})
}

// BanUser handles banning a user (admin only)
func BanUser(c *gin.Context) {
	id := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user ID"})
		return
	}
	var input struct {
		Reason string `json:"reason"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	update := bson.M{
		"$set": bson.M{
			"status":     "banned",
			"ban_reason": input.Reason,
			"updated_at": time.Now(),
		},
	}
	_, err = db.Collection("users").UpdateOne(context.Background(), bson.M{"_id": objectID}, update)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to ban user"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "user banned"})
}

// UnbanUser handles unbanning a user (admin only)
func UnbanUser(c *gin.Context) {
	id := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user ID"})
		return
	}
	update := bson.M{
		"$set": bson.M{
			"status":     "active",
			"ban_reason": "",
			"updated_at": time.Now(),
		},
	}
	_, err = db.Collection("users").UpdateOne(context.Background(), bson.M{"_id": objectID}, update)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to unban user"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "user unbanned"})
}

// GetAllReviewReports (admin only)
func GetAllReviewReports(c *gin.Context) {
	status := c.Query("status")
	filter := bson.M{}
	if status != "" {
		filter["status"] = status
	}
	var reports []models.ReviewReport
	cursor, err := db.Collection("review_reports").Find(context.Background(), filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get reports"})
		return
	}
	defer cursor.Close(context.Background())
	if err = cursor.All(context.Background(), &reports); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to decode reports"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"reports": reports})
}

// UpdateReviewReportStatus (admin only)
func UpdateReviewReportStatus(c *gin.Context) {
	reportID := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(reportID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid report ID"})
		return
	}
	var input struct {
		Status string `json:"status" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil || input.Status == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "status is required"})
		return
	}
	update := bson.M{"$set": bson.M{"status": input.Status, "resolved_at": time.Now()}}
	_, err = db.Collection("review_reports").UpdateOne(context.Background(), bson.M{"_id": objectID}, update)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update report status"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "report status updated"})
}
