import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateTestimonialSchema1775900000000 implements MigrationInterface {
    name = 'UpdateTestimonialSchema1775900000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Step 1: Add temporary columns for migration
        await queryRunner.query(`
            ALTER TABLE "testimonials" 
            ADD COLUMN IF NOT EXISTS "patientCategory_temp" TEXT,
            ADD COLUMN IF NOT EXISTS "serviceType_temp" TEXT
        `);

        // Step 2: Copy data from old columns to temp columns
        await queryRunner.query(`
            UPDATE "testimonials" 
            SET "patientCategory_temp" = "category"::text,
                "serviceType_temp" = "serviceType"::text
        `);

        // Step 3: Drop old columns and enums
        await queryRunner.query(`
            ALTER TABLE "testimonials" 
            DROP COLUMN "category",
            DROP COLUMN "serviceType"
        `);

        await queryRunner.query(`
            DROP TYPE IF EXISTS "testimonials_category_enum" CASCADE
        `);

        await queryRunner.query(`
            DROP TYPE IF EXISTS "testimonials_servicetype_enum" CASCADE
        `);

        // Step 4: Create new enums
        await queryRunner.query(`
            CREATE TYPE "testimonials_patientcategory_enum" AS ENUM('Staff', 'Retiree', 'Dependent')
        `);

        await queryRunner.query(`
            CREATE TYPE "testimonials_servicetype_enum" AS ENUM('Physical Appointment', 'Telemedicine')
        `);

        // Step 5: Add new columns with proper types
        await queryRunner.query(`
            ALTER TABLE "testimonials" 
            ADD COLUMN "patientCategory" "testimonials_patientcategory_enum",
            ADD COLUMN "serviceType" "testimonials_servicetype_enum"
        `);

        // Step 6: Migrate data with transformation
        await queryRunner.query(`
            UPDATE "testimonials" 
            SET "patientCategory" = (
                CASE 
                    WHEN "patientCategory_temp" = 'staff' THEN 'Staff'::"testimonials_patientcategory_enum"
                    WHEN "patientCategory_temp" = 'dependent' THEN 'Dependent'::"testimonials_patientcategory_enum"
                    WHEN "patientCategory_temp" = 'patient' THEN 'Dependent'::"testimonials_patientcategory_enum"
                    ELSE 'Dependent'::"testimonials_patientcategory_enum"
                END
            ),
            "serviceType" = (
                CASE 
                    WHEN "serviceType_temp" = 'physical_appointment' THEN 'Physical Appointment'::"testimonials_servicetype_enum"
                    WHEN "serviceType_temp" = 'telemedicine' THEN 'Telemedicine'::"testimonials_servicetype_enum"
                    ELSE 'Physical Appointment'::"testimonials_servicetype_enum"
                END
            )
        `);

        // Step 7: Make columns non-nullable
        await queryRunner.query(`
            ALTER TABLE "testimonials" 
            ALTER COLUMN "patientCategory" SET NOT NULL,
            ALTER COLUMN "serviceType" SET NOT NULL
        `);

        // Step 8: Drop temporary columns
        await queryRunner.query(`
            ALTER TABLE "testimonials" 
            DROP COLUMN "patientCategory_temp",
            DROP COLUMN "serviceType_temp"
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
            USING (
                CASE 
                    WHEN "category"::text = 'Staff' THEN 'staff'::"testimonials_category_enum"
                    WHEN "category"::text = 'Dependent' THEN 'dependent'::"testimonials_category_enum"
                    WHEN "category"::text = 'Retiree' THEN 'patient'::"testimonials_category_enum"
                    ELSE 'patient'::"testimonials_category_enum"
                END
            )
        `);

        await queryRunner.query(`
            ALTER TABLE "testimonials" 
            ALTER COLUMN "serviceType" TYPE "testimonials_servicetype_enum" 
            USING (
                CASE 
                    WHEN "serviceType"::text = 'Physical Appointment' THEN 'physical_appointment'::"testimonials_servicetype_enum"
                    WHEN "serviceType"::text = 'Telemedicine' THEN 'telemedicine'::"testimonials_servicetype_enum"
                    ELSE 'physical_appointment'::"testimonials_servicetype_enum"
                END
            )
        `);
    }
}
