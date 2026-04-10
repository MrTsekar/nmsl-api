import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Create appointment officer user
 * Run with: ts-node src/scripts/create-appointment-officer.ts
 */
async function createAppointmentOfficer() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    username: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
    entities: ['src/modules/**/entities/*.entity.ts'],
  });

  try {
    console.log('📡 Connecting to database...');
    await dataSource.initialize();
    console.log('✅ Connected to database');

    // Check if appointment officer already exists
    const existingOfficer = await dataSource.query(
      `SELECT * FROM users WHERE email = $1`,
      ['officer@nmsl.app']
    );

    if (existingOfficer.length > 0) {
      console.log('\n⚠️  Appointment officer already exists!');
      console.log('📧 Email: officer@nmsl.app');
      await dataSource.destroy();
      return;
    }

    // Create appointment officer
    console.log('\n👮 Creating appointment officer...');
    const hashedPassword = await bcrypt.hash('Officer@123456', 10);

    await dataSource.query(
      `INSERT INTO users (
        name, email, password, role, location, state, 
        phone, gender, "isActive", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())`,
      [
        'NMSL Appointment Officer',
        'officer@nmsl.app',
        hashedPassword,
        'appointment_officer',
        'Abuja',
        'FCT',
        '+234 801 111 1111',
        'male',
        true,
      ]
    );

    console.log('✅ Appointment officer created successfully!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:    officer@nmsl.app');
    console.log('🔑 Password: Officer@123456');
    console.log('👮 Role:     Appointment Officer');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n⚠️  IMPORTANT: Change this password after first login!\n');

    await dataSource.destroy();
    console.log('👋 Disconnected from database');
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.code) {
      console.error('Error Code:', error.code);
    }
    process.exit(1);
  }
}

createAppointmentOfficer();
