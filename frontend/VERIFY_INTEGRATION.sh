#!/bin/bash

# GhostShift Frontend-Backend Integration Verification Script
# Run this script to verify that the frontend can connect to the backend

echo "🔍 GhostShift Integration Verification"
echo "======================================"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "src" ]; then
    echo "❌ Error: This script must be run from the frontend directory"
    echo "   Please navigate to the frontend directory and try again"
    exit 1
fi

echo "✅ Frontend directory structure verified"
echo ""

# Check if backend is running
echo "🔍 Checking if GhostShift backend is running..."
if curl -s http://localhost:8000/health > /dev/null; then
    echo "✅ Backend is running and accessible"

    # Get health status
    HEALTH_STATUS=$(curl -s http://localhost:8000/health | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
    echo "   Health Status: $HEALTH_STATUS"
else
    echo "⚠️  Warning: Backend not accessible at http://localhost:8000"
    echo "   Please ensure the GhostShift backend is running"
    echo "   Start it with: cd ../backend && source venv/bin/activate && uvicorn main:app --reload"
fi
echo ""

# Check API documentation
echo "🔍 Checking API documentation..."
if curl -s http://localhost:8000/docs > /dev/null; then
    echo "✅ API documentation is accessible"
else
    echo "❌ API documentation not accessible"
fi
echo ""

# Check OpenAPI specification
echo "🔍 Checking OpenAPI specification..."
if curl -s http://localhost:8000/openapi.json > /dev/null; then
    echo "✅ OpenAPI specification is accessible"
else
    echo "❌ OpenAPI specification not accessible"
fi
echo ""

# Check if required service files exist
echo "🔍 Checking integration service files..."
if [ -f "src/services/api.js" ] && [ -f "src/services/dataService.js" ]; then
    echo "✅ Integration service files found"
else
    echo "❌ Integration service files missing"
    echo "   Please ensure you have the latest frontend code"
fi
echo ""

# Check if backup exists
echo "🔍 Checking if mock data backup exists..."
if [ -d "../frontend_backup" ]; then
    echo "✅ Mock data backup found at ../frontend_backup"
else
    echo "❌ Mock data backup not found"
fi
echo ""

echo "📋 Integration Verification Complete"
echo "==================================="
echo ""
echo "Next steps:"
echo "1. Review the integration documentation: FRONTEND_INTEGRATION_DOCS.md"
echo "2. Follow the migration guide: MIGRATION_GUIDE.md"
echo "3. Start replacing mock data imports with real API calls"
echo "4. Test your components with the APITestComponent"
echo ""
echo "For any issues, check the backend health and API documentation."