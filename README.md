---

## วิธีติดตั้งและรันโปรเจค

### 1. เตรียม Environment

- ติดตั้ง [Node.js](https://nodejs.org/) (แนะนำ v18+)
  - **Windows:** แนะนำให้ติดตั้งผ่าน [Chocolatey](https://chocolatey.org/)
    - ติดตั้ง Chocolatey (ครั้งแรกเท่านั้น):
      ```powershell
      Set-ExecutionPolicy Bypass -Scope Process -Force; `
      [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; `
      iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
      ```
    - ติดตั้ง Node.js:
      ```powershell
      choco install nodejs-lts -y
      ```
    - ตรวจสอบเวอร์ชัน:
      ```powershell
      node -v
      npm -v
      ```
  - **Mac:** ดาวน์โหลดและติดตั้งจาก [Node.js Download Page](https://nodejs.org/en/download)
  - **Linux (Ubuntu):**
    ```bash
    sudo apt update
    sudo apt install -y nodejs npm
    ```
  - **ตรวจสอบเวอร์ชัน:**
    ```bash
    node -v
    npm -v
    ```

- ติดตั้ง [Go](https://go.dev/dl/) (แนะนำ v1.20+)
  - **Windows/Mac:** ดาวน์โหลดและติดตั้งจาก [Go Download Page](https://go.dev/dl/)
  - **Linux (Ubuntu):**
    ```bash
    sudo apt update
    sudo apt install -y golang
    ```
  - **ตรวจสอบเวอร์ชัน:**
    ```bash
    go version
    ```

### 2. Clone โปรเจค

```bash
git clone <your-repo-url>
cd <project-folder>
```

### 3. ตั้งค่า Environment Variables

- สร้างไฟล์ `.env` ใน `frontend/` และ `backend/` ตามตัวอย่าง `.env.example` (ถ้ามี)

### 4. ติดตั้งและรัน **Frontend**

```bash
cd frontend
npm install
npm run dev
```
- เปิดใช้งานที่ [http://localhost:5173](http://localhost:5173)

### 5. ติดตั้งและรัน **Backend**

```bash
cd backend
go mod tidy
go run main.go
```
- API จะรันที่ [http://localhost:8080](http://localhost:8080) (หรือพอร์ตที่ตั้งไว้)

---

## คำสั่งที่ใช้บ่อย

### Frontend (React)
- `npm install` — ติดตั้ง dependencies
- `npm run dev` — รัน development server
- `npm run build` — สร้างไฟล์ production

### Backend (Go)
- `go mod tidy` — ติดตั้ง dependencies
- `go run main.go` — รันเซิร์ฟเวอร์

---

## หมายเหตุ

- **อย่า commit ไฟล์ .env ที่มีข้อมูลจริง**
- ไม่ต้องแนบ `node_modules/` หรือไฟล์ build ต่าง ๆ
- หากพบปัญหาในการติดตั้งหรือใช้งาน กรุณาติดต่อผู้พัฒนา
