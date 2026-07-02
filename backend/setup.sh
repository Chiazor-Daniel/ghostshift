#!/bin/bash

# GhostShift Backend Setup Script
# This script helps you set up the environment with free services

echo "=========================================="
echo "GhostShift Backend Setup"
echo "=========================================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "Please create .env file from .env.example first"
    exit 1
fi

# Check if .env has placeholder values
if grep -q "your-" .env; then
    echo "⚠️  .env file has placeholder values"
    echo "Please update the following values:"
    echo ""
    echo "1. AI/ML Provider (Choose ONE):"
    echo "   - Groq (RECOMMENDED - Free): https://console.groq.com/"
    echo "   - OpenAI (Paid): https://platform.openai.com/api-keys"
    echo "   - Ollama Cloud (Free tier): https://ollama.com/cloud"
    echo ""
    echo "2. Email Provider (Choose ONE):"
    echo "   - Mailtrap (Free testing): https://mailtrap.io"
    echo "   - Resend (Free 3K emails/month): https://resend.com"
    echo "   - Gmail (Free 500/day): https://support.google.com/accounts/answer/185833"
    echo ""
    echo "3. Database:"
    echo "   - Install PostgreSQL: sudo apt-get install postgresql"
    echo "   - Create database: createdb ghostshift"
    echo ""
    echo "4. Redis:"
    echo "   - Install Redis: sudo apt-get install redis-server"
    echo "   - Start Redis: sudo service redis-server start"
    echo ""
    
    read -p "Do you want to continue? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Check if PostgreSQL is running
if ! pg_isready -q; then
    echo "⚠️  PostgreSQL is not running"
    echo "Please start PostgreSQL: sudo service postgresql start"
    read -p "Do you want to continue anyway? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check if Redis is running
if ! redis-cli ping > /dev/null 2>&1; then
    echo "⚠️  Redis is not running"
    echo "Please start Redis: sudo service redis-server start"
    read -p "Do you want to continue anyway? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Run migrations
echo "Running database migrations..."
alembic upgrade head

echo ""
echo "=========================================="
echo "Setup Complete!"
echo "=========================================="
echo ""
echo "Start the server with:"
echo "  uvicorn main:app --reload --host 0.0.0.0 --port 8000"
echo ""
echo "API Documentation:"
echo "  http://localhost:8000/docs"
echo ""
echo "Health Check:"
echo "  http://localhost:8000/health"
echo ""
