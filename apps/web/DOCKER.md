# Docker Environment for GT7 Data Analysis

This document explains how to run the GT7 Data Analysis application using Docker and Docker Compose.

## Prerequisites

- Docker (v20.0+)
- Docker Compose (v2.0+)
- Git

## Quick Start

### Development Mode

For development with hot reload:

```bash
# Start development environment
npm run docker:dev

# Or manually
docker-compose -f docker-compose.dev.yml up --build
```

This will start:
- GT7 App on http://localhost:3000
- Convex development server on http://localhost:3210
- Convex dashboard on http://localhost:8187

### Production Mode

For production deployment:

```bash
# Start production environment
npm run docker:up

# Or manually
docker-compose up --build -d
```

This will start:
- GT7 App on http://localhost:3000
- Convex server on http://localhost:3210
- Redis cache on http://localhost:6379
- Optional Nginx proxy on http://localhost:80

## Available Scripts

### Docker Commands

```bash
# Build production image
npm run docker:build

# Build development image
npm run docker:build:dev

# Run single container
npm run docker:run

# Start development environment
npm run docker:dev

# Start production environment
npm run docker:up

# Stop all containers
npm run docker:down

# View logs
npm run docker:logs

# Clean up containers and volumes
npm run docker:clean
```

## Docker Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
# Convex Configuration
CONVEX_DEPLOYMENT=your-deployment-name
NEXT_PUBLIC_CONVEX_URL=http://localhost:3210

# Application
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1

# Optional: Redis
REDIS_URL=redis://redis:6379
```

### File Structure

```
├── Dockerfile              # Production image
├── Dockerfile.dev          # Development image
├── docker-compose.yml      # Production compose
├── docker-compose.dev.yml  # Development compose
├── .dockerignore           # Docker ignore rules
├── nginx.conf              # Nginx configuration
└── DOCKER.md               # This documentation
```

## Services

### GT7 App (Main Application)

- **Port**: 3000
- **Health Check**: `/api/health`
- **Environment**: Node.js 18 Alpine
- **Features**: 
  - Next.js application
  - Standalone output for optimal Docker size
  - Health monitoring
  - Hot reload in development

### Convex (Database & Backend)

- **Port**: 3210 (API), 8187 (Dashboard)
- **Environment**: Node.js 18 Alpine
- **Features**:
  - Real-time database
  - Serverless functions
  - Development dashboard

### Redis (Caching)

- **Port**: 6379
- **Environment**: Redis 7 Alpine
- **Features**:
  - Data persistence
  - Memory caching
  - Session storage

### Nginx (Reverse Proxy)

- **Port**: 80, 443
- **Environment**: Nginx Alpine
- **Features**:
  - Load balancing
  - Rate limiting
  - SSL termination
  - Static file caching

## Development Workflow

### 1. Initial Setup

```bash
# Clone the repository
git clone <repository-url>
cd gt7-data-analysis

# Copy environment variables
cp .env.local .env

# Start development environment
npm run docker:dev
```

### 2. Making Changes

The development container mounts your source code, so changes are automatically reflected:

- Code changes trigger hot reload
- Database schema changes require Convex restart
- Dependency changes require container rebuild

### 3. Database Operations

```bash
# Access Convex dashboard
open http://localhost:8187

# Run Convex commands in container
docker exec -it gt7-data-analysis-convex-dev-1 npx convex dev
```

### 4. Debugging

```bash
# View application logs
npm run docker:logs

# Access container shell
docker exec -it gt7-data-analysis-gt7-app-dev-1 sh

# Check container health
docker ps
curl http://localhost:3000/api/health
```

## Production Deployment

### 1. Environment Setup

```bash
# Set production environment variables
export NODE_ENV=production
export CONVEX_DEPLOYMENT=your-production-deployment

# Build and start production containers
npm run docker:up
```

### 2. SSL Configuration

For HTTPS in production:

1. Add SSL certificates to `./ssl/` directory
2. Update `nginx.conf` with SSL configuration
3. Enable nginx service:

```bash
docker-compose --profile production up -d
```

### 3. Monitoring

```bash
# Check health status
curl http://localhost/health

# Monitor logs
npm run docker:logs

# View container stats
docker stats
```

## Troubleshooting

### Common Issues

1. **Port Conflicts**
   ```bash
   # Check what's using the port
   lsof -i :3000
   
   # Use different ports
   docker-compose up -p 3001:3000
   ```

2. **Build Failures**
   ```bash
   # Clean Docker cache
   npm run docker:clean
   docker system prune -a
   
   # Rebuild from scratch
   npm run docker:build
   ```

3. **Volume Issues**
   ```bash
   # Reset volumes
   docker-compose down -v
   docker volume prune
   ```

4. **Memory Issues**
   ```bash
   # Increase Docker memory limit
   # Docker Desktop: Settings > Resources > Memory
   
   # Monitor memory usage
   docker stats
   ```

### Performance Optimization

1. **Multi-stage Build**: The Dockerfile uses multi-stage builds to minimize image size
2. **Layer Caching**: Dependencies are installed before copying source code
3. **Node Modules**: Separate volume mount prevents rebuilding node_modules
4. **Nginx Caching**: Static assets are cached with appropriate headers

## Security

### Best Practices

- Non-root user in containers
- Security headers in Nginx
- Rate limiting on API endpoints
- Secrets management with Docker secrets
- Regular image updates

### Production Hardening

```bash
# Use specific image versions
FROM node:18.17.0-alpine

# Remove development dependencies
RUN npm ci --only=production

# Use Docker secrets for sensitive data
docker secret create convex_key convex_key.txt
```

## Monitoring

### Health Checks

All services include health checks:

```bash
# Check application health
curl http://localhost:3000/api/health

# Check all services
docker-compose ps
```

### Logs

```bash
# Follow all logs
npm run docker:logs

# Service-specific logs
docker-compose logs -f gt7-app

# Export logs
docker-compose logs --no-color > app.log
```

## Backup and Recovery

### Data Backup

```bash
# Backup volumes
docker run --rm -v gt7-data-analysis_convex_data:/data -v $(pwd):/backup alpine tar czf /backup/convex_backup.tar.gz /data

# Backup Redis data
docker exec gt7-data-analysis-redis-1 redis-cli BGSAVE
```

### Recovery

```bash
# Restore volumes
docker run --rm -v gt7-data-analysis_convex_data:/data -v $(pwd):/backup alpine tar xzf /backup/convex_backup.tar.gz -C /
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Docker Build and Deploy

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Docker image
        run: npm run docker:build
        
      - name: Run tests
        run: docker run --rm gt7-data-analysis npm test
        
      - name: Deploy to production
        run: npm run docker:up
```

## Support

For issues related to:
- Docker configuration: Check this documentation
- Application errors: Check application logs
- Database issues: Check Convex dashboard
- Performance: Monitor container stats

---

**Next Steps**: After setting up Docker, you can proceed with implementing real telemetry file processing and user authentication.