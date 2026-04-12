# Appointment Status Flow & Endpoints Guide

## Appointment Statuses

```
PENDING → CONFIRMED → COMPLETED
   ↓         ↓
REJECTED  CANCELLED
   ↓
RESCHEDULED → CONFIRMED → COMPLETED
```

## Status Meanings

| Status | Meaning | Who Can Set |
|--------|---------|-------------|
| `PENDING` | Initial state when appointment is created | System |
| `CONFIRMED` | Appointment ACCEPTED by admin/officer | Admin/Officer |
| `REJECTED` | Appointment rejected | Admin/Officer |
| `RESCHEDULED` | Appointment rescheduled to new date/time | Admin/Officer |
| `COMPLETED` | Appointment finished by doctor | Doctor/Admin |
| `CANCELLED` | Cancelled by patient or system | Patient/Doctor/Admin |
| `NO_SHOW` | Patient didn't show up | Doctor/Admin |

## Audit Actions vs Status

When you update an appointment status, an audit log is created:

| Status Set | Audit Action | Meaning |
|------------|--------------|---------|
| `CONFIRMED` | `ACCEPTED` | Officer accepted the appointment request |
| `REJECTED` | `REJECTED` | Officer rejected the appointment request |
| `RESCHEDULED` | `RESCHEDULED` | Officer rescheduled to new date/time |
| `COMPLETED` | `COMPLETED` | Doctor marked appointment as complete |

## Endpoints & When to Use Them

### ✅ For **ACCEPTING** an appointment
**Endpoint:** `PATCH /admin/appointments/:id/status`
```json
{
  "status": "confirmed"
}
```
- Creates audit log with action "ACCEPTED"
- Sets appointment status to CONFIRMED
- Sends acceptance emails to patient and doctor
- **Use this when:** Admin/officer approves a pending appointment

---

### ✅ For **REJECTING** an appointment
**Endpoint:** `PATCH /admin/appointments/:id/status`
```json
{
  "status": "rejected",
  "reason": "No available slots"
}
```
- Creates audit log with action "REJECTED"
- Sets appointment status to REJECTED
- Sends rejection email to patient
- **Use this when:** Admin/officer declines a pending appointment

---

### ✅ For **RESCHEDULING** an appointment
**Endpoint:** `PATCH /admin/appointments/:id/reschedule`
```json
{
  "date": "2026-04-15",
  "time": "10:00 AM",
  "rescheduleReason": "Doctor unavailable at original time"
}
```
- Creates audit log with action "RESCHEDULED"
- Sets appointment status to RESCHEDULED
- **Use this when:** Changing appointment date/time

---

### ⚠️ DEPRECATED: `/appointments/:id/confirm`
**Do NOT use this endpoint!**
- It sets status to CONFIRMED but **does NOT create audit logs**
- Use `/admin/appointments/:id/status` instead for proper tracking

---

## Common Mistakes to Avoid

### ❌ Wrong: Setting status to CONFIRMED when you only want to reschedule
```json
// DON'T DO THIS when rescheduling:
PATCH /admin/appointments/:id/status
{ "status": "confirmed" }
```

### ✅ Right: Use the reschedule endpoint
```json
// DO THIS instead:
PATCH /admin/appointments/:id/reschedule
{
  "date": "2026-04-15",
  "time": "10:00 AM"
}
```

---

## Statistics Dashboard

The "Audit & Stats" tab counts appointments based on their **latest audit action**:

- **Total Processed** = Unique appointments with any audit log
- **Accepted** = Latest action is "ACCEPTED" (status: CONFIRMED)
- **Rejected** = Latest action is "REJECTED"
- **Rescheduled** = Latest action is "RESCHEDULED"
- **Completed** = Latest action is "COMPLETED"

**Important:** If you reschedule an appointment that was previously accepted, it will count as "Rescheduled", not "Accepted" (because we only count the latest action per appointment).

---

## Typical Workflow

1. **Patient books appointment** → Status: `PENDING`
2. **Officer reviews and accepts** → Status: `CONFIRMED` (audit: ACCEPTED)
   - Use: `PATCH /admin/appointments/:id/status` with `{ status: "confirmed" }`
3. **If date needs to change** → Status: `RESCHEDULED` (audit: RESCHEDULED)
   - Use: `PATCH /admin/appointments/:id/reschedule`
4. **After the appointment** → Status: `COMPLETED` (audit: COMPLETED)
   - Use: `PATCH /admin/appointments/:id/status` with `{ status: "completed" }` (or doctor endpoint)

---

## Fixing Incorrect Data

If you accidentally set status to CONFIRMED when you meant to reschedule:

1. Check audit logs: `GET /audit/appointments/:id`
2. If there's an "ACCEPTED" audit log that shouldn't be there, the statistics will include it
3. The fix we implemented now counts only the **latest** audit action per appointment, so rescheduling after accepting will show as "Rescheduled" in stats

## Database Cleanup

If you have appointments with CONFIRMED status from seed data or incorrect usage:

```sql
-- Find appointments with CONFIRMED status but no corresponding audit log
SELECT a.id, a."patientName", a.status, a."appointmentDate"
FROM appointments a
LEFT JOIN audit_logs al ON a.id = al."appointmentId"
WHERE a.status = 'confirmed'
  AND al.id IS NULL;

-- Reset them to PENDING if needed
UPDATE appointments
SET status = 'pending'
WHERE id = 'appointment-id-here';
```
