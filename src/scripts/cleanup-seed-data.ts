import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { User } from '../modules/users/entities/user.entity';

dotenv.config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
  entities: ['src/**/*.entity.ts'],
  synchronize: false,
});

async function cleanupSeedData() {
  try {
    console.log('📦 Connecting to database...');
    await AppDataSource.initialize();
    console.log('✅ Connected to database');

    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      console.log('\n🧹 Starting cleanup of seed data...\n');

      // 1. Delete seed appointments
      console.log('🗑️  Deleting seed appointments...');
      const deletedAppointments = await queryRunner.query(`
        DELETE FROM appointments 
        WHERE "patientEmail" IN ('john.doe@email.com', 'jane.smith@email.com')
      `);
      console.log(`   Deleted ${deletedAppointments[1]} appointments`);

      // 2. Delete seed patients
      console.log('🗑️  Deleting seed patients...');
      const deletedPatients = await queryRunner.query(`
        DELETE FROM users 
        WHERE email IN ('john.doe@email.com', 'jane.smith@email.com')
          AND role = 'patient'
      `);
      console.log(`   Deleted ${deletedPatients[1]} patients`);

      // 3. Delete seed doctors
      console.log('🗑️  Deleting seed doctors...');
      const doctorEmails = [
        'muhammad.ibrahim@nmsl.app',
        'sarah.adeyemi@nmsl.app',
        'grace.okonkwo@nmsl.app',
        'james.oluwole@nmsl.app',
        'ahmed.bello@nmsl.app',
        'chioma.nwosu@nmsl.app',
        'tunde.bakare@nmsl.app',
        'amina.yusuf@nmsl.app',
        'emeka.obi@nmsl.app',
        'fatima.lawal@nmsl.app',
        'chidi.okafor@nmsl.app',
        'blessing.eze@nmsl.app',
        'yusuf.mohammed@nmsl.app',
        'jennifer.afolabi@nmsl.app',
      ];
      
      const deletedDoctors = await queryRunner.query(
        `DELETE FROM users WHERE email = ANY($1) AND role = 'doctor'`,
        [doctorEmails]
      );
      console.log(`   Deleted ${deletedDoctors[1]} doctors`);

      // 4. Delete seed appointment officers
      console.log('🗑️  Deleting seed appointment officers...');
      const deletedOfficers = await queryRunner.query(`
        DELETE FROM users 
        WHERE email IN ('officer1@nmsl.app', 'officer2@nmsl.app', 'officer@nmsl.app')
          AND role = 'appointment_officer'
      `);
      console.log(`   Deleted ${deletedOfficers[1]} appointment officers`);

      // 5. Delete seed board members
      console.log('🗑️  Deleting seed board members...');
      const deletedBoardMembers = await queryRunner.query(`
        DELETE FROM board_members 
        WHERE name IN (
          'Mr. Adedapo A. Segun',
          'Dr. Chioma Eze',
          'Mr. Ibrahim Musa'
        )
      `);
      console.log(`   Deleted ${deletedBoardMembers[1]} board members`);

      // 6. Delete seed partners
      console.log('🗑️  Deleting seed partners...');
      const deletedPartners = await queryRunner.query(`
        DELETE FROM partners 
        WHERE name IN (
          'African Medical Centre of Excellence Abuja',
          'Lagos University Teaching Hospital',
          'National Hospital Abuja'
        )
      `);
      console.log(`   Deleted ${deletedPartners[1]} partners`);

      // 7. Delete seed contact info
      console.log('🗑️  Deleting seed contact info...');
      const deletedContact = await queryRunner.query(`
        DELETE FROM contact_info 
        WHERE phone = '+234 903 193 0032'
      `);
      console.log(`   Deleted ${deletedContact[1]} contact entries`);

      // 8. Delete seed statistics
      console.log('🗑️  Deleting seed statistics...');
      const deletedStats = await queryRunner.query(`
        DELETE FROM statistics 
        WHERE value IN ('15+', '6', '250K+', '24/7')
      `);
      console.log(`   Deleted ${deletedStats[1]} statistics`);

      // 9. Delete seed services
      console.log('🗑️  Deleting seed services...');
      const deletedServices = await queryRunner.query(`
        DELETE FROM services 
        WHERE name IN (
          'Accident & Emergency',
          'General Practice',
          'Specialized Cardiology Care'
        )
      `);
      console.log(`   Deleted ${deletedServices[1]} services`);

      await queryRunner.commitTransaction();
      console.log('\n✅ All seed data cleaned up successfully!');

      // Show what's left
      console.log('\n📊 Remaining data in database:');
      const userCounts = await queryRunner.query(`
        SELECT role, COUNT(*) as count 
        FROM users 
        GROUP BY role
      `);
      console.log('   Users by role:');
      userCounts.forEach((row: any) => {
        console.log(`      ${row.role}: ${row.count}`);
      });

      const serviceCounts = await queryRunner.query(`SELECT COUNT(*) as count FROM services`);
      console.log(`   Services: ${serviceCounts[0].count}`);

      const partnerCounts = await queryRunner.query(`SELECT COUNT(*) as count FROM partners`);
      console.log(`   Partners: ${partnerCounts[0].count}`);

      const boardCounts = await queryRunner.query(`SELECT COUNT(*) as count FROM board_members`);
      console.log(`   Board Members: ${boardCounts[0].count}`);

    } catch (err) {
      console.error('❌ Error during cleanup, rolling back...');
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }

    console.log('\n🎉 Cleanup completed!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Failed to cleanup seed data:', error);
    process.exit(1);
  }
}

cleanupSeedData();
