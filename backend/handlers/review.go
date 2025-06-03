package handlers

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"

	"gosmooth/models"
)

// CreateReview handles creating a new review
func CreateReview(c *gin.Context) {
	var input models.Review
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID := c.GetString("userID")
	objectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid user ID"})
		return
	}
	var user models.User
	if err := db.Collection("users").FindOne(context.Background(), bson.M{"_id": objectID}).Decode(&user); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not found"})
		return
	}
	input.UserID = userID
	input.Username = user.Name
	input.Likes = 0
	input.LikedBy = []string{}
	input.Comments = []models.Comment{}
	input.CreatedAt = time.Now()
	input.UpdatedAt = time.Now()

	// ถ้าไม่ได้ส่ง place_name มา ให้ map จาก DB
	if input.PlaceName == "" {
		var place models.Place
		placeObjID, _ := primitive.ObjectIDFromHex(input.PlaceID)
		err = db.Collection("places").FindOne(context.Background(), bson.M{"$or": []bson.M{{"_id": placeObjID}, {"place_id": input.PlaceID}}}).Decode(&place)
		if err == nil {
			input.PlaceName = place.Name
		}
	}

	// DEBUG LOG
	fmt.Println("DEBUG: input.PlaceID =", input.PlaceID)
	fmt.Println("DEBUG: input.PlaceName =", input.PlaceName)

	result, err := db.Collection("reviews").InsertOne(context.Background(), input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create review"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":   "review created successfully",
		"id":        result.InsertedID,
		"placeName": input.PlaceName,
	})
}

// LikeReview handles liking/unliking a review
func LikeReview(c *gin.Context) {
	reviewID := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(reviewID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid review ID"})
		return
	}

	userID := c.GetString("userID")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "missing user ID"})
		return
	}

	var review models.Review
	err = db.Collection("reviews").FindOne(context.Background(), bson.M{"_id": objectID}).Decode(&review)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "review not found"})
		return
	}

	liked := false
	for _, uid := range review.LikedBy {
		if uid == userID {
			liked = true
			break
		}
	}

	var update bson.M
	if liked {
		// Unlike
		update = bson.M{
			"$pull": bson.M{"liked_by": userID},
			"$inc":  bson.M{"likes": -1},
		}
	} else {
		// Like
		update = bson.M{
			"$addToSet": bson.M{"liked_by": userID},
			"$inc":      bson.M{"likes": 1},
		}
	}

	_, err = db.Collection("reviews").UpdateOne(context.Background(), bson.M{"_id": objectID}, update)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update like status"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "like toggled", "liked": !liked})
}

// AddComment handles adding a comment to a review
func AddComment(c *gin.Context) {
	reviewID := c.Param("id")
	reviewObjID, err := primitive.ObjectIDFromHex(reviewID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid review ID"})
		return
	}

	var input struct {
		Text string `json:"text" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID := c.GetString("userID")
	userObjID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid user ID"})
		return
	}

	var user models.User
	if err := db.Collection("users").FindOne(context.Background(), bson.M{"_id": userObjID}).Decode(&user); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not found"})
		return
	}

	comment := models.Comment{
		ID:        primitive.NewObjectID(),
		UserID:    userID,
		Username:  user.Name,
		Text:      input.Text,
		Likes:     0,
		LikedBy:   []string{},
		CreatedAt: time.Now(),
	}

	update := bson.M{"$push": bson.M{"comments": comment}}
	_, err = db.Collection("reviews").UpdateOne(context.Background(), bson.M{"_id": reviewObjID}, update)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to add comment"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "comment added", "comment": comment})
}

// LikeComment handles liking/unliking a comment on a review
func LikeComment(c *gin.Context) {
	reviewID := c.Param("id")
	commentID := c.Param("commentId")
	objectID, err := primitive.ObjectIDFromHex(reviewID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid review ID"})
		return
	}
	commentObjID, err := primitive.ObjectIDFromHex(commentID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid comment ID"})
		return
	}
	userID := c.GetString("userID")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "missing user ID"})
		return
	}

	// ดึง review
	var review models.Review
	err = db.Collection("reviews").FindOne(context.Background(), bson.M{"_id": objectID}).Decode(&review)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "review not found"})
		return
	}

	// หา comment ที่ต้องการ
	var liked bool
	for _, cmt := range review.Comments {
		if cmt.ID == commentObjID {
			for _, uid := range cmt.LikedBy {
				if uid == userID {
					liked = true
					break
				}
			}
			break
		}
	}

	var update bson.M
	if liked {
		// Unlike
		update = bson.M{
			"$pull": bson.M{"comments.$[elem].liked_by": userID},
			"$inc":  bson.M{"comments.$[elem].likes": -1},
		}
	} else {
		// Like
		update = bson.M{
			"$addToSet": bson.M{"comments.$[elem].liked_by": userID},
			"$inc":      bson.M{"comments.$[elem].likes": 1},
		}
	}

	arrayFilters := options.Update().SetArrayFilters(options.ArrayFilters{
		Filters: []interface{}{bson.M{"elem._id": commentObjID}},
	})

	_, err = db.Collection("reviews").UpdateOne(
		context.Background(),
		bson.M{"_id": objectID},
		update,
		arrayFilters,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update like status"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "like toggled", "liked": !liked})
}

// GetReviews handles getting all reviews (with user, place, comments, username)
func GetReviews(c *gin.Context) {
	placeId := c.Query("placeId")
	filter := bson.M{}
	if placeId != "" {
		filter["place_id"] = placeId
	}

	fmt.Println("[DEBUG] GetReviews placeId:", placeId)

	var reviews []models.Review
	cursor, err := db.Collection("reviews").Find(context.Background(), filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get reviews"})
		return
	}
	defer cursor.Close(context.Background())

	if err = cursor.All(context.Background(), &reviews); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to decode reviews"})
		return
	}

	fmt.Printf("[DEBUG] GetReviews found %d reviews\n", len(reviews))
	if len(reviews) > 0 {
		fmt.Printf("[DEBUG] First review: %+v\n", reviews[0])
	}

	// ดึง place ทั้งหมดมา map id -> name
	placeMap := map[string]string{}
	placeCursor, err := db.Collection("places").Find(context.Background(), bson.M{})
	if err == nil {
		var places []struct {
			ID   string `bson:"place_id" json:"place_id"`
			Name string `bson:"name" json:"name"`
		}
		_ = placeCursor.All(context.Background(), &places)
		for _, p := range places {
			placeMap[p.ID] = p.Name
		}
	}

	// เพิ่ม field place_name ให้แต่ละ review
	type ReviewWithPlaceName struct {
		models.Review
		PlaceName string `json:"place_name"`
	}
	var reviewsWithPlaceName []ReviewWithPlaceName
	for _, r := range reviews {
		placeName := r.PlaceName // ใช้ชื่อที่เก็บไว้ใน review ก่อน
		if placeName == "" {
			placeName = placeMap[r.PlaceID] // ถ้าไม่มี ค่อยหาใน placeMap
		}
		reviewsWithPlaceName = append(reviewsWithPlaceName, ReviewWithPlaceName{
			Review:    r,
			PlaceName: placeName,
		})
	}

	c.JSON(http.StatusOK, gin.H{"reviews": reviewsWithPlaceName})
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
