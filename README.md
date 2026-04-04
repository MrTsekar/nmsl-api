# NMSL App (Frontend UI)

High-fidelity healthcare product frontend for authenticated users across three roles: `patient`, `doctor`, and `admin`.

This repository is **UI + integration scaffolding only**.
Backend implementation is external and integrated via feature API clients.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- shadcn-style UI primitives + Lucide icons
- React Query for server state
- Zustand for auth/session client state
- Zod + React Hook Form for form validation
- Dark mode support via `next-themes`

## Run locally

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
cp .env.example .env.local
```

3. Start development server:

```bash
npm run dev
```

4. Open `http://localhost:3000`.

## Environment variables

- `NEXT_PUBLIC_API_BASE_URL` - base URL for external backend API
- `NEXT_PUBLIC_USE_MOCKS` - defaults to mock mode when unset; set to `false` only when you want to consume live API
- `NEXT_PUBLIC_ENABLE_PREMIUM_THEME_TOGGLE` - enable premium theme toggle in profile menu (default `false`)
- `NEXT_PUBLIC_ENABLE_ROLE_SWITCHER` - enable role switch actions in profile menu for admin-only testing (default `false`)

## Route map

### Auth

- `/sign-in`
- `/sign-up`
- `/forgot-password`
- `/reset-password`
- `/complete-profile`

### Shared authenticated

- `/app/overview`
- `/app/appointments`
- `/app/appointments/[id]`
- `/app/profile`

### Patient

- `/app/patient/dashboard`
- `/app/patient/medical-results`
- `/app/patient/prescriptions`
- `/app/patient/doctors`
- `/app/patient/doctors/[id]`
- `/app/chat`
- `/app/chat/[appointmentId]`

### Doctor

- `/app/doctor/dashboard`
- `/app/doctor/schedule`
- `/app/doctor/patients`
- `/app/doctor/prescriptions`
- `/app/doctor/chat`
- `/app/chat`
- `/app/chat/[appointmentId]`

### Admin

- `/app/admin/users`
- `/app/admin/users/[id]`
- `/app/admin/doctors`
- `/app/admin/testimonials`
- `/app/admin/settings`

## Project structure

- `src/app` - route pages/layouts
- `src/components/app` - app shell (sidebar, header, breadcrumbs, guards)
- `src/components/shared` - reusable domain components (StatCard, StatusBadge, DataTable, etc.)
- `src/components/ui` - reusable shadcn-style primitives
- `src/components/dashboards` - role-specific dashboard content blocks
- `src/lib/api` - API client + per-feature service modules
- `src/lib/mocks` - mock datasets + mock handlers
- `src/hooks` - React Query data hooks
- `src/store` - Zustand auth/session store

## Notes

- Route protection is frontend-only and modular, so it can be replaced with backend auth/session later.
- Screens include loading, empty, and error states for data views and are responsive for desktop/tablet/mobile.
- Optional premium hospital theme pack is available from the profile dropdown (`Enable premium theme`) and applies tokenized palette plus card/chart variants without changing route structure.
