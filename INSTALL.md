# Installation Guide (v1.0.0)

## Prerequisites
- Node.js (v18 or higher)
- Python (v3.11 or higher)
- PostgreSQL (or Supabase project)
- Docker & Docker Compose (Optional for Containerized Deployment)

## 1. Clone the Repository
```bash
git clone https://github.com/your-org/zencro-ai-platform.git
cd zencro-ai-platform
```

## 2. Backend Setup
```bash
cd backend
python -m venv venv

# Windows
.\venv\Scripts\activate
# Mac/Linux
source venv/bin/activate

pip install -r requirements.txt
```

## 3. Frontend Setup
```bash
cd frontend
npm install
```

## 4. Environment Variables
Copy the example files and fill in your credentials.
```bash
# Frontend
cp frontend/.env.example frontend/.env.local

# Backend
cp backend/.env.example backend/.env
```
Refer to `ENVIRONMENT.md` for specific key configurations.

## 5. Running Locally
### Start the Backend
```bash
cd backend
uvicorn app.main:app --reload --port 8000
```
### Start the Frontend
```bash
cd frontend
npm run dev
```

Visit `http://localhost:3000` to interact with the platform.
