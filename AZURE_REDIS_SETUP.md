# Azure Cache for Redis Setup

**Quick guide to set up Redis for appointment locking using Azure Cache for Redis**

---

## Why Azure Cache for Redis?

✅ **Fully managed** - No server maintenance  
✅ **High availability** - 99.9% SLA  
✅ **Automatic backups** - Data persistence  
✅ **Enterprise-grade security** - TLS encryption, VNet integration  
✅ **Scalable** - From Basic to Premium tiers  

**Use case in NMSL API:** Distributed locking for appointment processing (prevents multiple officers from editing the same appointment)

---

## Pricing Comparison

| Tier | Memory | Price/Month | Best For |
|------|--------|-------------|----------|
| **Basic C0** | 250 MB | ~$15 | Development/Testing |
| **Basic C1** | 1 GB | ~$45 | Small production |
| **Standard C1** | 1 GB | ~$80 | Production (with replication) |
| **Premium P1** | 6 GB | ~$250 | High availability + clustering |

**Recommendation for NMSL:** Start with **Basic C1** ($45/month) - enough for thousands of concurrent locks.

---

## Setup Steps

### 1. Create Azure Cache for Redis

**Azure CLI:**
```bash
# Create resource group (if not exists)
az group create --name nmsl-rg --location eastus

# Create Redis cache (Basic tier, 1GB)
az redis create \
  --name nmsl-redis \
  --resource-group nmsl-rg \
  --location eastus \
  --sku Basic \
  --vm-size c1
```

