import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Cleanup script - Delete all users and create one clean admin
 * Run with: ts-node src/scripts/cleanup-users.ts
 */
async function cleanupUsers() {
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

    // Get current user count
    const currentUsers = await dataSource.query(`SELECT COUNT(*) FROM users`);
    console.log(`📊 Current users in database: ${currentUsers[0].count}`);

    // Delete all users
    console.log('\n🗑️  Deleting all users...');
    await dataSource.query(`DELETE FROM users`);
    console.log('✅ All users deleted');

    // Create single admin user
    console.log('\n🔐 Creating new admin user...');
    const hashedPassword = await bcrypt.hash('Admin@123456', 10);

    await dataSource.query(
      `INSERT INTO users (
        name, email, password, role, location, state, 
        phone, gender, "isActive", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())`,
      [
        'NMSL System Admin',
        'admin@nmsl.app',
        hashedPassword,
        'admin',
        'Abuja',
        'FCT',
        '+234 800 000 0000',
        'male',
        true,
      ]
    );

    console.log('✅ Admin user created successfully!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:    admin@nmsl.app');
    console.log('🔑 Password: Admin@123456');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n✨ Database cleanup complete!\n');

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

cleanupUsers();
