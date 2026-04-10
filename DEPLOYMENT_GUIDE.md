# NMSL API - Deployment & Environment Configuration Guide

**Last Updated:** April 10, 2026

---

## 🌍 Environment Configuration Strategy

This app uses environment variables to switch between development, staging, and production seamlessly. **No code changes needed** when moving between platforms!

---

## 📁 Environment Files

### Local Development
**File:** `.env` (gitignored)
```env
NODE_ENV=development
APP_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3000
DATABASE_HOST=localhost
# ... other local settings
```

### Render Deployment
**File:** `.env.render` (gitignored)
```env
NODE_ENV=production
APP_URL=${RENDER_EXTERNAL_URL}
FRONTEND_URL=https://your-frontend.vercel.app
DATABASE_HOST=ep-dawn-meadow-anj4xlo3-pooler.c-6.us-east-1.aws.neon.tech
# ... Render-specific settings
```

### Azure Deployment (Future)
**File:** `.env.azure` (gitignored)
```env
NODE_ENV=production
APP_URL=https://nmsl-api.azurewebsites.net
FRONTEND_URL=https://nmsl-portal.azurewebsites.net
DATABASE_HOST=your-azure-pg.postgres.database.azure.com
# ... Azure-specific settings
```

---

## 🚀 Deployment Steps

### Step 1: Deploy to Render

#### A. Create Render Web Service

1. **Go to:** https://dashboard.render.com
2. **Click:** "New +" → "Web Service"
3. **Connect:** Your GitHub repository
4. **Configure:**
   - **Name:** `nmsl-api`
   - **Environment:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `node dist/main.js`
   - **Plan:** Free (or paid for better performance)

#### B. Set Environment Variables on Render

Go to Environment section and add:

```bash
NODE_ENV=production
PORT=8000
APP_URL=https://nmsl-api.onrender.com
FRONTEND_URL=https://your-frontend-url.vercel.app

# Database - Neon PostgreSQL
DATABASE_HOST=ep-dawn-meadow-anj4xlo3-pooler.c-6.us-east-1.aws.neon.tech
DATABASE_PORT=5432
DATABASE_USER=neondb_owner
DATABASE_PASSWORD=npg_7ptgL2PdTaNh
DATABASE_NAME=neondb
DATABASE_SYNC=false
DATABASE_SSL=true

# JWT Secret - GENERATE A NEW ONE!
JWT_SECRET=your_super_secret_random_jwt_key_min_32_chars
JWT_EXPIRATION=7d

# Redis (Optional - add Render Redis addon)
REDIS_HOST=your-redis-instance.render.com
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
REDIS_TTL=1800

# Email (Optional)
SENDGRID_API_KEY=
EMAIL_FROM=noreply@nmsl.app

# Rate Limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=100
```

#### C. Add Redis (for Appointment Locking)

1. Go to Render Dashboard
2. Click "New +" → "Redis"
3. Create Redis instance
4. Copy connection details to environment variables

#### D. Deploy

1. Click "Create Web Service"
2. Wait for build to complete
3. Your API will be live at: `https://nmsl-api.onrender.com`

---

### Step 2: Initialize Database

#### Run Migrations

```bash
# SSH into Render (or use Render Shell)
npm run migration:run
```

Or run locally pointing to Neon database:

```bash
# In your local terminal
npm run migration:run
```

#### Create Admin User

```bash
# Run the admin creation script
npm run create-admin
```

Or manually via SQL:

```sql
INSERT INTO users (
  name, email, password, role, location, state, 
  phone, gender, "isActive", "createdAt", "updatedAt"
) VALUES (
  'NMSL System Admin',
  'admin@nmsl.app',
  '$2b$10$hashedPasswordHere',  -- Use bcrypt to hash
  'admin',
  'Abuja',
  'FCT',
  '+234 800 000 0000',
  'male',
  true,
  NOW(),
  NOW()
);
```

---

### Step 3: Test Your Deployment

#### A. Health Check
```bash
curl https://nmsl-api.onrender.com/api/v1
```

#### B. Test Login
```bash
curl -X POST https://nmsl-api.onrender.com/api/v1/auth/sign-in \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@nmsl.app",
    "password": "Admin@123456"
  }'
```

#### C. Access Swagger Docs
```
https://nmsl-api.onrender.com/api/docs
```

---

## 🔄 Moving to Azure (Future)

### When you're ready to migrate:

#### 1. **Create Azure Resources**

```bash
# Azure CLI commands
az group create --name nmsl-rg --location eastus

# Create App Service
az appservice plan create \
  --name nmsl-plan \
  --resource-group nmsl-rg \
  --sku B1 \
  --is-linux

az webapp create \
  --name nmsl-api \
  --resource-group nmsl-rg \
  --plan nmsl-plan \
  --runtime "NODE:20-lts"

# Create PostgreSQL (if moving from Neon)
az postgres flexible-server create \
  --name nmsl-db \
  --resource-group nmsl-rg \
  --location eastus \
  --admin-user nmsl_admin \
  --admin-password YourSecurePassword123! \
  --sku-name Standard_B2s \
  --tier Burstable \
  --storage-size 32

# Create Redis Cache
az redis create \
  --name nmsl-redis \
  --resource-group nmsl-rg \
  --location eastus \
  --sku Basic \
  --vm-size c0
```

