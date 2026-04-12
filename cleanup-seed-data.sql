-- ================================================================
-- CLEANUP SEED DATA FROM DATABASE
-- Run this to remove all test/demo data created by seed script
-- ================================================================

-- WARNING: This will DELETE data. Backup your database first if needed!
-- Run this in your Neon database console or via psql

BEGIN;

-- 1. Delete seed appointments (already done, but just in case)
DELETE FROM appointments 
WHERE "patientEmail" IN ('john.doe@email.com', 'jane.smith@email.com');

-- 2. Delete seed patients
DELETE FROM users 
WHERE email IN ('john.doe@email.com', 'jane.smith@email.com')
  AND role = 'patient';

-- 3. Delete seed doctors
DELETE FROM users 
WHERE email LIKE '%@nmsl.app' 
  AND role = 'doctor';

-- Delete doctor_availability for seed doctors (cascade should handle this, but just in case)
DELETE FROM doctor_availability 
WHERE "doctorId" NOT IN (SELECT id FROM users WHERE role = 'doctor');

-- 4. Delete seed appointment officers
DELETE FROM users 
WHERE email IN ('officer1@nmsl.app', 'officer2@nmsl.app', 'officer@nmsl.app')
  AND role = 'appointment_officer';

-- Also delete any appointment officers you created manually that you don't want
DELETE FROM users 
WHERE email IN (
  'gogaelisabeth21@gmail.com',
  'mr.tsekar01@gmail.com'
)
AND role = 'appointment_officer';

-- 5. Delete seed admin (CAREFUL - keep your real admin!)
-- Only delete if you have another admin account
-- DELETE FROM users 
-- WHERE email = 'admin@nmsl.app' AND role = 'admin';

-- 6. Delete seed board members
DELETE FROM board_members 
WHERE name IN (
  'Mr. Adedapo A. Segun',
  'Dr. Chioma Eze',
  'Mr. Ibrahim Musa'
);

-- 7. Delete seed partners
DELETE FROM partners 
WHERE name IN (
  'African Medical Centre of Excellence Abuja',
  'Lagos University Teaching Hospital',
  'National Hospital Abuja'
);

-- 8. Delete seed contact info
DELETE FROM contact_info 
WHERE phone = '+234 903 193 0032';

-- 9. Delete seed statistics
DELETE FROM statistics 
WHERE value IN ('15+', '6', '250K+', '24/7');

-- 10. Delete seed services
DELETE FROM services 
WHERE name IN (
  'Accident & Emergency',
  'General Practice',
  'Specialized Cardiology Care'
);

-- 11. Delete all audit logs (if you want to start fresh)
-- TRUNCATE audit_logs CASCADE;

COMMIT;

-- ================================================================
-- VERIFICATION QUERIES - Run these to check what's left
-- ================================================================

-- Check remaining users by role
SELECT role, COUNT(*) as count 
FROM users 
GROUP BY role;

-- Check remaining doctors
SELECT name, email, specialty, location 
FROM users 
WHERE role = 'doctor';

-- Check remaining appointment officers
SELECT name, email, location 
FROM users 
WHERE role = 'appointment_officer';

-- Check remaining admins
SELECT name, email 
FROM users 
WHERE role = 'admin';

-- Check remaining patients
SELECT name, email 
FROM users 
WHERE role = 'patient';

-- Check services
SELECT COUNT(*) as service_count FROM services;

-- Check partners
SELECT COUNT(*) as partner_count FROM partners;

-- Check board members
SELECT COUNT(*) as board_member_count FROM board_members;

-- Check statistics
SELECT COUNT(*) as statistic_count FROM statistics;

-- Check contact info
SELECT COUNT(*) as contact_count FROM contact_info;
