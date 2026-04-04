# Dynamic Data Fetching — Migration Guide

This document describes the changes made to pull dynamic data (previously hardcoded) from a backend database / API for the NNPC Medical Services Limited (NMSL) frontend.

---

## Overview

The following sections on the website were previously rendered with **hardcoded static data**. They have been migrated to fetch data from a backend API, with automatic fallback to the bundled static data when the API is not configured or unavailable.

| Section | Page(s) | Old Source | New Source |
|---|---|---|---|
| Stats banner (45+ years, 6 locations, …) | Home | `components/stats.tsx` (inline array) | `GET /api/stats` |
| Featured Medical Services | Home | `lib/services/*.ts` (static files) | `GET /api/services` |
| All Medical Services listing | `/services` | `lib/services/*.ts` (static files) | `GET /api/services` |
| Service detail page | `/services/[slug]` | `lib/services/*.ts` (static files) | `GET /api/services` |
| Board of Directors | `/about` | `components/about.tsx` (inline array) | `GET /api/board-members` |
| Caregivers / Doctors list | `/doctors` | `lib/doctors-data.ts` (static file) | `GET /api/doctors` |
| Doctor profile page | `/doctors/[id]` | `lib/doctors-data.ts` (static file) | `GET /api/doctors` |

---

## Architecture

### New File: `lib/api-services.ts`

Central module that exposes one `async` function per data domain:

```ts
fetchStats()         → StatItem[]
fetchServices()      → Service[]
fetchDoctors()       → Doctor[]
fetchBoardMembers()  → BoardMember[]
```

Each function:
1. Checks whether `NEXT_PUBLIC_API_URL` is set in `.env.local`.
2. If set, calls the corresponding REST endpoint via the existing `get()` helper in `lib/api.ts`.
3. If the API is **not** set or returns an error, returns the bundled static data so the site keeps working.

### Server-Side Rendering Pattern

All pages that previously were pure `"use client"` components have been split into:

- **Server component** (`page.tsx`) — fetches data at request time using `fetchXxx()`, passes it as props.
- **Client component** (`XxxClient.tsx`) — receives data via props, handles interactivity (filtering, search, navigation).

This follows the Next.js App Router recommended pattern and ensures the data is fresh on every request once a real API is connected.

---

## Files Changed

### New Files
| File | Purpose |
|---|---|
| `lib/api-services.ts` | API service functions with static fallbacks |
| `app/doctors/DoctorsClient.tsx` | Interactive doctor grid (split from page) |
| `app/services/ServicesClient.tsx` | Interactive services listing (split from page) |

### Modified Files
| File | Change |
|---|---|
| `components/stats.tsx` | Converted to async Server Component; fetches via `fetchStats()` |
| `components/featured-services.tsx` | Server wrapper fetches via `fetchServices()`; client inner component filters by location |
| `components/about.tsx` | Added `boardMembers` prop (fed by server parent); static data used as default fallback |
| `app/about/page.tsx` | Now async; calls `fetchBoardMembers()` and passes to `<About>` |
| `app/doctors/page.tsx` | Now async server component; calls `fetchDoctors()` and renders `<DoctorsClient>` |
| `app/doctors/[id]/page.tsx` | Now fetches all doctors via `fetchDoctors()` instead of the static array |
| `app/services/page.tsx` | Now async server component; calls `fetchServices()` and renders `<ServicesClient>` |
| `app/services/[slug]/page.tsx` | Now async; calls `fetchServices()` and passes to `<ServiceDetailPageClient>` |
| `app/services/[slug]/ServiceDetailPageClient.tsx` | Accepts `services` prop instead of importing static array |
| `lib/hooks/use-services.ts` | All three hooks (`useServices`, `useServicesByCategory`, `useServiceCount`) accept optional `sourceServices` param |

---

## Backend API Requirements

When a real backend is connected, implement the following REST endpoints:

### `GET /api/stats`
Returns an array of stat cards shown in the home-page stats banner.

```json
[
  { "icon": "clock",    "value": "45+",          "label": "Years of Service",  "description": "Serving since 1978" },
  { "icon": "building", "value": "6",             "label": "Locations",         "description": "Across Nigeria" },
  { "icon": "users",    "value": "100+",          "label": "Specialists",       "description": "Expert healthcare professionals" },
  { "icon": "award",    "value": "ISO 9001:2015", "label": "Certified",         "description": "Quality Standards" }
]
```

`icon` must be one of: `"clock"`, `"building"`, `"users"`, `"award"`.

---

### `GET /api/services`
Returns the full list of medical services. Each item must match the `Service` type from `lib/services/types.ts`.

Minimum required fields per service:

| Field | Type | Description |
|---|---|---|
| `slug` | `string` | URL-safe unique identifier |
| `title` | `string` | Display name |
| `category` | `"Specialized Care" \| "Surgery & Allied" \| "Pediatrics" \| "Diagnostics & Support"` | Service category |
| `description` | `string` | Short description |
| `longDescription` | `string` | Full description |
| `keyServices` | `string[]` | List of key service bullets |
| `specialists` | `string[]` | List of specialists |
| `image` | `string` | Path or URL to card image |
| `features` | `{ title, description, image }[]` | Feature cards |

---

### `GET /api/doctors`
Returns the full list of doctors/caregivers. Each item must match the `Doctor` type from `lib/doctors-data.ts`.

| Field | Type |
|---|---|
| `id` | `string` |
| `name` | `string` |
| `surname` | `string` |
| `title` | `string` |
| `department` | `string` |
| `qualifications` | `string[]` |
| `specialty` | `string` |
| `experience` | `string` |
| `image` | `string` |
| `bio` | `string` |
| `city` | `string` |

---

### `GET /api/board-members`
Returns the Board of Directors.

```json
[
  { "name": "Mr. Adedapo A. Segun", "title": "Chairman", "image": "/Board of Directors/Mr Adedapo A. Segun 2.jpg" }
]
```

---

## Configuration

Set `NEXT_PUBLIC_API_URL` in `.env.local` to enable live API fetching:

```env
NEXT_PUBLIC_API_URL=https://api.nnpcmedical.com
```

Leave it **unset** (or empty) to keep using the bundled static data — this is the current default behaviour and does **not** break the site.

---

## Caching

Next.js App Router caches `fetch()` responses by default (ISR). To control revalidation, use `next: { revalidate: N }` options inside `lib/api.ts` or pass them through `fetchAPI`. For example, to re-fetch doctors every 60 seconds:

```ts
// In lib/api-services.ts
return await get<Doctor[]>("/api/doctors", { next: { revalidate: 60 } })
```

---
