#!/bin/bash

# BrainLoop Docker Reset Script for Mac/Linux
echo "🧠 Resetting BrainLoop Docker containers..."
echo ""
echo "This will:"
echo "- Stop all containers"
echo "- Remove MySQL volume (database data will be lost!)"
echo "- Rebuild and start everything fresh"
echo ""
read -p "Press Enter to continue, or Ctrl+C to cancel..."

echo ""
echo "Stopping containers..."
docker-compose -f docker-compose.dev.yml down -v

echo ""
echo "Starting fresh..."
docker-compose -f docker-compose.dev.yml up --build
