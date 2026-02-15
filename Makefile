.PHONY: help setup install start stop clean

# Detect OS
ifeq ($(OS),Windows_NT)
    DETECTED_OS := Windows
    RM := del /Q
    PYTHON := python
    ACTIVATE_BACKEND := backend\venv\Scripts\activate.bat
    SEP := \\
else
    DETECTED_OS := Unix
    RM := rm -f
    PYTHON := python3
    ACTIVATE_BACKEND := . backend/venv/bin/activate
    SEP := /
endif

# Default target
help:
	@echo "🧠 BrainLoop - Available Commands:"
	@echo ""
	@echo "  make setup    - Create .env file from .env.example"
	@echo "  make install  - Install all dependencies (backend + frontend)"
	@echo "  make start    - Start both backend and frontend servers"
	@echo "  make stop     - Stop running servers"
	@echo "  make clean    - Clean up log files"
	@echo ""
	@echo "Detected OS: $(DETECTED_OS)"

# Setup .env file
setup:
ifeq ($(DETECTED_OS),Windows)
	@if not exist "backend\.env" ( \
		if exist "backend\.env.example" ( \
			copy backend\.env.example backend\.env && \
			echo ✅ Created backend/.env from .env.example && \
			echo ⚠️  Please edit backend/.env and add your MySQL password! \
		) else ( \
			echo ❌ Error: backend/.env.example not found! && \
			exit /b 1 \
		) \
	) else ( \
		echo ⚠️  backend/.env already exists \
	)
else
	@if [ ! -f backend/.env ]; then \
		if [ -f backend/.env.example ]; then \
			cp backend/.env.example backend/.env; \
			echo "✅ Created backend/.env from .env.example"; \
			echo "⚠️  Please edit backend/.env and add your MySQL password!"; \
		else \
			echo "❌ Error: backend/.env.example not found!"; \
			exit 1; \
		fi \
	else \
		echo "⚠️  backend/.env already exists"; \
	fi
endif

# Install dependencies
install: setup
	@echo "📦 Installing backend dependencies..."
ifeq ($(DETECTED_OS),Windows)
	@cd backend && \
	if not exist venv ( $(PYTHON) -m venv venv ) && \
	call venv\Scripts\activate.bat && \
	$(PYTHON) -m pip install --upgrade pip && \
	$(PYTHON) -m pip install -r requirements.txt
else
	@cd backend && \
	if [ ! -d venv ]; then \
		$(PYTHON) -m venv venv; \
	fi && \
	. venv/bin/activate && \
	$(PYTHON) -m pip install --upgrade pip && \
	$(PYTHON) -m pip install -r requirements.txt
endif
	@echo "📦 Installing frontend dependencies..."
	@cd frontend/frontend && npm install
	@echo "✅ All dependencies installed!"

# Start servers
start:
ifeq ($(DETECTED_OS),Windows)
	@echo "🚀 Starting backend and frontend servers..."
	@start "BrainLoop Backend" cmd /k "cd backend && venv\Scripts\activate.bat && $(PYTHON) -m uvicorn main:app --reload"
	@timeout /t 2
	@start "BrainLoop Frontend" cmd /k "cd frontend\frontend && npm run dev"
else
	@chmod +x start.sh
	@./start.sh
endif

# Stop servers
stop:
	@echo "🛑 Stopping servers..."
ifeq ($(DETECTED_OS),Windows)
	@taskkill /IM python.exe /F 2>nul || echo "No Python processes to stop"
	@taskkill /IM node.exe /F 2>nul || echo "No Node processes to stop"
	@taskkill /IM cmd.exe /F /FI "WINDOWTITLE eq BrainLoop*" 2>nul || true
	@echo "✅ Servers stopped"
else
	@lsof -ti:8000 | xargs kill -9 2>/dev/null || true
	@lsof -ti:5173 | xargs kill -9 2>/dev/null || true
	@echo "✅ Servers stopped"
endif

# Clean log files
clean:
	@$(RM) backend.log frontend.log
	@echo "✅ Log files cleaned"
