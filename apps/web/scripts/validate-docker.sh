#!/bin/bash

# Docker Environment Validation Script for GT7 Data Analysis

echo "🐳 Validating Docker Environment for GT7 Data Analysis"
echo "=================================================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "   Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    echo "   Visit: https://docs.docker.com/compose/install/"
    exit 1
fi

# Check Docker daemon
if ! docker info &> /dev/null; then
    echo "❌ Docker daemon is not running. Please start Docker first."
    exit 1
fi

echo "✅ Docker is installed and running"

# Validate Docker files exist
files=("Dockerfile" "Dockerfile.dev" "docker-compose.yml" "docker-compose.dev.yml" ".dockerignore")
for file in "${files[@]}"; do
    if [[ -f "$file" ]]; then
        echo "✅ $file exists"
    else
        echo "❌ $file is missing"
        exit 1
    fi
done

# Validate docker-compose files syntax
echo "🔍 Validating docker-compose.yml syntax..."
if docker-compose -f docker-compose.yml config > /dev/null 2>&1; then
    echo "✅ docker-compose.yml syntax is valid"
else
    echo "❌ docker-compose.yml has syntax errors"
    docker-compose -f docker-compose.yml config
    exit 1
fi

echo "🔍 Validating docker-compose.dev.yml syntax..."
if docker-compose -f docker-compose.dev.yml config > /dev/null 2>&1; then
    echo "✅ docker-compose.dev.yml syntax is valid"
else
    echo "❌ docker-compose.dev.yml has syntax errors"
    docker-compose -f docker-compose.dev.yml config
    exit 1
fi

# Check environment file
if [[ -f ".env.local" ]]; then
    echo "✅ .env.local exists"
else
    echo "⚠️  .env.local not found. Creating example..."
    cat > .env.local << EOF
# Convex Configuration
CONVEX_DEPLOYMENT=anonymous:anonymous-gt7-data-analysis
NEXT_PUBLIC_CONVEX_URL=http://127.0.0.1:3210

# Application
NODE_ENV=development
NEXT_TELEMETRY_DISABLED=1
EOF
    echo "✅ Created .env.local with default values"
fi

# Test Docker build (dry run)
echo "🔍 Testing Docker build (development)..."
if docker build -f Dockerfile.dev -t gt7-data-analysis:dev-test . > /dev/null 2>&1; then
    echo "✅ Development Docker build successful"
    docker rmi gt7-data-analysis:dev-test > /dev/null 2>&1
else
    echo "❌ Development Docker build failed"
    echo "Try running: docker build -f Dockerfile.dev -t gt7-data-analysis:dev ."
fi

echo "🔍 Testing Docker build (production)..."
if docker build -t gt7-data-analysis:prod-test . > /dev/null 2>&1; then
    echo "✅ Production Docker build successful"
    docker rmi gt7-data-analysis:prod-test > /dev/null 2>&1
else
    echo "❌ Production Docker build failed"
    echo "Try running: docker build -t gt7-data-analysis ."
fi

echo ""
echo "🎉 Docker environment validation complete!"
echo ""
echo "Next steps:"
echo "1. For development: npm run docker:dev"
echo "2. For production: npm run docker:up"
echo "3. View logs: npm run docker:logs"
echo "4. Stop containers: npm run docker:down"
echo ""
echo "📚 Read DOCKER.md for detailed instructions"