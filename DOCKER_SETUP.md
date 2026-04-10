# NMSL API - Docker Setup

## Quick Start with Docker Compose

### Prerequisites
- Docker Desktop installed
- Docker Compose installed

### Start All Services

```bash
# Start PostgreSQL, Redis, and API
docker-compose up -d

# View logs
docker-compose logs -f api

# Stop all services
docker-compose down

# Stop and remove volumes (⚠️ deletes data)
docker-compose down -v
```

### Access Services

- **API**: http://localhost:8000/api/v1
- **Swagger Docs**: http://localhost:8000/api/docs
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

### Run Database Seed

```bash
# Run seed inside the container
docker-compose exec api npm run seed
```

### Default Database Credentials

- Database: `nmsl_healthcare`
- User: `postgres`
- Password: `postgres123`

## Development Workflow

### 1. Start Infrastructure Only
```bash
# Start only PostgreSQL and Redis
docker-compose up -d postgres redis

# Run API locally
npm run start:dev
```

### 2. Run API in Development Mode
```bash
# Hot-reload enabled
docker-compose up api
```

### 3. View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api
docker-compose logs -f postgres
docker-compose logs -f redis
```

### 4. Execute Commands
```bash
# Run migrations
docker-compose exec api npm run migration:run

# Seed database
docker-compose exec api npm run seed

# Run tests
docker-compose exec api npm test
```

### 5. Database Access
```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U postgres -d nmsl_healthcare

# Connect to Redis CLI
docker-compose exec redis redis-cli
```

## Production Deployment

### Build Production Image
```bash
docker build -t nmsl-api:production .
```

### Run Production Container
```bash
docker run -d \
  --name nmsl-api \
  -p 8000:8000 \
  -e DATABASE_HOST=your-db-host \
  -e DATABASE_PASSWORD=your-secure-password \
  -e JWT_SECRET=your-secure-jwt-secret \
  -e REDIS_HOST=your-redis-host \
  nmsl-api:production
```

## Troubleshooting

### Container Won't Start
```bash
# Check logs
docker-compose logs api

# Check health
docker-compose ps
```

### Port Already in Use
```bash
# Change ports in docker-compose.yml
ports:
  - "8001:8000"  # Use port 8001 instead
```

### Database Connection Issues
```bash
# Restart PostgreSQL
docker-compose restart postgres

# Check if PostgreSQL is ready
docker-compose exec postgres pg_isready
```

### Redis Connection Issues
```bash
# Restart Redis
docker-compose restart redis

# Test Redis
docker-compose exec redis redis-cli ping
```

### Clean Slate Reset
```bash
# Stop and remove everything
docker-compose down -v

# Rebuild and start
docker-compose up -d --build
```

## Volume Management

### Backup Database
```bash
docker-compose exec postgres pg_dump -U postgres nmsl_healthcare > backup.sql
```

### Restore Database
```bash
cat backup.sql | docker-compose exec -T postgres psql -U postgres nmsl_healthcare
```

### Clear Redis Cache
```bash
docker-compose exec redis redis-cli FLUSHALL
```

## Environment Variables

Override environment variables in `docker-compose.override.yml`:

```yaml
version: '3.8'

services:
  api:
    environment:
      SENDGRID_API_KEY: your-api-key
      TWILIO_ACCOUNT_SID: your-sid
      AZURE_STORAGE_CONNECTION_STRING: your-connection-string
```
