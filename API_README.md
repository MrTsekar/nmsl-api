# NMSL Portal - Backend API

Comprehensive healthcare management system API for Nigerian Medical Services Limited (NMSL).

---

## 🚀 **Quick Start**

**Want to get started immediately?** See **[QUICKSTART.md](QUICKSTART.md)** for step-by-step setup guide!

**Deploying to production?** See **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** for Render and Azure deployment instructions.

---

## 🎯 Overview

The NMSL Portal is a robust NestJS-based backend system that manages:
- Patient appointments with exclusive locking mechanism for appointment officers
- Doctor management and availability scheduling  
- Multi-role user management (Admins, Appointment Officers, Patients, Doctors)
- Medical services catalog across multiple facilities
- Comprehensive audit tracking and officer performance statistics
- Board members and trusted partners management
- Real-time chat and notifications
- Medical results and prescriptions

## 🚀 Key Features

### 1. **Appointment Locking System** (Critical Feature)
- Redis-based distributed locking with 30-minute TTL
- Prevents multiple officers from working on the same appointment
- Admin override capability for locked appointments
- Automatic unlock on status change or timeout
- Real-time lock status tracking

### 2. **Comprehensive Audit Trail**
- Automatic logging of all appointment actions
- Officer performance statistics and analytics
- Date-range and action-based filtering
- Tracks accepted, rejected, rescheduled, and completed appointments

### 3. **Role-Based Access Control (RBAC)**
- **Admin**: Full system access, can override locks, manage all resources
- **Appointment Officer**: Process appointments with exclusive locks
- **Doctor**: Manage consultations, appointments, and medical records
- **Patient**: Book appointments, view medical records

### 4. **Multi-Location Support**
Supports operations across 6 facilities:
- Abuja (FCT)
- Lagos
- Benin (Edo)
- Kaduna
- Port Harcourt (Rivers)
- Warri (Delta)

## 📋 Technology Stack

- **Runtime**: Node.js 20+
- **Framework**: NestJS 11+
- **Database**: PostgreSQL 15+
- **ORM**: TypeORM
- **Cache/Locks**: Redis with ioredis
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: class-validator, class-transformer
- **Documentation**: Swagger/OpenAPI
- **Email**: SendGrid
- **SMS**: Twilio
- **File Storage**: Azure Blob Storage
- **Real-time**: Socket.IO (WebSockets)

## 🛠️ Installation

### Prerequisites
- Node.js 20 or higher
- PostgreSQL 15 or higher
- Redis 7 or higher
- npm or yarn

### Setup Steps

1. **Clone the repository**
```bash
git clone <repository-url>
cd nmsl-api
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
```bash
cp .env.example .env
```

Edit `.env` and update the following:
```env
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=your_password
DATABASE_NAME=nmsl_healthcare
DATABASE_SYNC=true  # Set to false in production

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-characters
JWT_EXPIRATION=7d

# Redis (for appointment locking)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_TTL=1800  # 30 minutes in seconds

# Email (SendGrid)
SENDGRID_API_KEY=your_sendgrid_api_key
EMAIL_FROM=noreply@nmsl.app

# SMS (Twilio)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=+1234567890

# Azure Blob Storage
AZURE_STORAGE_CONNECTION_STRING=your_connection_string
AZURE_STORAGE_CONTAINER=nmsl-medical-files

# Application
NODE_ENV=development
PORT=8000
FRONTEND_URL=http://localhost:3000
```

4. **Start PostgreSQL and Redis**
```bash
# Using Docker Compose (recommended)
docker-compose up -d postgres redis

# Or start them individually
```

5. **Run database migrations** (if migrations exist)
```bash
npm run migration:run
```

6. **Seed the database with initial data**
```bash
npm run seed
```

This will create:
- Admin user: `admin@nmsl.app` / `Admin@123`
- Appointment officers: `officer1@nmsl.app`, `officer2@nmsl.app` / `Admin@123`
- Sample doctors across different specialties
- Sample patients
- Board members, partners, services, and contact info

7. **Start the development server**
```bash
npm run start:dev
```

The API will be available at: `http://localhost:8000/api/v1`

## 📚 API Documentation

Once the server is running, access the interactive Swagger documentation:

**Swagger UI**: http://localhost:8000/api/docs

The documentation includes:
- All available endpoints
- Request/response schemas
- Authentication requirements
- Try-out functionality

## 🔐 Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Getting a Token

