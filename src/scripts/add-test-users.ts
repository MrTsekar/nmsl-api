import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Add a few test admin users for frontend testing
 * Run with: ts-node src/scripts/add-test-users.ts
 */
async function addTestUsers() {
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

    const hashedPassword = await bcrypt.hash('Admin@123456', 10);

    const testUsers = [
      {
        name: 'Admin Lagos',
        email: 'admin.lagos@nmsl.app',
        location: 'Lagos',
        state: 'Lagos',
        phone: '+234 801 111 1111',
      },
      {
        name: 'Admin Abuja',
        email: 'admin.abuja@nmsl.app',
        location: 'Abuja',
        state: 'FCT',
        phone: '+234 802 222 2222',
      },
    ];

    console.log('\n👥 Creating test admin users...');
    
    for (const user of testUsers) {
      await dataSource.query(
        `INSERT INTO users (
          name, email, password, role, location, state, 
          phone, gender, "isActive", "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())`,
        [
          user.name,
          user.email,
          hashedPassword,
          'admin',
          user.location,
          user.state,
          user.phone,
          'male',
          true,
        ]
      );
      console.log(`  ✅ Created: ${user.email}`);
    }

    console.log('\n✨ Test users created successfully!\n');
    console.log('All users have password: Admin@123456\n');

    await dataSource.destroy();
    console.log('👋 Disconnected from database');
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

addTestUsers();
