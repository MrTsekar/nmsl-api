import { DataSource } from 'typeorm';

/**
 * Database seeding function
 * 
 * NO SEED DATA - All data should be added manually through:
 * - Admin portal UI
 * - Manual scripts in src/scripts/ (e.g., create-admin.ts, add-test-users.ts)
 * - Direct database operations
 * 
 * This function is kept for compatibility with the seeding infrastructure
 * but performs no operations.
 */
export async function seedDatabase(dataSource: DataSource) {
  console.log('?? Database seeding skipped - no seed data configured');
  console.log('??  Add users, doctors, and other data manually through:');
  console.log('   � Admin portal UI');
  console.log('   � Scripts: npm run ts-node src/scripts/create-admin.ts');
  console.log('   � Scripts: npm run ts-node src/scripts/add-test-users.ts');
  console.log('? Database ready - no seed data created');
}
