package handlers

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"golang.org/x/crypto/bcrypt"

	"gosmooth/middleware"
	"gosmooth/models"
	"gosmooth/utils"
)

var validate = validator.New()
var db *mongo.Database

// SetDB sets the database instance
func SetDB(database *mongo.Database) {
	db = database
}

func Register(c *gin.Context) {
	var input models.RegisterInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	// Check if email already exists
	var existingUser models.User
	err := db.Collection("users").FindOne(context.Background(), bson.M{"email": input.Email}).Decode(&existingUser)
	if err == nil {
		c.JSON(400, gin.H{"error": "Email already exists"})
		return
	}

	if !utils.IsValidPassword(input.Password) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Password must be at least 7 characters and contain at least one letter"})
		return
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(500, gin.H{"error": "Error hashing password"})
		return
	}

	// Create user
	user := models.User{
		ID:        primitive.NewObjectID(),
		Email:     input.Email,
		Password:  string(hashedPassword),
		Name:      input.Name,
		Role:      "user",
		Address:   input.Address,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
		Status:    "active",
	}

	_, err = db.Collection("users").InsertOne(context.Background(), user)
	if err != nil {
		c.JSON(500, gin.H{"error": "Error creating user"})
		return
	}

	c.JSON(201, gin.H{"message": "User registered successfully"})
}

func Login(c *gin.Context) {
	var credentials models.LoginCredentials
	if err := c.ShouldBindJSON(&credentials); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user models.User
	err := db.Collection("users").FindOne(context.Background(), bson.M{"email": credentials.Email}).Decode(&user)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		return
	}

	// เช็คว่าถูกแบนหรือไม่
	if user.Status == "banned" {
		c.JSON(http.StatusForbidden, gin.H{
			"error":     "Your account has been banned",
			"banReason": user.BanReason,
		})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(credentials.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		return
	}

	token, err := middleware.GenerateToken(user.ID.Hex(), credentials.RememberMe)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token": token,
		"user":  user,
	})
}

// ChangePassword handles changing user password
func ChangePassword(c *gin.Context) {
	userID := c.GetString("userID")
	objectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user ID"})
		return
	}

	var input struct {
		CurrentPassword string `json:"currentPassword" binding:"required"`
		NewPassword     string `json:"newPassword" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		fmt.Println("DEBUG: ChangePassword input bind error:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	fmt.Printf("DEBUG: ChangePassword input: currentPassword=%s, newPassword=%s\n", input.CurrentPassword, input.NewPassword)

	// ดึง user
	var user models.User
	err = db.Collection("users").FindOne(context.Background(), bson.M{"_id": objectID}).Decode(&user)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	// ตรวจสอบรหัสผ่านเดิม
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.CurrentPassword)); err != nil {
		fmt.Println("DEBUG: ChangePassword password mismatch error:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "current password is incorrect"})
		return
	}

	// Validate รหัสผ่านใหม่
	if !utils.IsValidPassword(input.NewPassword) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Password must be at least 7 characters and contain at least one letter"})
		return
	}

	// Hash รหัสผ่านใหม่
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to hash new password"})
		return
	}

	// อัปเดตรหัสผ่าน
	_, err = db.Collection("users").UpdateOne(context.Background(), bson.M{"_id": objectID}, bson.M{
		"$set": bson.M{
			"password":   string(hashedPassword),
			"updated_at": time.Now(),
		},
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update password"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Password changed successfully"})
}
