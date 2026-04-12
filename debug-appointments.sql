-- Debug script to check appointment statuses vs audit logs

-- Check all appointments and their statuses
SELECT id, "patientName", status, "appointmentDate", "appointmentTime", "createdAt"
FROM appointments
ORDER BY "createdAt" DESC;

-- Check all audit logs
SELECT id, "appointmentId", "patientName", action, "performedBy", "performedByName", "performedAt", details
FROM audit_logs
ORDER BY "performedAt" DESC;

-- Count appointments by status
SELECT status, COUNT(*) as count
FROM appointments
GROUP BY status;

-- Count audit logs by action
SELECT action, COUNT(*) as count
FROM audit_logs
GROUP BY action;

-- Find mismatches: appointments with status='rescheduled' but have 'accepted' audit logs
SELECT 
    a.id,
    a."patientName",
    a.status as appointment_status,
    al.action as audit_action,
    al."performedAt",
    al."performedBy"
FROM appointments a
LEFT JOIN audit_logs al ON a.id = al."appointmentId"
WHERE a.status != 'confirmed' AND al.action = 'accepted'
ORDER BY al."performedAt" DESC;
