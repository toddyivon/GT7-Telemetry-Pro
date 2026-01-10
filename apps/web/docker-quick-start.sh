#!/bin/bash

# GT7 Data Analysis - Docker Quick Start Script

echo "🏁 GT7 Data Analysis - Docker Quick Start"
echo "========================================"

# Function to print colored output
print_status() {
    echo "🔵 $1"
}

print_success() {
    echo "✅ $1"
}

print_error() {
    echo "❌ $1"
}

print_warning() {
    echo "⚠️  $1"
}

# Check prerequisites
print_status "Checking prerequisites..."

if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    echo "   Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    echo "   Visit: https://docs.docker.com/compose/install/"
    exit 1
fi

print_success "Docker and Docker Compose are installed"

# Check if .env.local exists
if [[ ! -f ".env.local" ]]; then
    print_warning ".env.local not found. Creating default environment file..."
    cat > .env.local << EOF
# GT7 Data Analysis Environment Variables

# Next.js Configuration
NODE_ENV=development
NEXT_TELEMETRY_DISABLED=1

# Authentication
NEXTAUTH_SECRET=gt7-super-secret-key-for-development
NEXTAUTH_URL=http://localhost:3000

# Convex Database
NEXT_PUBLIC_CONVEX_URL=http://127.0.0.1:3210
CONVEX_DEPLOYMENT=anonymous:anonymous-gt7-data-analysis

# Docker Development
WATCHPACK_POLLING=true
HOSTNAME=0.0.0.0

# Test User Credentials (Built-in)
# Email: missola@test.com
# Password: master
# Role: premium (full access)
EOF
    print_success "Created .env.local with default values"
fi

# Ask user which environment to start
echo ""
echo "Which environment would you like to start?"
echo "1) Development (with hot reload)"
echo "2) Production"
echo "3) Validate Docker setup only"
echo ""
read -p "Enter your choice (1-3): " choice

case $choice in
    1)
        print_status "Starting development environment..."
        echo "This will start:"
        echo "  - GT7 App on http://localhost:3000"
        echo "  - Convex server on http://localhost:3210"
        echo "  - Convex dashboard on http://localhost:8187"
        echo ""
        echo "📋 Test User Login:"
        echo "  - Email: missola@test.com"
        echo "  - Password: master"
        echo "  - Features: Full premium access"
        echo ""
        read -p "Continue? (y/N): " confirm
        if [[ $confirm =~ ^[Yy]$ ]]; then
            docker-compose -f docker-compose.dev.yml up --build
        fi
        ;;
    2)
        print_status "Starting production environment..."
        echo "This will start:"
        echo "  - GT7 App on http://localhost:3000"
        echo "  - Convex server on http://localhost:3210"
        echo "  - Redis cache on http://localhost:6379"
        echo ""
        echo "📋 Test User Login:"
        echo "  - Email: missola@test.com"
        echo "  - Password: master"
        echo "  - Features: Full premium access"
        echo ""
        read -p "Continue? (y/N): " confirm
        if [[ $confirm =~ ^[Yy]$ ]]; then
            docker-compose up --build -d
            print_success "Production environment started in background"
            echo ""
            echo "🌐 Access your application:"
            echo "  - Main App: http://localhost:3000"
            echo "  - Login: http://localhost:3000/login"
            echo "  - Health Check: curl http://localhost:3000/api/health"
            echo ""
            echo "📋 Useful commands:"
            echo "  npm run docker:logs  - View logs"
            echo "  npm run docker:down  - Stop containers"
            echo "  docker-compose ps    - Check container status"
        fi
        ;;
    3)
        print_status "Validating Docker setup..."
        if [[ -f "scripts/validate-docker.sh" ]]; then
            ./scripts/validate-docker.sh
        else
            print_error "Validation script not found"
        fi
        ;;
    *)
        print_error "Invalid choice. Exiting."
        exit 1
        ;;
esac

echo ""
print_success "Setup complete! Check DOCKER.md for detailed instructions."