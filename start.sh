#!/bin/bash

# 🧠 BrainLoop - Setup and Run Script
# This script sets up the environment and runs both backend and frontend servers
# 
# ⚠️ NOTE: This script is for Mac/Linux only!
# For Windows users: Use `make start` instead (requires GNU Make)
# For all platforms: You can also use the Makefile with: make install && make start

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧠 BrainLoop - Setup and Run Script${NC}"
echo ""

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Stopping servers...${NC}"
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    echo -e "${GREEN}✅ Servers stopped${NC}"
    exit
}

trap cleanup SIGINT SIGTERM

# Step 1: Check/create .env file
echo -e "${BLUE}📝 Step 1: Checking .env file...${NC}"
if [ ! -f backend/.env ]; then
    if [ -f backend/.env.example ]; then
        cp backend/.env.example backend/.env
        echo -e "${GREEN}✅ Created backend/.env from .env.example${NC}"
        echo -e "${YELLOW}⚠️  IMPORTANT: Please edit backend/.env and add your MySQL password!${NC}"
        echo ""
        echo "The file is located at: backend/.env"
        echo "You need to set: MYSQL_PASSWORD=your_password_here"
        echo ""
        read -p "Press Enter after you've edited backend/.env with your MySQL password, or Ctrl+C to cancel..."
    else
        echo -e "${RED}❌ Error: backend/.env.example not found!${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ backend/.env already exists${NC}"
fi

# Step 2: Check Python
echo ""
echo -e "${BLUE}🐍 Step 2: Checking Python...${NC}"
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Error: Python 3 is not installed!${NC}"
    exit 1
fi
PYTHON_VERSION=$(python3 --version)
echo -e "${GREEN}✅ Found: $PYTHON_VERSION${NC}"

# Step 3: Setup backend virtual environment
echo ""
echo -e "${BLUE}📦 Step 3: Setting up backend...${NC}"
if [ ! -d backend/venv ]; then
    echo "Creating virtual environment..."
    cd backend
    python3 -m venv venv
    source venv/bin/activate
    echo "Installing backend dependencies..."
    pip install --upgrade pip > /dev/null 2>&1
    pip install -r requirements.txt
    cd ..
    echo -e "${GREEN}✅ Backend dependencies installed${NC}"
else
    echo -e "${GREEN}✅ Backend virtual environment already exists${NC}"
fi

# Step 4: Check Node.js
echo ""
echo -e "${BLUE}📦 Step 4: Checking Node.js...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Error: Node.js is not installed!${NC}"
    exit 1
fi
NODE_VERSION=$(node --version)
echo -e "${GREEN}✅ Found: $NODE_VERSION${NC}"

# Step 5: Setup frontend dependencies
echo ""
echo -e "${BLUE}📦 Step 5: Setting up frontend...${NC}"
if [ ! -d frontend/frontend/node_modules ]; then
    echo "Installing frontend dependencies..."
    cd frontend/frontend
    npm install
    cd ../..
    echo -e "${GREEN}✅ Frontend dependencies installed${NC}"
else
    echo -e "${GREEN}✅ Frontend dependencies already installed${NC}"
fi

# Step 6: Start backend
echo ""
echo -e "${BLUE}🚀 Step 6: Starting backend server...${NC}"
cd backend
source venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000 > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait a bit for backend to start
sleep 3

# Check if backend started successfully
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo -e "${RED}❌ Backend failed to start! Check backend.log for errors.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Backend started (PID: $BACKEND_PID)${NC}"

# Step 7: Start frontend
echo ""
echo -e "${BLUE}🚀 Step 7: Starting frontend server...${NC}"
cd frontend/frontend
npm run dev > ../../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ../..

# Wait a bit for frontend to start
sleep 3

# Check if frontend started successfully
if ! kill -0 $FRONTEND_PID 2>/dev/null; then
    echo -e "${RED}❌ Frontend failed to start! Check frontend.log for errors.${NC}"
    cleanup
    exit 1
fi

echo -e "${GREEN}✅ Frontend started (PID: $FRONTEND_PID)${NC}"

# Success message
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Both servers are running!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}📱 Frontend:${NC}  http://localhost:5173"
echo -e "${BLUE}🔧 Backend API:${NC}  http://localhost:8000"
echo -e "${BLUE}📚 API Docs:${NC}  http://localhost:8000/docs"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop both servers${NC}"
echo ""

# Wait for both processes (or until Ctrl+C)
wait $BACKEND_PID $FRONTEND_PID
