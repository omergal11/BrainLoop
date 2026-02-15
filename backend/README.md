# Backend — Quick Setup

This file contains minimal instructions to run the backend on any machine.

Prerequisites
- Python 3.10+
- MySQL Server running
- Optional: PowerShell or Bash shell

.env
- Copy the example and fill in your values:
  - PowerShell:
```powershell
Copy-Item .env.example .env
```
  - Bash / macOS / WSL:
```bash
cp .env.example .env
```

Install dependencies
```powershell
cd backend
pip install -r requirements.txt
```

Run the backend
```powershell
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Verify
- Open `http://localhost:8000/` — should return JSON: {"message":"BrainLoop API is running"}
- Swagger UI: `http://localhost:8000/docs`

Notes
- `.env` is loaded automatically at startup via `python-dotenv`.
- If you get DB connection errors, verify `MYSQL_HOST`, `MYSQL_USER`, `MYSQL_PASSWORD`, and that the `brainloop` database exists.