**POST** `/api/v1/auth/sign-in`
```json
{
  "email": "admin@nmsl.app",
  "password": "Admin@123"
}
```

Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "name": "Emeka Nwosu",
    "email": "admin@nmsl.app",
    "role": "admin",
    "location": "Abuja"
  }
}
```

## 🔑 Default User Credentials

After seeding the database:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@nmsl.app | Admin@123 |
| Appointment Officer | officer1@nmsl.app | Admin@123 |
| Appointment Officer | officer2@nmsl.app | Admin@123 |
| Doctor | ken.wu@nmsl.app | Doctor@123 |
| Doctor | sarah.chen@nmsl.app | Doctor@123 |
| Patient | john.doe@email.com | Patient@123 |
| Patient | jane.smith@email.com | Patient@123 |

## 📁 Project Structure

```
src/
├── common/                    # Shared utilities
│   ├── decorators/           # Custom decorators (Roles, CurrentUser)
│   ├── filters/              # Exception filters
│   ├── guards/               # Auth guards (JWT, Roles)
│   └── interceptors/         # Response transformers
├── config/                    # Configuration files
│   ├── database.config.ts
│   ├── jwt.config.ts
│   └── redis.config.ts
├── modules/                   # Feature modules
│   ├── auth/                 # Authentication & authorization
│   ├── users/                # User management
│   ├── admin/                # Admin management endpoints
│   ├── appointments/         # Appointment management + locking
│   ├── audit/                # Audit logs & statistics
│   ├── doctors/              # Doctor management & availability
│   ├── services/             # Medical services catalog
│   ├── partners/             # Trusted partners
│   ├── board-members/        # Board of directors
│   ├── contact/              # Contact information
│   ├── statistics/           # Homepage statistics
│   ├── chat/                 # Real-time messaging
│   ├── notifications/        # User notifications
│   ├── medical-results/      # Medical test results
│   └── file-upload/          # File storage service
├── database/                  # Database utilities
│   ├── seed.ts               # Seed data
│   └── run-seed.ts           # Seed runner
├── app.module.ts             # Root module
└── main.ts                   # Application entry point
```

## 🔄 Key Workflows

### Appointment Locking Workflow

1. **Officer locks appointment**
   ```
   POST /api/v1/appointments/:id/lock
   {
     "officerEmail": "officer1@nmsl.app",
     "isAdmin": false
   }
   ```

2. **Lock is stored in Redis with 30-minute TTL**

3. **Officer processes the appointment** (confirm/reject/reschedule)

4. **Appointment is auto-unlocked** when status changes to final state

5. **Admin can override** any lock at any time

### Audit Log Creation

Audit logs are automatically created when:
- Appointment status changes to: `confirmed`, `rejected`, `completed`
- Appointment is rescheduled

The audit log captures:
- Appointment ID and patient name
- Action performed (accepted/rejected/rescheduled/completed)
- Officer email and name
- Timestamp
- Additional details (e.g., reschedule reason)

### Officer Statistics Calculation

Statistics are calculated from audit logs:
- Total appointments processed
- Breakdown by action type (accepted, rejected, rescheduled, completed)
- Last activity timestamp
- Filterable by date range

## 🧪 Testing

### Run Tests
```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 🚀 Production Deployment

### Build for Production
```bash
npm run build
npm run start:prod
```

### Environment Considerations

1. **Database**:
   - Set `DATABASE_SYNC=false`
   - Run migrations instead of auto-sync
   - Enable SSL connection
   - Set up connection pooling

2. **Redis**:
   - Enable password authentication
   - Configure persistence (AOF or RDB)
   - Set up maxmemory policy

3. **Security**:
   - Use strong `JWT_SECRET` (min 32 characters)
   - Enable CORS with specific origins
   - Implement rate limiting (already configured)
   - Enable HTTPS only

4. **Monitoring**:
   - Set up logging to external service
   - Configure error tracking (e.g., Sentry)
   - Monitor Redis and database performance

### Docker Deployment

```bash
# Build image
docker build -t nmsl-api .

# Run with docker-compose
docker-compose up -d
```

## 📊 Database Schema

Key entities:
- **users**: Admins, officers, doctors, patients
- **appointments**: With locking fields (lockedBy, lockedAt)
- **audit_logs**: Comprehensive audit trail
- **doctor_availability**: Doctor schedules
- **services**: Medical services catalog
- **board_members**: Board of directors
- **partners**: Trusted partners
- **contact_info**: Contact information (singleton)
- **statistics**: Homepage statistics
- **chat_conversations**: Real-time messaging
- **notifications**: User notifications
- **medical_results**: Lab results and prescriptions

## 🔧 API Endpoints Summary

### Authentication
- `POST /auth/sign-in` - User login
- `POST /auth/sign-up` - User registration
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password with token

### Admin Management
- `GET /admin/kpis` - Dashboard KPIs
- `GET /admin/admins` - List all admins
- `POST /admin/admins` - Create new admin
- `PATCH /admin/admins/:id/toggle-status` - Toggle admin status
- `PATCH /admin/admins/:id/password` - Change admin password
- `DELETE /admin/admins/:id` - Delete admin

### Appointments
- `GET /appointments` - List appointments (filtered by role)
- `POST /appointments` - Book appointment (patient)
- `PATCH /appointments/:id/status` - Update status (admin/officer)
- `PATCH /appointments/:id/reschedule` - Reschedule appointment
- **`POST /appointments/:id/lock`** - Lock appointment (critical)
- **`POST /appointments/:id/unlock`** - Unlock appointment (critical)
- `GET /appointments/:id/lock-status` - Check lock status

### Audit & Statistics
- `GET /admin/audit/logs` - Get audit logs
- `GET /admin/audit/statistics` - Officer performance stats

### Doctors
- `GET /admin/doctors` - List all doctors
- `POST /admin/doctors` - Create doctor account
- `PATCH /admin/doctors/:id/availability` - Update availability

### Services, Partners, Board Members
- Standard CRUD operations for each resource
- Public GET endpoints, admin-only CUD operations

## 🐛 Troubleshooting

### Connection Issues
- Verify PostgreSQL and Redis are running
- Check connection strings in `.env`
- Ensure firewall allows connections

### Authentication Errors
- Verify JWT_SECRET is set
- Check token expiration
- Ensure user is active

### Lock Conflicts
- Check Redis connection
- Verify lock TTL configuration
- Admin can override any lock

## 📝 License

Private - Nigerian Medical Services Limited (NMSL)

## 👥 Support

For support, contact: nmshutako@nnpcgroup.com

---

**Built with ❤️ for NMSL Healthcare**
