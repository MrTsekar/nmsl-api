import { MigrationInterface, QueryRunner } from 'typeorm';

export class CleanupAppointmentNotifications1776005000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Delete all appointment-related notifications (no longer needed)
    await queryRunner.query(`
      DELETE FROM notifications 
      WHERE type IN (
        'appointment_confirmed',
        'appointment_cancelled',
        'appointment_rescheduled',
        'appointment_conflict'
      )
    `);

    // Drop the old enum type
    await queryRunner.query(`ALTER TABLE notifications ALTER COLUMN type TYPE VARCHAR`);
    await queryRunner.query(`DROP TYPE IF EXISTS "notifications_type_enum"`);

    // Create new enum with updated values
    await queryRunner.query(`
      CREATE TYPE "notifications_type_enum" AS ENUM (
        'password_changed',
        'email_changed',
        'account_security',
        'new_prescription',
        'new_result',
        'service_added',
        'service_updated',
        'service_deleted',
        'board_member_added',
        'board_member_removed',
        'contact_form_submitted',
        'new_message'
      )
    `);

    // Convert column back to enum
    await queryRunner.query(`
      ALTER TABLE notifications 
      ALTER COLUMN type TYPE "notifications_type_enum" 
      USING type::text::"notifications_type_enum"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert to old enum (including appointment types)
    await queryRunner.query(`ALTER TABLE notifications ALTER COLUMN type TYPE VARCHAR`);
    await queryRunner.query(`DROP TYPE IF EXISTS "notifications_type_enum"`);

    await queryRunner.query(`
      CREATE TYPE "notifications_type_enum" AS ENUM (
        'appointment_confirmed',
        'appointment_rescheduled',
        'appointment_cancelled',
        'appointment_conflict',
        'new_message',
        'new_prescription',
        'new_result',
        'password_changed',
        'email_changed',
        'account_security',
        'service_added',
        'service_updated',
        'service_deleted',
        'board_member_added',
        'board_member_removed',
        'contact_form_submitted'
      )
    `);

    await queryRunner.query(`
      ALTER TABLE notifications 
      ALTER COLUMN type TYPE "notifications_type_enum" 
      USING type::text::"notifications_type_enum"
    `);
  }
}
