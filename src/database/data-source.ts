import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * TypeORM Data Source configuration for migrations
 * Used by migration:run, migration:generate, and migration:revert commands
 */
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
  entities: ['dist/modules/**/entities/*.entity.js'],
  migrations: ['dist/database/migrations/*.js'],
  synchronize: false, // NEVER use synchronize in production!
  logging: process.env.NODE_ENV !== 'production',
});

export default AppDataSource;
