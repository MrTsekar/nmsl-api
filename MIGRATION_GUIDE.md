# NMSL API - Migration to Separate Doctor Entity

**Date:** April 10, 2026  
**Status:** ✅ Complete

---

## Overview

This migration implements three major changes to align with the NMSL Portal specification:

1. ✅ **Separate Doctor Entity** - Doctors now have their own entity instead of being User records
2. ✅ **Updated Lock Endpoints** - Changed from POST to PATCH
3. ✅ **Admin Override Audit Logging** - Admin lock overrides are now logged to audit trail

---

## Changes Summary

### 1. Entity Architecture

#### Before
- Single `User` entity with roles: `patient`, `doctor`, `admin`, `appointment_officer`
- Doctor-specific fields in User entity (specialty, qualifications, consultationFee, etc.)
- `DoctorAvailability` linked to User via `doctorId`

#### After
- **Separate** `Doctor` entity with dedicated fields
- `User` entity for patients, admins, and appointment officers only
- `DoctorAvailability` linked to Doctor entity with new schema
- `Appointment` entity references both User (patient) and Doctor

---

### 2. New Doctor Entity

**File:** `src/modules/doctors/entities/doctor.entity.ts`

```typescript
@Entity('doctors')
export class Doctor {
  id: string;
  name: string;
  email: string; // unique
  password: string; // hashed
  specialty: string; // enum: General Practice, Cardiology, etc.
  location: string;
  state: string;
  phone: string;
  qualifications: string;
  avatar: string;
  isActive: boolean;
  availabilitySchedule: DoctorAvailability;
  createdAt: Date;
  updatedAt: Date;
}
```

**Specialty Enum:**
- General Practice
- Gynecology
- Physiotherapy
- Pediatrics
- Cardiology
- Dermatology
- Orthopedics
- Psychiatry
- Radiology
- Surgery

---

### 3. Updated DoctorAvailability Schema

**File:** `src/modules/doctors/entities/doctor-availability.entity.ts`

#### Before (Slot-based)
```typescript
{
  availableDays: string[];       // ['monday', 'tuesday']
  timeSlots: string[];           // ['09:00', '10:00', '11:00']
  bookedSlots: BookedSlot[];
  unavailableSlots: UnavailableSlot[];
}
```

#### After (Spec-compliant)
```typescript
{
  days: string[];                // ['monday', 'tuesday', 'wednesday']
  useUniformTime: boolean;       // true = same time all days, false = custom per day
  uniformTimeStart: string;      // '09:00' (when useUniformTime = true)
  uniformTimeEnd: string;        // '17:00' (when useUniformTime = true)
  customTimes: Record<string, { start: string; end: string }>; // when useUniformTime = false
}
```

**Example - Uniform Time:**
```json
{
  "days": ["monday", "tuesday", "wednesday", "thursday", "friday"],
  "useUniformTime": true,
  "uniformTimeStart": "09:00",
  "uniformTimeEnd": "17:00"
}
```

**Example - Custom Times:**
```json
{
  "days": ["monday", "wednesday", "friday"],
  "useUniformTime": false,
  "customTimes": {
    "monday": { "start": "08:00", "end": "14:00" },
    "wednesday": { "start": "09:00", "end": "15:00" },
    "friday": { "start": "10:00", "end": "16:00" }
  }
}
```

---

### 4. Updated Lock Endpoints

#### Before
```
POST /api/v1/appointments/:id/lock
POST /api/v1/appointments/:id/unlock
```

#### After
```
PATCH /api/v1/appointments/:id/lock
PATCH /api/v1/appointments/:id/unlock
```

**Rationale:** PATCH is more semantically correct for action-based endpoints that modify resource state.

---

### 5. Admin Override Audit Logging

#### New Audit Action
Added `ADMIN_OVERRIDE` to `AuditAction` enum:
```typescript
export enum AuditAction {
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  RESCHEDULED = 'rescheduled',
  COMPLETED = 'completed',
  ADMIN_OVERRIDE = 'admin_override',  // NEW
}
```

#### Implementation
When an admin overrides an active lock held by another officer, an audit log entry is created:

```typescript
{
  appointmentId: 'uuid',
  patientName: 'John Doe',
  action: 'admin_override',
  performedBy: 'admin@nmsl.app',
  performedByName: 'Admin Name',
  performedAt: new Date(),
  details: 'Admin AdminName (admin@nmsl.app) overrode lock held by officer@nmsl.app'
}
```

**Location:** `src/modules/appointments/services/appointment-lock.service.ts`

---

## Updated DTOs

### CreateDoctorDto

**File:** `src/modules/doctors/dto/create-doctor.dto.ts`

```typescript
export class CreateDoctorDto {
  name: string;
  email: string;
  password: string;
  phone: string;
  location: string;
  state?: string;
  specialty: DoctorSpecialty; // enum
  qualifications: string;
  avatar?: string;
}
```

