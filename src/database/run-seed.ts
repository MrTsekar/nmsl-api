import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { seedDatabase } from './seed';

// Load environment variables
dotenv.config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  username: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || '',
  database: process.env.DATABASE_NAME || 'nmsl_healthcare',
  ssl: process.env.DATABASE_SSL === 'true' 
    ? { rejectUnauthorized: false } 
    : false,
  entities: ['src/**/*.entity.ts'],
  synchronize: false,
});

async function runSeed() {
  try {
    console.log('📦 Initializing database connection...');
    await AppDataSource.initialize();
    console.log('✅ Database connected');

    await seedDatabase(AppDataSource);

    await AppDataSource.destroy();
    console.log('👋 Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

runSeed();
