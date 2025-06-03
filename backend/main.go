package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"golang.org/x/crypto/bcrypt"

	"gosmooth/handlers"
	"gosmooth/middleware"
	"gosmooth/models"
)

var db *mongo.Database

// Custom error response structure
type ErrorResponse struct {
	Error   string `json:"error"`
	Message string `json:"message"`
	Code    int    `json:"code"`
}

// Error logging middleware
func ErrorLogger() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Next()

		// Check if there are any errors
		if len(c.Errors) > 0 {
			// Log the error
			for _, e := range c.Errors {
				log.Printf("[ERROR] %v", e.Error())
			}

			// Get the last error
			err := c.Errors.Last()

			// Create error response
			errorResponse := ErrorResponse{
				Error:   err.Error(),
				Message: "An error occurred while processing your request",
				Code:    c.Writer.Status(),
			}

			// Send error response
			c.JSON(c.Writer.Status(), errorResponse)
		}
	}
}

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Fatal("Error loading .env file:", err)
	}

	// Set up logging
	logFile, err := os.OpenFile("app.log", os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		log.Fatal("Error opening log file:", err)
	}
	defer logFile.Close()
	log.SetOutput(logFile)

	// Connect to MongoDB with retry logic
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var client *mongo.Client
	maxRetries := 3
	for i := 0; i < maxRetries; i++ {
		client, err = mongo.Connect(ctx, options.Client().ApplyURI(os.Getenv("MONGODB_URI")))
		if err == nil {
			break
		}
		log.Printf("MongoDB connection attempt %d failed: %v", i+1, err)
		time.Sleep(time.Second * time.Duration(i+1))
	}
	if err != nil {
		log.Fatal("Failed to connect to MongoDB after", maxRetries, "attempts:", err)
	}
	defer client.Disconnect(ctx)

	// Ping MongoDB to verify connection
	if err := client.Ping(ctx, nil); err != nil {
		log.Fatal("Failed to ping MongoDB:", err)
	}

	db = client.Database(os.Getenv("DB_NAME"))

	// Initialize database with indexes and initial data
	if err := initializeDatabase(ctx); err != nil {
		log.Fatal("Error initializing database:", err)
	}

	// Initialize handlers and middleware with database
	handlers.SetDB(db)
	middleware.SetDB(db)

	// Initialize router with custom error handling
	router := gin.New() // Use gin.New() instead of gin.Default() to customize middleware
	router.Use(gin.Recovery())
	router.Use(ErrorLogger())

	// Configure CORS with more specific settings
	allowOrigins := []string{"http://localhost:5173"}
	router.Use(cors.New(cors.Config{
		AllowOrigins:     allowOrigins,
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization", "X-Requested-With"},
		ExposeHeaders:    []string{"Content-Length", "Content-Range"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// Routes
	setupRoutes(router)

	// Serve static files for uploads with security headers
	router.Static("/uploads", "./uploads")

	// Start server with graceful shutdown
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// Create a server with custom timeouts
	srv := &http.Server{
		Addr:         ":" + port,
		Handler:      router,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Start server in a goroutine
	go func() {
		log.Printf("Server starting on port %s...", port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatal("Failed to start server:", err)
		}
	}()

	// Wait for interrupt signal to gracefully shutdown the server
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Shutting down server...")

	// Create shutdown context with timeout
	ctx, cancel = context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatal("Server forced to shutdown:", err)
	}

	log.Println("Server exiting")
}

func initializeDatabase(ctx context.Context) error {
	// Create indexes
	collections := map[string][]mongo.IndexModel{
		"users": {
			{
				Keys:    bson.D{{Key: "email", Value: 1}},
				Options: options.Index().SetUnique(true),
			},
		},
		"reviews": {
			{
				Keys: bson.D{{Key: "user_id", Value: 1}},
			},
		},
		"route_suggestions": {
			{
				Keys: bson.D{{Key: "user_id", Value: 1}},
			},
		},
		"places": {
			{
				Keys: bson.D{{Key: "name", Value: 1}},
			},
		},
	}

	for collection, indexes := range collections {
		_, err := db.Collection(collection).Indexes().CreateMany(ctx, indexes)
		if err != nil {
			return err
		}
	}

	// Create admin user if not exists
	var adminUser models.User
	err := db.Collection("users").FindOne(ctx, bson.M{"email": "Admin001@go-smooth.co.th"}).Decode(&adminUser)
	if err == mongo.ErrNoDocuments {
		// Set admin password to meet new requirements: at least 1 letter, minimum 7 characters
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte("goadmin7"), bcrypt.DefaultCost)
		if err != nil {
			return err
		}

		adminUser = models.User{
			ID:        primitive.NewObjectID(),
			Email:     "Admin001@go-smooth.co.th",
			Password:  string(hashedPassword),
			Name:      "Admin",
			Role:      "admin",
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		}

		_, err = db.Collection("users").InsertOne(ctx, adminUser)
		if err != nil {
			return err
		}
		log.Println("Admin user created successfully")
	}

	// --- เพิ่มข้อมูล Location ---
	initialLocations := []models.Location{
		{ID: "1", Name: "กรุงเทพมหานคร", Description: "กรุงเทพมหานคร เมืองหลวงและศูนย์กลางทางเศรษฐกิจ การเมือง และวัฒนธรรมของประเทศไทย เต็มไปด้วยวัดและพระบรมมหาราชวังสำคัญอย่างวัดพระแก้ว และแหล่งช็อปปิงทันสมัยเช่น สยามพารากอน พร้อมด้วยระบบขนส่งมวลชนทั้ง BTS, MRT และเรือคลอง"},
		{ID: "2", Name: "เชียงใหม่", Description: "เชียงใหม่ เมืองใหญ่ในภาคเหนือของไทย มีประวัติศาสตร์ยาวนานกับโบราณสถานอย่างวัดพระสิงห์ และวัดเจดีย์หลวง อยู่ท่ามกลางภูเขาและธรรมชาติ สามารถเที่ยวชมสวนดอกไม้ริมดอยอินทนนท์ และสัมผัสวิถีชีวิตชาวเขาเผ่าต่างๆ"},
		{ID: "3", Name: "เชียงราย", Description: "เชียงราย จังหวัดชายแดนภาคเหนือ ที่มีสถาปัตยกรรมร่วมสมัยของวัดร่องขุ่น และวัดร่องเสือเต้น อีกทั้งยังเป็นประตูสู่สามเหลี่ยมทองคำ สามารถล่องเรือชมแม่น้ำแม่โขง และขึ้นภูชี้ฟ้าเพื่อชมทะเลหมอก"},
		{ID: "4", Name: "บุรีรัมย์", Description: "บุรีรัมย์ จังหวัดในภาคอีสานที่มีปราสาทหินพนมรุ้งเป็นแหล่งมรดกทางวัฒนธรรม และสนามฟุตบอลบุรีรัมย์ยูไนเต็ด เป็นศูนย์รวมกีฬาสำคัญ นอกจากนี้ยังมีพิพิธภัณฑ์สถานแสดงเรื่องราวประวัติศาสตร์สุวรรณภูมิ"},
		{ID: "5", Name: "อุบลราชธานี", Description: "อุบลราชธานี จังหวัดริมแม่น้ำโขง มีประเพณีแห่เทียนพรรษาที่ยิ่งใหญ่ วัดทุ่งศรีเมือง ซีเมตตาธรรมสถาน และเป็นทางผ่านสู่แก่งหินผาฮีในฤดูน้ำหลาก"},
		{ID: "6", Name: "ระยอง", Description: "ระยอง จังหวัดชายฝั่งทะเลตะวันออก มีชายหาดยอดนิยมอย่างหาดแหลมแม่พิมพ์ เกาะเสม็ด และพิพิธภัณฑ์สัตว์น้ำ สถานตากอากาศที่ผสมผสานเกษตรกรรมกับการท่องเที่ยวทางทะเล"},
		{ID: "7", Name: "ชลบุรี", Description: "ชลบุรี จังหวัดชายฝั่งทะเลตะวันออก มีเมืองท่องเที่ยวชื่อดังอย่างพัทยา สวนน้ำ และเกาะล้าน นอกจากนี้ยังเป็นศูนย์กลางอุตสาหกรรมและท่าเรือสำคัญของประเทศไทย"},
		{ID: "8", Name: "กาญจนบุรี", Description: "กาญจนบุรี จังหวัดที่มีประวัติศาสตร์สงครามโลกครั้งที่ 2 กับสะพานข้ามแม่น้ำแคว อุทยานแห่งชาติน้ำตกเอราวัณ และเส้นทางเที่ยวน้ำตกไทรโยคน้อย"},
		{ID: "9", Name: "กระบี่", Description: "กระบี่ จังหวัดในภาคใต้ที่มีชายหาดขาว เกาะแก่งหินปูนสูงชัน เช่น อ่าวนาง, อ่าวมาหยา รวมถึงอุทยานแห่งชาติหาดนพรัตน์ธารา-หมู่เกาะพีพี"},
		{ID: "10", Name: "พังงา", Description: "พังงา จังหวัดชายฝั่งอันดามัน มีอ่าวพังงาเกาะเจมส์บอนด์ (เกาะตาปู) ถ้ำลอดเขาพิงกัน และอุทยานแห่งชาติหมู่เกาะสิมิลัน"},
		{ID: "11", Name: "สุราษฎร์ธานี", Description: "สุราษฎร์ธานี จังหวัดภาคใต้ที่เป็นทางผ่านไปยังเกาะสมุย เกาะพะงัน และเขื่อนเชี่ยวหลาน มีตลาดน้ำและวิถีชีวิตริมแม่น้ำตาปี"},
	}
	for _, loc := range initialLocations {
		var existing models.Location
		err := db.Collection("locations").FindOne(ctx, bson.M{"location_id": loc.ID}).Decode(&existing)
		if err == mongo.ErrNoDocuments {
			_, err = db.Collection("locations").InsertOne(ctx, loc)
			if err != nil {
				return err
			}
		}
	}
	log.Println("Initial locations created")

	// --- เพิ่มข้อมูล Places ---
	initialPlaces := []models.Place{
		{
			ID:          "1",
			Name:        "คาเฟ่จิม ทอมป์สัน",
			LocationID:  "1",
			Description: "คาเฟ่ในพิพิธภัณฑ์ จิม ทอมป์สัน เสิร์ฟกาแฟพิเศษและขนมหวานโฮมเมดในบรรยากาศบ้านไทยโบราณ",
			Category:    "Cafe",
			CoverImage:  "CoverImage/Jim-Thompson-Silk-Café-1.jpg",
			HighlightImages: []string{
				"HighlightImages/Jim-Thompson-Silk-Café-1.jpg",
				"HighlightImages/Jim-Thompson-Silk-Café-2.jpg",
				"HighlightImages/Jim-Thompson-Silk-Café-3.jpg",
				"HighlightImages/Jim-Thompson-Silk-Café-4.png",
				"HighlightImages/Jim-Thompson-Silk-Café-5.jpg",
				"HighlightImages/Jim-Thompson-Silk-Café-6.jpg",
			},
			Rating: 4.3,
			Coordinates: struct {
				Lat float64 `bson:"lat" json:"lat"`
				Lng float64 `bson:"lng" json:"lng"`
			}{Lat: 13.7491, Lng: 100.5282},
			Address:   "ถนนพระราม 1 แขวงวังใหม่ เขตปทุมวัน กรุงเทพมหานคร",
			Phone:     "02-623-5500",
			Website:   "https://jimthompsonrestaurant.com/restaurant/silk-cafe/",
			Hours:     "10:00น. - 20:00น. เปิดทุกวัน",
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
		{
			ID:          "2",
			Name:        "แผงขนมตลาดนัดจตุจักร",
			LocationID:  "1",
			Description: "แผงสตรีทฟู้ดภายในตลาดนัดจตุจักรที่รวบรวมขนมและของว่างพื้นเมืองไทย ทั้งกล้วยทอด มันทอด ข้าวเหนียวมะม่วง ปาท่องโก๋ และน้ำผลไม้สดคั้นสด เสิร์ฟร้อน ๆ จากเตา",
			Category:    "Food Stall",
			CoverImage:  "CoverImage/Chatuchak-Snack-Stall-1.jpg",
			HighlightImages: []string{
				"HighlightImages/Chatuchak-Snack-Stall-1.jpg",
				"HighlightImages/Chatuchak-Snack-Stall-2.jpg",
				"HighlightImages/Chatuchak-Snack-Stall-3.jpg",
				"HighlightImages/Chatuchak-Snack-Stall-4.jpg",
				"HighlightImages/Chatuchak-Snack-Stall-5.jpg",
			},
			Rating: 4.0,
			Coordinates: struct {
				Lat float64 `bson:"lat" json:"lat"`
				Lng float64 `bson:"lng" json:"lng"`
			}{Lat: 13.8, Lng: 100.5539},
			Address:   "ถนนกำแพงเพชร 2 แขวงจตุจักร เขตจตุจักร กรุงเทพมหานคร",
			Phone:     "02-272-8008",
			Website:   "https://www.chatuchakmarket.org/",
			Hours:     "06:00น. - 18:00น. ศุกร์–อาทิตย์",
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
		{
			ID:          "3",
			Name:        "ศูนย์อาหารเทอร์มินอล 21",
			LocationID:  "1",
			Description: "ศูนย์อาหารภายใน Terminal 21 ชั้น LG มีร้านอาหารไทย จีน ญี่ปุ่น เกาหลี และฟู้ดทรัค ให้เลือกมากกว่า 20 ร้าน",
			Category:    "Food Court",
			CoverImage:  "CoverImage/Pier-21-Food-Court-1.jpg",
			HighlightImages: []string{
				"HighlightImages/Pier-21-Food-Court-1.jpg",
				"HighlightImages/Pier-21-Food-Court-2.jpg",
				"HighlightImages/Pier-21-Food-Court-3.jpg",
				"HighlightImages/Pier-21-Food-Court-4.jpg",
				"HighlightImages/Pier-21-Food-Court-5.jpg",
			},
			Rating: 4.3,
			Coordinates: struct {
				Lat float64 `bson:"lat" json:"lat"`
				Lng float64 `bson:"lng" json:"lng"`
			}{Lat: 13.7378, Lng: 100.5624},
			Address:   "88 ถนนสุขุมวิท แขวงคลองเตยเหนือ เขตวัฒนา กรุงเทพมหานคร",
			Phone:     "02-108-0808",
			Website:   "https://www.terminal21.co.th/",
			Hours:     "10:00น. - 22:00น. เปิดทุกวัน",
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
		{
			ID:          "4",
			Name:        "เส้นทางวิ่งสวนลุมพินี",
			LocationID:  "1",
			Description: "เส้นทางวิ่งออกกำลังกายในสวนลุมพินี ระยะทางประมาณ 2.5 กิโลเมตร ล้อมรอบด้วยต้นไม้ใหญ่และทะเลสาบ",
			Category:    "Activity",
			CoverImage:  "CoverImage/Lumpini-Park-Jogging-Track-1.jpg",
			HighlightImages: []string{
				"HighlightImages/Lumpini-Park-Jogging-Track-1.jpg",
				"HighlightImages/Lumpini-Park-Jogging-Track-2.jpg",
				"HighlightImages/Lumpini-Park-Jogging-Track-3.jpg",
				"HighlightImages/Lumpini-Park-Jogging-Track-4.jpg",
				"HighlightImages/Lumpini-Park-Jogging-Track-5.png",
			},
			Rating: 4.0,
			Coordinates: struct {
				Lat float64 `bson:"lat" json:"lat"`
				Lng float64 `bson:"lng" json:"lng"`
			}{Lat: 13.73, Lng: 100.5413},
			Address:   "ถนนพระรามที่ 4 แขวงลุมพินี เขตปทุมวัน กรุงเทพมหานคร",
			Phone:     "02-252-7006",
			Website:   "https://www.tourismthailand.org/Attraction/lumpini-park",
			Hours:     "05:00น. - 21:00น. เปิดทุกวัน",
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
		{
			ID:          "5",
			Name:        "สยามโอเชียนเวิลด์",
			LocationID:  "1",
			Description: "พิพิธภัณฑ์สัตว์น้ำใต้ดินขนาดใหญ่ในห้างสยามพารากอน ครอบคลุมพื้นที่กว่า 10,000 ตารางเมตร มีตู้จัดแสดงมากกว่า 30 โซน",
			Category:    "Attraction",
			CoverImage:  "CoverImage/Siam-Ocean-World-1.jpg",
			HighlightImages: []string{
				"HighlightImages/Siam-Ocean-World-1.jpg",
				"HighlightImages/Siam-Ocean-World-2.jpg",
				"HighlightImages/Siam-Ocean-World-3.jpg",
				"HighlightImages/Siam-Ocean-World-4.png",
				"HighlightImages/Siam-Ocean-World-5.jpg",
			},
			Rating: 4.5,
			Coordinates: struct {
				Lat float64 `bson:"lat" json:"lat"`
				Lng float64 `bson:"lng" json:"lng"`
			}{Lat: 13.7465, Lng: 100.5343},
			Address:   "991 ถนนพระรามที่ 1 แขวงปทุมวัน เขตปทุมวัน กรุงเทพมหานคร (สยามพารากอน)",
			Phone:     "02-610-1111",
			Website:   "https://www.siamaquarium.com/",
			Hours:     "10:00น. - 21:00น. เปิดทุกวัน",
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
		{
			ID:          "6",
			Name:        "ยอดดอยอินทนนท์",
			LocationID:  "2",
			Description: "The highest peak in Thailand at 2,565 m, with panoramic views over the surrounding misty mountains.",
			Category:    "Attraction",
			CoverImage:  "CoverImage/Doi-Inthanon-Summit-1.jpg",
			HighlightImages: []string{
				"HighlightImages/Doi-Inthanon-Summit-1.jpg",
				"HighlightImages/Doi-Inthanon-Summit-2.jpg",
				"HighlightImages/Doi-Inthanon-Summit-3.jpg",
			},
			Rating: 4.7,
			Coordinates: struct {
				Lat float64 `bson:"lat" json:"lat"`
				Lng float64 `bson:"lng" json:"lng"`
			}{Lat: 18.587797, Lng: 98.486963},
			Address:   "ตำบลบ้านหลวง อำเภอจอมทอง จังหวัดเชียงใหม่",
			Phone:     "053-286-880",
			Website:   "https://doiinthanon099.com/",
			Hours:     "06:00น. - 18:00น. เปิดทุกวัน",
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
		{
			ID:          "7",
			Name:        "น้ำตกวชิรธาร",
			LocationID:  "2",
			Description: "A seven‐tiered waterfall with emerald pools, accessible via a short trail from the park road.",
			Category:    "Attraction",
			CoverImage:  "CoverImage/Wachirathan-Waterfall-1.jpg",
			HighlightImages: []string{
				"HighlightImages/Wachirathan-Waterfall-1.jpg",
				"HighlightImages/Wachirathan-Waterfall-2.jpg",
				"HighlightImages/Wachirathan-Waterfall-3.jpg",
			},
			Rating: 4.5,
			Coordinates: struct {
				Lat float64 `bson:"lat" json:"lat"`
				Lng float64 `bson:"lng" json:"lng"`
			}{Lat: 18.542306, Lng: 98.597306},
			Address:   "อุทยานแห่งชาติดอยอินทนนท์ อำเภอจอมทอง จังหวัดเชียงใหม่",
			Phone:     "053-298-505",
			Website:   "https://www.thainationalparks.com/wachirathan-waterfall",
			Hours:     "07:00น. - 16:00น. เปิดทุกวัน",
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
		{
			ID:          "8",
			Name:        "วัดเจดีย์หลวง",
			LocationID:  "2",
			Description: "Ruined 14th-century Lanna chedi, once housing the Emerald Buddha, now framed by ancient walls.",
			Category:    "Temple",
			CoverImage:  "CoverImage/Wat-Chedi-Luang-1.jpg",
			HighlightImages: []string{
				"HighlightImages/Wat-Chedi-Luang-1.jpg",
				"HighlightImages/Wat-Chedi-Luang-2.jpg",
			},
			Rating: 4.4,
			Coordinates: struct {
				Lat float64 `bson:"lat" json:"lat"`
				Lng float64 `bson:"lng" json:"lng"`
			}{Lat: 18.787007, Lng: 98.986489},
			Address:   "ถนนพระปกเกล้า ตำบลพระสิงห์ อำเภอเมืองเชียงใหม่ จังหวัดเชียงใหม่",
			Phone:     "053-278-026",
			Website:   "http://www.watchediluang-chiangmai.com/",
			Hours:     "08:00น. - 17:00น. เปิดทุกวัน",
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
		{
			ID:          "9",
			Name:        "วัดพระสิงห์",
			LocationID:  "2",
			Description: "Historic Lanna temple enshrining the revered Phra Buddha Sihing statue.",
			Category:    "Temple",
			CoverImage:  "CoverImage/Wat-Phra-Singh-1.jpg",
			HighlightImages: []string{
				"HighlightImages/Wat-Phra-Singh-1.jpg",
				"HighlightImages/Wat-Phra-Singh-2.jpg",
			},
			Rating: 4.6,
			Coordinates: struct {
				Lat float64 `bson:"lat" json:"lat"`
				Lng float64 `bson:"lng" json:"lng"`
			}{Lat: 18.788534, Lng: 98.981353},
			Address:   "ถนนสามล้าน ตำบลพระสิงห์ อำเภอเมืองเชียงใหม่ จังหวัดเชียงใหม่",
			Phone:     "053-248-128",
			Website:   "http://www.watphrasingh-chiangmai.com/",
			Hours:     "06:00น. - 18:00น. เปิดทุกวัน",
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
		{
			ID:          "10",
			Name:        "นิทรรศการวัดร่องขุ่น",
			LocationID:  "3",
			Description: "Contemporary art exhibits and sculptural installations within the White Temple complex.",
			Category:    "Museum",
			CoverImage:  "CoverImage/Wat-Rong-Khun-Exhibits-1.jpeg",
			HighlightImages: []string{
				"HighlightImages/Wat-Rong-Khun-Exhibits-1.jpeg",
				"HighlightImages/Wat-Rong-Khun-Exhibits-2.jpg",
				"HighlightImages/Wat-Rong-Khun-Exhibits-3.webp",
				"HighlightImages/Wat-Rong-Khun-Exhibits-4.jpg",
				"HighlightImages/Wat-Rong-Khun-Exhibits-5.webp",
			},
			Rating: 4.8,
			Coordinates: struct {
				Lat float64 `bson:"lat" json:"lat"`
				Lng float64 `bson:"lng" json:"lng"`
			}{Lat: 19.8247, Lng: 99.7633},
			Address:   "ตำบลป่าอ้อดอนชัย อำเภอเมืองเชียงราย จังหวัดเชียงราย",
			Phone:     "052-079-942",
			Website:   "https://www.whitereligion.org/",
			Hours:     "08:00น. - 17:00น. เปิดทุกวัน",
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
		{
			ID:          "11",
			Name:        "จุดถ่ายภาพปราสาทพนมรุ้ง",
			LocationID:  "4",
			Description: "The best vantage for capturing the alignment of Khmer gateways atop the extinct volcano.",
			Category:    "Attraction",
			CoverImage:  "CoverImage/Phanom-Rung-Photo-Point-1.webp",
			HighlightImages: []string{
				"HighlightImages/Phanom-Rung-Photo-Point-1.webp",
				"HighlightImages/Phanom-Rung-Photo-Point-2.jpg",
				"HighlightImages/Phanom-Rung-Photo-Point-3.webp",
				"HighlightImages/Phanom-Rung-Photo-Point-4.jpg",
				"HighlightImages/Phanom-Rung-Photo-Point-5.jpg",
			},
			Rating: 4.7,
			Coordinates: struct {
				Lat float64 `bson:"lat" json:"lat"`
				Lng float64 `bson:"lng" json:"lng"`
			}{Lat: 14.531856, Lng: 102.940299},
			Address:   "ตำบลตาเป๊ก อำเภอเฉลิมพระเกียรติ จังหวัดบุรีรัมย์",
			Phone:     "044-611-397",
			Website:   "https://www.phanomrung.go.th/",
			Hours:     "04:00น. - 18:30น. เปิดทุกวัน",
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
		{
			ID:          "12",
			Name:        "ภาพเขียนสีผาแต้ม",
			LocationID:  "5",
			Description: "Prehistoric cliff art comprising over 300 red and ochre pictographs along the Mekong River.",
			Category:    "Attraction",
			CoverImage:  "CoverImage/Pha-Taem-Cliff-Paintings-1.jpg",
			HighlightImages: []string{
				"HighlightImages/Pha-Taem-Cliff-Paintings-1.jpg",
				"HighlightImages/Pha-Taem-Cliff-Paintings-2.jpg",
				"HighlightImages/Pha-Taem-Cliff-Paintings-3.png",
				"HighlightImages/Pha-Taem-Cliff-Paintings-4.png",
				"HighlightImages/Pha-Taem-Cliff-Paintings-5.png",
			},
			Rating: 4.6,
			Coordinates: struct {
				Lat float64 `bson:"lat" json:"lat"`
				Lng float64 `bson:"lng" json:"lng"`
			}{Lat: 15.4213, Lng: 105.532},
			Address:   "อุทยานแห่งชาติผาแต้ม อำเภอโขงเจียม จังหวัดอุบลราชธานี",
			Phone:     "045-239-604",
			Website:   "https://www.pha-taem.go.th/",
			Hours:     "07:30น. - 16:30น. เปิดทุกวัน",
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
		{
			ID:          "13",
			Name:        "หาดอ่าวพร้าว",
			LocationID:  "6",
			Description: "Secluded west‑facing beach on Ko Samet, famed for calm waters and golden sunsets.",
			Category:    "Beach",
			CoverImage:  "CoverImage/Ao-Prao-Beach-1.jpg",
			HighlightImages: []string{
				"HighlightImages/Ao-Prao-Beach-1.jpg",
				"HighlightImages/Ao-Prao-Beach-2.jpg",
			},
			Rating: 4.5,
			Coordinates: struct {
				Lat float64 `bson:"lat" json:"lat"`
				Lng float64 `bson:"lng" json:"lng"`
			}{Lat: 12.56778, Lng: 101.45472},
			Address:   "เกาะเสม็ด ตำบลเพ อำเภอเมืองระยอง จังหวัดระยอง",
			Phone:     "038-652-329",
			Website:   "https://www.tourismthailand.org/Attraction/ao-prao-beach",
			Hours:     "เปิดทุกวัน 24 ชั่วโมง",
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
		{
			ID:          "14",
			Name:        "สาธิตการแกะสลักไม้",
			LocationID:  "7",
			Description: "Live demonstrations of traditional Thai woodcarving within the all‑wood museum.",
			Category:    "Activity",
			CoverImage:  "CoverImage/Sanctuary-Workshop-1.jpg",
			HighlightImages: []string{
				"HighlightImages/Sanctuary-Workshop-1.jpg",
				"HighlightImages/Sanctuary-Workshop-2.jpg",
			},
			Rating: 4.4,
			Coordinates: struct {
				Lat float64 `bson:"lat" json:"lat"`
				Lng float64 `bson:"lng" json:"lng"`
			}{Lat: 12.97278, Lng: 100.88889},
			Address:   "ถนนราชดำเนิน ตำบลบางปลาสร้อย อำเภอเมืองชลบุรี จังหวัดชลบุรี",
			Phone:     "038-427-200",
			Website:   "https://www.chonburicity.go.th/",
			Hours:     "09:00น. - 17:00น. เปิดทุกวัน",
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
		{
			ID:          "15",
			Name:        "น้ำตกเอราวัณ ชั้นที่ 7",
			LocationID:  "8",
			Description: "The highest emerald‑green pool of the seven-tiered Erawan Waterfall system.",
			Category:    "Attraction",
			CoverImage:  "CoverImage/Erawan-Falls-Tier7-1.jpg",
			HighlightImages: []string{
				"HighlightImages/Erawan-Falls-Tier7-1.jpg",
				"HighlightImages/Erawan-Falls-Tier7-2.jpg",
				"HighlightImages/Erawan-Falls-Tier7-3.jpg",
				"HighlightImages/Erawan-Falls-Tier7-4.jpg",
				"HighlightImages/Erawan-Falls-Tier7-5.jpg",
			},
			Rating: 4.7,
			Coordinates: struct {
				Lat float64 `bson:"lat" json:"lat"`
				Lng float64 `bson:"lng" json:"lng"`
			}{Lat: 14.3833, Lng: 99.1167},
			Address:   "อุทยานแห่งชาติเอราวัณ อำเภอศรีสวัสดิ์ จังหวัดกาญจนบุรี",
			Phone:     "034-541-000",
			Website:   "https://www.thainationalparks.com/erawan-waterfall",
			Hours:     "08:00น. - 15:00น. เปิดทุกวัน",
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
		{
			ID:          "16",
			Name:        "น้ำตกไทรโยคน้อย",
			LocationID:  "8",
			Description: "Popular limestone plunge waterfall located next to the terminus of the Death Railway.",
			Category:    "Attraction",
			CoverImage:  "CoverImage/Sai-Yok-Noi-Waterfall-1.jpg",
			HighlightImages: []string{
				"HighlightImages/Sai-Yok-Noi-Waterfall-1.jpg",
				"HighlightImages/Sai-Yok-Noi-Waterfall-2.jpg",
				"HighlightImages/Sai-Yok-Noi-Waterfall-3.jpg",
				"HighlightImages/Sai-Yok-Noi-Waterfall-4.jpg",
				"HighlightImages/Sai-Yok-Noi-Waterfall-5.jpg",
			},
			Rating: 4.5,
			Coordinates: struct {
				Lat float64 `bson:"lat" json:"lat"`
				Lng float64 `bson:"lng" json:"lng"`
			}{Lat: 14.41778, Lng: 98.74722},
			Address:   "ตำบลท่าเสา อำเภอไทรโยค จังหวัดกาญจนบุรี",
			Phone:     "034-589-621",
			Website:   "https://www.thainationalparks.com/sai-yok-waterfall",
			Hours:     "06:00น. - 18:00น. เปิดทุกวัน",
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
		{
			ID:          "17",
			Name:        "รถไฟข้ามสะพานแม่น้ำแคว",
			LocationID:  "8",
			Description: "Heritage train journey across the iconic WWII-era steel bridge in Kanchanaburi.",
			Category:    "Activity",
			CoverImage:  "CoverImage/River-Kwai-Bridge-Train-Ride-1.jpg",
			HighlightImages: []string{
				"HighlightImages/River-Kwai-Bridge-Train-Ride-1.jpg",
				"HighlightImages/River-Kwai-Bridge-Train-Ride-2.jpg",
				"HighlightImages/River-Kwai-Bridge-Train-Ride-3.jpg",
				"HighlightImages/River-Kwai-Bridge-Train-Ride-4.jpg",
				"HighlightImages/River-Kwai-Bridge-Train-Ride-5.webp",
			},
			Rating: 4.6,
			Coordinates: struct {
				Lat float64 `bson:"lat" json:"lat"`
				Lng float64 `bson:"lng" json:"lng"`
			}{Lat: 14.003611, Lng: 99.538333},
			Address:   "ตำบลท่ามะขาม อำเภอเมืองกาญจนบุรี จังหวัดกาญจนบุรี",
			Phone:     "034-512-414",
			Website:   "https://www.railway.co.th/",
			Hours:     "09:00น. - 16:00น. เปิดทุกวัน",
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
		{
			ID:          "18",
			Name:        "อ่าวมาหยา",
			LocationID:  "9",
			Description: "World-famous cove with towering cliffs and white sands, featured in The Beach.",
			Category:    "Beach",
			CoverImage:  "CoverImage/Maya-Bay-1.jpg",
			HighlightImages: []string{
				"HighlightImages/Maya-Bay-1.jpg",
				"HighlightImages/Maya-Bay-2.jpg",
			},
			Rating: 4.4,
			Coordinates: struct {
				Lat float64 `bson:"lat" json:"lat"`
				Lng float64 `bson:"lng" json:"lng"`
			}{Lat: 7.676761, Lng: 98.766067},
			Address:   "เกาะพีพีเล ตำบลอ่าวนาง อำเภอเมืองกระบี่ จังหวัดกระบี่",
			Phone:     "075-620-550",
			Website:   "https://www.phiphi.phuket.com/maya-bay.html",
			Hours:     "08:00น. - 17:00น. เปิดทุกวัน",
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
		{
			ID:          "19",
			Name:        "เกาะเจมส์บอนด์",
			LocationID:  "10",
			Description: "Limestone karst island (Khao Phing Kan) and Ko Tapu, made famous in The Man with the Golden Gun.",
			Category:    "Attraction",
			CoverImage:  "CoverImage/James-Bond-Island-1.jpg",
			HighlightImages: []string{
				"HighlightImages/James-Bond-Island-1.jpg",
				"HighlightImages/James-Bond-Island-2.jpg",
			},
			Rating: 4.5,
			Coordinates: struct {
				Lat float64 `bson:"lat" json:"lat"`
				Lng float64 `bson:"lng" json:"lng"`
			}{Lat: 8.283, Lng: 98.6},
			Address:   "อุทยานแห่งชาติอ่าวพังงา ตำบลเกาะปันหยี อำเภอเมืองพังงา จังหวัดพังงา",
			Phone:     "076-481-602",
			Website:   "https://www.phangnga.dnp.go.th/",
			Hours:     "08:00น. - 17:00น. เปิดทุกวัน",
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
		{
			ID:          "20",
			Name:        "ล่องเรือทะเลสาบเชี่ยวหลาน",
			LocationID:  "11",
			Description: "Scenic guided boat excursions on the 165 km² Rajjaprapha Reservoir beneath towering limestone cliffs.",
			Category:    "Activity",
			CoverImage:  "CoverImage/Cheow-Lan-Lake-Boat-Tour-1.jpg",
			HighlightImages: []string{
				"HighlightImages/Cheow-Lan-Lake-Boat-Tour-1.jpg",
				"HighlightImages/Cheow-Lan-Lake-Boat-Tour-2.jpg",
				"HighlightImages/Cheow-Lan-Lake-Boat-Tour-3.jpg",
				"HighlightImages/Cheow-Lan-Lake-Boat-Tour-4.png",
				"HighlightImages/Cheow-Lan-Lake-Boat-Tour-5.png",
			},
			Rating: 4.8,
			Coordinates: struct {
				Lat float64 `bson:"lat" json:"lat"`
				Lng float64 `bson:"lng" json:"lng"`
			}{Lat: 8.9184, Lng: 98.8154},
			Address:   "เขื่อนรัชชประภา อุทยานแห่งชาติเขาสก อำเภอบ้านตาขุน จังหวัดสุราษฎร์ธานี",
			Phone:     "077-427-150",
			Website:   "https://www.khaosokdoc.com/",
			Hours:     "08:00น. - 17:00น. เปิดทุกวัน",
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
		{
			ID:          "21",
			Name:        "Bangkok National Museum",
			LocationID:  "1",
			Description: "พิพิธภัณฑสถานแห่งชาติกรุงเทพฯ บอกเล่าประวัติศาสตร์ไทยผ่านโบราณวัตถุและงานศิลป์",
			Category:    "Museum",
			CoverImage:  "CoverImage/Bangkok-National-Museum-1.jpg",
			HighlightImages: []string{
				"HighlightImages/Bangkok-National-Museum-1.jpg",
				"HighlightImages/Bangkok-National-Museum-2.jpg",
				"HighlightImages/Bangkok-National-Museum-3.jpg",
				"HighlightImages/Bangkok-National-Museum-4.jpg",
				"HighlightImages/Bangkok-National-Museum-5.jpg",
			},
			Rating: 4.2,
			Coordinates: struct {
				Lat float64 `bson:"lat" json:"lat"`
				Lng float64 `bson:"lng" json:"lng"`
			}{Lat: 13.7579, Lng: 100.4951},
			Address:   "Na Phra That Rd, Phra Borom Maha Ratchawang, Phra Nakhon, Bangkok 10200",
			Phone:     "02-224-1333",
			Website:   "https://www.museumthailand.com/Attraction/Bangkok-National-Museum",
			Hours:     "09:00น. - 16:00น. ปิดวันจันทร์",
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
		{
			ID:          "22",
			Name:        "Grand Palace",
			LocationID:  "1",
			Description: "พระบรมมหาราชวังเก่าแก่ สถาปัตยกรรมไทยอันวิจิตร และวัดพระศรีรัตนศาสดาราม",
			Category:    "Palace",
			CoverImage:  "CoverImage/Grand-Palace-1.webp",
			HighlightImages: []string{
				"HighlightImages/Grand-Palace-1.webp",
				"HighlightImages/Grand-Palace-2.jpg",
				"HighlightImages/Grand-Palace-3.jpg",
				"HighlightImages/Grand-Palace-4.jpg",
				"HighlightImages/Grand-Palace-5.jpg",
			},
			Rating: 4.7,
			Coordinates: struct {
				Lat float64 `bson:"lat" json:"lat"`
				Lng float64 `bson:"lng" json:"lng"`
			}{Lat: 13.7500, Lng: 100.4913},
			Address:   "Na Phra Lan Rd, Phra Nakhon, Bangkok 10200",
			Phone:     "02-623-5500",
			Website:   "https://www.royalgrandpalace.th/",
			Hours:     "08:30น. - 15:30น. เปิดทุกวัน",
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
		{
			ID:          "23",
			Name:        "Khao San Road",
			LocationID:  "1",
			Description: "ถนนคนเดินชื่อดัง แหล่งช็อปปิง ร้านอาหาร และชีวิตกลางคืน",
			Category:    "Street",
			CoverImage:  "CoverImage/Khao-San-Road-1.jpg",
			HighlightImages: []string{
				"HighlightImages/Khao-San-Road-1.jpg",
				"HighlightImages/Khao-San-Road-2.jpg",
				"HighlightImages/Khao-San-Road-3.jpg",
				"HighlightImages/Khao-San-Road-4.png",
				"HighlightImages/Khao-San-Road-5.png",
			},
			Rating: 4.1,
			Coordinates: struct {
				Lat float64 `bson:"lat" json:"lat"`
				Lng float64 `bson:"lng" json:"lng"`
			}{Lat: 13.7580, Lng: 100.4975},
			Address:   "Khao San Rd, Talat Yot, Phra Nakhon, Bangkok 10200",
			Phone:     "",
			Website:   "https://www.khaosanroad.com/",
			Hours:     "เปิดทุกวัน 24 ชั่วโมง",
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
		{
			ID:          "24",
			Name:        "Lumpini Park",
			LocationID:  "1",
			Description: "สวนสาธารณะใจกลางเมือง เหมาะสำหรับพักผ่อน เดินเล่น และออกกำลังกาย",
			Category:    "Park",
			CoverImage:  "CoverImage/Lumpini-Park-1.jpg",
			HighlightImages: []string{
				"HighlightImages/Lumpini-Park-1.jpg",
				"HighlightImages/Lumpini-Park-2.jpg",
				"HighlightImages/Lumpini-Park-3.jpg",
				"HighlightImages/Lumpini-Park-4.jpg",
				"HighlightImages/Lumpini-Park-5.webp",
			},
			Rating: 4.5,
			Coordinates: struct {
				Lat float64 `bson:"lat" json:"lat"`
				Lng float64 `bson:"lng" json:"lng"`
			}{Lat: 13.7300, Lng: 100.5418},
			Address:   "Rama IV Rd, Pathum Wan, Bangkok 10330",
			Phone:     "",
			Website:   "https://www.bangkok.go.th/lumpinipark",
			Hours:     "05:00น. - 21:00น. เปิดทุกวัน",
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
		{
			ID:          "25",
			Name:        "MBK Center",
			LocationID:  "1",
			Description: "ศูนย์การค้าหรู มีแบรนด์เนม โรงภาพยนตร์ อควาเรียม และศูนย์อาหารระดับพรีเมียม",
			Category:    "Shopping Mall",
			CoverImage:  "CoverImage/MBK-Center-1.webp",
			HighlightImages: []string{
				"HighlightImages/MBK-Center-1.webp",
				"HighlightImages/MBK-Center-2.jpg",
				"HighlightImages/MBK-Center-3.jpg",
				"HighlightImages/MBK-Center-4.jpg",
				"HighlightImages/MBK-Center-5.jpg",
			},
			Rating: 4.2,
			Coordinates: struct {
				Lat float64 `bson:"lat" json:"lat"`
				Lng float64 `bson:"lng" json:"lng"`
			}{Lat: 13.7461, Lng: 100.5298},
			Address:   "444 Phaya Thai Rd, Wang Mai, Pathum Wan, Bangkok 10330",
			Phone:     "02-620-9000",
			Website:   "https://www.mbk-center.co.th/",
			Hours:     "10:00น. - 22:00น. ทุกวัน",
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
		{
			ID:          "26",
			Name:        "Siam Paragon",
			LocationID:  "1",
			Description: "ศูนย์การค้าหรู มีแบรนด์เนม โรงภาพยนตร์ อควาเรียม และศูนย์อาหารระดับพรีเมียม",
			Category:    "Shopping Mall",
			CoverImage:  "CoverImage/Siam-Paragon-1.jpg",
			HighlightImages: []string{
				"HighlightImages/Siam-Paragon-1.jpg",
				"HighlightImages/Siam-Paragon-2.jpg",
				"HighlightImages/Siam-Paragon-3.jpg",
				"HighlightImages/Siam-Paragon-4.jpg",
				"HighlightImages/Siam-Paragon-5.jpg",
			},
			Rating: 4.5,
			Coordinates: struct {
				Lat float64 `bson:"lat" json:"lat"`
				Lng float64 `bson:"lng" json:"lng"`
			}{Lat: 13.7460, Lng: 100.5346},
			Address:   "991 Rama I Rd, Pathum Wan, Bangkok 10330",
			Phone:     "02-610-8000",
			Website:   "https://www.siamparagon.co.th/",
			Hours:     "10:00น. - 22:00น. ทุกวัน",
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
		{
			ID:          "27",
			Name:        "Taling Chan Floating Market",
			LocationID:  "1",
			Description: "ตลาดน้ำโบราณ ชิมอาหารพื้นบ้านและซื้อของสดจากเรือพาย",
			Category:    "Market",
			CoverImage:  "CoverImage/Taling-Chan-Floating-Market-1.webp",
			HighlightImages: []string{
				"HighlightImages/Taling-Chan-Floating-Market-1.webp",
				"HighlightImages/Taling-Chan-Floating-Market-2.jpg",
				"HighlightImages/Taling-Chan-Floating-Market-3.jpg",
				"HighlightImages/Taling-Chan-Floating-Market-4.jpg",
				"HighlightImages/Taling-Chan-Floating-Market-5.png",
			},
			Rating: 4.3,
			Coordinates: struct {
				Lat float64 `bson:"lat" json:"lat"`
				Lng float64 `bson:"lng" json:"lng"`
			}{Lat: 13.7948, Lng: 100.4605},
			Address:   "Khlong Chak Phra, Taling Chan, Bangkok 10170",
			Phone:     "02-887-7608",
			Website:   "https://www.talingchanfloatingmarket.com/",
			Hours:     "08:00น. - 17:00น. เฉพาะวันเสาร์–อาทิตย์",
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
		{
			ID:          "28",
			Name:        "Terminal 21",
			LocationID:  "1",
			Description: "ศูนย์การค้าดีไซน์คอนเซ็ปต์แอร์พอร์ต แต่ละชั้นตกแต่งเป็นเมืองต่างๆ ทั่วโลก",
			Category:    "Shopping Mall",
			CoverImage:  "CoverImage/Terminal21-1.jpg",
			HighlightImages: []string{
				"HighlightImages/Terminal21-1.jpg",
				"HighlightImages/Terminal21-2.jpg",
				"HighlightImages/Terminal21-3.jpg",
				"HighlightImages/Terminal21-4.jpg",
				"HighlightImages/Terminal21-5.jpg",
			},
			Rating: 4.4,
			Coordinates: struct {
				Lat float64 `bson:"lat" json:"lat"`
				Lng float64 `bson:"lng" json:"lng"`
			}{Lat: 13.7373, Lng: 100.5608},
			Address:   "88 Sukhumvit Rd, Khlong Toei Nuea, Watthana, Bangkok 10110",
			Phone:     "02-006-6000",
			Website:   "https://www.terminal21.co.th/",
			Hours:     "10:00น. - 22:00น. ทุกวัน",
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
		{
			ID:          "29",
			Name:        "Victory Monument",
			LocationID:  "1",
			Description: "อนุสาวรีย์กลางแยกสำคัญ และเป็นศูนย์รวมรถสาธารณะหลายสาย",
			Category:    "Monument",
			CoverImage:  "CoverImage/Victory-Monument-1.jpg",
			HighlightImages: []string{
				"HighlightImages/Victory-Monument-1.jpg",
				"HighlightImages/Victory-Monument-2.jpg",
				"HighlightImages/Victory-Monument-3.jpg",
				"HighlightImages/Victory-Monument-4.jpg",
				"HighlightImages/Victory-Monument-5.jpg",
			},
			Rating: 4.1,
			Coordinates: struct {
				Lat float64 `bson:"lat" json:"lat"`
				Lng float64 `bson:"lng" json:"lng"`
			}{Lat: 13.7648, Lng: 100.5385},
			Address:   "Ratchawithi Rd, Thanon Phetchaburi, Ratchathewi, Bangkok 10400",
			Phone:     "",
			Website:   "https://www.tourismthailand.org/Attraction/Victory-Monument",
			Hours:     "เปิดทุกวัน 24 ชั่วโมง",
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
		{
			ID:          "30",
			Name:        "Wat Arun",
			LocationID:  "1",
			Description: "วัดอรุณราชวราราม ราชวรมหาวิหาร หอปรางค์สูงโดดเด่นริมแม่น้ำเจ้าพระยา",
			Category:    "Temple",
			CoverImage:  "CoverImage/Wat-Arun-1.jpg",
			HighlightImages: []string{
				"HighlightImages/Wat-Arun-1.jpg",
				"HighlightImages/Wat-Arun-2.jpg",
				"HighlightImages/Wat-Arun-3.jpg",
				"HighlightImages/Wat-Arun-4.jpg",
				"HighlightImages/Wat-Arun-5.jpg",
			},
			Rating: 4.6,
			Coordinates: struct {
				Lat float64 `bson:"lat" json:"lat"`
				Lng float64 `bson:"lng" json:"lng"`
			}{Lat: 13.7437, Lng: 100.4880},
			Address:   "158 Wang Doem Rd, Wat Arun, Bangkok Yai, Bangkok 10600",
			Phone:     "02-891-2185",
			Website:   "https://www.watarun.net/",
			Hours:     "08:00น. - 18:00น. ทุกวัน",
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
		{
			ID:          "31",
			Name:        "Wat Phra Kaew",
			LocationID:  "1",
			Description: "วัดพระศรีรัตนศาสดาราม ประดิษฐานพระแก้วมรกต ภายในบริเวณพระบรมมหาราชวัง",
			Category:    "Temple",
			CoverImage:  "CoverImage/Wat-Phra-Kaew-1.jpg",
			HighlightImages: []string{
				"HighlightImages/Wat-Phra-Kaew-1.jpg",
				"HighlightImages/Wat-Phra-Kaew-2.jpg",
				"HighlightImages/Wat-Phra-Kaew-3.jpg",
				"HighlightImages/Wat-Phra-Kaew-4.jpg",
				"HighlightImages/Wat-Phra-Kaew-5.jpg",
			},
			Rating: 4.8,
			Coordinates: struct {
				Lat float64 `bson:"lat" json:"lat"`
				Lng float64 `bson:"lng" json:"lng"`
			}{Lat: 13.7516, Lng: 100.4925},
			Address:   "Na Phra Lan Rd, Phra Nakhon, Bangkok 10200",
			Phone:     "02-622-3295",
			Website:   "https://www.watphra-kaew.net/",
			Hours:     "08:30น. - 15:30น. ทุกวัน",
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
		{
			ID:          "32",
			Name:        "Yaowarat Road",
			LocationID:  "1",
			Description: "ถนนเยาวราช แหล่งอาหารจีน เย็น–ค่ำ มีร้านอาหารและสตรีทฟู้ดชื่อดัง",
			Category:    "Street Food",
			CoverImage:  "CoverImage/Yaowarat-Road-1.jpg",
			HighlightImages: []string{
				"HighlightImages/Yaowarat-Road-1.jpg",
				"HighlightImages/Yaowarat-Road-2.webp",
				"HighlightImages/Yaowarat-Road-3.webp",
				"HighlightImages/Yaowarat-Road-4.webp",
				"HighlightImages/Yaowarat-Road-5.webp",
			},
			Rating: 4.5,
			Coordinates: struct {
				Lat float64 `bson:"lat" json:"lat"`
				Lng float64 `bson:"lng" json:"lng"`
			}{Lat: 13.7415, Lng: 100.5101},
			Address:   "Yaowarat Rd, Samphanthawong, Bangkok 10100",
			Phone:     "",
			Website:   "https://www.tourismthailand.org/Attraction/Yaowarat-Road",
			Hours:     "เปิดทุกวัน 24 ชั่วโมง",
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
	}
	for _, place := range initialPlaces {
		var existing models.Place
		err := db.Collection("places").FindOne(ctx, bson.M{"place_id": place.ID}).Decode(&existing)
		if err == mongo.ErrNoDocuments {
			_, err = db.Collection("places").InsertOne(ctx, place)
			if err != nil {
				return err
			}
		}
	}
	log.Println("Initial places created")

	// --- MIGRATE: เปลี่ยน id ของแต่ละ place ให้เป็น ObjectID จริง ---
	ctx2, cancel2 := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel2()
	cursor, err := db.Collection("places").Find(ctx2, bson.M{})
	if err != nil {
		return err
	}
	defer cursor.Close(ctx2)
	for cursor.Next(ctx2) {
		var place bson.M
		if err := cursor.Decode(&place); err != nil {
			return err
		}
		// ถ้ายังไม่มี _id เป็น ObjectID
		if _, ok := place["_id"].(primitive.ObjectID); !ok {
			idStr, _ := place["id"].(string)
			if idStr == "" {
				continue
			}
			// สร้าง ObjectID ใหม่
			newObjID := primitive.NewObjectID()
			// อัพเดต document: เพิ่ม _id, เก็บ id เดิมใน place_id
			filter := bson.M{"id": idStr}
			update := bson.M{"$set": bson.M{"_id": newObjID, "place_id": idStr}}
			_, err := db.Collection("places").UpdateOne(ctx2, filter, update)
			if err != nil {
				return err
			}
		}
	}
	log.Println("Migrate places id to ObjectID completed")

	// --- เพิ่มข้อมูล Route ---
	initialRoutes := []models.Route{
		{
			StartLocID: "1", EndLocID: "3", Distance: 0.4, Duration: 6, Cost: 0, TransportMode: "walking",
			CreatedAt: time.Date(2025, 5, 24, 9, 5, 0, 0, time.FixedZone("+07:00", 7*60*60)),
			UpdatedAt: time.Date(2025, 5, 25, 17, 30, 0, 0, time.FixedZone("+07:00", 7*60*60)),
		},
		{
			StartLocID: "3", EndLocID: "4", Distance: 0.8, Duration: 12, Cost: 20, TransportMode: "boat",
			CreatedAt: time.Date(2025, 5, 24, 9, 5, 0, 0, time.FixedZone("+07:00", 7*60*60)),
			UpdatedAt: time.Date(2025, 5, 25, 17, 30, 0, 0, time.FixedZone("+07:00", 7*60*60)),
		},
		{
			StartLocID: "4", EndLocID: "5", Distance: 9.4, Duration: 35, Cost: 15, TransportMode: "bus",
			CreatedAt: time.Date(2025, 5, 24, 9, 5, 0, 0, time.FixedZone("+07:00", 7*60*60)),
			UpdatedAt: time.Date(2025, 5, 25, 17, 30, 0, 0, time.FixedZone("+07:00", 7*60*60)),
		},
		{
			StartLocID: "5", EndLocID: "6", Distance: 8.0, Duration: 30, Cost: 10, TransportMode: "bus",
			CreatedAt: time.Date(2025, 5, 24, 9, 5, 0, 0, time.FixedZone("+07:00", 7*60*60)),
			UpdatedAt: time.Date(2025, 5, 25, 17, 30, 0, 0, time.FixedZone("+07:00", 7*60*60)),
		},
		{
			StartLocID: "6", EndLocID: "9", Distance: 2.0, Duration: 10, Cost: 17, TransportMode: "MRT",
			CreatedAt: time.Date(2025, 5, 24, 9, 5, 0, 0, time.FixedZone("+07:00", 7*60*60)),
			UpdatedAt: time.Date(2025, 5, 25, 17, 30, 0, 0, time.FixedZone("+07:00", 7*60*60)),
		},
	}
	for _, route := range initialRoutes {
		filter := bson.M{"start_loc_id": route.StartLocID, "end_loc_id": route.EndLocID, "transport_mode": route.TransportMode}
		var existing models.Route
		err := db.Collection("routes").FindOne(ctx, filter).Decode(&existing)
		if err == mongo.ErrNoDocuments {
			_, err = db.Collection("routes").InsertOne(ctx, route)
			if err != nil {
				return err
			}
		}
	}
	log.Println("Initial routes created")

	return nil
}

func setupRoutes(router *gin.Engine) {
	api := router.Group("/api")
	{
		// Public route for getting all places
		api.GET("/places", func(c *gin.Context) {
			ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
			defer cancel()

			cursor, err := db.Collection("places").Find(ctx, bson.M{})
			if err != nil {
				c.JSON(500, gin.H{"error": "Failed to fetch places"})
				return
			}
			defer cursor.Close(ctx)

			var places []models.Place
			if err := cursor.All(ctx, &places); err != nil {
				c.JSON(500, gin.H{"error": "Failed to decode places"})
				return
			}

			// Debug log
			log.Printf("[DEBUG] Found %d places", len(places))
			for _, p := range places {
				log.Printf("[DEBUG] Place: %s, Coordinates: %+v", p.Name, p.Coordinates)
			}

			c.JSON(200, gin.H{"places": places})
		})

		// Auth routes
		auth := api.Group("/auth")
		{
			auth.POST("/register", handlers.Register)
			auth.POST("/login", handlers.Login)
			auth.POST("/refresh", handlers.RefreshToken)
			auth.POST("/logout", middleware.RequireAuth(), handlers.Logout)
			auth.POST("/change-password", middleware.RequireAuth(), handlers.ChangePassword)
		}

		// Protected routes
		protected := api.Group("/")
		protected.Use(middleware.RequireAuth())
		{
			// User routes
			protected.GET("/profile", handlers.GetProfile)
			protected.PUT("/profile", handlers.UpdateProfile)

			// Route planning routes
			protected.POST("/routes/suggest", handlers.SuggestRoute)
			protected.GET("/routes/cost", handlers.EstimateCost)

			// Reviews routes
			protected.POST("/reviews", handlers.CreateReview)
			protected.GET("/reviews", handlers.GetReviews)
			protected.GET("/reviews/:id", handlers.GetReview)
			protected.PUT("/reviews/:id", handlers.UpdateReview)
			protected.DELETE("/reviews/:id", handlers.DeleteReview)
			protected.POST("/reviews/:id/like", handlers.LikeReview)
			protected.POST("/reviews/:id/comments", handlers.AddComment)
			protected.POST("/reviews/:id/comments/:commentId/like", handlers.LikeComment)

			// Admin routes
			admin := protected.Group("/admin")
			admin.Use(middleware.RequireAdmin())
			{
				admin.GET("/users", handlers.GetUsers)
				admin.GET("/users/:id", handlers.GetUser)
				admin.PUT("/users/:id", handlers.UpdateUser)
				admin.DELETE("/users/:id", handlers.DeleteUser)
				admin.GET("/stats", handlers.GetStats)
				admin.GET("/places", handlers.GetPlaces)
				admin.POST("/places", handlers.CreatePlace)
				admin.PUT("/places/:id", handlers.UpdatePlace)
				admin.DELETE("/places/:id", handlers.DeletePlace)
				admin.POST("/upload-image", handlers.UploadImage)
			}

			// New endpoint for getting all locations
			api.GET("/locations", func(c *gin.Context) {
				ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
				defer cancel()
				cursor, err := db.Collection("locations").Find(ctx, bson.M{})
				if err != nil {
					c.JSON(500, gin.H{"error": "Failed to fetch locations"})
					return
				}
				defer cursor.Close(ctx)

				var locations []models.Location
				if err := cursor.All(ctx, &locations); err != nil {
					c.JSON(500, gin.H{"error": "Failed to decode locations"})
					return
				}
				c.JSON(200, gin.H{"locations": locations})
			})

			// New endpoint for getting a place by place_id or _id
			api.GET("/places/:id", func(c *gin.Context) {
				id := c.Param("id")
				ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
				defer cancel()
				log.Printf("[DEBUG] GET /api/places/:id called with id=%s", id)

				var place models.Place
				err := db.Collection("places").FindOne(ctx, bson.M{"place_id": id}).Decode(&place)
				if err != nil {
					log.Printf("[DEBUG] Not found by place_id: %v", err)
					// Try ObjectId
					objID, objErr := primitive.ObjectIDFromHex(id)
					if objErr == nil {
						err = db.Collection("places").FindOne(ctx, bson.M{"_id": objID}).Decode(&place)
						if err != nil {
							log.Printf("[DEBUG] Not found by _id: %v", err)
							c.JSON(404, gin.H{"error": "Place not found"})
							return
						}
					} else {
						log.Printf("[DEBUG] id is not a valid ObjectId: %v", objErr)
						c.JSON(404, gin.H{"error": "Place not found"})
						return
					}
				}
				log.Printf("[DEBUG] Place found: %+v", place)
				c.JSON(200, gin.H{"place": place})
			})
		}
	}
}
