package main

import (
	"context"
	"log"
	"os"
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

func main() {
	if err := godotenv.Load(); err != nil {
		log.Fatal("Error loading .env file")
	}

	// Connect to MongoDB
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	client, err := mongo.Connect(ctx, options.Client().ApplyURI(os.Getenv("MONGODB_URI")))
	if err != nil {
		log.Fatal(err)
	}
	defer client.Disconnect(ctx)

	db = client.Database(os.Getenv("DB_NAME"))

	// Initialize database with indexes and initial data
	if err := initializeDatabase(ctx); err != nil {
		log.Fatal("Error initializing database:", err)
	}

	// Initialize handlers and middleware with database
	handlers.SetDB(db)
	middleware.SetDB(db)

	// Initialize router
	router := gin.Default()

	// Configure CORS
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173"}, // Vite's default port
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// Routes
	setupRoutes(router)

	// Serve static files for uploads
	router.Static("/uploads", "./uploads")

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Printf("Server starting on port %s...", port)
	router.Run(":" + port)
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
		{ID: "1", Name: "Grand Palace", Description: "พระบรมมหาราชวัง กรุงเทพมหานคร สร้างขึ้นในปี พ.ศ. 2325 เคยเป็นที่ประทับของพระมหากษัตริย์หลายรัชกาล ภายในประกอบด้วยพระที่นั่งจักรีมหาปราสาท พระที่นั่งพุทไธสวรรย์ และพิพิธภัณฑ์เครื่องราชูปโภค แสดงสถาปัตยกรรมและศิลปกรรมไทยอย่างวิจิตร", Category: "Historic Site", Latitude: 13.7503, Longitude: 100.4912, Address: "Na Phra Lan Rd, Phra Nakhon, Bangkok", Phone: "02-623-5500", Website: "http://www.royalgrandpalace.th"},
		{ID: "2", Name: "Wat Phra Kaew", Description: "วัดพระศรีรัตนศาสดาราม หรือวัดพระแก้ว ภายในประดิษฐานพระแก้วมรกตแกะสลักจากหยก สถาปัตยกรรมประณีตมีลวดลายทองคำ จิตรกรรมฝาผนังเล่าเรื่องรามเกียรติ์ และเป็นวัดคู่พระบรมมหาราชวัง", Category: "Temple", Latitude: 13.7511, Longitude: 100.4925, Address: "Na Phra Lan Rd, Phra Nakhon, Bangkok", Phone: "02-623-5500", Website: "http://www.royalgrandpalace.th"},
		{ID: "3", Name: "Taling Chan Floating Market", Description: "ตลาดน้ำตลิ่งชัน ตลาดน้ำเก่าแก่ ห่างจากใจกลางเมืองเล็กน้อย มีร้านอาหารพื้นบ้าน ผลไม้ และเรือพายขายของ จัดขึ้นเฉพาะวันเสาร์-อาทิตย์", Category: "Market", Latitude: 13.7802, Longitude: 100.4758, Address: "Damnoen Song Rd, Taling Chan, Bangkok 10170", Phone: "02-869-0064", Website: "-"},
		{ID: "4", Name: "Wat Arun", Description: "วัดอรุณราชวราราม ริมแม่น้ำเจ้าพระยา มีปรางค์ประธานตกแต่งด้วยกระเบื้องจีนและเปลือกหอย ลวดลายสีสันสดใส ยามเช้ากับยามค่ำคืนให้บรรยากาศต่างกันอย่างโดดเด่น", Category: "Temple", Latitude: 13.7437, Longitude: 100.4889, Address: "158 Wang Doem Rd, Bangkok Yai, Bangkok", Phone: "02-891-2185", Website: "http://www.watarun1.com"},
		{ID: "5", Name: "Chatuchak Weekend Market", Description: "ตลาดนัดจตุจักร ตลาดเปิดเฉพาะสุดสัปดาห์กว่า 8,000 แผงขายสินค้า หลากหลายตั้งแต่แฟชั่น ของตกแต่งบ้าน งานฝีมือ สัตว์เลี้ยง และอาหารสตรีทฟู้ดรสชาติเยี่ยม เหมาะสำหรับนักช้อปนักชิมทุกกลุ่ม", Category: "Market", Latitude: 13.8005, Longitude: 100.5539, Address: "Kamphaeng Phet 2 Rd, Chatuchak, Bangkok", Phone: "-", Website: "http://www.chatuchakmarket.org"},
		{ID: "6", Name: "Lumpini Park", Description: "สวนลุมพินี สวนสาธารณะขนาด 360 ไร่ ใจกลางกรุงเทพ มีทะเลสาบ พร้อมเส้นทางวิ่งจ๊อกกิ้งและจักรยาน สนามออกกำลังกายกลางแจ้ง จุดพักผ่อนใต้ร่มไม้ และกิจกรรมว่ายน้ำเรือเป็ดในบางช่วงเวลา", Category: "Park", Latitude: 13.7300, Longitude: 100.5413, Address: "Rama IV Rd, Pathum Wan, Bangkok", Phone: "02-252-7006", Website: "https://www.tourismthailand.org/Attraction/lumpini-park"},
		{ID: "7", Name: "Jim Thompson House", Description: "บ้านพักและพิพิธภัณฑ์ผ้าไหมไทยของจิม ทอมป์สัน ประกอบด้วยอาคารเรือนไทยโบราณ 6 หลัง ภายในจัดแสดงผ้าไหมไทยแท้ เครื่องเรือนและศิลปวัตถุโบราณ บรรยากาศร่มรื่นในสวนกลางเมือง", Category: "Museum", Latitude: 13.7491, Longitude: 100.5282, Address: "6 Soi Kasemsan 2, Bangkok", Phone: "02-216-7368", Website: "http://jimthompsonhouse.org"},
		{ID: "8", Name: "MBK Center", Description: "เอ็มบีเค เซ็นเตอร์ ห้างสรรพสินค้าขนาด 8 ชั้น มีร้านค้ากว่า 2,000 ร้าน จำหน่ายสินค้าแฟชั่น อุปกรณ์อิเล็กทรอนิกส์ ของฝาก และอาหาร ระดับราคาเข้าถึงง่าย", Category: "Shopping Mall", Latitude: 13.7460, Longitude: 100.5308, Address: "444 Phayathai Rd, Pathum Wan, Bangkok", Phone: "02-853-9000", Website: "http://www.mbk-center.co.th"},
		{ID: "9", Name: "Siam Paragon", Description: "สยามพารากอน ห้างหรูใจกลางสยามสแควร์ ประกอบด้วยร้านแบรนด์เนม โรงภาพยนตร์ พิพิธภัณฑ์สัตว์น้ำ Siam Ocean World และโซนอาหารทั้งไทยและนานาชาติคุณภาพสูง", Category: "Shopping Mall", Latitude: 13.7465, Longitude: 100.5343, Address: "991 Rama I Rd, Pathum Wan, Bangkok", Phone: "02-610-8000", Website: "https://www.siamparagon.co.th"},
		{ID: "10", Name: "Terminal 21", Description: "เทอร์มินอล 21 ห้างสรรพสินค้าธีมท่องเที่ยวโลก แต่ละชั้นจำลองเมืองดังระดับโลก มีร้านค้า ร้านอาหาร และฟู้ดคอร์ตรวมกว่า 600 ร้าน", Category: "Shopping Mall", Latitude: 13.7378, Longitude: 100.5624, Address: "88 Sukhumvit Rd, Khlong Toei, Bangkok", Phone: "02-108-0888", Website: "http://www.terminal21.co.th"},
		{ID: "11", Name: "Khao San Road", Description: "ถนนข้าวสาร แหล่งรวมตัวของแบ็คแพ็คเกอร์จากทั่วโลก เต็มไปด้วยเกสต์เฮาส์ ร้านอาหาร ร้านนวด และบาร์ยามค่ำคืน มีบรรยากาศคึกคักไม่เคยหลับไหล", Category: "Street", Latitude: 13.7590, Longitude: 100.4975, Address: "Khao San Rd, Phra Nakhon, Bangkok", Phone: "-", Website: "-"},
		{ID: "12", Name: "Bangkok Art and Culture Centre", Description: "BACC ศูนย์ศิลปวัฒนธรรมกรุงเทพมหานคร จัดแสดงงานศิลปะร่วมสมัย นิทรรศการหมุนเวียน เวิร์กช็อป และกิจกรรมทางวัฒนธรรมจากศิลปินไทยและต่างชาติ", Category: "Museum", Latitude: 13.7467, Longitude: 100.5326, Address: "939 Rama I Rd, Wangmai, Pathum Wan, Bangkok", Phone: "02-214-6630", Website: "https://www.bacc.or.th"},
		{ID: "13", Name: "Bangkok National Museum", Description: "พิพิธภัณฑ์แห่งชาติ กรุงเทพฯ แสดงโบราณวัตถุ ศิลปะไทย และวัตถุทางประวัติศาสตร์กว่า 30,000 ชิ้น จากสมัยสุโขทัยถึงรัตนโกสินทร์ตอนต้น", Category: "Museum", Latitude: 13.7563, Longitude: 100.4901, Address: "4 Na Phra That Rd, Phra Nakhon, Bangkok", Phone: "02-224-1333", Website: "http://www.finearts.go.th/museum"},
		{ID: "14", Name: "Victory Monument", Description: "อนุสาวรีย์ชัยสมรภูมิ สร้างขึ้นเพื่อระลึกสงครามปี พ.ศ. 2484 ล้อมรอบด้วยวงเวียนเป็นจุดกลางการคมนาคมรถประจำทางและวินมอเตอร์ไซค์", Category: "Monument", Latitude: 13.7611, Longitude: 100.5394, Address: "Ratchawithi Rd, Ratchathewi, Bangkok", Phone: "-", Website: "-"},
		{ID: "15", Name: "Yaowarat Road", Description: "เยาวราช ไชน่าทาวน์เก่าแก่ของกรุงเทพฯ มีชื่อเสียงเรื่องอาหารข้างทางทองคำแท้ และบรรยากาศยามค่ำคืนคึกคักเต็มไปด้วยแสงสี", Category: "Street", Latitude: 13.7416, Longitude: 100.5108, Address: "Yaowarat Rd, Samphanthawong, Bangkok", Phone: "-", Website: "-"},
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
			Name:        "Jim Thompson Silk Café",
			Location:    "Jim Thompson House",
			Description: "คาเฟ่ในพิพิธภัณฑ์ จิม ทอมป์สัน เสิร์ฟกาแฟพิเศษและขนมหวานโฮมเมดในบรรยากาศบ้านไทยโบราณ",
			Category:    "Cafe",
			ImageURL:    []string{"Jim Thompson Silk Café 1.jpg", "Jim Thompson Silk Café 2.jpg", "Jim Thompson Silk Café 3.jpg", "Jim Thompson Silk Café 4.png", "Jim Thompson Silk Café 5.jpg", "Jim Thompson Silk Café 6.jpg"},
			Rating:      4.3,
			Coordinates: struct {
				Lat float64 `bson:"lat" json:"lat"`
				Lng float64 `bson:"lng" json:"lng"`
			}{Lat: 13.7491, Lng: 100.5282},
			CreatedAt: time.Date(2025, 5, 24, 9, 33, 0, 0, time.FixedZone("+07:00", 7*60*60)),
			UpdatedAt: time.Date(2025, 5, 24, 9, 33, 0, 0, time.FixedZone("+07:00", 7*60*60)),
		},
		{
			ID:          "2",
			Name:        "Chatuchak Snack Stall",
			Location:    "Chatuchak Weekend Market",
			Description: "แผงสตรีทฟู้ดภายในตลาดนัดจตุจักรที่รวบรวมขนมและของว่างพื้นเมืองไทย ทั้งกล้วยทอด มันทอด ข้าวเหนียวมะม่วง ปาท่องโก๋ และน้ำผลไม้สดคั้นสด เสิร์ฟร้อน ๆ จากเตา เหมาะสำหรับเดินเลือกชิมระหว่างช้อปปิ้ง ทุกร้านคัดสรรวัตถุดิบคุณภาพ รสชาติกลมกล่อม และราคาเข้าถึงง่าย",
			Category:    "Food Stall",
			ImageURL:    []string{"Chatuchak Snack Stall 1.jpg", "Chatuchak Snack Stall 2.jpg", "Chatuchak Snack Stall 3.jpg", "Chatuchak Snack Stall 4.jpg", "Chatuchak Snack Stall 5.jpg"},
			Rating:      4.0,
			Coordinates: struct {
				Lat float64 `bson:"lat" json:"lat"`
				Lng float64 `bson:"lng" json:"lng"`
			}{Lat: 13.8000, Lng: 100.5539},
			CreatedAt: time.Date(2025, 5, 24, 9, 10, 0, 0, time.FixedZone("+07:00", 7*60*60)),
			UpdatedAt: time.Date(2025, 5, 24, 9, 10, 0, 0, time.FixedZone("+07:00", 7*60*60)),
		},
		{
			ID:          "3",
			Name:        "Pier 21 Food Court",
			Location:    "Terminal 21",
			Description: "ศูนย์อาหารภายใน Terminal 21 ชั้น LG มีร้านอาหารไทย จีน ญี่ปุ่น เกาหลี และฟู้ดทรัค ให้เลือกมากกว่า 20 ร้าน ปรุงเมนูจานเดียวรสชาติบ้าน ๆ ในราคาย่อมเยา มีที่นั่งรวมกว่า 500 ที่ พร้อมโซนเครื่องดื่ม อุปกรณ์ช้อนส้อมสะอาดตลอดเวลา และบริการจ่ายเงินด้วยบัตรสติกเกอร์เติมเงิน ใช้งานง่าย สะดวก และรวดเร็ว",
			Category:    "Food Court",
			ImageURL:    []string{"Pier 21 Food Court 1.jpg", "Pier 21 Food Court 2.jpg", "Pier 21 Food Court 3.jpg", "Pier 21 Food Court 4.jpg", "Pier 21 Food Court 5.jpg"},
			Rating:      4.3,
			Coordinates: struct {
				Lat float64 `bson:"lat" json:"lat"`
				Lng float64 `bson:"lng" json:"lng"`
			}{Lat: 13.7378, Lng: 100.5624},
			CreatedAt: time.Date(2025, 5, 24, 9, 10, 0, 0, time.FixedZone("+07:00", 7*60*60)),
			UpdatedAt: time.Date(2025, 5, 24, 9, 10, 0, 0, time.FixedZone("+07:00", 7*60*60)),
		},
		{
			ID:          "4",
			Name:        "Lumpini Park Jogging Track",
			Location:    "Lumpini Park",
			Description: "เส้นทางวิ่งออกกำลังกายในสวนลุมพินี ระยะทางประมาณ 2.5 กิโลเมตร ล้อมรอบด้วยต้นไม้ใหญ่และทะเลสาบ มีไฟส่องสว่างในช่วงกลางคืน พร้อมจุดออกกำลังกายกลางแจ้ง เครื่องเล่นสเต็ป และลู่วิ่งฟรีสำหรับผู้ชื่นชอบการออกกำลังกายทุกระดับ ทั้งนักวิ่งมือใหม่และมืออาชีพ นอกจากนี้ยังมีมุมพักผ่อนใต้ร่มไม้และร้านน้ำดื่มบริการตลอดเส้นทาง",
			Category:    "Activity",
			ImageURL:    []string{"Lumpini Park Jogging Track 1.jpg", "Lumpini Park Jogging Track 2.jpg", "Lumpini Park Jogging Track 3.jpg", "Lumpini Park Jogging Track 4.jpg", "Lumpini Park Jogging Track 5.png"},
			Rating:      4.0,
			Coordinates: struct {
				Lat float64 `bson:"lat" json:"lat"`
				Lng float64 `bson:"lng" json:"lng"`
			}{Lat: 13.7300, Lng: 100.5413},
			CreatedAt: time.Date(2025, 5, 24, 9, 25, 0, 0, time.FixedZone("+07:00", 7*60*60)),
			UpdatedAt: time.Date(2025, 5, 24, 9, 25, 0, 0, time.FixedZone("+07:00", 7*60*60)),
		},
		{
			ID:          "5",
			Name:        "Siam Ocean World",
			Location:    "Siam Paragon",
			Description: "พิพิธภัณฑ์สัตว์น้ำใต้ดินขนาดใหญ่ในห้างสยามพารากอน ครอบคลุมพื้นที่กว่า 10,000 ตารางเมตร มีตู้จัดแสดงมากกว่า 30 โซน เช่น อุโมงค์ใต้น้ำ ถังฉลาม แพนด้าปลาหมึกนางฟ้า และโซนปะการัง นอกจากการชมสัตว์น้ำหลากหลายสายพันธุ์ ยังมีกิจกรรมให้นักท่องเที่ยวเช่น การให้อาหารปลา การถ่ายภาพกับสัตว์ทะเล และโซนจำลองท้องทะเลลึก เหมาะสำหรับครอบครัวและผู้รักธรรมชาติทางทะเล",
			Category:    "Attraction",
			ImageURL:    []string{"Siam Ocean World 1.jpg", "Siam Ocean World 2.jpg", "Siam Ocean World 3.jpg", "Siam Ocean World 4.png", "Siam Ocean World 5.jpg"},
			Rating:      4.5,
			Coordinates: struct {
				Lat float64 `bson:"lat" json:"lat"`
				Lng float64 `bson:"lng" json:"lng"`
			}{Lat: 13.7465, Lng: 100.5343},
			CreatedAt: time.Date(2025, 5, 24, 9, 25, 0, 0, time.FixedZone("+07:00", 7*60*60)),
			UpdatedAt: time.Date(2025, 5, 24, 9, 25, 0, 0, time.FixedZone("+07:00", 7*60*60)),
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
			c.JSON(200, gin.H{"places": places})
		})

		// Auth routes
		auth := api.Group("/auth")
		{
			auth.POST("/register", handlers.Register)
			auth.POST("/login", handlers.Login)
			auth.POST("/refresh", handlers.RefreshToken)
			auth.POST("/logout", middleware.RequireAuth(), handlers.Logout)
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
		}
	}
}
