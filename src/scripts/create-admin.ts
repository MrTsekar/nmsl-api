import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Standalone script to create an admin user
 * Run with: ts-node src/scripts/create-admin.ts
 */
async function createAdmin() {
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

    // Check if users table exists
    const queryRunner = dataSource.createQueryRunner();
    const hasUsersTable = await queryRunner.hasTable('users');

    if (!hasUsersTable) {
      console.log('\n⚠️  Users table does not exist!');
      console.log('📝 Please run migrations first:');
      console.log('   npm run migration:run');
      await dataSource.destroy();
      return;
    }

    // Check if admin already exists
    const existingAdmin = await dataSource.query(
      `SELECT * FROM users WHERE email = $1`,
      ['admin@nmsl.app']
    );

    if (existingAdmin.length > 0) {
      console.log('\n⚠️  Admin user already exists!');
      console.log('📧 Email: admin@nmsl.app');
      console.log('');
      console.log('To reset password, use the forgot-password endpoint');
      await dataSource.destroy();
      return;
    }

    // Create admin user
    console.log('\n🔐 Creating admin user...');
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

createAdmin();
