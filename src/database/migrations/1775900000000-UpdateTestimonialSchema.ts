import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateTestimonialSchema1775900000000 implements MigrationInterface {
    name = 'UpdateTestimonialSchema1775900000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Update enum values for serviceType
        await queryRunner.query(`
            DO $$ 
            BEGIN
                IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'testimonials_servicetype_enum') THEN
                    DROP TYPE "testimonials_servicetype_enum" CASCADE;
                END IF;
            END $$;
        `);
        
        await queryRunner.query(`
            CREATE TYPE "testimonials_servicetype_enum" AS ENUM('Physical Appointment', 'Telemedicine')
        `);

        // Update enum values for category/patientCategory
        await queryRunner.query(`
            DO $$ 
            BEGIN
                IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'testimonials_category_enum') THEN
                    DROP TYPE "testimonials_category_enum" CASCADE;
                END IF;
            END $$;
        `);

        await queryRunner.query(`
            CREATE TYPE "testimonials_patientcategory_enum" AS ENUM('Staff', 'Retiree', 'Dependent')
        `);

        // Rename column from category to patientCategory
        await queryRunner.query(`
            ALTER TABLE "testimonials" 
            RENAME COLUMN "category" TO "patientCategory"
        `);

        // Update the column type
        await queryRunner.query(`
            ALTER TABLE "testimonials" 
            ALTER COLUMN "patientCategory" TYPE "testimonials_patientcategory_enum" 
            USING ("patientCategory"::text::"testimonials_patientcategory_enum")
        `);

        await queryRunner.query(`
            ALTER TABLE "testimonials" 
            ALTER COLUMN "serviceType" TYPE "testimonials_servicetype_enum" 
            USING (
                CASE 
                    WHEN "serviceType"::text = 'physical_appointment' THEN 'Physical Appointment'::"testimonials_servicetype_enum"
                    WHEN "serviceType"::text = 'telemedicine' THEN 'Telemedicine'::"testimonials_servicetype_enum"
                    ELSE 'Physical Appointment'::"testimonials_servicetype_enum"
                END
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revert column name
        await queryRunner.query(`
            ALTER TABLE "testimonials" 
            RENAME COLUMN "patientCategory" TO "category"
        `);

        // Recreate old enums
        await queryRunner.query(`
            DROP TYPE "testimonials_servicetype_enum" CASCADE
        `);
        
        await queryRunner.query(`
            CREATE TYPE "testimonials_servicetype_enum" AS ENUM('physical_appointment', 'telemedicine', 'laboratory', 'pharmacy')
        `);

        await queryRunner.query(`
            DROP TYPE "testimonials_patientcategory_enum" CASCADE
        `);

        await queryRunner.query(`
            CREATE TYPE "testimonials_category_enum" AS ENUM('staff', 'dependent', 'patient')
        `);

        // Revert column types
        await queryRunner.query(`
            ALTER TABLE "testimonials" 
            ALTER COLUMN "category" TYPE "testimonials_category_enum" 
            USING ("category"::text::"testimonials_category_enum")
        `);

        await queryRunner.query(`
            ALTER TABLE "testimonials" 
            ALTER COLUMN "serviceType" TYPE "testimonials_servicetype_enum" 
            USING ("serviceType"::text::"testimonials_servicetype_enum")
        `);
    }
}
