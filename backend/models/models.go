package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// User represents a user in the system
type User struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Email     string             `bson:"email" json:"email" validate:"required,email"`
	Password  string             `bson:"password" json:"-"`
	Name      string             `bson:"name" json:"name" validate:"required"`
	Role      string             `bson:"role" json:"role"`
	Status    string             `bson:"status" json:"status"`
	BanReason string             `bson:"ban_reason,omitempty" json:"ban_reason,omitempty"`
	Address   Address            `bson:"address,omitempty" json:"address,omitempty"`
	CreatedAt time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt time.Time          `bson:"updated_at" json:"updated_at"`
}

// RegisterInput represents the input for user registration
type RegisterInput struct {
	Email    string  `json:"email" validate:"required,email"`
	Password string  `json:"password" validate:"required,min=6"`
	Name     string  `json:"name" validate:"required"`
	Address  Address `json:"address" validate:"required"`
}

// LoginCredentials represents the input for user login
type LoginCredentials struct {
	Email      string `json:"email" validate:"required,email"`
	Password   string `json:"password" validate:"required"`
	RememberMe bool   `json:"remember_me"`
}

// UpdateProfileInput represents the input for updating user profile
type UpdateProfileInput struct {
	Name string `json:"name" validate:"required"`
}

// UpdateUserInput represents the input for updating user (admin only)
type UpdateUserInput struct {
	Name      string `json:"name"`
	Role      string `json:"role"`
	Status    string `json:"status"`
	BanReason string `json:"ban_reason,omitempty"`
}

// Comment represents a comment on a review
type Comment struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	UserID    string             `bson:"user_id" json:"user_id"`
	Username  string             `bson:"username" json:"username"`
	Text      string             `bson:"text" json:"text"`
	Likes     int                `bson:"likes" json:"likes"`
	LikedBy   []string           `bson:"liked_by" json:"liked_by"`
	CreatedAt time.Time          `bson:"created_at" json:"created_at"`
}

// Review represents a user review
type Review struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	UserID    string             `bson:"user_id" json:"user_id"`
	Username  string             `bson:"username" json:"username"`
	PlaceID   string             `bson:"place_id" json:"placeId"`
	PlaceName string             `bson:"place_name" json:"placeName"`
	Rating    int                `bson:"rating" json:"rating" validate:"required,min=1,max=5"`
	Comment   string             `bson:"comment" json:"comment" validate:"required"`
	Likes     int                `bson:"likes" json:"likes"`
	LikedBy   []string           `bson:"liked_by" json:"liked_by"`
	Comments  []Comment          `bson:"comments" json:"comments"`
	CreatedAt time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt time.Time          `bson:"updated_at" json:"updated_at"`
}

// RouteSuggestion represents a route suggestion
type RouteSuggestion struct {
	ID            primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	UserID        string             `bson:"user_id" json:"user_id"`
	StartLocation string             `bson:"start_location" json:"start_location" validate:"required"`
	EndLocation   string             `bson:"end_location" json:"end_location" validate:"required"`
	Description   string             `bson:"description" json:"description"`
	CreatedAt     time.Time          `bson:"created_at" json:"created_at"`
	UpdatedAt     time.Time          `bson:"updated_at" json:"updated_at"`
}

// RouteInput represents the input for route cost estimation
type RouteInput struct {
	StartLocation string  `json:"start_location" validate:"required"`
	EndLocation   string  `json:"end_location" validate:"required"`
	Distance      float64 `json:"distance" validate:"required"`
	Duration      int     `json:"duration" validate:"required"` // in minutes
}

// Location represents a geographical location with details
type Location struct {
	ID          string `bson:"location_id" json:"LocationID"`
	Name        string `bson:"name" json:"Name"`
	Description string `bson:"description" json:"Description"`
}

// Route represents a route between two locations
type Route struct {
	ID            primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	StartLocID    string             `bson:"start_loc_id" json:"StartLocID"`
	EndLocID      string             `bson:"end_loc_id" json:"EndLocID"`
	Distance      float64            `bson:"distance" json:"Distance"`
	Duration      int                `bson:"duration" json:"Duration"`
	Cost          float64            `bson:"cost" json:"Cost"`
	TransportMode string             `bson:"transport_mode" json:"TransportMode"`
	CreatedAt     time.Time          `bson:"created_at" json:"CreatedAt"`
	UpdatedAt     time.Time          `bson:"updated_at" json:"UpdatedAt"`
}

// Place represents a place in the system
type Place struct {
	ObjectID        primitive.ObjectID `bson:"_id,omitempty" json:"_id"`
	ID              string             `bson:"place_id" json:"PlaceID"`
	Name            string             `bson:"name" json:"Name"`
	LocationID      string             `bson:"location_id" json:"LocationID"`
	LocationName    string             `bson:"location_name,omitempty" json:"LocationName,omitempty"`
	Description     string             `bson:"description" json:"Description"`
	Category        string             `bson:"category" json:"Category"`
	CoverImage      string             `bson:"cover_image" json:"CoverImage"`
	HighlightImages []string           `bson:"highlight_images" json:"HighlightImages"`
	Rating          float64            `bson:"rating" json:"Rating"`
	Coordinates     struct {
		Lat float64 `bson:"lat" json:"lat"`
		Lng float64 `bson:"lng" json:"lng"`
	} `bson:"coordinates" json:"Coordinates"`
	Address   string    `bson:"address" json:"Address"`
	Phone     string    `bson:"phone" json:"Phone"`
	Website   string    `bson:"website" json:"Website"`
	Hours     string    `bson:"hours" json:"Hours"`
	CreatedAt time.Time `bson:"created_at" json:"CreatedAt"`
	UpdatedAt time.Time `bson:"updated_at" json:"UpdatedAt"`
}

// UpdatePlaceInput represents the input for updating a place
type UpdatePlaceInput struct {
	Name        string `json:"name" validate:"required"`
	Description string `json:"description"`
	LocationID  string `json:"location_id" validate:"required"`
}

// Address represents the address of a user
type Address struct {
	AddressLine string  `bson:"addressLine,omitempty" json:"addressLine,omitempty"`
	City        string  `bson:"city,omitempty" json:"city,omitempty"`
	Province    string  `bson:"province,omitempty" json:"province,omitempty"`
	Zipcode     string  `bson:"zipcode,omitempty" json:"zipcode,omitempty"`
	Country     string  `bson:"country,omitempty" json:"country,omitempty"`
	Lat         float64 `bson:"lat,omitempty" json:"lat,omitempty"`
	Lng         float64 `bson:"lng,omitempty" json:"lng,omitempty"`
}