**Azure Portal:**
1. Go to [Azure Portal](https://portal.azure.com)
2. Click "Create a resource" → Search "Azure Cache for Redis"
3. Click "Create"
4. Fill in details:
   - **Subscription:** Your subscription
   - **Resource group:** nmsl-rg
   - **DNS name:** nmsl-redis  
     (Full hostname: `nmsl-redis.redis.cache.windows.net`)
   - **Location:** East US (same as API)
   - **Pricing tier:** Basic C1 (1 GB)
5. **Networking:** Public endpoint (or VNet if using App Service)
6. Click "Review + create" → "Create"
7. **Wait ~5-10 minutes** for deployment

---

### 2. Get Connection Details

**Azure Portal:**
1. Go to your Redis cache: `nmsl-redis`
2. Click **"Access keys"** in left sidebar
3. Copy:
   - **Host name:** `nmsl-redis.redis.cache.windows.net`
   - **Port (SSL):** `6380` (not 6379!)
   - **Primary access key:** Long string

**Azure CLI:**
```bash
# Get hostname
az redis show \
  --name nmsl-redis \
  --resource-group nmsl-rg \
  --query hostName -o tsv

# Get access keys
az redis list-keys \
  --name nmsl-redis \
  --resource-group nmsl-rg
```

---

### 3. Update Environment Variables

Update your `.env` file:

```bash
# Redis (Azure Cache for Redis)
REDIS_HOST=nmsl-redis.redis.cache.windows.net
REDIS_PORT=6380
REDIS_PASSWORD=your-primary-access-key-here
REDIS_TTL=1800
REDIS_TLS=true
```

**⚠️ Important:**
- Azure Redis uses **port 6380** (SSL/TLS) not 6379
- Redis password is the **Primary access key** from Azure Portal
- `REDIS_TLS=true` enables SSL (required by Azure)

---

### 4. Test Connection

Start your API:

```bash
npm run start:dev
```

**Expected logs:**
```
[NestApplication] Nest application successfully started
[Bootstrap] 🚀 NMSL Healthcare API running on http://localhost:8000/api/v1
```

**Test appointment locking:**
```bash
# Login as appointment officer
POST /api/v1/auth/sign-in
{
  "email": "officer@nmsl.app",
  "password": "password"
}

# Lock an appointment
PATCH /api/v1/appointments/:id/lock
{
  "officerName": "John Doe"
}

# Response should indicate lock acquired ✅
```

---

## Local Development vs Production

### Option 1: Use Azure Redis everywhere (Recommended)

**Pros:**
- ✅ Same environment everywhere
- ✅ No Docker/Redis installation needed locally
- ✅ Always connected to cloud

**Cons:**
- ❌ Requires internet connection
- ❌ Small latency from local dev to Azure

### Option 2: Local Redis for dev, Azure for production

**For local development:**
```bash
# .env.local
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_TLS=false

# Run Redis locally with Docker
docker run -d -p 6379:6379 redis:7-alpine
```

**For production:**
```bash
# .env
REDIS_HOST=nmsl-redis.redis.cache.windows.net
REDIS_PORT=6380
REDIS_PASSWORD=your-key
REDIS_TLS=true
```

---

## Monitoring & Management

### View Redis Metrics (Azure Portal)

1. Go to Redis cache → **Metrics**
2. Add charts:
   - **Connected Clients** - Active connections
   - **Cache Hits** - Successful lookups
   - **Cache Misses** - Failed lookups
   - **Operations Per Second** - Load
   - **Server Load** - CPU usage

### Common Operations

**Clear all locks (Redis Console):**
```bash
# In Azure Portal → Console
KEYS appointment:lock:*
DEL appointment:lock:appointment-id-here
```

**Get lock info:**
```bash
GET appointment:lock:appointment-id-here
TTL appointment:lock:appointment-id-here  # Shows remaining lock time
```

---

## Troubleshooting

### Error: "ECONNREFUSED" or "Connection timeout"

**Problem:** Can't connect to Azure Redis.

**Solutions:**
1. ✅ Verify Redis is running: Azure Portal → Resource → Overview → Status = "Running"
2. ✅ Check firewall: Azure Portal → Redis → Firewall → Add your IP
3. ✅ Verify hostname: Should be `.redis.cache.windows.net`
4. ✅ Use port **6380** (not 6379)
5. ✅ Set `REDIS_TLS=true`

### Error: "NOAUTH Authentication required"

**Problem:** Missing or wrong Redis password.

**Solution:**
1. Go to Azure Portal → Redis → Access keys
2. Copy **Primary** key (not connection string)
3. Update `REDIS_PASSWORD` in `.env`

### Error: "ERR unknown command 'AUTH'"

**Problem:** Azure Redis doesn't support AUTH command in some modes.

**Solution:** Use access key as password (already configured in your code).

### Locks not expiring

**Problem:** TTL not working properly.

**Check:**
```bash
# In Redis Console
TTL appointment:lock:your-appointment-id
# Should show remaining seconds (1800 = 30 min)
```

**Solution:**
- Verify `REDIS_TTL=1800` in `.env`
- Check code in `appointment-lock.service.ts`

---

## Production Best Practices

### 1. Enable Redis Persistence

**Azure Portal:**
1. Go to Redis cache → **Data persistence**
2. Enable **RDB backup**
3. Set backup frequency: Every 60 minutes
4. Select storage account for backups

### 2. Scale Up When Needed

Monitor these metrics to know when to scale:
- **Server Load** > 80% consistently → Upgrade to next tier
- **Memory usage** > 80% → Upgrade memory size
- **Connected clients** near limit → Upgrade tier

### 3. Use Private Endpoint (Production)

For better security:
1. Create VNet for App Service + Redis
2. Use private endpoint instead of public
3. Disable public network access

### 4. Set Up Alerts

**Azure Portal → Alerts → New alert rule:**
- **Server Load** > 90% for 5 minutes
- **Used Memory** > 90%
- **Evicted Keys** > 0 (memory pressure)

---

## Cost Optimization

### Development Environment

Use **Basic C0** ($15/month):
```bash
az redis create \
  --name nmsl-redis-dev \
  --resource-group nmsl-rg \
  --sku Basic \
  --vm-size c0
```

### Production Environment

Start with **Basic C1** ($45/month):
- 1 GB memory = ~100,000+ locks simultaneously
- Monitor usage and scale up if needed

### Scaling Strategy

```
Start: Basic C1 ($45/month)
  ↓ If you need high availability
Standard C1 ($80/month) - Adds replication
  ↓ If you need clustering/more memory
Premium P1 ($250/month) - 6GB + clustering
```

---

## Connection String Format (Alternative)

Azure also provides a connection string format:

```bash
# From Azure Portal → Connection string (StackExchange.Redis)
nmsl-redis.redis.cache.windows.net:6380,password=your-key,ssl=True,abortConnect=False
```

Your current setup uses individual properties (host, port, password), which is more flexible. ✅

---

## Summary

✅ **Setup:** ~10 minutes  
✅ **Cost:** $45/month (Basic C1) for production  
✅ **No code changes needed** - Just environment variables  
✅ **High availability** - 99.9% SLA  
✅ **Fully managed** - No maintenance  

---

## Next: Complete Azure Stack

You now have:
- ✅ **Storage:** Azure Blob Storage
- ✅ **Email:** Azure Communication Services
- ✅ **Redis:** Azure Cache for Redis
- ✅ **Database:** Neon PostgreSQL (or migrate to Azure PostgreSQL)
- ⏳ **Hosting:** Coming next - Azure App Service

**🎉 100% Azure ecosystem!**

---

**Questions?**

Test your Redis connection:
```bash
npm run start:dev
# Check logs for Redis connection success
```

Or test directly:
```bash
redis-cli -h nmsl-redis.redis.cache.windows.net -p 6380 -a your-key --tls
PING
# Should respond: PONG
```
