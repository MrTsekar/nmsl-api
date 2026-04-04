# NMSL Portal — NestJS Backend API Specification

> This document is a complete reference for building the NestJS backend that the NMSL Portal frontend consumes.
> Every endpoint, payload shape, response shape, enum value, and business rule is derived directly from the frontend source code.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture & Tech Stack](#2-architecture--tech-stack)
3. [Authentication & Authorization](#3-authentication--authorization)
4. [Data Models & Types](#4-data-models--types)
5. [API Endpoints Reference](#5-api-endpoints-reference)
   - 5.1 [Auth](#51-auth)
   - 5.2 [Users (Public)](#52-users-public)
   - 5.3 [Admin — KPIs](#53-admin--kpis)
   - 5.4 [Admin — Doctors](#54-admin--doctors)
   - 5.5 [Admin — Admins](#55-admin--admins)
   - 5.6 [Admin — Users](#56-admin--users)
   - 5.7 [Admin — Appointments](#57-admin--appointments)
   - 5.8 [Admin — Services](#58-admin--services)
   - 5.9 [Admin — Statistics](#59-admin--statistics)
   - 5.10 [Admin — Partners](#510-admin--partners)
   - 5.11 [Admin — Board Members](#511-admin--board-members)
   - 5.12 [Admin — Contact](#512-admin--contact)
   - 5.13 [Public — Partners](#513-public--partners)
   - 5.14 [Public — Board Members](#514-public--board-members)
   - 5.15 [Public — Contact](#515-public--contact)
   - 5.16 [Auth — Profile (Self)](#516-auth--profile-self)
6. [NestJS Module Structure](#6-nestjs-module-structure)
7. [DTOs (Data Transfer Objects)](#7-dtos-data-transfer-objects)
8. [Guards & Roles](#8-guards--roles)
9. [Response Shapes Summary](#9-response-shapes-summary)
10. [Environment Variables](#10-environment-variables)
11. [Constants & Enums](#11-constants--enums)

---

## 1. Project Overview

**NMSL Portal** is a healthcare administration system for a Nigerian medical services organization with facilities in multiple cities (Abuja, Lagos, Port Harcourt, Benin, Kaduna, Warri).

The frontend is a Next.js 15 application. This document specifies the REST API the NestJS backend must implement.

**Base URL (Development):** `http://localhost:4000`  
**Auth Scheme:** JWT Bearer Token  
**Token Storage (client-side):** `localStorage` key `nmsl-token`

---

## 2. Architecture & Tech Stack

### Recommended NestJS Stack

| Concern | Recommendation |
|---|---|
| Framework | NestJS |
| ORM | TypeORM or Prisma |
| Auth | `@nestjs/jwt` + `@nestjs/passport` |
| Validation | `class-validator` + `class-transformer` |
| Hashing | `bcrypt` |
| Database | PostgreSQL |

### Frontend API Client

The frontend uses **Axios** with:
- `Content-Type: application/json` on all requests
- `Authorization: Bearer <token>` injected from `localStorage` when token is present

---

## 3. Authentication & Authorization

### JWT Token Flow

1. Client calls `POST /auth/sign-in` → receives `{ token, user }`
2. Client stores `token` in `localStorage` under key `nmsl-token`
3. Every subsequent request includes `Authorization: Bearer <token>`

### Roles

```typescript
type Role = "admin" | "appointment_officer";
```

| Role | Access |
|---|---|
| `admin` | Full access to all `/admin/*` endpoints |
| `appointment_officer` | Dashboard, Users (view-only), Appointments (full CRUD), own Profile |

> **Note:** The frontend also references a `doctor` role in the create-doctor flow but it is not in the `Role` union for portal login. Doctors are backend-only entities.

### Password Reset Flow

1. `POST /auth/forgot-password` — sends a reset email with a token
2. `POST /auth/reset-password` — client submits the token + new password

### appointment_officer Allowed Routes

The frontend `RoleGuard` enforces that `appointment_officer` can only access these paths. Requests to any other admin route are redirected to `/app/admin/appointments`:

```typescript
const appointmentOfficerAllowedRoutes = [
  "/app/admin",              // exact match only
  "/app/admin/users",       // and sub-routes (view-only)
  "/app/admin/settings",    // own profile (local store only)
  "/app/admin/appointments",// and sub-routes (full access)
];
```

This maps to these backend API permissions:

| Endpoint | `admin` | `appointment_officer` |
|---|---|---|
| `GET /admin/kpis` | ✓ | ✓ |
| `GET /admin/users` | ✓ | ✓ (read-only) |
| `PATCH /admin/users/:id/toggle-status` | ✓ | ✗ |
| `POST /admin/users/:id/reset-password` | ✓ | ✗ |
| `PATCH /admin/users/:id/email` | ✓ | ✗ |
| `GET /admin/appointments` | ✓ | ✓ |
| `PATCH /admin/appointments/:id/status` | ✓ | ✓ |
| `PATCH /admin/appointments/:id/reschedule` | ✓ | ✓ |
| All other `/admin/*` routes | ✓ | ✗ |

---

## 4. Data Models & Types

### User

```typescript
interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "appointment_officer";
  location: string;       // One of Nigeria Locations (see §11)
  state?: string;         // One of Nigerian States (see §11)
  address?: string;
  avatar?: string;
  phone?: string;
  dateOfBirth?: string;   // ISO date string e.g. "1975-06-15"
  gender?: "female" | "male" | "other";
}
```

### Doctor

```typescript
interface Doctor {
  id: string;
  name: string;
  email: string;
  specialty: MedicalSpecialty; // see §11
  location: string;
  state?: string;
  phone?: string;
  qualifications?: string;
  avatar?: string;
  isActive?: boolean;
}
```

### Appointment

```typescript
type AppointmentStatus =
  | "pending"
  | "scheduled"
  | "confirmed"
  | "rescheduled"
  | "cancelled"
  | "rejected"
  | "completed"
  | "no-show";

type VisitType = "Physical" | "Telemedicine";

interface Appointment {
  id: string;
  patientName: string;
  patientEmail?: string;
  patientPhone?: string;
  doctorName: string;
  date: string;            // ISO date "YYYY-MM-DD"
  time: string;            // "HH:mm"
  status: AppointmentStatus;
  location: string;
  specialty: MedicalSpecialty;
  visitType?: VisitType;
  reasonForVisit?: string;
  additionalComment?: string;
  isUrgent?: boolean;
  rescheduleReason?: string;
}
```

### Service

```typescript
interface KeyService {
  id: string;
  title: string;
  description: string;
}

type ServiceCategory =
  | "Emergency Services"
  | "Specialized Care"
  | "Dental Care"
  | "Primary Care"
  | "Surgical Services"
  | "Diagnostic Services"
  | "Women's Health"
  | "Pediatric Care"
  | "Mental Health"
  | "Rehabilitation";

interface Service {
  id: string;
  name: string;
  category: ServiceCategory;
  location: string;
  shortDescription: string;
  fullDescription: string;
  bannerImageUrl?: string;
  iconImageUrl?: string;
  keyServices: KeyService[];
  createdAt: string;       // ISO datetime
  updatedAt: string;       // ISO datetime
}
```

### Partner

```typescript
interface Partner {
  id: string;
  name: string;
  logoUrl: string;
  description?: string;
  order: number;           // display sort order (ascending)
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### BoardMember

```typescript
interface BoardMember {
  id: string;
  name: string;
  title: string;           // Job title/position
  photoUrl: string;
  bio?: string;
  order: number;           // display sort order (ascending)
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### ContactInfo

```typescript
interface ContactInfo {
  id: string;
  phone: string;
  emailPrimary: string;
  emailSecondary?: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  country: string;
  officeHours: string;
  emergencyHours: string;
  updatedAt: string;
}
```

### Statistic

```typescript
type StatisticIcon = "clock" | "building" | "users" | "award" | "heart" | "star";

interface Statistic {
  id: string;
  value: string;       // e.g. "15+", "250K+", "24/7"
  label: string;       // e.g. "Years"
  sublabel: string;    // e.g. "Healthcare Excellence"
  icon: StatisticIcon;
}
```

### AppNotification

```typescript
interface AppNotification {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  category: "system" | "admin_activity";
  roles: Role[];           // Which roles can see this notification
}
```

### Admin KPIs

```typescript
interface AdminKpis {
  totalUsers: number;
  appointmentsToday: number;
  utilization: string;     // e.g. "86%"
  pendingApprovals: number;
}
```

---

## 5. API Endpoints Reference

### 5.1 Auth

#### `POST /auth/sign-in`

**Auth required:** No

**Request body:**
```json
{
  "email": "admin@nmsl.app",
  "password": "password123"
}
```

**Success response `200`:**
```json
{
  "token": "<jwt_string>",
  "user": {
    "id": "u-sa-1",
    "name": "Emeka Nwosu",
    "email": "admin@nmsl.app",
    "role": "admin",
    "location": "Abuja",
    "state": "FCT",
    "address": "NMSL Headquarters, Central Business District, Abuja",
    "phone": "+234 801 234 5678",
    "dateOfBirth": "1975-06-15",
    "gender": "male"
  }
}
```

---

#### `POST /auth/sign-up`

**Auth required:** No

**Request body:**
```json
{
  "name": "string",
  "email": "string",
  "password": "string",
  "location": "Abuja",
  "state": "FCT",
  "address": "string"
}
```

**Success response `201`:**
```json
{ "success": true }
```

---

#### `POST /auth/forgot-password`

**Auth required:** No

**Request body:**
```json
{ "email": "user@example.com" }
```

**Success response `200`:**
```json
{ "success": true }
```

---

#### `POST /auth/reset-password`

**Auth required:** No

**Request body:**
```json
{
  "token": "<reset_token>",
  "password": "newPassword123"   // min 8 characters
}
```

**Success response `200`:**
```json
{ "success": true }
```

---

### 5.2 Users (Public)

#### `GET /users`

**Auth required:** Yes (Bearer token)

**Response `200`:** `User[]`

```json
[
  {
    "id": "u-sa-1",
    "name": "Emeka Nwosu",
    "email": "admin@nmsl.app",
    "role": "admin",
    "location": "Abuja",
    "state": "FCT"
  }
]
```

---

#### `GET /users/:id`

**Auth required:** Yes (Bearer token)

**Response `200`:** `User`

```json
{
  "id": "u-sa-1",
  "name": "Emeka Nwosu",
  "email": "admin@nmsl.app",
  "role": "admin",
  "location": "Abuja"
}
```

---

### 5.3 Admin — KPIs

#### `GET /admin/kpis`

**Auth required:** Yes — Role: `admin` or `appointment_officer`

**Response `200`:**
```json
{
  "totalUsers": 2480,
  "appointmentsToday": 132,
  "utilization": "86%",
  "pendingApprovals": 19
}
```

---

### 5.4 Admin — Doctors

#### `GET /admin/doctors`

**Auth required:** Yes — Role: `admin`

**Query parameters:**
| Param | Type | Required | Description |
|---|---|---|---|
| `location` | string | No | Filter by facility location |
| `specialty` | string | No | Filter by medical specialty |

**Response `200`:** `Doctor[]`

```json
[
  {
    "id": "doc-1",
    "name": "Dr. Sarah Chen",
    "email": "s.chen@nmsl.app",
    "specialty": "General Practice",
    "location": "Abuja",
    "state": "FCT",
    "phone": "+234 801 000 0001",
    "qualifications": "MBBS, FWACP",
    "isActive": true
  }
]
```

---

#### `POST /admin/doctors`

**Auth required:** Yes — Role: `admin`

**Request body:**
```json
{
  "name": "Dr. Sarah Chen",
  "email": "s.chen@nmsl.app",
  "password": "temporaryPassword1",
  "location": "Abuja",
  "state": "FCT",
  "address": "NMSL Headquarters",
  "phone": "+234 801 000 0001",
  "qualifications": "MBBS, FWACP",
  "specialty": "General Practice"
}
```

**Response `201`:**
```json
{
  "success": true,
  "user": {
    "id": "doc-1",
    "name": "Dr. Sarah Chen",
    "email": "s.chen@nmsl.app",
    "role": "doctor",
    "location": "Abuja",
    "state": "FCT",
    "address": "NMSL Headquarters",
    "phone": "+234 801 000 0001",
    "qualifications": "MBBS, FWACP",
    "specialty": "General Practice"
  }
}
```

---

### 5.5 Admin — Admins

#### `GET /admin/admins`

**Auth required:** Yes — Role: `admin`

**Response `200`:**
```json
{
  "admins": [
    {
      "id": "u-sa-1",
      "name": "Emeka Nwosu",
      "email": "admin@nmsl.app",
      "role": "admin",
      "location": "Abuja",
      "state": "FCT",
      "phone": "+234 801 234 5678"
    }
  ],
  "total": 1
}
```

---

#### `POST /admin/admins`

**Auth required:** Yes — Role: `admin` (Super Admin only)

**Request body:**
```json
{
  "name": "string",
  "email": "string",
  "password": "string",
  "phone": "string",
  "location": "Abuja",
  "state": "FCT",
  "address": "string"  // optional
}
```

**Response `201`:** `User`
```json
{
  "id": "adm-123",
  "name": "New Admin",
  "email": "newadmin@nmsl.app",
  "role": "admin",
  "location": "Abuja",
  "state": "FCT",
  "phone": "+234 801 000 0000"
}
```

---

#### `PATCH /admin/admins/:id/toggle-status`

**Auth required:** Yes — Role: `admin`

**Request body:** None

**Response `200`:**
```json
{
  "success": true,
  "isActive": false,
  "message": "Admin deactivated successfully"
}
```

---

#### `PATCH /admin/admins/:id/password`

**Auth required:** Yes — Role: `admin`

**Request body:**
```json
{ "newPassword": "newSecurePassword1" }
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Password updated successfully"
}
```

---

#### `DELETE /admin/admins/:id`

**Auth required:** Yes — Role: `admin` (Super Admin only)

**Response `200`:**
```json
{
  "success": true,
  "message": "Admin removed successfully"
}
```

---

### 5.6 Admin — Users

#### `GET /admin/users`

**Auth required:** Yes — Role: `admin` or `appointment_officer`

> `appointment_officer` may call this endpoint but the frontend renders it as view-only (no status toggle, no password reset, no email update).

**Query parameters:**
| Param | Type | Required | Description |
|---|---|---|---|
| `role` | string | No | Filter by role (`admin`, `appointment_officer`) |
| `location` | string | No | Filter by location |

**Response `200`:** `User[]`

```json
[
  {
    "id": "u-sa-1",
    "name": "Emeka Nwosu",
    "email": "admin@nmsl.app",
    "role": "admin",
    "location": "Abuja"
  }
]
```

---

#### `PATCH /admin/users/:id/toggle-status`

**Auth required:** Yes — Role: `admin`

**Response `200`:**
```json
{
  "success": true,
  "isActive": true,
  "message": "User activated successfully"
}
```

---

#### `POST /admin/users/:id/reset-password`

**Auth required:** Yes — Role: `admin`

**Response `200`:**
```json
{
  "success": true,
  "message": "Password reset link sent to user@example.com"
}
```

---

#### `PATCH /admin/users/:id/email`

**Auth required:** Yes — Role: `admin`

**Request body:**
```json
{ "email": "newemail@example.com" }
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Email updated successfully"
}
```

---

### 5.7 Admin — Appointments

#### `GET /admin/appointments`

**Auth required:** Yes — Role: `admin` or `appointment_officer`

**Response `200`:** `Appointment[]`

```json
[
  {
    "id": "apt-1",
    "patientName": "John Doe",
    "patientEmail": "john.doe@email.com",
    "patientPhone": "+234 801 111 2233",
    "doctorName": "Dr. Sarah Chen",
    "date": "2026-03-30",
    "time": "09:00",
    "status": "confirmed",
    "location": "Abuja",
    "specialty": "General Practice",
    "visitType": "Physical",
    "reasonForVisit": "Recurring headache and dizziness for the past 5 days.",
    "additionalComment": "Would prefer a morning consultation if possible.",
    "isUrgent": false
  }
]
```

---

#### `PATCH /admin/appointments/:id/status`

**Auth required:** Yes — Role: `admin` or `appointment_officer`

**Request body:**
```json
{ "status": "confirmed" }
```
> `status` must be one of: `"confirmed"` | `"rejected"`

**Response `200`:** `Appointment` (updated appointment object)

---

#### `PATCH /admin/appointments/:id/reschedule`

**Auth required:** Yes — Role: `admin` or `appointment_officer`

**Request body:**
```json
{
  "date": "2026-04-05",
  "time": "10:00",
  "rescheduleReason": "Doctor reassigned to emergency case"  // optional
}
```

**Response `200`:** `Appointment`

The returned appointment will have `status: "rescheduled"` and the updated `date`, `time`, `rescheduleReason`.

---

### 5.8 Admin — Services

#### `GET /admin/services`

**Auth required:** Yes — Role: `admin`

**Response `200`:** `Service[]`

```json
[
  {
    "id": "svc-1",
    "name": "Accident & Emergency",
    "category": "Emergency Services",
    "location": "Abuja",
    "shortDescription": "24/7 emergency care with specialized trauma units",
    "fullDescription": "...",
    "keyServices": [
      { "id": "ks-1-1", "title": "24/7 Emergency Response", "description": "Immediate care for urgent cases" }
    ],
    "createdAt": "2026-01-15T00:00:00.000Z",
    "updatedAt": "2026-02-10T00:00:00.000Z"
  }
]
```

---

#### `POST /admin/services`

**Auth required:** Yes — Role: `admin`

**Request body:**
```json
{
  "name": "string",
  "category": "Emergency Services",
  "location": "Abuja",
  "shortDescription": "string",
  "fullDescription": "string",
  "bannerImageUrl": "string",    // optional
  "iconImageUrl": "string",      // optional
  "keyServices": [
    { "title": "string", "description": "string" }
  ]
}
```
> `id`, `createdAt`, `updatedAt` are generated server-side. `KeyService.id` is generated server-side.

**Response `201`:** `Service`

---

#### `PATCH /admin/services/:id`

**Auth required:** Yes — Role: `admin`

**Request body:** Any subset of Service fields (except `id`, `createdAt`, `updatedAt`):
```json
{
  "name": "Updated Name",
  "shortDescription": "Updated description"
}
```

**Response `200`:** `Service` (updated)

---

#### `DELETE /admin/services/:id`

**Auth required:** Yes — Role: `admin`

**Response `200`:**
```json
{ "success": true }
```

---

### 5.9 Admin — Statistics

#### `GET /admin/statistics`

**Auth required:** Yes — Role: `admin`

**Response `200`:** `Statistic[]`

```json
[
  {
    "id": "stat-1",
    "value": "15+",
    "label": "Years",
    "sublabel": "Healthcare Excellence",
    "icon": "award"
  },
  {
    "id": "stat-2",
    "value": "250K+",
    "label": "Patients",
    "sublabel": "Treated Annually",
    "icon": "users"
  }
]
```

---

#### `PUT /admin/statistics`

**Auth required:** Yes — Role: `admin`

**Request body:** Complete array of statistics to replace the current set:
```json
[
  {
    "id": "stat-1",
    "value": "20+",
    "label": "Years",
    "sublabel": "Healthcare Excellence",
    "icon": "award"
  }
]
```
> This is a full replacement (PUT, not PATCH). All existing statistics are replaced by the provided array.

**Response `200`:** `Statistic[]` (the updated full array)

---

### 5.10 Admin — Partners

#### `GET /admin/partners`

**Auth required:** Yes — Role: `admin`

Returns **all** partners (active and inactive), sorted by `order` ascending.

**Response `200`:** `Partner[]`

```json
[
  {
    "id": "ptn-1",
    "name": "African Medical Centre of Excellence Abuja",
    "logoUrl": "/partners/amce.png",
    "description": "Leading medical excellence center in Abuja",
    "order": 1,
    "isActive": true,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-01T00:00:00.000Z"
  }
]
```

---

#### `POST /admin/partners`

**Auth required:** Yes — Role: `admin`

**Request body:**
```json
{
  "name": "string",
  "logoUrl": "string",
  "description": "string",  // optional
  "order": 12,
  "isActive": true
}
```

**Response `201`:** `Partner`

---

#### `PATCH /admin/partners/:id`

**Auth required:** Yes — Role: `admin`

**Request body:** Any subset of Partner fields (except `id`, `createdAt`, `updatedAt`):
```json
{
  "name": "Updated Partner Name",
  "order": 5
}
```

**Response `200`:** `Partner` (updated)

---

#### `DELETE /admin/partners/:id`

**Auth required:** Yes — Role: `admin`

**Response `200`:**
```json
{ "success": true }
```

---

#### `PATCH /admin/partners/:id/toggle`

**Auth required:** Yes — Role: `admin`

Toggles `isActive` between `true` and `false`.

**Response `200`:** `Partner` (updated with new `isActive` and `updatedAt`)

---

### 5.11 Admin — Board Members

#### `GET /admin/board-members`

**Auth required:** Yes — Role: `admin`

Returns **all** board members (active and inactive), sorted by `order` ascending.

**Response `200`:** `BoardMember[]`

```json
[
  {
    "id": "bm-1",
    "name": "Mr. Adedapo A. Segun",
    "title": "Chairman",
    "photoUrl": "/board/adedapo-segun.jpg",
    "bio": "Leadership committed to excellence in healthcare delivery.",
    "order": 1,
    "isActive": true,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-01T00:00:00.000Z"
  }
]
```

---

#### `POST /admin/board-members`

**Auth required:** Yes — Role: `admin`

**Request body:**
```json
{
  "name": "string",
  "title": "string",
  "photoUrl": "string",
  "bio": "string",      // optional
  "order": 5,
  "isActive": true
}
```

**Response `201`:** `BoardMember`

---

#### `PATCH /admin/board-members/:id`

**Auth required:** Yes — Role: `admin`

**Request body:** Any subset of BoardMember fields (except `id`, `createdAt`, `updatedAt`):
```json
{
  "title": "Updated Title",
  "bio": "Updated bio text"
}
```

**Response `200`:** `BoardMember` (updated)

---

#### `DELETE /admin/board-members/:id`

**Auth required:** Yes — Role: `admin`

**Response `200`:**
```json
{ "success": true }
```

---

#### `PATCH /admin/board-members/:id/toggle`

**Auth required:** Yes — Role: `admin`

Toggles `isActive` between `true` and `false`.

**Response `200`:** `BoardMember` (updated with new `isActive` and `updatedAt`)

---

### 5.12 Admin — Contact

#### `PATCH /admin/contact`

**Auth required:** Yes — Role: `admin`

**Request body:** Any subset of ContactInfo fields (except `id`, `updatedAt`):
```json
{
  "phone": "+234 1 234 5678",
  "emailPrimary": "info@nmsl.ng",
  "officeHours": "Monday – Friday: 8am – 5pm"
}
```

**Response `200`:** `ContactInfo`

---

### 5.13 Public — Partners

#### `GET /partners`

**Auth required:** No

Returns only **active** partners (`isActive: true`), sorted by `order` ascending.

**Response `200`:** `Partner[]`

---

### 5.14 Public — Board Members

#### `GET /board-members`

**Auth required:** No

Returns only **active** board members (`isActive: true`), sorted by `order` ascending.

**Response `200`:** `BoardMember[]`

---

### 5.15 Public — Contact

#### `GET /contact`

**Auth required:** No

**Response `200`:** `ContactInfo`

```json
{
  "id": "contact-1",
  "phone": "+234 1 234 5678",
  "emailPrimary": "info@nmsl.ng",
  "emailSecondary": "support@nmsl.ng",
  "addressLine1": "Plot 1234, Central Business District",
  "addressLine2": "PMB 001, Garki",
  "city": "Abuja",
  "country": "Nigeria",
  "officeHours": "Monday – Friday: 8am – 5pm",
  "emergencyHours": "24/7",
  "updatedAt": "2026-02-01T00:00:00.000Z"
}
```

---

### 5.16 Auth — Profile (Self)

The Settings/Profile page in the frontend currently simulates these API calls with a local store update. The backend **must** implement them for production use.

#### `PATCH /auth/me`

**Auth required:** Yes (Bearer token) — any authenticated role

Updates the authenticated user's own profile fields.

**Request body:** (all fields optional)
```json
{
  "name": "string",
  "email": "string",
  "phone": "string",
  "dateOfBirth": "1975-06-15",
  "gender": "male",
  "location": "Abuja",
  "state": "FCT",
  "address": "string"
}
```

**Success response `200`:** `User` (updated full user object)

---

#### `PATCH /auth/me/password`

**Auth required:** Yes (Bearer token) — any authenticated role

Changes the authenticated user's own password.

**Request body:**
```json
{
  "currentPassword": "oldPassword123",
  "newPassword": "newPassword456"      // min 6 characters
}
```

**Success response `200`:**
```json
{ "success": true, "message": "Password changed successfully" }
```

**Error response `400`** when current password is wrong:
```json
{ "statusCode": 400, "message": "Current password is incorrect" }
```

---

## 6. NestJS Module Structure

```
src/
├── app.module.ts
├── main.ts
├── common/
│   ├── decorators/
│   │   └── roles.decorator.ts
│   ├── guards/
│   │   ├── jwt-auth.guard.ts
│   │   └── roles.guard.ts
│   └── filters/
│       └── http-exception.filter.ts
├── auth/
│   ├── auth.module.ts
│   ├── auth.controller.ts          # POST /auth/*, PATCH /auth/me, PATCH /auth/me/password
│   ├── auth.service.ts
│   ├── dto/
│   │   ├── sign-in.dto.ts
│   │   ├── sign-up.dto.ts
│   │   ├── forgot-password.dto.ts
│   │   ├── reset-password.dto.ts
│   │   ├── update-profile.dto.ts
│   │   └── change-password.dto.ts
│   └── strategies/
│       └── jwt.strategy.ts
├── users/
│   ├── users.module.ts
│   ├── users.controller.ts         # GET /users, /users/:id
│   ├── users.service.ts
│   └── entities/
│       └── user.entity.ts
├── admin/
│   ├── admin.module.ts
│   ├── admin.controller.ts         # GET /admin/kpis, doctors, admins, etc.
│   ├── admin.service.ts
│   └── dto/
│       ├── create-doctor.dto.ts
│       ├── create-admin.dto.ts
│       ├── change-admin-password.dto.ts
│       └── update-user-email.dto.ts
├── appointments/
│   ├── appointments.module.ts
│   ├── appointments.controller.ts  # GET/PATCH /admin/appointments/*
│   ├── appointments.service.ts
│   ├── dto/
│   │   ├── update-status.dto.ts
│   │   └── reschedule.dto.ts
│   └── entities/
│       └── appointment.entity.ts
├── services/
│   ├── services.module.ts
│   ├── services.controller.ts      # /admin/services/*
│   ├── services.service.ts
│   ├── dto/
│   │   ├── create-service.dto.ts
│   │   └── update-service.dto.ts
│   └── entities/
│       └── service.entity.ts
├── statistics/
│   ├── statistics.module.ts
│   ├── statistics.controller.ts    # /admin/statistics
│   ├── statistics.service.ts
│   └── entities/
│       └── statistic.entity.ts
├── partners/
│   ├── partners.module.ts
│   ├── partners.controller.ts      # /partners + /admin/partners/*
│   ├── partners.service.ts
│   ├── dto/
│   │   ├── create-partner.dto.ts
│   │   └── update-partner.dto.ts
│   └── entities/
│       └── partner.entity.ts
├── board-members/
│   ├── board-members.module.ts
│   ├── board-members.controller.ts # /board-members + /admin/board-members/*
│   ├── board-members.service.ts
│   ├── dto/
│   │   ├── create-board-member.dto.ts
│   │   └── update-board-member.dto.ts
│   └── entities/
│       └── board-member.entity.ts
└── contact/
    ├── contact.module.ts
    ├── contact.controller.ts       # GET /contact + PATCH /admin/contact
    ├── contact.service.ts
    ├── dto/
    │   └── update-contact.dto.ts
    └── entities/
        └── contact.entity.ts
```

---

## 7. DTOs (Data Transfer Objects)

### Auth DTOs

```typescript
// sign-in.dto.ts
export class SignInDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}

// sign-up.dto.ts
export class SignUpDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  location: string;

  @IsString()
  state: string;

  @IsString()
  address: string;
}

// forgot-password.dto.ts
export class ForgotPasswordDto {
  @IsEmail()
  email: string;
}

// reset-password.dto.ts
export class ResetPasswordDto {
  @IsString()
  @MinLength(6)
  token: string;

  @IsString()
  @MinLength(8)       // frontend validates min 8 chars
  password: string;
}

// update-profile.dto.ts
export class UpdateProfileDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsEmail()  email?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() dateOfBirth?: string;  // ISO date "YYYY-MM-DD"
  @IsOptional() @IsIn(['male', 'female', 'other']) gender?: string;
  @IsOptional() @IsString() location?: string;
  @IsOptional() @IsString() state?: string;
  @IsOptional() @IsString() address?: string;
}

// change-password.dto.ts
export class ChangePasswordDto {
  @IsString() currentPassword: string;
  @IsString() @MinLength(6) newPassword: string;
}
```

### Admin DTOs

```typescript
// create-doctor.dto.ts
export class CreateDoctorDto {
  @IsString() name: string;
  @IsEmail()  email: string;
  @IsString() @MinLength(6) password: string;
  @IsString() location: string;
  @IsString() state: string;
  @IsString() address: string;
  @IsString() phone: string;
  @IsString() qualifications: string;
  @IsString() specialty: string;        // MedicalSpecialty enum value
}

// create-admin.dto.ts
export class CreateAdminDto {
  @IsString() name: string;
  @IsEmail()  email: string;
  @IsString() @MinLength(6) password: string;
  @IsString() phone: string;
  @IsString() location: string;
  @IsString() state: string;
  @IsOptional() @IsString() address?: string;
}

// change-admin-password.dto.ts
export class ChangeAdminPasswordDto {
  @IsString() @MinLength(6) newPassword: string;
}

// update-user-email.dto.ts
export class UpdateUserEmailDto {
  @IsEmail() email: string;
}
```

### Appointment DTOs

```typescript
// update-status.dto.ts
export class UpdateAppointmentStatusDto {
  @IsIn(['confirmed', 'rejected'])
  status: 'confirmed' | 'rejected';
}

// reschedule.dto.ts
export class RescheduleAppointmentDto {
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date: string;

  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  time: string;

  @IsOptional()
  @IsString()
  rescheduleReason?: string;
}
```

### Service DTOs

```typescript
// create-service.dto.ts
export class KeyServiceDto {
  @IsString() title: string;
  @IsString() description: string;
}

export class CreateServiceDto {
  @IsString() name: string;
  @IsString() category: string;         // ServiceCategory enum
  @IsString() location: string;
  @IsString() shortDescription: string;
  @IsString() fullDescription: string;
  @IsOptional() @IsString() bannerImageUrl?: string;
  @IsOptional() @IsString() iconImageUrl?: string;
  @IsArray() @ValidateNested({ each: true }) @Type(() => KeyServiceDto)
  keyServices: KeyServiceDto[];
}

// update-service.dto.ts
export class UpdateServiceDto extends PartialType(
  OmitType(CreateServiceDto, ['keyServices'] as const)
) {
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => KeyServiceDto)
  keyServices?: KeyServiceDto[];
}
```

### Partner DTOs

```typescript
// create-partner.dto.ts
export class CreatePartnerDto {
  @IsString() name: string;
  @IsString() logoUrl: string;
  @IsOptional() @IsString() description?: string;
  @IsNumber() order: number;
  @IsBoolean() isActive: boolean;
}

// update-partner.dto.ts
export class UpdatePartnerDto extends PartialType(CreatePartnerDto) {}
```

### Board Member DTOs

```typescript
// create-board-member.dto.ts
export class CreateBoardMemberDto {
  @IsString() name: string;
  @IsString() title: string;
  @IsString() photoUrl: string;
  @IsOptional() @IsString() bio?: string;
  @IsNumber() order: number;
  @IsBoolean() isActive: boolean;
}

// update-board-member.dto.ts
export class UpdateBoardMemberDto extends PartialType(CreateBoardMemberDto) {}
```

### Contact DTO

```typescript
// update-contact.dto.ts
export class UpdateContactDto {
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsEmail()  emailPrimary?: string;
  @IsOptional() @IsEmail()  emailSecondary?: string;
  @IsOptional() @IsString() addressLine1?: string;
  @IsOptional() @IsString() addressLine2?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() country?: string;
  @IsOptional() @IsString() officeHours?: string;
  @IsOptional() @IsString() emergencyHours?: string;
}
```

---

## 8. Guards & Roles

### JWT Strategy

```typescript
// jwt.strategy.ts
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  async validate(payload: { sub: string; email: string; role: string }) {
    return { id: payload.sub, email: payload.email, role: payload.role };
  }
}
```

### Roles Decorator

```typescript
// roles.decorator.ts
export const Roles = (...roles: Role[]) => SetMetadata('roles', roles);

// Usage on controller methods:
@Roles('admin')
@Get('admins')
listAdmins() { ... }
```

### Roles Guard

```typescript
// roles.guard.ts
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) return true;
    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.includes(user.role);
  }
}
```

### Apply Guards Globally in AppModule

```typescript
providers: [
  { provide: APP_GUARD, useClass: JwtAuthGuard },
  { provide: APP_GUARD, useClass: RolesGuard },
]
```

---

## 9. Response Shapes Summary

| Endpoint | Method | Response Type |
|---|---|---|
| `/auth/sign-in` | POST | `{ token: string; user: User }` |
| `/auth/sign-up` | POST | `{ success: true }` |
| `/auth/forgot-password` | POST | `{ success: true }` |
| `/auth/reset-password` | POST | `{ success: true }` |
| `/users` | GET | `User[]` |
| `/users/:id` | GET | `User` |
| `/admin/kpis` | GET | `AdminKpis` |
| `/admin/doctors` | GET | `Doctor[]` |
| `/admin/doctors` | POST | `{ success: boolean; user: Doctor }` |
| `/admin/admins` | GET | `{ admins: User[]; total: number }` |
| `/admin/admins` | POST | `User` |
| `/admin/admins/:id/toggle-status` | PATCH | `{ success: boolean; isActive: boolean; message: string }` |
| `/admin/admins/:id/password` | PATCH | `{ success: boolean; message: string }` |
| `/admin/admins/:id` | DELETE | `{ success: boolean; message: string }` |
| `/admin/users` | GET | `User[]` |
| `/admin/users/:id/toggle-status` | PATCH | `{ success: boolean; isActive: boolean; message: string }` |
| `/admin/users/:id/reset-password` | POST | `{ success: boolean; message: string }` |
| `/admin/users/:id/email` | PATCH | `{ success: boolean; message: string }` |
| `/admin/appointments` | GET | `Appointment[]` |
| `/admin/appointments/:id/status` | PATCH | `Appointment` |
| `/admin/appointments/:id/reschedule` | PATCH | `Appointment` |
| `/admin/services` | GET | `Service[]` |
| `/admin/services` | POST | `Service` |
| `/admin/services/:id` | PATCH | `Service` |
| `/admin/services/:id` | DELETE | `{ success: boolean }` |
| `/admin/statistics` | GET | `Statistic[]` |
| `/admin/statistics` | PUT | `Statistic[]` |
| `/admin/partners` | GET | `Partner[]` |
| `/admin/partners` | POST | `Partner` |
| `/admin/partners/:id` | PATCH | `Partner` |
| `/admin/partners/:id` | DELETE | `{ success: boolean }` |
| `/admin/partners/:id/toggle` | PATCH | `Partner` |
| `/admin/board-members` | GET | `BoardMember[]` |
| `/admin/board-members` | POST | `BoardMember` |
| `/admin/board-members/:id` | PATCH | `BoardMember` |
| `/admin/board-members/:id` | DELETE | `{ success: boolean }` |
| `/admin/board-members/:id/toggle` | PATCH | `BoardMember` |
| `/admin/contact` | PATCH | `ContactInfo` |
| `/auth/me` | PATCH | `User` |
| `/auth/me/password` | PATCH | `{ success: boolean; message: string }` |
| `/partners` | GET | `Partner[]` (active only) |
| `/board-members` | GET | `BoardMember[]` (active only) |
| `/contact` | GET | `ContactInfo` |

---

## 10. Environment Variables

### Frontend (consumed by Next.js)

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:4000` | Base URL for backend API |
| `NEXT_PUBLIC_USE_MOCKS` | `"true"` | Set to `"false"` to use real backend |
| `NEXT_PUBLIC_ENABLE_PREMIUM_THEME_TOGGLE` | `"false"` | Feature flag |
| `NEXT_PUBLIC_ENABLE_ROLE_SWITCHER` | `"false"` | Dev feature flag |

### Backend (NestJS)

| Variable | Description |
|---|---|
| `PORT` | HTTP port (default: `4000`) |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret key for signing JWTs |
| `JWT_EXPIRES_IN` | Token expiry e.g. `"7d"` |
| `SMTP_HOST` | Email server for password reset |
| `SMTP_PORT` | Email server port |
| `SMTP_USER` | Email credentials |
| `SMTP_PASS` | Email credentials |
| `FRONTEND_URL` | Frontend URL for reset-password link generation |

---

## 11. Constants & Enums

### Nigeria Locations (Facility Cities)

```typescript
const NIGERIA_LOCATIONS = [
  "Abuja",
  "Lagos",
  "Benin",
  "Kaduna",
  "Port Harcourt",
  "Warri",
] as const;
```

### Nigerian States (36 states + FCT)

```typescript
const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa",
  "Benue", "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti",
  "Enugu", "FCT", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano",
  "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger",
  "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto",
  "Taraba", "Yobe", "Zamfara"
] as const;
```

### Medical Specialties

```typescript
const MEDICAL_SPECIALTIES = [
  "General Practice",
  "Gynecology",
  "Physiotherapy",
  "Pediatrics",
  "Cardiology",
  "Dermatology",
  "Orthopedics",
  "Psychiatry",
  "Radiology",
  "Surgery",
] as const;
```

### Service Categories

```typescript
const SERVICE_CATEGORIES = [
  "Emergency Services",
  "Specialized Care",
  "Dental Care",
  "Primary Care",
  "Surgical Services",
  "Diagnostic Services",
  "Women's Health",
  "Pediatric Care",
  "Mental Health",
  "Rehabilitation",
] as const;
```

### Appointment Statuses

```typescript
const APPOINTMENT_STATUSES = [
  "pending",
  "scheduled",
  "confirmed",
  "rescheduled",
  "cancelled",
  "rejected",
  "completed",
  "no-show",
] as const;
```

### Statistic Icons

```typescript
const STATISTIC_ICONS = [
  "clock", "building", "users", "award", "heart", "star"
] as const;
```

---

## 12. Additional Business Rules

1. **Partner/BoardMember ordering:** Both `Partner` and `BoardMember` have an `order` field. Public endpoints must return items sorted by `order` ascending. Admin endpoints also return sorted by `order` ascending.

2. **Public vs Admin filtering:** 
   - `GET /partners` → only `isActive: true` records
   - `GET /admin/partners` → all records (no filter)
   - Same rule applies to `board-members`

3. **Statistics are globally updated in bulk:** The `PUT /admin/statistics` endpoint replaces the entire set. There is no per-item statistics update endpoint.

4. **Contact info is a singleton:** There is only one `ContactInfo` record. `GET /contact` always returns the single record. `PATCH /admin/contact` updates it in-place.

5. **Password Reset Token:** The token passed to `POST /auth/reset-password` is the opaque token that was sent in the reset email. It should be validated server-side (stored in DB with expiry).

6. **Doctor creation does NOT return a portal login user.** The created doctor lives in a separate `doctors` table and the response from `POST /admin/doctors` includes a `success: true` and the `user` object with a `role: "doctor"` — a role that is NOT used for admin portal authentication.

7. **Toggle endpoints** (`/toggle-status`, `/toggle`) do not require a request body — they toggle the current state server-side and return the new state.

8. **Appointment reschedule** automatically sets `status` to `"rescheduled"` server-side. The client does not need to send a `status` field.

9. **CORS:** The backend must allow requests from the frontend origin (`FRONTEND_URL`).

10. **`appointment_officer` is read-only on users.** `GET /admin/users` must accept `appointment_officer`, but `PATCH /admin/users/:id/toggle-status`, `POST /admin/users/:id/reset-password`, and `PATCH /admin/users/:id/email` must remain `admin`-only. The frontend enforces this via UI gating (`canManageUsers = user.role === "admin"`), but the backend must enforce it independently via role guards.

11. **Appointment action constraints (frontend-defined, backend should mirror):**
    - `canAccept(status)`: not allowed when status is `confirmed`, `completed`, `cancelled`, `rejected`, or `no-show`
    - `canReject(status)`: not allowed when status is `rejected`, `cancelled`, `completed`, or `no-show`
    - `canReschedule(status)`: not allowed when status is `completed`, `cancelled`, `rejected`, or `no-show` (terminal statuses)
    - The backend should return `400` if an invalid status transition is attempted.

12. **`PATCH /auth/me` and `PATCH /auth/me/password`** are required backend endpoints. The frontend currently stubs these with a simulated delay and local store update. Wire them to the real API when the backend is ready.
