# 🧠 BrainLoop - Quiz & Learning Management System

[![Python](https://img.shields.io/badge/Python-3.10+-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.124-green.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://reactjs.org/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-orange.svg)](https://www.mysql.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A comprehensive quiz application with advanced analytics, user authentication, and gamification features built with React + FastAPI + MySQL.

**Key Highlights:**
- 🔐 Secure JWT authentication with bcrypt password hashing
- �️ Advanced Security: Rate Limiting (DoS protection) & Role-Based Access Control (RBAC)
- 📊 Advanced analytics with complex SQL queries
- 🐳 Docker support for easy deployment (Development & Production configs)
- ✅ CI/CD pipeline with automated testing
- 📝 Comprehensive documentation
- 🧪 Unit tests and code quality checks

---

## 📚 Documentation

| For | Read | Details |
|-----|------|---------|
| **Users** | [USER_MANUAL.html](USER_MANUAL.html) | Setup, installation, feature guide |
| **Developers** | [SOFTWARE_DOCUMENTATION.md](SOFTWARE_DOCUMENTATION.md) | Architecture, API, database schema |

---

## 🚀 Getting Started

### System Requirements
- Docker & Docker Compose (for Docker setup)
- Python 3.10+ (for local development)
- Node.js 16+ (for frontend development)
- MySQL 8.0+ (for local setup)

---

## 🐳 Running with Docker (Recommended - Easiest)

### 1. Start All Services

```bash
docker-compose -f docker-compose.dev.yml up --build
```

This will automatically:
- Initialize MySQL database with seed data
- Build backend with FastAPI
- Build frontend with React + Vite
- Create all necessary containers and networks

### 2. Access the Application

Once all services are running:
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:8000
- **API Documentation:** http://localhost:8000/docs
- **Health Check:** http://localhost:8000/health

### 3. Stop Services

```bash
docker-compose -f docker-compose.dev.yml down
```

**Note:** First startup takes 1-2 minutes as Docker builds images and initializes the database.

**Optional:** To customize environment variables, create a `.env` file in the project root:
```env
MYSQL_PASSWORD=your_custom_password
SECRET_KEY=your-custom-secret-key
```
Otherwise, sensible defaults are used automatically.

---

## � For Local Development (Without Docker)

If you need to run the project locally without Docker, see [SOFTWARE_DOCUMENTATION.md](SOFTWARE_DOCUMENTATION.md#local-development-setup) for detailed setup instructions (virtual environments, database configuration, etc.).

---

## 🆘 Troubleshooting

### Docker Issues

**MySQL Connection Error: "Access denied for user 'root'..."**

1. Stop all containers:
   ```bash
   docker-compose -f docker-compose.dev.yml down -v
   ```
   The `-v` flag removes volumes (clears database).

2. Restart:
   ```bash
   docker-compose -f docker-compose.dev.yml up --build
   ```

If you customized environment variables in a `.env` file, verify it has correct `MYSQL_PASSWORD`.

Or use the reset script:

Windows:
```powershell
.\docker-reset.bat
```

Mac/Linux:
```bash
chmod +x docker-reset.sh
./docker-reset.sh
```

**Port Already in Use**

If ports 5173 or 8000 are occupied:

Windows (PowerShell):
```powershell
# Find and kill process on port 8000
Get-Process | Where-Object {$_.Name -eq "python"} | Stop-Process

# Find and kill process on port 5173
Get-NetTCPConnection -LocalPort 5173 | Stop-Process -Force
```

Mac/Linux:
```bash
# Kill process on port 8000
lsof -ti:8000 | xargs kill -9

# Kill process on port 5173
lsof -ti:5173 | xargs kill -9
```

**Container Not Starting**

Check logs:
```bash
docker-compose -f docker-compose.dev.yml logs -f
```

---

## 📂 Project Structure

```
BrainLoop/
├── backend/              # FastAPI backend
│   ├── routes/          # API endpoints
│   ├── tests/           # Unit tests
│   ├── main.py          # Application entry point
│   ├── limiter.py       # Rate limiting middleware
│   ├── database.py      # Database setup
│   ├── schemas.py       # Pydantic schemas
│   └── requirements.txt  # Python dependencies
├── frontend/            # React frontend
│   └── frontend/
│       ├── src/         # React components and pages
│       ├── public/      # Static assets
│       └── package.json # Node dependencies
├── db/                  # Database scripts
│   └── brainloop.sql    # Database schema
├── docker-compose.yml              # Production configuration
├── docker-compose.dev.yml          # Development configuration
└── .env.example         # Environment variables template
```

---

## 🤝 Contributing

Thank you for your interest in contributing! Please check [CONTRIBUTING.md](CONTRIBUTING.md) for:
- Development setup guidelines
- Code style standards
- Testing requirements
- Commit message conventions
- Pull request process

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🆘 Need Help?

- Check [SOFTWARE_DOCUMENTATION.md](SOFTWARE_DOCUMENTATION.md) for detailed technical documentation
- Review [USER_MANUAL.html](USER_MANUAL.html) for user guides
- Check the troubleshooting section above
- Review Docker and application logs for error details



---

## ✨ Features

### 🛡️ Security & Reliability (SRE Focus)
- **Identity & Access:** Modern JWT authentication using `PyJWT` with secure RBAC (Role-Based Access Control)
- **Infrastructure Protection:** Built-in Rate Limiting to mitigate Brute-Force and DoS attacks
- **Database Security:** 100% Parameterized SQL queries to prevent SQL Injection
- **Secrets Management:** Environment-based configuration (no credentials in code)
- **Token Security:** 30-minute JWT token expiry with automatic refresh
- **Observability:** (Coming Soon) Real-time monitoring with Prometheus & Grafana

### Security Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT BROWSER                            │
│              (React Frontend - HTTPS)                         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ HTTP Request
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  API GATEWAY LAYER                           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │        Rate Limiter (DoS Protection)                 │   │
│  │  - Request throttling per IP/user                    │   │
│  │  - Brute-force detection                             │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│               AUTHENTICATION LAYER                           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │     JWT Token Validation (30-min expiry)             │   │
│  │  - Token signature verification                      │   │
│  │  - Role-Based Access Control (RBAC)                  │   │
│  │  - Bcrypt password verification                      │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              APPLICATION LAYER (FastAPI)                    │
│  - Parameterized SQL queries (SQL Injection Protection)     │
│  - Request validation & sanitization                        │
│  - Error handling & logging                                 │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              DATABASE LAYER (MySQL)                         │
│  - Parameterized prepared statements                        │
│  - Indexed queries for performance                          │
│  - Secure credential storage (bcrypt hashes)                │
└─────────────────────────────────────────────────────────────┘
```

### Quiz & Learning
- 📝 Multiple question types (multiple-choice, code-writing)
- 🎯 Topic-based question filtering
- 🔥 Streak tracking & gamification
- 📊 Real-time progress tracking

### Analytics & Statistics
- 📈 Personal statistics dashboard
- 👑 Admin analytics dashboard
- 📉 Topic performance analysis
- 🏆 Leaderboards and rankings

### Technical Features
- ⚡ High-performance raw SQL queries (no ORM overhead)
- �️ Parameterized SQL queries protecting against injection attacks
- 🗄️ 6 database tables with 100K+ data rows
- 🧠 15+ complex SQL queries (JOINs, GROUP BY, aggregations)
- 📊 Strategic database indexes for optimization
- 🐳 Docker containerization (development & production configs)
- ✅ CI/CD pipeline with automated testing
- 📝 Comprehensive API documentation (FastAPI auto-docs)

---

## 🗄️ Database

| Table | Purpose |
|-------|---------|
| Users | 166 user accounts |
| Topics | 14 learning topics |
| Questions | 3,784 quiz questions |
| Learning_Sessions | Session tracking |
| User_Answers | 102K+ answer records |
| User_Strikes | Streak tracking |

---

## 🔗 API Endpoints

### Authentication
- `POST /auth/users` - Register new user
- `POST /auth/login` - User login (returns JWT token)
- `GET /auth/me` - Get current user info

### Questions
- `GET /questions/` - List questions (paginated)
- `GET /questions/{id}` - Get single question
- `GET /questions/random` - Get random question
- `GET /questions/random-batch` - Get batch of random questions
- `GET /questions/topics/code` - Get code question topics
- `GET /questions/topics/multiple-choice` - Get multiple-choice topics

### Quiz
- `POST /quiz/sessions` - Start learning session
- `POST /quiz/submit-answer` - Submit answer to question
- `POST /quiz/sessions/{id}/complete` - Complete session

### Statistics
- `GET /stats/user` - Get personal statistics
- `GET /admin/stats/overview` - Get admin dashboard (admin only)

### Health & Info
- `GET /` - API info
- `GET /health` - Health check endpoint
- `GET /docs` - Interactive API documentation (Swagger UI)

See [SOFTWARE_DOCUMENTATION.md](SOFTWARE_DOCUMENTATION.md#api-reference) for full details.

---

## 🏗️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Backend** | Python 3.10+ | Runtime |
| | FastAPI 0.124 | Web framework |
| | PyMySQL | MySQL driver |
| | Passlib (bcrypt) | Password hashing |
| | PyJWT | JWT token handling |
| **Frontend** | React 19 | UI framework |
| | Vite 7 | Build tool & dev server |
| | Tailwind CSS 3 | Styling |
| | Axios | HTTP client |
| **Database** | MySQL 8.0 | Relational database |
| **DevOps** | Docker & Docker Compose | Containerization |
| | GitHub Actions | CI/CD pipeline |
| | Pytest | Testing framework |

---

## 📊 Project Stats

| Metric | Value |
|--------|-------|
| Backend files | 8 |
| API endpoints | 19 |
| Database tables | 6 |
| Complex queries | 5+ |
| Data rows | 100,000+ |

---

## 🧪 Testing

```bash
# Run backend tests
cd backend
pytest tests/ -v

# Run with coverage
pytest tests/ --cov=. --cov-report=html
```

### Code Quality Standards
- ✅ Type hints in Python code
- ✅ Structured logging
- ✅ Error handling
- ✅ Parameterized SQL queries (SQL injection protection)
- ✅ Environment-based configuration



## ⚙️ Setup Requirements

### For Local Development
- Python 3.10+
- Node.js 18+
- MySQL 8.0+ running locally
- `.env` file in `backend/` with MySQL credentials

### For Docker
- Docker & Docker Compose
- `.env` file configuration

---

**Version:** 1.0.0 | **Last Updated:** February 2026 | **Status:** ✅ Production Ready

## 📸 Screenshots

See [USER_MANUAL.html](USER_MANUAL.html) for detailed screenshots and user guide.

## 🔗 Links

- [API Documentation](http://localhost:8000/docs) (when running)
- [User Manual](USER_MANUAL.html)
- [Software Documentation](SOFTWARE_DOCUMENTATION.md)