#### 2. **Set Azure Environment Variables**

```bash
az webapp config appsettings set \
  --name nmsl-api \
  --resource-group nmsl-rg \
  --settings \
    NODE_ENV=production \
    APP_URL=https://nmsl-api.azurewebsites.net \
    FRONTEND_URL=https://nmsl-portal.azurewebsites.net \
    DATABASE_HOST=nmsl-db.postgres.database.azure.com \
    DATABASE_PORT=5432 \
    DATABASE_USER=nmsl_admin \
    DATABASE_PASSWORD=YourSecurePassword123! \
    DATABASE_NAME=nmsl_healthcare \
    DATABASE_SSL=true \
    JWT_SECRET=your_jwt_secret \
    REDIS_HOST=nmsl-redis.redis.cache.windows.net \
    REDIS_PORT=6380 \
    REDIS_PASSWORD=your-redis-key
```

#### 3. **Deploy to Azure**

```bash
# Configure deployment source
az webapp deployment source config \
  --name nmsl-api \
  --resource-group nmsl-rg \
  --repo-url https://github.com/your-username/nmsl-api \
  --branch main \
  --manual-integration

# Or use GitHub Actions (recommended)
```

#### 4. **Update Frontend Environment Variables**

```bash
# Frontend .env.production
NEXT_PUBLIC_API_BASE_URL=https://nmsl-api.azurewebsites.net/api/v1
```

**That's it!** No code changes needed - just environment variables.

---

## 🎯 Making It Easy to Switch

### 1. **Use Environment-Specific Config**

Your app already supports this via `ConfigService`:

```typescript
// Example in your code
const apiUrl = this.configService.get('APP_URL');
const frontendUrl = this.configService.get('FRONTEND_URL');
```

### 2. **Frontend Configuration**

Create environment files in your frontend:

```bash
# .env.development
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1

# .env.staging (Render)
NEXT_PUBLIC_API_BASE_URL=https://nmsl-api.onrender.com/api/v1

# .env.production (Azure)
NEXT_PUBLIC_API_BASE_URL=https://nmsl-api.azurewebsites.net/api/v1
```

Deploy with:
```bash
# Vercel
vercel --prod --env-file .env.production

# Or set in Vercel dashboard
NEXT_PUBLIC_API_BASE_URL=https://nmsl-api.azurewebsites.net/api/v1
```

### 3. **Use a Deployment Script**

Create `deploy.sh`:

```bash
#!/bin/bash

ENVIRONMENT=$1

if [ "$ENVIRONMENT" == "render" ]; then
  echo "🚀 Deploying to Render..."
  git push render main
elif [ "$ENVIRONMENT" == "azure" ]; then
  echo "🚀 Deploying to Azure..."
  git push azure main
else
  echo "❌ Invalid environment. Use: render or azure"
  exit 1
fi
```

---

## 🔐 Security Best Practices

### 1. **Never Commit Secrets**
- ✅ Keep `.env` in `.gitignore`
- ✅ Use environment variables only
- ✅ Rotate secrets regularly

### 2. **Generate Strong JWT Secret**

```bash
# Generate a random secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 3. **Enable CORS Properly**

```typescript
// main.ts
app.enableCors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
});
```

---

## 📊 Monitoring & Logging

### Render
- Built-in logs: Dashboard → Your Service → Logs
- Metrics: Dashboard → Your Service → Metrics

### Azure (Future)
- Application Insights
- Log Analytics
- Azure Monitor

---

## 🆘 Troubleshooting

### Issue: Database Connection Fails

**Solution:**
```bash
# Check SSL requirement
DATABASE_SSL=true

# Verify credentials
echo $DATABASE_PASSWORD
```

### Issue: Migrations Won't Run

**Solution:**
```bash
# Build first
npm run build

# Then run migrations
npm run migration:run
```

### Issue: Redis Connection Error

**Solution:**
```bash
# Check if Redis is running
# For Render: Add Redis addon
# For Azure: Use Azure Cache for Redis
```

---

## 📝 Checklist Before Going Live

- [ ] Generate strong JWT secret
- [ ] Set `DATABASE_SYNC=false` in production
- [ ] Configure CORS with actual frontend URL
- [ ] Set up Redis for appointment locking
- [ ] Run database migrations
- [ ] Create admin user
- [ ] Test all critical endpoints
- [ ] Set up monitoring/logging
- [ ] Configure rate limiting
- [ ] Set up backup strategy
- [ ] Document API endpoints

---

## 🎉 Summary

**The beauty of this setup:**

1. **Same codebase** works on Render, Azure, AWS, anywhere!
2. **Just change environment variables** - no code changes
3. **Easy migration path** from Render → Azure
4. **Frontend just updates** `NEXT_PUBLIC_API_BASE_URL`
5. **Database can be Neon, Azure Postgres, or any PostgreSQL**

---

**Questions?**
- Check Swagger docs: `https://your-api.com/api/docs`
- Review environment variables in `.env.example`
- Contact DevOps team for secrets

---

**Happy Deploying! 🚀**
