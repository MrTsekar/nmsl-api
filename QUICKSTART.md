# 🚀 NMSL API - Quick Start Guide

**Get the API running with Neon PostgreSQL in 5 minutes!**

---

## ✅ Prerequisites

- Node.js 18+ installed
- npm or yarn
- Neon database account (already configured in `.env`)

---

## 📦 Step 1: Install Dependencies

```bash
npm install
```

---

## 🗄️ Step 2: Set Up Database

### A. Test Database Connection

Make sure your `.env` file has the correct Neon credentials:

```bash
# Database - Neon PostgreSQL
DATABASE_HOST=ep-dawn-meadow-anj4xlo3-pooler.c-6.us-east-1.aws.neon.tech
DATABASE_PORT=5432
DATABASE_USER=neondb_owner
DATABASE_PASSWORD=npg_7ptgL2PdTaNh
DATABASE_NAME=neondb
DATABASE_SYNC=false
DATABASE_SSL=true
```

### B. Build the Project

```bash
npm run build
```

### C. Run Migrations

This creates all database tables:

```bash
npm run migration:run
```

### D. Create Admin User

This creates an admin account for testing:

```bash
npm run create-admin
```

**Credentials created:**
- 📧 Email: `admin@nmsl.app`
- 🔑 Password: `Admin@123456`

⚠️ **IMPORTANT:** Change this password after first login!

---

## 🎯 Step 3: Start the Server

### Development Mode (with auto-reload)

```bash
npm run start:dev
```

### Production Mode

```bash
npm run build
npm run start:prod
```

The API will be available at: **http://localhost:8000**

---

## 🧪 Step 4: Test the API

### Method 1: Health Check (Browser)

Open in your browser:
```
http://localhost:8000/api/v1
```

You should see:
```json
{
  "status": "ok",
  "message": "NMSL Healthcare API is running",
  "version": "1.0",
  "docs": "/api/docs"
}
```

### Method 2: Login Test (cURL)

```bash
curl -X POST http://localhost:8000/api/v1/auth/sign-in \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@nmsl.app\",\"password\":\"Admin@123456\"}"
```

You should get a response with:
```json
{
  "access_token": "eyJhbGciOiJIUzI1...",
  "user": {
    "id": "...",
    "email": "admin@nmsl.app",
    "role": "admin"
  }
}
```

### Method 3: Swagger UI (Interactive Docs)

Open in your browser:
```
http://localhost:8000/api/docs
```

This gives you an interactive API playground! 🎉

---

## 📊 Step 5: (Optional) Seed Sample Data

If you want sample doctors, appointments, etc.:

```bash
npm run seed
```

This creates:
- 5 sample doctors
- Board members
- Partners
- Services
- Statistics
- Sample appointments

---

## 🌐 Deploy to Render

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for detailed deployment instructions.

**Quick steps:**

1. Push code to GitHub
2. Create new Web Service on Render
3. Set environment variables (copy from `.env`)
4. Deploy!

---

## 🔧 Common Commands

| Command | Description |
|---------|-------------|
| `npm run start:dev` | Start development server |
| `npm run build` | Build TypeScript to JavaScript |
| `npm run start:prod` | Start production server |
| `npm run migration:run` | Run pending migrations |
| `npm run migration:revert` | Revert last migration |
| `npm run seed` | Seed database with sample data |
| `npm run create-admin` | Create admin user |
| `npm test` | Run tests |

---

## 🆘 Troubleshooting

### Error: "Connection timeout"

**Issue:** Can't connect to Neon database

**Solutions:**
1. Check internet connection
2. Verify `DATABASE_SSL=true` in `.env`
3. Confirm Neon database is active (check Neon dashboard)
4. Test connection string in Neon SQL Editor

### Error: "relation does not exist"

**Issue:** Database tables not created

**Solution:**
```bash
# Make sure migrations ran successfully
npm run build
npm run migration:run
```

### Error: "Port 8000 already in use"

**Issue:** Something is using port 8000

**Solutions:**
1. Change `PORT=8001` in `.env`
2. Or stop the other process:
   ```bash
   # Windows
   netstat -ano | findstr :8000
   taskkill /PID <process_id> /F
   
   # Mac/Linux
   lsof -ti:8000 | xargs kill
   ```

### Error: "JWT must be provided"

**Issue:** Missing JWT_SECRET

**Solution:**
```bash
# Generate a secure secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Add to .env
JWT_SECRET=<generated_secret>
```

---

## 🔐 Security Checklist

Before deploying to production:

- [ ] Change `JWT_SECRET` to a strong random value
- [ ] Set `DATABASE_SYNC=false` (use migrations instead)
- [ ] Change admin password from default
- [ ] Set correct `FRONTEND_URL` for CORS
- [ ] Enable rate limiting (already configured)
- [ ] Set up Redis for appointment locking
- [ ] Configure SendGrid for emails (optional)
- [ ] Configure Twilio for SMS (optional)
- [ ] Set up Azure Blob Storage for file uploads (optional)

---

## 📚 Next Steps

1. **Explore API Endpoints:** http://localhost:8000/api/docs
2. **Read Deployment Guide:** [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
3. **Review Implementation Status:** [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md)
4. **Check Migration Guide:** [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md)

---

## 📞 Need Help?

- **API Documentation:** http://localhost:8000/api/docs (Swagger UI)
- **Backend Spec:** [BACKEND_API_SPEC.md](BACKEND_API_SPEC.md)
- **Implementation Status:** [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md)

---

**Happy Coding! 🎉**