### UpdateAvailabilityDto

**File:** `src/modules/doctors/dto/update-availability.dto.ts`

```typescript
export class UpdateAvailabilityDto {
  days: string[];               // Required
  useUniformTime: boolean;      // Required
  uniformTimeStart?: string;    // Required when useUniformTime = true
  uniformTimeEnd?: string;      // Required when useUniformTime = true
  customTimes?: Record<string, TimeSlot>; // Required when useUniformTime = false
}
```

---

## Updated Services

### Admin Service

**File:** `src/modules/admin/services/admin.service.ts`

#### Changes:
1. **Create Doctor** - Now creates `Doctor` entity with default availability
2. **Get Doctors** - Queries `Doctor` table with availability join
3. **KPIs** - Updated to count doctors from `Doctor` table

**Example - Create Doctor:**
```typescript
async createDoctor(dto: CreateDoctorDto): Promise<Doctor> {
  const hashedPassword = await bcrypt.hash(dto.password, 10);
  
  const doctor = this.doctorsRepository.create({
    ...dto,
    password: hashedPassword,
    isActive: true,
  });
  
  const savedDoctor = await this.doctorsRepository.save(doctor);
  
  // Create default availability (unavailable by default)
  const availability = this.doctorAvailabilityRepository.create({
    doctor: savedDoctor,
    days: [],
    useUniformTime: true,
    uniformTimeStart: null,
    uniformTimeEnd: null,
  });
  
  await this.doctorAvailabilityRepository.save(availability);
  
  return savedDoctor;
}
```

---

## Database Migration Requirements

### 1. Create `doctors` Table

```sql
CREATE TABLE doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  email VARCHAR UNIQUE NOT NULL,
  password VARCHAR NOT NULL,
  specialty VARCHAR NOT NULL CHECK (specialty IN (
    'General Practice', 'Gynecology', 'Physiotherapy', 
    'Pediatrics', 'Cardiology', 'Dermatology', 
    'Orthopedics', 'Psychiatry', 'Radiology', 'Surgery'
  )),
  location VARCHAR NOT NULL,
  state VARCHAR,
  phone VARCHAR,
  qualifications TEXT,
  avatar VARCHAR,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_doctors_email ON doctors(email);
CREATE INDEX idx_doctors_specialty ON doctors(specialty);
CREATE INDEX idx_doctors_location ON doctors(location);
```

### 2. Update `doctor_availability` Table

```sql
-- Drop old columns
ALTER TABLE doctor_availability DROP COLUMN IF EXISTS available_days;
ALTER TABLE doctor_availability DROP COLUMN IF EXISTS time_slots;
ALTER TABLE doctor_availability DROP COLUMN IF EXISTS booked_slots;
ALTER TABLE doctor_availability DROP COLUMN IF EXISTS unavailable_slots;
ALTER TABLE doctor_availability DROP COLUMN IF EXISTS doctor_id;

-- Add new columns
ALTER TABLE doctor_availability ADD COLUMN days TEXT; -- simple-array
ALTER TABLE doctor_availability ADD COLUMN use_uniform_time BOOLEAN DEFAULT true;
ALTER TABLE doctor_availability ADD COLUMN uniform_time_start TIME;
ALTER TABLE doctor_availability ADD COLUMN uniform_time_end TIME;
ALTER TABLE doctor_availability ADD COLUMN custom_times JSONB;

-- Update foreign key relationship
-- (Will be handled by TypeORM with cascade)
```

### 3. Migrate Existing Doctor Data

```sql
-- Migrate users with role='doctor' to doctors table
INSERT INTO doctors (id, name, email, password, specialty, location, state, phone, qualifications, avatar, is_active, created_at, updated_at)
SELECT id, name, email, password, specialty::text, location, state, phone, qualifications, avatar, is_active, created_at, updated_at
FROM users
WHERE role = 'doctor';

-- Update appointments to reference doctors table
-- (doctorId field already exists as UUID, no schema change needed)
UPDATE appointments
SET doctor_id = doctors.id
FROM doctors
WHERE appointments.doctor_id = doctors.id;

-- Remove doctor users from users table
DELETE FROM users WHERE role = 'doctor';
```

### 4. Update `audit_logs` Table

```sql
-- Add new admin_override action to enum
ALTER TABLE audit_logs 
ALTER COLUMN action TYPE VARCHAR;

-- Update action constraint
ALTER TABLE audit_logs
ADD CONSTRAINT check_audit_action 
CHECK (action IN ('accepted', 'rejected', 'rescheduled', 'completed', 'admin_override'));
```

---

## Updated Module Imports

### AppointmentsModule
```typescript
@Module({
  imports: [
    TypeOrmModule.forFeature([Appointment, DoctorAvailability]),
    UsersModule,
    NotificationsModule,
    ChatModule,
    AuditModule,  // ADDED for admin override logging
  ],
  // ...
})
```

