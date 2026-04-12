import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateDoctorSpecialtyEnum1776009871441 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // First, update existing doctors with obsolete specialties to values that exist in current enum
        await queryRunner.query(`
            UPDATE "doctors" 
            SET specialty = 'General Practice' 
            WHERE specialty = 'Physiotherapy' OR specialty = 'Surgery'
        `);

        // Create new enum type with all 14 specialties
        await queryRunner.query(`
            CREATE TYPE doctors_specialty_enum_new AS ENUM (
                'General Practice',
                'Cardiology',
                'Pediatrics',
                'Gynecology',
                'Orthopedics',
                'Dermatology',
                'Neurology',
                'Ophthalmology',
                'ENT',
                'Psychiatry',
                'Radiology',
                'Internal Medicine',
                'Dentistry',
                'Emergency Medicine'
            )
        `);

        // Convert column to use new enum
        await queryRunner.query(`
            ALTER TABLE "doctors" 
            ALTER COLUMN "specialty" TYPE doctors_specialty_enum_new 
            USING specialty::text::doctors_specialty_enum_new
        `);

        // Drop old enum
        await queryRunner.query(`DROP TYPE doctors_specialty_enum`);

        // Rename new enum to original name
        await queryRunner.query(`ALTER TYPE doctors_specialty_enum_new RENAME TO doctors_specialty_enum`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Recreate old enum
        await queryRunner.query(`
            CREATE TYPE doctors_specialty_enum_new AS ENUM (
                'General Practice',
                'Gynecology',
                'Physiotherapy',
                'Pediatrics',
                'Cardiology',
                'Dermatology',
                'Orthopedics',
                'Psychiatry',
                'Radiology',
                'Surgery'
            )
        `);

        // Convert column back
        await queryRunner.query(`
            ALTER TABLE "doctors" 
            ALTER COLUMN "specialty" TYPE doctors_specialty_enum_new 
            USING specialty::text::doctors_specialty_enum_new
        `);

        // Drop new enum
        await queryRunner.query(`DROP TYPE doctors_specialty_enum`);

        // Rename back
        await queryRunner.query(`ALTER TYPE doctors_specialty_enum_new RENAME TO doctors_specialty_enum`);
    }

}
