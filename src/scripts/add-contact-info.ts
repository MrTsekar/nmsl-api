import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Add contact information to production database
 * Run with: ts-node src/scripts/add-contact-info.ts
 */
async function addContactInfo() {
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

    // Check if contact info already exists
    const existing = await dataSource.query(`SELECT COUNT(*) FROM contact_info`);
    
    if (existing[0].count > 0) {
      console.log('\n⚠️  Contact information already exists!');
      await dataSource.destroy();
      return;
    }

    // Insert contact information
    console.log('\n📞 Creating contact information...');
    await dataSource.query(
      `INSERT INTO contact_info (
        phone, "emailPrimary", "emailSecondary", 
        "addressLine1", "addressLine2", city, country,
        "officeHours", "emergencyHours", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
      [
        '+234 903 193 0032',
        'nmshutako@nnpcgroup.com',
        'nmshutako@gmail.com',
        'PLOT 201 NGOZI OKONJO-IWEALA WAY',
        'UTAKO, ABUJA, NIGERIA',
        'Abuja',
        'Nigeria',
        'Monday - Sunday: 24 Hours',
        'Available 24/7',
      ]
    );

    console.log('✅ Contact information created successfully!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📞 Phone: +234 903 193 0032');
    console.log('📧 Email: nmshutako@nnpcgroup.com');
    console.log('📍 Address: PLOT 201 NGOZI OKONJO-IWEALA WAY, UTAKO, ABUJA');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

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

addContactInfo();