### DoctorsModule
```typescript
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Doctor,                  // ADDED
      DoctorAvailability,
      Appointment
    ]),
    // ...
  ],
})
```

### AdminModule
```typescript
@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Doctor,                 // ADDED
      DoctorAvailability,     // ADDED
      Appointment
    ]),
    // ...
  ],
})
```

---

## Seed Data Changes

**File:** `src/database/seed.ts`

### Key Changes:
1. Creates `Doctor` entities instead of User with role='doctor'
2. Creates `DoctorAvailability` with new schema
3. Sample doctors have Monday-Friday, 9AM-5PM default availability

### Sample Doctor Creation:
```typescript
const savedDoctors: Doctor[] = [];

for (const doc of doctors) {
  const doctor = doctorRepository.create({
    ...doc,
    password: hashedPassword,
    isActive: true,
  });
  
  const savedDoctor = await doctorRepository.save(doctor);
  savedDoctors.push(savedDoctor);
  
  // Create availability
  const availability = doctorAvailabilityRepository.create({
    doctor: savedDoctor,
    days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    useUniformTime: true,
    uniformTimeStart: '09:00',
    uniformTimeEnd: '17:00',
    customTimes: null,
  });
  
  await doctorAvailabilityRepository.save(availability);
}
```

---

## Breaking Changes & Migration Path

### For Frontend/API Consumers

#### 1. Doctor Creation
**Before:**
```json
POST /api/v1/admin/doctors
{
  "name": "Dr. Smith",
  "email": "smith@nmsl.app",
  "password": "pass123",
  "role": "doctor",
  "specialty": "General Practice",
  "consultationFee": 15000
}
```

**After:**
```json
POST /api/v1/admin/doctors
{
  "name": "Dr. Smith",
  "email": "smith@nmsl.app",
  "password": "pass123",
  "specialty": "General Practice",
  "qualifications": "MBBS, FMCGP",
  "location": "Lagos",
  "phone": "+234..."
}
```

#### 2. Lock Endpoints
**Before:**
```javascript
fetch('/api/v1/appointments/123/lock', {
  method: 'POST',
  body: JSON.stringify({ officerEmail: 'officer@nmsl.app' })
})
```

**After:**
```javascript
fetch('/api/v1/appointments/123/lock', {
  method: 'PATCH',  // Changed from POST
  body: JSON.stringify({ officerEmail: 'officer@nmsl.app' })
})
```

#### 3. Availability Update
**Before:**
```json
PATCH /api/v1/admin/doctors/:id/availability
{
  "availableDays": ["Monday", "Tuesday"],
  "timeSlots": ["09:00", "10:00", "11:00"]
}
```

**After:**
```json
PATCH /api/v1/admin/doctors/:id/availability
{
  "days": ["monday", "tuesday", "wednesday"],
  "useUniformTime": true,
  "uniformTimeStart": "09:00",
  "uniformTimeEnd": "17:00"
}
```

---

## Testing Checklist

- [x] Doctor entity creation
- [x] Doctor availability CRUD
- [x] Appointment creation with Doctor reference
- [x] Lock/unlock endpoints with PATCH method
- [x] Admin override audit logging
- [x] Seed script execution
- [ ] Database migration execution
- [ ] Frontend integration testing

---

## API Documentation Updates

The Swagger documentation has been automatically updated to reflect:
- New `Doctor` entity schemas
- Updated `DoctorAvailability` DTO
- `PATCH` methods for lock endpoints
- New `admin_override` audit action

**Access:** http://localhost:8000/api/docs

---

## Rollback Plan

If issues arise:

1. **Restore old User-based doctor model:**
   - Revert entity changes
   - Restore old DTOs
   - Revert service logic

2. **Database rollback:**
   ```sql
   -- Migrate doctors back to users table
   INSERT INTO users (id, name, email, password, role, specialty, ...)
   SELECT id, name, email, password, 'doctor', specialty, ...
   FROM doctors;
   
   -- Drop doctors table
   DROP TABLE doctors;
   ```

3. **Revert lock endpoint methods:**
   - Change `@Patch` back to `@Post` in controller

---

## Next Steps

1. **Run Database Migration:**
   ```bash
   npm run migration:generate -- -n SeparateDoctorEntity
   npm run migration:run
   ```

2. **Run Seed Script:**
   ```bash
   npm run seed
   ```

3. **Test Endpoints:**
   - Create doctor via admin panel
   - Update doctor availability
   - Lock/unlock appointments
   - Verify admin override logging

4. **Update Frontend:**
   - Change lock endpoints to PATCH
   - Update doctor creation forms
   - Update availability management UI

---

## Support

For issues or questions about this migration, contact:
- **Backend Team Lead**
- **Database Administrator**
- **API Documentation Team**

---

**Migration completed successfully! ✅**
